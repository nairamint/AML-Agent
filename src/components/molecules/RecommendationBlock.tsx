import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AdvisoryBody } from '../atoms/Typography';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';

interface RecommendationBlockProps {
  recommendation: string;
  reasoning?: string;
  evidence?: string[];
  assumptions?: string[];
}

export function RecommendationBlock({ 
  recommendation, 
  reasoning, 
  evidence = [], 
  assumptions = [] 
}: RecommendationBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <AdvisoryBody className="font-medium text-primary">
          {recommendation}
        </AdvisoryBody>
        
        {(reasoning || evidence.length > 0 || assumptions.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-2 border-t border-border/50">
          {reasoning && (
            <div className="space-y-2">
              <h4 className="text-[14px] font-medium">Reasoning</h4>
              <AdvisoryBody className="text-[14px] text-muted-foreground">
                {reasoning}
              </AdvisoryBody>
            </div>
          )}

          {evidence.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[14px] font-medium">Evidence</h4>
              <ul className="space-y-1">
                {evidence.map((item, index) => (
                  <li key={index} className="text-[14px] text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {assumptions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[14px] font-medium">Assumptions</h4>
              <ul className="space-y-1">
                {assumptions.map((item, index) => (
                  <li key={index} className="text-[14px] text-muted-foreground flex items-start gap-2">
                    <span className="text-warning">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}