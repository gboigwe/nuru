/**
 * Background Sync Service
 *
 * Manages background synchronization of offline transactions
 * Uses Background Sync API when available
 */

import { offlineQueueService, type QueuedTransaction } from "./OfflineQueueService";
import { pushNotificationService } from "./PushNotificationService";

class BackgroundSyncServiceClass {
  private syncInProgress = false;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize background sync
   */
  async initialize(): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    console.log("🔄 Initializing background sync service...");

    // Listen for online events
    window.addEventListener("online", () => this.handleOnline());

    // Set up periodic sync check (every 5 minutes when online)
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.syncQueue();
      }
    }, 5 * 60 * 1000);

    // Register background sync if supported
    if ("serviceWorker" in navigator && "sync" in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register("sync-offline-queue");
        console.log("✅ Background sync registered");
      } catch (error) {
        console.warn("Background sync registration failed:", error);
      }
    }

    // Sync immediately if online
    if (navigator.onLine) {
      this.syncQueue();
    }
  }

  /**
   * Cleanup on unmount
   */
  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Handle coming back online
   */
  private async handleOnline(): Promise<void> {
    console.log("🟢 Connection restored - syncing queue...");

    // Show notification
    try {
      if (pushNotificationService.isEnabled()) {
        await pushNotificationService.notifyConnectionRestored();
      }
    } catch (error) {
      console.error("Failed to show connection notification:", error);
    }

    // Sync queue
    await this.syncQueue();
  }

  /**
   * Sync offline transaction queue
   */
  async syncQueue(): Promise<{ processed: number; failed: number }> {
    if (this.syncInProgress) {
      console.log("⏳ Sync already in progress");
      return { processed: 0, failed: 0 };
    }

    if (!navigator.onLine) {
      console.log("📡 Offline - skipping sync");
      return { processed: 0, failed: 0 };
    }

    const pending = offlineQueueService.getPendingTransactions();

    if (pending.length === 0) {
      return { processed: 0, failed: 0 };
    }

    this.syncInProgress = true;

    try {
      console.log(`🔄 Syncing ${pending.length} queued transactions...`);

      const result = await offlineQueueService.processQueue(async (tx: QueuedTransaction) => {
        await this.processTransaction(tx);
      });

      console.log(`✅ Sync complete: ${result.processed} processed, ${result.failed} failed`);

      // Notify user of sync results
      if (result.processed > 0 && pushNotificationService.isEnabled()) {
        try {
          await pushNotificationService.notifyOfflineQueueSynced(result.processed);
        } catch (error) {
          console.error("Failed to show sync notification:", error);
        }
      }

      return result;
    } catch (error) {
      console.error("Queue sync failed:", error);
      return { processed: 0, failed: pending.length };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Process a single queued transaction
   */
  private async processTransaction(tx: QueuedTransaction): Promise<void> {
    console.log(`📤 Processing transaction: ${tx.id}`);

    try {
      switch (tx.type) {
        case "payment":
          await this.processPayment(tx);
          break;
        case "approval":
          await this.processApproval(tx);
          break;
        default:
          throw new Error(`Unknown transaction type: ${tx.type}`);
      }

      console.log(`✅ Transaction processed: ${tx.id}`);

      // Notify success
      if (pushNotificationService.isEnabled() && tx.data.recipient && tx.data.amount) {
        try {
          await pushNotificationService.notifyTransactionSent(
            tx.data.recipient,
            tx.data.amount,
          );
        } catch (error) {
          console.error("Failed to show transaction notification:", error);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`❌ Transaction failed: ${tx.id}`, errorMessage);

      // Notify failure
      if (pushNotificationService.isEnabled() && tx.data.recipient && tx.data.amount) {
        try {
          await pushNotificationService.notifyTransactionFailed(
            tx.data.recipient,
            tx.data.amount,
            errorMessage,
          );
        } catch (error) {
          console.error("Failed to show failure notification:", error);
        }
      }

      throw error; // Re-throw to mark as failed
    }
  }

  /**
   * Process a payment transaction
   */
  private async processPayment(tx: QueuedTransaction): Promise<void> {
    const { recipient, amount, currency, voiceCommand } = tx.data;

    if (!recipient || !amount) {
      throw new Error("Missing payment data");
    }

    // TODO: Integrate with actual payment service
    // For now, simulate API call
    const response = await fetch("/api/payments/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient,
        amount,
        currency: currency || "USDC",
        voiceCommand: voiceCommand || "",
        offlineQueueId: tx.id,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Payment failed");
    }

    const result = await response.json();
    console.log("Payment result:", result);
  }

  /**
   * Process an approval transaction
   */
  private async processApproval(tx: QueuedTransaction): Promise<void> {
    const { contractAddress, spender, amount } = tx.data;

    if (!contractAddress || !spender || !amount) {
      throw new Error("Missing approval data");
    }

    // TODO: Integrate with actual approval service
    // For now, simulate API call
    const response = await fetch("/api/approvals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contractAddress,
        spender,
        amount,
        offlineQueueId: tx.id,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Approval failed");
    }

    const result = await response.json();
    console.log("Approval result:", result);
  }

  /**
   * Manually trigger sync
   */
  async triggerSync(): Promise<void> {
    console.log("🔄 Manually triggering sync...");
    await this.syncQueue();
  }

  /**
   * Get sync status
   */
  isSyncing(): boolean {
    return this.syncInProgress;
  }
}

export const backgroundSyncService = new BackgroundSyncServiceClass();
