/**
 * Basescan Service
 *
 * Fetches transaction history and blockchain data from Basescan API
 * https://basescan.org/apis
 */

import { Address } from 'viem';

/**
 * Transaction data from Basescan
 */
export interface BasescanTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string; // in Wei
  gas: string;
  gasPrice: string;
  isError: string; // '0' for success, '1' for error
  txreceipt_status: string; // '1' for success, '0' for failure
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
  methodId: string;
  functionName: string;
}

/**
 * ERC-20 token transfer from Basescan
 */
export interface BasescanTokenTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string; // Token amount in smallest unit
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
}

/**
 * Processed transaction for UI
 */
export interface ProcessedTransaction {
  hash: string;
  from: string;
  to: string;
  value: string; // Human-readable amount
  valueWei: string; // Raw Wei value
  timestamp: number;
  date: Date;
  status: 'success' | 'failed' | 'pending';
  gasUsed: string;
  gasCost: string;
  isIncoming: boolean;
  tokenSymbol?: string;
  tokenName?: string;
  functionName?: string;
  blockNumber: number;
  confirmations: number;
}

class BasescanServiceClass {
  private readonly BASE_API_URL = 'https://api.basescan.org/api';
  private readonly API_KEY = process.env.NEXT_PUBLIC_BASESCAN_API_KEY || '';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(
    address: Address,
    page = 1,
    offset = 10,
  ): Promise<ProcessedTransaction[]> {
    const cacheKey = `tx_history_${address}_${page}_${offset}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Get normal transactions
      const normalTxs = await this.getNormalTransactions(address, page, offset);

      // Get ERC-20 token transfers
      const tokenTxs = await this.getTokenTransfers(address, page, offset);

      // Combine and sort by timestamp
      const allTxs = [...normalTxs, ...this.processTokenTransfers(tokenTxs, address)].sort(
        (a, b) => b.timestamp - a.timestamp,
      );

      this.setCache(cacheKey, allTxs);
      return allTxs;
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      return [];
    }
  }

  /**
   * Get normal ETH transactions
   */
  private async getNormalTransactions(
    address: Address,
    page = 1,
    offset = 10,
  ): Promise<ProcessedTransaction[]> {
    const params = new URLSearchParams({
      module: 'account',
      action: 'txlist',
      address,
      page: page.toString(),
      offset: offset.toString(),
      sort: 'desc',
      apikey: this.API_KEY,
    });

    try {
      const response = await fetch(`${this.BASE_API_URL}?${params}`);

      if (!response.ok) {
        throw new Error(`Basescan API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === '0') {
        // No transactions found or API error
        return [];
      }

      const transactions: BasescanTransaction[] = data.result;

      return transactions.map(tx => this.processTransaction(tx, address));
    } catch (error) {
      console.error('Error fetching normal transactions:', error);
      return [];
    }
  }

  /**
   * Get ERC-20 token transfers
   */
  private async getTokenTransfers(
    address: Address,
    page = 1,
    offset = 10,
  ): Promise<BasescanTokenTransfer[]> {
    const params = new URLSearchParams({
      module: 'account',
      action: 'tokentx',
      address,
      page: page.toString(),
      offset: offset.toString(),
      sort: 'desc',
      apikey: this.API_KEY,
    });

    try {
      const response = await fetch(`${this.BASE_API_URL}?${params}`);

      if (!response.ok) {
        throw new Error(`Basescan API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === '0') {
        return [];
      }

      return data.result;
    } catch (error) {
      console.error('Error fetching token transfers:', error);
      return [];
    }
  }

  /**
   * Process raw transaction data
   */
  private processTransaction(tx: BasescanTransaction, userAddress: Address): ProcessedTransaction {
    const timestamp = parseInt(tx.timeStamp);
    const valueWei = tx.value;
    const valueEth = (parseFloat(valueWei) / 1e18).toFixed(4);
    const gasUsed = tx.gasUsed;
    const gasPrice = tx.gasPrice;
    const gasCost = ((parseFloat(gasUsed) * parseFloat(gasPrice)) / 1e18).toFixed(6);

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to || '',
      value: `${valueEth} ETH`,
      valueWei,
      timestamp,
      date: new Date(timestamp * 1000),
      status: tx.isError === '0' && tx.txreceipt_status === '1' ? 'success' : 'failed',
      gasUsed,
      gasCost: `${gasCost} ETH`,
      isIncoming: tx.to.toLowerCase() === userAddress.toLowerCase(),
      functionName: tx.functionName || undefined,
      blockNumber: parseInt(tx.blockNumber),
      confirmations: parseInt(tx.confirmations),
    };
  }

  /**
   * Process token transfer data
   */
  private processTokenTransfers(
    transfers: BasescanTokenTransfer[],
    userAddress: Address,
  ): ProcessedTransaction[] {
    return transfers.map(tx => {
      const timestamp = parseInt(tx.timeStamp);
      const decimals = parseInt(tx.tokenDecimal);
      const valueRaw = tx.value;
      const value = (parseFloat(valueRaw) / Math.pow(10, decimals)).toFixed(decimals);
      const gasUsed = tx.gasUsed;
      const gasPrice = tx.gasPrice;
      const gasCost = ((parseFloat(gasUsed) * parseFloat(gasPrice)) / 1e18).toFixed(6);

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: `${value} ${tx.tokenSymbol}`,
        valueWei: valueRaw,
        timestamp,
        date: new Date(timestamp * 1000),
        status: 'success', // Token transfers that appear are successful
        gasUsed,
        gasCost: `${gasCost} ETH`,
        isIncoming: tx.to.toLowerCase() === userAddress.toLowerCase(),
        tokenSymbol: tx.tokenSymbol,
        tokenName: tx.tokenName,
        blockNumber: parseInt(tx.blockNumber),
        confirmations: parseInt(tx.confirmations),
      };
    });
  }

  /**
   * Get transaction by hash
   */
  async getTransactionByHash(txHash: string): Promise<ProcessedTransaction | null> {
    const params = new URLSearchParams({
      module: 'proxy',
      action: 'eth_getTransactionByHash',
      txhash: txHash,
      apikey: this.API_KEY,
    });

    try {
      const response = await fetch(`${this.BASE_API_URL}?${params}`);

      if (!response.ok) {
        throw new Error(`Basescan API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.result) {
        return null;
      }

      // Process the transaction (simplified, may need receipt for full data)
      const tx = data.result;
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        value: (parseInt(tx.value, 16) / 1e18).toFixed(4) + ' ETH',
        valueWei: parseInt(tx.value, 16).toString(),
        timestamp: Date.now() / 1000, // Approximate
        date: new Date(),
        status: 'pending',
        gasUsed: '0',
        gasCost: '0',
        isIncoming: false,
        blockNumber: parseInt(tx.blockNumber, 16),
        confirmations: 0,
      };
    } catch (error) {
      console.error('Error fetching transaction by hash:', error);
      return null;
    }
  }

  /**
   * Get account balance from Basescan
   */
  async getBalance(address: Address): Promise<string> {
    const params = new URLSearchParams({
      module: 'account',
      action: 'balance',
      address,
      tag: 'latest',
      apikey: this.API_KEY,
    });

    try {
      const response = await fetch(`${this.BASE_API_URL}?${params}`);

      if (!response.ok) {
        throw new Error(`Basescan API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === '0') {
        return '0';
      }

      // Convert Wei to ETH
      const balanceWei = data.result;
      const balanceEth = (parseFloat(balanceWei) / 1e18).toFixed(6);

      return balanceEth;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  }

  /**
   * Cache helpers
   */
  private getCached(key: string): any | null {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    if (cached) {
      this.cache.delete(key);
    }

    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Clear expired cache
   */
  clearExpiredCache(): void {
    const now = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const basescanService = new BasescanServiceClass();
