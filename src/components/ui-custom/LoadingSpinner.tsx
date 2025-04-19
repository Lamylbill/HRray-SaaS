import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
}

export const LoadingSpinner = ({
  className,
  size = 'md',
  color = 'primary',
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  const colorClasses = {
    primary: 'border-blue-500/30 border-t-blue-500',
    secondary: 'border-gray-300/30 border-t-gray-300',
    white: 'border-white/30 border-t-white',
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-solid",
          sizeClasses[size],
          colorClasses[color]
        )}
      />
    </div>
  );
};