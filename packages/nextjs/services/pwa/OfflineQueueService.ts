/**
 * Offline Transaction Queue Service
 *
 * Manages queuing of transactions when offline
 * Syncs when connection is restored
 */

export interface QueuedTransaction {
  id: string;
  type: "payment" | "approval";
  data: {
    recipient?: string;
    amount?: string;
    currency?: string;
    voiceCommand?: string;
    contractAddress?: string;
    spender?: string;
  };
  timestamp: number;
  retryCount: number;
  status: "pending" | "syncing" | "failed" | "completed";
  error?: string;
}

class OfflineQueueServiceClass {
  private readonly STORAGE_KEY = "nuru_offline_queue";
  private readonly MAX_RETRIES = 3;

  /**
   * Add transaction to offline queue
   */
  async addToQueue(transaction: Omit<QueuedTransaction, "id" | "timestamp" | "retryCount" | "status">): Promise<string> {
    const queuedTx: QueuedTransaction = {
      ...transaction,
      id: `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    };

    const queue = this.getQueue();
    queue.push(queuedTx);
    this.saveQueue(queue);

    console.log("✅ Added to offline queue:", queuedTx.id);
    return queuedTx.id;
  }

  /**
   * Get all queued transactions
   */
  getQueue(): QueuedTransaction[] {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to load offline queue:", error);
      return [];
    }
  }

  /**
   * Get pending transactions
   */
  getPendingTransactions(): QueuedTransaction[] {
    return this.getQueue().filter(tx => tx.status === "pending" && tx.retryCount < this.MAX_RETRIES);
  }

  /**
   * Update transaction status
   */
  updateTransaction(id: string, updates: Partial<QueuedTransaction>): void {
    const queue = this.getQueue();
    const index = queue.findIndex(tx => tx.id === id);

    if (index >= 0) {
      queue[index] = { ...queue[index], ...updates };
      this.saveQueue(queue);
    }
  }

  /**
   * Remove transaction from queue
   */
  removeTransaction(id: string): void {
    const queue = this.getQueue().filter(tx => tx.id !== id);
    this.saveQueue(queue);
  }

  /**
   * Process offline queue when online
   */
  async processQueue(
    processor: (tx: QueuedTransaction) => Promise<void>
  ): Promise<{ processed: number; failed: number }> {
    const pending = this.getPendingTransactions();
    let processed = 0;
    let failed = 0;

    console.log(`📤 Processing ${pending.length} queued transactions...`);

    for (const tx of pending) {
      try {
        this.updateTransaction(tx.id, { status: "syncing" });

        await processor(tx);

        this.updateTransaction(tx.id, {
          status: "completed",
          retryCount: tx.retryCount + 1
        });
        processed++;

        console.log(`✅ Synced transaction: ${tx.id}`);
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        if (tx.retryCount + 1 >= this.MAX_RETRIES) {
          this.updateTransaction(tx.id, {
            status: "failed",
            error: errorMessage,
            retryCount: tx.retryCount + 1
          });
          console.error(`❌ Transaction failed after ${this.MAX_RETRIES} retries:`, tx.id);
        } else {
          this.updateTransaction(tx.id, {
            status: "pending",
            error: errorMessage,
            retryCount: tx.retryCount + 1
          });
          console.warn(`⚠️ Transaction retry ${tx.retryCount + 1}/${this.MAX_RETRIES}:`, tx.id);
        }
      }
    }

    // Clean up completed transactions older than 24 hours
    this.cleanupOldTransactions();

    return { processed, failed };
  }

  /**
   * Clear all transactions
   */
  clearQueue(): void {
    this.saveQueue([]);
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const queue = this.getQueue();

    return {
      total: queue.length,
      pending: queue.filter(tx => tx.status === "pending").length,
      syncing: queue.filter(tx => tx.status === "syncing").length,
      completed: queue.filter(tx => tx.status === "completed").length,
      failed: queue.filter(tx => tx.status === "failed").length,
    };
  }

  // Private methods

  private saveQueue(queue: QueuedTransaction[]): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error("Failed to save offline queue:", error);
    }
  }

  private cleanupOldTransactions(): void {
    const queue = this.getQueue();
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const filtered = queue.filter(tx => {
      // Keep pending and syncing transactions
      if (tx.status === "pending" || tx.status === "syncing") return true;

      // Remove completed/failed transactions older than 24 hours
      return tx.timestamp > oneDayAgo;
    });

    if (filtered.length !== queue.length) {
      this.saveQueue(filtered);
      console.log(`🗑️ Cleaned up ${queue.length - filtered.length} old transactions`);
    }
  }
}

export const offlineQueueService = new OfflineQueueServiceClass();
