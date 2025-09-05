/**
 * Retry Hook for Nuru MVP
 * Provides exponential backoff retry logic for failed operations
 */

import { useState, useCallback, useRef } from 'react';

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

interface RetryState {
  isRetrying: boolean;
  attemptCount: number;
  lastError: Error | null;
}

export function useRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    exponentialBackoff = true,
    onRetry,
    shouldRetry = () => true
  } = options;

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    attemptCount: 0,
    lastError: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const calculateDelay = useCallback((attempt: number): number => {
    if (!exponentialBackoff) return baseDelay;
    
    const delay = baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, maxDelay);
  }, [baseDelay, maxDelay, exponentialBackoff]);

  const executeWithRetry = useCallback(async (): Promise<T> => {
    // Cancel any ongoing retry
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setState(prev => ({
      ...prev,
      isRetrying: true,
      attemptCount: 0,
      lastError: null
    }));

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (signal.aborted) {
        throw new Error('Operation cancelled');
      }

      try {
        setState(prev => ({ ...prev, attemptCount: attempt }));
        
        const result = await operation();
        
        setState(prev => ({
          ...prev,
          isRetrying: false,
          lastError: null
        }));
        
        return result;
        
      } catch (error) {
        const err = error as Error;
        
        setState(prev => ({ ...prev, lastError: err }));
        
        // Don't retry if we shouldn't or if it's the last attempt
        if (!shouldRetry(err) || attempt === maxAttempts) {
          setState(prev => ({ ...prev, isRetrying: false }));
          throw err;
        }
        
        // Call retry callback
        onRetry?.(attempt, err);
        
        // Wait before next attempt
        const delay = calculateDelay(attempt);
        await new Promise((resolve) => {
          const timeoutId = setTimeout(resolve, delay);
          
          // Allow cancellation during delay
          signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            resolve(void 0);
          });
        });
      }
    }

    // This should never be reached, but TypeScript requires it
    throw state.lastError || new Error('Max retry attempts exceeded');
    
  }, [operation, maxAttempts, shouldRetry, onRetry, calculateDelay]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({
        ...prev,
        isRetrying: false
      }));
    }
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({
      isRetrying: false,
      attemptCount: 0,
      lastError: null
    });
  }, [cancel]);

  return {
    execute: executeWithRetry,
    cancel,
    reset,
    ...state
  };
}

// Predefined retry configurations for common scenarios
export const retryConfigs = {
  // For blockchain/network operations
  blockchain: {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 8000,
    shouldRetry: (error: Error) => {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('gas') ||
        (message.includes('nonce') && !message.includes('user denied'))
      );
    }
  },

  // For voice recognition operations
  voice: {
    maxAttempts: 2,
    baseDelay: 1000,
    maxDelay: 3000,
    shouldRetry: (error: Error) => {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('audio') ||
        message.includes('microphone')
      );
    }
  },

  // For storage operations
  storage: {
    maxAttempts: 3,
    baseDelay: 1500,
    maxDelay: 6000,
    shouldRetry: (error: Error) => {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('storage') ||
        message.includes('upload')
      );
    }
  },

  // For ENS resolution
  ens: {
    maxAttempts: 2,
    baseDelay: 1000,
    maxDelay: 3000,
    shouldRetry: (error: Error) => {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('resolver')
      );
    }
  }
};

// Convenience hooks for specific use cases
export const useBlockchainRetry = <T>(operation: () => Promise<T>) =>
  useRetry(operation, retryConfigs.blockchain);

export const useVoiceRetry = <T>(operation: () => Promise<T>) =>
  useRetry(operation, retryConfigs.voice);

export const useStorageRetry = <T>(operation: () => Promise<T>) =>
  useRetry(operation, retryConfigs.storage);

export const useENSRetry = <T>(operation: () => Promise<T>) =>
  useRetry(operation, retryConfigs.ens);