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
    
    // Type assertion to ensure compatibility
    const typedPosts = (posts || []).map(post => {
      // Safely handle author data with optional chaining and nullish coalescing
      const authorData = {
        id: post.author_id || '',
        full_name: undefined,
        email: undefined
      };
      
      // Handle author data if it exists and is in expected array format
      if (post.author && Array.isArray(post.author) && post.author.length > 0) {
        authorData.id = post.author[0].id || post.author_id || '';
        authorData.full_name = post.author[0].full_name;
        authorData.email = post.author[0].email;
      }
      
      // Check if categories is an array
      const categoriesData = Array.isArray(post.categories) ? post.categories : [];
      
      return {
        ...post,
        author: authorData,
        categories: categoriesData
      } as BlogPost;
    });

    return { posts: typedPosts, totalCount };
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

    if (!post) return null;

    // Initialize author data with defaults
    const authorData = {
      id: post.author_id || '',
      full_name: undefined,
      email: undefined
    };
    
    // Handle author data if it exists and is in expected array format
    if (post.author && Array.isArray(post.author) && post.author.length > 0) {
      authorData.id = post.author[0].id || post.author_id || '';
      authorData.full_name = post.author[0].full_name;
      authorData.email = post.author[0].email;
    }

    // Type assertion to ensure compatibility
    const typedPost: BlogPost = {
      ...post,
      author: authorData,
      categories: []
    };

    return typedPost;
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

  async getComments(postId: string): Promise<BlogComment[]> {
    console.log('Getting comments for post ID:', postId);
    // If no post ID is provided, return an empty array. This prevents a Supabase error.
    if (!postId) return [];


    let { data: comments, error: commentsError } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('post_id', post.id)
      .order('created_at', { ascending: false });


    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      throw new Error(commentsError.message);
    }

    return (comments as BlogComment[]) || [];
  },

  async addComment(postId: string, commentData: Omit<BlogComment, 'id' | 'created_at' | 'is_approved' | 'name'>): Promise<void> {
    console.log('Adding comment');
    const cuteNames = [
      "The Onboarder", "The Culture Keeper", "The Team Builder", "The Benefits Guru",
      "The Performance Pro", "The Engagement Expert", "The Talent Scout", "The Policy Pilot"
    ];
    const randomName = cuteNames[Math.floor(Math.random() * cuteNames.length)];

    const { error } = await supabase
      .from('blog_comments')
      .insert([
        {
          post_id: postId,
          user_id: commentData.user_id,
          name: randomName,
          email: commentData.email,
          content: commentData.content,
          is_approved: true,
        },
      ]);

    if (error) {
      console.error("Error adding comment:", error);
      throw new Error(error.message);
    }
  },

  async deleteComment(commentId: string, userId: string): Promise<void> {
    if (userId !== 'b17956a5-afbc-405b-af67-b02a93afc787') {
      throw new Error("Unauthorized: Only specific user can delete comments.");
    }

    const { error } = await supabase
      .from('blog_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      throw new Error(error.message);
    }
  },

  async updatePostStatus(postId: string, status: 'Draft' | 'Published' | 'Scheduled', publishDate?: string): Promise<void> {
    const updateFields: { is_published: boolean, published_at?: string } = {
      is_published: status === 'Published',
    };

    if (status === 'Published') {
      updateFields.published_at = new Date().toISOString();
    } else if (status === 'Scheduled' && publishDate) {
      updateFields.published_at = publishDate;
    } else {
      updateFields.published_at = null; // For Draft or clearing a scheduled date
    }

    const { error } = await supabase
      .from('blog_posts')
      .update(updateFields)
      .eq('id', postId);

    if (error) {
      console.error(`Error updating post status to ${status}:`, error);
      throw new Error(error.message);
    }
  },

  async getPostStatus(postId: string): Promise<{ status: 'Draft' | 'Published' | 'Scheduled', published_at?: string }> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('is_published, published_at')
      .eq('id', postId)
      .single();

    if (error) {
      console.error("Error fetching post status:", error);
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Post not found");
    }

    let status: 'Draft' | 'Published' | 'Scheduled';
    if (data.is_published) {
      status = 'Published';
    } else if (data.published_at) {
      status = 'Scheduled';
    } else {
      status = 'Draft';
    }

    return { status, published_at: data.published_at || undefined };
  },

  async updateTags(postId: string, tags: string[]): Promise<void> {
    const { error } = await supabase
      .from('blog_posts')
      .update({ tags: tags })
      .eq('id', postId);

    if (error) {
      console.error("Error updating tags:", error);
      throw new Error(error.message);
    }
  },

  async getPostTags(postId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('tags')
      .eq('id', postId)
      .single();

    if (error) {
      console.error("Error fetching tags:", error);
      throw new Error(error.message);
    }

    return data?.tags || [];
  },

  async getPostsByStatus(status: 'Draft' | 'Published' | 'Scheduled', page: number = 1, pageSize: number = PAGE_SIZE): Promise<{ posts: BlogPost[]; totalCount: number }> {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize - 1;

    let query = supabase
      .from('blog_posts')
      .select(`
        id, title, slug, content, excerpt, cover_image, meta_description, author_id, created_at, updated_at, published_at, is_published, tags,
        author: user_profiles (id, full_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(startIndex, endIndex);

    if (status === 'Published') {
      query = query.eq('is_published', true);
    } else if (status === 'Scheduled') {
      query = query.not('published_at', 'is', null).gt('published_at', new Date().toISOString());
    } else {
      query = query.eq('is_published', false).is('published_at', null);
    }

    const { data: posts, error, count } = await query;

    if (error) {
      console.error(`Error fetching ${status} posts:`, error);
      throw new Error(error.message);
    }

    const totalCount = count || 0;

    const typedPosts = (posts || []).map(post => {
      const authorData = {
        id: post.author_id || '',
        full_name: undefined,
        email: undefined
      };

      if (post.author && Array.isArray(post.author) && post.author.length > 0) {
        authorData.id = post.author[0].id || post.author_id || '';
        authorData.full_name = post.author[0].full_name;
        authorData.email = post.author[0].email;
      }

      return {
        ...post,
        author: authorData,
        categories: [] // Assuming categories are not filtered by status
      } as BlogPost;
    });

    return { posts: typedPosts, totalCount };
  },

  // Helper function to determine post status based on database fields
  determinePostStatus(post: BlogPost): 'Draft' | 'Published' | 'Scheduled' {
    if (post.is_published) {
      return 'Published';
    } else if (post.published_at) {
      return 'Scheduled';
    } else {
      return 'Draft';
    }
  }
};
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
    const { data } = await supabase.storage
      .from('blog-images')
      .getPublicUrl(imagePath);

    if (!data || !data.publicUrl) {
      throw new Error('Error getting file URL');
    }

    return data.publicUrl;
  },

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
