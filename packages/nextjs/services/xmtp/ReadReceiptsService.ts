/**
 * Read Receipts Service
 *
 * Tracks message delivery and read status
 */

import type { Conversation } from "@xmtp/xmtp-js";
import { xmtpClient } from "./XMTPClient";

interface ReadReceipt {
  messageId: string;
  conversationTopic: string;
  readAt: number;
  deliveredAt: number;
}

class ReadReceiptsServiceClass {
  private readonly STORAGE_KEY = "nuru_read_receipts";
  private receipts: Map<string, ReadReceipt> = new Map();

  constructor() {
    this.loadReceipts();
  }

  /**
   * Load receipts from storage
   */
  private loadReceipts(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const receiptsArray: ReadReceipt[] = JSON.parse(stored);
        this.receipts = new Map(receiptsArray.map(r => [r.messageId, r]));
      }
    } catch (error) {
      console.error("Failed to load read receipts:", error);
    }
  }

  /**
   * Save receipts to storage
   */
  private saveReceipts(): void {
    if (typeof window === "undefined") return;

    try {
      const receiptsArray = Array.from(this.receipts.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(receiptsArray));
    } catch (error) {
      console.error("Failed to save read receipts:", error);
    }
  }

  /**
   * Mark message as delivered
   */
  markAsDelivered(messageId: string, conversationTopic: string): void {
    const existing = this.receipts.get(messageId);

    this.receipts.set(messageId, {
      messageId,
      conversationTopic,
      deliveredAt: existing?.deliveredAt || Date.now(),
      readAt: existing?.readAt || 0,
    });

    this.saveReceipts();
  }

  /**
   * Mark message as read
   */
  markAsRead(messageId: string, conversationTopic: string): void {
    const existing = this.receipts.get(messageId);

    this.receipts.set(messageId, {
      messageId,
      conversationTopic,
      deliveredAt: existing?.deliveredAt || Date.now(),
      readAt: Date.now(),
    });

    this.saveReceipts();
  }

  /**
   * Mark all messages in conversation as read
   */
  async markConversationAsRead(conversation: Conversation): Promise<void> {
    try {
      const messages = await xmtpClient.getMessages(conversation);

      messages.forEach((msg) => {
        this.markAsRead(msg.id, conversation.topic);
      });

      console.log(`✅ Marked ${messages.length} messages as read`);
    } catch (error) {
      console.error("Failed to mark conversation as read:", error);
    }
  }

  /**
   * Check if message was delivered
   */
  isDelivered(messageId: string): boolean {
    const receipt = this.receipts.get(messageId);
    return receipt ? receipt.deliveredAt > 0 : false;
  }

  /**
   * Check if message was read
   */
  isRead(messageId: string): boolean {
    const receipt = this.receipts.get(messageId);
    return receipt ? receipt.readAt > 0 : false;
  }

  /**
   * Get unread count for conversation
   */
  async getUnreadCount(conversation: Conversation): Promise<number> {
    try {
      const messages = await xmtpClient.getMessages(conversation);
      const currentAddress = xmtpClient.getAddress();

      // Only count messages from other party
      const unreadMessages = messages.filter((msg) => {
        const isFromOther = msg.senderAddress.toLowerCase() !== currentAddress?.toLowerCase();
        const isUnread = !this.isRead(msg.id);
        return isFromOther && isUnread;
      });

      return unreadMessages.length;
    } catch (error) {
      console.error("Failed to get unread count:", error);
      return 0;
    }
  }

  /**
   * Get total unread count across all conversations
   */
  async getTotalUnreadCount(): Promise<number> {
    try {
      const conversations = await xmtpClient.getConversations();

      const counts = await Promise.all(
        conversations.map((conv) => this.getUnreadCount(conv))
      );

      return counts.reduce((total, count) => total + count, 0);
    } catch (error) {
      console.error("Failed to get total unread count:", error);
      return 0;
    }
  }

  /**
   * Get read receipt for message
   */
  getReceipt(messageId: string): ReadReceipt | undefined {
    return this.receipts.get(messageId);
  }

  /**
   * Clear old receipts (older than 30 days)
   */
  cleanupOldReceipts(): void {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    this.receipts.forEach((receipt, messageId) => {
      if (receipt.readAt > 0 && receipt.readAt < thirtyDaysAgo) {
        this.receipts.delete(messageId);
      }
    });

    this.saveReceipts();
    console.log("🗑️ Cleaned up old read receipts");
  }
}

export const readReceiptsService = new ReadReceiptsServiceClass();
