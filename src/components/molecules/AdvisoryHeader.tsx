import { AdvisoryHeadline, AdvisoryCaption } from '../atoms/Typography';
import { ConfidenceBadge } from '../atoms/ConfidenceBadge';
import { Badge } from '../ui/badge';

interface AdvisoryHeaderProps {
  title: string;
  context: string;
  date: string;
  version: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export function AdvisoryHeader({ title, context, date, version, confidence }: AdvisoryHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <AdvisoryHeadline>{title}</AdvisoryHeadline>
          <AdvisoryCaption>{context}</AdvisoryCaption>
        </div>
        <ConfidenceBadge level={confidence} />
      </div>
      
      <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
        <span>{date}</span>
        <Badge variant="outline" className="text-[12px] h-5">
          v{version}
        </Badge>
      </div>
    </div>
  );
}