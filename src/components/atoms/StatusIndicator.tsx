import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../ui/utils';

/**
 * Status Indicator Atom
 * Regulatory compliance status visualization
 */

const statusIndicatorVariants = cva(
  'inline-flex items-center justify-center rounded-full border-2 transition-all duration-200',
  {
    variants: {
      status: {
        compliant: 'bg-green-50 border-green-200 text-green-700',
        warning: 'bg-amber-50 border-amber-200 text-amber-700',
        violation: 'bg-red-50 border-red-200 text-red-700',
        pending: 'bg-blue-50 border-blue-200 text-blue-700',
        unknown: 'bg-gray-50 border-gray-200 text-gray-700',
      },
      size: {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
      },
      variant: {
        solid: '',
        outline: 'bg-transparent',
        dot: 'border-none',
      }
    },
    defaultVariants: {
      status: 'unknown',
      size: 'md',
      variant: 'solid',
    },
  }
);

interface StatusIndicatorProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  label?: string;
  'aria-label'?: string;
}

export function StatusIndicator({ 
  className, 
  status, 
  size, 
  variant, 
  label,
  'aria-label': ariaLabel,
  ...props 
}: StatusIndicatorProps) {
  return (
    <div 
      className={cn(statusIndicatorVariants({ status, size, variant }), className)}
      aria-label={ariaLabel || `Status: ${status}`}
      role="status"
      {...props}
    >
      {label && size === 'lg' && (
        <span className="text-xs font-medium">{label}</span>
      )}
    </div>
  );
}