import { Loader2 } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="flex items-start space-x-3 mb-8">
      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium text-primary-foreground">P</span>
      </div>
      <div className="flex-1 space-y-3">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Searching and analyzing...</span>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded animate-pulse w-3/4"></div>
          <div className="h-2 bg-muted rounded animate-pulse w-1/2"></div>
          <div className="h-2 bg-muted rounded animate-pulse w-5/6"></div>
        </div>
      </div>
    </div>
  );
}