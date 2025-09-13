import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  ThumbsUp, 
  ThumbsDown, 
  GitBranch, 
  AlertTriangle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Brief, FollowUpSuggestion, Evidence } from '../types/advisory';

interface StreamingBriefProps {
  brief: Brief;
  isStreaming?: boolean;
  onFollowUp: (suggestion: FollowUpSuggestion) => void;
  onBranch: (briefId: string) => void;
  onFeedback: (briefId: string, type: 'positive' | 'negative') => void;
  onEscalate: (briefId: string) => void;
}

export function StreamingBrief({ 
  brief, 
  isStreaming = false, 
  onFollowUp, 
  onBranch, 
  onFeedback, 
  onEscalate 
}: StreamingBriefProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showEvidence, setShowEvidence] = useState(false);

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className="glass-subtle border-0">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              {brief.title || (isStreaming ? 'Analyzing...' : 'Analysis Complete')}
            </h3>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={getConfidenceColor(brief.confidence)}>
                {brief.confidence} confidence
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {brief.type}
              </Badge>
              {brief.status === 'streaming' && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  Streaming...
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-500 hover:text-slate-700"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="space-y-4">
            {/* Main Content */}
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 leading-relaxed">
                {isStreaming && brief.streamingContent ? brief.streamingContent : brief.content}
                {isStreaming && (
                  <span className="inline-block w-1 h-4 bg-primary ml-1 animate-pulse" />
                )}
              </p>
            </div>

            {/* Reasoning */}
            {brief.reasoning && (
              <div className="p-4 rounded-lg bg-slate-50/50 border border-slate-200/50">
                <h4 className="font-medium text-slate-800 mb-2">Reasoning</h4>
                <p className="text-sm text-slate-600">{brief.reasoning}</p>
              </div>
            )}

            {/* Assumptions */}
            {brief.assumptions && brief.assumptions.length > 0 && (
              <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200/50">
                <h4 className="font-medium text-slate-800 mb-2">Key Assumptions</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  {brief.assumptions.map((assumption, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                      {assumption}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Evidence Section */}
            {brief.evidence && brief.evidence.length > 0 && (
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setShowEvidence(!showEvidence)}
                  className="mb-3 text-slate-700 hover:text-slate-900"
                >
                  <span className="font-medium">Evidence Sources ({brief.evidence.length})</span>
                  {showEvidence ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </Button>

                {showEvidence && (
                  <div className="space-y-3">
                    {brief.evidence.map((evidence: Evidence) => (
                      <div key={evidence.id} className="p-4 rounded-lg bg-white/50 border border-slate-200/50">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-medium text-slate-800">{evidence.source}</h5>
                            <p className="text-xs text-slate-500">{evidence.jurisdiction} • {evidence.timestamp}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {Math.round(evidence.relevanceScore * 100)}% relevant
                            </Badge>
                            {evidence.url && (
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 italic">"{evidence.snippet}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Error State */}
            {brief.status === 'error' && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Error occurred</span>
                </div>
                <p className="text-sm text-red-600 mt-1">{brief.error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEscalate(brief.id)}
                  className="mt-3 text-red-700 border-red-300 hover:bg-red-50"
                >
                  Escalate to Human Expert
                </Button>
              </div>
            )}

            {/* Actions */}
            {brief.status !== 'streaming' && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFeedback(brief.id, 'positive')}
                    className="text-slate-600 hover:text-green-600"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFeedback(brief.id, 'negative')}
                    className="text-slate-600 hover:text-red-600"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onBranch(brief.id)}
                    className="text-slate-600 hover:text-primary"
                  >
                    <GitBranch className="w-4 h-4 mr-1" />
                    Branch
                  </Button>
                </div>
                
                <span className="text-xs text-slate-500">{brief.timestamp}</span>
              </div>
            )}
          </div>
        )}

        {/* Follow-up Suggestions */}
        {brief.followUpSuggestions && brief.followUpSuggestions.length > 0 && brief.status !== 'streaming' && (
          <div className="mt-6 pt-4 border-t border-slate-200/50">
            <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Suggested Follow-ups
            </h4>
            <div className="space-y-2">
              {brief.followUpSuggestions.map((suggestion) => (
                <Button
                  key={suggestion.id}
                  variant="outline"
                  onClick={() => onFollowUp(suggestion)}
                  className="h-auto p-3 text-left justify-start text-slate-700 hover:bg-white/40 w-full"
                >
                  <div>
                    <p className="font-medium">{suggestion.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.type}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}>
                        {suggestion.confidence}
                      </Badge>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}