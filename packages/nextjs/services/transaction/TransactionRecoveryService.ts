import { BrowserProvider, TransactionResponse } from 'ethers';

export interface StuckTransaction {
  hash: string;
  nonce: number;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  submittedAt: number;
  isStuck: boolean;
  suggestedAction: 'wait' | 'speedup' | 'cancel';
}

export class TransactionRecoveryService {
  private readonly STUCK_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if transaction is stuck
   */
  async checkTransactionStatus(
    provider: BrowserProvider,
    txHash: string
  ): Promise<StuckTransaction> {
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      throw new Error('Transaction not found');
    }

    const currentBlock = await provider.getBlockNumber();
    const txBlock = tx.blockNumber;

    // Check if confirmed
    if (txBlock && currentBlock - txBlock >= 1) {
      return {
        hash: txHash,
        nonce: tx.nonce,
        from: tx.from,
        to: tx.to!,
        value: tx.value.toString(),
        gasPrice: tx.gasPrice?.toString() || '0',
        submittedAt: Date.now(),
        isStuck: false,
        suggestedAction: 'wait',
      };
    }

    // Check time since submission
    const timePending = Date.now() - (tx.blockNumber ? 0 : this.STUCK_THRESHOLD);
    const isStuck = timePending > this.STUCK_THRESHOLD;

    return {
      hash: txHash,
      nonce: tx.nonce,
      from: tx.from,
      to: tx.to!,
      value: tx.value.toString(),
      gasPrice: tx.gasPrice?.toString() || '0',
      submittedAt: Date.now() - timePending,
      isStuck,
      suggestedAction: isStuck ? 'speedup' : 'wait',
    };
  }

  /**
   * Speed up stuck transaction (replace with higher gas)
   */
  async speedUpTransaction(
    provider: BrowserProvider,
    signer: any,
    originalTx: StuckTransaction
  ): Promise<string> {
    const currentGasPrice = await provider.getFeeData();
    const newGasPrice = (currentGasPrice.gasPrice! * 120n) / 100n; // 20% higher

    // Create replacement transaction with same nonce
    const speedUpTx = {
      to: originalTx.to,
      value: originalTx.value,
      nonce: originalTx.nonce,
      gasPrice: newGasPrice,
      gasLimit: 200000, // Adjust based on original
    };

    const tx = await signer.sendTransaction(speedUpTx);
    await tx.wait();

    return tx.hash;
  }

  /**
   * Cancel stuck transaction (send 0 ETH to self with higher gas)
   */
  async cancelTransaction(
    provider: BrowserProvider,
    signer: any,
    originalTx: StuckTransaction
  ): Promise<string> {
    const currentGasPrice = await provider.getFeeData();
    const newGasPrice = (currentGasPrice.gasPrice! * 120n) / 100n;

    // Send 0 ETH to self with same nonce
    const cancelTx = {
      to: originalTx.from,
      value: 0,
      nonce: originalTx.nonce,
      gasPrice: newGasPrice,
      gasLimit: 21000,
    };

    const tx = await signer.sendTransaction(cancelTx);
    await tx.wait();

    return tx.hash;
  }

  /**
   * Monitor transaction until confirmed
   */
  async monitorTransaction(
    provider: BrowserProvider,
    txHash: string,
    maxWaitTime: number = 10 * 60 * 1000 // 10 minutes
  ): Promise<{
    status: 'confirmed' | 'failed' | 'timeout';
    receipt?: any;
  }> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const checkStatus = async () => {
        try {
          const receipt = await provider.getTransactionReceipt(txHash);

          if (receipt) {
            resolve({
              status: receipt.status === 1 ? 'confirmed' : 'failed',
              receipt,
            });
            return;
          }

          // Check timeout
          if (Date.now() - startTime > maxWaitTime) {
            resolve({ status: 'timeout' });
            return;
          }

          // Check again in 3 seconds
          setTimeout(checkStatus, 3000);
        } catch (error) {
          console.error('Error checking transaction:', error);
          setTimeout(checkStatus, 3000);
        }
      };

      checkStatus();
    });
  }
}

export const transactionRecoveryService = new TransactionRecoveryService();
