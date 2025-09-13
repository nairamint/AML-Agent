import { Badge } from '../ui/badge';
import { cn } from '../ui/utils';

type ConfidenceLevel = 'High' | 'Medium' | 'Low';

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  className?: string;
}

export function ConfidenceBadge({ level, className }: ConfidenceBadgeProps) {
  const getVariant = (level: ConfidenceLevel) => {
    switch (level) {
      case 'High':
        return 'bg-success text-success-foreground';
      case 'Medium':
        return 'bg-warning text-warning-foreground';
      case 'Low':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Badge 
      className={cn(
        getVariant(level),
        "text-[12px] font-medium px-2 py-1",
        className
      )}
    >
      {level} Confidence
    </Badge>
  );
}