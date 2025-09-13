/**
 * CSRF Protection Service
 * 
 * Implements CSRF (Cross-Site Request Forgery) protection to prevent
 * malicious requests from unauthorized sources.
 */

export class CSRFProtection {
  private static csrfToken: string | null = null;
  private static tokenExpiry: number = 0;
  private static readonly TOKEN_LIFETIME = 30 * 60 * 1000; // 30 minutes
  
  /**
   * Get CSRF token for requests
   */
  static async getCSRFToken(): Promise<string> {
    if (!this.csrfToken || Date.now() > this.tokenExpiry) {
      await this.refreshCSRFToken();
    }
    return this.csrfToken!;
  }
  
  /**
   * Refresh CSRF token from server
   */
  private static async refreshCSRFToken(): Promise<void> {
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get CSRF token: ${response.status}`);
      }
      
      const data = await response.json();
      this.csrfToken = data.token;
      this.tokenExpiry = Date.now() + this.TOKEN_LIFETIME;
      
      // Store token securely
      sessionStorage.setItem('csrf_token', this.csrfToken);
      sessionStorage.setItem('csrf_token_expiry', this.tokenExpiry.toString());
      
    } catch (error) {
      console.error('Failed to refresh CSRF token:', error);
      // Generate a fallback token for development
      this.csrfToken = this.generateFallbackToken();
      this.tokenExpiry = Date.now() + this.TOKEN_LIFETIME;
    }
  }
  
  /**
   * Generate fallback token for development
   */
  private static generateFallbackToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Validate CSRF token
   */
  static async validateCSRFToken(token: string): Promise<boolean> {
    if (!token) return false;
    
    const currentToken = await this.getCSRFToken();
    return token === currentToken;
  }
  
  /**
   * Add CSRF token to request headers
   */
  static async addCSRFHeader(headers: Record<string, string>): Promise<Record<string, string>> {
    const token = await this.getCSRFToken();
    return {
      ...headers,
      'X-CSRF-Token': token
    };
  }
  
  /**
   * Initialize CSRF protection
   */
  static async initialize(): Promise<void> {
    try {
      // Try to load existing token from storage
      const storedToken = sessionStorage.getItem('csrf_token');
      const storedExpiry = sessionStorage.getItem('csrf_token_expiry');
      
      if (storedToken && storedExpiry) {
        const expiry = parseInt(storedExpiry);
        if (Date.now() < expiry) {
          this.csrfToken = storedToken;
          this.tokenExpiry = expiry;
          return;
        }
      }
      
      // Get new token
      await this.refreshCSRFToken();
    } catch (error) {
      console.error('Failed to initialize CSRF protection:', error);
      // Continue with fallback token
      this.csrfToken = this.generateFallbackToken();
      this.tokenExpiry = Date.now() + this.TOKEN_LIFETIME;
    }
  }
  
  /**
   * Clear CSRF token
   */
  static clearCSRFToken(): void {
    this.csrfToken = null;
    this.tokenExpiry = 0;
    sessionStorage.removeItem('csrf_token');
    sessionStorage.removeItem('csrf_token_expiry');
  }
  
  /**
   * Check if CSRF protection is active
   */
  static isActive(): boolean {
    return this.csrfToken !== null && Date.now() < this.tokenExpiry;
  }
}
