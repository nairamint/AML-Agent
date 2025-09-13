import { ChevronRight, Home } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';

/**
 * Breadcrumb Navigation
 * Enterprise information architecture pattern
 */

interface BreadcrumbItem {
  label: string;
  path: string;
  isActive?: boolean;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  onNavigate: (path: string) => void;
  className?: string;
}

export function BreadcrumbNavigation({ 
  items, 
  onNavigate, 
  className 
}: BreadcrumbNavigationProps) {
  if (items.length === 0) return null;

  return (
    <nav 
      aria-label="Breadcrumb navigation"
      className={cn('flex items-center space-x-1 text-sm', className)}
    >
      {/* Home Icon */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate('/')}
        className="h-auto p-1 text-slate-500 hover:text-slate-700"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
      </Button>

      {items.map((item, index) => (
        <div key={item.path} className="flex items-center space-x-1">
          <ChevronRight className="w-4 h-4 text-slate-400" />
          
          {index === items.length - 1 ? (
            // Current page - not clickable
            <span 
              className="font-medium text-slate-900 px-2 py-1"
              aria-current="page"
            >
              {item.label}
            </span>
          ) : (
            // Clickable breadcrumb
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate(item.path)}
              className="h-auto px-2 py-1 text-slate-600 hover:text-slate-900 font-normal"
            >
              {item.label}
            </Button>
          )}
        </div>
      ))}
    </nav>
  );
}