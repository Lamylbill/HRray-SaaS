
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';

const BlogEditorRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, isBlogEditor } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/login');
      } else if (!isBlogEditor) {
        navigate('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, isBlogEditor, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (isAuthenticated && isBlogEditor) ? <>{children}</> : null;
};

export default BlogEditorRoute;
