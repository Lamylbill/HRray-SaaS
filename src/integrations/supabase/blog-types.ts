
export interface BlogPostFormData {
  title: string;
  content: string;
  excerpt?: string;
  meta_description?: string;
  cover_image?: string;
  tags?: string[];
  category_ids?: string[];
  is_published: boolean;
  publish_at: Date | null;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  meta_description?: string;
  cover_image?: string;
  tags?: string[];
  author_id: string;
  is_published: boolean;
  publish_at?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  categories?: BlogCategory[];
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface User {
  id: string;
  email?: string;
  full_name?: string;
  userId?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id?: string;
  name: string;
  email?: string;
  content: string;
  created_at: string;
  is_approved: boolean;
}
