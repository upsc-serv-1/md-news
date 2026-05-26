import React, { useState, useEffect } from "react";
import { Article, Comment } from "../types";
import { newsService } from "../lib/supabase";
import { X, Calendar, User, MessageSquare, Send, Share2, Check, Video, Bookmark as BookmarkIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { parseMarkdown } from "../lib/ai";
import { optimizeCloudinaryUrl } from "../lib/cloudinary";

interface ArticleDetailProps {
  articleId: string;
  onClose: () => void;
  onArticleUpdated?: () => void;
}

export default function ArticleDetail({ articleId, onClose, onArticleUpdated }: ArticleDetailProps) {
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentName, setCommentName] = useState("");
  const [commentEmail, setCommentEmail] = useState("");
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [reactions, setReactions] = useState<{ [key: string]: number }>({ like: 0, love: 0, wow: 0, sad: 0 });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      // Increment views on load
      await newsService.incrementViews(articleId);
      if (onArticleUpdated) {
        onArticleUpdated();
      }

      const art = await newsService.getArticleById(articleId);
      if (art) {
        setArticle(art);
        const coms = await newsService.getComments(articleId);
        setComments(coms);
        const reactCounts = await newsService.getReactions(articleId);
        setReactions(reactCounts);
      }
      setLoading(false);
    }
    loadData();
  }, [articleId]);

  const handleReactionClick = async (type: 'like' | 'love' | 'wow' | 'sad') => {
    let guestId = localStorage.getItem("samachar_plus_guest_id");
    if (!guestId) {
      guestId = "guest_" + Math.random().toString(36).substring(2, 11);
      localStorage.setItem("samachar_plus_guest_id", guestId);
    }
    const ok = await newsService.addOrUpdateReaction(guestId, articleId, type);
    if (ok) {
      const updatedCounts = await newsService.getReactions(articleId);
      setReactions(updatedCounts);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName || !commentEmail || !commentText) return;

    setSubmittingComment(true);
    try {
      const freshComment = await newsService.addComment(articleId, commentName, commentEmail, commentText);
      setComments((prev) => [...prev, freshComment]);
      setCommentText("");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href + "?article=" + articleId;
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!article) return;
    const text = `🔥 *${article.title}*\n\n${article.content.substring(0, 100)}...\n\nपूरी खबर पढ़ें समाचार प्लस पर:\n${window.location.href}?article=${articleId}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-zinc-950/70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto backdrop-blur-xs"
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="bg-white dark:bg-zinc-950 w-full max-w-3xl rounded-2xl shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col border border-slate-100 dark:border-zinc-800"
      >
        {/* Sticky Header inside modal */}
        <div className="bg-white dark:bg-zinc-900 border-b border-slate-150 dark:border-zinc-800/80 p-4 sticky top-0 z-10 flex items-center justify-between">
          <span className="text-xs font-mono font-bold tracking-wide text-brand-red bg-brand-red/10 dark:bg-red-500/10 dark:text-red-400 px-2.5 py-1 rounded-md inline-flex items-center gap-1">
            {article?.is_video ? <Video className="w-3.5 h-3.5" /> : null}
            {article?.category?.toUpperCase()}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white p-1 px-3 rounded-lg text-xs inline-flex items-center gap-1.5 font-bold transition-all cursor-pointer shadow-xs"
            >
              WhatsApp
            </button>
            <button
              onClick={handleCopyLink}
              className="bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 active:scale-95 p-1 px-2.5 rounded-lg text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200/50 dark:border-zinc-700"
            >
              {shareCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5" />}
              {shareCopied ? "Copied" : "Copy Link"}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 p-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 min-h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-red border-t-transparent"></div>
          </div>
        ) : article ? (
          <div className="overflow-y-auto flex-1 p-5 sm:p-7 custom-scrollbar">
            {/* Meta tags */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-zinc-400 font-mono mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brand-red dark:text-red-500" /> {article.published_at}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-brand-red dark:text-red-500" /> {article.author}
              </span>

            </div>

            {/* Headline */}
            <h1 className="text-xl sm:text-2xl md:text-3.5xl font-display font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-5">
              {article.title}
            </h1>

            {/* Image banner */}
            {article.image_url && (
              <div className="aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 mb-6 group relative">
                <img
                  src={optimizeCloudinaryUrl(article.image_url, 800)}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800";
                  }}
                />
                {article.is_video && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-brand-red text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg">
                      <Video className="w-4 h-4" /> वीडियो समाचार : {article.video_duration || "00:00"}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Article Content */}
            <div 
              className="font-body text-base text-slate-800 dark:text-zinc-200 leading-relaxed font-normal mb-8 tracking-wide prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(article.content) }}
            />

            {/* EMOTIONAL REACTION BAR */}
            <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-4 mb-8 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 font-body">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">इस खबर पर आपकी क्या प्रतिक्रिया है?</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleReactionClick("like")}
                  className="flex items-center gap-1.5 p-2 px-3 bg-white dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-full transition-all border border-slate-200/60 dark:border-zinc-700 cursor-pointer text-xs shadow-3xs"
                >
                  <span>👍</span>
                  <span className="font-bold font-mono text-slate-700 dark:text-zinc-350">{reactions.like || 0}</span>
                </button>
                <button
                  onClick={() => handleReactionClick("love")}
                  className="flex items-center gap-1.5 p-2 px-3 bg-white dark:bg-zinc-800 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 dark:hover:text-pink-400 rounded-full transition-all border border-slate-200/60 dark:border-zinc-700 cursor-pointer text-xs shadow-3xs"
                >
                  <span>❤️</span>
                  <span className="font-bold font-mono text-slate-700 dark:text-zinc-350">{reactions.love || 0}</span>
                </button>
                <button
                  onClick={() => handleReactionClick("wow")}
                  className="flex items-center gap-1.5 p-2 px-3 bg-white dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400 rounded-full transition-all border border-slate-200/60 dark:border-zinc-700 cursor-pointer text-xs shadow-3xs"
                >
                  <span>😮</span>
                  <span className="font-bold font-mono text-slate-700 dark:text-zinc-350">{reactions.wow || 0}</span>
                </button>
                <button
                  onClick={() => handleReactionClick("sad")}
                  className="flex items-center gap-1.5 p-2 px-3 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 hover:text-slate-800 dark:hover:text-slate-200 rounded-full transition-all border border-slate-200/60 dark:border-zinc-700 cursor-pointer text-xs shadow-3xs"
                >
                  <span>😢</span>
                  <span className="font-bold font-mono text-slate-700 dark:text-zinc-350">{reactions.sad || 0}</span>
                </button>
              </div>
            </div>

            {/* Comments Area */}
            <div className="mt-8 border-t border-slate-100 dark:border-zinc-800/80 pt-8">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-brand-red dark:text-red-500" /> पाठकों की राय ({comments.length})
              </h3>

              {comments.length === 0 ? (
                <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-6 text-center text-sm text-slate-500 dark:text-zinc-400 mb-6 font-body border border-slate-100 dark:border-zinc-800/50">
                  इस विषय पर अभी कोई टिप्पणी नहीं है। पहली टिप्पणी लिखकर अपनी राय साझा करें!
                </div>
              ) : (
                <div className="space-y-4 mb-8">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-150 dark:border-zinc-800/60 rounded-xl p-4 shadow-3xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-slate-800 dark:text-zinc-100">{comment.author_name}</span>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                          {new Date(comment.created_at).toLocaleDateString("hi-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-body text-slate-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment submission form */}
              <form onSubmit={handlePostComment} className="bg-slate-50 dark:bg-zinc-900/30 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-3xs">
                <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200 mb-4">अपनी टिप्पणी लिखें</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-500 dark:text-zinc-400 mb-1">पूरा नाम</label>
                    <input
                      type="text"
                      required
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      placeholder="उदा. राहुल त्यागी"
                      className="w-full text-sm border border-slate-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded-lg p-2.5 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 transition-colors shadow-3xs focus:shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-500 dark:text-zinc-400 mb-1">ईमेल पता (गोपनीय रहेगा)</label>
                    <input
                      type="email"
                      required
                      value={commentEmail}
                      onChange={(e) => setCommentEmail(e.target.value)}
                      placeholder="उदा. rahul@example.com"
                      className="w-full text-sm border border-slate-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded-lg p-2.5 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 transition-colors shadow-3xs focus:shadow-xs"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-[10px] font-mono uppercase text-slate-500 dark:text-zinc-400 mb-1">आपकी टिप्पणी</label>
                  <textarea
                    rows={3}
                    required
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="इस विषय पर अपने विचार यहाँ व्यक्त करें..."
                    className="w-full text-sm border border-slate-200 dark:border-zinc-700 outline-none focus:border-brand-red rounded-lg p-2.5 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 transition-colors shadow-3xs focus:shadow-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="bg-brand-red hover:bg-[#9e0010] active:scale-95 disabled:opacity-50 text-white font-bold text-xs p-2.5 px-5 rounded-lg inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingComment ? "प्रकाशित हो रहा है..." : "टिप्पणी सबमिट करें"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-zinc-950">
            <h1 className="text-lg font-bold text-slate-800 dark:text-zinc-200 mb-2">खबर नहीं मिली</h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4">हो सकता है इसे प्रशासक द्वारा हटा दिया गया हो।</p>
            <button onClick={onClose} className="bg-brand-red hover:bg-[#9e0010] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-xs cursor-pointer active:scale-95 transition-all">
              वापस जाएँ
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
