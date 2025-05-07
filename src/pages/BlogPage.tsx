
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { BlogPost, BlogCategory } from '@/integrations/supabase/blog-types';
import { blogService } from '@/services/blog.service';
import { useToast } from '@/hooks/use-toast';
import { Search, Calendar, Tag, User } from 'lucide-react';

const POSTS_PER_PAGE = 6;

const BlogPage = () => {
  const { toast } = useToast();
  const { isAuthenticated, isBlogEditor } = useAuth();
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load categories first
        const categoriesData = await blogService.getCategories();
        setCategories(categoriesData);
        
        // Load posts
        const { posts, total } = await blogService.getPosts(
          currentPage, 
          POSTS_PER_PAGE,
          selectedCategory || undefined
        );
        setPosts(posts);
        setTotalPosts(total);
      } catch (error) {
        console.error('Error loading blog data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load blog posts. Please try again later.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [currentPage, selectedCategory, toast]);
  
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality here
    toast({
      title: 'Search',
      description: `Searching for "${searchTerm}"`,
    });
  };
  
  const handleCategorySelect = (categorySlug: string | null) => {
    setSelectedCategory(categorySlug);
    setCurrentPage(1);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  
  return (
    <div>
      <Helmet>
        <title>Blog - HRFlow</title>
      </Helmet>
      
      {/* Blog header */}
      <div className="py-6 md:py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Blog</h1>
            <p className="text-gray-500 mt-1">Latest articles and updates</p>
          </div>
          
          {isAuthenticated && isBlogEditor && (
            <div className="mt-4 md:mt-0">
              <Link to="/manage-blog">
                <Button>
                  Manage Blog
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <div className="container px-4 mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <Card>
              <CardHeader>
                <CardTitle>Blog</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search articles..."
                      className="pl-8"
                    />
                  </div>
                </form>
                
                <div>
                  <h3 className="font-bold mb-2">Categories</h3>
                  <ul className="space-y-1">
                    <li>
                      <button
                        onClick={() => handleCategorySelect(null)}
                        className={`text-left w-full px-2 py-1 hover:bg-gray-100 rounded ${
                          selectedCategory === null ? 'font-medium text-blue-600' : ''
                        }`}
                      >
                        All Posts
                      </button>
                    </li>
                    {categories.map(category => (
                      <li key={category.id}>
                        <button
                          onClick={() => handleCategorySelect(category.slug)}
                          className={`text-left w-full px-2 py-1 hover:bg-gray-100 rounded ${
                            selectedCategory === category.slug ? 'font-medium text-blue-600' : ''
                          }`}
                        >
                          {category.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {isBlogEditor && (
                  <div className="pt-4">
                    <Link to="/blog/manage">
                      <Button className="w-full">
                        Manage Blog
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="lg:w-3/4">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="py-12 flex flex-col items-center justify-center">
                  <h3 className="text-xl font-medium mb-2">No posts found</h3>
                  <p className="text-gray-500 mb-4">
                    {selectedCategory 
                      ? "No posts found in this category" 
                      : "No blog posts have been published yet"}
                  </p>
                  {isBlogEditor && (
                    <Link to="/blog/manage">
                      <Button>Write Your First Post</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map(post => (
                    <Card key={post.id} className="overflow-hidden flex flex-col h-full">
                      {post.cover_image && (
                        <div className="h-48 overflow-hidden">
                          <img 
                            src={post.cover_image} 
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform hover:scale-105"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <CardTitle>
                          <Link 
                            to={`/blog/post/${post.slug}`}
                            className="hover:text-blue-600 transition-colors line-clamp-2"
                          >
                            {post.title}
                          </Link>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Calendar size={14} className="mr-1" />
                          <span>{formatDate(post.published_at || post.publish_at || post.created_at)}</span>
                        </div>
                        <p className="text-gray-600 line-clamp-3 mb-4">
                          {post.excerpt || post.content.substring(0, 120) + '...'}
                        </p>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-auto">
                            {post.tags.slice(0, 3).map((tag, index) => (
                              <span 
                                key={index}
                                className="inline-flex items-center px-2 py-1 bg-gray-100 text-xs rounded-full"
                              >
                                <Tag size={12} className="mr-1" />
                                {tag}
                              </span>
                            ))}
                            {post.tags.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-xs rounded-full">
                                +{post.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Link 
                          to={`/blog/post/${post.slug}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Read more →
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
