import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogService } from '@/services/blog.service';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui-custom/loading-spinner';
import { BlogPost, BlogComment } from '@/integrations/supabase/blog-types';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Calendar, Tag, MessageSquare, Share2, Facebook, Linkedin, Twitter } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Helmet } from 'react-helmet-async';

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
      loadComments()
    }
  }, [post]);


  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

      return;
    }

    setIsSubmittingComment(true);

    try {
      await blogService.addComment(post.id, {
        post_id: post.id,
        user_id: user?.id,
        content: commentContent
      });

      // Clear form
      setCommentContent('');
      toast({
        title: 'Comment Submitted',
        description: 'Your comment has been submitted.',
      });
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit your comment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingComment(false);
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
    <>
      <Helmet>
        <title>{post.title} | HRFlow Blog</title>
        <meta name="description" content={post.meta_description || post.excerpt} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.meta_description || post.excerpt} />
        {post.cover_image && <meta property="og:image" content={post.cover_image} />}
        <meta property="og:url" content={currentUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen pt-24 pb-12 bg-gray-50">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <Link to="/blog" className="text-blue-600 hover:text-blue-800">
                ← Back to Blog
              </Link>
            </div>

            <article className="bg-white rounded-lg shadow-sm overflow-hidden">
              {post.cover_image && (
                <div className="w-full h-64 sm:h-96 overflow-hidden">
                  <img 
                    src={post.cover_image} 
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-6 sm:p-8">
                <h1 className="text-3xl sm:text-4xl font-bold mb-4">{post.title}</h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-1" />
                    <span>{formatDate(post.published_at)}</span>
                  </div>

                  {post.author && (
                    <div className="flex items-center">
                      <span className="font-medium">By {post.author.full_name || 'Admin'}</span>
                    </div>
                  )}
                </div>

                <div className="prose prose-blue max-w-none mb-8" dangerouslySetInnerHTML={{ __html: post.content }} />

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {post.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-gray-100 text-sm rounded-full"
                      >
                        <Tag size={14} className="mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <Separator className="my-6" />

                <div className="flex items-center gap-4">
                  <span className="font-medium">Share:</span>
                  <div className="flex gap-2">
                    <a 
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                      aria-label="Share on Facebook"
                    >
                      <Facebook size={20} />
                    </a>
                    <a 
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(post.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-600"
                      aria-label="Share on Twitter"
                    >
                      <Twitter size={20} />
                    </a>
                    <a 
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:text-blue-900"
                      aria-label="Share on LinkedIn"
                    >
                      <Linkedin size={20} />
                    </a>
                  </div>
                </div>
              </div>
            </article>

            <div className="mt-8">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold flex items-center">
                    <MessageSquare className="mr-2" size={20} />
                    Comments
                  </h2>
                </CardHeader>
                <CardContent>
                  {isLoadingComments ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No comments yet. Be the first to comment!</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {comments.map(comment => (
                        <div key={comment.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="">
                              <h3 className="font-medium text-base">{comment.name}</h3>
                              <p className="text-sm text-gray-500">{formatDate(comment.created_at)}</p>
                            </div>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex-col items-start">
                  <h3 className="text-xl font-medium mb-4">Leave a Comment</h3>
                  <form onSubmit={handleCommentSubmit} className="w-full space-y-4">
                    <Textarea
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="Write your comment here..."
                      rows={4}
                      required
                    />
                    <Button type="submit" disabled={isSubmittingComment}>
                      {isSubmittingComment ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Comment'
                      )}
                    </Button>
                  </form>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogPostPage;