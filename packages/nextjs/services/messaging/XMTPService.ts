import { Client } from '@xmtp/xmtp-js';
import { Wallet } from 'ethers';
import { Signer } from '@wagmi/core';

export class XMTPService {
  private static instance: XMTPService;
  private client: Client | null = null;
  private isInitializing = false;

  private constructor() {}

  public static getInstance(): XMTPService {
    if (!XMTPService.instance) {
      XMTPService.instance = new XMTPService();
    }
    return XMTPService.instance;
  }

  public async initialize(signer: Signer): Promise<Client> {
    if (this.client) {
      return this.client;
    }

    if (this.isInitializing) {
      // Wait for existing initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.client!;
    }

    this.isInitializing = true;

    try {
      // Convert wagmi signer to ethers Wallet for XMTP compatibility
      const wallet = new Wallet(await signer.getAddress());
      this.client = await Client.create(wallet, { env: 'production' });
      console.log('XMTP client initialized successfully');
      return this.client;
    } catch (error) {
      console.error('Failed to initialize XMTP client:', error);
      this.isInitializing = false;
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  public getClient(): Client | null {
    return this.client;
  }

  public async isClientInitialized(): Promise<boolean> {
    return this.client !== null;
  }

  public async canMessage(address: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('XMTP client not initialized');
    }
    return this.client.canMessage(address);
  }

  public async disconnect() {
    if (this.client) {
      try {
        await this.client.close();
        this.client = null;
        console.log('XMTP client disconnected');
      } catch (error) {
        console.error('Error disconnecting XMTP client:', error);
      }
    }
  }
}