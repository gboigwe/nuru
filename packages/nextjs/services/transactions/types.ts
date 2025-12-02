export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface TransactionRecord {
  hash: string;
  from: string;
  to: string;
  amount: bigint;
  token: string;
  timestamp: number;
  status: TransactionStatus;
  voiceCommand?: string;
  recipientENS?: string;
  gasPaid: bigint;
  blockNumber: number;
  networkId: number;
  nonce: number;
  data?: string;
  receipt?: any; // Raw transaction receipt
}

export interface TransactionStorage {
  saveTransaction(tx: Omit<TransactionRecord, 'timestamp'>): Promise<void>;
  getTransactions(params?: {
    limit?: number;
    offset?: number;
    status?: TransactionStatus;
    address?: string;
  }): Promise<TransactionRecord[]>;
  getTransaction(hash: string): Promise<TransactionRecord | null>;
  updateTransaction(hash: string, updates: Partial<TransactionRecord>): Promise<void>;
  clearTransactions(): Promise<void>;
}
