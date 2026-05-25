/**
 * Types declarations for Samachar Plus news application.
 */

export interface Article {
  id: string;
  title: string;
  content: string;
  image_url: string;
  category: string; // e.g. "politics" | "local" | "world" | "entertainment" | "video" | "science-health"
  published_at: string; // ISO date or localized string (e.g. "मई 21, 2024")
  is_video: boolean;
  video_duration?: string; // e.g. "04:15"
  is_breaking: boolean;
  views: number;
  author: string;
  status?: 'draft' | 'published' | 'scheduled';
  scheduled_for?: string;
  summary?: string;
  likes_count?: number;
  is_featured?: boolean;
  is_trending?: boolean;
  district?: string | null;
}

export interface Category {
  id: string;
  name_en: string;
  name_hi: string;
}

export interface Comment {
  id: string;
  article_id: string;
  author_name: string;
  author_email: string;
  content: string;
  created_at: string;
}

export interface SupabaseConfigState {
  url: string;
  anonKey: string;
  isConnected: boolean;
  error?: string;
}

export interface Profile {
  id: string;
  updated_at: string;
  full_name: string;
  avatar_url?: string;
  role: 'super_admin' | 'editor' | 'reporter' | 'reader';
}

export interface Bookmark {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
}

export interface Reaction {
  id: string;
  user_id: string;
  article_id: string;
  emoji_type: 'like' | 'love' | 'wow' | 'sad';
  created_at: string;
}
