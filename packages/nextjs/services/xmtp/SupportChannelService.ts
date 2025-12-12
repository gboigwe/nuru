/**
 * Support Channel Service
 *
 * Manages dedicated support conversations
 */

import type { Conversation } from "@xmtp/xmtp-js";
import { xmtpClient } from "./XMTPClient";
import { MessageTemplates } from "./MessageTemplates";

// TODO: Replace with actual support wallet address
const SUPPORT_WALLET_ADDRESS = process.env.NEXT_PUBLIC_SUPPORT_WALLET_ADDRESS || "0x0000000000000000000000000000000000000000";

class SupportChannelServiceClass {
  private supportConversation: Conversation | null = null;

  /**
   * Get or create support conversation
   */
  async getSupportConversation(): Promise<Conversation> {
    if (this.supportConversation) {
      return this.supportConversation;
    }

    try {
      // Check if conversation already exists
      let conversation = await xmtpClient.getConversation(SUPPORT_WALLET_ADDRESS);

      if (!conversation) {
        // Create new support conversation
        conversation = await xmtpClient.startConversation(SUPPORT_WALLET_ADDRESS);

        // Send automatic welcome message
        await conversation.send(MessageTemplates.supportRequest());
      }

      this.supportConversation = conversation;
      return conversation;
    } catch (error) {
      console.error("Failed to get support conversation:", error);
      throw error;
    }
  }

  /**
   * Send message to support
   */
  async sendToSupport(message: string): Promise<void> {
    try {
      const conversation = await this.getSupportConversation();
      await conversation.send(message);

      console.log("✅ Message sent to support");
    } catch (error) {
      console.error("Failed to send message to support:", error);
      throw error;
    }
  }

  /**
   * Request support with transaction hash
   */
  async requestSupportForTransaction(txHash: string, issue: string): Promise<void> {
    const message = `🆘 Support Request

Transaction: ${txHash}
Issue: ${issue}

Please investigate and assist.`;

    await this.sendToSupport(message);
  }

  /**
   * Report payment issue
   */
  async reportPaymentIssue(data: {
    txHash?: string;
    recipient: string;
    amount: string;
    currency: string;
    issue: string;
  }): Promise<void> {
    const { txHash, recipient, amount, currency, issue } = data;

    const message = `❌ Payment Issue Report

${txHash ? `Transaction: ${txHash}` : "Transaction pending"}
Recipient: ${recipient}
Amount: ${amount} ${currency}
Issue: ${issue}

Please review and assist with resolution.`;

    await this.sendToSupport(message);
  }

  /**
   * Request account assistance
   */
  async requestAccountAssistance(issue: string): Promise<void> {
    const message = `👤 Account Assistance Request

Issue: ${issue}

Please help me with my account.`;

    await this.sendToSupport(message);
  }

  /**
   * Submit feedback
   */
  async submitFeedback(feedback: string, rating?: number): Promise<void> {
    const message = `💬 User Feedback

${rating ? `Rating: ${"⭐".repeat(rating)} (${rating}/5)` : ""}
Feedback: ${feedback}

Thank you for helping us improve Nuru!`;

    await this.sendToSupport(message);
  }

  /**
   * Report security concern
   */
  async reportSecurityConcern(concern: string): Promise<void> {
    const message = `🔒 Security Concern

Concern: ${concern}

URGENT: Please investigate this security issue immediately.`;

    await this.sendToSupport(message);
  }

  /**
   * Request feature
   */
  async requestFeature(feature: string): Promise<void> {
    const message = `💡 Feature Request

Requested Feature: ${feature}

This would help improve my experience with Nuru.`;

    await this.sendToSupport(message);
  }

  /**
   * Get support conversation status
   */
  async getSupportStatus(): Promise<{
    hasActiveConversation: boolean;
    messageCount: number;
    lastMessageTime?: Date;
  }> {
    try {
      const conversation = this.supportConversation || await xmtpClient.getConversation(SUPPORT_WALLET_ADDRESS);

      if (!conversation) {
        return {
          hasActiveConversation: false,
          messageCount: 0,
        };
      }

      const messages = await xmtpClient.getMessages(conversation);

      return {
        hasActiveConversation: true,
        messageCount: messages.length,
        lastMessageTime: messages[messages.length - 1]?.sent,
      };
    } catch (error) {
      console.error("Failed to get support status:", error);
      return {
        hasActiveConversation: false,
        messageCount: 0,
      };
    }
  }

  /**
   * Check if support is available (support wallet is on XMTP)
   */
  async isSupportAvailable(): Promise<boolean> {
    try {
      return await xmtpClient.canMessage(SUPPORT_WALLET_ADDRESS);
    } catch (error) {
      console.error("Failed to check support availability:", error);
      return false;
    }
  }
}

export const supportChannelService = new SupportChannelServiceClass();
