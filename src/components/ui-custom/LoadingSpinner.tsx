import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'blue-500',
  className = '',
  message
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10'
  };

  return (
    <div className={`flex flex-col justify-center items-center space-y-2 ${className}`}>
      <div className={`rounded-full ${sizeClasses[size]} border-t-2 border-b-2 border-${color} animate-spin-slow`} />
      {message && (
        <p className="text-sm text-gray-500">{message}</p>
      )}
    </div>
  );
};
