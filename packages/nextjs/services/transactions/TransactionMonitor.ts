import { BrowserProvider } from 'ethers';

export type TransactionStatus = 'PENDING' | 'CONFIRMING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';

export interface MonitoredTransaction {
  hash: string;
  status: TransactionStatus;
  confirmations: number;
  timestamp: number;
  error?: string;
}

export class TransactionMonitor {
  private provider: BrowserProvider | null = null;
  private monitoredTxs = new Map<string, MonitoredTransaction>();

  initialize(provider: BrowserProvider) {
    this.provider = provider;
  }

  async pollTransactionStatus(
    txHash: string,
    maxAttempts: number = 60,
    interval: number = 5000
  ): Promise<TransactionStatus> {
    if (!this.provider) throw new Error('Provider not initialized');

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const receipt = await this.provider.getTransactionReceipt(txHash);
        
        if (receipt) {
          const status = receipt.status === 1 ? 'SUCCESS' : 'FAILED';
          this.updateTransaction(txHash, { status, confirmations: receipt.confirmations });
          return status;
        }

        this.updateTransaction(txHash, { status: 'PENDING', confirmations: 0 });
        await this.sleep(interval);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }

    this.updateTransaction(txHash, { status: 'TIMEOUT', confirmations: 0 });
    return 'TIMEOUT';
  }

  async waitForConfirmations(
    txHash: string,
    requiredConfirmations: number = 3
  ): Promise<boolean> {
    if (!this.provider) throw new Error('Provider not initialized');

    const receipt = await this.provider.getTransactionReceipt(txHash);
    if (!receipt) return false;

    const currentBlock = await this.provider.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber + 1;

    this.updateTransaction(txHash, {
      status: confirmations >= requiredConfirmations ? 'SUCCESS' : 'CONFIRMING',
      confirmations
    });

    return confirmations >= requiredConfirmations;
  }

  getTransaction(txHash: string): MonitoredTransaction | undefined {
    return this.monitoredTxs.get(txHash);
  }

  private updateTransaction(txHash: string, updates: Partial<MonitoredTransaction>) {
    const existing = this.monitoredTxs.get(txHash) || {
      hash: txHash,
      status: 'PENDING',
      confirmations: 0,
      timestamp: Date.now()
    };

    this.monitoredTxs.set(txHash, { ...existing, ...updates });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const transactionMonitor = new TransactionMonitor();
