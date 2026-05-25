import { getSupabase, getSupabaseConfig } from "./supabase";
import { Category } from "../types";

export interface AIPrompts {
  flashy: string;
  emotional: string;
  sensitive: string;
  analytical: string;
}

export interface AIConfig {
  provider: "gemini" | "groq" | "deepseek";
  apiKey: string;
  model: string;
  presets: AIPrompts;
  categoryPresets: Record<string, string>;
  categories: Category[];
}

export const DEFAULT_PROMPTS: AIPrompts = {
  flashy: "आप एक अनुभवी समाचार संपादक हैं। दी गई खबर को इस तरह से फिर से लिखें कि उसका शीर्षक अत्यंत आकर्षक, तड़क-भड़क वाला (Flashy / Clickbait) हो, जो पाठकों का ध्यान तुरंत खींचे। समाचार की विस्तृत रिपोर्ट को बहुत ही रोचक और सजीव भाषा में लिखें ताकि पाठक अंत तक पढ़ने के लिए उत्सुक रहे। साहित्यिक चोरी (plagiarism) से पूरी तरह बचें और सभी तथ्य सटीक रखें।",
  emotional: "आप एक अनुभवी समाचार संपादक हैं। दी गई खबर को अत्यंत भावुक, संवेदनशील और मानवीय दृष्टिकोण (Emotional / Human-Centric) से फिर से लिखें। समाचार में शामिल लोगों की भावनाओं, संघर्षों और उनके जीवन पर पड़ने वाले प्रभाव को उजागर करें ताकि पाठक खबर से भावनात्मक रूप से जुड़ सकें। भाषा सरल, मार्मिक और प्रवाहमयी होनी चाहिए।",
  sensitive: "आप एक अनुभवी समाचार संपादक हैं। दी गई खबर को एक निष्पक्ष, संतुलित, अत्यंत औपचारिक और पेशेवर (Neutral / Sensitive / Professional) शैली में फिर से लिखें। सनसनीखेज भाषा या अतिशयोक्ति से बचें। भाषा व्याकरणिक रूप से शुद्ध, सम्मानजनक और गंभीर होनी चाहिए, जो एक प्रतिष्ठित समाचार पत्र की गरिमा के अनुरूप हो।",
  analytical: "आप एक अनुभवी समाचार संपादक हैं। दी गई खबर को एक विश्लेषणात्मक और विस्तृत रिपोर्ट (Analytical Deep-Dive) के रूप में फिर से लिखें। समाचार की पृष्ठभूमि, मुख्य कारणों और भविष्य के प्रभावों पर प्रकाश डालें। रिपोर्ट को स्पष्ट उप-शीर्षकों (sub-headings) और मुख्य बिंदुओं (key takeaways) में विभाजित करें ताकि विषय का गहरा विश्लेषण प्राप्त हो।"
};

export const DEFAULT_CATEGORY_PRESETS: Record<string, string> = {
  politics: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=600",
  business: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=600",
  sports: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600",
  entertainment: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=600",
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600",
  weather: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&q=80&w=600"
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "politics", name_en: "Politics", name_hi: "राजनीति" },
  { id: "local", name_en: "Local", name_hi: "स्थानीय" },
  { id: "world", name_en: "World", name_hi: "दुनिया" },
  { id: "entertainment", name_en: "Entertainment", name_hi: "मनोरंजन" },
  { id: "video", name_en: "Video", name_hi: "वीडियो" },
  { id: "science-health", name_en: "Science & Health", name_hi: "विज्ञान/स्वास्थ्य" },
  { id: "business", name_en: "Business", name_hi: "व्यापार" },
  { id: "sports", name_en: "Sports", name_hi: "खेल" },
  { id: "technology", name_en: "Technology", name_hi: "तकनीक" },
  { id: "weather", name_en: "Weather", name_hi: "मौसम" }
];

const CONFIG_KEY = "samachar_plus_ai_config";

export function parseMarkdown(text: string): string {
  if (!text) return "";

  // If it's already HTML (e.g. created by our WYSIWYG editor), bypass markdown escaping
  if (
    text.includes("<p>") ||
    text.includes("<strong>") ||
    text.includes("<b>") ||
    text.includes("<ul>") ||
    text.includes("<ol>") ||
    text.includes("<br>") ||
    text.includes("<em>") ||
    text.includes("<i>") ||
    text.includes("<u>") ||
    text.includes("<a ")
  ) {
    return text;
  }
  
  // Normalize carriage returns to prevent line matching failures
  let html = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  
  // 1. Escape HTML to prevent XSS (note: '>' becomes '&gt;')
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Headings (e.g., ### Heading, ## Heading, # Heading)
  html = html.replace(/^### (.*?)$/gm, '<h3 class="text-sm sm:text-base font-bold text-brand-dark dark:text-zinc-200 mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2 class="text-base sm:text-lg font-extrabold text-brand-dark dark:text-zinc-100 mt-5 mb-2.5">$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1 class="text-lg sm:text-xl font-black text-brand-dark dark:text-zinc-50 mt-6 mb-3">$1</h1>');

  // 3. Bold (**text** or __text__)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-[#111827] dark:text-zinc-100">$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong class="font-extrabold text-[#111827] dark:text-zinc-100">$1</strong>');

  // 4. Italic (*text* or _text_)
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/_(.*?)_/g, '<em class="italic">$1</em>');

  // 5. Blockquotes (since '>' is escaped to '&gt;')
  html = html.replace(/^&gt; (.*?)$/gm, '<blockquote class="border-l-4 border-brand-red bg-gray-50/50 dark:bg-zinc-800/40 pl-4 py-2.5 my-4 italic text-gray-700 dark:text-zinc-300">$1</blockquote>');

  // 6. Horizontal Rules (e.g., --- or ***)
  html = html.replace(/^---$/gm, '<hr class="my-6 border-gray-250 dark:border-zinc-800" />');
  html = html.replace(/^\*\*\*$/gm, '<hr class="my-6 border-gray-250 dark:border-zinc-800" />');

  // 7. Bullet Lists (- item or * item)
  html = html.replace(/^[-\*] (.*?)$/gm, '<li class="ml-5 list-disc pl-1 mb-1.5 text-gray-800 dark:text-zinc-250">$1</li>');
  
  // 8. Ordered Lists (1. item)
  html = html.replace(/^\d+\. (.*?)$/gm, '<li class="ml-5 list-decimal pl-1 mb-1.5 text-gray-800 dark:text-zinc-250">$1</li>');

  // 9. Wrap consecutive list items in ul or ol
  html = html.replace(/((?:<li class="[^"]*list-disc[^"]*">.*?<\/li>\n?)+)/g, '<ul class="my-3 space-y-1 list-inside">$1</ul>');
  html = html.replace(/((?:<li class="[^"]*list-decimal[^"]*">.*?<\/li>\n?)+)/g, '<ol class="my-3 space-y-1 list-inside">$1</ol>');

  // 10. Paragraph splits & spacing
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<li") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<blockquote") ||
        trimmed.startsWith("<hr")
      ) {
        return trimmed;
      }
      return `<p class="mb-4 leading-relaxed">${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  return html;
}

export const aiService = {
  // Load config from localStorage
  getConfig(): AIConfig {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          provider: parsed.provider || "gemini",
          apiKey: parsed.apiKey || "",
          model: parsed.model || "gemini-2.5-flash",
          presets: {
            ...DEFAULT_PROMPTS,
            ...(parsed.presets || {})
          },
          categoryPresets: parsed.categoryPresets || DEFAULT_CATEGORY_PRESETS,
          categories: parsed.categories || DEFAULT_CATEGORIES
        };
      } catch (e) {
        console.error("Failed to parse AI configuration", e);
      }
    }
    return {
      provider: "gemini",
      apiKey: "",
      model: "gemini-2.5-flash",
      presets: DEFAULT_PROMPTS,
      categoryPresets: DEFAULT_CATEGORY_PRESETS,
      categories: DEFAULT_CATEGORIES
    };
  },

  // Save config to localStorage
  saveConfig(config: AIConfig): void {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    localStorage.setItem("samachar_plus_categories", JSON.stringify(config.categories));
  },

  // Load config from Supabase (or localStorage fallback scoped by email)
  async getConfigFromServer(email: string): Promise<AIConfig> {
    if (!email) return this.getConfig();

    const emailKey = email.trim().toLowerCase();
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("editor_ai_settings")
          .select("*")
          .eq("user_email", emailKey)
          .single();
          
        if (!error && data) {
          // Parse category presets saved inside presets JSONB under 'category_presets'
          const serverPresets = data.presets || {};
          const aiPresetsOnly = {
            flashy: serverPresets.flashy || DEFAULT_PROMPTS.flashy,
            emotional: serverPresets.emotional || DEFAULT_PROMPTS.emotional,
            sensitive: serverPresets.sensitive || DEFAULT_PROMPTS.sensitive,
            analytical: serverPresets.analytical || DEFAULT_PROMPTS.analytical
          };
          const categoryPresets = serverPresets.category_presets || DEFAULT_CATEGORY_PRESETS;
          const categories = serverPresets.categories || DEFAULT_CATEGORIES;

          // Always backup to standalone key
          localStorage.setItem("samachar_plus_categories", JSON.stringify(categories));

          return {
            provider: data.provider || "gemini",
            apiKey: data.api_key || "",
            model: data.model || "gemini-2.5-flash",
            presets: aiPresetsOnly,
            categoryPresets: categoryPresets,
            categories: categories
          };
        }
      } catch (e) {
        console.warn("Failed to fetch AI settings from Supabase, trying localStorage fallback:", e);
      }
    }

    // Fallback to local storage keyed by email
    const localKey = `${CONFIG_KEY}_${emailKey}`;
    const raw = localStorage.getItem(localKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const cats = parsed.categories || DEFAULT_CATEGORIES;
        localStorage.setItem("samachar_plus_categories", JSON.stringify(cats));
        return {
          provider: parsed.provider || "gemini",
          apiKey: parsed.apiKey || "",
          model: parsed.model || "gemini-2.5-flash",
          presets: {
            ...DEFAULT_PROMPTS,
            ...(parsed.presets || {})
          },
          categoryPresets: parsed.categoryPresets || DEFAULT_CATEGORY_PRESETS,
          categories: cats
        };
      } catch (e) {
        console.error("Failed to parse scoped AI config", e);
      }
    }

    return {
      provider: "gemini",
      apiKey: "",
      model: "gemini-2.5-flash",
      presets: DEFAULT_PROMPTS,
      categoryPresets: DEFAULT_CATEGORY_PRESETS,
      categories: DEFAULT_CATEGORIES
    };
  },

  // Save config to Supabase (and local storage scoped by email)
  async saveConfigToServer(email: string, config: AIConfig): Promise<boolean> {
    const emailKey = email ? email.trim().toLowerCase() : "default";
    const localKey = `${CONFIG_KEY}_${emailKey}`;
    localStorage.setItem(localKey, JSON.stringify(config));
    localStorage.setItem("samachar_plus_categories", JSON.stringify(config.categories));

    if (!email) {
      this.saveConfig(config);
      return true;
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        // Embed category_presets and categories inside the presets JSONB column to avoid schema changes
        const payload = {
          user_email: emailKey,
          provider: config.provider,
          api_key: config.apiKey,
          model: config.model,
          presets: {
            ...config.presets,
            category_presets: config.categoryPresets,
            categories: config.categories
          },
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from("editor_ai_settings")
          .upsert([payload], { onConflict: "user_email" });

        if (!error) return true;
        console.warn("Supabase AI config upsert error:", error);
      } catch (e) {
        console.error("Failed to save AI config to Supabase:", e);
      }
    }
    return false;
  },

  // Dynamically resolve active categories with caching fallback
  async getCategories(): Promise<Category[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const savedEmail = localStorage.getItem("samachar_admin_email") || "drmaheshdangi@gmail.com";
        const emailKey = savedEmail.trim().toLowerCase();
        
        // Fetch user-specific settings first
        const { data, error } = await supabase
          .from("editor_ai_settings")
          .select("presets")
          .eq("user_email", emailKey)
          .single();

        if (!error && data) {
          const serverPresets = data.presets || {};
          if (serverPresets.categories) {
            localStorage.setItem("samachar_plus_categories", JSON.stringify(serverPresets.categories));
            return serverPresets.categories;
          }
        } else {
          // If no specific email setting exists, fetch the first available config row
          const { data: firstData, error: firstError } = await supabase
            .from("editor_ai_settings")
            .select("presets")
            .limit(1);

          if (!firstError && firstData && firstData.length > 0) {
            const serverPresets = firstData[0].presets || {};
            if (serverPresets.categories) {
              localStorage.setItem("samachar_plus_categories", JSON.stringify(serverPresets.categories));
              return serverPresets.categories;
            }
          }
        }
      } catch (e) {
        console.warn("Supabase category fetch failed:", e);
      }
    }

    // Fallback to local storage if offline or unconfigured
    const local = localStorage.getItem("samachar_plus_categories");
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }
    return DEFAULT_CATEGORIES;
  },

  // Check the sync status with the Supabase Server
  async checkServerSyncStatus(email: string): Promise<{
    status: "connected" | "table_missing" | "unconfigured" | "error";
    message: string;
  }> {
    if (!email) {
      return {
        status: "unconfigured",
        message: "कोई उपयोगकर्ता लॉगिन नहीं है। कृपया पहले लॉगिन करें।"
      };
    }

    const emailKey = email.trim().toLowerCase();
    const config = getSupabaseConfig();
    if (!config.isValid) {
      return {
        status: "unconfigured",
        message: "Supabase क्रेडेंशियल्स कॉन्फ़िगर नहीं हैं। कृपया 'Supabase कनेक्शन' टैब में विवरण जांचें।"
      };
    }

    const supabase = getSupabase();
    if (!supabase) {
      return {
        status: "error",
        message: "Supabase क्लाइंट शुरू करने में असमर्थ।"
      };
    }

    try {
      // Test if table exists and is readable by querying user_email
      const { error } = await supabase
        .from("editor_ai_settings")
        .select("user_email")
        .eq("user_email", emailKey)
        .limit(1);

      if (error) {
        if (error.code === "42P01") {
          return {
            status: "table_missing",
            message: "Supabase में 'editor_ai_settings' टेबल नहीं मिली। कृपया Supabase SQL Editor में SQL स्क्रिप्ट चलाएं।"
          };
        }
        return {
          status: "error",
          message: `त्रुटि कोड ${error.code}: ${error.message}`
        };
      }

      return {
        status: "connected",
        message: "Supabase सर्वर सक्रिय है! आपकी AI सेटिंग्स सीधे आपके लॉगिन ID के साथ क्लाउड में सिंक हो रही हैं।"
      };
    } catch (e: any) {
      return {
        status: "error",
        message: e.message || "सर्वर से कनेक्ट करने में विफलता।"
      };
    }
  },

  // Main generation endpoint
  async generateNews(
    sourceText: string,
    presetType: keyof AIPrompts,
    customInstructions?: string,
    email?: string
  ): Promise<{ title: string; summary: string; content: string }> {
    let config: AIConfig;
    if (email) {
      config = await this.getConfigFromServer(email);
    } else {
      config = this.getConfig();
    }
    if (!config.apiKey) {
      throw new Error("API Key is missing. Please set it in the AI Settings panel.");
    }

    const basePrompt = config.presets[presetType] || DEFAULT_PROMPTS[presetType];
    const systemPrompt = `You are a professional Hindi news editor. Your task is to rewrite the news article provided by the user.
Guidelines:
1. Rewrite it in Hindi according to this editorial style directive: "${basePrompt}"
2. Ensure there is absolutely no plagiarism, and facts are kept accurate.
${customInstructions ? `3. Also, adhere strictly to these custom instructions: "${customInstructions}"` : ""}
4. You MUST respond with a valid JSON object matching exactly this schema, with no additional markdown, wrapping, backticks, or explanation:
{
  "title": "A plagiarism-free rewritten catchy Hindi headline/title.",
  "summary": "A single-sentence brief summary of the news in Hindi.",
  "content": "The fully detailed rewritten news report in Hindi. Use double newlines (\\n\\n) to separate paragraphs beautifully."
}`;

    if (config.provider === "gemini") {
      return this.callGemini(config.apiKey, config.model, systemPrompt, sourceText);
    } else if (config.provider === "groq") {
      return this.callGroq(config.apiKey, config.model, systemPrompt, sourceText);
    } else if (config.provider === "deepseek") {
      return this.callDeepSeek(config.apiKey, config.model, systemPrompt, sourceText);
    } else {
      throw new Error(`Unsupported AI Provider: ${config.provider}`);
    }
  },

  // Call Gemini REST Endpoint
  async callGemini(
    apiKey: string,
    model: string,
    systemPrompt: string,
    sourceText: string
  ): Promise<{ title: string; summary: string; content: string }> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const promptText = `${systemPrompt}\n\nSource Article to Rewrite:\n"""\n${sourceText}\n"""`;

    const body = {
      contents: [
        {
          parts: [
            {
              text: promptText
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            title: {
              type: "STRING",
              description: "A plagiarism-free rewritten catchy Hindi headline/title."
            },
            summary: {
              type: "STRING",
              description: "A single-sentence brief summary of the news in Hindi."
            },
            content: {
              type: "STRING",
              description: "The fully detailed rewritten news report in Hindi, separated into clean paragraphs using newlines."
            }
          },
          required: ["title", "summary", "content"]
        }
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API returned error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    try {
      const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!jsonText) throw new Error("Empty response text from Gemini");
      return JSON.parse(jsonText.trim());
    } catch (e) {
      console.error("Failed to parse Gemini output", data, e);
      throw new Error("The AI returned an invalid response format. Please try again.");
    }
  },

  // Call Groq REST Endpoint
  async callGroq(
    apiKey: string,
    model: string,
    systemPrompt: string,
    sourceText: string
  ): Promise<{ title: string; summary: string; content: string }> {
    const url = "https://api.groq.com/openai/v1/chat/completions";

    const body = {
      model: model || "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Please rewrite this article according to instructions:\n\n${sourceText}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API returned error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    try {
      const jsonText = data.choices?.[0]?.message?.content;
      if (!jsonText) throw new Error("Empty response from Groq");
      return JSON.parse(jsonText.trim());
    } catch (e) {
      console.error("Failed to parse Groq JSON output", data, e);
      throw new Error("Failed to parse AI response. Please verify your API Key and parameters.");
    }
  },

  // Call DeepSeek REST Endpoint
  async callDeepSeek(
    apiKey: string,
    model: string,
    systemPrompt: string,
    sourceText: string
  ): Promise<{ title: string; summary: string; content: string }> {
    const url = "https://api.deepseek.com/v1/chat/completions";

    const body = {
      model: model || "deepseek-chat",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Please rewrite this article according to instructions:\n\n${sourceText}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`DeepSeek API returned error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    try {
      const jsonText = data.choices?.[0]?.message?.content;
      if (!jsonText) throw new Error("Empty response from DeepSeek");
      return JSON.parse(jsonText.trim());
    } catch (e) {
      console.error("Failed to parse DeepSeek JSON output", data, e);
      throw new Error("Failed to parse AI response. Please verify your API Key and parameters.");
    }
  }
};
