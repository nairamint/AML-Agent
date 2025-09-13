export interface Brief {
  id: string;
  type: 'recommendation' | 'analysis' | 'warning' | 'information';
  title: string;
  content: string;
  reasoning: string;
  confidence: 'low' | 'medium' | 'high';
  evidence: Evidence[];
  followUpSuggestions: FollowUpSuggestion[];
  assumptions: string[];
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  version: string;
}

export interface Evidence {
  id: string;
  source: string;
  snippet: string;
  jurisdiction: string;
  timestamp: string;
  trustScore: number;
  relevanceScore: number;
  url: string;
}

export interface FollowUpSuggestion {
  id: string;
  text: string;
  type: 'clarification' | 'analysis' | 'action' | 'information';
  confidence: 'low' | 'medium' | 'high';
}

export interface StreamingChunk {
  type: 'content' | 'reasoning' | 'evidence' | 'suggestions' | 'complete' | 'error';
  data: any;
}

export interface ConversationContext {
  jurisdiction: string;
  role: string;
  organization: string;
}

export interface MultiAgentContext {
  userQuery: string;
  conversationHistory: Brief[];
  userContext: ConversationContext;
  regulatoryContext: {
    applicableRegulations: string[];
    recentUpdates: string[];
    enforcementActions: string[];
  };
}
