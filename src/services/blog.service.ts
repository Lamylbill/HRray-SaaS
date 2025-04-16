
import { supabase, getAuthorizedClient } from '@/integrations/supabase/client';
import { BlogPost, BlogPostFormData, BlogCategory, BlogComment } from '@/integrations/supabase/blog-types';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate slugs
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const blogService = {
  // Get all published blog posts with pagination
  async getPosts(page = 1, pageSize = 10, categorySlug?: string): Promise<{ posts: BlogPost[], total: number }> {
    const client = getAuthorizedClient();
    
    let query = client
      .from('blog_posts')
      .select('*, blog_post_categories!inner(category_id, categories:blog_categories(*))', { count: 'exact' });
    
    // Filter by published status
    query = query.eq('is_published', true);
    
    // Filter by category if provided
    if (categorySlug) {
      query = query.eq('blog_post_categories.categories.slug', categorySlug);
    }
    
    // Add pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, count, error } = await query
      .order('published_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    
    return {
      posts: (data || []) as BlogPost[],
      total: count || 0
    };
  },
  
  // Get a single blog post by slug
  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const client = getAuthorizedClient();
    
    const { data, error } = await client
      .from('blog_posts')
      .select(`
        *,
        author:profiles(*),
        categories:blog_post_categories(
          blog_categories(*)
        )
      `)
      .eq('slug', slug)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Post not found
      }
      throw error;
    }
    
    if (!data) return null;
    
    return data as unknown as BlogPost;
  },
  
  // Get all blog categories
  async getCategories(): Promise<BlogCategory[]> {
    const client = getAuthorizedClient();
    
    const { data, error } = await client
      .from('blog_categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return (data || []) as BlogCategory[];
  },
  
  // Create a new blog post
  async createPost(postData: BlogPostFormData, userId: string): Promise<string> {
    const client = getAuthorizedClient();
    
    const slug = generateSlug(postData.title);
    
    // Start a transaction
    const { data, error } = await client
      .from('blog_posts')
      .insert({
        title: postData.title,
        slug,
        content: postData.content,
        excerpt: postData.excerpt,
        meta_description: postData.meta_description,
        cover_image: postData.cover_image || null,
        author_id: userId,
        published_at: postData.is_published ? new Date().toISOString() : null,
        is_published: postData.is_published,
        tags: postData.tags || []
      })
      .select('id')
      .single();
    
    if (error) throw error;
    
    // Link categories if provided
    if (postData.category_ids && postData.category_ids.length > 0 && data?.id) {
      const categoryLinks = postData.category_ids.map(categoryId => ({
        post_id: data.id,
        category_id: categoryId
      }));
      
      const { error: categoryError } = await client
        .from('blog_post_categories')
        .insert(categoryLinks);
      
      if (categoryError) throw categoryError;
    }
    
    return data?.id || '';
  },
  
  // Update an existing blog post
  async updatePost(id: string, postData: BlogPostFormData): Promise<void> {
    const client = getAuthorizedClient();
    
    // Update post data
    const { error } = await client
      .from('blog_posts')
      .update({
        title: postData.title,
        content: postData.content,
        excerpt: postData.excerpt,
        meta_description: postData.meta_description,
        cover_image: postData.cover_image,
        published_at: postData.is_published ? new Date().toISOString() : null,
        is_published: postData.is_published,
        tags: postData.tags || []
      })
      .eq('id', id);
    
    if (error) throw error;
    
    // Delete existing category links
    const { error: deleteError } = await client
      .from('blog_post_categories')
      .delete()
      .eq('post_id', id);
    
    if (deleteError) throw deleteError;
    
    // Insert new category links
    if (postData.category_ids && postData.category_ids.length > 0) {
      const categoryLinks = postData.category_ids.map(categoryId => ({
        post_id: id,
        category_id: categoryId
      }));
      
      const { error: insertError } = await client
        .from('blog_post_categories')
        .insert(categoryLinks);
      
      if (insertError) throw insertError;
    }
  },
  
  // Delete a blog post
  async deletePost(id: string): Promise<void> {
    const client = getAuthorizedClient();
    
    // Delete post
    const { error } = await client
      .from('blog_posts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
  
  // Add a comment to a blog post
  async addComment(postId: string, comment: Omit<BlogComment, 'id' | 'created_at' | 'is_approved'>): Promise<string> {
    const client = getAuthorizedClient();
    
    const { data, error } = await client
      .from('blog_comments')
      .insert({
        post_id: postId,
        user_id: comment.user_id || null,
        name: comment.name,
        email: comment.email,
        content: comment.content,
        is_approved: false // Require approval by default
      })
      .select('id')
      .single();
    
    if (error) throw error;
    
    return data?.id || '';
  },
  
  // Get comments for a blog post
  async getComments(postId: string): Promise<BlogComment[]> {
    const client = getAuthorizedClient();
    
    const { data, error } = await client
      .from('blog_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []) as BlogComment[];
  },
  
  // Upload an image for a blog post
  async uploadImage(file: File, userId: string): Promise<string> {
    const client = getAuthorizedClient();
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `blog-images/${userId}/${fileName}`;
    
    const { error } = await client.storage
      .from('blog-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type
      });
    
    if (error) throw error;
    
    const { data } = client.storage
      .from('blog-assets')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }
};
