/**
 * Payment Notification Service
 *
 * Sends payment notifications via XMTP
 */

import { xmtpClient } from "./XMTPClient";
import { MessageTemplates, type PaymentMessageData, type DeliveryConfirmationData } from "./MessageTemplates";

class PaymentNotificationServiceClass {
  /**
   * Notify payment sent
   */
  async notifyPaymentSent(recipientAddress: string, data: PaymentMessageData): Promise<void> {
    try {
      // Check if recipient can receive messages
      const canMessage = await xmtpClient.canMessage(recipientAddress);
      if (!canMessage) {
        console.warn(`Recipient ${recipientAddress} is not on XMTP network`);
        return;
      }

      const message = MessageTemplates.paymentSent(data);
      await xmtpClient.sendMessage(recipientAddress, message);

      console.log("✅ Payment sent notification delivered to:", recipientAddress);
    } catch (error) {
      console.error("Failed to send payment notification:", error);
      // Don't throw - notification is best effort
    }
  }

  /**
   * Notify payment received
   */
  async notifyPaymentReceived(recipientAddress: string, data: PaymentMessageData): Promise<void> {
    try {
      const canMessage = await xmtpClient.canMessage(recipientAddress);
      if (!canMessage) {
        console.warn(`Sender ${recipientAddress} is not on XMTP network`);
        return;
      }

      const message = MessageTemplates.paymentReceived(data);
      await xmtpClient.sendMessage(recipientAddress, message);

      console.log("✅ Payment received notification delivered to:", recipientAddress);
    } catch (error) {
      console.error("Failed to send payment received notification:", error);
    }
  }

  /**
   * Notify payment confirmed
   */
  async notifyPaymentConfirmed(address: string, data: DeliveryConfirmationData): Promise<void> {
    try {
      const canMessage = await xmtpClient.canMessage(address);
      if (!canMessage) {
        return;
      }

      const message = MessageTemplates.paymentConfirmed(data);
      await xmtpClient.sendMessage(address, message);

      console.log("✅ Payment confirmation delivered to:", address);
    } catch (error) {
      console.error("Failed to send payment confirmation:", error);
    }
  }

  /**
   * Notify payment pending
   */
  async notifyPaymentPending(address: string, data: PaymentMessageData): Promise<void> {
    try {
      const canMessage = await xmtpClient.canMessage(address);
      if (!canMessage) {
        return;
      }

      const message = MessageTemplates.paymentPending(data);
      await xmtpClient.sendMessage(address, message);

      console.log("✅ Payment pending notification delivered to:", address);
    } catch (error) {
      console.error("Failed to send payment pending notification:", error);
    }
  }

  /**
   * Notify payment failed
   */
  async notifyPaymentFailed(
    address: string,
    data: PaymentMessageData & { reason?: string }
  ): Promise<void> {
    try {
      const canMessage = await xmtpClient.canMessage(address);
      if (!canMessage) {
        return;
      }

      const message = MessageTemplates.paymentFailed(data);
      await xmtpClient.sendMessage(address, message);

      console.log("✅ Payment failed notification delivered to:", address);
    } catch (error) {
      console.error("Failed to send payment failed notification:", error);
    }
  }

  /**
   * Send welcome message to new user
   */
  async sendWelcomeMessage(address: string): Promise<void> {
    try {
      const canMessage = await xmtpClient.canMessage(address);
      if (!canMessage) {
        return;
      }

      const message = MessageTemplates.welcome(address);
      await xmtpClient.sendMessage(address, message);

      console.log("✅ Welcome message sent to:", address);
    } catch (error) {
      console.error("Failed to send welcome message:", error);
    }
  }

  /**
   * Send budget alert
   */
  async sendBudgetAlert(
    address: string,
    data: { spent: string; budget: string; percentage: number }
  ): Promise<void> {
    try {
      const canMessage = await xmtpClient.canMessage(address);
      if (!canMessage) {
        return;
      }

      const message = MessageTemplates.budgetAlert(data);
      await xmtpClient.sendMessage(address, message);

      console.log("✅ Budget alert sent to:", address);
    } catch (error) {
      console.error("Failed to send budget alert:", error);
    }
  }

  /**
   * Send gas optimization tip
   */
  async sendGasTip(address: string, data: { currentGas: string; optimalTime: string }): Promise<void> {
    try {
      const canMessage = await xmtpClient.canMessage(address);
      if (!canMessage) {
        return;
      }

      const message = MessageTemplates.gasTip(data);
      await xmtpClient.sendMessage(address, message);

      console.log("✅ Gas tip sent to:", address);
    } catch (error) {
      console.error("Failed to send gas tip:", error);
    }
  }

  /**
   * Send security alert
   */
  async sendSecurityAlert(
    address: string,
    data: { type: string; action: string; timestamp: string }
  ): Promise<void> {
    try {
      const canMessage = await xmtpClient.canMessage(address);
      if (!canMessage) {
        return;
      }

      const message = MessageTemplates.securityAlert(data);
      await xmtpClient.sendMessage(address, message);

      console.log("✅ Security alert sent to:", address);
    } catch (error) {
      console.error("Failed to send security alert:", error);
    }
  }

  /**
   * Send transaction reminder
   */
  async sendTransactionReminder(
    address: string,
    data: {
      amount: string;
      currency: string;
      dueDate: string;
      recipientAddress: string;
    }
  ): Promise<void> {
    try {
      const canMessage = await xmtpClient.canMessage(address);
      if (!canMessage) {
        return;
      }

      const message = MessageTemplates.transactionReminder(data);
      await xmtpClient.sendMessage(address, message);

      console.log("✅ Transaction reminder sent to:", address);
    } catch (error) {
      console.error("Failed to send transaction reminder:", error);
    }
  }

  /**
   * Send savings milestone notification
   */
  async sendSavingsMilestone(
    address: string,
    data: { saved: string; target: string; percentage: number }
  ): Promise<void> {
    try {
      const canMessage = await xmtpClient.canMessage(address);
      if (!canMessage) {
        return;
      }

      const message = MessageTemplates.savingsMilestone(data);
      await xmtpClient.sendMessage(address, message);

      console.log("✅ Savings milestone sent to:", address);
    } catch (error) {
      console.error("Failed to send savings milestone:", error);
    }
  }
}

export const paymentNotificationService = new PaymentNotificationServiceClass();
