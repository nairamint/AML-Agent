import { useCallback, useRef, useEffect } from 'react';

/**
 * Focus Management Hook
 * WCAG 2.1 AA compliant focus handling
 */

interface UseFocusManagementOptions {
  restoreOnUnmount?: boolean;
  trapFocus?: boolean;
}

export function useFocusManagement(options: UseFocusManagementOptions = {}) {
  const { restoreOnUnmount = true, trapFocus = false } = options;
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  // Store the currently focused element when component mounts
  useEffect(() => {
    previousActiveElement.current = document.activeElement as HTMLElement;
    
    return () => {
      // Restore focus when component unmounts
      if (restoreOnUnmount && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [restoreOnUnmount]);

  // Focus trap implementation
  useEffect(() => {
    if (!trapFocus || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element when trap is activated
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [trapFocus]);

  const focusFirst = useCallback(() => {
    if (containerRef.current) {
      const firstFocusable = containerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, []);

  const focusLast = useCallback(() => {
    if (containerRef.current) {
      const focusableElements = containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (lastFocusable) {
        lastFocusable.focus();
      }
    }
  }, []);

  return {
    containerRef,
    focusFirst,
    focusLast,
  };
}