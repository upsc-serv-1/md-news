import React, { useState, useEffect, useRef } from "react";
import { Article, Category } from "../types";
import { newsService, getSupabaseConfig, getSupabase } from "../lib/supabase";
import { CATEGORIES } from "../data";
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  TrendingUp,
  Video,
  Award,
  Lock,
  Settings,
  LogOut,
  Sliders,
  Database,
  BookOpen,
  Check,
  AlertTriangle,
  FileText,
  Sparkles,
  Cloud,
  Upload,
  Image,
  Loader2
} from "lucide-react";
import { aiService, AIConfig, DEFAULT_PROMPTS, AIPrompts, DEFAULT_CATEGORY_PRESETS, DEFAULT_CATEGORIES } from "../lib/ai";
import {
  getCloudinaryConfig,
  saveCloudinaryConfig,
  isCloudinaryConfigured,
  uploadToCloudinary
} from "../lib/cloudinary";
import { CHHATTISGARH_DISTRICTS } from "../App";


interface AdminPanelProps {
  onBack: () => void;
  onDataChanged?: () => void;
  userEmail?: string;
}

export default function AdminPanel({ onBack, onDataChanged, userEmail = "drmaheshdangi@gmail.com" }: AdminPanelProps) {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // DB config state
  const [sbUrl, setSbUrl] = useState("");
  const [sbKey, setSbKey] = useState("");
  const [configSaved, setConfigSaved] = useState(false);

  // Articles state
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  // Form state (Insert/Update)
  const [activeTab, setActiveTab] = useState<"dashboard" | "articles" | "supabase" | "ai" | "cloudinary" | "webstories" | "newsletter" | "reactions" | "site" | "comments">("dashboard");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null);
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);

  // Cloudinary config state
  const [cldCloudName, setCldCloudName] = useState("");
  const [cldUploadPreset, setCldUploadPreset] = useState("");
  const [cldApiKey, setCldApiKey] = useState("");
  const [cldConfigSaved, setCldConfigSaved] = useState(false);
  const [cldTestFile, setCldTestFile] = useState<File | null>(null);
  const [cldTestUploading, setCldTestUploading] = useState(false);
  const [cldTestProgress, setCldTestProgress] = useState(0);
  const [cldTestResult, setCldTestResult] = useState<string | null>(null);
  const [cldTestError, setCldTestError] = useState<string | null>(null);

  // Cover Image upload state inside article form
  const [cldUploading, setCldUploading] = useState(false);
  const [cldUploadProgress, setCldUploadProgress] = useState(0);
  const [cldUploadError, setCldUploadError] = useState<string | null>(null);

  // AI Assistant settings state
  const [aiProvider, setAiProvider] = useState<"gemini" | "groq" | "deepseek">("gemini");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiPresets, setAiPresets] = useState<AIPrompts>(DEFAULT_PROMPTS);
  const [categoryPresets, setCategoryPresets] = useState<Record<string, string>>(DEFAULT_CATEGORY_PRESETS);
  const [aiSaved, setAiSaved] = useState(false);
  const [aiSavedMessage, setAiSavedMessage] = useState("");

  // Dynamic categories state
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [newCatId, setNewCatId] = useState("");
  const [newCatNameEn, setNewCatNameEn] = useState("");
  const [newCatNameHi, setNewCatNameHi] = useState("");

  // Server Sync Check States
  const [syncStatus, setSyncStatus] = useState<"connected" | "table_missing" | "unconfigured" | "error" | "checking">("checking");

  // Site settings state
  const [siteTitle, setSiteTitle] = useState(() => localStorage.getItem("sp_site_title") || "समाचार प्लस");
  const [siteTagline, setSiteTagline] = useState(() => localStorage.getItem("sp_site_tagline") || "Samachar Plus");
  const [siteMarquee, setSiteMarquee] = useState(() => localStorage.getItem("sp_site_marquee") || "स्वागत है - समाचार प्लस पर!");
  const [siteSettingsSaved, setSiteSettingsSaved] = useState(false);

  // Newsletter subscribers state
  const [subscribers, setSubscribers] = useState<{email: string; created_at?: string}[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);

  // Reactions state
  const [reactionStats, setReactionStats] = useState<{article_id: string; title: string; like: number; love: number; wow: number; sad: number}[]>([]);
  const [reactionsLoading, setReactionsLoading] = useState(false);

  // Web stories admin state
  type WebSlide = { image: string; caption: string };
  type WebStoryAdmin = { id: string; title: string; coverImage: string; slides: WebSlide[] };
  const defaultStories: WebStoryAdmin[] = JSON.parse(localStorage.getItem("sp_web_stories") || "null") || [
    { id: "story-1", title: "छत्तीसगढ़ मौसम: रायपुर, बिलासपुर समेत 15 जिलों में भारी बारिश का रेड अलर्ट", coverImage: "https://images.unsplash.com/photo-1504370805625-d34c54b34b00?auto=format&fit=crop&q=80&w=600", slides: [{ image: "https://images.unsplash.com/photo-1504370805625-d34c54b34b00?auto=format&fit=crop&q=80&w=600", caption: "मौसम विभाग ने रायपुर, बिलासपुर और दुर्ग में अगले दो दिनों के लिए भारी वज्रपात और अतिवृष्टि की चेतावनी जारी की है।" }] },
    { id: "story-2", title: "चित्रकोट जलप्रपात", coverImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=600", slides: [{ image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=600", caption: "बस्तर के प्रसिद्ध जलप्रपात पर इस मानसून रिकॉर्ड सैलानियों का जमावड़ा रहा।" }] }
  ];
  const [webStoriesAdmin, setWebStoriesAdmin] = useState<WebStoryAdmin[]>(defaultStories);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [editingStoryIdx, setEditingStoryIdx] = useState<number | null>(null);
  const [storyFormTitle, setStoryFormTitle] = useState("");
  const [storyFormCover, setStoryFormCover] = useState("");
  const [storyFormSlides, setStoryFormSlides] = useState<WebSlide[]>([{ image: "", caption: "" }]);

  const saveWebStories = (stories: WebStoryAdmin[]) => {
    localStorage.setItem("sp_web_stories", JSON.stringify(stories));
    setWebStoriesAdmin(stories);
  };

  const handleStorySubmit = () => {
    if (!storyFormTitle.trim() || !storyFormCover.trim()) return;
    const newStory: WebStoryAdmin = { id: editingStoryIdx !== null ? webStoriesAdmin[editingStoryIdx].id : `story-${Date.now()}`, title: storyFormTitle, coverImage: storyFormCover, slides: storyFormSlides.filter(s => s.image.trim()) };
    const updated = editingStoryIdx !== null ? webStoriesAdmin.map((s, i) => i === editingStoryIdx ? newStory : s) : [...webStoriesAdmin, newStory];
    saveWebStories(updated);
    setShowStoryForm(false);
    setEditingStoryIdx(null);
    setStoryFormTitle(""); setStoryFormCover(""); setStoryFormSlides([{ image: "", caption: "" }]);
  };

  const loadSubscribers = async () => {
    setSubsLoading(true);
    const sb = getSupabase();
    if (sb) {
      const { data } = await sb.from("subscribers").select("email, created_at").order("created_at", { ascending: false });
      setSubscribers(data || []);
    }
    setSubsLoading(false);
  };

  const loadReactions = async () => {
    setReactionsLoading(true);
    const sb = getSupabase();
    if (sb) {
      const { data: arts } = await sb.from("articles").select("id, title").limit(50);
      const { data: rxns } = await sb.from("reactions").select("article_id, emoji_type");
      if (arts && rxns) {
        const stats = arts.map((a: any) => {
          const artRxns = rxns.filter((r: any) => r.article_id === a.id);
          return { article_id: a.id, title: a.title, like: artRxns.filter((r: any) => r.emoji_type === "like").length, love: artRxns.filter((r: any) => r.emoji_type === "love").length, wow: artRxns.filter((r: any) => r.emoji_type === "wow").length, sad: artRxns.filter((r: any) => r.emoji_type === "sad").length };
        }).filter((s: any) => s.like + s.love + s.wow + s.sad > 0);
        setReactionStats(stats);
      }
    }
    setReactionsLoading(false);
  };


  // Comments Moderation State and helpers
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const data = await newsService.getAllComments();
      setCommentsList(data || []);
    } catch (e) {
      console.error("Failed to load comments", e);
    }
    setCommentsLoading(false);
  };

  const handleDeleteComment = async (id: string) => {
    if (window.confirm("क्या आप वाकई इस टिप्पणी को हटाना चाहते हैं?")) {
      try {
        const ok = await newsService.deleteComment(id);
        if (ok) {
          setCommentsList((prev) => prev.filter((c) => c.id !== id));
          alert("टिप्पणी सफलतापूर्वक हटा दी गई है।");
        } else {
          alert("टिप्पणी हटाने में विफल।");
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const [syncMessage, setSyncMessage] = useState("");
  const [seedingStatus, setSeedingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [seedingMessage, setSeedingMessage] = useState("");

  // AI Helper Modal states
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [aiSourceText, setAiSourceText] = useState("");
  const [aiSelectedPreset, setAiSelectedPreset] = useState<keyof AIPrompts>("sensitive");
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");
  const [aiIsGenerating, setAiIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  // AI Generated output preview
  const [aiGenTitle, setAiGenTitle] = useState("");
  const [aiGenSummary, setAiGenSummary] = useState("");
  const [aiGenContent, setAiGenContent] = useState("");

  const handleAIGenerate = async () => {
    if (!aiSourceText.trim()) {
      setAiError("कृपया किसी समाचार वेबसाइट का लेख यहाँ पेस्ट करें।");
      return;
    }
    setAiIsGenerating(true);
    setAiError("");
    try {
      const activeEmail = email.trim().toLowerCase();
      const result = await aiService.generateNews(aiSourceText, aiSelectedPreset, aiCustomPrompt, activeEmail);
      setAiGenTitle(result.title || "");
      setAiGenSummary(result.summary || "");
      setAiGenContent(result.content || "");
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "समाचार जनरेट करने में विफलता। कृपया API कुंजी की जांच करें।");
    } finally {
      setAiIsGenerating(false);
    }
  };

  const handleAIApply = () => {
    if (aiGenTitle) setFormTitle(aiGenTitle);
    if (aiGenContent) setFormContent(aiGenContent);
    if (aiGenSummary) setFormSummary(aiGenSummary);
    setShowAIHelper(false);
    // Clear helper states
    setAiSourceText("");
    setAiCustomPrompt("");
    setAiGenTitle("");
    setAiGenSummary("");
    setAiGenContent("");
  };

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formCategory, setFormCategory] = useState("politics");
  const [formAuthor, setFormAuthor] = useState("प्रशासक");
  const [formIsBreaking, setFormIsBreaking] = useState(false);
  const [formIsVideo, setFormIsVideo] = useState(false);
  const [formVideoDuration, setFormVideoDuration] = useState("");
  const [formStatus, setFormStatus] = useState<"draft" | "published" | "scheduled">("published");
  const [formSummary, setFormSummary] = useState("");
  const [formScheduledFor, setFormScheduledFor] = useState("");
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsTrending, setFormIsTrending] = useState(false);
  const [formDistrict, setFormDistrict] = useState("");
  const [formSubmitError, setFormSubmitError] = useState<string | null>(null);

  // Rich Text Editor ref and helpers
  const editorRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (showFormModal && editorRef.current && editorRef.current.innerHTML !== formContent) {
      editorRef.current.innerHTML = formContent;
    }
  }, [showFormModal, editingArticleId, formContent]);

  const execEditorCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setFormContent(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = prompt("लिंक का URL दर्ज करें (उदा: https://example.com):");
    if (url) {
      execEditorCommand("createLink", url);
    }
  };

  // Load articles
  const loadArticlesList = async () => {
    setLoading(true);
    const arts = await newsService.getArticles(undefined, true);
    setArticles(arts);
    setSelectedArticleIds([]);
    setLoading(false);
  };

  useEffect(() => {
    setSelectedArticleIds([]);
  }, [activeTab, searchTerm, selectedCategory]);

  useEffect(() => {
    // Check local session and restore Supabase Auth session
    const status = localStorage.getItem("samachar_admin_auth");
    const savedEmail = localStorage.getItem("samachar_admin_email") || "";
    if (savedEmail) setEmail(savedEmail);
    if (status === "true") {
      setIsAuthenticated(true);
    }

    const checkSession = async () => {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session && data.session.user) {
            const userEmail = data.session.user.email || "";
            setIsAuthenticated(true);
            setEmail(userEmail);
            localStorage.setItem("samachar_admin_auth", "true");
            localStorage.setItem("samachar_admin_email", userEmail);
            
            // Sync user config
            const aiConf = await aiService.getConfigFromServer(userEmail);
            setAiProvider(aiConf.provider);
            setAiApiKey(aiConf.apiKey);
            setAiModel(aiConf.model);
            setAiPresets(aiConf.presets);
            setCategoryPresets(aiConf.categoryPresets || DEFAULT_CATEGORY_PRESETS);
            setCategories(aiConf.categories || DEFAULT_CATEGORIES);
            await checkSync(userEmail);
          }
        } catch (e) {
          console.warn("Failed to restore Supabase session:", e);
        }
      }
    };
    checkSession();

    // Load credentials
    const conf = getSupabaseConfig();
    setSbUrl(conf.url);
    setSbKey(conf.anonKey);

    // Load Cloudinary credentials
    const cldConf = getCloudinaryConfig();
    setCldCloudName(cldConf.cloudName);
    setCldUploadPreset(cldConf.uploadPreset);
    setCldApiKey(cldConf.apiKey);

    // Load site settings from Supabase (or localStorage fallback)
    newsService.getSiteSettings().then(settings => {
      setSiteTitle(settings.site_title);
      setSiteTagline(settings.site_tagline);
      setSiteMarquee(settings.marquee_text);
      if (settings.web_stories) setWebStoriesAdmin(settings.web_stories);
    });

    // Load AI configurations from Server/LocalStorage scoped per email
    if (savedEmail) {
      aiService.getConfigFromServer(savedEmail).then((aiConf) => {
        setAiProvider(aiConf.provider);
        setAiApiKey(aiConf.apiKey);
        setAiModel(aiConf.model);
        setAiPresets(aiConf.presets);
        setCategoryPresets(aiConf.categoryPresets || DEFAULT_CATEGORY_PRESETS);
        setCategories(aiConf.categories || DEFAULT_CATEGORIES);
      });
      checkSync(savedEmail);
    } else {
      const aiConf = aiService.getConfig();
      setAiProvider(aiConf.provider);
      setAiApiKey(aiConf.apiKey);
      setAiModel(aiConf.model);
      setAiPresets(aiConf.presets);
      setCategoryPresets(aiConf.categoryPresets || DEFAULT_CATEGORY_PRESETS);
      setCategories(aiConf.categories || DEFAULT_CATEGORIES);
    }

    loadArticlesList();
  }, []);

  // Monitor active tab changes to trigger live server sync verification
  useEffect(() => {
    if (activeTab === "ai" && isAuthenticated && email) {
      checkSync(email);
    }
  }, [activeTab, isAuthenticated, email]);

  // Handle Admin Authorization
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    
    if (!email.trim() || !email.includes("@")) {
      setAuthError("कृपया अपना सही ईमेल पता दर्ज करें।");
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setAuthError("Supabase कॉन्फ़िगर नहीं है! कृपया Supabase कनेक्शन की जाँच करें।");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      });

      if (error) {
        setAuthError(`लॉगिन विफल: ${error.message}`);
        setLoading(false);
        return;
      }

      if (data && data.user) {
        const activeEmail = data.user.email || email.trim().toLowerCase();
        setIsAuthenticated(true);
        localStorage.setItem("samachar_admin_auth", "true");
        localStorage.setItem("samachar_admin_email", activeEmail);
        setAuthError("");

        // Fetch specific config for this logged-in email
        const aiConf = await aiService.getConfigFromServer(activeEmail);
        setAiProvider(aiConf.provider);
        setAiApiKey(aiConf.apiKey);
        setAiModel(aiConf.model);
        setAiPresets(aiConf.presets);
        setCategoryPresets(aiConf.categoryPresets || DEFAULT_CATEGORY_PRESETS);
        setCategories(aiConf.categories || DEFAULT_CATEGORIES);
        setLoading(false);
        await checkSync(activeEmail);
      }
    } catch (err: any) {
      setAuthError(`त्रुटि: ${err.message || err}`);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    localStorage.removeItem("samachar_admin_auth");
    localStorage.removeItem("samachar_admin_email");
    setEmail("");
    
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  // Save Supabase Configuration
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("SAMACHAR_SUPABASE_URL", sbUrl.trim());
    localStorage.setItem("SAMACHAR_SUPABASE_ANON_KEY", sbKey.trim());
    setConfigSaved(true);
    setTimeout(() => {
      setConfigSaved(false);
      // Force reload to apply new supabase settings
      window.location.reload();
    }, 1200);
  };

  // Save Cloudinary Configuration
  const handleSaveCloudinaryConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveCloudinaryConfig({
      cloudName: cldCloudName.trim(),
      uploadPreset: cldUploadPreset.trim(),
      apiKey: cldApiKey.trim(),
    });
    setCldConfigSaved(true);
    setTimeout(() => {
      setCldConfigSaved(false);
    }, 2000);
  };

  // Test Cloudinary Upload
  const handleTestCloudinaryUpload = async () => {
    if (!cldTestFile) {
      setCldTestError("कृपया पहले एक फाइल चुनें।");
      return;
    }
    setCldTestUploading(true);
    setCldTestProgress(0);
    setCldTestResult(null);
    setCldTestError(null);

    try {
      const url = await uploadToCloudinary(cldTestFile, (pct) => {
        setCldTestProgress(pct);
      });
      setCldTestResult(url);
    } catch (err: any) {
      setCldTestError(err.message || "अपलोड करने में विफल।");
    } finally {
      setCldTestUploading(false);
    }
  };

  // Handle Cover Photo Upload
  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isCloudinaryConfigured()) {
      setCldUploadError("Cloudinary कॉन्फ़िगर नहीं है। कृपया Admin Panel > Cloudinary सेटिंग्स में जाकर क्रेडेंशियल्स भरें।");
      return;
    }

    setCldUploading(true);
    setCldUploadProgress(0);
    setCldUploadError(null);

    try {
      const url = await uploadToCloudinary(file, (pct) => {
        setCldUploadProgress(pct);
      });
      setFormImageUrl(url);
      setCldUploadProgress(100);
    } catch (err: any) {
      setCldUploadError(err.message || "फाइल अपलोड करने में विफल।");
    } finally {
      setCldUploading(false);
    }
  };

  // Live server sync connection check
  const checkSync = async (activeEmail: string) => {
    if (!activeEmail) return;
    setSyncStatus("checking");
    try {
      const res = await aiService.checkServerSyncStatus(activeEmail);
      setSyncStatus(res.status);
      setSyncMessage(res.message);
    } catch (e) {
      setSyncStatus("error");
      setSyncMessage("सर्वर कनेक्टिविटी की जांच करने में विफल।");
    }
  };

  // Save AI Configurations
  const handleSaveAIConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeEmail = email.trim().toLowerCase();
    const ok = await aiService.saveConfigToServer(activeEmail, {
      provider: aiProvider,
      apiKey: aiApiKey,
      model: aiModel,
      presets: aiPresets,
      categoryPresets: categoryPresets,
      categories: categories
    });
    
    if (ok) {
      setAiSavedMessage("AI सेटिंग्स सर्वर और लोकल स्टोरेज में सिंक हो गई है!");
    } else {
      setAiSavedMessage("AI सेटिंग्स स्थानीय रूप से सहेजी गई (सर्वर सिंक ऑफ़लाइन)!");
    }
    
    setAiSaved(true);
    setTimeout(() => {
      setAiSaved(false);
      setAiSavedMessage("");
    }, 3000);

    // Re-verify sync status after saving
    await checkSync(activeEmail);
  };

  const persistCategories = async (updatedCategories: Category[], updatedPresets?: Record<string, string>) => {
    const activeEmail = (email || userEmail).trim().toLowerCase();
    const presetsToSave = updatedPresets || categoryPresets;
    
    await aiService.saveConfigToServer(activeEmail, {
      provider: aiProvider,
      apiKey: aiApiKey,
      model: aiModel,
      presets: aiPresets,
      categoryPresets: presetsToSave,
      categories: updatedCategories
    });
    
    if (onDataChanged) {
      onDataChanged();
    }
  };

  const handleSeedDatabase = async () => {
    setSeedingStatus("loading");
    setSeedingMessage("डेटाबेस में समाचार अपलोड किए जा रहे हैं...");
    try {
      const res = await newsService.seedDefaultData();
      if (res.success) {
        setSeedingStatus("success");
        setSeedingMessage(res.message);
        await loadArticlesList();
        if (onDataChanged) onDataChanged();
      } else {
        setSeedingStatus("error");
        setSeedingMessage(res.message);
      }
    } catch (e: any) {
      setSeedingStatus("error");
      setSeedingMessage("सेडिंग विफल रही: " + (e.message || e));
    }
  };

  // Open Form for Creation
  const handleOpenCreate = () => {
    setEditingArticleId(null);
    setFormSubmitError(null);
    setFormTitle("");
    setFormContent("");
    setFormImageUrl("https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=600");
    setFormCategory("politics");
    setFormAuthor(email ? email.split("@")[0] : userEmail ? userEmail.split("@")[0] : "प्रशासक");
    setFormIsBreaking(false);
    setFormIsVideo(false);
    setFormVideoDuration("");
    setFormStatus("published");
    setFormSummary("");
    setFormScheduledFor("");
    setFormIsFeatured(false);
    setFormIsTrending(false);
    setFormDistrict("");
    setIsEditorFullscreen(false);
    setShowFormModal(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (art: Article) => {
    setEditingArticleId(art.id);
    setFormSubmitError(null);
    setFormTitle(art.title);
    setFormContent(art.content);
    setFormImageUrl(art.image_url);
    setFormCategory(art.category);
    setFormAuthor(art.author);
    setFormIsBreaking(art.is_breaking);
    setFormIsVideo(art.is_video);
    setFormVideoDuration(art.video_duration || "");
    setFormStatus(art.status || "published");
    setFormSummary(art.summary || "");
    setFormScheduledFor(art.scheduled_for || "");
    setFormIsFeatured(!!art.is_featured);
    setFormIsTrending(!!art.is_trending);
    setFormDistrict(art.district || "");
    setIsEditorFullscreen(false);
    setShowFormModal(true);
  };

  // Handle Submit Create/Update
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formContent) return;
    setFormSubmitError(null);
 
    const getFormattedDateHindi = () => {
      const months = [
        "जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून",
        "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"
      ];
      const d = new Date();
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    };
 
    const payload = {
      title: formTitle,
      content: formContent,
      image_url: formImageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=600",
      category: formCategory,
      published_at: editingArticleId ? "संपादित आज" : getFormattedDateHindi(),
      is_video: formIsVideo,
      video_duration: formIsVideo ? formVideoDuration || "03:00" : undefined,
      is_breaking: formIsBreaking,
      author: formAuthor,
      status: formStatus,
      summary: formSummary,
      scheduled_for: formStatus === "scheduled" ? formScheduledFor : undefined,
      is_featured: formIsFeatured,
      is_trending: formIsTrending,
      district: formDistrict || null
    };
 
    setLoading(true);
    try {
      if (editingArticleId) {
        await newsService.updateArticle(editingArticleId, payload);
      } else {
        await newsService.createArticle(payload);
      }
      setShowFormModal(false);
      await loadArticlesList();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      console.error(err);
      setFormSubmitError(err.message || "डेटाबेस में समाचार सहेजने में विफल। कृपया SQL/RLS नीतियों की जांच करें।");
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete
  const handleDeleteArticle = async () => {
    if (!deletingArticleId) return;
    setLoading(true);
    await newsService.deleteArticle(deletingArticleId);
    setDeletingArticleId(null);
    await loadArticlesList();
    if (onDataChanged) onDataChanged();
  };

  // Handle Bulk Delete
  const handleBulkDeleteArticles = async () => {
    if (selectedArticleIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedArticleIds.map(id => newsService.deleteArticle(id)));
      setSelectedArticleIds([]);
      setShowBulkDeleteConfirm(false);
      await loadArticlesList();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      console.error("Bulk delete failed:", err);
      // reload to ensure correct state representation
      await loadArticlesList();
      if (onDataChanged) onDataChanged();
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Instant checkbox setting toggles
  const toggleArticleSetting = async (id: string, settingKey: "is_breaking" | "is_featured" | "is_trending", currentValue: boolean) => {
    const newValue = !currentValue;
    
    // Optimistic UI state update
    setArticles(prev => prev.map(a => a.id === id ? { ...a, [settingKey]: newValue } : a));
    
    try {
      await newsService.updateArticle(id, { [settingKey]: newValue });
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error("Failed to toggle article setting:", err);
      // Revert on error
      setArticles(prev => prev.map(a => a.id === id ? { ...a, [settingKey]: currentValue } : a));
    }
  };

  // Computed Stats
  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);
  const videoArticlesCount = articles.filter((a) => a.is_video).length;
  const breakingArticlesCount = articles.filter((a) => a.is_breaking).length;

  // Filter logic
  const filteredArticles = articles.filter((art) => {
    const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          art.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || art.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-xl border border-gray-200 p-6 shadow-xl relative overflow-hidden">
          <div className="h-2.5 bg-brand-red absolute top-0 left-0 right-0"></div>
          
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-brand-red/10 rounded-full text-brand-red mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-display font-extrabold text-[#111827]">
              Samachar Plus / प्रशासक लॉगिन
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              न्यूज पोर्टल का संपादन और नियंत्रण करने के लिए पासवर्ड डालें
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 mb-1">
                प्रशासक / संपादक ईमेल (Email ID)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="editor@samachar.com"
                className="w-full text-sm border border-gray-200 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50 transition-all font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 mb-1">
                लॉगिन कोड (पासवर्ड)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm border border-gray-200 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50 transition-all font-mono"
              />
            </div>

            {authError && (
              <p className="text-xs text-brand-red font-medium flex items-center gap-1.5 bg-red-50 p-2 rounded">
                <AlertTriangle className="w-3.5 h-3.5" />
                {authError}
              </p>
            )}

            <div className="bg-gray-50 rounded-lg p-3 text-2xs text-gray-500 leading-normal border border-gray-100">
              🔒 **सुरक्षित लॉगिन**:<br />
              यह व्यवस्थापक डैशबोर्ड Supabase Auth द्वारा सुरक्षित है। कृपया अपने पंजीकृत व्यवस्थापक ईमेल और पासवर्ड का उपयोग करके लॉगिन करें।
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-2 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 font-label-bold transition-all"
              >
                वेबसाइट पर जाएँ
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs bg-brand-red hover:bg-[#9e0010] text-white rounded-lg font-label-bold shadow-sm transition-all cursor-pointer"
              >
                सत्यापित करें
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Banner Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-5 mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-brand-dark flex items-center gap-2 tracking-tight">
            Samachar Plus Control Console
          </h1>
          <p className="text-xs text-gray-500">
            लॉगिन ईमेल: {email || userEmail} • सभी आंकड़े व समाचार यहाँ से नियंत्रित करें
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 px-3 bg-gray-100 text-gray-600 hover:bg-gray-250 hover:text-gray-900 rounded text-xs font-label-bold transition-all cursor-pointer inline-flex items-center gap-1"
          >
            रिफ्रेश होमपेज
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 px-3 bg-gray-800 text-white hover:bg-black rounded text-xs font-label-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> लॉगआउट
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-gray-200 mb-6 font-mono text-xs overflow-x-auto no-scrollbar gap-1">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`pb-2.5 px-4 font-bold border-b-2 transition-all ${
            activeTab === "dashboard"
              ? "border-brand-red text-brand-red"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          डैशबोर्ड ओवरव्यू
        </button>
        <button
          onClick={() => setActiveTab("articles")}
          className={`pb-2.5 px-4 font-bold border-b-2 transition-all ${
            activeTab === "articles"
              ? "border-brand-red text-brand-red"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          समाचार लेख सूची ({articles.length})
        </button>
        <button
          onClick={() => setActiveTab("supabase")}
          className={`pb-2.5 px-4 font-bold border-b-2 transition-all ${
            activeTab === "supabase"
              ? "border-brand-red text-brand-red"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          Supabase सर्वर सेटिंग्स
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`pb-2.5 px-4 font-bold border-b-2 transition-all ${
            activeTab === "ai"
              ? "border-brand-red text-brand-red"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          AI असिस्टेंट सेटिंग्स
        </button>
        <button
          onClick={() => setActiveTab("cloudinary")}
          className={`pb-2.5 px-4 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "cloudinary"
              ? "border-brand-red text-brand-red"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Cloud className="w-3.5 h-3.5" /> Cloudinary सेटिंग्स
        </button>
        <button
          onClick={() => setActiveTab("webstories")}
          className={`pb-2.5 px-4 font-bold border-b-2 transition-all ${
            activeTab === "webstories" ? "border-brand-red text-brand-red" : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          📸 वेब स्टोरीज
        </button>
        <button
          onClick={() => { setActiveTab("newsletter"); loadSubscribers(); }}
          className={`pb-2.5 px-4 font-bold border-b-2 transition-all ${
            activeTab === "newsletter" ? "border-brand-red text-brand-red" : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          📧 न्यूज़लेटर ({subscribers.length})
        </button>
        <button
          onClick={() => { setActiveTab("comments"); loadComments(); }}
          className={`pb-2.5 px-4 font-bold border-b-2 transition-all ${
            activeTab === "comments" ? "border-brand-red text-brand-red" : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          💬 टिप्पणियाँ ({commentsList.length})
        </button>
        <button
          onClick={() => { setActiveTab("reactions"); loadReactions(); }}
          className={`pb-2.5 px-4 font-bold border-b-2 transition-all ${
            activeTab === "reactions" ? "border-brand-red text-brand-red" : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          👍 रिएक्शन्स
        </button>
        <button
          onClick={() => setActiveTab("site")}
          className={`pb-2.5 px-4 font-bold border-b-2 transition-all ${
            activeTab === "site" ? "border-brand-red text-brand-red" : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          ⚙️ साइट सेटिंग्स
        </button>
      </div>

      {/* Content wrapper */}
      <div>
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat Card 1 */}
              <div className="bg-white border rounded-lg p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">कुल समाचार लेख</span>
                  <span className="text-2xl font-display font-extrabold text-gray-900 block mt-1">{articles.length}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>

              {/* Stat Card 2 */}
              <div className="bg-white border rounded-lg p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">कुल पाठक व्यूज</span>
                  <span className="text-2xl font-display font-extrabold text-gray-900 block mt-1">{totalViews}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              {/* Stat Card 3 */}
              <div className="bg-white border rounded-lg p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">वीडियो समाचार</span>
                  <span className="text-2xl font-display font-extrabold text-gray-900 block mt-1">{videoArticlesCount}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
              </div>

              {/* Stat Card 4 */}
              <div className="bg-white border rounded-lg p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">ब्रेकिंग न्यूज अलर्ट्स</span>
                  <span className="text-2xl font-display font-extrabold text-gray-900 block mt-1">{breakingArticlesCount}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Quick overview widget & visual categories graph */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-5 shadow-xs">
                <h3 className="font-display font-bold text-sm text-gray-850 mb-4 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-brand-red" /> श्रेणीवार प्रकाशन विवरण
                </h3>
                <div className="space-y-3 font-body">
                  {categories.map((cat) => {
                    const count = articles.filter((a) => a.category === cat.id).length;
                    const percentage = articles.length > 0 ? (count / articles.length) * 100 : 0;
                    return (
                      <div key={cat.id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-gray-700">{cat.name_hi} ({cat.name_en})</span>
                          <span className="text-gray-500">{count} लेख ({Math.round(percentage)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-brand-red h-2 rounded-full transition-all duration-550"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border rounded-lg p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-sm text-gray-850 mb-2">💡 त्वरित नियंत्रण निर्देश</h3>
                  <p className="text-xs text-gray-600 leading-relaxed font-body">
                    आप 'Samachar Plus' पोर्टल पर लाइव समाचार जोड़ सकते हैं, किसी भी खबर के वर्तनी-सुधार कर सकते हैं या पुरानी अप्रासंगिक ख़बरों को डेटाबेस से स्थायी रूप से हटा सकते हैं। ये सभी क्रियाएं स्थानीय स्तर पर रीयल-टाइम स्टोर होंगी।
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed mt-2.5 font-body">
                    जैसे ही आप अपनी वास्तविक <strong>Supabase Credentials</strong> प्रदान करेंगे, यह कंसोल सीधे आपके क्लाउड डेटाबेस से सिंक हो जाएगा, जिससे आपकी बहु-उपभोक्ता समाचार सुरक्षा सुनिश्चित होगी।
                  </p>
                </div>
                <div className="pt-4 border-t mt-4 flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => setActiveTab("articles")}
                    className="p-2 bg-gray-100 font-label-bold rounded text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    लेख प्रबंधन देखें
                  </button>
                  <button
                    onClick={handleOpenCreate}
                    className="p-2 bg-brand-red font-label-bold rounded text-white hover:bg-[#9e0010] shadow-sm transition-colors cursor-pointer"
                  >
                    नया समाचार लिखें
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ARTICLES CRUD MANAGER */}
        {activeTab === "articles" && (
          <div className="space-y-4">
            {/* Filter controls */}
            <div className="bg-white border rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                {/* Search bar */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="खबर शीर्षक द्वारा खोजें..."
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-gray-200 outline-none focus:border-brand-red rounded-lg bg-gray-50/50"
                  />
                </div>
                {/* Category select */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-auto text-xs py-2 px-3 border border-gray-200 outline-none focus:border-brand-red rounded-lg bg-gray-50 text-gray-700"
                >
                  <option value="all">सभी श्रेणियां</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_hi}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleOpenCreate}
                className="w-full sm:w-auto bg-brand-red hover:bg-[#9e0010] text-white p-2.5 px-4 rounded-lg font-label-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> नया समाचार लिखें
              </button>
            </div>

            {/* Bulk actions bar */}
            {selectedArticleIds.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs animate-fade-in">
                <div className="flex items-center gap-2 text-brand-red">
                  <AlertTriangle className="w-4 h-4 text-brand-red" />
                  <span className="text-xs font-bold font-body">
                    {selectedArticleIds.length} समाचार चयनित हैं
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setSelectedArticleIds([])}
                    className="w-full sm:w-auto text-gray-500 hover:text-gray-800 text-xs font-label-bold px-3 py-1.5 rounded-lg border border-gray-250 hover:bg-gray-100 transition-colors cursor-pointer bg-white"
                  >
                    चयन रद्द करें
                  </button>
                  <button
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    className="w-full sm:w-auto bg-brand-red hover:bg-[#9e0010] text-white px-3 py-1.5 rounded-lg font-label-bold text-xs inline-flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> चयनित हटाएं (Bulk Delete)
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            {loading ? (
              <div className="min-h-[300px] flex items-center justify-center bg-white border rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-red border-t-transparent"></div>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="min-h-[300px] bg-white border rounded-lg flex flex-col items-center justify-center p-6 text-center">
                <FileText className="w-12 h-12 text-gray-300 mb-2" />
                <h3 className="font-bold text-gray-855 text-sm">कोई मिलान नहीं मिला</h3>
                <p className="text-2xs text-gray-500 mt-1 max-w-xs font-body">
                  सर्च कीवर्ड्स बदलें या श्रेणी फिल्टर रीसेट करें।
                </p>
              </div>
            ) : (
              <div className="bg-white border rounded-lg overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-body text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 uppercase font-mono text-[10px] tracking-wide border-b border-gray-200">
                        <th className="py-3 px-4 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={filteredArticles.length > 0 && filteredArticles.every(art => selectedArticleIds.includes(art.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedArticleIds(prev => {
                                  const newSelection = [...prev];
                                  filteredArticles.forEach(art => {
                                    if (!newSelection.includes(art.id)) {
                                      newSelection.push(art.id);
                                    }
                                  });
                                  return newSelection;
                                });
                              } else {
                                setSelectedArticleIds(prev => prev.filter(id => !filteredArticles.some(art => art.id === id)));
                              }
                            }}
                            className="rounded border-gray-300 text-brand-red focus:ring-brand-red w-4 h-4 cursor-pointer"
                          />
                        </th>
                        <th className="py-3 px-4">प्रकाशन शीर्षक & लेखक</th>
                        <th className="py-3 px-4">श्रेणी</th>
                        <th className="py-3 px-4 text-center">ब्रेकिंग</th>
                        <th className="py-3 px-4 text-center">मुख्य (Featured)</th>
                        <th className="py-3 px-4 text-center">ट्रेंडिंग</th>
                        <th className="py-3 px-4 text-center">व्यूज</th>
                        <th className="py-3 px-4 text-right">कार्रवाई</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {filteredArticles.map((art) => (
                        <tr key={art.id} className={`transition-colors ${selectedArticleIds.includes(art.id) ? 'bg-brand-red/5 hover:bg-brand-red/10' : 'hover:bg-gray-50/50'}`}>
                          <td className="py-3.5 px-4 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={selectedArticleIds.includes(art.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedArticleIds(prev => [...prev, art.id]);
                                } else {
                                  setSelectedArticleIds(prev => prev.filter(id => id !== art.id));
                                }
                              }}
                              className="rounded border-gray-300 text-brand-red focus:ring-brand-red w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-4 max-w-xs sm:max-w-sm">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 block line-clamp-1">{art.title}</span>
                              <span className="text-[10px] font-mono text-gray-400 block mt-0.5">लेखक: {art.author || "प्रशासक"} • {art.published_at}</span>
                              {art.is_video && (
                                <span className="mt-1 inline-flex w-max items-center gap-0.5 text-[8px] font-bold text-amber-600 bg-amber-50 px-1 rounded border border-amber-100">
                                  <Video className="w-2.5 h-2.5" /> वीडियो ({art.video_duration || "03:00"})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px]">
                              {categories.find((c) => c.id === art.category)?.name_hi || art.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={!!art.is_breaking}
                              onChange={() => toggleArticleSetting(art.id, "is_breaking", !!art.is_breaking)}
                              className="rounded border-gray-300 text-brand-red focus:ring-brand-red w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={!!art.is_featured}
                              onChange={() => toggleArticleSetting(art.id, "is_featured", !!art.is_featured)}
                              className="rounded border-gray-300 text-brand-red focus:ring-brand-red w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={!!art.is_trending}
                              onChange={() => toggleArticleSetting(art.id, "is_trending", !!art.is_trending)}
                              className="rounded border-gray-300 text-brand-red focus:ring-brand-red w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-700">
                            {art.views || 0}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(art)}
                                className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded transition-colors cursor-pointer"
                                title="Edit Post"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingArticleId(art.id)}
                                className="p-1.5 hover:bg-brand-red/10 text-brand-red rounded transition-colors cursor-pointer"
                                title="Delete Post"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SUPABASE CREDENTIALS SETTINGS */}
        {activeTab === "supabase" && (
          <div className="max-w-xl mx-auto bg-white border rounded-lg p-6 shadow-sm relative overflow-hidden">
            <div className="h-1 bg-brand-red absolute top-0 left-0 right-0"></div>
            <h3 className="font-display font-extrabold text-[#111827] flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-brand-red" /> Supabase सर्वर सिंक सेटिंग्स
            </h3>
            <p className="text-xs text-gray-500 mb-5 font-body leading-relaxed">
              आप अपने खुद के Supabase डेटाबेस क्रेडेंशियल्स दर्ज कर सकते हैं। हमारा सिस्टम रीयल-टाइम डेटाबेस को सीधे Supabase के साथ सिंक कर देगा। यदि क्रेडेंशियल्स उपलब्ध नहीं होंगे, तो एप्लिकेशन स्वतः ही <strong>Local Storage</strong> मोड में काम करता रहेगा।
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[11px] uppercase text-gray-500 mb-1 font-bold">SUPABASE URL</label>
                <input
                  type="text"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  placeholder="उदा. https://xyzabcd.supabase.co"
                  className="w-full border border-gray-200 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase text-gray-500 mb-1 font-bold">SUPABASE PUBLIC ANON KEY</label>
                <input
                  type="password"
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                  placeholder="उदा. eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full border border-gray-200 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50/50"
                />
              </div>

              {configSaved && (
                <p className="text-xs text-green-600 font-label-bold flex items-center gap-1 bg-green-50 p-2 rounded">
                  <Check className="w-4 h-4" /> सेटिंग्स सुरक्षित की गई! रीलोड किया जा रहा है...
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="bg-brand-red hover:bg-[#9e0010] text-white p-2.5 rounded-lg font-label-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  सेटिंग सेव करें और सिंक करें
                </button>
              </div>

              {/* Database Seeder Block */}
              {sbUrl && sbKey && (
                <div className="border-t border-gray-150 pt-5 mt-5 space-y-3">
                  <h4 className="font-display font-bold text-xs text-brand-dark flex items-center gap-1.5">
                    📤 डेटाबेस सेडिंग यूटिलिटी (Database Seed Utility)
                  </h4>
                  <p className="text-[11px] text-gray-500 font-body leading-relaxed">
                    यदि आपका Supabase क्लाउड डेटाबेस पूरी तरह खाली (Empty) है, तो आप एक क्लिक में सभी 20+ डिफ़ॉल्ट समाचारों को अपलोड कर सकते हैं। यह सुनिश्चित करेगा कि आपकी वेबसाइट अन्य सभी उपकरणों पर तुरंत जीवंत (live) हो जाए!
                  </p>
                  
                  {seedingStatus === "loading" && (
                    <div className="p-3 bg-blue-50 text-blue-700 rounded text-2xs font-bold animate-pulse flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 animate-spin" />
                      <span>{seedingMessage}</span>
                    </div>
                  )}
                  {seedingStatus === "success" && (
                    <div className="p-3 bg-green-50 text-green-700 rounded text-2xs font-bold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>{seedingMessage}</span>
                    </div>
                  )}
                  {seedingStatus === "error" && (
                    <div className="p-3 bg-red-50 text-red-700 rounded text-2xs font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                      <span>{seedingMessage}</span>
                    </div>
                  )}

                  {seedingStatus !== "loading" && seedingStatus !== "success" && (
                    <button
                      type="button"
                      onClick={handleSeedDatabase}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-2xs font-label-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      📤 डिफ़ॉल्ट डेटा क्लाउड सर्वर पर अपलोड करें (Seed Default Data)
                    </button>
                  )}
                </div>
              )}

              {/* Supabase SQL Blueprint Script Card */}
              <div className="border-t border-gray-150 pt-5 mt-5 space-y-3 text-left">
                <h4 className="font-display font-bold text-xs text-brand-dark flex items-center gap-1.5">
                  📋 Supabase SQL सेटअप ब्लूप्रिंट (Required Database Schema)
                </h4>
                <p className="text-[11px] text-gray-500 font-body leading-relaxed">
                  यदि आप पहली बार अपने Supabase सर्वर का उपयोग कर रहे हैं, तो समाचार प्रबंधन (CRUD) और पाठकों की टिप्पणियों को सहेजने के लिए कृपया नीचे दी गई SQL स्क्रिप्ट को कॉपी करें और अपने **Supabase SQL Editor** में चलाएं:
                </p>
                <div className="bg-gray-50 border rounded p-2.5 font-mono text-[9px] text-gray-700 relative group max-h-48 overflow-y-auto">
                  <pre className="whitespace-pre select-all leading-normal">
{`-- 1. Create articles table
CREATE TABLE IF NOT EXISTS public.articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT NOT NULL,
    category TEXT NOT NULL,
    published_at TEXT NOT NULL,
    is_video BOOLEAN NOT NULL DEFAULT false,
    video_duration TEXT,
    is_breaking BOOLEAN NOT NULL DEFAULT false,
    views INTEGER NOT NULL DEFAULT 0,
    author TEXT NOT NULL DEFAULT 'प्रशासक',
    status TEXT NOT NULL DEFAULT 'published',
    summary TEXT,
    scheduled_for TEXT,
    likes_count INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create reactions table
CREATE TABLE IF NOT EXISTS public.reactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    article_id TEXT NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    emoji_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, article_id)
);

-- 4. Enable RLS and create public policies
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read/Write for articles" ON public.articles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read/Write for comments" ON public.comments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read/Write for reactions" ON public.reactions FOR ALL USING (true) WITH CHECK (true);`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`-- 1. Create articles table
CREATE TABLE IF NOT EXISTS public.articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT NOT NULL,
    category TEXT NOT NULL,
    published_at TEXT NOT NULL,
    is_video BOOLEAN NOT NULL DEFAULT false,
    video_duration TEXT,
    is_breaking BOOLEAN NOT NULL DEFAULT false,
    views INTEGER NOT NULL DEFAULT 0,
    author TEXT NOT NULL DEFAULT 'प्रशासक',
    status TEXT NOT NULL DEFAULT 'published',
    summary TEXT,
    scheduled_for TEXT,
    likes_count INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create reactions table
CREATE TABLE IF NOT EXISTS public.reactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    article_id TEXT NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    emoji_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, article_id)
);

-- 4. Enable RLS and create public policies
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read/Write for articles" ON public.articles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read/Write for comments" ON public.comments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read/Write for reactions" ON public.reactions FOR ALL USING (true) WITH CHECK (true);`);
                      alert("SQL ब्लूप्रिंट स्क्रिप्ट क्लिपबोर्ड पर कॉपी हो गई है!");
                    }}
                    className="absolute right-2 top-2 p-1 px-2 bg-white border rounded text-[9px] font-bold text-gray-700 hover:bg-gray-100 cursor-pointer shadow-xs"
                  >
                    कॉपी करें
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: AI SETTINGS PANEL */}
        {activeTab === "ai" && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-lg p-6 shadow-sm relative overflow-hidden text-left font-body">
            <div className="h-1 bg-brand-red absolute top-0 left-0 right-0"></div>
            
            <h3 className="font-display font-extrabold text-sm text-gray-900 dark:text-zinc-100 flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-brand-red animate-pulse" /> AI असिस्टेंट क्रेडेंशियल्स & सेटिंग्स
            </h3>
            
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-5 leading-relaxed">
              यहाँ आप अपने Google Gemini, Groq, या DeepSeek के API क्रेडेंशियल्स और रीयल-टाइम न्यूज़ रीराइटिंग प्रॉम्प्ट्स को सेट और कस्टमाइज़ कर सकते हैं। यह जानकारी आपके Supabase क्लाउड सर्वर में आपके लॉगिन ईमेल आईडी के साथ सुरक्षित रूप से सहेजी जाती है। यदि सर्वर उपलब्ध नहीं है, तो यह आपके स्थानीय ब्राउज़र (Local Storage) में सहेजी जाएगी।
            </p>

            {/* Server Sync Status Badge Card */}
            <div className={`mb-5 p-4 rounded-lg border text-xs leading-normal ${
              syncStatus === "checking" ? "bg-blue-50/50 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900/30" :
              syncStatus === "connected" ? "bg-green-50/50 border-green-100 dark:bg-green-950/10 dark:border-green-900/30" :
              syncStatus === "table_missing" ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/30" :
              syncStatus === "unconfigured" ? "bg-amber-50/30 border-amber-100 dark:bg-amber-950/5 dark:border-amber-900/20" :
              "bg-red-50/50 border-red-100 dark:bg-red-950/10 dark:border-red-900/30"
            }`}>
              {syncStatus === "checking" && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold animate-pulse">
                  <Database className="w-4 h-4 animate-spin" />
                  <span>सर्वर सिंक स्थिति की जांच की जा रही है...</span>
                </div>
              )}
              {syncStatus === "connected" && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold">
                    <Check className="w-4 h-4" />
                    <span>सिंक स्थिति: क्लाउड सिंक सक्रिय (Cloud Sync Active)</span>
                  </div>
                  <p className="text-gray-500 dark:text-zinc-400 text-2xs pl-6">
                    आपकी AI सेटिंग्स और API कुंजियाँ आपके लॉगिन ईमेल ID (<strong className="font-mono text-gray-700 dark:text-zinc-200">{email}</strong>) के साथ Supabase क्लाउड डेटाबेस पर सुरक्षित रूप से सिंक हो रही हैं।
                  </p>
                </div>
              )}
              {syncStatus === "table_missing" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                    <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                    <span>सिंक स्थिति: Supabase टेबल 'editor_ai_settings' अनुपलब्ध (Table Missing)</span>
                  </div>
                  <p className="text-gray-500 dark:text-zinc-400 text-2xs pl-6">
                    आपकी AI सेटिंग्स वर्तमान में सुरक्षित रूप से आपके स्थानीय ब्राउज़र (Local Storage) में सहेजी जा रही हैं। इन्हें Supabase सर्वर पर सिंक करने के लिए, कृपया अपने Supabase डैशबोर्ड पर जाएँ और नीचे दी गई SQL स्क्रिप्ट को <strong>SQL Editor</strong> में चलाएं:
                  </p>
                  <div className="bg-gray-50 dark:bg-zinc-800/50 border dark:border-zinc-800 rounded p-2.5 font-mono text-[10px] text-gray-700 dark:text-zinc-300 relative group">
                    <pre className="overflow-x-auto whitespace-pre no-scrollbar select-all">
{`CREATE TABLE IF NOT EXISTS public.editor_ai_settings (
    user_email TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    api_key TEXT NOT NULL,
    model TEXT NOT NULL,
    presets JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and make public
ALTER TABLE public.editor_ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read/write for all users" ON public.editor_ai_settings
    FOR ALL USING (true) WITH CHECK (true);`}
                    </pre>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS public.editor_ai_settings (
    user_email TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    api_key TEXT NOT NULL,
    model TEXT NOT NULL,
    presets JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and make public
ALTER TABLE public.editor_ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read/write for all users" ON public.editor_ai_settings
    FOR ALL USING (true) WITH CHECK (true);`);
                        alert("SQL स्क्रिप्ट क्लिपबोर्ड पर कॉपी हो गई है!");
                      }}
                      className="absolute right-2 top-2 p-1 px-2 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded text-2xs font-bold text-gray-650 dark:text-zinc-350 hover:bg-gray-100 cursor-pointer shadow-xs"
                    >
                      कॉपी करें
                    </button>
                  </div>
                </div>
              )}
              {syncStatus === "unconfigured" && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-500 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>सिंक स्थिति: Supabase क्रेडेंशियल्स अनुपलब्ध</span>
                  </div>
                  <p className="text-gray-500 dark:text-zinc-400 pl-6 text-2xs">
                    {syncMessage} स्थानीय ब्राउज़र बैकअप सक्रिय है।
                  </p>
                </div>
              )}
              {syncStatus === "error" && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-red-500 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>सिंक स्थिति: सर्वर कनेक्टिविटी त्रुटि</span>
                  </div>
                  <p className="text-gray-500 dark:text-zinc-400 pl-6 text-2xs">
                    {syncMessage} ब्राउज़र में स्थानीय रूप से सहेजने का कार्य जारी है।
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveAIConfig} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Provider selection */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-500 font-bold mb-1">प्रदाता (API Provider)</label>
                  <select
                    value={aiProvider}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setAiProvider(val);
                      setAiModel(val === "gemini" ? "gemini-2.5-flash" : val === "groq" ? "llama-3.3-70b-versatile" : "deepseek-chat");
                    }}
                    className="w-full border border-gray-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200"
                  >
                    <option value="gemini">Google Gemini (Recommended)</option>
                    <option value="groq">Groq AI (Ultra Fast)</option>
                    <option value="deepseek">DeepSeek V4 (High Quality)</option>
                  </select>
                </div>

                {/* Model selection */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-gray-500 font-bold mb-1">मॉडल (Model Identifier)</label>
                  <input
                    type="text"
                    required
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    placeholder="उदा. gemini-2.5-flash"
                    className="w-full font-mono border border-gray-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50 dark:bg-zinc-800/40 text-gray-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-500 font-bold mb-1">API कुंजी (API Key)</label>
                <input
                  type="password"
                  required
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder="उदा. AIzaSy..."
                  className="w-full font-mono border border-gray-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50 dark:bg-zinc-800/40 text-gray-800 dark:text-zinc-200"
                />
              </div>

              {/* Editable Prompt Presets */}
              <div className="border-t border-gray-150 dark:border-zinc-800 pt-4 space-y-4">
                <span className="block text-2xs font-mono uppercase text-gray-400 font-black tracking-wider">संपादकीय प्रॉम्प्ट्स कस्टमाइज़ेशन (Prompt Presets)</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Preset 1 */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-red-500 font-bold mb-1">💥 तड़क-भड़क (Flashy Style)</label>
                    <textarea
                      rows={3}
                      value={aiPresets.flashy}
                      onChange={(e) => setAiPresets({ ...aiPresets, flashy: e.target.value })}
                      className="w-full border border-gray-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded-lg p-2 bg-gray-50 dark:bg-zinc-800/30 text-gray-850 dark:text-zinc-200 leading-normal"
                    />
                  </div>

                  {/* Preset 2 */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-pink-500 font-bold mb-1">🤝 भावुक (Emotional Style)</label>
                    <textarea
                      rows={3}
                      value={aiPresets.emotional}
                      onChange={(e) => setAiPresets({ ...aiPresets, emotional: e.target.value })}
                      className="w-full border border-gray-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded-lg p-2 bg-gray-50 dark:bg-zinc-800/30 text-gray-850 dark:text-zinc-200 leading-normal"
                    />
                  </div>

                  {/* Preset 3 */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-indigo-500 font-bold mb-1">⚖️ संवेदनशील (Neutral / Sensitive)</label>
                    <textarea
                      rows={3}
                      value={aiPresets.sensitive}
                      onChange={(e) => setAiPresets({ ...aiPresets, sensitive: e.target.value })}
                      className="w-full border border-gray-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded-lg p-2 bg-gray-50 dark:bg-zinc-800/30 text-gray-850 dark:text-zinc-200 leading-normal"
                    />
                  </div>

                  {/* Preset 4 */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-500 font-bold mb-1">🧠 विश्लेषणात्मक (Analytical)</label>
                    <textarea
                      rows={3}
                      value={aiPresets.analytical}
                      onChange={(e) => setAiPresets({ ...aiPresets, analytical: e.target.value })}
                      className="w-full border border-gray-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded-lg p-2 bg-gray-50 dark:bg-zinc-800/30 text-gray-850 dark:text-zinc-200 leading-normal"
                    />
                  </div>
                </div>
              </div>

              {/* Customizable Category Presets */}
              <div className="border-t border-gray-150 dark:border-zinc-800 pt-4 space-y-4">
                <span className="block text-2xs font-mono uppercase text-gray-400 font-black tracking-wider">
                  📋 श्रेणी कवर फोटो प्रीसेट्स कस्टमाइज़ेशन (Category Presets Customization)
                </span>
                <p className="text-2xs text-gray-500 dark:text-zinc-400 leading-normal">
                  यहाँ से आप समाचार बनाते समय उपयोग में आने वाले श्रेणी-विशिष्ट कवर फ़ोटो के लिंक्स (Unsplash या अन्य इमेज URL) को बदल सकते हैं:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
                  {categories.map((cat) => (
                    <div key={cat.id}>
                      <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">
                        {cat.id} ({cat.name_hi})
                      </label>
                      <input
                        type="text"
                        value={categoryPresets[cat.id] || ""}
                        onChange={(e) => setCategoryPresets({ ...categoryPresets, [cat.id]: e.target.value })}
                        placeholder={`${cat.name_en} image URL`}
                        className="w-full border border-gray-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded-lg p-2 bg-gray-50 dark:bg-zinc-800/30 text-gray-850 dark:text-zinc-200 text-2xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Management */}
              <div className="border-t border-gray-150 dark:border-zinc-800 pt-4 space-y-4">
                <span className="block text-2xs font-mono uppercase text-gray-400 font-black tracking-wider">
                  📂 श्रेणियां (Category Management)
                </span>
                <p className="text-2xs text-gray-500 dark:text-zinc-400 leading-normal">
                  यहाँ से आप समाचार पोर्टल की श्रेणियों को प्रबंधित कर सकते हैं। आप नई श्रेणियां जोड़ सकते हैं या मौजूदा श्रेणियों को हटा सकते हैं:
                </p>

                {/* Categories Table/List */}
                <div className="border rounded-lg overflow-hidden border-gray-250 dark:border-zinc-800 max-h-48 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-2xs font-body">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 font-mono text-gray-500 text-[10px] uppercase font-bold">
                        <th className="p-2 pl-3">ID (English, unique)</th>
                        <th className="p-2">English नाम</th>
                        <th className="p-2">हिन्दी नाम</th>
                        <th className="p-2 text-right pr-3">कार्रवाई</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                      {categories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/20">
                          <td className="p-2 pl-3 font-mono text-brand-red font-semibold">{cat.id}</td>
                          <td className="p-2 text-gray-855 dark:text-zinc-200 font-medium">{cat.name_en}</td>
                          <td className="p-2 text-gray-855 dark:text-zinc-200 font-semibold">{cat.name_hi}</td>
                          <td className="p-2 text-right pr-3">
                            <button
                              type="button"
                              onClick={() => {
                                if (categories.length <= 1) {
                                  alert("कम से कम एक श्रेणी का होना अनिवार्य है!");
                                  return;
                                }
                                if (confirm(`क्या आप वाकई '${cat.name_hi}' श्रेणी को हटाना चाहते हैं?`)) {
                                  const updated = categories.filter((c) => c.id !== cat.id);
                                  setCategories(updated);
                                  persistCategories(updated);
                                }
                              }}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Category Form row */}
                <div className="bg-gray-50/50 dark:bg-zinc-800/10 p-3 rounded-lg border border-gray-150 dark:border-zinc-800 space-y-3">
                  <span className="block text-[10px] font-mono uppercase text-gray-500 font-bold">
                    ➕ नई श्रेणी जोड़ें (Add New Category)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase text-gray-400 font-mono mb-1">अद्वितीय ID (उदा: crime)</label>
                      <input
                        type="text"
                        value={newCatId}
                        onChange={(e) => setNewCatId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                        placeholder="Unique lower ID"
                        className="w-full border border-gray-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded p-1.5 bg-white dark:bg-zinc-800 text-[11px] text-gray-800 dark:text-zinc-150"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase text-gray-400 font-mono mb-1">अंग्रेज़ी नाम (उदा: Crime)</label>
                      <input
                        type="text"
                        value={newCatNameEn}
                        onChange={(e) => setNewCatNameEn(e.target.value)}
                        placeholder="English Name"
                        className="w-full border border-gray-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded p-1.5 bg-white dark:bg-zinc-800 text-[11px] text-gray-800 dark:text-zinc-150"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase text-gray-400 font-mono mb-1">हिन्दी नाम (उदा: अपराध)</label>
                      <input
                        type="text"
                        value={newCatNameHi}
                        onChange={(e) => setNewCatNameHi(e.target.value)}
                        placeholder="Hindi Name"
                        className="w-full border border-gray-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded p-1.5 bg-white dark:bg-zinc-800 text-[11px] text-gray-800 dark:text-zinc-150"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newCatId || !newCatNameEn || !newCatNameHi) {
                          alert("कृपया तीनों फ़ील्ड (ID, English नाम, हिन्दी नाम) भरें!");
                          return;
                        }
                        if (categories.some((c) => c.id === newCatId)) {
                          alert("यह श्रेणी ID पहले से ही मौजूद है! कृपया कोई दूसरी ID चुनें।");
                          return;
                        }
                        const newCat = { id: newCatId, name_en: newCatNameEn, name_hi: newCatNameHi };
                        const updated = [...categories, newCat];
                        setCategories(updated);
                        
                        // Prefill a nice default Unsplash image preset for this category
                        const updatedPresets = {
                          ...categoryPresets,
                          [newCatId]: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=600"
                        };
                        setCategoryPresets(updatedPresets);

                        persistCategories(updated, updatedPresets);

                        setNewCatId("");
                        setNewCatNameEn("");
                        setNewCatNameHi("");
                      }}
                      className="bg-brand-red/90 hover:bg-brand-red text-white text-2xs p-1.5 px-4 rounded font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> श्रेणी जोड़ें
                    </button>
                  </div>
                </div>
              </div>

              {aiSaved && (
                <p className={`text-xs font-bold flex items-center gap-1 p-2 rounded ${
                  syncStatus === "connected" ? "text-green-600 bg-green-50 dark:bg-green-950/20" : "text-amber-600 bg-amber-50 dark:bg-amber-950/20"
                }`}>
                  {syncStatus === "connected" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {aiSavedMessage}
                </p>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-brand-red hover:bg-[#9e0010] text-white p-2.5 px-6 rounded-lg font-label-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  AI सेटिंग्स सेव करें
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: CLOUDINARY CONFIGURATION SETTINGS */}
        {activeTab === "cloudinary" && (
          <div className="max-w-2xl mx-auto bg-white border rounded-xl p-6 shadow-md relative overflow-hidden">
            <div className="h-1.5 bg-brand-red absolute top-0 left-0 right-0"></div>
            
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 bg-brand-red/10 rounded-lg text-brand-red">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-[#111827] text-base">
                  Cloudinary मीडिया स्टोरेज सेटिंग्स
                </h3>
                <p className="text-2xs text-gray-500 font-body">
                  क्लाउड स्टोरेज में सीधे समाचारों की फोटो अपलोड करने के लिए अपने Cloudinary क्रेडेंशियल्स दर्ज करें।
                </p>
              </div>
            </div>

            {/* Configuration Status Alert */}
            <div className="mb-6 font-body text-xs">
              {cldCloudName && cldUploadPreset ? (
                <div className="p-3 bg-green-50 border border-green-200/50 rounded-lg flex items-start gap-2.5 text-green-800">
                  <Check className="w-4 h-4 mt-0.5 text-green-600 shrink-0" />
                  <div>
                    <span className="font-bold block text-2xs uppercase tracking-wider text-green-700">क्लाउड स्टोरेज सक्रिय है</span>
                    समाचार पोर्टल पर सीधे फोटो अपलोड सेवा चालू है। नई रपट बनाते समय आप कंप्यूटर से सीधे फोटो अपलोड कर सकते हैं।
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-250/50 rounded-lg flex items-start gap-2.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold block text-2xs uppercase tracking-wider text-amber-700">क्रेडेंशियल्स आवश्यक हैं</span>
                    फोटो अपलोड करने के लिए कृपया अपना Cloud Name और Unsigned Upload Preset दर्ज करें। आप अपने Cloudinary कंसोल में जाकर एक unsigned preset बना सकते हैं।
                  </div>
                </div>
              )}
            </div>

            {/* Cloudinary credentials form */}
            <form onSubmit={handleSaveCloudinaryConfig} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-gray-500 mb-1 font-bold">Cloud Name (क्लाउड नाम)</label>
                  <input
                    type="text"
                    required
                    value={cldCloudName}
                    onChange={(e) => setCldCloudName(e.target.value)}
                    placeholder="उदा. dangi-portal"
                    className="w-full border border-gray-200 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50/50 text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-gray-500 mb-1 font-bold">Unsigned Upload Preset</label>
                  <input
                    type="text"
                    required
                    value={cldUploadPreset}
                    onChange={(e) => setCldUploadPreset(e.target.value)}
                    placeholder="उदा. samachar_preset"
                    className="w-full border border-gray-200 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50/50 text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-gray-500 mb-1 font-bold">API Key (API कुंजी)</label>
                <input
                  type="text"
                  value={cldApiKey}
                  onChange={(e) => setCldApiKey(e.target.value)}
                  placeholder="उदा. 435186988213611"
                  className="w-full border border-gray-200 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50/50 text-gray-800"
                />
              </div>

              {cldConfigSaved && (
                <p className="text-xs text-green-600 font-label-bold flex items-center gap-1 bg-green-50 p-2 rounded">
                  <Check className="w-4 h-4" /> Cloudinary सेटिंग्स सफलतापूर्वक सुरक्षित की गईं!
                </p>
              )}

              <div className="flex justify-end pt-2 border-b pb-5 border-gray-100">
                <button
                  type="submit"
                  className="bg-brand-red hover:bg-[#9e0010] text-white p-2.5 px-6 rounded-lg font-label-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer font-sans"
                >
                  क्लाउड क्रेडेंशियल्स सेव करें
                </button>
              </div>
            </form>

            {/* LIVE TEST UPLOADER COMPONENT */}
            {cldCloudName && cldUploadPreset && (
              <div className="mt-5 space-y-3 text-xs">
                <h4 className="font-display font-bold text-brand-dark flex items-center gap-1.5">
                  🧪 लाइव अपलोड टेस्ट यूटिलिटी (Connection Live Test)
                </h4>
                <p className="text-2xs text-gray-500 font-body leading-normal">
                  यहाँ एक फोटो का चयन करें और अपलोड बटन दबाएँ ताकि यह जाँचा जा सके कि आपके द्वारा दिए गए क्रेडेंशियल्स सही ढंग से काम कर रहे हैं या नहीं:
                </p>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200/60 space-y-3 font-sans">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      id="cld-test-file-input"
                      onChange={(e) => setCldTestFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="cld-test-file-input"
                      className="flex items-center gap-1.5 p-2 px-4 border border-dashed border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-50 cursor-pointer text-xs font-semibold shadow-xs"
                    >
                      <Image className="w-4 h-4 text-gray-400" />
                      {cldTestFile ? cldTestFile.name : "फोटो फ़ाइल चुनें"}
                    </label>

                    {cldTestFile && (
                      <button
                        type="button"
                        disabled={cldTestUploading}
                        onClick={handleTestCloudinaryUpload}
                        className="bg-brand-red hover:bg-[#9e0010] text-white text-xs p-2 px-5 rounded-lg font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {cldTestUploading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> अपलोड हो रहा है... ({cldTestProgress}%)
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" /> टेस्ट अपलोड करें
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Upload Progress Bar */}
                  {cldTestUploading && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-green-600 h-1.5 transition-all duration-150"
                        style={{ width: `${cldTestProgress}%` }}
                      ></div>
                    </div>
                  )}

                  {/* Result Displays */}
                  {cldTestResult && (
                    <div className="p-3 bg-green-50/75 border border-green-200/50 rounded-lg space-y-2">
                      <span className="text-green-800 font-bold text-2xs block">✓ कनेक्शन सफल! फोटो क्लाउड पर सुरक्षित हो गई:</span>
                      <div className="flex gap-3 items-start">
                        <div className="w-20 aspect-video rounded overflow-hidden border bg-white shrink-0">
                          <img src={cldTestResult} className="w-full h-full object-cover" alt="Cloudinary test result" />
                        </div>
                        <div className="space-y-1 overflow-hidden">
                          <input
                            type="text"
                            readOnly
                            value={cldTestResult}
                            className="w-full text-2xs p-1 px-2 border rounded bg-white font-mono text-gray-700 outline-none select-all"
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                          />
                          <p className="text-[10px] text-gray-450 leading-relaxed font-body">
                            ऊपर दिए लिंक पर क्लिक करके आप फोटो देख सकते हैं। यह सुनिश्चित करता है कि आपकी Cloudinary क्रेडेंशियल्स पूरी तरह से सही हैं!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {cldTestError && (
                    <div className="p-3 bg-red-50 border border-red-200/50 rounded-lg flex items-start gap-2 text-red-800 leading-relaxed">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-2xs uppercase tracking-wider text-red-700 block">अपलोड त्रुटि (Connection Error)</span>
                        {cldTestError}
                        <p className="text-[10px] text-red-700/80 mt-1 font-body leading-normal">
                          कृपया जाँचे कि आपका Cloud Name और Upload Preset सही हैं और Cloudinary में 'Unsigned uploads' विकल्प इनेबल्ड है।
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>


      {/* TAB 6: WEB STORIES MANAGER */}
      {activeTab === "webstories" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-base text-brand-dark">📸 वेब स्टोरीज़ प्रबंधन</h2>
              <p className="text-xs text-gray-500 mt-0.5">मुख्यपृष्ठ पर दिखाई देने वाली विज़ुअल स्टोरीज़ यहाँ से जोड़ें, संपादित करें या हटाएँ।</p>
            </div>
            <button
              onClick={() => { setShowStoryForm(true); setEditingStoryIdx(null); setStoryFormTitle(""); setStoryFormCover(""); setStoryFormSlides([{ image: "", caption: "" }]); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-red text-white text-xs font-bold rounded-lg shadow-sm hover:bg-[#9e0010] cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> नई स्टोरी जोड़ें
            </button>
          </div>
          {showStoryForm && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm">{editingStoryIdx !== null ? "स्टोरी संपादित करें" : "नई वेब स्टोरी"}</h3>
              <div>
                <label className="block text-xs font-mono uppercase text-gray-500 mb-1">शीर्षक (Title)</label>
                <input type="text" value={storyFormTitle} onChange={e => setStoryFormTitle(e.target.value)} placeholder="स्टोरी का शीर्षक..." className="w-full text-xs border border-gray-200 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-gray-500 mb-1">कवर इमेज URL</label>
                <input type="text" value={storyFormCover} onChange={e => setStoryFormCover(e.target.value)} placeholder="https://..." className="w-full text-xs border border-gray-200 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50 font-mono" />
                {storyFormCover && <img src={storyFormCover} className="mt-2 h-24 w-auto rounded-lg object-cover border" alt="cover preview" />}
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-gray-500 mb-2">स्लाइड्स</label>
                <div className="space-y-3">
                  {storyFormSlides.map((slide, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-gray-400 uppercase">स्लाइड {idx + 1}</span>
                        {storyFormSlides.length > 1 && (
                          <button onClick={() => setStoryFormSlides(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 text-[10px] font-bold cursor-pointer hover:text-red-700">✕ हटाएँ</button>
                        )}
                      </div>
                      <input type="text" value={slide.image} onChange={e => setStoryFormSlides(prev => prev.map((s, i) => i === idx ? { ...s, image: e.target.value } : s))} placeholder="इमेज URL..." className="w-full text-xs border border-gray-200 outline-none rounded p-2 bg-white font-mono" />
                      <input type="text" value={slide.caption} onChange={e => setStoryFormSlides(prev => prev.map((s, i) => i === idx ? { ...s, caption: e.target.value } : s))} placeholder="कैप्शन..." className="w-full text-xs border border-gray-200 outline-none rounded p-2 bg-white" />
                    </div>
                  ))}
                </div>
                <button onClick={() => setStoryFormSlides(prev => [...prev, { image: "", caption: "" }])} className="mt-2 text-xs text-brand-red font-bold cursor-pointer hover:underline">+ स्लाइड जोड़ें</button>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <button onClick={() => setShowStoryForm(false)} className="flex-1 py-2 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer">रद्द करें</button>
                <button onClick={handleStorySubmit} className="flex-1 py-2 text-xs bg-brand-red text-white rounded-lg font-bold shadow-sm hover:bg-[#9e0010] cursor-pointer">
                  {editingStoryIdx !== null ? "अपडेट करें" : "स्टोरी सहेजें"}
                </button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {webStoriesAdmin.map((story, idx) => (
              <div key={story.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                <div className="relative h-36 bg-gray-100">
                  <img src={story.coverImage} alt={story.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-2 left-3 right-3 text-white text-xs font-bold line-clamp-2">{story.title}</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-400">{story.slides.length} स्लाइड्स</span>
                  <div className="flex gap-3">
                    <button onClick={() => { setEditingStoryIdx(idx); setStoryFormTitle(story.title); setStoryFormCover(story.coverImage); setStoryFormSlides([...story.slides]); setShowStoryForm(true); }} className="text-xs text-blue-600 font-bold cursor-pointer hover:underline flex items-center gap-0.5"><Edit3 className="w-3 h-3" /> संपादित</button>
                    <button onClick={() => { if (window.confirm("इस स्टोरी को हटाएँ?")) saveWebStories(webStoriesAdmin.filter((_, i) => i !== idx)); }} className="text-xs text-red-500 font-bold cursor-pointer hover:underline flex items-center gap-0.5"><Trash2 className="w-3 h-3" /> हटाएँ</button>
                  </div>
                </div>
              </div>
            ))}
            {webStoriesAdmin.length === 0 && <div className="col-span-full text-center py-12 text-gray-400 text-sm">कोई वेब स्टोरी नहीं है।</div>}
          </div>
        </div>
      )}

      {/* TAB 7: NEWSLETTER SUBSCRIBERS */}
      {activeTab === "newsletter" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-base text-brand-dark">📧 न्यूज़लेटर सब्सक्राइबर्स</h2>
              <p className="text-xs text-gray-500 mt-0.5">वेबसाइट पर न्यूज़लेटर फ़ॉर्म भरने वाले सभी पाठकों की सूची।</p>
            </div>
            <button onClick={loadSubscribers} className="text-xs text-brand-red font-bold cursor-pointer hover:underline">🔄 रिफ्रेश</button>
          </div>
          {subsLoading ? (
            <div className="text-center py-10 text-gray-400 text-sm">लोड हो रहा है...</div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
              <p className="text-gray-400 text-sm">अभी कोई सब्सक्राइबर नहीं है।</p>
              <p className="text-xs text-gray-400 mt-1">Supabase कनेक्ट करें या पाठकों का इंतज़ार करें।</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
                <span className="text-xs font-mono text-gray-500 uppercase font-bold">कुल: {subscribers.length} सब्सक्राइबर्स</span>
                <button
                  onClick={() => { const csv = "Email,Date\n" + subscribers.map(s => `${s.email},${s.created_at || ""}`).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "subscribers.csv"; a.click(); }}
                  className="text-xs text-brand-red font-bold cursor-pointer hover:underline"
                >⬇ CSV डाउनलोड</button>
              </div>
              <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {subscribers.map((sub, idx) => (
                  <div key={idx} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center text-[10px] font-black">{sub.email[0].toUpperCase()}</div>
                      <span className="text-sm font-medium text-gray-800">{sub.email}</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">{sub.created_at ? new Date(sub.created_at).toLocaleDateString("hi-IN") : "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 8: REACTIONS VIEWER */}
      {activeTab === "reactions" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-base text-brand-dark">👍 लेख रिएक्शन्स</h2>
              <p className="text-xs text-gray-500 mt-0.5">पाठकों द्वारा दी गई प्रतिक्रियाएँ — प्रत्येक समाचार लेख पर।</p>
            </div>
            <button onClick={loadReactions} className="text-xs text-brand-red font-bold cursor-pointer hover:underline">🔄 रिफ्रेश</button>
          </div>
          {reactionsLoading ? (
            <div className="text-center py-10 text-gray-400 text-sm">लोड हो रहा है...</div>
          ) : reactionStats.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
              <p className="text-2xl mb-2">😶</p>
              <p className="text-gray-400 text-sm">अभी कोई रिएक्शन नहीं है।</p>
              <p className="text-xs text-gray-400 mt-1">Supabase कनेक्ट होने पर रिएक्शन डेटा यहाँ दिखेगा।</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-3 bg-gray-50 border-b">
                <span className="text-xs font-mono text-gray-500 uppercase font-bold">रिएक्शन वाले {reactionStats.length} लेख</span>
              </div>
              <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {reactionStats.sort((a, b) => (b.like + b.love + b.wow + b.sad) - (a.like + a.love + a.wow + a.sad)).map((stat, idx) => (
                  <div key={idx} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 gap-4">
                    <span className="text-xs font-medium text-gray-800 line-clamp-1 flex-1">{stat.title}</span>
                    <div className="flex items-center gap-3 text-sm shrink-0">
                      <span title="पसंद">👍 {stat.like}</span>
                      <span title="प्यार">❤️ {stat.love}</span>
                      <span title="वाह">😮 {stat.wow}</span>
                      <span title="दुःख">😢 {stat.sad}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 8.5: COMMENTS MODERATION */}
      {activeTab === "comments" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-base text-brand-dark">💬 टिप्पणियाँ (Comment Moderation)</h2>
              <p className="text-xs text-gray-500 mt-0.5">साइट के सभी पाठकों की टिप्पणियों का प्रबंधन करें।</p>
            </div>
            <button
              onClick={loadComments}
              className="text-xs text-brand-red font-bold cursor-pointer hover:underline"
            >
              🔄 रिफ्रेश
            </button>
          </div>
          {commentsLoading ? (
            <div className="text-center py-10 text-gray-400 text-sm">लोड हो रहा है...</div>
          ) : commentsList.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
              <p className="text-2xl mb-2">💬</p>
              <p className="text-gray-400 text-sm font-medium">अभी कोई टिप्पणी नहीं है।</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-body">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 font-mono text-gray-500 text-[10px] uppercase font-bold">
                      <th className="p-3 pl-4">पाठक</th>
                      <th className="p-3">टिप्पणी</th>
                      <th className="p-3">लेख</th>
                      <th className="p-3">तारीख</th>
                      <th className="p-3 text-right pr-4">कार्रवाई</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {commentsList.map((com) => (
                      <tr key={com.id} className="hover:bg-gray-50/50">
                        <td className="p-3 pl-4">
                          <span className="font-bold text-gray-800 block">{com.author_name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{com.author_email}</span>
                        </td>
                        <td className="p-3 text-gray-750 font-normal break-words max-w-xs">{com.content}</td>
                        <td className="p-3 text-gray-600 font-medium max-w-xs truncate" title={com.article_title}>
                          {com.article_title}
                        </td>
                        <td className="p-3 text-gray-400 font-mono text-[10px]">
                          {new Date(com.created_at).toLocaleDateString("hi-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="p-3 text-right pr-4">
                          <button
                            onClick={() => handleDeleteComment(com.id)}
                            className="text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer transition-colors"
                          >
                            हटाएँ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </div>
    )}

      {/* TAB 9: SITE SETTINGS */}
      {activeTab === "site" && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h2 className="font-display font-extrabold text-base text-brand-dark">⚙️ साइट सेटिंग्स</h2>
            <p className="text-xs text-gray-500 mt-0.5">पोर्टल का नाम, टैगलाइन और ब्रेकिंग न्यूज़ टिकर के डिफ़ॉल्ट टेक्स्ट नियंत्रित करें।</p>
          </div>
          <form
            onSubmit={async e => {
              e.preventDefault();
              const saved = await newsService.saveSiteSettings({ site_title: siteTitle, site_tagline: siteTagline, marquee_text: siteMarquee });
              setSiteSettingsSaved(true);
              if (saved) {
                setAiSavedMessage("✅ सेटिंग्स Supabase में सहेजी गई!");
              } else {
                setAiSavedMessage("📦 localStorage में सहेजा गया (Supabase ऑफलाइन)");
              }
              setTimeout(() => { setSiteSettingsSaved(false); setAiSavedMessage(""); }, 3000);
            }}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-5"
          >
            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 mb-1.5">साइट का नाम (Site Title)</label>
              <input type="text" value={siteTitle} onChange={e => setSiteTitle(e.target.value)} className="w-full text-sm border border-gray-200 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50 transition-all" />
              <p className="text-[10px] text-gray-400 mt-1">हेडर में लोगो के बगल में दिखेगा।</p>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 mb-1.5">टैगलाइन (Tagline)</label>
              <input type="text" value={siteTagline} onChange={e => setSiteTagline(e.target.value)} className="w-full text-sm border border-gray-200 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50 transition-all" />
              <p className="text-[10px] text-gray-400 mt-1">लोगो के नीचे छोटे अक्षरों में दिखेगा।</p>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-gray-500 mb-1.5">ब्रेकिंग न्यूज़ टिकर — डिफ़ॉल्ट टेक्स्ट</label>
              <textarea rows={2} value={siteMarquee} onChange={e => setSiteMarquee(e.target.value)} className="w-full text-xs border border-gray-200 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50 transition-all resize-none" />
              <p className="text-[10px] text-gray-400 mt-1">जब कोई ब्रेकिंग न्यूज़ न हो, तब यह टेक्स्ट मार्की में चलेगा।</p>
            </div>
            <div className="pt-4 border-t flex items-center justify-between">
              {siteSettingsSaved && <span className="text-green-600 text-xs font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> सेटिंग्स सहेजी गई!</span>}
              <button type="submit" className="ml-auto px-6 py-2 bg-brand-red text-white text-xs font-bold rounded-lg shadow-sm hover:bg-[#9e0010] cursor-pointer transition-all flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> सेटिंग्स सहेजें
              </button>
            </div>
          </form>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 leading-relaxed">
            <p className="font-bold mb-1">💡 जिला सूची</p>
            <p>साइडबार में दिखने वाले जिले <code className="bg-amber-100 px-1 rounded font-mono">CHHATTISGARH_DISTRICTS</code> से आते हैं — ये सभी 32 छत्तीसगढ़ जिले पहले से लोड हैं।</p>
          </div>
        </div>
      )}

      {/* MODAL WINDOW FOR CREATE / EDIT FORM */}
      {showFormModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto backdrop-blur-xs">
          <div className={`bg-white w-full rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col transition-all duration-300 ${isEditorFullscreen ? "max-w-5xl" : "max-w-2xl"}`}>
            <div className="bg-gray-50 px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-display font-extrabold text-sm text-brand-dark">
                  {editingArticleId ? "समाचार संपादित करें" : "नया समाचार प्रकाशित करें"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setAiError("");
                    setShowAIHelper(true);
                  }}
                  className="bg-brand-red/10 hover:bg-brand-red/20 text-brand-red p-1 px-3 rounded text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs animate-bounce"
                >
                  <Sparkles className="w-3.5 h-3.5" /> AI असिस्टेंट
                </button>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                बंद करें
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="overflow-y-auto p-5 sm:p-6 space-y-4 text-xs font-body">
              {/* Title Input */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-gray-500 mb-1">समाचार मुख्य शीर्षक (Headline)</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="उदा. दिल्ली में भारी बारिश से जनजीवन अस्त व्यस्त, सड़कों पर बढ़ा आवागमन"
                  className="w-full text-sm border border-gray-200 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50/50"
                />
              </div>

              {!isEditorFullscreen && (
                <>
                  {/* Grid Category / Author / District */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-gray-500 mb-1 font-bold">कैटेगरी</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full border border-gray-200 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50 text-xs"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name_hi} ({c.name_en})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-gray-500 mb-1 font-bold">जिला / शहर टैग (District Tag)</label>
                      <select
                        value={formDistrict}
                        onChange={(e) => setFormDistrict(e.target.value)}
                        className="w-full border border-gray-200 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50 text-xs"
                      >
                        <option value="">कोई विशेष जिला नहीं (None)</option>
                        {CHHATTISGARH_DISTRICTS.map((dist) => (
                          <option key={dist} value={dist}>
                            {dist}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-gray-500 mb-1 font-bold">लेखक का नाम</label>
                      <input
                        type="text"
                        required
                        value={formAuthor}
                        onChange={(e) => setFormAuthor(e.target.value)}
                        placeholder="उदा. विशेष संवाददाता"
                        className="w-full text-xs border border-gray-200 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50/50"
                      />
                    </div>
                  </div>

                  {/* Cover Image URL, Cloudinary Upload & Preset Selection */}
                  <div className="space-y-3">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Left side: Cover Image URL & Upload button */}
                      <div className="flex-1 space-y-2">
                        <label className="block text-[11px] font-mono uppercase text-gray-500 font-bold">कवर फोटो URL या अपलोड (Cover Image URL or Cloud Upload)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={formImageUrl}
                            onChange={(e) => setFormImageUrl(e.target.value)}
                            placeholder="उदा. https://images.unsplash.com/photo-..."
                            className="flex-1 text-xs font-mono border border-gray-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50/50 dark:bg-zinc-800/40 text-gray-800 dark:text-zinc-150"
                          />
                        </div>

                        {/* Cloudinary Upload Area */}
                        <div className="bg-gray-50/50 dark:bg-zinc-800/10 p-3 rounded-lg border border-gray-200/50 dark:border-zinc-800 space-y-2.5 font-sans">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono uppercase font-black tracking-wider flex items-center gap-1">
                              <Cloud className="w-3.5 h-3.5 text-brand-red" /> Cloudinary त्वरित फोटो अपलोड (Quick Upload)
                            </span>
                            {isCloudinaryConfigured() && (
                              <span className="text-[9px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold">सक्रिय (Active)</span>
                            )}
                          </div>

                          {isCloudinaryConfigured() ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  id="form-cover-file-input"
                                  disabled={cldUploading}
                                  onChange={handleCoverPhotoUpload}
                                  className="hidden"
                                />
                                <label
                                  htmlFor="form-cover-file-input"
                                  className="flex items-center gap-1.5 p-2 px-4 border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg text-gray-655 dark:text-zinc-350 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-750 cursor-pointer text-xs font-bold shadow-2xs transition-all w-full justify-center"
                                >
                                  {cldUploading ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-red" />
                                      <span>अपलोड हो रहा है... ({cldUploadProgress}%)</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-3.5 h-3.5 text-gray-400" />
                                      <span>कम्प्यूटर से फोटो अपलोड करें (Select File)</span>
                                    </>
                                  )}
                                </label>
                              </div>

                              {cldUploading && (
                                <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-1 overflow-hidden">
                                  <div
                                    className="bg-brand-red h-1 transition-all duration-150"
                                    style={{ width: `${cldUploadProgress}%` }}
                                  ></div>
                                </div>
                              )}

                              {cldUploadError && (
                                <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" /> {cldUploadError}
                                </p>
                              )}
                              
                              {!cldUploading && !cldUploadError && formImageUrl.includes("cloudinary.com") && (
                                <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                                  <Check className="w-3 h-3 text-green-500 shrink-0" /> फोटो Cloudinary पर सफलतापूर्वक अपलोड हो गई!
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="p-2 border border-dashed border-amber-200/50 bg-amber-50/30 rounded text-amber-800 leading-normal flex items-start gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-[10px]">फोटो अपलोड अक्षम है:</span>
                                <p className="text-[10px] text-gray-500 dark:text-zinc-400 leading-normal mt-0.5">
                                  इसे सक्षम करने के लिए पहले{" "}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowFormModal(false);
                                      setActiveTab("cloudinary");
                                    }}
                                    className="text-brand-red underline font-bold hover:text-[#9e0010] cursor-pointer"
                                  >
                                    Cloudinary सेटिंग्स tab
                                  </button>{" "}
                                  में जाकर क्रेडेंशियल्स दर्ज करें।
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side: Live Image Preview */}
                      <div className="w-full md:w-48 space-y-2">
                        <label className="block text-[11px] font-mono uppercase text-gray-500 font-bold">कवर फोटो पूर्वावलोकन (Preview)</label>
                        <div className="w-full h-[115px] border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-zinc-800 flex items-center justify-center relative group">
                          {formImageUrl ? (
                            <>
                              <img
                                src={formImageUrl}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=600";
                                }}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[9px] text-white bg-black/60 px-2 py-0.5 rounded-full font-bold">सक्रिय कवर</span>
                              </div>
                            </>
                          ) : (
                            <div className="text-center p-3 text-gray-400">
                              <Image className="w-6 h-6 mx-auto mb-1 opacity-40" />
                              <span className="text-[9px] block">कोई फोटो नहीं</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* PRESETS GRID ROW */}
                    <div className="mt-2">
                      <span className="block text-[10px] text-gray-400 dark:text-zinc-500 font-mono mb-1.5">श्रेणी कस्टमाइज़्ड कवर प्रीसेट्स (Category Presets):</span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto custom-scrollbar p-0.5">
                        {categories.map((item) => {
                          const img = categoryPresets[item.id] || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=600";
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setFormImageUrl(img);
                                setFormCategory(item.id);
                              }}
                              className={`group flex flex-col items-center p-1 border rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 transition-all ${
                                formImageUrl === img ? "border-brand-red ring-1 ring-brand-red/35" : "border-gray-200 dark:border-zinc-700"
                              }`}
                            >
                              <div className="w-full aspect-video rounded overflow-hidden bg-gray-200 dark:bg-zinc-700">
                                <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              </div>
                              <span className="text-[9px] font-bold mt-1 text-gray-600 dark:text-zinc-350">{item.name_hi}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Status and Scheduled For controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-gray-500 mb-1">प्रकाशन स्थिति (Status)</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full border border-gray-200 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50"
                      >
                        <option value="published">प्रकाशित (Published)</option>
                        <option value="draft">ड्राफ्ट (Draft)</option>
                        <option value="scheduled">शेड्यूल (Scheduled)</option>
                      </select>
                    </div>
                    
                    {formStatus === "scheduled" && (
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-gray-500 mb-1">शेड्यूल दिनांक और समय</label>
                        <input
                          type="datetime-local"
                          required
                          value={formScheduledFor}
                          onChange={(e) => setFormScheduledFor(e.target.value)}
                          className="w-full border border-gray-200 outline-none focus:border-brand-red rounded-lg p-2 bg-white text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Summary / Description */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-gray-500 mb-1">समाचार सारांश (Brief Summary)</label>
                    <input
                      type="text"
                      value={formSummary}
                      onChange={(e) => setFormSummary(e.target.value)}
                      placeholder="खबर का एक पंक्ति में संक्षिप्त विवरण (जैसे कि मुख्य समाचार ग्रिड में दिखेगा)"
                      className="w-full text-xs border border-gray-200 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50/50"
                    />
                  </div>

                  {/* Checkboxes for Breaking News, Video News, Featured Slider & Trending */}
                  <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 border">
                    <label className="flex items-center gap-2 cursor-pointer font-label-bold">
                      <input
                        type="checkbox"
                        checked={formIsBreaking}
                        onChange={(e) => setFormIsBreaking(e.target.checked)}
                        className="rounded border-gray-300 text-brand-red focus:ring-brand-red w-4 h-4"
                      />
                      <span>ब्रेकिंग न्यूज़ (Breaking)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-label-bold">
                      <input
                        type="checkbox"
                        checked={formIsFeatured}
                        onChange={(e) => setFormIsFeatured(e.target.checked)}
                        className="rounded border-gray-300 text-brand-red focus:ring-brand-red w-4 h-4"
                      />
                      <span>मुख्य स्लाइडर (Featured)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-label-bold">
                      <input
                        type="checkbox"
                        checked={formIsTrending}
                        onChange={(e) => setFormIsTrending(e.target.checked)}
                        className="rounded border-gray-300 text-brand-red focus:ring-brand-red w-4 h-4"
                      />
                      <span>ट्रेंडिंग न्यूज़ (Trending)</span>
                    </label>
                    
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer font-label-bold">
                        <input
                          type="checkbox"
                          checked={formIsVideo}
                          onChange={(e) => setFormIsVideo(e.target.checked)}
                          className="rounded border-gray-300 text-brand-red focus:ring-brand-red w-4 h-4"
                        />
                        <span>यह "वीडियो समाचार" है</span>
                      </label>
                      
                      {formIsVideo && (
                        <div className="pl-6">
                          <label className="block text-[10px] font-mono text-gray-400 uppercase mb-0.5">वीडियो अवधि (Duration)</label>
                          <input
                            type="text"
                            value={formVideoDuration}
                            onChange={(e) => setFormVideoDuration(e.target.value)}
                            placeholder="उदा. 04:15"
                            className="w-32 border border-gray-200 outline-none focus:border-brand-red rounded p-1.5 bg-white text-xs font-mono"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Editorial Content Text Area */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-150 dark:border-zinc-700 pb-1.5 mb-2.5 gap-2">
                  <label className="text-[11px] font-mono uppercase text-gray-500 font-bold flex items-center gap-1.5">
                    समाचार मुख्य रिपोर्ट (Detailed Report)
                    {isEditorFullscreen && (
                      <span className="bg-brand-red/10 text-brand-red p-0.5 px-2 rounded-full text-[9px] font-mono font-bold animate-pulse">
                        पूर्णाकार संपादक सक्रिय
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditorFullscreen(!isEditorFullscreen)}
                      className={`p-1 px-3 rounded text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm ${
                        isEditorFullscreen
                          ? "bg-gray-800 hover:bg-black text-white"
                          : "bg-gray-100 hover:bg-gray-250 text-gray-700"
                      }`}
                    >
                      {isEditorFullscreen ? "↙️ सामान्य संपादक (Compact Editor)" : "↗️ पूर्णाकार संपादक (Fullscreen Editor)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const previewPayload = {
                          id: "preview",
                          title: formTitle || "बिना शीर्षक का समाचार",
                          content: formContent || "कोई रपट विवरण नहीं है।",
                          image_url: formImageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=600",
                          category: formCategory,
                          published_at: "पूर्वावलोकन • अभी",
                          is_video: formIsVideo,
                          video_duration: formIsVideo ? formVideoDuration || "03:00" : undefined,
                          is_breaking: formIsBreaking,
                          author: formAuthor || "लेखक",
                          summary: formSummary || "",
                          views: 0
                        };
                        localStorage.setItem("samachar_plus_preview_draft", JSON.stringify(previewPayload));
                        window.open(window.location.origin + "/?article=preview", "_blank");
                      }}
                      className="p-1 px-3 bg-brand-red text-white hover:bg-[#9e0010] rounded text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                    >
                      🔍 नई टैब में देखें (Preview in New Tab)
                    </button>
                  </div>
                </div>
                
                <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-gray-50/50 dark:bg-zinc-800/40">
                  {/* WYSIWYG Toolbar */}
                  <div className="bg-gray-100 dark:bg-zinc-800/80 border-b border-gray-200 dark:border-zinc-700 p-2 flex flex-wrap gap-1.5 select-none items-center">
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); execEditorCommand("bold"); }}
                      className="p-1.5 px-2.5 bg-white dark:bg-zinc-700 border dark:border-zinc-650 hover:bg-gray-50 dark:hover:bg-zinc-600 rounded text-xs font-bold text-gray-700 dark:text-zinc-200 cursor-pointer shadow-3xs hover:scale-101 active:scale-99 transition-all"
                      title="गहरा (Bold)"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); execEditorCommand("italic"); }}
                      className="p-1.5 px-2.5 bg-white dark:bg-zinc-700 border dark:border-zinc-650 hover:bg-gray-50 dark:hover:bg-zinc-600 rounded text-xs italic text-gray-700 dark:text-zinc-200 cursor-pointer shadow-3xs hover:scale-101 active:scale-99 transition-all"
                      title="तिरछा (Italic)"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); execEditorCommand("underline"); }}
                      className="p-1.5 px-2.5 bg-white dark:bg-zinc-700 border dark:border-zinc-650 hover:bg-gray-50 dark:hover:bg-zinc-600 rounded text-xs underline text-gray-700 dark:text-zinc-200 cursor-pointer shadow-3xs hover:scale-101 active:scale-99 transition-all"
                      title="रेखांकित (Underline)"
                    >
                      U
                    </button>
                    <div className="w-px h-5 bg-gray-250 dark:bg-zinc-700 mx-1" />
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); execEditorCommand("formatBlock", "<h1>"); }}
                      className="p-1.5 px-2.5 bg-white dark:bg-zinc-700 border dark:border-zinc-650 hover:bg-gray-50 dark:hover:bg-zinc-600 rounded text-xs font-bold text-gray-700 dark:text-zinc-200 cursor-pointer shadow-3xs hover:scale-101 active:scale-99 transition-all"
                      title="बड़ा शीर्षक (H1)"
                    >
                      H1
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); execEditorCommand("formatBlock", "<h2>"); }}
                      className="p-1.5 px-2.5 bg-white dark:bg-zinc-700 border dark:border-zinc-650 hover:bg-gray-50 dark:hover:bg-zinc-600 rounded text-xs font-bold text-gray-700 dark:text-zinc-200 cursor-pointer shadow-3xs hover:scale-101 active:scale-99 transition-all"
                      title="मध्यम शीर्षक (H2)"
                    >
                      H2
                    </button>
                    <div className="w-px h-5 bg-gray-250 dark:bg-zinc-700 mx-1" />
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); execEditorCommand("insertUnorderedList"); }}
                      className="p-1.5 px-2.5 bg-white dark:bg-zinc-700 border dark:border-zinc-650 hover:bg-gray-50 dark:hover:bg-zinc-600 rounded text-xs text-gray-700 dark:text-zinc-200 cursor-pointer shadow-3xs hover:scale-101 active:scale-99 transition-all"
                      title="बिंदु सूची (Bullet List)"
                    >
                      • सूची
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); execEditorCommand("insertOrderedList"); }}
                      className="p-1.5 px-2.5 bg-white dark:bg-zinc-700 border dark:border-zinc-650 hover:bg-gray-50 dark:hover:bg-zinc-600 rounded text-xs text-gray-700 dark:text-zinc-200 cursor-pointer shadow-3xs hover:scale-101 active:scale-99 transition-all"
                      title="क्रमवार सूची (Numbered List)"
                    >
                      1. सूची
                    </button>
                    <div className="w-px h-5 bg-gray-250 dark:bg-zinc-700 mx-1" />
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); insertLink(); }}
                      className="p-1.5 px-2.5 bg-white dark:bg-zinc-700 border dark:border-zinc-650 hover:bg-gray-50 dark:hover:bg-zinc-600 rounded text-xs text-gray-700 dark:text-zinc-200 cursor-pointer shadow-3xs hover:scale-101 active:scale-99 transition-all flex items-center gap-1"
                      title="हाइपरलिंक जोड़ें (Insert Link)"
                    >
                      🔗 लिंक
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); execEditorCommand("removeFormat"); }}
                      className="p-1.5 px-2.5 bg-white dark:bg-zinc-700 border dark:border-zinc-650 hover:bg-gray-50 dark:hover:bg-zinc-600 rounded text-xs text-red-500 cursor-pointer shadow-3xs hover:scale-101 active:scale-99 transition-all"
                      title="फ़ॉर्मेटिंग साफ़ करें (Clear Formatting)"
                    >
                      साफ़
                    </button>
                  </div>

                  {/* WYSIWYG Editing Field */}
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={(e) => setFormContent((e.target as HTMLDivElement).innerHTML)}
                    placeholder="समाचार की संपूर्ण रपट विस्तृत विवरण सहित यहाँ लिखें..."
                    className={`w-full outline-none p-3 bg-transparent text-gray-800 dark:text-zinc-150 leading-relaxed font-sans min-h-[180px] overflow-y-auto max-h-[60vh] prose dark:prose-invert max-w-none ${
                      isEditorFullscreen ? "min-h-[50vh]" : ""
                    }`}
                    style={{ minHeight: isEditorFullscreen ? "450px" : "180px" }}
                  />
                </div>
              </div>

               {formSubmitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2 text-[11px] leading-normal font-sans">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <span className="font-bold block text-red-800">डेटाबेस एरर: समाचार सहेजने में विफल</span>
                    <span>{formSubmitError}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="p-2 px-4 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 font-label-bold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="p-2 px-5 bg-brand-red hover:bg-[#9e0010] text-white rounded-lg font-label-bold shadow-sm cursor-pointer"
                >
                  {editingArticleId ? "संपादित रपट सहेजें" : "समाचार प्रकाशित करें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deletingArticleId && (
        <div className="fixed inset-0 z-[130] bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-xl border border-gray-250 p-6 shadow-2xl relative overflow-hidden text-center">
            <div className="h-2 bg-brand-red absolute top-0 left-0 right-0"></div>
            <div className="mb-4 text-brand-red flex justify-center">
              <AlertTriangle className="w-12 h-12 text-brand-red animate-bounce" />
            </div>
            <h3 className="font-display font-extrabold text-sm text-brand-dark mb-2">
              समाचार हटाने की पुष्टि
            </h3>
            <p className="text-xs text-gray-500 font-body leading-relaxed mb-6">
              क्या आप वाकई इस समाचार को हटाना चाहते हैं? यह कार्रवाई स्थायी है और इसे वापस नहीं लिया जा सकता।
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingArticleId(null)}
                className="flex-1 py-2 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 font-label-bold transition-all cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                onClick={handleDeleteArticle}
                className="flex-1 py-2 text-xs bg-brand-red hover:bg-[#9e0010] text-white rounded-lg font-label-bold shadow-sm transition-all cursor-pointer"
              >
                हटाएं (Delete)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-[130] bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-xl border border-gray-250 p-6 shadow-2xl relative overflow-hidden text-center animate-fade-in">
            <div className="h-2 bg-brand-red absolute top-0 left-0 right-0"></div>
            <div className="mb-4 text-brand-red flex justify-center">
              {isBulkDeleting ? (
                <Loader2 className="w-12 h-12 text-brand-red animate-spin" />
              ) : (
                <AlertTriangle className="w-12 h-12 text-brand-red animate-bounce" />
              )}
            </div>
            <h3 className="font-display font-extrabold text-sm text-brand-dark mb-2">
              समाचार थोक में हटाने की पुष्टि
            </h3>
            <p className="text-xs text-gray-500 font-body leading-relaxed mb-6">
              क्या आप वाकई <strong>{selectedArticleIds.length}</strong> चयनित समाचारों को हटाना चाहते हैं? यह कार्रवाई स्थायी है और इसे वापस नहीं लिया जा सकता।
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={isBulkDeleting}
                className="flex-1 py-2 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 font-label-bold transition-all cursor-pointer disabled:opacity-50"
              >
                रद्द करें
              </button>
              <button
                onClick={handleBulkDeleteArticles}
                disabled={isBulkDeleting}
                className="flex-1 py-2 text-xs bg-brand-red hover:bg-[#9e0010] text-white rounded-lg font-label-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> हटाया जा रहा है...
                  </>
                ) : (
                  "हाँ, हटाए"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* AI ASSISTANT WRITER HELPER MODAL */}
      {showAIHelper && (
        <div className="fixed inset-0 z-[140] bg-black/70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-xl border dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-left font-body">
            
            {/* Header */}
            <div className="bg-gray-50 dark:bg-zinc-850 px-5 py-4 border-b dark:border-zinc-800 flex items-center justify-between shrink-0">
              <h3 className="font-display font-extrabold text-sm text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-red animate-pulse" /> AI रीराइटर सहायक (AI Plagiarism Eraser)
              </h3>
              <button
                onClick={() => setShowAIHelper(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 font-bold"
              >
                बंद करें
              </button>
            </div>

            {/* Scrollable Workspace */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1 text-xs">
              
              {/* Alert instructions */}
              <div className="bg-brand-red/5 dark:bg-red-950/15 border border-brand-red/10 rounded-lg p-3 text-gray-600 dark:text-zinc-350 leading-relaxed font-body">
                💡 **काम कैसे करता है?**: किसी भी न्यूज वेबसाइट की खबर कॉपी करें और नीचे पेस्ट करें। AI उसे पूरी तरह से संशोधित और नए आकर्षक रूप में लिखेगा ताकि आपकी रपट अनूठी (unique) बने और plagiarism का कोई खतरा न रहे।
              </div>

              {/* Paste Area */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-500 font-bold mb-1">स्त्रोत खबर पेस्ट करें (Paste Source Article Content)</label>
                <textarea
                  rows={4}
                  value={aiSourceText}
                  onChange={(e) => setAiSourceText(e.target.value)}
                  placeholder="यहाँ किसी भी बाहरी समाचार पोर्टल की रपट कॉपी करके पेस्ट करें..."
                  className="w-full text-sm border border-gray-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded-lg p-3 bg-gray-50/50 dark:bg-zinc-800/40 text-gray-800 dark:text-zinc-150 leading-relaxed"
                />
              </div>

              {/* Preset selection pills */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-500 font-bold mb-1.5">संपादकीय शैली चयन (Select Editorial Style Preset)</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "flashy", label: "💥 तड़क-भड़क (Flashy / Clickbait)", color: "hover:border-red-400 active:bg-red-50" },
                    { id: "emotional", label: "🤝 भावुक (Emotional / Empathetic)", color: "hover:border-pink-400 active:bg-pink-50" },
                    { id: "sensitive", label: "⚖️ संवेदनशील (Neutral / Professional)", color: "hover:border-indigo-400 active:bg-indigo-50" },
                    { id: "analytical", label: "🧠 विश्लेषणात्मक (Analytical Deep-Dive)", color: "hover:border-emerald-400 active:bg-emerald-50" }
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAiSelectedPreset(preset.id as any)}
                      className={`p-1.5 px-3.5 border rounded-full transition-all text-2xs font-mono font-bold cursor-pointer ${
                        aiSelectedPreset === preset.id
                          ? "bg-brand-red text-white border-brand-red shadow-sm"
                          : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800 " + preset.color
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt Modifiers */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-500 font-bold mb-1">अतिरिक्त निर्देश (Optional Custom Instructions)</label>
                <input
                  type="text"
                  value={aiCustomPrompt}
                  onChange={(e) => setAiCustomPrompt(e.target.value)}
                  placeholder="उदा. 'रपट को 3 पैराग्राफ में छोटा रखें', 'क्रिकेटर के बयानों पर ज्यादा फोकस करें'..."
                  className="w-full text-sm border border-gray-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded-lg p-2.5 bg-gray-50/50 dark:bg-zinc-800/40 text-gray-800 dark:text-zinc-200"
                />
              </div>

              {aiError && (
                <p className="text-2xs text-brand-red font-bold bg-red-50 dark:bg-red-950/20 p-2.5 rounded border border-red-200/30">
                  ⚠️ {aiError}
                </p>
              )}

              {/* Action trigger */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  disabled={aiIsGenerating}
                  onClick={handleAIGenerate}
                  className="bg-brand-red hover:bg-[#9e0010] text-white p-3 px-8 rounded-lg font-label-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${aiIsGenerating ? "animate-spin" : ""}`} />
                  {aiIsGenerating ? "AI समाचार तैयार कर रहा है..." : "रपट तैयार करें (Generate News)"}
                </button>
              </div>

              {/* Outputs Previews */}
              {(aiGenTitle || aiGenContent) && (
                <div className="border-t border-gray-150 dark:border-zinc-800 pt-5 space-y-4 font-body animate-fadeIn">
                  <span className="block text-2xs font-mono uppercase text-gray-400 font-black tracking-wider">AI द्वारा तैयार खबर पूर्वावलोकन (Proposed AI Output)</span>

                  {/* Headline Preview */}
                  <div>
                    <label className="block text-[9px] font-mono uppercase text-gray-500 font-bold mb-0.5">प्रस्तावित मुख्य शीर्षक (Headline)</label>
                    <input
                      type="text"
                      value={aiGenTitle}
                      onChange={(e) => setAiGenTitle(e.target.value)}
                      className="w-full text-xs font-bold border border-gray-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded-lg p-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                    />
                  </div>

                  {/* Summary Preview */}
                  <div>
                    <label className="block text-[9px] font-mono uppercase text-gray-500 font-bold mb-0.5">प्रस्तावित संक्षिप्त सारांश (Summary)</label>
                    <input
                      type="text"
                      value={aiGenSummary}
                      onChange={(e) => setAiGenSummary(e.target.value)}
                      className="w-full text-2xs border border-gray-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded-lg p-2 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
                    />
                  </div>

                  {/* Content Preview */}
                  <div>
                    <label className="block text-[9px] font-mono uppercase text-gray-500 font-bold mb-0.5">प्रस्तावित मुख्य रपट (Detailed Content Preview)</label>
                    <textarea
                      rows={6}
                      value={aiGenContent}
                      onChange={(e) => setAiGenContent(e.target.value)}
                      className="w-full text-xs border border-gray-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded-lg p-2.5 bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed"
                    />
                  </div>

                  {/* Apply Actions */}
                  <div className="flex justify-end gap-2.5 pt-3 border-t dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setAiGenTitle("");
                        setAiGenSummary("");
                        setAiGenContent("");
                      }}
                      className="p-2 px-4 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 font-label-bold"
                    >
                      रद्द करें
                    </button>
                    <button
                      type="button"
                      onClick={handleAIApply}
                      className="p-2 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-label-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> रपट एडिटर में भरें (Apply to Editor)
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
