/**
 * Push Notification Service
 *
 * Manages push notifications for PWA
 * Handles subscription, permissions, and sending notifications
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  vibrate?: number[];
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
}

class PushNotificationServiceClass {
  private registration: ServiceWorkerRegistration | null = null;

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<boolean> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      console.warn("Service Worker not supported");
      return false;
    }

    if (!("Notification" in window)) {
      console.warn("Notifications not supported");
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      console.log("✅ Push notification service initialized");
      return true;
    } catch (error) {
      console.error("Failed to initialize push notifications:", error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      throw new Error("Notifications not supported");
    }

    const permission = await Notification.requestPermission();
    console.log(`🔔 Notification permission: ${permission}`);
    return permission;
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    if (!("Notification" in window)) {
      return false;
    }

    return Notification.permission === "granted";
  }

  /**
   * Get notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!("Notification" in window)) {
      return "denied";
    }

    return Notification.permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      throw new Error("Service Worker not registered");
    }

    try {
      // Check if already subscribed
      let subscription = await this.registration.pushManager.getSubscription();

      if (subscription) {
        console.log("✅ Already subscribed to push notifications");
        return subscription;
      }

      // Request permission if not granted
      if (Notification.permission !== "granted") {
        const permission = await this.requestPermission();
        if (permission !== "granted") {
          throw new Error("Notification permission denied");
        }
      }

      // Subscribe to push notifications
      subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.getVapidPublicKey(),
      });

      console.log("✅ Subscribed to push notifications");

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.log("✅ Unsubscribed from push notifications");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      return false;
    }
  }

  /**
   * Show local notification
   */
  async showNotification(options: NotificationOptions): Promise<void> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      throw new Error("Service Worker not registered");
    }

    if (Notification.permission !== "granted") {
      throw new Error("Notification permission not granted");
    }

    const notificationOptions: NotificationOptions = {
      icon: "/icon-192x192.png",
      badge: "/icon-72x72.png",
      vibrate: [200, 100, 200],
      ...options,
    };

    await this.registration.showNotification(options.title, notificationOptions);
  }

  /**
   * Transaction notification helpers
   */
  async notifyTransactionQueued(recipient: string, amount: string): Promise<void> {
    await this.showNotification({
      title: "Transaction Queued",
      body: `Payment to ${recipient} (${amount}) queued for offline sync`,
      tag: "transaction-queued",
      icon: "/icon-192x192.png",
      data: {
        type: "transaction-queued",
        recipient,
        amount,
      },
    });
  }

  async notifyTransactionSent(recipient: string, amount: string): Promise<void> {
    await this.showNotification({
      title: "Payment Sent",
      body: `Successfully sent ${amount} to ${recipient}`,
      tag: "transaction-sent",
      icon: "/icon-192x192.png",
      data: {
        type: "transaction-sent",
        recipient,
        amount,
      },
      actions: [
        {
          action: "view",
          title: "View Details",
        },
      ],
    });
  }

  async notifyTransactionFailed(recipient: string, amount: string, error: string): Promise<void> {
    await this.showNotification({
      title: "Payment Failed",
      body: `Failed to send ${amount} to ${recipient}: ${error}`,
      tag: "transaction-failed",
      icon: "/icon-192x192.png",
      requireInteraction: true,
      data: {
        type: "transaction-failed",
        recipient,
        amount,
        error,
      },
      actions: [
        {
          action: "retry",
          title: "Retry",
        },
        {
          action: "dismiss",
          title: "Dismiss",
        },
      ],
    });
  }

  async notifyOfflineQueueSynced(count: number): Promise<void> {
    await this.showNotification({
      title: "Transactions Synced",
      body: `Successfully synced ${count} offline transaction${count !== 1 ? "s" : ""}`,
      tag: "queue-synced",
      icon: "/icon-192x192.png",
      data: {
        type: "queue-synced",
        count,
      },
    });
  }

  async notifyConnectionRestored(): Promise<void> {
    await this.showNotification({
      title: "Back Online",
      body: "Connection restored. Syncing queued transactions...",
      tag: "connection-restored",
      icon: "/icon-192x192.png",
      data: {
        type: "connection-restored",
      },
    });
  }

  // Private methods

  /**
   * Get VAPID public key for push subscriptions
   * In production, this should come from environment variables
   */
  private getVapidPublicKey(): Uint8Array {
    // TODO: Replace with actual VAPID public key from environment
    // For now, return a placeholder
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

    if (!publicKey) {
      console.warn("VAPID public key not configured");
      // Return a dummy key for development
      return new Uint8Array([]);
    }

    // Convert base64 to Uint8Array
    const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
    const base64 = (publicKey + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      // TODO: Implement API endpoint to store subscription
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error("Failed to send subscription to server");
      }

      console.log("✅ Subscription sent to server");
    } catch (error) {
      console.error("Failed to send subscription to server:", error);
      // Don't throw - subscription is still valid locally
    }
  }
}

export const pushNotificationService = new PushNotificationServiceClass();
