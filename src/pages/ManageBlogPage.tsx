
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { BlogPostForm } from '@/components/blog/BlogPostForm';
import { blogService } from '@/services/blog.service';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { BlogPost, BlogCategory } from '@/integrations/supabase/blog-types';
import { Button } from '@/components/ui/button';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Calendar, Edit, Trash2, Eye, MoreHorizontal,
  CheckCircle, XCircle, Plus, Clock 
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Link } from 'react-router-dom';

const ManageBlogPage = () => {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const categoriesData = await blogService.getCategories();
        setCategories(categoriesData);
        
        // Convert boolean to string "true" for the API call
        const { posts } = await blogService.getPosts(1, 100, "true");
        setPosts(posts);
      } catch (error) {
        console.error('Error loading blog data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load blog data. Please try again later.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [toast]);
  
  const handleDeleteClick = (postId: string) => {
    setPostToDelete(postId);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    
    setIsDeleting(true);
    try {
      await blogService.deletePost(postToDelete);
      setPosts(posts.filter(post => post.id !== postToDelete));
      toast({
        title: 'Post Deleted',
        description: 'The blog post has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the blog post. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };
  
  const handleEditClick = (post: BlogPost) => {
    // Format post data for editing, including handling scheduled posts
    const publishDate = post.published_at ? new Date(post.published_at) : null;
    const now = new Date();
    
    // For scheduled posts, set publish_at
    const formattedPost = {
      ...post,
      // If post has a future published_at date and is not published, it's scheduled
      publish_at: (!post.is_published && publishDate && publishDate > now) ? publishDate : null
    };
    
    setCurrentPost(formattedPost);
    setEditMode(true);
    setActiveTab('new');
  };
  
  const handleFormSuccess = () => {
    // Reload posts
    setIsLoading(true);
    // Convert boolean to string "true" for the API call
    blogService.getPosts(1, 100, "true").then(({ posts }) => {
      setPosts(posts);
      setIsLoading(false);
      setEditMode(false);
      setCurrentPost(null);
      setActiveTab('posts');
    }).catch(error => {
      console.error('Error reloading posts:', error);
      setIsLoading(false);
    });
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Improved function to determine post status - correctly handle scheduled posts
  const getPostStatus = (post: BlogPost) => {
    const now = new Date();
    
    if (post.is_published) {
      return {
        status: 'Published',
        statusIcon: <CheckCircle className="mr-1 h-4 w-4" />,
        statusClass: 'text-green-600'
      };
    } else if (post.published_at && new Date(post.published_at) > now) {
      // This post is scheduled for future publication
      return {
        status: 'Scheduled',
        statusIcon: <Clock className="mr-1 h-4 w-4" />,
        statusClass: 'text-blue-600'
      };
    } else {
      // Otherwise it's a draft
      return {
        status: 'Draft',
        statusIcon: <XCircle className="mr-1 h-4 w-4" />,
        statusClass: 'text-amber-600'
      };
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Blog</h1>
        <Link to="/blog">
          <Button variant="outline">View Blog</Button>
        </Link>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="posts">
            All Posts
          </TabsTrigger>
          <TabsTrigger value="new">
            {editMode ? 'Edit Post' : 'New Post'}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Blog Posts</CardTitle>
                <Button onClick={() => {
                  setEditMode(false);
                  setCurrentPost(null);
                  setActiveTab('new');
                }}>
                  <Plus className="mr-1 h-4 w-4" />
                  New Post
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                  <p className="text-gray-500 mb-4">
                    Start building your blog by creating your first post.
                  </p>
                  <Button onClick={() => {
                    setEditMode(false);
                    setCurrentPost(null);
                    setActiveTab('new');
                  }}>
                    Create Your First Post
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map((post) => {
                        const { status, statusIcon, statusClass } = getPostStatus(post);
                        
                        return (
                          <TableRow key={post.id}>
                            <TableCell className="font-medium">
                              {post.title}
                            </TableCell>
                            <TableCell>
                              <div className={`flex items-center ${statusClass}`}>
                                {statusIcon}
                                {status}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center text-gray-500">
                                <Calendar className="mr-1 h-4 w-4" />
                                {post.is_published 
                                  ? formatDate(post.published_at || post.created_at)
                                  : post.published_at && new Date(post.published_at) > new Date()
                                    ? `Scheduled for ${formatDate(post.published_at)}`
                                    : formatDate(post.created_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {post.is_published && (
                                    <DropdownMenuItem asChild>
                                      <Link to={`/blog/post/${post.slug}`} target="_blank">
                                        <Eye className="mr-2 h-4 w-4" />
                                        View
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => handleEditClick(post)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(post.id)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="new">
          <BlogPostForm
            initialData={currentPost || undefined}
            categories={categories}
            postId={currentPost?.id}
            onSuccess={handleFormSuccess}
          />
        </TabsContent>
      </Tabs>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this blog post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageBlogPage;
