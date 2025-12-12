import { XMTPService } from './XMTPService';
import { ReadReceiptService } from './ReadReceiptService';
import { DecodedMessage } from '@xmtp/xmtp-js';

export class PushNotificationService {
  private static instance: PushNotificationService;
  private notificationCallback: ((message: DecodedMessage) => void) | null = null;

  private constructor() {}

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  public async startListeningForMessages(
    callback: (message: DecodedMessage) => void
  ): Promise<void> {
    this.notificationCallback = callback;

    try {
      const xmtpService = XMTPService.getInstance();
      const client = xmtpService.getClient();

      if (!client) {
        throw new Error('XMTP client not initialized');
      }

      // Stream all conversations
      const conversationStream = await client.conversations.stream();

      for await (const conversation of conversationStream) {
        // Stream messages for this conversation
        const messageStream = await conversation.streamMessages();

        for await (const message of messageStream) {
          // Skip read receipts and system messages
          if (message.contentType === 'read-receipt' || message.contentType === 'system') {
            continue;
          }

          // Notify about new message
          if (this.notificationCallback) {
            this.notificationCallback(message);
          }

          // Show browser notification if permitted
          if (this.hasNotificationPermission()) {
            this.showBrowserNotification(message);
          } else {
            this.requestNotificationPermission();
          }
        }
      }
    } catch (error) {
      console.error('Error setting up message stream:', error);
      throw error;
    }
  }

  public stopListening() {
    this.notificationCallback = null;
  }

  private hasNotificationPermission(): boolean {
    if (!('Notification' in window)) {
      return false;
    }
    return Notification.permission === 'granted';
  }

  private async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  private showBrowserNotification(message: DecodedMessage) {
    if (!('Notification' in window) || !this.hasNotificationPermission()) {
      return;
    }

    const notification = new Notification('New Nuru Message', {
      body: this.getNotificationBody(message),
      icon: '/favicon.ico',
      data: {
        messageId: message.id,
        sender: message.senderAddress,
        conversationTopic: message.conversation.topic
      }
    });

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      // You could add logic here to open the chat window
    };
  }

  private getNotificationBody(message: DecodedMessage): string {
    try {
      if (message.contentType === 'payment-notification') {
        const content = message.content as {
          amount: string;
          currency: string;
          sender: string;
          message: string;
        };
        return `${content.sender}: ${content.message} (${content.amount} ${content.currency})`;
      } else if (message.contentType === 'delivery-confirmation') {
        const content = message.content as {
          message: string;
        };
        return content.message;
      } else if (message.contentType === 'support-request') {
        const content = message.content as {
          message: string;
        };
        return content.message;
      } else {
        return typeof message.content === 'string'
          ? message.content
          : 'You have a new message';
      }
    } catch (error) {
      console.error('Error parsing message content:', error);
      return 'You have a new message';
    }
  }

  public async checkForMissedNotifications(): Promise<number> {
    try {
      const xmtpService = XMTPService.getInstance();
      const client = xmtpService.getClient();

      if (!client) {
        throw new Error('XMTP client not initialized');
      }

      const readReceiptService = ReadReceiptService.getInstance();
      const conversationStream = await client.conversations.stream();
      let unreadCount = 0;

      for await (const conversation of conversationStream) {
        const messages = await conversation.messages();
        const unreadMessages = messages.filter(message =>
          message.contentType !== 'read-receipt' &&
          message.contentType !== 'system' &&
          !message.isSentByMe
        );

        unreadCount += unreadMessages.length;
      }

      return unreadCount;
    } catch (error) {
      console.error('Error checking for missed notifications:', error);
      return 0;
    }
  }

  public async showWelcomeNotification() {
    if (this.hasNotificationPermission()) {
      new Notification('Nuru Messaging Enabled', {
        body: 'You can now receive payment notifications and support messages!',
        icon: '/favicon.ico'
      });
    }
  }
}