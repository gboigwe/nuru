/**
 * XMTP Client Service
 *
 * Manages XMTP client initialization and messaging
 */

import { Client, Conversation } from "@xmtp/xmtp-js";
import type { Signer } from "ethers";

export interface XMTPMessage {
  id: string;
  content: string;
  senderAddress: string;
  sent: Date;
  conversationTopic: string;
}

class XMTPClientService {
  private client: Client | null = null;
  private isInitializing = false;

  /**
   * Initialize XMTP client with signer
   */
  async initialize(signer: Signer): Promise<Client> {
    if (this.client) {
      return this.client;
    }

    if (this.isInitializing) {
      // Wait for initialization to complete
      await this.waitForInitialization();
      if (this.client) {
        return this.client;
      }
    }

    this.isInitializing = true;

    try {
      console.log("🚀 Initializing XMTP client...");

      // Create XMTP client with production environment
      this.client = await Client.create(signer, {
        env: "production",
      });

      console.log("✅ XMTP client initialized:", this.client.address);

      return this.client;
    } catch (error) {
      console.error("Failed to initialize XMTP client:", error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Wait for initialization to complete
   */
  private async waitForInitialization(maxWait = 30000): Promise<void> {
    const startTime = Date.now();

    while (this.isInitializing && Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.isInitializing) {
      throw new Error("XMTP initialization timeout");
    }
  }

  /**
   * Get current client
   */
  getClient(): Client | null {
    return this.client;
  }

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean {
    return this.client !== null;
  }

  /**
   * Get user's address
   */
  getAddress(): string | null {
    return this.client?.address || null;
  }

  /**
   * Check if address can message (has XMTP identity)
   */
  async canMessage(address: string): Promise<boolean> {
    if (!this.client) {
      throw new Error("XMTP client not initialized");
    }

    try {
      const canMessage = await this.client.canMessage(address);
      return canMessage;
    } catch (error) {
      console.error("Failed to check if address can message:", error);
      return false;
    }
  }

  /**
   * Get all conversations
   */
  async getConversations(): Promise<Conversation[]> {
    if (!this.client) {
      throw new Error("XMTP client not initialized");
    }

    try {
      const conversations = await this.client.conversations.list();
      return conversations;
    } catch (error) {
      console.error("Failed to get conversations:", error);
      return [];
    }
  }

  /**
   * Start new conversation with address
   */
  async startConversation(peerAddress: string): Promise<Conversation> {
    if (!this.client) {
      throw new Error("XMTP client not initialized");
    }

    try {
      // Check if peer can receive messages
      const canMessage = await this.canMessage(peerAddress);
      if (!canMessage) {
        throw new Error(`Address ${peerAddress} is not on XMTP network`);
      }

      // Create new conversation
      const conversation = await this.client.conversations.newConversation(peerAddress);
      console.log("✅ Started conversation with:", peerAddress);

      return conversation;
    } catch (error) {
      console.error("Failed to start conversation:", error);
      throw error;
    }
  }

  /**
   * Get existing conversation with address
   */
  async getConversation(peerAddress: string): Promise<Conversation | null> {
    if (!this.client) {
      throw new Error("XMTP client not initialized");
    }

    try {
      const conversations = await this.getConversations();
      const conversation = conversations.find(
        conv => conv.peerAddress.toLowerCase() === peerAddress.toLowerCase()
      );

      return conversation || null;
    } catch (error) {
      console.error("Failed to get conversation:", error);
      return null;
    }
  }

  /**
   * Send message to address
   */
  async sendMessage(peerAddress: string, message: string): Promise<void> {
    if (!this.client) {
      throw new Error("XMTP client not initialized");
    }

    try {
      // Get or create conversation
      let conversation = await this.getConversation(peerAddress);

      if (!conversation) {
        conversation = await this.startConversation(peerAddress);
      }

      // Send message
      await conversation.send(message);
      console.log("✅ Message sent to:", peerAddress);
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  }

  /**
   * Get messages from conversation
   */
  async getMessages(conversation: Conversation): Promise<XMTPMessage[]> {
    try {
      const messages = await conversation.messages();

      return messages.map(msg => ({
        id: msg.id,
        content: msg.content as string,
        senderAddress: msg.senderAddress,
        sent: msg.sent,
        conversationTopic: conversation.topic,
      }));
    } catch (error) {
      console.error("Failed to get messages:", error);
      return [];
    }
  }

  /**
   * Stream new messages from conversation
   */
  async streamMessages(
    conversation: Conversation,
    onMessage: (message: XMTPMessage) => void
  ): Promise<() => void> {
    try {
      const stream = await conversation.streamMessages();

      const processStream = async () => {
        for await (const msg of stream) {
          onMessage({
            id: msg.id,
            content: msg.content as string,
            senderAddress: msg.senderAddress,
            sent: msg.sent,
            conversationTopic: conversation.topic,
          });
        }
      };

      processStream();

      // Return cleanup function
      return () => {
        // XMTP streams can't be explicitly closed, but we can stop processing
        console.log("Stopped streaming messages");
      };
    } catch (error) {
      console.error("Failed to stream messages:", error);
      return () => {};
    }
  }

  /**
   * Stream all conversations
   */
  async streamConversations(
    onConversation: (conversation: Conversation) => void
  ): Promise<() => void> {
    if (!this.client) {
      throw new Error("XMTP client not initialized");
    }

    try {
      const stream = await this.client.conversations.stream();

      const processStream = async () => {
        for await (const conversation of stream) {
          onConversation(conversation);
        }
      };

      processStream();

      // Return cleanup function
      return () => {
        console.log("Stopped streaming conversations");
      };
    } catch (error) {
      console.error("Failed to stream conversations:", error);
      return () => {};
    }
  }

  /**
   * Disconnect client
   */
  disconnect(): void {
    this.client = null;
    console.log("🔌 XMTP client disconnected");
  }
}

export const xmtpClient = new XMTPClientService();
