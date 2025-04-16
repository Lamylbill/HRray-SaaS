
import { supabase, getAuthorizedClient } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { BlogPost, BlogPostFormData, BlogCategory, BlogComment } from '@/integrations/supabase/blog-types';

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
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    try {
      // Use type assertion to bypass TypeScript's type checking for the Supabase client
      const queryBuilder = client.from('blog_posts') as any;
      let query = queryBuilder.select('*', { count: 'exact' });
      
      // Filter by published status
      query = query.eq('is_published', true);
      
      // Apply category filter if provided
      if (categorySlug) {
        // Get category ID by slug
        const categoryQuery = client.from('blog_categories') as any;
        const { data: category } = await categoryQuery
          .select('id')
          .eq('slug', categorySlug)
          .single();
          
        if (category) {
          // Get post IDs in this category
          const postCategoryQuery = client.from('blog_post_categories') as any;
          const { data: postIds } = await postCategoryQuery
            .select('post_id')
            .eq('category_id', category.id);
            
          if (postIds && postIds.length > 0) {
            query = query.in('id', postIds.map((item: any) => item.post_id));
          }
        }
      }
      
      // Add pagination and order
      const { data, count, error } = await query
        .order('published_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      return {
        posts: (data || []) as BlogPost[],
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      return { posts: [], total: 0 };
    }
  },
  
  // Get a single blog post by slug
  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const client = getAuthorizedClient();
    
    try {
      // First get the post
      const postsQuery = client.from('blog_posts') as any;
      const { data: post, error: postError } = await postsQuery
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (postError) {
        if (postError.code === 'PGRST116') {
          return null; // Post not found
        }
        throw postError;
      }
      
      if (!post) return null;
      
      // Get author details
      const profilesQuery = client.from('profiles') as any;
      const { data: author } = await profilesQuery
        .select('id, full_name, email')
        .eq('id', post.author_id)
        .single();
        
      // Get categories
      const postCategoriesQuery = client.from('blog_post_categories') as any;
      const { data: categoryLinks } = await postCategoriesQuery
        .select('category_id')
        .eq('post_id', post.id);
        
      const categoryIds = categoryLinks?.map((link: any) => link.category_id) || [];
      
      let categories: BlogCategory[] = [];
      if (categoryIds.length > 0) {
        const categoriesQuery = client.from('blog_categories') as any;
        const { data: categoryData } = await categoriesQuery
          .select('*')
          .in('id', categoryIds);
          
        categories = (categoryData || []) as BlogCategory[];
      }
      
      // Combine everything
      const blogPost: BlogPost = {
        ...post as unknown as BlogPost,
        author: author || undefined,
        categories: categories
      };
      
      return blogPost;
    } catch (error) {
      console.error('Error fetching blog post:', error);
      return null;
    }
  },
  
  // Get all blog categories
  async getCategories(): Promise<BlogCategory[]> {
    const client = getAuthorizedClient();
    
    try {
      const categoriesQuery = client.from('blog_categories') as any;
      const { data, error } = await categoriesQuery
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      return (data || []) as BlogCategory[];
    } catch (error) {
      console.error('Error fetching blog categories:', error);
      return [];
    }
  },
  
  // Create a new blog post
  async createPost(postData: BlogPostFormData, userId: string): Promise<string> {
    const client = getAuthorizedClient();
    
    try {
      const slug = generateSlug(postData.title);
      
      // Create the post
      const postsQuery = client.from('blog_posts') as any;
      const { data, error } = await postsQuery
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
        
        const postCategoriesQuery = client.from('blog_post_categories') as any;
        const { error: categoryError } = await postCategoriesQuery
          .insert(categoryLinks);
        
        if (categoryError) throw categoryError;
      }
      
      return data?.id || '';
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw error;
    }
  },
  
  // Update an existing blog post
  async updatePost(id: string, postData: BlogPostFormData): Promise<void> {
    const client = getAuthorizedClient();
    
    try {
      // Update post data
      const postsQuery = client.from('blog_posts') as any;
      const { error } = await postsQuery
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
      const postCategoriesQuery = client.from('blog_post_categories') as any;
      const { error: deleteError } = await postCategoriesQuery
        .delete()
        .eq('post_id', id);
      
      if (deleteError) throw deleteError;
      
      // Insert new category links
      if (postData.category_ids && postData.category_ids.length > 0) {
        const categoryLinks = postData.category_ids.map(categoryId => ({
          post_id: id,
          category_id: categoryId
        }));
        
        const categoriesInsertQuery = client.from('blog_post_categories') as any;
        const { error: insertError } = await categoriesInsertQuery
          .insert(categoryLinks);
        
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error updating blog post:', error);
      throw error;
    }
  },
  
  // Delete a blog post
  async deletePost(id: string): Promise<void> {
    const client = getAuthorizedClient();
    
    try {
      // Delete post
      const postsQuery = client.from('blog_posts') as any;
      const { error } = await postsQuery
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting blog post:', error);
      throw error;
    }
  },
  
  // Add a comment to a blog post
  async addComment(postId: string, comment: Omit<BlogComment, 'id' | 'created_at' | 'is_approved'>): Promise<string> {
    const client = getAuthorizedClient();
    
    try {
      const commentsQuery = client.from('blog_comments') as any;
      const { data, error } = await commentsQuery
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
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },
  
  // Get comments for a blog post
  async getComments(postId: string): Promise<BlogComment[]> {
    const client = getAuthorizedClient();
    
    try {
      const commentsQuery = client.from('blog_comments') as any;
      const { data, error } = await commentsQuery
        .select('*')
        .eq('post_id', postId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []) as BlogComment[];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  },
  
  // Upload an image for a blog post
  async uploadImage(file: File, userId: string): Promise<string> {
    const client = getAuthorizedClient();
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `blog-images/${userId}/${fileName}`;
      
      // Ensure bucket exists
      const { data: buckets } = await client.storage.listBuckets();
      if (!buckets?.find(b => b.name === 'blog-assets')) {
        await client.storage.createBucket('blog-assets', {
          public: true
        });
      }
      
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
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
};
