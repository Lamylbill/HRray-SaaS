import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';

const BlogEditorRoute = ({ children }: { children: React.ReactNode }) => {
  const { isBlogEditor, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isBlogEditor) {
      navigate('/');
    }
  }, [isLoading, isBlogEditor, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return isBlogEditor ? <>{children}</> : null;
};

export default BlogEditorRoute;