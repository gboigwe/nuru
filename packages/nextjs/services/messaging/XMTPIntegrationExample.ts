import { PaymentNotificationService, Payment } from './PaymentNotificationService';
import { XMTPService } from './XMTPService';
import { PushNotificationService } from './PushNotificationService';
import { ReadReceiptService } from './ReadReceiptService';
import { Signer } from 'ethers';

/**
 * Example of how to integrate XMTP messaging with Nuru payment flows
 */
export class XMTPIntegrationExample {
  private paymentNotificationService: PaymentNotificationService;
  private pushNotificationService: PushNotificationService;
  private readReceiptService: ReadReceiptService;

  constructor() {
    this.paymentNotificationService = PaymentNotificationService.getInstance();
    this.pushNotificationService = PushNotificationService.getInstance();
    this.readReceiptService = ReadReceiptService.getInstance();
  }

  /**
   * Initialize XMTP client with wallet signer
   * @param signer Wallet signer from wagmi/ethers
   */
  public async initializeXMTP(signer: Signer): Promise<void> {
    try {
      const xmtpService = XMTPService.getInstance();
      await xmtpService.initialize(signer);
      console.log('XMTP client initialized successfully');

      // Start listening for incoming messages
      await this.startMessageListening();

      // Show welcome notification
      await this.pushNotificationService.showWelcomeNotification();
    } catch (error) {
      console.error('Failed to initialize XMTP:', error);
      throw error;
    }
  }

  /**
   * Send payment notification after successful transaction
   * @param recipientAddress Recipient wallet address
   * @param payment Payment details
   */
  public async sendPaymentNotification(
    recipientAddress: string,
    payment: Payment
  ): Promise<void> {
    try {
      // Send payment notification via XMTP
      await this.paymentNotificationService.sendPaymentNotification(recipientAddress, payment);

      // You could also send a delivery confirmation after blockchain confirmation
      // await this.paymentNotificationService.sendDeliveryConfirmation(recipientAddress, payment);
    } catch (error) {
      console.error('Failed to send payment notification:', error);
      // Payment notification failed, but payment itself should still proceed
    }
  }

  /**
   * Start listening for incoming XMTP messages
   */
  private async startMessageListening(): Promise<void> {
    try {
      // Set up push notifications for new messages
      await this.pushNotificationService.startListeningForMessages(async (message) => {
        console.log('New XMTP message received:', message);

        // Here you could:
        // 1. Show browser notification
        // 2. Update UI with new message
        // 3. Play sound notification
        // 4. Mark message as read after user views it

        // Example: Auto-mark as read after 5 seconds (simulating user reading)
        setTimeout(() => {
          this.markMessageAsRead(message.conversation.topic, message.id);
        }, 5000);
      });

      // Set up read receipts
      await this.readReceiptService.setupMessageStream(
        (message) => {
          console.log('Message received (read receipt setup):', message.id);
        },
        (messageId, reader) => {
          console.log(`Message ${messageId} marked as read by ${reader}`);
          // Update UI to show read status
        }
      );
    } catch (error) {
      console.error('Failed to start message listening:', error);
    }
  }

  /**
   * Mark a message as read
   * @param conversationTopic Conversation topic/ID
   * @param messageId Message ID to mark as read
   */
  public async markMessageAsRead(
    conversationTopic: string,
    messageId: string
  ): Promise<void> {
    try {
      await this.readReceiptService.markMessageAsRead(conversationTopic, messageId);
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }

  /**
   * Send support request to Nuru support team
   * @param userAddress User's wallet address
   * @param issueDescription Description of the issue
   */
  public async sendSupportRequest(
    userAddress: string,
    issueDescription: string
  ): Promise<void> {
    try {
      const supportAddress = 'support.nuru.eth'; // Nuru support XMTP address
      await this.paymentNotificationService.sendSupportMessage(
        supportAddress,
        userAddress,
        issueDescription
      );
    } catch (error) {
      console.error('Failed to send support request:', error);
      throw error;
    }
  }

  /**
   * Check for unread messages
   * @returns Number of unread messages
   */
  public async checkUnreadMessages(): Promise<number> {
    try {
      return await this.pushNotificationService.checkForMissedNotifications();
    } catch (error) {
      console.error('Failed to check unread messages:', error);
      return 0;
    }
  }

  /**
   * Clean up XMTP resources
   */
  public async cleanup(): Promise<void> {
    try {
      this.pushNotificationService.stopListening();
      const xmtpService = XMTPService.getInstance();
      await xmtpService.disconnect();
    } catch (error) {
      console.error('Failed to cleanup XMTP resources:', error);
    }
  }
}

/**
 * Example usage in a payment flow:
 *
 * // 1. Initialize XMTP when user connects wallet
 * const xmtpIntegration = new XMTPIntegrationExample();
 * await xmtpIntegration.initializeXMTP(signer);
 *
 * // 2. After successful payment, send notification
 * const payment: Payment = {
 *   amount: '100',
 *   currency: 'USDC',
 *   sender: userAddress,
 *   txHash: transactionHash,
 *   recipient: recipientAddress,
 *   message: 'Thanks for using Nuru!'
 * };
 * await xmtpIntegration.sendPaymentNotification(recipientAddress, payment);
 *
 * // 3. User can send support requests
 * await xmtpIntegration.sendSupportRequest(userAddress, 'Payment stuck in processing');
 *
 * // 4. Check for unread messages periodically
 * const unreadCount = await xmtpIntegration.checkUnreadMessages();
 * if (unreadCount > 0) {
 *   showNotificationBadge(unreadCount);
 * }
 */