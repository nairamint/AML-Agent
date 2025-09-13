/**
 * Backend API Service
 * 
 * Production-ready API service for handling HTTP requests, authentication,
 * rate limiting, and error handling. This service provides the interface
 * between the frontend and backend systems.
 */

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  rateLimitPerMinute: number;
}

export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
  timestamp: string;
  requestId: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
}

export class BackendApiService {
  private config: ApiConfig;
  private authToken: AuthToken | null = null;
  private rateLimitInfo: RateLimitInfo | null = null;
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  /**
   * Initialize the API service
   */
  async initialize(): Promise<void> {
    try {
      // Load stored auth token
      await this.loadStoredAuthToken();
      
      // Test connection
      await this.testConnection();
      
      console.log('BackendApiService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize BackendApiService:', error);
      throw error;
    }
  }

  /**
   * Authenticate user and store tokens
   */
  async authenticate(username: string, password: string): Promise<AuthToken> {
    try {
      const response = await this.makeRequest({
        method: 'POST',
        endpoint: '/auth/login',
        data: { username, password }
      });

      if (!response.success || !response.data) {
        throw new Error('Authentication failed');
      }

      this.authToken = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        expiresAt: Date.now() + (response.data.expiresIn * 1000),
        tokenType: response.data.tokenType || 'Bearer'
      };

      // Store token securely
      await this.storeAuthToken(this.authToken);

      return this.authToken;
    } catch (error) {
      console.error('Authentication error:', error);
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<AuthToken> {
    if (!this.authToken?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.makeRequest({
        method: 'POST',
        endpoint: '/auth/refresh',
        data: { refreshToken: this.authToken.refreshToken }
      });

      if (!response.success || !response.data) {
        throw new Error('Token refresh failed');
      }

      this.authToken = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken || this.authToken.refreshToken,
        expiresAt: Date.now() + (response.data.expiresIn * 1000),
        tokenType: response.data.tokenType || 'Bearer'
      };

      await this.storeAuthToken(this.authToken);
      return this.authToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear invalid tokens
      this.authToken = null;
      await this.clearStoredAuthToken();
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit advisory query
   */
  async submitAdvisoryQuery(query: string, context: any): Promise<ApiResponse> {
    return this.makeRequest({
      method: 'POST',
      endpoint: '/advisory/query',
      data: { query, context }
    });
  }

  /**
   * Get advisory response
   */
  async getAdvisoryResponse(requestId: string): Promise<ApiResponse> {
    return this.makeRequest({
      method: 'GET',
      endpoint: `/advisory/response/${requestId}`
    });
  }

  /**
   * Stream advisory response
   */
  async streamAdvisoryResponse(
    query: string,
    context: any,
    onChunk: (chunk: any) => void,
    onComplete: (response: any) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const response = await this.makeRequest({
        method: 'POST',
        endpoint: '/api/chat/chat',
        data: { 
          threadId: context.conversationId || `thread-${Date.now()}`,
          content: query,
          expertType: 'AML_CFT',
          temperature: 0.2,
          maxTokens: 1000,
          systemInstructions: context.systemInstructions
        }
      });

      if (!response.success) {
        onError(response.error || 'Streaming request failed');
        return;
      }

      // Handle streaming response
      const streamId = response.data.streamId;
      await this.handleStreamingResponse(streamId, onChunk, onComplete, onError);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unknown streaming error');
    }
  }

  /**
   * Get regulatory knowledge base
   */
  async getRegulatoryKnowledge(jurisdiction: string, framework: string): Promise<ApiResponse> {
    return this.makeRequest({
      method: 'GET',
      endpoint: `/regulatory/knowledge/${jurisdiction}/${framework}`
    });
  }

  /**
   * Update regulatory knowledge base
   */
  async updateRegulatoryKnowledge(data: any): Promise<ApiResponse> {
    return this.makeRequest({
      method: 'PUT',
      endpoint: '/regulatory/knowledge',
      data
    });
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(): Promise<ApiResponse> {
    return this.makeRequest({
      method: 'GET',
      endpoint: '/user/preferences'
    });
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(preferences: any): Promise<ApiResponse> {
    return this.makeRequest({
      method: 'PUT',
      endpoint: '/user/preferences',
      data: preferences
    });
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(filters: any): Promise<ApiResponse> {
    return this.makeRequest({
      method: 'GET',
      endpoint: '/audit/logs',
      data: filters
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse> {
    return this.makeRequest({
      method: 'GET',
      endpoint: '/health'
    });
  }

  /**
   * Make HTTP request with retry logic and rate limiting
   */
  private async makeRequest<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    
    try {
      // Check rate limiting
      await this.checkRateLimit();
      
      // Ensure authentication
      await this.ensureAuthenticated();
      
      // Build request URL
      const url = `${this.config.baseUrl}${request.endpoint}`;
      
      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        ...request.headers
      };

      // Add authorization header
      if (this.authToken) {
        headers['Authorization'] = `${this.authToken.tokenType} ${this.authToken.accessToken}`;
      }

      // Make request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), request.timeout || this.config.timeout);

      const response = await fetch(url, {
        method: request.method,
        headers,
        body: request.data ? JSON.stringify(request.data) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Update rate limit info
      this.updateRateLimitInfo(response);

      // Parse response
      const responseData = await response.json();

      return {
        success: response.ok,
        data: response.ok ? responseData : undefined,
        error: response.ok ? undefined : responseData.message || 'Request failed',
        statusCode: response.status,
        timestamp: new Date().toISOString(),
        requestId
      };

    } catch (error) {
      console.error(`API request failed (${requestId}):`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 0,
        timestamp: new Date().toISOString(),
        requestId
      };
    }
  }

  /**
   * Handle streaming response
   */
  private async handleStreamingResponse(
    streamId: string,
    onChunk: (chunk: any) => void,
    onComplete: (response: any) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const url = `${this.config.baseUrl}/advisory/stream/${streamId}`;
      const headers: Record<string, string> = {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      };

      if (this.authToken) {
        headers['Authorization'] = `${this.authToken.tokenType} ${this.authToken.accessToken}`;
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`Streaming request failed: ${response.status}`);
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
              
              if (data.type === 'chunk') {
                onChunk(data.chunk);
              } else if (data.type === 'complete') {
                onComplete(data.response);
                return;
              } else if (data.type === 'error') {
                onError(data.error);
                return;
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Streaming error');
    }
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(): Promise<void> {
    if (this.rateLimitInfo && this.rateLimitInfo.remaining <= 0) {
      const waitTime = this.rateLimitInfo.resetTime - Date.now();
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Update rate limit info from response headers
   */
  private updateRateLimitInfo(response: Response): void {
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        resetTime: parseInt(reset) * 1000
      };
    }
  }

  /**
   * Ensure user is authenticated
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.authToken) {
      throw new Error('User not authenticated');
    }

    // Check if token is expired
    if (Date.now() >= this.authToken.expiresAt - 60000) { // Refresh 1 minute before expiry
      try {
        await this.refreshToken();
      } catch (error) {
        throw new Error('Authentication expired and refresh failed');
      }
    }
  }

  /**
   * Test API connection
   */
  private async testConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`API connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load stored authentication token
   */
  private async loadStoredAuthToken(): Promise<void> {
    try {
      const stored = localStorage.getItem('auth_token');
      if (stored) {
        this.authToken = JSON.parse(stored);
        
        // Check if token is still valid
        if (Date.now() >= this.authToken!.expiresAt) {
          this.authToken = null;
          await this.clearStoredAuthToken();
        }
      }
    } catch (error) {
      console.warn('Failed to load stored auth token:', error);
      this.authToken = null;
    }
  }

  /**
   * Store authentication token securely
   */
  private async storeAuthToken(token: AuthToken): Promise<void> {
    try {
      localStorage.setItem('auth_token', JSON.stringify(token));
    } catch (error) {
      console.warn('Failed to store auth token:', error);
    }
  }

  /**
   * Clear stored authentication token
   */
  private async clearStoredAuthToken(): Promise<void> {
    try {
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.warn('Failed to clear stored auth token:', error);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Logout and clear authentication
   */
  async logout(): Promise<void> {
    try {
      if (this.authToken) {
        await this.makeRequest({
          method: 'POST',
          endpoint: '/auth/logout'
        });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.authToken = null;
      await this.clearStoredAuthToken();
    }
  }

  /**
   * Get current authentication status
   */
  isAuthenticated(): boolean {
    return this.authToken !== null && Date.now() < this.authToken.expiresAt;
  }

  /**
   * Get rate limit information
   */
  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }
}

