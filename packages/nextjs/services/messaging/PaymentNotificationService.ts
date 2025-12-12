import { XMTPService } from './XMTPService';
import { Conversation } from '@xmtp/xmtp-js';

export interface Payment {
  amount: string;
  currency: string;
  sender: string;
  txHash: string;
  recipient: string;
  message?: string;
}

export class PaymentNotificationService {
  private static instance: PaymentNotificationService;

  private constructor() {}

  public static getInstance(): PaymentNotificationService {
    if (!PaymentNotificationService.instance) {
      PaymentNotificationService.instance = new PaymentNotificationService();
    }
    return PaymentNotificationService.instance;
  }

  public async sendPaymentNotification(
    recipientAddress: string,
    payment: Payment
  ): Promise<void> {
    try {
      const xmtpService = XMTPService.getInstance();
      const client = xmtpService.getClient();

      if (!client) {
        throw new Error('XMTP client not initialized');
      }

      // Check if recipient can receive XMTP messages
      const canMessage = await client.canMessage(recipientAddress);
      if (!canMessage) {
        console.log(`Recipient ${recipientAddress} cannot receive XMTP messages`);
        return;
      }

      // Create or get existing conversation
      const conversation = await client.conversations.newConversation(recipientAddress);

      // Send payment notification message
      await conversation.send({
        type: 'payment-notification',
        content: {
          amount: payment.amount,
          currency: payment.currency,
          sender: payment.sender,
          txHash: payment.txHash,
          message: payment.message || 'You received a payment via Nuru! 🎉',
          timestamp: new Date().toISOString()
        }
      });

      console.log(`Payment notification sent to ${recipientAddress}`);
    } catch (error) {
      console.error('Failed to send payment notification:', error);
      throw error;
    }
  }

  public async sendDeliveryConfirmation(
    recipientAddress: string,
    payment: Payment
  ): Promise<void> {
    try {
      const xmtpService = XMTPService.getInstance();
      const client = xmtpService.getClient();

      if (!client) {
        throw new Error('XMTP client not initialized');
      }

      const conversation = await client.conversations.newConversation(recipientAddress);

      await conversation.send({
        type: 'delivery-confirmation',
        content: {
          txHash: payment.txHash,
          message: `Payment of ${payment.amount} ${payment.currency} has been successfully delivered! ✅`,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`Delivery confirmation sent to ${recipientAddress}`);
    } catch (error) {
      console.error('Failed to send delivery confirmation:', error);
      throw error;
    }
  }

  public async sendSupportMessage(
    supportAddress: string,
    userAddress: string,
    issueDescription: string
  ): Promise<void> {
    try {
      const xmtpService = XMTPService.getInstance();
      const client = xmtpService.getClient();

      if (!client) {
        throw new Error('XMTP client not initialized');
      }

      const conversation = await client.conversations.newConversation(supportAddress);

      await conversation.send({
        type: 'support-request',
        content: {
          userAddress: userAddress,
          issue: issueDescription,
          timestamp: new Date().toISOString(),
          message: `🆘 Support Request: ${issueDescription}`
        }
      });

      console.log(`Support message sent to ${supportAddress}`);
    } catch (error) {
      console.error('Failed to send support message:', error);
      throw error;
    }
  }
}