import { useCallback, useState } from 'react';

/**
 * Error Boundary Hook
 * Enterprise-grade error handling
 */

interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
}

interface UseErrorBoundaryReturn {
  captureError: (error: Error, errorInfo?: any) => void;
  clearError: () => void;
  error: ErrorInfo | null;
  hasError: boolean;
}

export function useErrorBoundary(): UseErrorBoundaryReturn {
  const [error, setError] = useState<ErrorInfo | null>(null);

  const captureError = useCallback((error: Error, errorInfo?: any) => {
    const errorDetails: ErrorInfo = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    setError(errorDetails);

    // Log to monitoring service (Sentry, DataDog, etc.)
    console.error('Error captured:', errorDetails);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // analytics.track('error', errorDetails);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    captureError,
    clearError,
    error,
    hasError: error !== null,
  };
}