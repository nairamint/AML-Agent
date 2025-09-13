import { Brief, StreamingChunk } from '../types/advisory';
import { SecureTokenStorage } from './SecureTokenStorage';
import { CSRFProtection } from './CSRFProtection';

export class StreamingAdvisoryService {
  private static instance: StreamingAdvisoryService;
  private baseUrl: string;
  private authToken: string | null = null;

  private constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    this.initializeAuth();
  }
  
  private async initializeAuth(): Promise<void> {
    try {
      this.authToken = await SecureTokenStorage.getAccessToken();
      await CSRFProtection.initialize();
    } catch (error) {
      console.error('Failed to initialize authentication:', error);
    }
  }

  public static getInstance(): StreamingAdvisoryService {
    if (!StreamingAdvisoryService.instance) {
      StreamingAdvisoryService.instance = new StreamingAdvisoryService();
    }
    return StreamingAdvisoryService.instance;
  }

  public async setAuthToken(token: string, refreshToken?: string): Promise<void> {
    try {
      this.authToken = token;
      if (refreshToken) {
        await SecureTokenStorage.setTokens(token, refreshToken);
      } else {
        // For backward compatibility, store just the access token
        await SecureTokenStorage.setTokens(token, '');
      }
    } catch (error) {
      console.error('Failed to store auth token:', error);
      throw error;
    }
  }

  public async clearAuthToken(): Promise<void> {
    try {
      this.authToken = null;
      await SecureTokenStorage.clearTokens();
      CSRFProtection.clearCSRFToken();
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    }
  }

  public async streamResponse(
    query: string,
    onChunk: (chunk: StreamingChunk) => void,
    onComplete: (brief: Brief) => void,
    onError: (error: string) => void,
    conversationId?: string,
    context?: {
      jurisdiction?: string;
      role?: string;
      organization?: string;
    }
  ): Promise<void> {
    try {
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }
      
      // Add CSRF protection
      headers = await CSRFProtection.addCSRFHeader(headers);

      const response = await fetch(`${this.baseUrl}/api/chat/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          threadId: conversationId || `thread-${Date.now()}`,
          content: query,
          expertType: 'AML_CFT',
          temperature: 0.2,
          maxTokens: 1000,
          systemInstructions: context?.systemInstructions
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuthToken();
          onError('Authentication required. Please log in.');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'complete') {
                onComplete(data.data);
                return;
              } else if (data.type === 'error') {
                onError(data.data);
                return;
              } else {
                onChunk(data);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      onError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  public async generateAdvisory(
    query: string,
    conversationId?: string,
    context?: {
      jurisdiction?: string;
      role?: string;
      organization?: string;
    }
  ): Promise<Brief> {
    try {
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }
      
      // Add CSRF protection
      headers = await CSRFProtection.addCSRFHeader(headers);

      const response = await fetch(`${this.baseUrl}/api/chat/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          threadId: conversationId || `thread-${Date.now()}`,
          content: query,
          expertType: 'AML_CFT',
          temperature: 0.2,
          maxTokens: 1000,
          systemInstructions: context?.systemInstructions
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuthToken();
          throw new Error('Authentication required. Please log in.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const brief = await response.json();
      return brief;
    } catch (error) {
      console.error('Advisory generation error:', error);
      throw error;
    }
  }

  public async submitFeedback(
    briefId: string,
    type: 'advisory_quality' | 'system_usability' | 'feature_request' | 'bug_report',
    rating: number,
    comment?: string
  ): Promise<void> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.baseUrl}/chat/feedback`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          briefId,
          type,
          rating,
          comment,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuthToken();
          throw new Error('Authentication required. Please log in.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      throw error;
    }
  }

  public async createConversation(
    title?: string,
    context?: {
      jurisdiction?: string;
      role?: string;
      organization?: string;
    }
  ): Promise<{ id: string; title: string; context?: any; createdAt: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.baseUrl}/chat/conversations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title,
          context,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuthToken();
          throw new Error('Authentication required. Please log in.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const conversation = await response.json();
      return conversation;
    } catch (error) {
      console.error('Conversation creation error:', error);
      throw error;
    }
  }

  public async getConversation(conversationId: string): Promise<any> {
    try {
      const headers: Record<string, string> = {};

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.baseUrl}/chat/conversations/${conversationId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuthToken();
          throw new Error('Authentication required. Please log in.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const conversation = await response.json();
      return conversation;
    } catch (error) {
      console.error('Get conversation error:', error);
      throw error;
    }
  }
}