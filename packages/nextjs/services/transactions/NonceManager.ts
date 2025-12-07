import { BrowserProvider } from 'ethers';

export class NonceManager {
  private provider: BrowserProvider | null = null;
  private pendingNonces = new Map<string, number>();
  private nonceCache = new Map<string, { nonce: number; timestamp: number }>();
  private readonly CACHE_TTL = 10000;

  initialize(provider: BrowserProvider) {
    this.provider = provider;
  }

  async getNextNonce(address: string): Promise<number> {
    if (!this.provider) throw new Error('Provider not initialized');

    const cached = this.nonceCache.get(address);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.nonce;
    }

    const pending = this.pendingNonces.get(address) || 0;
    const onchain = await this.provider.getTransactionCount(address, 'pending');
    const nextNonce = Math.max(pending, onchain);

    this.nonceCache.set(address, { nonce: nextNonce, timestamp: Date.now() });
    return nextNonce;
  }

  trackPendingNonce(address: string, nonce: number) {
    this.pendingNonces.set(address, nonce + 1);
  }

  clearPendingNonce(address: string) {
    this.pendingNonces.delete(address);
    this.nonceCache.delete(address);
  }

  async refreshNonce(address: string): Promise<number> {
    if (!this.provider) throw new Error('Provider not initialized');
    
    this.nonceCache.delete(address);
    return this.getNextNonce(address);
  }
}

export const nonceManager = new NonceManager();
