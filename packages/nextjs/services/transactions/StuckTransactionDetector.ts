import { BrowserProvider } from 'ethers';

export interface StuckTransaction {
  hash: string;
  nonce: number;
  timestamp: number;
  age: number;
  from: string;
  gasPrice: bigint;
}

export class StuckTransactionDetector {
  private provider: BrowserProvider | null = null;
  private readonly STUCK_THRESHOLD = 5 * 60 * 1000;

  initialize(provider: BrowserProvider) {
    this.provider = provider;
  }

  async detectStuckTransactions(address: string): Promise<StuckTransaction[]> {
    if (!this.provider) throw new Error('Provider not initialized');

    const stuckTxs: StuckTransaction[] = [];
    const currentNonce = await this.provider.getTransactionCount(address, 'latest');
    const pendingNonce = await this.provider.getTransactionCount(address, 'pending');

    if (pendingNonce === currentNonce) return stuckTxs;

    for (let nonce = currentNonce; nonce < pendingNonce; nonce++) {
      try {
        const block = await this.provider.getBlock('latest');
        const txs = block?.transactions || [];
        
        for (const txHash of txs) {
          const tx = await this.provider.getTransaction(txHash);
          if (tx && tx.from.toLowerCase() === address.toLowerCase() && tx.nonce === nonce) {
            const age = Date.now() - (block?.timestamp || 0) * 1000;
            
            if (age > this.STUCK_THRESHOLD) {
              stuckTxs.push({
                hash: tx.hash,
                nonce: tx.nonce,
                timestamp: (block?.timestamp || 0) * 1000,
                age,
                from: tx.from,
                gasPrice: tx.gasPrice || BigInt(0)
              });
            }
          }
        }
      } catch (error) {
        console.error('Error detecting stuck transaction:', error);
      }
    }

    return stuckTxs;
  }

  isStuck(timestamp: number): boolean {
    const age = Date.now() - timestamp;
    return age > this.STUCK_THRESHOLD;
  }
}

export const stuckTransactionDetector = new StuckTransactionDetector();
