import { ExternalLink } from 'lucide-react';
import { AdvisoryCaption, AdvisoryBody } from '../atoms/Typography';
import { Badge } from '../ui/badge';

interface EvidenceCardProps {
  source: string;
  snippet: string;
  jurisdiction: string;
  timestamp: string;
  trustScore: number;
  url?: string;
}

export function EvidenceCard({ 
  source, 
  snippet, 
  jurisdiction, 
  timestamp, 
  trustScore,
  url 
}: EvidenceCardProps) {
  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'bg-success text-success-foreground';
    if (score >= 60) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg p-4 space-y-3 border border-border/20">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-[14px] font-medium">{source}</h4>
            {url && (
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          <AdvisoryCaption>{jurisdiction} • {timestamp}</AdvisoryCaption>
        </div>
        
        <Badge className={getTrustScoreColor(trustScore) + " text-[12px] h-5"}>
          {trustScore}% Trust
        </Badge>
      </div>

      <AdvisoryBody className="text-[14px] text-muted-foreground leading-relaxed">
        {snippet}
      </AdvisoryBody>
    </div>
  );
}