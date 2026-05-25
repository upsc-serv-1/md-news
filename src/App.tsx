import React, { useState, useEffect } from "react";
import { Article, Category } from "./types";
import { newsService, getSupabase, getSupabaseConfig } from "./lib/supabase";
import { Bookmark as BookmarkIcon, LogOut, Check, Bell, Home, Flame, Layers, BookOpen, MapPin, Heart, Share2, Award } from "lucide-react";
import { aiService, DEFAULT_CATEGORIES } from "./lib/ai";
import {
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Video,
  Eye,
  Calendar,
  User,
  Settings,
  X,
  Compass,
  Tv,
  Atom,
  Building,
  Globe2,
  Film,
  Menu,
  Sun,
  Moon,
  CloudSun,
  CloudRain,
  Hash
} from "lucide-react";
import ArticleDetail from "./components/ArticleDetail";
import AdminPanel from "./components/AdminPanel";
import { AnimatePresence, motion } from "motion/react";
import { optimizeCloudinaryUrl } from "./lib/cloudinary";

export const DEFAULT_NEWS_IMAGE = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800";

export const CHHATTISGARH_DISTRICTS = [
  "रायपुर", "बिलासपुर", "दुर्ग", "भिलाई", "कोरबा", "राजनांदगांव", "रायगढ़", "जगदलपुर",
  "अम्बिकापुर", "धमतरी", "महासमुंद", "जांजगीर", "कांकेर", "कवर्धा", "बेमेतरा", "बालोद",
  "बलौदाबाजार", "मनेन्द्रगढ़", "जशपुर", "बैकुंठपुर", "सूरजपुर", "बलरामपुर", "गौरेला-पेंड्रा-मरवाही",
  "मुंगेली", "सक्ती", "सारंगढ़-बिलाईगढ़", "मोहला-मानपुर", "कोंडागांव", "नारायणपुर", "दंतेवाड़ा", "सुकमा", "बीजापुर"
];

interface WebStory {
  id: string;
  title: string;
  coverImage: string;
  slides: {
    image: string;
    caption: string;
  }[];
}

const WEB_STORIES: WebStory[] = [
  {
    id: "story-1",
    title: "छत्तीसगढ़ मौसम: अगले 48 घंटों में रायपुर, बिलासपुर समेत 15 जिलों में भारी बारिश का रेड अलर्ट",
    coverImage: "https://images.unsplash.com/photo-1504370805625-d34c54b34b00?auto=format&fit=crop&q=80&w=600",
    slides: [
      {
        image: "https://images.unsplash.com/photo-1504370805625-d34c54b34b00?auto=format&fit=crop&q=80&w=600",
        caption: "मौसम विभाग ने रायपुर, बिलासपुर और दुर्ग में अगले दो दिनों के लिए भारी वज्रपात और अतिवृष्टि की चेतावनी जारी की है।"
      },
      {
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600",
        caption: "जिला कलेक्टर्स ने महानदी के बढ़ते जलस्तर को देखते हुए तटीय क्षेत्रों में रहने वाले लोगों को सतर्क रहने और सुरक्षित स्थानों पर शरण लेने की अपील की है।"
      },
      {
        image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=600",
        caption: "एसडीआरएफ की टीमें आपात स्थिति के लिए तैनात कर दी गई हैं। राज्य स्तरीय आपातकालीन नियंत्रण कक्ष 24 घंटे कार्यरत है।"
      }
    ]
  },
  {
    id: "story-2",
    title: "चित्रकोट जलप्रपात: छत्तीसगढ़ का नियाग्रा देखने पहुंचे रिकॉर्ड सैलानी",
    coverImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=600",
    slides: [
      {
        image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=600",
        caption: "बस्तर के प्रसिद्ध चित्रकोट जलप्रपात (Chitrakote Falls) पर इस मानसून सैलानियों का जमावड़ा रिकॉर्ड स्तर पर रहा।"
      },
      {
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=600",
        caption: "इंद्रावती नदी पर बने इस जलप्रपात की गर्जना और सौंदर्य पर्यटकों को अत्यधिक आकर्षित कर रहा है।"
      },
      {
        image: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&q=80&w=600",
        caption: "पर्यटन विभाग ने सैलानियों की सुविधा और सुरक्षा के लिए रिसॉर्ट्स और नए व्यू पॉइंट का शुभारंभ किया है।"
      }
    ]
  },
  {
    id: "story-3",
    title: "ISRO चंद्रयान-4: चांद से मिट्टी और पत्थरों के नमूने लाने का मिशन ड्राफ्ट तैयार",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600",
    slides: [
      {
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600",
        caption: "चंद्रयान-3 की ऐतिहासिक लैंडिंग के बाद इसरो अब चंद्रयान-4 सैंपल-रिटर्न मिशन की रुपरेखा पर कार्य कर रहा है।"
      },
      {
        image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=600",
        caption: "जापान की जाक्सा (JAXA) अंतरिक्ष एजेंसी के साथ लूनर रोवर विकास के लिए महत्वपूर्ण साझेदारी पर मुहर लगी है।"
      },
      {
        image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&q=80&w=600",
        caption: "इस मिशन के तहत एक लैंडर और एक असेंडर मॉड्यूल चांद पर जाएगा और वापस पृथ्वी पर सुरक्षित सैंपल लैंड करेगा।"
      }
    ]
  },
  {
    id: "story-4",
    title: "सिरपुर बौद्ध महोत्सव: छत्तीसगढ़ की ऐतिहासिक और प्राचीन बौद्ध वास्तुकला देखने पहुंचे सैलानी",
    coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600",
    slides: [
      {
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600",
        caption: "महासमुंद के ऐतिहासिक सिरपुर में इस बार राष्ट्रीय बौद्ध महोत्सव का भव्य आयोजन किया जा रहा है।"
      },
      {
        image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=600",
        caption: "लक्ष्मण मंदिर, बौद्ध विहार और प्राचीन टीलों से मिली पुरातात्विक मूर्तियों ने सैलानियों को मंत्रमुग्ध कर दिया है।"
      },
      {
        image: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80&w=600",
        caption: "पर्यटन विभाग छत्तीसगढ़ को अंतरराष्ट्रीय हेरिटेज सर्किट से जोड़ने के लिए सिरपुर को प्रमुख केंद्र बना रहा है।"
      }
    ]
  }
];

export default function App() {
  // Screen routing
  const [screen, setScreen] = useState<"home" | "admin">("home");

  // Articles & DB state
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter / Interaction States
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [customFilter, setCustomFilter] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Theme Toggle (Light / Dark)
  const [darkMode, setDarkMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Site branding — loaded from Supabase on boot, localStorage as instant cache
  const [siteTitle, setSiteTitleState] = useState(() => localStorage.getItem("sp_site_title") || "समाचार प्लस");
  const [siteTagline, setSiteTaglineState] = useState(() => localStorage.getItem("sp_site_tagline") || "Samachar Plus");

  // On boot: fetch from Supabase and update state
  useEffect(() => {
    newsService.getSiteSettings().then(s => {
      if (s) {
        setSiteTitleState(s.site_title || "समाचार प्लस");
        setSiteTaglineState(s.site_tagline || "Samachar Plus");
        localStorage.setItem("sp_site_title", s.site_title || "समाचार प्लस");
        localStorage.setItem("sp_site_tagline", s.site_tagline || "Samachar Plus");
      }
    }).catch(err => console.warn("Failed to load site settings", err));
  }, []);

  // Also listen for cross-tab localStorage changes (when admin saves from same browser)
  useEffect(() => {
    const onStorage = () => {
      setSiteTitleState(localStorage.getItem("sp_site_title") || "समाचार प्लस");
      setSiteTaglineState(localStorage.getItem("sp_site_tagline") || "Samachar Plus");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const [isDistrictCollapsed, setIsDistrictCollapsed] = useState(true);

  // Carousel slider state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Dynamic categories state
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [breakingToast, setBreakingToast] = useState<string | null>(null);

  // District selector state
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [districtSearchQuery, setDistrictSearchQuery] = useState("");

  // Web stories active player state
  const [activeStory, setActiveStory] = useState<WebStory | null>(null);
  const [activeStorySlideIndex, setActiveStorySlideIndex] = useState(0);

  // Mobile shorts state
  const [activeShortIndex, setActiveShortIndex] = useState(0);

  // Computed and filtered articles logic based on categories AND city filter
  const getFilteredArticles = () => {
    let list = articles;

    if (customFilter) {
      if (customFilter === "government") {
        list = list.filter(
          (a) =>
            a.title.includes("सरकार") ||
            a.content.includes("सरकार") ||
            a.title.includes("मुख्यमंत्री") ||
            a.content.includes("मुख्यमंत्री") ||
            a.title.includes("मंत्री") ||
            a.content.includes("मंत्री") ||
            a.category === "politics"
        );
      } else if (customFilter === "crime") {
        list = list.filter(
          (a) =>
            a.title.includes("क्राइम") ||
            a.content.includes("क्राइम") ||
            a.title.includes("पुलिस") ||
            a.content.includes("पुलिस") ||
            a.title.includes("अपराध") ||
            a.content.includes("अपराध") ||
            a.title.includes("हादसा") ||
            a.content.includes("गिरफ्तार") ||
            a.content.includes("चोरी")
        );
      } else if (customFilter === "education") {
        list = list.filter(
          (a) =>
            a.title.includes("परीक्षा") ||
            a.content.includes("परीक्षा") ||
            a.title.includes("शिक्षा") ||
            a.content.includes("शिक्षा") ||
            a.title.includes("नौकरी") ||
            a.content.includes("नौकरी") ||
            a.title.includes("भर्ती") ||
            a.content.includes("भर्ती") ||
            a.title.includes("स्कूल") ||
            a.content.includes("स्कूल") ||
            a.title.includes("कॉलेज") ||
            a.content.includes("कॉलेज") ||
            a.title.includes("Vacancy") ||
            a.title.includes("Exam") ||
            a.content.includes("बोर्ड") ||
            a.content.includes("रिजल्ट")
        );
      } else if (customFilter === "tourism") {
        list = list.filter(
          (a) =>
            a.title.includes("पर्यटन") ||
            a.content.includes("पर्यटन") ||
            a.title.includes("पर्यटक") ||
            a.content.includes("पर्यटक") ||
            a.title.includes("टूरिज्म") ||
            a.content.includes("टूरिज्म") ||
            a.title.includes("सैलानी") ||
            a.content.includes("चित्रकोट") ||
            a.title.includes("मेला") ||
            a.content.includes("किला")
        );
      }
    } else {
      if (selectedCategory !== "all") {
        if (selectedCategory === "video") {
          list = list.filter((a) => a.is_video);
        } else if (selectedCategory === "trending") {
          list = [...list].sort((a, b) => (b.views || 0) - (a.views || 0));
        } else if (selectedCategory === "shorts") {
          // Shorts derived from latest articles
          list = list.slice(0, 8);
        } else if (selectedCategory === "stories") {
          // Handled separately by visual stories block
          list = [];
        } else {
          list = list.filter((a) => a.category === selectedCategory);
        }
      }
    }

    if (selectedDistrict) {
      list = list.filter(
        (a) =>
          a.district === selectedDistrict ||
          a.title.includes(selectedDistrict) ||
          a.content.includes(selectedDistrict) ||
          (a.summary && a.summary.includes(selectedDistrict)) ||
          a.category === "local"
      );
    }
    return list;
  };

  const filteredArticles = getFilteredArticles();
  const shortsList = articles.slice(0, 8);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    const ok = await newsService.subscribeNewsletter(newsletterEmail);
    if (ok) {
      setNewsletterSuccess(true);
      setNewsletterEmail("");
      setTimeout(() => setNewsletterSuccess(false), 3000);
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    const data = await newsService.getArticles();
    setArticles(data);
    
    // Dynamically fetch and sync categories
    try {
      const cats = await aiService.getCategories();
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    } catch (e) {
      console.warn("Failed to fetch dynamic categories", e);
    }
    
    setLoading(false);
  };

  // Web Story Auto Advance Slide Effect
  useEffect(() => {
    if (!activeStory) return;
    const timer = setTimeout(() => {
      if (activeStorySlideIndex < activeStory.slides.length - 1) {
        setActiveStorySlideIndex((prev) => prev + 1);
      } else {
        // Loop slide back to 0
        setActiveStorySlideIndex(0);
      }
    }, 4500);
    return () => clearTimeout(timer);
  }, [activeStory, activeStorySlideIndex]);

  useEffect(() => {
    fetchArticles();

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    
    // Auto check if URL query params require loading an article directly
    const params = new URLSearchParams(window.location.search);
    const artId = params.get("article");
    if (artId) {
      setSelectedArticleId(artId);
    }

    const adminQuery = params.get("screen");
    if (adminQuery === "admin") {
      setScreen("admin");
    }

    // Setup Supabase Realtime Listener for Breaking News
    const supabase = getSupabase();
    if (supabase) {
      const channel = supabase
        .channel("live_breaking_news")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "articles" },
          (payload: any) => {
            const updated = payload.new;
            if (updated && updated.is_breaking) {
              setBreakingToast(updated.title);
              fetchArticles();
              setTimeout(() => setBreakingToast(null), 6000);
            }
          }
        )
        .subscribe();

      return () => {
        window.removeEventListener("scroll", handleScroll);
        supabase.removeChannel(channel);
      };
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Helper mapping category icons
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case "politics":
        return <Building className="w-4 h-4" />;
      case "local":
        return <Compass className="w-4 h-4" />;
      case "world":
        return <Globe2 className="w-4 h-4" />;
      case "entertainment":
        return <Film className="w-4 h-4" />;
      case "video":
        return <Tv className="w-4 h-4" />;
      case "science-health":
        return <Atom className="w-4 h-4" />;
      default:
        return <Compass className="w-4 h-4" />;
    }
  };

  // Article groupings for layout
  const breakingNews = articles.filter((a) => a.is_breaking);
  
  // Hero slider selections
  const featuredArticles = articles.filter((a) => a.is_featured);
  const finalSliderArticles = featuredArticles.length > 0 ? featuredArticles : articles.slice(0, 5);
  
  // Ensure the active slide index stays bounded
  const activeSlideIndex = finalSliderArticles.length > 0 ? currentSlide % finalSliderArticles.length : 0;

  // Carousel slider automated sliding effect
  useEffect(() => {
    if (finalSliderArticles.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % finalSliderArticles.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [finalSliderArticles.length]);

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev === 0 ? finalSliderArticles.length - 1 : prev - 1));
  };
  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % finalSliderArticles.length);
  };

  // Recent Updates Sidebar display (filters out currently loaded slider articles)
  const sliderIds = finalSliderArticles.map((a) => a.id);
  const sideUpdateArticles = articles.filter((a) => !sliderIds.includes(a.id));
  
  // World category articles
  const worldArticles = articles.filter((a) => a.category === "world").slice(0, 4);
  
  // Video articles
  const videoArticles = articles.filter((a) => a.is_video).slice(0, 3);
  
  // Science & health articles
  const scienceArticles = articles.filter((a) => a.category === "science-health").slice(0, 2);

  // Trending articles
  const trendingArticles = [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  // Search Results
  const searchResults = searchQuery.trim()
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  if (screen === "admin") {
    return (
      <div className={darkMode ? "dark" : ""}>
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 dark:text-gray-100 font-sans transition-colors duration-250">
          <AdminPanel
            onBack={() => {
              setScreen("home");
              fetchArticles();
            }}
            onDataChanged={fetchArticles}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-brand-cream text-brand-dark dark:bg-zinc-950 dark:text-zinc-50 font-sans transition-colors duration-300 flex flex-col">
        
        {/* SCROLL PROGRESS BAR */}
        <div
          className="fixed top-0 left-0 h-1 bg-brand-red dark:bg-red-500 z-[120] transition-all duration-100 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />

        {/* TOP SCROLLING MARQUEE BANNER */}
        <div className="bg-brand-red dark:bg-red-800 text-white w-full h-10 flex items-center overflow-hidden z-[60] relative border-b border-red-700/30">
          <div className="flex items-center h-full pl-4 pr-4 bg-brand-red dark:bg-red-800 z-10 font-bold text-xs uppercase tracking-wider text-white shadow-[4px_0_10px_rgba(0,0,0,0.25)] whitespace-nowrap gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="font-display font-black tracking-wide text-xs">ताज़ा खबर:</span>
          </div>

          <div className="flex-1 overflow-hidden relative h-full flex items-center">
            <div className="flex gap-16 animate-marquee whitespace-nowrap py-2 cursor-pointer font-body text-xs font-semibold select-none">
              {breakingNews.length > 0 ? (
                [...breakingNews, ...breakingNews, ...breakingNews].map((news, i) => (
                  <span
                    key={`${news.id}-${i}`}
                    onClick={() => setSelectedArticleId(news.id)}
                    className="hover:text-amber-300 transition-colors inline-flex items-center gap-1.5"
                  >
                    🔥 {news.title}
                  </span>
                ))
              ) : (
                <>
                  <span>🔥 बड़ी खबर: लोकसभा चुनाव 2026 के नतीजे कल घोषित होंगे।</span>
                  <span>🏏 खेल: भारत ने विश्व कप फाइनल में प्रवेश किया, शानदार जीत।</span>
                  <span>📈 व्यापार: शेयर बाजार में आज भारी उछाल, सेंसेक्स रिकॉर्ड स्तर पर।</span>
                  {/* Duplicates for seamless wrap */}
                  <span>🔥 बड़ी खबर: लोकसभा चुनाव 2026 के नतीजे कल घोषित होंगे।</span>
                  <span>🏏 खेल: भारत ने विश्व कप फाइनल में प्रवेश किया, शानदार जीत।</span>
                  <span>📈 व्यापार: शेयर बाजार में आज भारी उछाल, सेंसेक्स रिकॉर्ड स्तर पर।</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* STICKY HEADER */}
        <header className="sticky top-0 z-50 w-full bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 transition-all shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 w-full">
            
            {/* Top row for mobile, combined on desktop */}
            <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden text-pink-600 dark:text-pink-500 hover:bg-slate-100 dark:hover:bg-zinc-800 p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer border border-transparent"
                  aria-label="Toggle Mobile Menu"
                >
                  <Menu className="w-5.5 h-5.5" />
                </button>
                
                {/* Brand Logo Emblem resembling "Mharo Rajasthan" sunset circular style */}
                <a
                  onClick={() => {
                    setSelectedCategory("all");
                    setCustomFilter(null);
                    setSelectedDistrict(null);
                    setSelectedArticleId(null);
                  }}
                  className="cursor-pointer flex items-center gap-2 select-none group shrink-0"
                >
                  <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 p-0.5 shadow-md shrink-0 hover:rotate-6 transition-transform duration-300">
                    <div className="w-full h-full rounded-full bg-pink-600 border-2 border-white flex flex-col items-center justify-center text-white font-sans font-black">
                      <span className="text-[7px] leading-none text-yellow-300 tracking-wider">हमार</span>
                      <span className="text-[8px] leading-none tracking-tighter mt-0.5">छत्तीसगढ़</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display font-black text-sm sm:text-base text-pink-600 dark:text-pink-500 tracking-tight leading-none">{siteTitle}</span>
                    <span className="font-body text-[8px] font-bold text-slate-400 dark:text-zinc-500 tracking-widest uppercase">{siteTagline}</span>
                  </div>
                </a>
              </div>

              {/* Mobile-only tools row */}
              <div className="flex items-center gap-1.5 md:hidden">
                <button
                  onClick={() => setIsDistrictModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-600 border border-pink-100 hover:bg-pink-100 cursor-pointer active:scale-95 transition-all select-none"
                >
                  <MapPin className="w-3 h-3" />
                  <span>{selectedDistrict ? `${selectedDistrict} ` : "जिला चुनें"}</span>
                </button>
                <button
                  onClick={toggleDarkMode}
                  className="hover:bg-slate-100 dark:hover:bg-zinc-800 p-2 rounded-xl transition-all cursor-pointer"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
                </button>
              </div>
            </div>

            {/* Nav Categories - horizontal row next to logo on desktop */}
            <div className="hidden lg:flex items-center gap-1.5 select-none font-body font-bold text-xs uppercase ml-4">
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setCustomFilter(null);
                  setSelectedArticleId(null);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                  selectedCategory === "all" && !customFilter
                    ? "bg-pink-50 text-pink-600 dark:bg-pink-950/20 font-black shadow-3xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-pink-600 hover:bg-pink-500/5"
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>होम</span>
              </button>
              <button
                onClick={() => {
                  setSelectedCategory("trending");
                  setCustomFilter(null);
                  setSelectedArticleId(null);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                  selectedCategory === "trending" && !customFilter
                    ? "bg-pink-50 text-pink-600 dark:bg-pink-950/20 font-black shadow-3xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-pink-600 hover:bg-pink-500/5"
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>ट्रेंडिंग</span>
              </button>
              <button
                onClick={() => {
                  setSelectedCategory("video");
                  setCustomFilter(null);
                  setSelectedArticleId(null);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                  selectedCategory === "video" && !customFilter
                    ? "bg-pink-50 text-pink-600 dark:bg-pink-950/20 font-black shadow-3xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-pink-600 hover:bg-pink-500/5"
                }`}
              >
                <Video className="w-3.5 h-3.5 text-blue-500" />
                <span>वीडियो</span>
              </button>
              <button
                onClick={() => {
                  setSelectedCategory("shorts");
                  setCustomFilter(null);
                  setSelectedArticleId(null);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                  selectedCategory === "shorts" && !customFilter
                    ? "bg-pink-50 text-pink-600 dark:bg-pink-950/20 font-black shadow-3xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-pink-600 hover:bg-pink-500/5"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-purple-500" />
                <span>शॉर्ट्स</span>
              </button>
              <button
                onClick={() => {
                  setSelectedCategory("stories");
                  setCustomFilter(null);
                  setSelectedArticleId(null);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                  selectedCategory === "stories" && !customFilter
                    ? "bg-pink-50 text-pink-600 dark:bg-pink-950/20 font-black shadow-3xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-pink-600 hover:bg-pink-500/5"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-green-550" />
                <span>वेब स्टोरी</span>
              </button>
            </div>

            {/* Desktop Search & Social Icons & District Selector */}
            <div className="hidden md:flex items-center justify-end gap-3 flex-1">
              
              {/* Desktop Header Search */}
              <div className="relative max-w-xs w-full flex select-normal">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim() !== "") {
                      setIsSearchOpen(true);
                    }
                  }}
                  placeholder="खोजें (Search)..."
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-250 dark:border-zinc-700 rounded-l-xl outline-none bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-zinc-150 focus:border-pink-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                />
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="bg-pink-650 hover:bg-pink-700 hover:scale-102 bg-pink-600 text-white px-3.5 rounded-r-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-3xs"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* WhatsApp Share Button */}
              <button
                onClick={() => {
                  const url = encodeURIComponent(window.location.href);
                  const text = encodeURIComponent("समाचार प्लस पर ताज़ा खबरें पढ़ें: ");
                  window.open(`https://wa.me/?text=${text}${url}`, "_blank");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 text-xs font-bold transition-all cursor-pointer active:scale-95"
                title="WhatsApp पर साझा करें"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span>WhatsApp</span>
              </button>

              {/* Select District Button */}
              <button
                onClick={() => setIsDistrictModalOpen(true)}
                className="hover:scale-102 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-98 select-none flex items-center gap-1.5 shrink-0"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{selectedDistrict ? `${selectedDistrict}` : "अपना जिला चुनें"}</span>
              </button>

              {/* Utility Tools */}
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-250 dark:border-zinc-800">
                <button
                  onClick={toggleDarkMode}
                  className="hover:bg-slate-100 dark:hover:bg-zinc-800 p-2 rounded-xl transition-all active:scale-95 cursor-pointer"
                  title={darkMode ? "लाइट मोड" : "डार्क मोड"}
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-500 animate-fade-in" /> : <Moon className="w-4 h-4 text-slate-650 animate-fade-in" />}
                </button>
                <button
                  onClick={() => setScreen("admin")}
                  className="hover:bg-slate-100 dark:hover:bg-zinc-800 p-2 rounded-xl transition-all active:scale-95 cursor-pointer text-slate-700 dark:text-zinc-200"
                  title="एडमिन पैनल"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        </header>

        {/* MOBILE MENU ACCORDION */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 max-w-7xl mx-auto w-full px-4 overflow-hidden z-40 relative"
            >
              <div className="py-3 flex flex-col gap-2 text-xs font-bold font-body">
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setCustomFilter(null);
                    setSelectedDistrict(null);
                    setSelectedArticleId(null);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-xl text-left flex items-center gap-2 ${
                    selectedCategory === "all" && !customFilter && !selectedDistrict
                      ? "bg-pink-50 text-pink-600 dark:bg-pink-955/20 font-black border-l-4 border-pink-600"
                      : "text-gray-700 dark:text-zinc-300"
                  }`}
                >
                  <MapPin className="w-4 h-4 text-pink-500" />
                  <span>मोर छत्तीसगढ़</span>
                </button>

                <button
                  onClick={() => {
                    setCustomFilter("government");
                    setSelectedCategory("all");
                    setSelectedDistrict(null);
                    setSelectedArticleId(null);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-xl text-left flex items-center gap-2 ${
                    customFilter === "government"
                      ? "bg-pink-50 text-pink-600 dark:bg-pink-955/20 font-black border-l-4 border-pink-600"
                      : "text-gray-700 dark:text-zinc-300"
                  }`}
                >
                  <Award className="w-4 h-4 text-pink-500" />
                  <span>छत्तीसगढ़ सरकार</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedCategory("politics");
                    setCustomFilter(null);
                    setSelectedDistrict(null);
                    setSelectedArticleId(null);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-xl text-left flex items-center gap-2 ${
                    selectedCategory === "politics" && !customFilter
                      ? "bg-pink-50 text-pink-600 dark:bg-pink-955/20 font-black border-l-4 border-pink-600"
                      : "text-gray-700 dark:text-zinc-300"
                  }`}
                >
                  <Building className="w-4 h-4 text-pink-500" />
                  <span>राजनीति</span>
                </button>

                <button
                  onClick={() => {
                    setCustomFilter("crime");
                    setSelectedCategory("all");
                    setSelectedDistrict(null);
                    setSelectedArticleId(null);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-xl text-left flex items-center gap-2 ${
                    customFilter === "crime"
                      ? "bg-pink-50 text-pink-600 dark:bg-pink-955/20 font-black border-l-4 border-pink-600"
                      : "text-gray-700 dark:text-zinc-300"
                  }`}
                >
                  <Flame className="w-4 h-4 text-pink-500" />
                  <span>क्राइम</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedCategory("stories");
                    setCustomFilter(null);
                    setSelectedDistrict(null);
                    setSelectedArticleId(null);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-xl text-left flex items-center gap-2 ${
                    selectedCategory === "stories" && !customFilter
                      ? "bg-pink-50 text-pink-600 dark:bg-pink-955/20 font-black border-l-4 border-pink-600"
                      : "text-gray-700 dark:text-zinc-300"
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-pink-500" />
                  <span>वेब स्टोरी</span>
                </button>

                <button
                  onClick={() => {
                    setCustomFilter("education");
                    setSelectedCategory("all");
                    setSelectedDistrict(null);
                    setSelectedArticleId(null);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-xl text-left flex items-center gap-2 ${
                    customFilter === "education"
                      ? "bg-pink-50 text-pink-600 dark:bg-pink-955/20 font-black border-l-4 border-pink-600"
                      : "text-gray-700 dark:text-zinc-300"
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-pink-500" />
                  <span>नौकरी/शिक्षा</span>
                </button>

                <button
                  onClick={() => {
                    setCustomFilter("tourism");
                    setSelectedCategory("all");
                    setSelectedDistrict(null);
                    setSelectedArticleId(null);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-xl text-left flex items-center gap-2 ${
                    customFilter === "tourism"
                      ? "bg-pink-50 text-pink-600 dark:bg-pink-955/20 font-black border-l-4 border-pink-600"
                      : "text-gray-700 dark:text-zinc-300"
                  }`}
                >
                  <Compass className="w-4 h-4 text-pink-500" />
                  <span>छत्तीसगढ़ टूरिज्म</span>
                </button>

                {/* Mobile-only settings row inside drawer */}
                <div className="border-t border-gray-150 dark:border-zinc-800 pt-3 mt-1.5 flex items-center justify-between px-2">
                  <span className="text-gray-500 dark:text-zinc-400 text-[10px] font-mono uppercase font-bold">डार्क मोड (Dark Mode)</span>
                  <button
                    onClick={() => {
                      toggleDarkMode();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-1.5 p-1.5 px-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 rounded-lg hover:bg-gray-205 transition-colors border border-gray-200 dark:border-zinc-700"
                  >
                    {darkMode ? (
                      <>
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>लाइट मोड</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-3.5 h-3.5 text-zinc-500" />
                        <span>डार्क मोड</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* UNIFORM HORIZONTAL CATEGORIES */}
        <div className="w-full bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800/80 py-2.5 relative overflow-hidden select-none z-30 shadow-3xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-zinc-900 to-transparent pointer-events-none z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent pointer-events-none z-10" />
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap text-xs font-bold font-body py-1 px-2">
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setCustomFilter(null);
                  setSelectedArticleId(null);
                }}
                className={`p-1.5 px-3.5 rounded-full shrink-0 transition-all duration-200 cursor-pointer ${
                  selectedCategory === "all" && !customFilter
                    ? "bg-brand-red text-white shadow-xs font-black scale-102"
                    : "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 hover:scale-102"
                }`}
              >
                मुख्य समाचार
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setCustomFilter(null);
                    setSelectedArticleId(null);
                  }}
                  className={`p-1.5 px-3.5 rounded-full shrink-0 transition-all duration-200 cursor-pointer ${
                    selectedCategory === cat.id && !customFilter
                      ? "bg-brand-red text-white shadow-xs font-black scale-102"
                      : "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 hover:scale-102"
                  }`}
                >
                  {cat.name_hi}
                </button>
              ))}
            </div>
          </div>
        </div>


        {/* LOADING SHIMMER */}
        {loading ? (
          <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-10">
            {/* Hero Block Skeleton */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 aspect-[16/9] w-full rounded-2xl animate-shimmer dark:bg-zinc-800" />
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="h-6 w-32 animate-shimmer dark:bg-zinc-800 rounded-md" />
                <div className="flex flex-col gap-3.5 max-h-[750px] overflow-hidden">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="flex gap-3.5 p-2.5 rounded-xl border border-transparent">
                      <div className="w-20 h-20 shrink-0 rounded-lg animate-shimmer dark:bg-zinc-800" />
                      <div className="flex flex-col justify-center flex-grow gap-2">
                        <div className="h-4 w-full animate-shimmer dark:bg-zinc-800 rounded-md" />
                        <div className="h-4 w-4/5 animate-shimmer dark:bg-zinc-800 rounded-md" />
                        <div className="h-3 w-16 animate-shimmer dark:bg-zinc-800 rounded-md mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* General Grid Skeleton */}
            <section className="space-y-6">
              <div className="h-6 w-48 animate-shimmer dark:bg-zinc-800 rounded-md" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="flex flex-col gap-3 p-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="aspect-[16/10] w-full rounded-xl animate-shimmer dark:bg-zinc-800" />
                    <div className="flex-grow flex flex-col gap-2.5 mt-2">
                      <div className="h-3.5 w-16 animate-shimmer dark:bg-zinc-800 rounded-md" />
                      <div className="h-4 w-full animate-shimmer dark:bg-zinc-800 rounded-md" />
                      <div className="h-4 w-5/6 animate-shimmer dark:bg-zinc-800 rounded-md" />
                      <div className="h-3 w-24 animate-shimmer dark:bg-zinc-800 rounded-md mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>
        ) : (
          <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
              
              {/* LEFT SIDEBAR NAVIGATION (Desktop Sticky Sidebar) */}
              <aside className="hidden lg:block lg:col-span-3 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 rounded-2xl p-4 shadow-sm select-none font-body custom-scrollbar">
                <div className="flex flex-col gap-1">
                  
                  {/* Title of Sidebar */}
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 dark:text-zinc-500 uppercase font-black px-2.5 pb-2 border-b border-slate-100 dark:border-zinc-800/80 mb-2">नेविगेशन (Navigation)</span>

                  {/* 1. मोर छत्तीसगढ़ */}
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setCustomFilter(null);
                      setSelectedDistrict(null);
                      setSelectedArticleId(null);
                    }}
                    className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      selectedCategory === "all" && !customFilter && !selectedDistrict
                        ? "bg-pink-50 text-pink-600 dark:bg-pink-950/20 font-extrabold border-l-4 border-pink-600 pl-2"
                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850 hover:text-pink-600 dark:hover:text-pink-400"
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-pink-500 animate-pulse" />
                    <span>मोर छत्तीसगढ़</span>
                  </button>

                  {/* 2. छत्तीसगढ़ सरकार */}
                  <button
                    onClick={() => {
                      setCustomFilter("government");
                      setSelectedCategory("all");
                      setSelectedDistrict(null);
                      setSelectedArticleId(null);
                    }}
                    className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      customFilter === "government"
                        ? "bg-pink-50 text-pink-600 dark:bg-pink-950/20 font-extrabold border-l-4 border-pink-600 pl-2"
                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850 hover:text-pink-600 dark:hover:text-pink-400"
                    }`}
                  >
                    <Award className="w-4 h-4 text-pink-500" />
                    <span>छत्तीसगढ़ सरकार</span>
                  </button>



                  {/* 4. आपका जिला (Jaipur, Jodhpur, etc.) */}
                  <div className="flex flex-col">
                    <button
                      onClick={() => setIsDistrictCollapsed(!isDistrictCollapsed)}
                      className="flex items-center justify-between w-full px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-xl transition-all cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <Compass className="w-4 h-4 text-pink-500" />
                        <span>आपका जिला</span>
                      </div>
                      {isDistrictCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-455 dark:text-zinc-555 transition-transform duration-200" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-455 dark:text-zinc-555 transition-transform duration-200" />
                      )}
                    </button>
                    {/* Collapsible list of districts */}
                    {!isDistrictCollapsed && (
                      <div className="ml-7 mt-0.5 mb-2 flex flex-col gap-1 border-l border-slate-100 dark:border-zinc-800 pl-3">
                        {["रायपुर", "बिलासपुर", "दुर्ग", "कोरबा", "जगदलपुर"].map((dist) => (
                          <button
                            key={dist}
                            onClick={() => {
                              setSelectedDistrict(dist);
                              setSelectedCategory("all");
                              setCustomFilter(null);
                              setSelectedArticleId(null);
                            }}
                            className={`text-left text-xs py-1.5 transition-all hover:text-pink-650 dark:hover:text-pink-450 cursor-pointer ${
                              selectedDistrict === dist
                                ? "text-pink-600 dark:text-pink-400 font-extrabold"
                                : "text-slate-500 dark:text-zinc-400 hover:translate-x-0.5 duration-200"
                            }`}
                          >
                            ▸ {dist}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 5. Select District Pink Button */}
                  <div className="px-2 py-1.5 border-t border-b border-slate-100 dark:border-zinc-800/80 my-1.5">
                    <button
                      onClick={() => setIsDistrictModalOpen(true)}
                      className="bg-pink-600 hover:bg-pink-700 text-white w-full text-center py-2 text-xs font-extrabold rounded-xl shadow-xs transition-all active:scale-97 select-none cursor-pointer"
                    >
                      अपना जिला चुनें
                    </button>
                  </div>

                  {/* 6. क्राइम */}
                  <button
                    onClick={() => {
                      setCustomFilter("crime");
                      setSelectedCategory("all");
                      setSelectedDistrict(null);
                      setSelectedArticleId(null);
                    }}
                    className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      customFilter === "crime"
                        ? "bg-pink-50 text-pink-600 dark:bg-pink-950/20 font-extrabold border-l-4 border-pink-600 pl-2"
                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850 hover:text-pink-600 dark:hover:text-pink-400"
                    }`}
                  >
                    <Flame className="w-4 h-4 text-pink-500" />
                    <span>क्राइम</span>
                  </button>

                  {/* 9. नौकरी/शिक्षा */}
                  <button
                    onClick={() => {
                      setCustomFilter("education");
                      setSelectedCategory("all");
                      setSelectedDistrict(null);
                      setSelectedArticleId(null);
                    }}
                    className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      customFilter === "education"
                        ? "bg-pink-50 text-pink-600 dark:bg-pink-950/20 font-extrabold border-l-4 border-pink-600 pl-2"
                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850 hover:text-pink-600 dark:hover:text-pink-400"
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-pink-500" />
                    <span>नौकरी/शिक्षा</span>
                  </button>

                  {/* 10. छत्तीसगढ़ टूरिज्म */}
                  <button
                    onClick={() => {
                      setCustomFilter("tourism");
                      setSelectedCategory("all");
                      setSelectedDistrict(null);
                      setSelectedArticleId(null);
                    }}
                    className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      customFilter === "tourism"
                        ? "bg-pink-50 text-pink-600 dark:bg-pink-950/20 font-extrabold border-l-4 border-pink-600 pl-2"
                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850 hover:text-pink-600 dark:hover:text-pink-400"
                    }`}
                  >
                    <Compass className="w-4 h-4 text-pink-500" />
                    <span>छत्तीसगढ़ टूरिज्म</span>
                  </button>

                  {/* WEATHER WIDGET */}
                  <div className="border-t border-slate-100 dark:border-zinc-800/80 my-4 pt-4 px-1.5 font-body">
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 dark:text-zinc-500 uppercase font-black block mb-2.5">छत्तीसगढ़ मौसम (Weather)</span>
                    <div className="bg-gradient-to-br from-pink-50/50 to-amber-50/20 dark:from-zinc-900/40 dark:to-zinc-850/20 rounded-xl p-3 border border-pink-100/30 dark:border-zinc-800 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CloudRain className="w-5 h-5 text-pink-550 animate-bounce" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-850 dark:text-zinc-200">रायपुर (Raipur)</span>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 leading-none">हल्की बारिश (Rainy)</span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-pink-600 dark:text-pink-400">31°C</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/60 pt-2 mt-1">
                        <div className="flex items-center gap-2">
                          <CloudSun className="w-5 h-5 text-amber-500" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-850 dark:text-zinc-200">बिलासपुर (Bilaspur)</span>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 leading-none">आंशिक बादल (Cloudy)</span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-pink-600 dark:text-pink-400">33°C</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/60 pt-2 mt-1">
                        <div className="flex items-center gap-2">
                          <Sun className="w-5 h-5 text-orange-500" style={{ animation: "spin 12s linear infinite" }} />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-850 dark:text-zinc-200">बस्तर (Bastar)</span>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 leading-none">धूप (Sunny)</span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-pink-600 dark:text-pink-400">29°C</span>
                      </div>
                    </div>
                  </div>

                  {/* TRENDING TAGS PANEL */}
                  <div className="border-t border-slate-100 dark:border-zinc-800/80 my-4 pt-4 px-1.5 font-body">
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 dark:text-zinc-500 uppercase font-black block mb-2.5">ट्रेंडिंग विषय (Trending)</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "छत्तीसगढ़_मानसून", query: "मानसून" },
                        { label: "परीक्षा_भर्ती", query: "भर्ती" },
                        { label: "चित्रकोट_जलप्रपात", query: "चित्रकोट" },
                        { label: "भूपेश_बघेल", query: "बघेल" },
                        { label: "रायपुर_विकास", query: "रायपुर" },
                        { label: "नौकरी_2026", query: "नौकरी" }
                      ].map((tag) => (
                        <button
                          key={tag.label}
                          onClick={() => {
                            setSearchQuery(tag.query);
                            setIsSearchOpen(true);
                            setSelectedCategory("all");
                            setCustomFilter(null);
                            setSelectedArticleId(null);
                          }}
                          className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-slate-50 hover:bg-pink-50 hover:text-pink-600 dark:bg-zinc-850 dark:hover:bg-zinc-800 dark:hover:text-pink-400 text-[10px] font-bold text-slate-600 dark:text-zinc-350 border border-slate-150 dark:border-zinc-800 transition-all cursor-pointer hover:scale-102"
                        >
                          <Hash className="w-2.5 h-2.5 text-pink-500" />
                          <span>{tag.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </aside>

              {/* MAIN CONTENT FEED AREA */}
              <div className="col-span-1 lg:col-span-9 flex flex-col gap-10 w-full">
            
            {/* DISTRICT SELECTOR ACTIVE BANNER */}
            {selectedDistrict && selectedCategory !== "shorts" && selectedCategory !== "stories" && (
              <div className="bg-brand-red/5 dark:bg-red-500/5 border border-brand-red/10 dark:border-red-500/10 p-3 px-4 rounded-xl flex items-center justify-between animate-fade-in mb-1">
                <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-100 text-xs sm:text-sm font-bold font-body">
                  <MapPin className="w-4 h-4 text-brand-red animate-pulse" />
                  <span>📍 {selectedDistrict} क्षेत्र के लिए विशेष समाचार फ़िल्टर</span>
                </div>
                <button
                  onClick={() => setSelectedDistrict(null)}
                  className="text-[10px] font-mono font-bold bg-brand-red text-white dark:bg-red-600 px-2.5 py-1 rounded-lg shadow-xs hover:bg-[#9e0010] active:scale-95 transition-all select-none cursor-pointer"
                >
                  फ़िल्टर हटाएँ
                </button>
              </div>
            )}

            {/* DYNAMIC VIEWS BASED ON CATEGORY FILTER */}
            {selectedCategory === "shorts" ? (
              <div className="w-full max-w-md mx-auto py-2 sm:py-4 flex flex-col items-center gap-6 animate-fade-in pb-24 h-[80vh] overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar">
                <div className="text-center w-full flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3 sticky top-0 bg-slate-100 dark:bg-zinc-950 z-30 px-2">
                  <h2 className="font-display font-black text-sm sm:text-base text-brand-red dark:text-red-500 uppercase tracking-wider flex items-center gap-1.5 py-1">
                    <Layers className="w-5 h-5 text-brand-red animate-pulse" />
                    <span>समाचार प्लस शॉर्ट्स (Scroll to Explore)</span>
                  </h2>
                </div>

                {shortsList.length > 0 ? (
                  shortsList.map((short, idx) => (
                    <div 
                      key={short.id}
                      className="w-full relative rounded-3xl overflow-hidden aspect-[9/16] h-[72vh] min-h-[500px] max-h-[720px] border border-slate-250 dark:border-zinc-800 shadow-2xl flex flex-col justify-between bg-zinc-900 group snap-start shrink-0 mb-6"
                    >
                      {/* Background image & gradient overlay */}
                      <div className="absolute inset-0 z-0">
                        <img
                          src={optimizeCloudinaryUrl(short.image_url, 600)}
                          alt="Short preview"
                          className="w-full h-full object-cover opacity-80 group-hover:scale-101 transition-all duration-700"
                          referrerPolicy="no-referrer"
                         onError={(e) => {
                                     e.currentTarget.onerror = null;
                                     e.currentTarget.src = DEFAULT_NEWS_IMAGE;
                                   }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10" />
                      </div>

                      {/* Top category label & short index count */}
                      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
                        <span className="bg-brand-red text-white text-[9px] font-mono tracking-widest font-black uppercase px-2.5 py-0.5 rounded-md shadow-md">
                          {categories.find((c) => c.id === short.category)?.name_hi || "ताज़ा खबर"}
                        </span>
                        <span className="bg-black/50 text-white text-[9px] font-mono px-2 py-0.5 rounded-full backdrop-blur-xs font-bold border border-white/10">
                          {idx + 1} / {shortsList.length}
                        </span>
                      </div>

                      {/* Content footer panel */}
                      <div className="relative z-20 mt-auto p-5 sm:p-7 text-white text-left font-body flex flex-col gap-3">
                        <h3 className="text-base sm:text-lg font-display font-black leading-tight tracking-tight drop-shadow-md text-white line-clamp-3">
                          {short.title}
                        </h3>
                        <p className="text-xs text-slate-250 leading-relaxed font-medium line-clamp-4 drop-shadow-sm bg-black/25 backdrop-blur-xs p-3 rounded-xl border border-white/5">
                          {short.summary || short.content}
                        </p>

                        {/* Interaction Buttons row */}
                        <div className="flex items-center justify-between gap-3 mt-3 pt-3.5 border-t border-white/10 z-20">
                          <button
                            onClick={() => setSelectedArticleId(short.id)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-brand-red hover:bg-[#9e0010] text-white text-2xs font-bold rounded-xl transition-all shadow-md cursor-pointer border border-brand-red/20 active:scale-95"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>पूरा पढ़ें</span>
                          </button>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                const key = `reaction_${short.id}_like`;
                                const prev = parseInt(localStorage.getItem(key) || "0");
                                localStorage.setItem(key, String(prev + 1));
                                localStorage.setItem(`reacted_${short.id}`, "like");
                                alert("👍 पसंद! धन्यवाद।");
                              }}
                              className="p-2 bg-black/40 hover:bg-black/60 rounded-full border border-white/10 text-white flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                              title="पसंद करें"
                            >
                              <Heart className="w-4 h-4 text-rose-500 fill-current" />
                            </button>
                            
                            <button
                              onClick={() => {
                                const shareUrl = `${window.location.origin}/?article=${short.id}`;
                                if (navigator.share) {
                                  navigator.share({ title: short.title, url: shareUrl });
                                } else {
                                  window.open(`https://wa.me/?text=${encodeURIComponent(short.title + " " + shareUrl)}`, "_blank");
                                }
                              }}
                              className="p-2 bg-black/40 hover:bg-black/60 rounded-full border border-white/10 text-white flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                              title="साझा करें"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 text-slate-400 font-body text-xs">
                    शॉर्ट्स के लिए कोई लेख उपलब्ध नहीं है।
                  </div>
                )}
              </div>
            ) : selectedCategory === "stories" ? (
              <div className="w-full max-w-4xl mx-auto py-2 sm:py-6 flex flex-col gap-6 animate-fade-in pb-24">
                <div className="text-left w-full flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                  <h2 className="font-display font-black text-sm sm:text-base text-brand-red dark:text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-5 h-5 text-brand-red fill-current animate-pulse" />
                    <span>वेब स्टोरीज़ (Visual Web Stories)</span>
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-2">
                  {WEB_STORIES.map((story) => (
                    <div
                      key={story.id}
                      onClick={() => {
                        setActiveStory(story);
                        setActiveStorySlideIndex(0);
                      }}
                      className="group flex flex-col cursor-pointer shrink-0 rounded-2xl overflow-hidden relative shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-zinc-850 bg-zinc-900 aspect-[3/4]"
                    >
                      <img
                        src={story.coverImage}
                        alt={story.title}
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                       onError={(e) => {
                                     e.currentTarget.onerror = null;
                                     e.currentTarget.src = DEFAULT_NEWS_IMAGE;
                                   }} />
                      {/* Deep gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent z-10" />
                      
                      {/* Immersive Badge & Title */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 z-20 text-left pointer-events-none flex flex-col gap-1.5">
                        <span className="inline-block bg-brand-red text-white text-[8px] font-mono tracking-widest font-black uppercase px-2 py-0.5 rounded w-max">
                          STORY
                        </span>
                        <h3 className="text-2xs sm:text-xs font-bold text-white leading-tight font-body line-clamp-3">
                          {story.title}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* DISPLAY HERO BLOCK ONLY WHEN FEED IS NOT FILTERED */}
                {selectedCategory === "all" && (
                  <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
                    {/* LHS Highlight Banner / Carousel */}
                    {finalSliderArticles.length > 0 && (
                      <div className="lg:col-span-8 relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-md aspect-[16/9] w-full bg-slate-105 dark:bg-zinc-900 group">
                        <AnimatePresence mode="wait">
                          {finalSliderArticles.map((slideArt, index) => {
                            if (index !== activeSlideIndex) return null;
                            return (
                              <motion.div
                                key={slideArt.id}
                                initial={{ opacity: 0, scale: 1.01 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                onClick={() => setSelectedArticleId(slideArt.id)}
                                className="absolute inset-0 cursor-pointer flex flex-col h-full w-full"
                              >
                                <img
                                  src={optimizeCloudinaryUrl(slideArt.image_url, 1000)}
                                  alt={slideArt.title}
                                  className="w-full h-full object-cover transition-transform duration-[1200ms] cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-104"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = DEFAULT_NEWS_IMAGE;
                                  }}
                                />
                                {/* Deeper gradient overlay for excellent text legibility */}
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10" />
                                
                                {/* Positioned Typography */}
                                <div className="p-5 sm:p-8 absolute bottom-0 left-0 right-0 text-white flex flex-col items-start font-body z-20 pointer-events-none">
                                  <span className="inline-block bg-brand-red text-white font-mono text-[10px] uppercase font-black px-2.5 py-0.5 rounded-md mb-2 md:mb-3 shadow-xs tracking-wider">
                                    {categories.find((c) => c.id === slideArt.category)?.name_hi || "राजनीति"}
                                  </span>
                                  <h1 className="text-base sm:text-xl md:text-3xl font-display font-black leading-tight tracking-tight line-clamp-2 sm:line-clamp-3 mb-2 text-shadow-md">
                                    {slideArt.title}
                                  </h1>
                                  <p className="text-2xs sm:text-xs text-zinc-300 font-medium line-clamp-2 md:line-clamp-3 leading-relaxed max-w-2xl">
                                    {slideArt.summary || (slideArt.content.length > 160 ? slideArt.content.substring(0, 160) + "..." : slideArt.content)}
                                  </p>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>

                        {/* Manual Left/Right Navigation Buttons */}
                        {finalSliderArticles.length > 1 && (
                          <>
                            <button
                              onClick={prevSlide}
                              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/55 hover:bg-brand-red/90 text-white p-2.5 rounded-full backdrop-blur-xs transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 z-20 flex items-center justify-center cursor-pointer shadow-md hover:scale-105 active:scale-95 animate-fade-in border border-white/5"
                              aria-label="Previous Slide"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <button
                              onClick={nextSlide}
                              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/55 hover:bg-brand-red/90 text-white p-2.5 rounded-full backdrop-blur-xs transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 z-20 flex items-center justify-center cursor-pointer shadow-md hover:scale-105 active:scale-95 animate-fade-in border border-white/5"
                              aria-label="Next Slide"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </>
                        )}

                        {/* Bottom Dot Indicators */}
                        {finalSliderArticles.length > 1 && (
                          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                            {finalSliderArticles.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentSlide(idx);
                                }}
                                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                  idx === activeSlideIndex
                                    ? "w-6 sm:w-8 bg-brand-red shadow-xs"
                                    : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/70"
                                }`}
                                aria-label={`Go to slide ${idx + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* BELOW HERO: Today's Top Headlines Strip */}
                    {filteredArticles.length > 0 && (
                      <div className="lg:col-span-8 flex flex-col gap-3 mt-1 animate-fade-in">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 bg-brand-red text-white text-[9px] font-mono font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              आज की सुर्खियाँ
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono tracking-wider">Today's Headlines</span>
                          </div>
                          <button
                            onClick={() => { setSelectedCategory("all"); setCustomFilter(null); }}
                            className="text-[10px] font-bold text-brand-red dark:text-red-400 hover:underline font-body cursor-pointer select-none"
                          >
                            सभी देखें →
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {filteredArticles.slice(0, 4).map((art, idx) => (
                            <a
                              key={art.id}
                              onClick={() => setSelectedArticleId(art.id)}
                              className="group flex gap-2.5 cursor-pointer bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl p-2.5 hover:shadow-sm hover:border-pink-100 dark:hover:border-zinc-700 transition-all duration-200 hover:-translate-y-0.5"
                            >
                              {/* Number badge */}
                              <div className="shrink-0 w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-100 dark:border-red-500/20">
                                <span className="text-xs font-black text-brand-red dark:text-red-400 font-mono">{idx + 1}</span>
                              </div>
                              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                <span className="text-[9px] font-mono font-black text-brand-red dark:text-red-400 uppercase tracking-wider">
                                  {categories.find(c => c.id === art.category)?.name_hi || "ताज़ा"}
                                </span>
                                <h3 className="text-[11px] font-bold text-slate-800 dark:text-zinc-100 group-hover:text-brand-red transition-colors line-clamp-2 leading-snug font-body">
                                  {art.title}
                                </h3>
                                <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono flex items-center gap-0.5 mt-0.5">
                                  <Eye className="w-2.5 h-2.5" /> {art.views || 0}
                                </span>
                              </div>
                              <div className="shrink-0 w-16 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800">
                                <img
                                  src={optimizeCloudinaryUrl(art.image_url, 120)}
                                  alt={art.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_NEWS_IMAGE; }}
                                />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* RHS Columns: Recent updates news & Ads */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                      <h2 className="text-sm font-display font-black text-brand-red dark:text-red-500 border-b border-slate-200 dark:border-zinc-800 pb-2.5 uppercase tracking-wider flex items-center justify-between">
                        <span>ताज़ा अपडेट</span>
                        <span className="flex items-center gap-1">
                          <span className="text-[10px] font-mono tracking-widest text-slate-400 dark:text-zinc-500 uppercase">LIVE</span>
                          <span className="w-2 h-2 rounded-full bg-brand-red animate-ping" />
                        </span>
                      </h2>

                      <div className="flex flex-col gap-3.5 max-h-[750px] overflow-y-auto pr-1.5 custom-scrollbar">
                        {sideUpdateArticles.length > 0 ? (
                          sideUpdateArticles.map((art) => (
                            <a
                              key={art.id}
                              onClick={() => setSelectedArticleId(art.id)}
                              className="flex gap-3.5 group cursor-pointer bg-white dark:bg-zinc-900 border border-slate-105 dark:border-zinc-800/80 p-2.5 rounded-xl transition-all duration-300 hover:shadow-xs hover:border-slate-200 dark:hover:border-zinc-750 hover:-translate-y-0.5"
                            >
                              <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 relative shadow-2xs">
                                <img
                                  src={optimizeCloudinaryUrl(art.image_url, 150)}
                                  alt={art.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                 onError={(e) => {
                                     e.currentTarget.onerror = null;
                                     e.currentTarget.src = DEFAULT_NEWS_IMAGE;
                                   }} />
                                {art.is_video && (
                                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                    <Video className="w-5 h-5 text-white drop-shadow-md" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col justify-center font-body flex-grow min-w-0">
                                <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100 group-hover:text-brand-red transition-colors line-clamp-2 leading-snug">
                                  {art.title}
                                </h3>
                                <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 mt-1.5 flex items-center gap-1">
                                  <Calendar className="w-2.5 h-2.5 text-brand-red" /> {art.published_at}
                                </span>
                              </div>
                            </a>
                          ))
                        ) : (
                          <div className="text-center py-8 text-xs text-gray-400 font-body">
                            कोई अतिरिक्त समाचार उपलब्ध नहीं है।
                          </div>
                        )}
                      </div>

                      {/* Standard sponsored advertisement block */}
                      <div className="w-full h-24 bg-slate-50 dark:bg-zinc-900 border border-slate-105 dark:border-zinc-800/60 flex items-center justify-center rounded-xl mt-1.5 group select-none transition-colors duration-300">
                        <span className="font-mono text-[9px] text-slate-400 dark:text-zinc-500 tracking-widest uppercase transition-colors group-hover:text-brand-red">
                          — विज्ञापन / Sponsored —
                        </span>
                      </div>
                    </div>
                  </section>
                )}

                {/* HORIZONTAL WEB STORIES CAROUSEL */}
                {selectedCategory === "all" && (
                  <section className="scroll-mt-24 animate-fade-in">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-zinc-800 pb-3">
                      <BookOpen className="w-5 h-5 text-brand-red fill-current" />
                      <h2 className="font-display font-black text-slate-800 dark:text-white text-base sm:text-lg tracking-wide uppercase">
                        वेब स्टोरीज़ (Visual Web Stories)
                      </h2>
                    </div>
                    
                    <div className="flex overflow-x-auto no-scrollbar scroll-smooth gap-4 pb-4 px-1 w-full">
                      {WEB_STORIES.map((story) => (
                        <div
                          key={story.id}
                          onClick={() => {
                            setActiveStory(story);
                            setActiveStorySlideIndex(0);
                          }}
                          className="group flex flex-col cursor-pointer shrink-0 w-[160px] sm:w-[180px] h-[240px] sm:h-[270px] rounded-2xl overflow-hidden relative shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-zinc-800/80 bg-zinc-900"
                        >
                          <img
                            src={story.coverImage}
                            alt={story.title}
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                           onError={(e) => {
                                     e.currentTarget.onerror = null;
                                     e.currentTarget.src = DEFAULT_NEWS_IMAGE;
                                   }} />
                          {/* Deep gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent z-10" />
                          
                          {/* Immersive Badge & Title */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 z-20 text-left pointer-events-none flex flex-col gap-1">
                            <span className="inline-block bg-brand-red text-white text-[8px] font-mono tracking-widest font-black uppercase px-1.5 py-0.5 rounded w-max">
                              STORY
                            </span>
                            <h3 className="text-2xs sm:text-xs font-bold text-white leading-tight font-body line-clamp-3">
                              {story.title}
                            </h3>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* TRENDING NEWS SECTION */}
                {selectedCategory === "all" && trendingArticles.length > 0 && (
                  <section className="scroll-mt-24 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-6 rounded-2xl shadow-xs animate-fade-in">
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-zinc-800 pb-3">
                      <span className="bg-brand-red text-white p-1 rounded-lg">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                        </svg>
                      </span>
                      <h2 className="font-display font-black text-slate-800 dark:text-white text-base sm:text-lg tracking-wide uppercase">
                        ट्रेंडिंग समाचार (Trending News)
                      </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      {trendingArticles.map((art, idx) => (
                        <a
                          key={art.id}
                          onClick={() => setSelectedArticleId(art.id)}
                          className="flex flex-col justify-between group cursor-pointer border-r last:border-r-0 border-slate-200/60 dark:border-zinc-800/80 pr-4 last:pr-0"
                        >
                          <div className="flex flex-col gap-2">
                            <span className="font-display font-black text-3xl sm:text-4xl text-slate-200 dark:text-zinc-800/60 group-hover:text-brand-red transition-colors duration-300">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <span className="text-[10px] font-mono text-brand-red font-extrabold uppercase tracking-wider">
                              {categories.find((c) => c.id === art.category)?.name_hi}
                            </span>
                            <h3 className="text-xs font-extrabold text-slate-800 dark:text-zinc-100 group-hover:text-brand-red leading-snug line-clamp-3">
                              {art.title}
                            </h3>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-4 block">
                            दिखावट: {art.views || 0}
                          </span>
                        </a>
                      ))}
                    </div>
                  </section>
                )}

                {/* EDITOR'S PICKS SECTION */}
                {selectedCategory === "all" && articles.length > 4 && (
                  <section className="scroll-mt-24 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-brand-red mb-6">
                      <h2 className="font-display font-black text-slate-800 dark:text-white pb-2 flex items-center gap-2 text-base sm:text-lg">
                        <BookmarkIcon className="w-5 h-5 text-brand-red fill-current" /> संपादक की पसंद (Editor's Picks)
                      </h2>
                    </div>
                    <div className="flex overflow-x-auto no-scrollbar scroll-smooth gap-6 pb-4 px-1 w-full">
                      {articles.slice(1, 6).map((art) => (
                        <a
                          key={art.id}
                          onClick={() => setSelectedArticleId(art.id)}
                          className="group flex flex-col cursor-pointer bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700/80 transition-all duration-300 hover:-translate-y-1 shrink-0 w-[285px] sm:w-[305px]"
                        >
                          <div className="aspect-[16/10] w-full overflow-hidden bg-slate-50 relative">
                            <img
                              src={art.image_url}
                              alt={art.title}
                              className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-[700ms] ease-out"
                              referrerPolicy="no-referrer"
                             onError={(e) => {
                                     e.currentTarget.onerror = null;
                                     e.currentTarget.src = DEFAULT_NEWS_IMAGE;
                                   }} />
                            <span className="absolute top-3 left-3 bg-brand-red text-white font-mono text-[9px] uppercase font-black px-2 py-0.5 rounded-md shadow-xs">
                              PICK
                            </span>
                          </div>
                          <div className="p-4 flex-grow flex flex-col justify-between font-body">
                            <div>
                              <span className="text-[10px] font-mono text-brand-red font-bold uppercase tracking-wider mb-1.5 block">
                                {categories.find((c) => c.id === art.category)?.name_hi}
                              </span>
                              <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-zinc-100 group-hover:text-brand-red line-clamp-2 leading-snug">
                                {art.title}
                              </h3>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 block mt-3">
                              {art.published_at}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </section>
                )}

                {/* DYNAMIC WORLD / INTERNATIONAL SECTION */}
                {selectedCategory === "all" && worldArticles.length > 0 && (
                  <section className="scroll-mt-24">
                    <div className="flex items-center justify-between border-b border-brand-red mb-6">
                      <h2 className="font-display font-extrabold text-[#111827] dark:text-white pb-2 flex items-center gap-2">
                        <Globe2 className="w-5 h-5 text-brand-red" /> दुनिया (International)
                      </h2>
                      <button
                        onClick={() => setSelectedCategory("world")}
                        className="text-[10px] font-mono font-bold text-brand-red dark:text-red-500 hover:underline"
                      >
                        सभी देखें &gt;
                      </button>
                    </div>
                    <div className="flex overflow-x-auto no-scrollbar scroll-smooth gap-5 pb-4 px-1 w-full">
                      {worldArticles.map((art) => (
                        <a
                          key={art.id}
                          onClick={() => setSelectedArticleId(art.id)}
                          className="group flex flex-col cursor-pointer bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 shrink-0 w-[285px] sm:w-[305px]"
                        >
                          <div className="aspect-video w-full overflow-hidden bg-gray-100">
                            <img
                              src={art.image_url}
                              alt={art.title}
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                             onError={(e) => {
                                     e.currentTarget.onerror = null;
                                     e.currentTarget.src = DEFAULT_NEWS_IMAGE;
                                   }} />
                          </div>
                          <div className="p-3.5 flex-grow flex flex-col justify-between font-body">
                            <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100 group-hover:text-brand-red line-clamp-2 leading-snug">
                              {art.title}
                            </h3>
                            <span className="text-[9px] font-mono text-gray-50 dark:text-zinc-400 mt-3 block">
                              {art.published_at}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </section>
                )}

                {/* SIZABLE LEADERBOARD SPONSORED BANNER AD */}
                {selectedCategory === "all" && (
                  <section className="w-full h-[85px] sm:h-[135px] bg-[#efeded]/70 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 flex items-center justify-center rounded-xl overflow-hidden select-none relative group">
                    <span className="font-mono text-[10px] text-gray-400 dark:text-zinc-500 tracking-widest uppercase transition-colors group-hover:text-brand-red z-10">
                      विज्ञापन - 970 x 250 (Sponsored Leaderboard Space)
                    </span>
                    <div className="absolute right-4 bottom-2 text-[8px] font-mono text-gray-300">SAMACHAR PLUS DISPLAY LAYER</div>
                  </section>
                )}

                {/* SLEEK VIDEO NEWS HORIZONTAL BAR CONTAINER */}
                {selectedCategory === "all" && videoArticles.length > 0 && (
                  <section className="bg-zinc-900 dark:bg-zinc-950 p-5 sm:p-7 rounded-xl border border-zinc-850 shadow-lg select-normal">
                    <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-3">
                      <Tv className="w-6 h-6 text-brand-red animate-pulse" />
                      <h2 className="font-display font-extrabold text-sm sm:text-base text-white tracking-wide uppercase">
                        वीडियो समाचार (Exclusive Clips)
                      </h2>
                    </div>
                    <div className="flex overflow-x-auto no-scrollbar scroll-smooth gap-5 pb-4 px-1 w-full">
                      {videoArticles.map((video) => (
                        <div
                          key={video.id}
                          onClick={() => setSelectedArticleId(video.id)}
                          className="group cursor-pointer flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-all shadow-md shrink-0 w-[295px] sm:w-[340px]"
                        >
                          <div className="relative aspect-video w-full overflow-hidden bg-black">
                            <img
                              src={video.image_url}
                              alt={video.title}
                              className="w-full h-full object-cover opacity-75 group-hover:scale-102 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                             onError={(e) => {
                                     e.currentTarget.onerror = null;
                                     e.currentTarget.src = DEFAULT_NEWS_IMAGE;
                                   }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="w-12 h-12 rounded-full bg-brand-red flex items-center justify-center text-white opacity-90 group-hover:opacity-100 group-hover:scale-110 shadow-lg transition-all">
                                <Video className="w-5 h-5 fill-current" />
                              </span>
                            </div>
                            {video.video_duration && (
                              <div className="absolute bottom-2.5 right-2.5 bg-black/85 text-white text-[9px] px-1.5 py-0.5 rounded font-bold font-mono">
                                {video.video_duration}
                              </div>
                            )}
                          </div>
                          <div className="p-3 font-body">
                            <h3 className="text-xs font-bold text-gray-100 group-hover:text-brand-red line-clamp-2 leading-relaxed">
                              {video.title}
                            </h3>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* SCIENCE & HEALTH BANNER */}
                {selectedCategory === "all" && scienceArticles.length > 0 && (
                  <section className="scroll-mt-24">
                    <div className="flex items-center justify-between border-b border-brand-red mb-6">
                      <h2 className="font-display font-extrabold text-[#111827] dark:text-white pb-2 flex items-center gap-2">
                        <Atom className="w-5 h-5 text-brand-red" /> विज्ञान और स्वास्थ्य
                      </h2>
                      <button
                        onClick={() => setSelectedCategory("science-health")}
                        className="text-[10px] font-mono font-bold text-brand-red dark:text-red-500 hover:underline"
                      >
                        सभी देखें &gt;
                      </button>
                    </div>
                    <div className="flex overflow-x-auto no-scrollbar scroll-smooth gap-5 pb-4 px-1 w-full">
                      {scienceArticles.map((art) => (
                        <a
                          key={art.id}
                          onClick={() => setSelectedArticleId(art.id)}
                          className="flex flex-col sm:flex-row gap-4 group p-3.5 border border-gray-150 dark:border-zinc-800 dark:bg-zinc-900/40 rounded-xl hover:bg-white hover:shadow-md transition-all cursor-pointer shadow-xs shrink-0 w-[295px] sm:w-[480px]"
                        >
                          <div className="w-full sm:w-32 aspect-square rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img
                              src={art.image_url}
                              alt={art.title}
                              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                             onError={(e) => {
                                     e.currentTarget.onerror = null;
                                     e.currentTarget.src = DEFAULT_NEWS_IMAGE;
                                   }} />
                          </div>
                          <div className="flex flex-col justify-between font-body flex-grow min-w-0">
                            <div>
                              <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-zinc-100 group-hover:text-brand-red leading-snug mb-1 line-clamp-2">
                                {art.title}
                              </h3>
                              <p className="text-[11px] text-gray-500 line-clamp-2">
                                {art.content}
                              </p>
                            </div>
                            <span className="text-[10px] text-brand-red font-bold mt-2 font-mono">
                              {art.published_at}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </section>
                )}

                {/* PRIMARY DYNAMIC FEED PORTLET OR "अन्य प्रमुख खबरें" */}
                <section className="scroll-mt-24 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-200 dark:border-zinc-800 pb-3">
                    <h2 className="font-display font-black text-slate-800 dark:text-white text-base sm:text-lg flex items-center gap-2">
                      <span>
                        {selectedCategory === "all"
                          ? "अन्य प्रमुख खबरें (हालिया)"
                          : `${categories.find((c) => c.id === selectedCategory)?.name_hi || "विशेष"} समाचार`}
                      </span>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                        {filteredArticles.length}
                      </span>
                    </h2>
                  </div>

                  {/* Horizontally scrollable content feed */}
                  <div className="flex overflow-x-auto no-scrollbar scroll-smooth gap-5 pb-4 px-1 w-full">
                    {filteredArticles.map((art) => (
                      <article
                        key={art.id}
                        onClick={() => setSelectedArticleId(art.id)}
                        className="flex flex-col gap-2.5 group cursor-pointer bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-xl overflow-hidden p-3 hover:shadow-md transition-all shrink-0 w-[280px] sm:w-[300px]"
                      >
                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 border border-slate-150/50 dark:border-zinc-800/80 relative">
                          <img
                            src={art.image_url}
                            alt={art.title}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                           onError={(e) => {
                                     e.currentTarget.onerror = null;
                                     e.currentTarget.src = DEFAULT_NEWS_IMAGE;
                                   }} />
                          {art.is_video && (
                            <div className="absolute top-2 left-2 bg-black/80 text-white rounded-full p-1 border border-white/10 flex items-center justify-center">
                              <Video className="w-3 h-3 text-brand-red" />
                            </div>
                          )}
                        </div>
                        <div className="flex-grow flex flex-col justify-between font-body">
                          <div>
                            <span className="text-[9px] font-mono text-brand-red font-bold uppercase tracking-wider mb-1 block">
                              {categories.find((c) => c.id === art.category)?.name_hi}
                            </span>
                            <h4 className="font-bold text-xs text-gray-900 dark:text-zinc-100 group-hover:text-brand-red leading-snug line-clamp-2">
                              {art.title}
                            </h4>
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 block mt-2.5">
                            {art.published_at} • Views: {art.views || 0}
                          </span>
                        </div>
                      </article>
                    ))}
                    {filteredArticles.length === 0 && (
                      <div className="w-full text-center py-16 text-slate-400 dark:text-zinc-500 font-body text-xs">
                        इस श्रेणी या जिला फ़िल्टर में अभी कोई समाचार उपलब्ध नहीं है। मुख्य समाचार देखें।
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}
              </div> {/* Closing MAIN CONTENT FEED AREA */}
            </div> {/* Closing grid wrapper */}
          </main>
        )}

        {/* COMPREHENSIVE STATIC SEARCH BAR OVERLAY */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/55 backdrop-blur-sm flex items-start justify-center p-4 pt-16"
            >
              <motion.div
                initial={{ y: -30, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: -30, scale: 0.95 }}
                className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-xl shadow-2xl relative overflow-hidden"
              >
                <div className="p-4 border-b dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-grow">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="समाचार, कीवर्ड्स या लेखक का नाम खोजें..."
                      className="w-full text-sm outline-none bg-transparent border-none text-gray-800 dark:text-zinc-100"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="बंद करें"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 max-h-[350px] overflow-y-auto font-body text-xs">
                  {searchQuery.trim() === "" ? (
                    <div className="text-center text-gray-400 p-6">
                      सर्च कीवर्ड्स टाइप करें... (उदा. चुनाव, विज्ञान, आईपीएल)
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center text-gray-500 p-6">
                      इस कीवर्ड के साथ कोई लेख नहीं मिला।
                    </div>
                  ) : (
                    <div className="space-y-3 font-body">
                      <span className="block text-[10px] font-mono text-gray-400 text-left mb-2">मिले परिणाम ({searchResults.length})</span>
                      {searchResults.map((art) => (
                        <a
                          key={art.id}
                          onClick={() => {
                            setSelectedArticleId(art.id);
                            setIsSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="flex gap-3 p-2 hover:bg-gray-50/70 dark:hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors text-left"
                        >
                          <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden shrink-0 border">
                            <img src={art.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer"  onError={(e) => {
                                     e.currentTarget.onerror = null;
                                     e.currentTarget.src = DEFAULT_NEWS_IMAGE;
                                   }} />
                          </div>
                          <div className="flex flex-col justify-center">
                            <span className="font-bold text-gray-900 dark:text-zinc-100 line-clamp-1">{art.title}</span>
                            <span className="text-[10px] text-gray-400 mt-0.5 font-mono">{art.published_at}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LIGHTBOX POPUP DETAIL OVERLAY AREA */}
        <AnimatePresence>
          {selectedArticleId && (
            <ArticleDetail
              articleId={selectedArticleId}
              onClose={() => {
                setSelectedArticleId(null);
                // Clear query params safekeeping URL aesthetic
                const url = new URL(window.location.href);
                url.searchParams.delete("article");
                window.history.pushState({}, "", url.toString());
              }}
              onArticleUpdated={fetchArticles}
            />
          )}
        </AnimatePresence>

        {/* BREAKING NEWS FLOATING TOAST */}
        <AnimatePresence>
          {breakingToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed bottom-6 right-6 bg-brand-red text-white p-4 rounded-xl shadow-2xl z-[130] w-80 border border-red-700/50 flex items-start gap-3"
            >
              <div className="p-2 bg-white/10 rounded-full text-white animate-bounce">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 font-body text-xs text-left">
                <span className="font-mono font-extrabold uppercase text-[9px] bg-white/25 px-1.5 py-0.5 rounded tracking-wider animate-pulse inline-block mb-1.5">BREAKING NEWS</span>
                <p className="font-bold leading-normal">{breakingToast}</p>
              </div>
              <button onClick={() => setBreakingToast(null)} className="text-white/60 hover:text-white font-bold font-mono">✖</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FOOTER */}
        <footer className="bg-[#e4e2e2] dark:bg-zinc-900 border-t border-gray-250 dark:border-zinc-800 py-10 px-4 sm:px-8 mt-12 transition-colors">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 flex flex-col gap-3 font-body">
              <span className="font-display font-extrabold text-[#e91e63] dark:text-pink-500 text-lg">{siteTitle}</span>
              <p className="text-xs text-brand-dark/70 dark:text-zinc-400 leading-normal">
                विश्वसनीय और निष्पक्ष समाचार, 24/7। हिंदी जगत का सर्वश्रेष्ठ समाचार मंच।
              </p>
              
              {/* Newsletter Subscription input */}
              <form onSubmit={handleNewsletterSubmit} className="mt-2 space-y-1.5">
                <span className="block text-[10px] font-mono uppercase text-gray-550 font-bold">न्यूज़लेटर सब्सक्राइब करें</span>
                <div className="flex gap-1.5">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="आपका ईमेल दर्ज करें"
                    className="flex-1 text-[11px] p-2 border border-gray-300 dark:border-zinc-700 outline-none rounded bg-white dark:bg-zinc-850 text-gray-800 dark:text-zinc-100"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-brand-red hover:bg-[#9e0010] text-white text-[10px] font-bold rounded cursor-pointer transition-colors"
                  >
                    भेजें
                  </button>
                </div>
                {newsletterSuccess && (
                  <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> सब्सक्राइब किया गया!
                  </span>
                )}
              </form>
            </div>
            
            <div className="md:col-span-3 flex flex-wrap gap-x-8 gap-y-3.5 items-center md:justify-end text-xs font-mono font-bold">
              <button onClick={() => { setSelectedCategory("all"); setCustomFilter(null); }} className="hover:text-brand-red dark:hover:text-red-400 transition-colors">मुख्य समाचार</button>
              <button onClick={() => { setSelectedCategory("politics"); setCustomFilter(null); }} className="hover:text-brand-red dark:hover:text-red-400 transition-colors">राजनीति</button>
              <button onClick={() => { setSelectedCategory("world"); setCustomFilter(null); }} className="hover:text-brand-red dark:hover:text-red-400 transition-colors">दुनिया</button>
              <button onClick={() => { setSelectedCategory("trending"); setCustomFilter(null); }} className="hover:text-brand-red dark:hover:text-red-400 transition-colors">ट्रेंडिंग</button>
              <button onClick={() => { setSelectedCategory("video"); setCustomFilter(null); }} className="hover:text-brand-red dark:hover:text-red-400 transition-colors">वीडियो</button>
              <button onClick={() => { setCustomFilter("crime"); setSelectedCategory("all"); }} className="hover:text-brand-red dark:hover:text-red-400 transition-colors">क्राइम</button>
              <button onClick={() => { setCustomFilter("education"); setSelectedCategory("all"); }} className="hover:text-brand-red dark:hover:text-red-400 transition-colors">शिक्षा/नौकरी</button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-8 pt-4 border-t border-gray-300 dark:border-zinc-800 text-center text-xs text-gray-500 font-body">
            © 2026 {siteTitle}. सर्वाधिकार सुरक्षित। • Built inside Cloud Native Applet Ecosystem
          </div>
        </footer>

        {/* MOBILE APP-LIKE BOTTOM NAVIGATION BAR */}
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800/80 z-50 flex items-center justify-around px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden select-none">
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSelectedArticleId(null);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer active:scale-95 ${
              selectedCategory === "all"
                ? "text-brand-red dark:text-red-500 font-bold"
                : "text-slate-500 dark:text-zinc-400 hover:text-brand-red"
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium font-body leading-none">होम</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory("trending");
              setSelectedArticleId(null);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer active:scale-95 ${
              selectedCategory === "trending"
                ? "text-brand-red dark:text-red-500 font-bold"
                : "text-slate-500 dark:text-zinc-400 hover:text-brand-red"
            }`}
          >
            <Flame className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium font-body leading-none">ट्रेंडिंग</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory("video");
              setSelectedArticleId(null);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer active:scale-95 ${
              selectedCategory === "video"
                ? "text-brand-red dark:text-red-500 font-bold"
                : "text-slate-500 dark:text-zinc-400 hover:text-brand-red"
            }`}
          >
            <Tv className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium font-body leading-none">वीडियो</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory("shorts");
              setSelectedArticleId(null);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer active:scale-95 ${
              selectedCategory === "shorts"
                ? "text-brand-red dark:text-red-500 font-bold"
                : "text-slate-500 dark:text-zinc-400 hover:text-brand-red"
            }`}
          >
            <Layers className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium font-body leading-none">शॉर्ट्स</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory("stories");
              setSelectedArticleId(null);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer active:scale-95 ${
              selectedCategory === "stories"
                ? "text-brand-red dark:text-red-500 font-bold"
                : "text-slate-500 dark:text-zinc-400 hover:text-brand-red"
            }`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium font-body leading-none">स्टोरीज़</span>
          </button>
        </div>

        {/* DISTRICT SELECTOR MODAL ("अपना जिला चुनें") */}
        <AnimatePresence>
          {isDistrictModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[115] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] border border-slate-100 dark:border-zinc-800"
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-150 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-850/50">
                  <div className="flex items-center gap-2 text-brand-red dark:text-red-400">
                    <MapPin className="w-5 h-5 text-brand-red fill-current animate-bounce" />
                    <h3 className="font-display font-black text-sm sm:text-base text-slate-800 dark:text-zinc-100">
                      अपना जिला चुनें (Choose Your District)
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setIsDistrictModalOpen(false);
                      setDistrictSearchQuery("");
                    }}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* District Search input */}
                <div className="p-4 border-b border-slate-100 dark:border-zinc-855 bg-white dark:bg-zinc-900">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      value={districtSearchQuery}
                      onChange={(e) => setDistrictSearchQuery(e.target.value)}
                      placeholder="जिले का नाम टाइप करें (उदा: रायपुर, बिलासपुर...)"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-zinc-700/80 rounded-xl outline-none text-xs sm:text-sm bg-slate-50/50 dark:bg-zinc-850 text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                    />
                  </div>
                </div>

                {/* District Grid list */}
                <div className="p-5 overflow-y-auto max-h-[50vh] custom-scrollbar grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50/30 dark:bg-zinc-900/20 text-xs font-semibold">
                  <button
                    onClick={() => {
                      setSelectedDistrict(null);
                      setIsDistrictModalOpen(false);
                      setDistrictSearchQuery("");
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedDistrict === null
                        ? "bg-brand-red text-white border-brand-red font-black"
                        : "bg-white dark:bg-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-750 text-slate-750 dark:text-zinc-300"
                    }`}
                  >
                    📍 सभी क्षेत्र (All Chhattisgarh)
                  </button>

                  {CHHATTISGARH_DISTRICTS.filter((d) =>
                    d.toLowerCase().includes(districtSearchQuery.toLowerCase())
                  ).map((dist) => (
                    <button
                      key={dist}
                      onClick={() => {
                        setSelectedDistrict(dist);
                        setIsDistrictModalOpen(false);
                        setDistrictSearchQuery("");
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedDistrict === dist
                          ? "bg-brand-red text-white border-brand-red font-black"
                          : "bg-white dark:bg-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-750 text-slate-750 dark:text-zinc-300"
                      }`}
                    >
                      <span>{dist}</span>
                    </button>
                  ))}

                  {CHHATTISGARH_DISTRICTS.filter((d) =>
                    d.toLowerCase().includes(districtSearchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-450 font-body text-xs">
                      कोई जिला नहीं मिला।
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* IMMERSIVE FULL-SCREEN WEB STORY PLAYER POPUP */}
        <AnimatePresence>
          {activeStory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center select-none"
            >
              <div className="relative w-full max-w-md h-full sm:h-[85vh] sm:rounded-2xl overflow-hidden flex flex-col justify-between shadow-2xl bg-zinc-950 border border-zinc-850">
                {/* Visual Slide background */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={activeStory.slides[activeStorySlideIndex].image}
                    alt="Slide background"
                    className="w-full h-full object-cover opacity-90 transition-all duration-500 ease-out"
                    referrerPolicy="no-referrer"
                   onError={(e) => {
                                     e.currentTarget.onerror = null;
                                     e.currentTarget.src = DEFAULT_NEWS_IMAGE;
                                   }} />
                  {/* Backdrop gradient masks */}
                  <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/80 to-transparent z-10" />
                  <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                </div>

                {/* Progress Indicators Bar Row */}
                <div className="absolute top-3.5 left-4 right-4 z-30 flex gap-1 items-center">
                  {activeStory.slides.map((_, slideIdx) => {
                    return (
                      <div key={slideIdx} className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-brand-red transition-all ${
                            slideIdx === activeStorySlideIndex ? "duration-[4500ms] w-full" : "w-0"
                          } ${slideIdx < activeStorySlideIndex ? "w-full" : ""}`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Top Slide controls */}
                <div className="absolute top-8 left-4 right-4 z-30 flex items-center justify-between text-white">
                  <span className="text-[10px] font-mono tracking-widest font-black bg-brand-red px-2 py-0.5 rounded shadow-sm">
                    SAMACHAR PLUS STORY
                  </span>
                  <button
                    onClick={() => setActiveStory(null)}
                    className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full border border-white/10 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Interactive Tapping regions */}
                <div className="absolute inset-0 z-10 flex">
                  {/* LHS Tap area */}
                  <div
                    onClick={() => {
                      if (activeStorySlideIndex > 0) {
                        setActiveStorySlideIndex((prev) => prev - 1);
                      } else {
                        setActiveStorySlideIndex(activeStory.slides.length - 1);
                      }
                    }}
                    className="w-[40%] h-[75%] cursor-pointer"
                  />
                  {/* Middle read-only spacer */}
                  <div className="w-[20%] h-[75%]" />
                  {/* RHS Tap area */}
                  <div
                    onClick={() => {
                      if (activeStorySlideIndex < activeStory.slides.length - 1) {
                        setActiveStorySlideIndex((prev) => prev + 1);
                      } else {
                        // Loop back or close
                        setActiveStory(null);
                      }
                    }}
                    className="w-[40%] h-[75%] cursor-pointer"
                  />
                </div>

                {/* Immersive Caption Card Overlay */}
                <div className="relative z-20 mt-auto p-6 text-white text-left font-body pointer-events-none">
                  <h4 className="text-2xs uppercase tracking-widest text-brand-red font-black mb-1">
                    {activeStory.title}
                  </h4>
                  <p className="text-sm font-bold leading-relaxed max-w-md drop-shadow-md text-slate-100 bg-black/30 backdrop-blur-xs p-3.5 rounded-xl border border-white/5 shadow-lg">
                    {activeStory.slides[activeStorySlideIndex].caption}
                  </p>
                  
                  {/* Swipe indicator helper */}
                  <span className="block text-center text-[9px] font-mono text-white/40 mt-6 tracking-widest">
                    ◀ पिछला • अगला ▶
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
