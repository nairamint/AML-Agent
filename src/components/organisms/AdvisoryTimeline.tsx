import { Circle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { AdvisoryCard } from './AdvisoryCard';
import { AdvisoryCaption } from '../atoms/Typography';

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
  status: 'Draft' | 'Reviewed' | 'Approved';
}

interface AdvisoryTimelineProps {
  advisories: AdvisoryCardData[];
  onAddComment?: (advisoryId: string, content: string) => void;
}

export function AdvisoryTimeline({ advisories, onAddComment }: AdvisoryTimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'Reviewed':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'Draft':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'border-success bg-success/10';
      case 'Reviewed':
        return 'border-warning bg-warning/10';
      case 'Draft':
        return 'border-muted-foreground bg-muted/30';
      default:
        return 'border-muted-foreground bg-muted/30';
    }
  };

  return (
    <div className="space-y-6">
      {advisories.map((advisory, index) => (
        <div key={advisory.id} className="relative">
          {/* Timeline connector */}
          {index < advisories.length - 1 && (
            <div className="absolute left-8 top-16 w-0.5 h-full bg-border/30 z-0" />
          )}
          
          {/* Status indicator */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-16 h-8 rounded-full border-2 flex items-center justify-center gap-2 bg-background z-10 ${getStatusColor(advisory.status)}`}>
              {getStatusIcon(advisory.status)}
              <AdvisoryCaption className="font-medium">
                {advisory.status}
              </AdvisoryCaption>
            </div>
            
            <div className="flex-1 pt-1">
              <AdvisoryCaption>
                Advisory Journey • Step {index + 1} of {advisories.length}
              </AdvisoryCaption>
            </div>
          </div>

          {/* Advisory Card */}
          <div className="ml-20">
            <AdvisoryCard 
              advisory={advisory} 
              onAddComment={onAddComment}
            />
          </div>
        </div>
      ))}
    </div>
  );
}