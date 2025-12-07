export interface QueuedTransaction {
  id: string;
  execute: () => Promise<any>;
  retries: number;
  maxRetries: number;
  timestamp: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export class TransactionQueue {
  private queue: QueuedTransaction[] = [];
  private processing = false;

  add(tx: Omit<QueuedTransaction, 'status' | 'retries' | 'timestamp'>): string {
    const queuedTx: QueuedTransaction = {
      ...tx,
      status: 'queued',
      retries: 0,
      timestamp: Date.now()
    };

    this.queue.push(queuedTx);
    this.processQueue();
    return queuedTx.id;
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const tx = this.queue[0];
      
      if (tx.status === 'queued' || (tx.status === 'failed' && tx.retries < tx.maxRetries)) {
        tx.status = 'processing';
        
        try {
          await tx.execute();
          tx.status = 'completed';
          this.queue.shift();
        } catch (error) {
          tx.retries++;
          tx.error = error instanceof Error ? error.message : 'Unknown error';
          
          if (tx.retries >= tx.maxRetries) {
            tx.status = 'failed';
            this.queue.shift();
          } else {
            tx.status = 'queued';
            await this.sleep(2000 * tx.retries);
          }
        }
      } else {
        this.queue.shift();
      }
    }

    this.processing = false;
  }

  getStatus(id: string): QueuedTransaction | undefined {
    return this.queue.find(tx => tx.id === id);
  }

  remove(id: string): boolean {
    const index = this.queue.findIndex(tx => tx.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  clear() {
    this.queue = [];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const transactionQueue = new TransactionQueue();
