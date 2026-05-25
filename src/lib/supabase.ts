import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Article, Comment } from "../types";
import { INITIAL_ARTICLES } from "../data";

let supabaseInstance: SupabaseClient | null = null;

// Initializer function to check if Supabase is configured
export function getSupabaseConfig() {
  const metaEnv = (import.meta as any).env || {};
  
  let url = localStorage.getItem("SAMACHAR_SUPABASE_URL") || metaEnv.VITE_SUPABASE_URL || "";
  let anonKey = localStorage.getItem("SAMACHAR_SUPABASE_ANON_KEY") || metaEnv.VITE_SUPABASE_ANON_KEY || "";
  
  // Clean surrounding quotes if any
  if (url.startsWith('"') && url.endsWith('"')) {
    url = url.slice(1, -1);
  } else if (url.startsWith("'") && url.endsWith("'")) {
    url = url.slice(1, -1);
  }
  
  if (anonKey.startsWith('"') && anonKey.endsWith('"')) {
    anonKey = anonKey.slice(1, -1);
  } else if (anonKey.startsWith("'") && anonKey.endsWith("'")) {
    anonKey = anonKey.slice(1, -1);
  }
  
  url = url.trim();
  anonKey = anonKey.trim();

  return {
    url,
    anonKey,
    isValid: !!url && !!anonKey && url.startsWith("https://")
  };
}

// Lazy initialization of Supabase client to prevent crashes if credentials are blank
export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const config = getSupabaseConfig();
  if (config.isValid) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      return supabaseInstance;
    } catch (e) {
      console.error("Failed to initialize Supabase client:", e);
      return null;
    }
  }
  return null;
}

// -------------------------------------------------------------
// UNIFIED SAMACHAR DATA CONTROLLER (SUPABASE + LOCAL STORAGE FALLBACK)
// -------------------------------------------------------------

// LocalStorage Helpers
const STORAGE_KEY = "samachar_plus_articles";
const COMMENTS_KEY = "samachar_plus_comments";

function getLocalArticles(): Article[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ARTICLES));
    return INITIAL_ARTICLES;
  }
  return JSON.parse(data);
}

function saveLocalArticles(articles: Article[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
}

function getLocalComments(): Comment[] {
  const data = localStorage.getItem(COMMENTS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocalComments(comments: Comment[]) {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
}

// Service API
// LocalStorage Bookmarks, Reactions, and Profiles Helpers
const BOOKMARKS_KEY = "samachar_plus_bookmarks";
const REACTIONS_KEY = "samachar_plus_reactions";
const PROFILES_KEY = "samachar_plus_profiles";

function getLocalBookmarks(): any[] {
  const data = localStorage.getItem(BOOKMARKS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocalBookmarks(bookmarks: any[]) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

function getLocalReactions(): any[] {
  const data = localStorage.getItem(REACTIONS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocalReactions(reactions: any[]) {
  localStorage.setItem(REACTIONS_KEY, JSON.stringify(reactions));
}

function getLocalProfiles(): any[] {
  const data = localStorage.getItem(PROFILES_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocalProfiles(profiles: any[]) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

// Service API
export const newsService = {
  /**
   * Fetches all articles from Supabase (or Local Storage if offline/unconfigured)
   * If showAll is false, it only returns published (or legacy null-status) articles.
   */
  async getArticles(category?: string, showAll = false, from?: number, to?: number): Promise<Article[]> {
    const supabase = getSupabase();
    
    if (supabase) {
      try {
        let query = supabase.from("articles").select("*");
        
        if (!showAll) {
          // Filter to show only published news, or legacy news where status is null/unspecified
          query = query.or("status.eq.published,status.is.null");
        }
        
        query = query.order("published_at", { ascending: false });
        
        if (category) {
          query = query.eq("category", category);
        }

        if (from !== undefined && to !== undefined) {
          query = query.range(from, to);
        }
        
        const { data, error } = await query;
        if (!error && data) {
          return data as Article[];
        }
        console.warn("Supabase query error, falling back to local storage:", error);
      } catch (err) {
        console.error("Supabase failed, falling back to local storage:", err);
      }
    }

    // Fallback Code
    let articles = getLocalArticles();
    if (!showAll) {
      articles = articles.filter((a) => !a.status || a.status === "published");
    }
    if (category) {
      articles = articles.filter((a) => a.category === category);
    }

    if (from !== undefined && to !== undefined) {
      return articles.slice(from, to + 1);
    }
    return articles;
  },

  /**
   * Fetch single article
   */
  async getArticleById(id: string): Promise<Article | null> {
    if (id === "preview") {
      const draft = localStorage.getItem("samachar_plus_preview_draft");
      return draft ? JSON.parse(draft) : null;
    }

    const supabase = getSupabase();

    if (supabase) {
      try {
        const { data, error } = await supabase.from("articles").select("*").eq("id", id).single();
        if (!error && data) return data as Article;
      } catch (e) {
        console.error("Supabase fetching single article failed, falling back", e);
      }
    }

    const localArticles = getLocalArticles();
    return localArticles.find((a) => a.id === id) || null;
  },

  /**
   * Create a new news content
   */
  async createArticle(newArticle: Omit<Article, "id" | "views">): Promise<Article> {
    const freshArticle: Article = {
      ...newArticle,
      id: "art-" + Date.now().toString(36),
      views: 0,
      likes_count: 0,
      status: newArticle.status || "published"
    };

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from("articles").insert([freshArticle]).select().single();
      if (error) {
        console.error("Supabase create failed:", error);
        throw new Error(`डेटाबेस एरर: ${error.message} (कृपया सुनिश्चित करें कि आपने SQL ब्लू प्रिंट तालिकाएं और RLS नीतियां Supabase में चला ली हैं)`);
      }
      if (data) {
        // Sync to local storage
        const local = getLocalArticles();
        saveLocalArticles([data as Article, ...local]);
        return data as Article;
      }
    }

    // Fallback Code (if Supabase is not configured)
    const articles = getLocalArticles();
    const updated = [freshArticle, ...articles];
    saveLocalArticles(updated);
    return freshArticle;
  },

  /**
   * Edit existing article
   */
  async updateArticle(id: string, updates: Partial<Article>): Promise<Article> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("articles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) {
        console.error("Supabase update failed:", error);
        throw new Error(`डेटाबेस अपडेट एरर: ${error.message}`);
      }
      if (data) {
        // Sync to local storage
        const local = getLocalArticles().map((a) => (a.id === id ? { ...a, ...data } : a));
        saveLocalArticles(local);
        return data as Article;
      }
    }

    // Fallback Code
    const articles = getLocalArticles();
    const targetIdx = articles.findIndex((a) => a.id === id);
    if (targetIdx === -1) throw new Error("Article not found");
    
    const updatedArticle = { ...articles[targetIdx], ...updates };
    articles[targetIdx] = updatedArticle;
    saveLocalArticles(articles);
    return updatedArticle;
  },

  /**
   * Delete an article
   */
  async deleteArticle(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) {
        console.error("Supabase delete failed:", error);
        throw new Error(`डेटाबेस डिलीट एरर: ${error.message}`);
      }
      // Sync to local storage
      const local = getLocalArticles().filter((a) => a.id !== id);
      saveLocalArticles(local);
      return true;
    }

    // Fallback Code
    const articles = getLocalArticles();
    const filtered = articles.filter((a) => a.id !== id);
    if (filtered.length === articles.length) return false;
    saveLocalArticles(filtered);
    return true;
  },

  /**
   * Safely registers view clicks
   */
  async incrementViews(id: string): Promise<void> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        // RPC or direct update
        const article = await this.getArticleById(id);
        if (article) {
          await supabase.from("articles").update({ views: (article.views || 0) + 1 }).eq("id", id);
        }
      } catch (e) {
        console.warn("Could not sync view count to Supabase:", e);
      }
    }

    const articles = getLocalArticles();
    const updated = articles.map((a) => (a.id === id ? { ...a, views: (a.views || 0) + 1 } : a));
    saveLocalArticles(updated);
  },

  /**
   * Seeds default news articles to the Supabase database if it is empty
   */
  async seedDefaultData(): Promise<{ success: boolean; count: number; message: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return {
        success: false,
        count: 0,
        message: "Supabase क्रेडेंशियल्स अनुपलब्ध हैं। कृपया कनेक्शन सेटिंग्स की जांच करें।"
      };
    }

    try {
      // 1. Fetch current articles count in Supabase
      const { data, error } = await supabase.from("articles").select("id");
      if (error) {
        throw new Error(error.message);
      }

      if (data && data.length > 0) {
        return {
          success: false,
          count: data.length,
          message: `डेटाबेस में पहले से ही ${data.length} समाचार मौजूद हैं। सेडिंग की आवश्यकता नहीं है।`
        };
      }

      // 2. Upload INITIAL_ARTICLES
      const { error: insertError } = await supabase.from("articles").insert(INITIAL_ARTICLES);
      if (insertError) {
        throw new Error(insertError.message);
      }

      // Sync to local storage too
      saveLocalArticles(INITIAL_ARTICLES);

      return {
        success: true,
        count: INITIAL_ARTICLES.length,
        message: `सफलतापूर्वक ${INITIAL_ARTICLES.length} समाचारों को Supabase क्लाउड डेटाबेस में अपलोड किया गया!`
      };
    } catch (e: any) {
      console.error("Database seeding failed:", e);
      return {
        success: false,
        count: 0,
        message: `सेडिंग विफल रही: ${e.message || e}`
      };
    }
  },

  // -------------------------------------------------------------
  // COMMENTS METHODS
  // -------------------------------------------------------------
  
  async getComments(articleId: string): Promise<Comment[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("comments")
          .select("*")
          .eq("article_id", articleId)
          .order("created_at", { ascending: true });
        if (!error && data) return data as Comment[];
      } catch (err) {
        console.error("Supabase fetch comments failed", err);
      }
    }
    const comments = getLocalComments();
    return comments.filter((c) => c.article_id === articleId);
  },

  async addComment(articleId: string, name: string, email: string, content: string): Promise<Comment> {
    const freshComment: Comment = {
      id: "com-" + Date.now().toString(36),
      article_id: articleId,
      author_name: name,
      author_email: email,
      content,
      created_at: new Date().toISOString()
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from("comments").insert([freshComment]).select().single();
        if (!error && data) {
          const local = getLocalComments();
          saveLocalComments([...local, data as Comment]);
          return data as Comment;
        }
      } catch (e) {
        console.error("Supabase add comment failed, writing locally", e);
      }
    }

    const comments = getLocalComments();
    const updated = [...comments, freshComment];
    saveLocalComments(updated);
    return freshComment;
  },

  async getAllComments(): Promise<(Comment & { article_title?: string })[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("comments")
          .select(`
            *,
            articles:article_id (title)
          `)
          .order("created_at", { ascending: false });
        if (!error && data) {
          return data.map((c: any) => ({
            ...c,
            article_title: c.articles?.title || "अज्ञात लेख"
          }));
        }
      } catch (err) {
        console.error("Supabase fetch all comments failed", err);
      }
    }
    const comments = getLocalComments();
    const articles = getLocalArticles();
    return comments.map((c) => {
      const art = articles.find((a) => a.id === c.article_id);
      return {
        ...c,
        article_title: art ? art.title : "अज्ञात लेख"
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async deleteComment(id: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from("comments").delete().eq("id", id);
        if (!error) {
          const local = getLocalComments().filter((c) => c.id !== id);
          saveLocalComments(local);
          return true;
        }
      } catch (err) {
        console.error("Supabase delete comment failed", err);
      }
    }
    const local = getLocalComments();
    const filtered = local.filter((c) => c.id !== id);
    if (filtered.length === local.length) return false;
    saveLocalComments(filtered);
    return true;
  },

  // -------------------------------------------------------------
  // USER PROFILES & ROLES
  // -------------------------------------------------------------
  
  async getProfile(userId: string): Promise<any | null> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
        if (!error && data) return data;
      } catch (e) {
        console.error("Failed to fetch Supabase user profile:", e);
      }
    }
    
    const local = getLocalProfiles();
    return local.find((p) => p.id === userId) || null;
  },

  async createOrUpdateProfile(profile: any): Promise<any> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from("profiles").upsert([profile]).select().single();
        if (!error && data) {
          const local = getLocalProfiles().filter((p) => p.id !== profile.id);
          saveLocalProfiles([...local, data]);
          return data;
        }
      } catch (e) {
        console.error("Failed to save Supabase profile:", e);
      }
    }
    
    const local = getLocalProfiles().filter((p) => p.id !== profile.id);
    saveLocalProfiles([...local, profile]);
    return profile;
  },

  // -------------------------------------------------------------
  // BOOKMARKS (Read Later)
  // -------------------------------------------------------------
  
  async getBookmarks(userId: string): Promise<string[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from("bookmarks").select("article_id").eq("user_id", userId);
        if (!error && data) {
          return data.map((b: any) => b.article_id);
        }
      } catch (e) {
        console.error("Failed to fetch bookmarks:", e);
      }
    }
    
    const local = getLocalBookmarks();
    return local.filter((b) => b.user_id === userId).map((b) => b.article_id);
  },

  async addBookmark(userId: string, articleId: string): Promise<boolean> {
    const freshBookmark = {
      id: "bm-" + Date.now().toString(36),
      user_id: userId,
      article_id: articleId,
      created_at: new Date().toISOString()
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from("bookmarks").insert([freshBookmark]);
        if (!error) {
          const local = getLocalBookmarks();
          saveLocalBookmarks([...local, freshBookmark]);
          return true;
        }
      } catch (e) {
        console.error("Failed to add bookmark to Supabase:", e);
      }
    }
    
    const local = getLocalBookmarks();
    saveLocalBookmarks([...local, freshBookmark]);
    return true;
  },

  async removeBookmark(userId: string, articleId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from("bookmarks").delete().eq("user_id", userId).eq("article_id", articleId);
        if (!error) {
          const local = getLocalBookmarks().filter((b) => !(b.user_id === userId && b.article_id === articleId));
          saveLocalBookmarks(local);
          return true;
        }
      } catch (e) {
        console.error("Failed to delete bookmark in Supabase:", e);
      }
    }
    
    const local = getLocalBookmarks().filter((b) => !(b.user_id === userId && b.article_id === articleId));
    saveLocalBookmarks(local);
    return true;
  },

  // -------------------------------------------------------------
  // EMOTIONAL REACTIONS
  // -------------------------------------------------------------
  
  async getReactions(articleId: string): Promise<{ [key: string]: number }> {
    const supabase = getSupabase();
    const result: { [key: string]: number } = { like: 0, love: 0, wow: 0, sad: 0 };

    if (supabase) {
      try {
        const { data, error } = await supabase.from("reactions").select("emoji_type").eq("article_id", articleId);
        if (!error && data) {
          data.forEach((r: any) => {
            if (result[r.emoji_type] !== undefined) {
              result[r.emoji_type]++;
            }
          });
          return result;
        }
      } catch (e) {
        console.error("Failed to fetch reactions:", e);
      }
    }
    
    const local = getLocalReactions().filter((r) => r.article_id === articleId);
    local.forEach((r) => {
      if (result[r.emoji_type] !== undefined) {
        result[r.emoji_type]++;
      }
    });
    return result;
  },

  async addOrUpdateReaction(userId: string, articleId: string, emojiType: 'like' | 'love' | 'wow' | 'sad'): Promise<boolean> {
    const reaction = {
      user_id: userId,
      article_id: articleId,
      emoji_type: emojiType,
      created_at: new Date().toISOString()
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        // Upsert to reaction table (enforces unique (user_id, article_id))
        const { error } = await supabase.from("reactions").upsert([reaction], { onConflict: "user_id,article_id" });
        if (!error) {
          const local = getLocalReactions().filter((r) => !(r.user_id === userId && r.article_id === articleId));
          saveLocalReactions([...local, reaction]);
          return true;
        }
      } catch (e) {
        console.error("Failed to save reaction to Supabase:", e);
      }
    }
    
    const local = getLocalReactions().filter((r) => !(r.user_id === userId && r.article_id === articleId));
    saveLocalReactions([...local, reaction]);
    return true;
  },

  // -------------------------------------------------------------
  // NEWSLETTER SUBSCRIBERS
  // -------------------------------------------------------------
  
  async subscribeNewsletter(email: string): Promise<boolean> {
    const freshSubscriber = {
      email: email.trim().toLowerCase(),
      created_at: new Date().toISOString()
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from("subscribers").insert([freshSubscriber]);
        if (!error) return true;
      } catch (e) {
        console.error("Failed to subscribe email in Supabase:", e);
      }
    }
    
    // Fallback: save to custom key
    const current = localStorage.getItem("samachar_plus_subscribers");
    const emails = current ? JSON.parse(current) : [];
    if (!emails.includes(freshSubscriber.email)) {
      emails.push(freshSubscriber.email);
      localStorage.setItem("samachar_plus_subscribers", JSON.stringify(emails));
    }
    return true;
  },

  // -------------------------------------------------------------
  // SITE SETTINGS (saved to Supabase site_settings table, localStorage fallback)
  // -------------------------------------------------------------

  async saveSiteSettings(settings: { site_title: string; site_tagline: string; marquee_text: string; web_stories?: any[] }): Promise<boolean> {
    // Always keep localStorage in sync as instant cache
    localStorage.setItem("sp_site_title", settings.site_title);
    localStorage.setItem("sp_site_tagline", settings.site_tagline);
    localStorage.setItem("sp_site_marquee", settings.marquee_text);
    if (settings.web_stories !== undefined) {
      localStorage.setItem("sp_web_stories", JSON.stringify(settings.web_stories));
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase
          .from("site_settings")
          .upsert([{ id: "global", ...settings, updated_at: new Date().toISOString() }], { onConflict: "id" });
        if (!error) return true;
        console.warn("site_settings upsert error (using localStorage fallback):", error.message);
      } catch (e) {
        console.warn("Supabase site_settings save failed (using localStorage fallback):", e);
      }
    }
    return false; // Supabase unavailable — localStorage already updated above
  },

  async getSiteSettings(): Promise<{ site_title: string; site_tagline: string; marquee_text: string; web_stories?: any[] }> {
    const defaults = {
      site_title: localStorage.getItem("sp_site_title") || "समाचार प्लस",
      site_tagline: localStorage.getItem("sp_site_tagline") || "Samachar Plus",
      marquee_text: localStorage.getItem("sp_site_marquee") || "स्वागत है - समाचार प्लस पर!",
      web_stories: JSON.parse(localStorage.getItem("sp_web_stories") || "null") || undefined,
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("*")
          .eq("id", "global")
          .single();
        if (!error && data) {
          // Sync fetched values back to localStorage for offline use
          localStorage.setItem("sp_site_title", data.site_title || defaults.site_title);
          localStorage.setItem("sp_site_tagline", data.site_tagline || defaults.site_tagline);
          localStorage.setItem("sp_site_marquee", data.marquee_text || defaults.marquee_text);
          if (data.web_stories) localStorage.setItem("sp_web_stories", JSON.stringify(data.web_stories));
          return {
            site_title: data.site_title || defaults.site_title,
            site_tagline: data.site_tagline || defaults.site_tagline,
            marquee_text: data.marquee_text || defaults.marquee_text,
            web_stories: data.web_stories || defaults.web_stories,
          };
        }
      } catch (e) {
        console.warn("Supabase site_settings fetch failed (using localStorage fallback):", e);
      }
    }
    return defaults;
  }
};

