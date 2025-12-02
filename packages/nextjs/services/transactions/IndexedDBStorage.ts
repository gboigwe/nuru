import { TransactionRecord, TransactionStatus, TransactionStorage } from './types';

const DB_NAME = 'nuru-transactions';
const STORE_NAME = 'transactions';
const DB_VERSION = 1;

export class IndexedDBStorage implements TransactionStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.initializeDB();
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        return resolve();
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'hash' });
          
          // Create indexes for faster queries
          store.createIndex('from', 'from', { unique: false });
          store.createIndex('to', 'to', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private async withStore<T>(
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest<T> | void
  ): Promise<T> {
    await this.initPromise;
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      const request = callback(store);

      if (request) {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } else {
        transaction.oncomplete = () => resolve(undefined as unknown as T);
      }

      transaction.onerror = () => reject(transaction.error);
    });
  }

  async saveTransaction(tx: Omit<TransactionRecord, 'timestamp'>): Promise<void> {
    const record: TransactionRecord = {
      ...tx,
      timestamp: Date.now(),
    };

    await this.withStore('readwrite', (store) => {
      store.put(record);
    });
  }

  async getTransactions(params: {
    limit?: number;
    offset?: number;
    status?: TransactionStatus;
    address?: string;
  } = {}): Promise<TransactionRecord[]> {
    const { limit = 50, offset = 0, status, address } = params;
    
    return new Promise((resolve, reject) => {
      this.withStore('readonly', (store) => {
        let index: IDBIndex | IDBObjectStore = store;
        let range: IDBKeyRange | undefined;
        
        if (status) {
          index = store.index('status');
          range = IDBKeyRange.only(status);
        } else if (address) {
          // Search in both 'from' and 'to' fields
          const fromRequest = store.index('from').getAll(IDBKeyRange.only(address));
          const toRequest = store.index('to').getAll(IDBKeyRange.only(address));
          
          Promise.all([fromRequest, toRequest].map(
            req => new Promise<TransactionRecord[]>((res, rej) => {
              req.onsuccess = () => res(req.result);
              req.onerror = () => rej(req.error);
            })
          )).then(([fromTxs, toTxs]) => {
            // Combine and deduplicate transactions
            const allTxs = [...fromTxs, ...toTxs];
            const uniqueTxs = Array.from(
              new Map(allTxs.map(tx => [tx.hash, tx])).values()
            );
            
            // Sort by timestamp descending
            uniqueTxs.sort((a, b) => b.timestamp - a.timestamp);
            
            // Apply pagination
            resolve(uniqueTxs.slice(offset, offset + limit));
          }).catch(reject);
          
          return;
        } else {
          // No filters, just get all transactions sorted by timestamp
          index = store.index('timestamp');
          range = undefined;
        }
        
        const request = index.getAll(range);
        
        request.onsuccess = () => {
          let results = request.result as TransactionRecord[];
          
          // Sort by timestamp descending (newest first)
          results.sort((a, b) => b.timestamp - a.timestamp);
          
          // Apply pagination
          results = results.slice(offset, offset + limit);
          
          resolve(results);
          return undefined; // To satisfy TypeScript return type
        };
        
        request.onerror = () => {
          reject(request.error);
          return undefined; // To satisfy TypeScript return type
        };
      });
    });
  }

  async getTransaction(hash: string): Promise<TransactionRecord | null> {
    return this.withStore<TransactionRecord | undefined>('readonly', (store) => {
      return store.get(hash);
    }).then(result => result || null);
  }

  async updateTransaction(
    hash: string,
    updates: Partial<TransactionRecord>
  ): Promise<void> {
    const tx = await this.getTransaction(hash);
    if (!tx) {
      throw new Error(`Transaction ${hash} not found`);
    }

    await this.withStore('readwrite', (store) => {
      store.put({ ...tx, ...updates });
    });
  }

  async clearTransactions(): Promise<void> {
    await this.withStore('readwrite', (store) => {
      store.clear();
    });
  }
}

// Export a singleton instance
export const transactionStorage = new IndexedDBStorage();
