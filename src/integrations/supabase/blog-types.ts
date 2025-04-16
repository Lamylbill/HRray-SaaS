
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image: string;
  meta_description: string;
  author_id: string;
  author?: {
    id: string;
    full_name?: string;
    email?: string;
  };
  created_at: string;
  updated_at: string;
  published_at: string;
  is_published: boolean;
  tags: string[];
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface BlogPostFormData {
  title: string;
  content: string;
  excerpt: string;
  meta_description: string;
  cover_image?: string;
  tags?: string[];
  category_ids?: string[];
  is_published: boolean;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id?: string;
  name: string;
  email: string;
  content: string;
  created_at: string;
  is_approved: boolean;
}
