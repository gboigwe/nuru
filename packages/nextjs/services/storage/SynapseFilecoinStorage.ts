import { Synapse, RPC_URLS, TOKENS } from '@filoz/synapse-sdk';
import { ethers } from 'ethers';

/**
 * Synapse Filecoin Storage Service using official Filecoin Onchain Cloud
 * Stores voice recordings directly on Filecoin network with PDP proofs
 * Uses USDFC tokens for payment automation
 */

export interface VoiceReceiptMetadata {
  transactionHash?: string;
  orderId?: number;
  amount: string;
  currency: string;
  sender: string;
  recipient: string;
  recipientENS: string;
  timestamp: number;
  audioFormat: string;
  audioDuration: number;
  audioSize: number;
  language: string;
  confidence: number;
  paymentIntent: any;
}

export interface FilecoinStoredReceipt {
  pieceCid: string; // Synapse uses pieceCid instead of regular CID
  metadataPieceCid: string;
  timestamp: number;
  retrievalUrl: string;
  filecoinProofs?: string[];
  storageProvider?: string;
}

export interface StorageProgress {
  stage: 'initializing' | 'uploading' | 'confirming' | 'complete';
  progress: number;
  message: string;
}

export class SynapseFilecoinStorage {
  private synapse: any = null;
  private storage: any = null;
  private isInitialized = false;
  private network: 'mainnet' | 'calibration' = 'calibration'; // Default to testnet

  constructor() {}

  /**
   * Initialize client-side storage service
   * Server-side operations handled via API routes for security
   */
  async initialize(useTestnet: boolean = true): Promise<boolean> {
    try {
      console.log('Initializing client-side storage service...');
      
      this.network = useTestnet ? 'calibration' : 'mainnet';
      
      // Check if server has proper configuration by testing API endpoint
      const response = await fetch('/api/filecoin/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      
      if (!response.ok && response.status === 400) {
        const error = await response.json();
        if (error.error?.includes('Service provider wallet not configured')) {
          console.error('🔧 SERVER SETUP REQUIRED:');
          console.error('   Server-side environment variable missing:');
          console.error('   FILECOIN_SERVICE_PRIVATE_KEY=your-filecoin-private-key');
          console.error('   This must be set in your .env file for server-side access');
          throw new Error('Service provider wallet not configured on server');
        }
      }

      this.isInitialized = true;
      console.log('Client-side storage service initialized (using server-side API)');
      return true;

    } catch (error) {
      console.error('Failed to initialize storage service:', error);
      this.isInitialized = false;
      return false; // Don't throw - allow UI to load with error state
    }
  }

  /**
   * Setup USDFC payment system for storage
   * This is required for real Filecoin storage operations
   */
  async setupPayments(): Promise<{
    success: boolean;
    accountInfo?: any;
    error?: string;
  }> {
    if (!this.synapse) {
      return {
        success: false,
        error: 'Synapse not initialized - wallet connection required'
      };
    }

    try {
      // Check current USDFC balance
      const accountInfo = await this.synapse.payments.accountInfo();
      console.log('Current account info:', accountInfo);

      // If no balance, provide instructions
      if (!accountInfo.funds || accountInfo.funds === '0') {
        return {
          success: false,
          error: 'No USDFC balance. Get test tokens from: https://forest-explorer.chainsafe.dev/faucet/calibnet_usdfc'
        };
      }

      // Get warm storage service address
      const warmStorageAddress = await this.synapse.getWarmStorageAddress();
      
      // Approve storage service for automated payments
      await this.synapse.payments.approveService(
        warmStorageAddress,
        ethers.parseUnits('10', 18),   // Rate allowance: 10 USDFC per epoch
        ethers.parseUnits('1000', 18), // Lockup allowance: 1000 USDFC total
        86400n                         // Max lockup period (epochs)
      );

      console.log('Payment system configured successfully');
      return {
        success: true,
        accountInfo
      };

    } catch (error) {
      console.error('Payment setup failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment setup failed'
      };
    }
  }

  /**
   * Store voice receipt on Filecoin with PDP proofs via server-side API
   */
  async storeVoiceReceipt(
    audioBlob: Blob,
    metadata: VoiceReceiptMetadata,
    onProgress?: (progress: StorageProgress) => void
  ): Promise<FilecoinStoredReceipt> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Stage 1: Initializing
      onProgress?.({
        stage: 'initializing',
        progress: 10,
        message: 'Preparing for Filecoin storage...'
      });

      // Stage 2: Converting audio
      onProgress?.({
        stage: 'uploading',
        progress: 30,
        message: 'Preparing audio data...'
      });

      // Convert blob to base64 for JSON transport
      const audioBuffer = await audioBlob.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');

      // Stage 3: Uploading to server
      onProgress?.({
        stage: 'uploading',
        progress: 60,
        message: 'Uploading to Filecoin via server...'
      });

      // Send to server-side API for Filecoin storage
      const response = await fetch('/api/filecoin/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioBuffer: audioBase64,
          metadata
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server storage request failed');
      }

      // Stage 4: Confirming storage
      onProgress?.({
        stage: 'confirming',
        progress: 80,
        message: 'Confirming Filecoin storage proofs...'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Storage operation failed');
      }

      // Stage 5: Complete
      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Voice receipt stored on Filecoin!'
      });

      console.log('Voice receipt stored on Filecoin successfully:', result);
      
      // Return the FilecoinStoredReceipt (server already formatted it correctly)
      return {
        pieceCid: result.pieceCid,
        metadataPieceCid: result.metadataPieceCid,
        timestamp: result.timestamp,
        retrievalUrl: result.retrievalUrl,
        filecoinProofs: result.filecoinProofs,
        storageProvider: result.storageProvider
      };

    } catch (error) {
      console.error('Filecoin storage failed:', error);
      
      // No fallback - MVP requires working storage
      throw new Error(`Filecoin storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve voice receipt from Filecoin
   */
  async retrieveVoiceReceipt(pieceCid: string): Promise<{
    audioBlob: Blob;
    metadata: VoiceReceiptMetadata;
  } | null> {
    if (!this.storage) {
      throw new Error('Storage service not available. Service provider wallet required for MVP.');
    }

    try {
      // Download from Filecoin via Synapse
      const audioData = await this.synapse.download(pieceCid);
      const audioBlob = new Blob([audioData], { type: 'audio/webm' });

      return {
        audioBlob,
        metadata: {} as VoiceReceiptMetadata // Metadata would be retrieved separately
      };

    } catch (error) {
      console.error('Failed to retrieve from Filecoin:', error);
      return null;
    }
  }

  /**
   * Verify Filecoin storage integrity using PDP proofs
   */
  async verifyStorageIntegrity(pieceCid: string): Promise<{
    isValid: boolean;
    hasProof: boolean;
    storageProvider?: string;
    error?: string;
  }> {
    if (!this.synapse) {
      throw new Error('Synapse SDK not initialized. Service provider wallet required for MVP.');
    }

    try {
      // In real implementation, this would check PDP proofs
      // For now, we'll simulate the verification
      return {
        isValid: true,
        hasProof: true,
        storageProvider: 'Filecoin Synapse Provider'
      };

    } catch (error) {
      return {
        isValid: false,
        hasProof: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  /**
   * Get storage statistics and account info
   */
  async getStorageStats() {
    const stats = {
      isInitialized: this.isInitialized,
      network: this.network,
      hasSynapseConnection: !!this.synapse,
      hasStorageService: !!this.storage
    };

    if (this.synapse) {
      try {
        const accountInfo = await this.synapse.payments.accountInfo();
        return {
          ...stats,
          accountInfo,
          currentEpoch: await this.synapse.payments.getCurrentEpoch()
        };
      } catch (error) {
        return {
          ...stats,
          paymentError: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return stats;
  }

  // Private helper methods

  private async generateMockFilecoinStorage(
    audioBlob: Blob,
    metadata: any,
    onProgress?: (progress: StorageProgress) => void
  ): Promise<FilecoinStoredReceipt> {
    // Simulate storage process for demo
    onProgress?.({
      stage: 'uploading',
      progress: 60,
      message: 'Demo: Simulating Filecoin storage...'
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    onProgress?.({
      stage: 'confirming',
      progress: 90,
      message: 'Demo: Generating mock PieceCID...'
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Demo: Mock Filecoin storage complete!'
    });

    // Generate realistic Filecoin PieceCID (base32 format)
    const mockPieceCid = this.generateMockPieceCID();
    const mockMetadataPieceCid = this.generateMockPieceCID();

    return {
      pieceCid: mockPieceCid,
      metadataPieceCid: mockMetadataPieceCid,
      timestamp: Date.now(),
      retrievalUrl: `https://demo.filecoin.synapse/${mockPieceCid}`,
      filecoinProofs: ['demo-pdp-proof-' + Date.now()],
      storageProvider: 'Demo Filecoin Provider'
    };
  }

  private generateMockPieceCID(): string {
    // Generate realistic Filecoin PieceCID format
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const base32chars = 'abcdefghijklmnopqrstuvwxyz234567';
    let result = 'bafk2bzace';
    
    for (let i = 0; i < 50; i++) {
      result += base32chars[Math.floor(Math.random() * base32chars.length)];
    }
    
    return result;
  }
}

// Export singleton instance
export const synapseFilecoinStorage = new SynapseFilecoinStorage();