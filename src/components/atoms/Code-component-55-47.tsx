import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../ui/utils';

/**
 * Loading Spinner Atom
 * Accessible, semantic loading indicator
 */

const spinnerVariants = cva(
  'animate-spin border-solid border-t-transparent rounded-full',
  {
    variants: {
      size: {
        xs: 'w-3 h-3 border-[1px]',
        sm: 'w-4 h-4 border-[1.5px]',
        md: 'w-6 h-6 border-2',
        lg: 'w-8 h-8 border-2',
        xl: 'w-12 h-12 border-3',
      },
      variant: {
        primary: 'border-primary',
        secondary: 'border-secondary-foreground',
        muted: 'border-muted-foreground',
        white: 'border-white',
      }
    },
    defaultVariants: {
      size: 'md',
      variant: 'primary',
    },
  }
);

interface LoadingSpinnerProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

export function LoadingSpinner({ 
  className, 
  size, 
  variant, 
  label = 'Loading...',
  ...props 
}: LoadingSpinnerProps) {
  return (
    <div 
      className={cn(spinnerVariants({ size, variant }), className)}
      role="status"
      aria-label={label}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}