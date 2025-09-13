import { ExternalLink, Copy, Share, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface Source {
  id: string;
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

interface SearchResultProps {
  query: string;
  answer: string;
  sources: Source[];
  timestamp: string;
}

export function SearchResult({ query, answer, sources, timestamp }: SearchResultProps) {
  return (
    <div className="mb-8 space-y-6">
      {/* Query */}
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium">U</span>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-foreground">{query}</h3>
          <p className="text-sm text-muted-foreground">{timestamp}</p>
        </div>
      </div>

      {/* Answer */}
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-primary-foreground">P</span>
        </div>
        <div className="flex-1 space-y-4">
          <div className="prose prose-sm max-w-none text-foreground">
            <p className="leading-relaxed">{answer}</p>
          </div>

          {/* Sources */}
          {sources.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Sources</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sources.map((source, index) => (
                  <div
                    key={source.id}
                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {index + 1}
                      </Badge>
                      <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <h5 className="font-medium text-sm mb-1 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                      {source.title}
                    </h5>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {source.snippet}
                    </p>
                    <p className="text-xs text-muted-foreground">{source.domain}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2 pt-2">
            <Button variant="ghost" size="sm" className="h-8 px-3">
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-3">
              <Share className="w-4 h-4 mr-1" />
              Share
            </Button>
            <div className="flex items-center space-x-1 ml-auto">
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <ThumbsDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}