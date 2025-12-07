import { retryService } from '../error/RetryService';
import { transactionRecoveryService } from '../transaction/TransactionRecoveryService';
import { errorMessageService } from '../error/ErrorMessageService';
import { rpcFallbackProvider } from '../web3/RPCFallbackProvider';

export interface PaymentExecutionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  userError?: {
    title: string;
    message: string;
    action?: string;
    actionLabel?: string;
    severity: 'info' | 'warning' | 'error';
  };
}

export class EnhancedPaymentExecutor {
  private provider: any;
  private signer: any;

  constructor(provider: any, signer: any) {
    this.provider = provider;
    this.signer = signer;
  }

  async executePaymentWithRecovery(
    paymentData: any,
    onStatusUpdate?: (status: string) => void
  ): Promise<PaymentExecutionResult> {
    try {
      // Execute with retry logic
      const result = await retryService.executeWithRetry(
        async () => {
          onStatusUpdate?.('Sending transaction...');
          return await this.executePayment(paymentData);
        },
        {
          maxAttempts: 3,
          initialDelay: 2000,
        }
      );

      onStatusUpdate?.('Transaction sent. Waiting for confirmation...');

      // Monitor transaction
      const monitoring = await transactionRecoveryService.monitorTransaction(
        this.provider,
        result.txHash!,
        10 * 60 * 1000 // 10 minutes
      );

      if (monitoring.status === 'timeout') {
        onStatusUpdate?.('Transaction is taking longer than expected. Checking status...');
        
        // Check if stuck
        const stuckTx = await transactionRecoveryService.checkTransactionStatus(
          this.provider,
          result.txHash!
        );

        if (stuckTx.isStuck) {
          onStatusUpdate?.(`Transaction stuck. Attempting to speed up...`);
          
          // Speed up transaction
          const newTxHash = await transactionRecoveryService.speedUpTransaction(
            this.provider,
            this.signer,
            stuckTx
          );
          
          onStatusUpdate?.(`Transaction sped up. New hash: ${newTxHash}`);
          return { 
        ...result, 
        txHash: newTxHash,
        success: true 
      };
        }
      }

      if (monitoring.status === 'failed') {
        throw new Error('Transaction failed on-chain');
      }

      onStatusUpdate?.('Transaction confirmed!');
      return { success: true, txHash: result.txHash };
    } catch (error: any) {
      console.error('Payment execution failed:', error);
      
      // Convert to user-friendly error
      const userError = errorMessageService.getUserFriendlyError(error);
      
      return {
        success: false,
        error: error.message,
        userError,
      };
    }
  }

  private async executePayment(paymentData: any): Promise<PaymentExecutionResult> {
    try {
      // This is a placeholder for the actual payment execution logic
      // Replace with your actual contract interaction code
      const tx = await this.signer.sendTransaction({
        to: paymentData.to,
        value: paymentData.amount,
        // Add other transaction parameters as needed
      });

      return { 
        success: true,
        txHash: tx.hash 
      };
    } catch (error: any) {
      const userError = errorMessageService.getUserFriendlyError(error);
      return {
        success: false,
        error: error.message,
        userError,
      };
    }
  }
}

// Helper function to create a new instance with the current provider/signer
export const createEnhancedPaymentExecutor = async () => {
  // This assumes you're using ethers.js v6
  const { ethereum } = window as any;
  if (!ethereum) {
    throw new Error('No ethereum provider found');
  }

  const provider = new (await import('ethers')).BrowserProvider(ethereum);
  const signer = await provider.getSigner();
  
  return new EnhancedPaymentExecutor(provider, signer);
};
