
import React from 'react';
import { Button as ShadcnButton, ButtonProps as BaseButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Extend the base ButtonProps from '@/components/ui/button'
interface ButtonProps extends BaseButtonProps {
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
    // Map size xl to lg for the Shadcn button
    const sizeMapping: Record<string, string | undefined> = {
      'xl': 'lg'
    };

    const mappedSize = sizeMapping[size as string] || size;

    return (
      <ShadcnButton
        className={className}
        variant={variant}
        size={mappedSize as any}
        disabled={isLoading || disabled}
        isLoading={isLoading}
        {...props}
      >
        {children}
      </ShadcnButton>
    );
  });

Button.displayName = 'Button';
