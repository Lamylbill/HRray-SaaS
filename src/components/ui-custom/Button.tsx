
import React from 'react';
import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'premium' | 'glass' | 'success' | 'hrflow';
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'icon';
  className?: string;
  isLoading?: boolean;
}

// This is a custom extension of the Shadcn button that includes our HRFlow styling
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  className,
  variant = 'default',
  size,
  isLoading = false,
  disabled,
  ...props
}, ref) => {
  // Map our custom variants to the ones expected by Shadcn if needed
  const variantMapping: Record<string, string | undefined> = {
    // We can now pass premium, glass, and success directly since they are implemented in the base component
    hrflow: 'primary' // Map hrflow to primary for the Shadcn button
  };

  // Map size xl to lg for the Shadcn button
  const sizeMapping: Record<string, string | undefined> = {
    // xl is now implemented in the base component
  };

  const mappedVariant = variantMapping[variant] || variant;
  const mappedSize = sizeMapping[size as string] || size;

  // Special styling for hrflow variant
  const getClassName = () => {
    if (variant === 'hrflow') {
      return cn(
        "bg-hrflow-primary text-white hover:bg-hrflow-secondary border border-transparent font-medium",
        className
      );
    }
    return className;
  };

  return (
    <ShadcnButton
      className={getClassName()}
      variant={mappedVariant as any}
      size={mappedSize as any}
      disabled={isLoading || disabled}
      isLoading={isLoading}
      {...props}
    >
      {children}
    </ShadcnButton>
  )
});
