export enum ExpertType {
  GENERAL = 'GENERAL',
  AML_CFT = 'AML_CFT',
  SANCTIONS = 'SANCTIONS',
  KYC = 'KYC',
  REGULATORY = 'REGULATORY',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  COMPLIANCE = 'COMPLIANCE',
  INVESTIGATION = 'INVESTIGATION'
}

export interface ChatRequestDto {
  threadId: string;
  content: string;
  expertType?: ExpertType;
  systemInstructions?: string;
  temperature?: number;
  maxTokens?: number;
  attachments?: Express.Multer.File[];
}

export interface ChatResponse {
  id: string;
  threadId: string;
  content: string;
  expertType: ExpertType;
  timestamp: string;
  metadata?: {
    tokensUsed?: number;
    model?: string;
    confidence?: 'low' | 'medium' | 'high';
  };
}

export interface StreamingChatChunk {
  type: 'content' | 'metadata' | 'complete' | 'error';
  data: any;
  timestamp: string;
}
