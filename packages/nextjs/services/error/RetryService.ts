export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number;
  retryableErrors: string[];
}

export class RetryService {
  private readonly DEFAULT_CONFIG: RetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: [
      'NETWORK_ERROR',
      'TIMEOUT',
      'NONCE_TOO_LOW',
      'REPLACEMENT_UNDERPRICED',
      'SERVER_ERROR',
      'CALL_EXCEPTION',
    ],
  };

  /**
   * Execute function with retry logic
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    let lastError: Error | null = null;
    let delay = finalConfig.initialDelay;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${finalConfig.maxAttempts}`);
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Check if error is retryable
        const isRetryable = this.isRetryableError(error, finalConfig.retryableErrors);

        if (!isRetryable || attempt === finalConfig.maxAttempts) {
          throw error;
        }

        console.log(`⏳ Retrying in ${delay}ms...`);
        await this.sleep(delay);

        // Exponential backoff
        delay = Math.min(delay * finalConfig.backoffMultiplier, finalConfig.maxDelay);
      }
    }

    throw lastError;
  }

  /**
   * Check if error should be retried
   */
  private isRetryableError(error: any, retryableErrors: string[]): boolean {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';

    return retryableErrors.some(retryable => 
      errorMessage.includes(retryable.toLowerCase()) ||
      errorCode.includes(retryable.toLowerCase())
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const retryService = new RetryService();
