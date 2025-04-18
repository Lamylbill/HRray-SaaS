
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { BlogPost, BlogPostFormData, BlogCategory, BlogComment } from "./blog-types";

const PAGE_SIZE = 10;

export const blogService = {
  async getPosts(page: number = 1, pageSize: number = PAGE_SIZE): Promise<{ posts: BlogPost[]; totalCount: number }> {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize - 1;

    let { data: posts, error, count } = await supabase
      .from('blog_posts')
      .select(`
        id, title, slug, content, excerpt, cover_image, meta_description, author_id, created_at, updated_at, published_at, is_published, tags,
        author: user_profiles (id, full_name, email),
        categories: blog_categories (id, name, slug)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(startIndex, endIndex);

    if (error) {
      console.error("Error fetching posts:", error);
      throw new Error(error.message);
    }

    const totalCount = count || 0;

    return { posts: posts as BlogPost[], totalCount };
  },

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    let { data: post, error } = await supabase
      .from('blog_posts')
      .select(`
        id, title, slug, content, excerpt, cover_image, meta_description, author_id, created_at, updated_at, published_at, is_published, tags,
        author: user_profiles (id, full_name, email)
      `)
      .eq('slug', slug)
      .single();

    if (error) {
      console.error("Error fetching post by slug:", error);
      throw new Error(error.message);
    }

    return post as BlogPost | null;
  },

  async createPost(postData: BlogPostFormData, userId: string): Promise<string> {
    const slug = this.slugify(postData.title);
    const published_at = postData.is_published ? new Date().toISOString() : postData.publish_at?.toISOString();

    const { data, error } = await supabase
      .from('blog_posts')
      .insert([
        {
          title: postData.title,
          slug: slug,
          content: postData.content,
          excerpt: postData.excerpt,
          cover_image: postData.cover_image,
          meta_description: postData.meta_description,
          author_id: userId,
          is_published: postData.is_published,
          published_at: published_at,
          tags: postData.tags,
        }
      ])
      .select()

    if (error) {
      console.error("Error creating post:", error);
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      throw new Error("Failed to create post, no data returned.");
    }

    const postId = data[0].id;

    // Handle categories separately
    if (postData.category_ids && postData.category_ids.length > 0) {
      await this.setPostCategories(postId, postData.category_ids);
    }

    return postId;
  },

  async updatePost(postId: string, postData: BlogPostFormData): Promise<void> {
    const slug = this.slugify(postData.title);
    const published_at = postData.is_published ? new Date().toISOString() : postData.publish_at?.toISOString();

    const { error } = await supabase
      .from('blog_posts')
      .update({
        title: postData.title,
        slug: slug,
        content: postData.content,
        excerpt: postData.excerpt,
        cover_image: postData.cover_image,
        meta_description: postData.meta_description,
        is_published: postData.is_published,
        published_at: published_at,
        tags: postData.tags,
      })
      .eq('id', postId);

    if (error) {
      console.error("Error updating post:", error);
      throw new Error(error.message);
    }

    // Handle categories separately
    if (postData.category_ids && postData.category_ids.length > 0) {
      await this.setPostCategories(postId, postData.category_ids);
    } else {
      await this.clearPostCategories(postId);
    }
  },

  async deletePost(postId: string): Promise<void> {
    // First, delete the post_categories entries
    const { error: deleteCategoriesError } = await supabase
      .from('blog_post_categories')
      .delete()
      .eq('post_id', postId);

    if (deleteCategoriesError) {
      console.error("Error deleting post categories:", deleteCategoriesError);
      throw new Error(deleteCategoriesError.message);
    }

    // Then, delete the blog post
    const { error: deletePostError } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', postId);

    if (deletePostError) {
      console.error("Error deleting post:", deletePostError);
      throw new Error(deletePostError.message);
    }
  },

  async getCategories(): Promise<BlogCategory[]> {
    let { data: categories, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      throw new Error(error.message);
    }

    return categories as BlogCategory[];
  },

  async createCategory(name: string, slug: string): Promise<BlogCategory> {
    const { data, error } = await supabase
      .from('blog_categories')
      .insert([{ name, slug }])
      .select()

    if (error) {
      console.error("Error creating category:", error);
      throw new Error(error.message);
    }

    return data![0] as BlogCategory;
  },

  async updateCategory(categoryId: string, name: string, slug: string): Promise<void> {
    const { error } = await supabase
      .from('blog_categories')
      .update({ name, slug })
      .eq('id', categoryId);

    if (error) {
      console.error("Error updating category:", error);
      throw new Error(error.message);
    }
  },

  async deleteCategory(categoryId: string): Promise<void> {
    const { error } = await supabase
      .from('blog_categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error("Error deleting category:", error);
      throw new Error(error.message);
    }
  },

  // Updated to remove the is_approved filter
  async getComments(postSlug: string): Promise<BlogComment[]> {
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', postSlug)
      .single();

    if (postError) {
      console.error("Error fetching post for comments:", postError);
      throw new Error(postError.message);
    }

    if (!post) {
      console.log(`No post found with slug ${postSlug}`);
      return [];
    }

    let { data: comments, error: commentsError } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('post_id', post.id)
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      throw new Error(commentsError.message);
    }

    return comments as BlogComment[];
  },

  // Updated to set comments as auto-approved
  async addComment(postId: string, commentData: Omit<BlogComment, 'id' | 'created_at' | 'is_approved'>): Promise<void> {
    const { error } = await supabase
      .from('blog_comments')
      .insert([
        {
          post_id: postId,
          user_id: commentData.user_id,
          name: commentData.name,
          email: commentData.email,
          content: commentData.content,
          is_approved: true // Auto-approve all comments
        }
      ]);

    if (error) {
      console.error("Error adding comment:", error);
      throw new Error(error.message);
    }
  },

  async uploadImage(file: File, userId: string): Promise<string> {
    const imageName = `${uuidv4()}-${file.name}`;
    const imagePath = `blog-images/${userId}/${imageName}`;

    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(imagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error.message || String(error));
      throw new Error(error.message || 'Error uploading file');
    }

    const imageUrl = await this.getImageURL(imagePath);
    return imageUrl;
  },

  async getImageURL(imagePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('blog-images')
      .getPublicUrl(imagePath)

    if (error) {
      console.error('Error getting file URL:', error.message || String(error));
      throw new Error(error.message || 'Error getting file URL');
    }

    return data.publicUrl;
  },

  // Remove private modifiers as they're not allowed in a JavaScript object
  slugify(text: string): string {
    return text
      .toString()                           // Cast to string
      .toLowerCase()                          // Convert the string to lowercase letters
      .normalize("NFD")                      // Remove accents
      .trim()                               // Remove whitespace from both ends
      .replace(/\s+/g, '-')                 // Replace spaces with -
      .replace(/[^\w\-]+/g, '')             // Remove all non-word chars
      .replace(/\-\-+/g, '-');               // Replace multiple - with single -
  },

  // Remove private modifiers as they're not allowed in a JavaScript object
  async setPostCategories(postId: string, categoryIds: string[]): Promise<void> {
    // Clear existing categories for the post
    await this.clearPostCategories(postId);

    // Insert new categories
    const postCategories = categoryIds.map(categoryId => ({
      post_id: postId,
      category_id: categoryId
    }));

    const { error } = await supabase
      .from('blog_post_categories')
      .insert(postCategories);

    if (error) {
      console.error("Error setting post categories:", error);
      throw new Error(error.message);
    }
  },

  // Remove private modifiers as they're not allowed in a JavaScript object
  async clearPostCategories(postId: string): Promise<void> {
    const { error } = await supabase
      .from('blog_post_categories')
      .delete()
      .eq('post_id', postId);

    if (error) {
      console.error("Error clearing post categories:", error);
      throw new Error(error.message);
    }
  }
};
