import { useState } from 'react';
import { Download, Share, Bookmark, MoreHorizontal } from 'lucide-react';
import { AdvisoryHeader } from '../molecules/AdvisoryHeader';
import { RecommendationBlock } from '../molecules/RecommendationBlock';
import { EvidenceCard } from '../molecules/EvidenceCard';
import { AnnotationWidget } from '../molecules/AnnotationWidget';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface AdvisoryCardData {
  id: string;
  title: string;
  context: string;
  date: string;
  version: string;
  confidence: 'High' | 'Medium' | 'Low';
  recommendation: string;
  reasoning?: string;
  evidence?: Array<{
    id: string;
    source: string;
    snippet: string;
    jurisdiction: string;
    timestamp: string;
    trustScore: number;
    url?: string;
  }>;
  assumptions?: string[];
  comments?: Array<{
    id: string;
    author: string;
    content: string;
    timestamp: string;
  }>;
}

interface AdvisoryCardProps {
  advisory: AdvisoryCardData;
  onAddComment?: (advisoryId: string, content: string) => void;
}

export function AdvisoryCard({ advisory, onAddComment }: AdvisoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddComment = (content: string) => {
    if (onAddComment) {
      onAddComment(advisory.id, content);
    }
  };

  return (
    <Card className="bg-card text-card-foreground p-6 space-y-6">
      <AdvisoryHeader
        title={advisory.title}
        context={advisory.context}
        date={advisory.date}
        version={advisory.version}
        confidence={advisory.confidence}
      />

      <RecommendationBlock
        recommendation={advisory.recommendation}
        reasoning={advisory.reasoning}
        evidence={advisory.evidence?.map(e => e.snippet)}
        assumptions={advisory.assumptions}
      />

      {advisory.evidence && advisory.evidence.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[14px] font-medium">Supporting Evidence</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {advisory.evidence.map((evidence) => (
              <EvidenceCard
                key={evidence.id}
                source={evidence.source}
                snippet={evidence.snippet}
                jurisdiction={evidence.jurisdiction}
                timestamp={evidence.timestamp}
                trustScore={evidence.trustScore}
                url={evidence.url}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border/20">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 px-3">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-3">
            <Share className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-3">
            <Bookmark className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
        
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <AnnotationWidget
        comments={advisory.comments}
        onAddComment={handleAddComment}
      />
    </Card>
  );
}