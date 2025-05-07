
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogService } from '@/services/blog.service';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { BlogPost, BlogComment } from '@/integrations/supabase/blog-types';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Calendar, Tag, MessageSquare, Share2, Facebook, Linkedin, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Helmet } from 'react-helmet-async';
import { v4 as uuidv4 } from 'uuid';

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const { user } = useAuth();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const loadPost = async () => {
      setIsLoadingPost(true);
      try {
        const postData = await blogService.getPostBySlug(slug);
        if (postData) {
          setPost(postData);
          document.title = `${postData.title} | HRFlow Blog`;
        } else {
          toast({
            title: 'Not Found',
            description: 'The requested blog post does not exist.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error loading blog post:', error);
        toast({
          title: 'Error',
          description: 'Failed to load the blog post. Please try again later.',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingPost(false);
      }
    };

    loadPost();
  }, [slug, toast]);

  useEffect(() => {
    if (post) {
      const loadComments = async () => {
        setIsLoadingComments(true);
        try {
          if (post && post.id) {
            const commentsData = await blogService.getComments(post.id);
            setComments(commentsData);
          } else {
            console.warn("Post ID is undefined, cannot fetch comments.");
            setComments([]);
          }
        } catch (error) {
          console.error('Error loading comments:', error);
          toast({
            title: 'Error',
            description: 'Failed to load comments for this post.',
            variant: 'destructive'
          });
          setComments([]);
        } finally {
          setIsLoadingComments(false);
        }
      };
      loadComments();
    }
  }, [post]);

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!post || !post.id) {
      toast({
        title: 'Error',
        description: 'Unable to submit comment: Post information is missing.',
        variant: 'destructive',
      });
      return;
    }

    if (!commentContent.trim()) {
      toast({
        title: 'Warning',
        description: 'Please enter a comment before submitting.',
        variant: 'default',
      });
      return;
    }

    setIsSubmittingComment(true);
    try {
      const userName = user ? (user as any).full_name || 'Anonymous' : 'Anonymous';
      const userEmail = user ? user.email || '' : '';
      
      const newComment = {
        post_id: post.id,
        content: commentContent,
        user_id: user?.id || null,
        name: userName,
        email: userEmail,
        is_approved: true
      };
      await blogService.addComment(post.id, newComment);
      setComments(prevComments => [...prevComments, {
        id: uuidv4(),
        created_at: new Date().toISOString(),
        post_id: post.id,
        content: commentContent,
        user_id: user?.id || null,
        name: userName,
        email: userEmail,
        is_approved: true
      }]);
      setCommentContent('');
      toast({
        title: "Comment added",
        description: "Your comment has been added and will be visible once approved",
        variant: "default"
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit comment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !user.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to delete comments.',
        variant: 'destructive',
      });
      return;
    }

    setIsDeletingComment(true);
    try {
      await blogService.deleteComment(commentId, user.id);
      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
      toast({
        title: 'Success',
        description: 'Comment deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const renderAuthorInfo = () => {
    if (post?.author) {
      const publishedDate = post.published_at || post.publish_at || post.created_at;
      
      return (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {post.author.avatar_url ? (
              <img 
                src={post.author.avatar_url} 
                alt={post.author.full_name || 'Author'} 
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-medium text-gray-600">
                {(post.author.full_name || post.author.id || 'A')[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium">{post.author.full_name || 'Anonymous'}</p>
            <p className="text-sm text-gray-500">
              {publishedDate && `Published on ${formatDate(publishedDate)}`}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoadingPost) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-gray-50 flex justify-center items-start">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-gray-50">
        <div className="container px-4 mx-auto">
          <Card>
            <CardContent className="py-12 flex flex-col items-center justify-center">
              <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
              <p className="text-gray-500 mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
              <Link to="/blog">
                <Button>Back to Blog</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <></>
  );
};

export default BlogPostPage;
