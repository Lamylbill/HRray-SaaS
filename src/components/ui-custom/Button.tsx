
import React from 'react';
import { Button as ShadcnButton, type ButtonProps as ShadcnButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Extend the base ButtonProps from '@/components/ui/button'
interface ButtonProps extends ShadcnButtonProps {
  isLoading?: boolean;
}

// This is a custom extension of the Shadcn button that includes our HRFlow styling
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'default',
  size,
  isLoading = false,
  disabled,
  asChild = false,
  children,
  ...props
}, ref) => {
  // Map size xl to lg for the Shadcn button
  const sizeMapping: Record<string, string | undefined> = {
    'xl': 'lg'
  };
  const localSize = size as string;
  const mappedSize = sizeMapping[localSize] || size;

  return (
    <ShadcnButton
      className={cn(className)}
      variant={variant}
      size={mappedSize as any}
      disabled={isLoading || disabled}
      ref={ref}
      asChild={asChild}
      {...props}
    >
      {children}
    </ShadcnButton>
  );
});

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
