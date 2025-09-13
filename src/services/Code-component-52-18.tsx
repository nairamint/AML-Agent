import { Brief, StreamingChunk } from '../types/advisory';

export class StreamingAdvisoryService {
  private static instance: StreamingAdvisoryService;

  public static getInstance(): StreamingAdvisoryService {
    if (!StreamingAdvisoryService.instance) {
      StreamingAdvisoryService.instance = new StreamingAdvisoryService();
    }
    return StreamingAdvisoryService.instance;
  }

  public streamResponse(
    query: string,
    onChunk: (chunk: StreamingChunk) => void,
    onComplete: (brief: Brief) => void,
    onError: (error: string) => void
  ): void {
    // Simulate streaming response
    let chunkIndex = 0;
    const chunks: StreamingChunk[] = [
      {
        type: 'content',
        data: { type: 'title', content: 'Analysis of ' + query }
      },
      {
        type: 'content',
        data: { type: 'main', content: 'Based on current regulatory guidance...' }
      },
      {
        type: 'reasoning',
        data: 'This analysis considers current industry best practices and regulatory requirements.'
      },
      {
        type: 'evidence',
        data: [
          {
            id: 'ev-sim-1',
            source: 'Regulatory Framework',
            snippet: 'Relevant regulatory guidance...',
            jurisdiction: 'Global',
            timestamp: new Date().toISOString(),
            trustScore: 0.95,
            relevanceScore: 0.90
          }
        ]
      },
      {
        type: 'suggestions',
        data: [
          {
            id: 'fs-sim-1',
            text: 'Would you like more specific details?',
            type: 'clarification' as const,
            confidence: 'high' as const
          }
        ]
      }
    ];

    const streamInterval = setInterval(() => {
      if (chunkIndex < chunks.length) {
        onChunk(chunks[chunkIndex]);
        chunkIndex++;
      } else {
        clearInterval(streamInterval);
        
        // Complete the brief
        const completedBrief: Brief = {
          id: `brief-${Date.now()}`,
          type: 'recommendation',
          title: 'Analysis of ' + query,
          content: 'Based on current regulatory guidance and industry best practices, here is our analysis...',
          reasoning: 'This analysis considers current industry best practices and regulatory requirements.',
          confidence: 'high',
          evidence: [
            {
              id: 'ev-sim-1',
              source: 'Regulatory Framework',
              snippet: 'Relevant regulatory guidance...',
              jurisdiction: 'Global',
              timestamp: new Date().toISOString(),
              trustScore: 0.95,
              relevanceScore: 0.90
            }
          ],
          followUpSuggestions: [
            {
              id: 'fs-sim-1',
              text: 'Would you like more specific details?',
              type: 'clarification',
              confidence: 'high'
            }
          ],
          timestamp: new Date().toISOString(),
          status: 'completed',
          version: '1.0'
        };
        
        onComplete(completedBrief);
      }
    }, 500); // Stream chunks every 500ms
  }
}