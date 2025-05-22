import React, { useEffect, useState } from 'react';
import { blogService } from '@/integrations/supabase/blog-service';
import { BlogPost, BlogCategory } from '@/integrations/supabase/blog-types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Tag } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';

const POSTS_PER_PAGE = 6;

const BlogPage = () => {
  const { isAuthenticated, isBlogEditor } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [postResult, catResult] = await Promise.all([
          blogService.getPosts(currentPage, POSTS_PER_PAGE, "false", selectedCategory || undefined),
          blogService.getCategories()
        ]);
        setPosts(postResult.posts);
        setTotalPosts(postResult.total);
        setCategories(catResult);
      } catch (error) {
        console.error('Failed to load blog data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedCategory, currentPage]);

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(search.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCardClick = (slug: string) => {
    navigate(`/blog/post/${slug}`);
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
    <div className="min-h-screen bg-white pt-24 px-4 md:px-6 max-w-screen-xl mx-auto">
      <Helmet>
        <title>Blog | HRray</title>
        <meta name="description" content="Latest articles and updates from the HRray team." />
      </Helmet>

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Blog</h1>
        <p className="text-gray-500 mt-2">Latest articles and updates</p>
        {isAuthenticated && isBlogEditor && (
          <div className="mt-4">
            <Button onClick={() => navigate('/manage-blog')} className="text-sm">Manage Blog</Button>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
        <div className="w-full md:w-1/3">
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-2/3">
          <Input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-64 space-y-3 text-gray-500">
          <LoadingSpinner size="lg" message="Loading latest blog posts..." />
        </div>
      ) : filteredPosts.length === 0 ? (
        <p className="text-center text-gray-500">No blog posts found.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredPosts.map(post => (
              <Card key={post.id} onClick={() => handleCardClick(post.slug)} className="cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full">
                {post.cover_image && (
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-48 object-cover rounded-t-md"
                  />
                )}
                <CardHeader>
                  <CardTitle className="text-lg font-semibold line-clamp-2">{post.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-sm text-gray-500 flex items-center mb-2">
                    <Calendar size={14} className="mr-1" />
                    <span>{formatDate(post.published_at || post.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">{post.excerpt}</p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4">
                      {post.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 text-xs rounded-full"
                        >
                          <Tag size={12} className="mr-1" />{tag}
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
                <CardFooter>
                  <Button variant="link" className="px-0 text-blue-600 text-sm">Read more →</Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage + 1)}
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
  );
};

export default BlogPage;
