import { useState, useCallback, useEffect } from 'react';
import { Send, Search, Paperclip, Mic, Plus, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { StreamingBrief } from './StreamingBrief';
import { StreamingAdvisoryService } from '../services/streamingService';
import { Brief, Query, FollowUpSuggestion, StreamingChunk } from '../types/advisory';

interface AdvisoryConversationProps {
  onSendMessage?: (message: string) => void;
}

export function AdvisoryConversation({ onSendMessage }: AdvisoryConversationProps) {
  const [input, setInput] = useState('');
  const [queries, setQueries] = useState<Query[]>([
    {
      id: 'q1',
      content: 'CSSF approach with respect to minor onboarding requirements',
      timestamp: '2 min ago'
    }
  ]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingBrief, setCurrentStreamingBrief] = useState<Brief | null>(null);

  const streamingService = StreamingAdvisoryService.getInstance();
  
  // Initialize streaming service on component mount
  useEffect(() => {
    const initializeService = async () => {
      try {
        await streamingService.initialize();
      } catch (error) {
        console.error('Failed to initialize streaming service:', error);
      }
    };
    
    initializeService();
  }, [streamingService]);
  // Mock initial brief
  useState(() => {
    setBriefs([{
      id: 'brief-initial',
      type: 'recommendation',
      title: 'CSSF Minor Onboarding Requirements',
      content: 'Based on a comprehensive understanding of the CSSF\'s regulatory framework, particularly as it pertains to Anti-Money Laundering (AML) and Countering the Financing of Terrorism (CFT) obligations. While there isn\'t a single, dedicated CSSF regulation solely addressing the onboarding of minors, the process is fundamentally governed by the overarching AML/CFT directives, requiring financial institutions to adopt a risk-based approach tailored to the unique considerations of engaging with underage clients.',
      reasoning: 'This recommendation is based on analysis of current CSSF regulations and EU directives that govern financial institutions operating in Luxembourg.',
      assumptions: ['Standard risk appetite for financial institution', 'Regular regulatory updates are monitored'],
      confidence: 'medium',
      evidence: [
        {
          id: 'ev-1',
          source: 'CSSF Regulation 12-02',
          snippet: 'Financial institutions shall implement enhanced due diligence measures for higher risk categories...',
          jurisdiction: 'Luxembourg',
          timestamp: '2024-01-15',
          trustScore: 0.95,
          url: 'https://cssf.lu/regulation-12-02',
          relevanceScore: 0.88
        },
        {
          id: 'ev-2',
          source: 'AMLD6 Directive',
          snippet: 'Member States shall ensure that obliged entities apply customer due diligence measures...',
          jurisdiction: 'EU',
          timestamp: '2024-02-20',
          trustScore: 0.92,
          relevanceScore: 0.85
        }
      ],
      followUpSuggestions: [
        {
          id: 'fs-1',
          text: 'What are the specific documentation requirements?',
          type: 'clarification',
          confidence: 'high'
        },
        {
          id: 'fs-2',
          text: 'Create AML workflow for minor onboarding',
          type: 'workflow',
          confidence: 'medium'
        }
      ],
      timestamp: '2 min ago',
      status: 'completed',
      version: '1.0'
    }]);
  });

  const handleSend = useCallback(async () => {
    if (input.trim() && !isStreaming) {
      const queryText = input.trim();
      setInput('');
      
      // Add query to list
      const newQuery: Query = {
        id: `query-${Date.now()}`,
        content: queryText,
        timestamp: 'Now'
      };
      setQueries(prev => [...prev, newQuery]);

      // Start streaming response
      setIsStreaming(true);
      
      // Initialize streaming brief
      const streamingBrief: Brief = {
        id: `brief-${Date.now()}`,
        type: 'recommendation',
        title: '',
        content: '',
        confidence: 'high',
        evidence: [],
        followUpSuggestions: [],
        timestamp: new Date().toISOString(),
        status: 'streaming',
        version: '1.0'
      };
      
      setCurrentStreamingBrief(streamingBrief);

      // Start streaming
      streamingService.streamResponse(
        queryText,
        (chunk: StreamingChunk) => {
          setCurrentStreamingBrief(prev => {
            if (!prev) return prev;
            
            const updated = { ...prev };
            
            switch (chunk.type) {
              case 'content':
                if (chunk.data.type === 'title') {
                  updated.title = chunk.data.content;
                } else if (chunk.data.type === 'main') {
                  updated.streamingContent = chunk.data.content;
                }
                break;
              case 'reasoning':
                updated.reasoning = chunk.data;
                break;
              case 'evidence':
                updated.evidence = chunk.data;
                break;
              case 'suggestions':
                updated.followUpSuggestions = chunk.data;
                break;
            }
            
            return updated;
          });
        },
        (completedBrief: Brief) => {
          setCurrentStreamingBrief(null);
          setBriefs(prev => [...prev, completedBrief]);
          setIsStreaming(false);
        },
        (error: string) => {
          setCurrentStreamingBrief(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              status: 'error',
              error
            };
          });
          setIsStreaming(false);
        }
      );

      if (onSendMessage) {
        onSendMessage(queryText);
      }
    }
  }, [input, isStreaming, onSendMessage, streamingService]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFollowUp = useCallback((suggestion: FollowUpSuggestion) => {
    setInput(suggestion.text);
  }, []);

  const handleBranch = useCallback((briefId: string) => {
    console.log('Branch from brief:', briefId);
    // In real implementation, this would create a new workflow
  }, []);

  const handleFeedback = useCallback((briefId: string, type: 'positive' | 'negative') => {
    console.log('Feedback for brief:', briefId, type);
    // In real implementation, this would send feedback to the system
  }, []);

  const handleEscalate = useCallback((briefId: string) => {
    console.log('Escalate brief:', briefId);
    // In real implementation, this would trigger escalation workflow
  }, []);

  const suggestedPrompts = [
    "What are the key AML requirements for high-risk clients?",
    "How do ESG disclosure rules apply to our jurisdiction?",
    "What's the timeline for DORA compliance implementation?"
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* Show empty state with suggestions if no content */}
          {queries.length === 0 && briefs.length === 0 && !currentStreamingBrief && (
            <div className="max-w-4xl mx-auto text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">
                Welcome to Advisory Navigator
              </h2>
              <p className="text-slate-600 mb-8">
                Ask any compliance or regulatory question to get expert analysis with evidence-backed recommendations.
              </p>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700 mb-3">Try these examples:</p>
                {suggestedPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => setInput(prompt)}
                    className="block w-full text-left h-auto p-3 text-slate-700 hover:bg-white/40"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Render conversation */}
          {[...queries, ...(currentStreamingBrief ? [{ id: 'current', type: 'brief' as const }] : []), ...briefs.map(b => ({ id: b.id, type: 'brief' as const, brief: b }))].map((item, index) => {
            // Find corresponding query for each brief
            const correspondingQuery = queries[Math.floor(index / 2)];
            
            return (
              <div key={item.id} className="max-w-4xl mx-auto space-y-6">
                {/* Query */}
                {queries.find(q => q.id === item.id) && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-medium text-slate-800 mb-2">
                      {queries.find(q => q.id === item.id)?.content}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {queries.find(q => q.id === item.id)?.timestamp}
                    </p>
                  </div>
                )}

                {/* Brief */}
                {item.type === 'brief' && (
                  <>
                    {item.id === 'current' && currentStreamingBrief && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-slate-600">Analyzing...</span>
                          <div className="h-px bg-slate-300/50 flex-1" />
                        </div>
                        
                        <StreamingBrief
                          brief={currentStreamingBrief}
                          isStreaming={true}
                          onFollowUp={handleFollowUp}
                          onBranch={handleBranch}
                          onFeedback={handleFeedback}
                          onEscalate={handleEscalate}
                        />
                      </div>
                    )}

                    {'brief' in item && item.brief && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-slate-600">Brief</span>
                          <div className="h-px bg-slate-300/50 flex-1" />
                        </div>
                        
                        <StreamingBrief
                          brief={item.brief}
                          onFollowUp={handleFollowUp}
                          onBranch={handleBranch}
                          onFeedback={handleFeedback}
                          onEscalate={handleEscalate}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="flex-shrink-0 p-6 border-t border-slate-200/30">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-2xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent glass-subtle flex items-center justify-center">
                <MessageCircle className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-medium text-slate-700">
                {queries.length === 0 ? 'Ask your first question' : 'Ask a follow-up'}
              </span>
              {isStreaming && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  Analyzing...
                </div>
              )}
            </div>
            
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={queries.length === 0 ? "What compliance question can I help you with?" : "Ask a follow-up..."}
              className="bg-transparent border-0 resize-none focus:ring-0 text-slate-700 placeholder-slate-400 min-h-[20px]"
              disabled={isStreaming}
            />
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 text-slate-600 hover:text-white hover:bg-white/15 rounded-lg transition-all duration-200"
                  disabled={isStreaming}
                >
                  <Search className="w-3 h-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 text-slate-600 hover:text-white hover:bg-white/15 rounded-lg transition-all duration-200"
                  disabled={isStreaming}
                >
                  <Mic className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 text-slate-600 hover:text-white hover:bg-white/15 rounded-lg transition-all duration-200"
                  disabled={isStreaming}
                >
                  <Plus className="w-3 h-3" />
                </Button>
                <Button 
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  size="sm" 
                  className="h-7 w-7 p-0 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg transition-all duration-200"
                >
                  {isStreaming ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3 h-3 text-white" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}