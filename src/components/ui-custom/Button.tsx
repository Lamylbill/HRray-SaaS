
import React from 'react';
import { Slot } from '@radix-ui/react-slot'; // Import Slot for explicit understanding
import { Button as ShadcnButton, type ButtonProps as ShadcnBaseButtonProps } from '@/components/ui/button'; // Assuming this is the Shadcn path
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
  asChild = false, // Explicitly destructure asChild
  ...props // Remaining props
}, ref) => {
  // Map size xl to lg for the Shadcn button (this logic is fine)
  const sizeMapping: Record<string, string | undefined> = {
    'xl': 'lg'
  };
  const localSize = size as string; // Cast size for indexing
  const mappedSize = sizeMapping[localSize] || size;

     // The ShadcnButton will handle the Slot rendering if asChild is true
  return (
    <ShadcnButton
      className={cn(className)} // Apply any custom classes
      variant={variant}
      size={mappedSize as any} // Cast mappedSize if necessary
      disabled={isLoading || disabled}
      ref={ref}
      asChild={asChild} // Pass asChild to the ShadcnButton
      {...props} // Pass down all other props
    >
      {/*
        If asChild is true, ShadcnButton (via Radix Slot) expects to find its child here.
        If asChild is false, ShadcnButton renders a normal button and these children go inside.
        This structure should be correct.
      */}
      {children}
    </ShadcnButton>
  );
});

Button.displayName = 'Button';
