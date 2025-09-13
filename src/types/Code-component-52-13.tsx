export interface Query {
  id: string;
  content: string;
  timestamp: string;
}

export interface Evidence {
  id: string;
  source: string;
  snippet: string;
  jurisdiction: string;
  timestamp: string;
  trustScore: number;
  url?: string;
  relevanceScore: number;
}

export interface FollowUpSuggestion {
  id: string;
  text: string;
  type: 'clarification' | 'workflow' | 'analysis' | 'recommendation';
  confidence: 'low' | 'medium' | 'high';
}

export interface Brief {
  id: string;
  type: 'recommendation' | 'analysis' | 'workflow' | 'alert';
  title: string;
  content: string;
  reasoning?: string;
  assumptions?: string[];
  confidence: 'low' | 'medium' | 'high';
  evidence: Evidence[];
  followUpSuggestions: FollowUpSuggestion[];
  timestamp: string;
  status: 'streaming' | 'completed' | 'error';
  version: string;
  error?: string;
  streamingContent?: string;
}

export interface StreamingChunk {
  type: 'content' | 'reasoning' | 'evidence' | 'suggestions';
  data: any;
}