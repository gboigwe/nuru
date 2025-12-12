import { XMTPService } from './XMTPService';
import { Conversation, DecodedMessage } from '@xmtp/xmtp-js';

export class ReadReceiptService {
  private static instance: ReadReceiptService;
  private conversationMap: Map<string, Conversation> = new Map();

  private constructor() {}

  public static getInstance(): ReadReceiptService {
    if (!ReadReceiptService.instance) {
      ReadReceiptService.instance = new ReadReceiptService();
    }
    return ReadReceiptService.instance;
  }

  public async markMessageAsRead(
    conversationTopic: string,
    messageId: string
  ): Promise<void> {
    try {
      const xmtpService = XMTPService.getInstance();
      const client = xmtpService.getClient();

      if (!client) {
        throw new Error('XMTP client not initialized');
      }

      // Get or create conversation
      let conversation = this.conversationMap.get(conversationTopic);
      if (!conversation) {
        conversation = await client.conversations.newConversation(conversationTopic);
        this.conversationMap.set(conversationTopic, conversation);
      }

      // Send read receipt
      await conversation.send({
        type: 'read-receipt',
        content: {
          messageId,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`Message ${messageId} marked as read`);
    } catch (error) {
      console.error('Failed to mark message as read:', error);
      throw error;
    }
  }

  public async setupMessageStream(
    onMessageReceived: (message: DecodedMessage) => void,
    onReadReceipt: (messageId: string, reader: string) => void
  ): Promise<void> {
    try {
      const xmtpService = XMTPService.getInstance();
      const client = xmtpService.getClient();

      if (!client) {
        throw new Error('XMTP client not initialized');
      }

      // Stream all conversations
      const conversationStream = await client.conversations.stream();

      for await (const conversation of conversationStream) {
        // Store conversation for later use
        this.conversationMap.set(conversation.peerAddress, conversation);

        // Stream messages for this conversation
        const messageStream = await conversation.streamMessages();

        for await (const message of messageStream) {
          // Handle regular messages
          onMessageReceived(message);

          // Check for read receipts
          if (message.contentType === 'read-receipt') {
            const readReceipt = message.content as { messageId: string };
            onReadReceipt(readReceipt.messageId, message.senderAddress);
          }
        }
      }
    } catch (error) {
      console.error('Error setting up message stream:', error);
      throw error;
    }
  }

  public async getUnreadMessages(conversationTopic: string): Promise<DecodedMessage[]> {
    try {
      const xmtpService = XMTPService.getInstance();
      const client = xmtpService.getClient();

      if (!client) {
        throw new Error('XMTP client not initialized');
      }

      const conversation = await client.conversations.newConversation(conversationTopic);
      const messages = await conversation.messages();

      // Filter out read receipts and other system messages
      return messages.filter(message =>
        message.contentType !== 'read-receipt' &&
        message.contentType !== 'system'
      );
    } catch (error) {
      console.error('Failed to get unread messages:', error);
      throw error;
    }
  }

  public async clearConversation(conversationTopic: string): Promise<void> {
    try {
      this.conversationMap.delete(conversationTopic);
      console.log(`Conversation ${conversationTopic} cleared from cache`);
    } catch (error) {
      console.error('Failed to clear conversation:', error);
      throw error;
    }
  }
}