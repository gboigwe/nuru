import { Contract, parseEther, formatEther, BrowserProvider, JsonRpcSigner } from 'ethers';
import { voicePayService, ProcessedVoiceCommand } from '../VoicePayService';
import { synapseFilecoinStorage } from '../storage/SynapseFilecoinStorage';

/**
 * Payment execution service that integrates with VoiceRemittance smart contract
 */
export interface PaymentExecutionResult {
  success: boolean;
  transactionHash?: string;
  orderId?: number;
  error?: string;
  estimatedGas?: bigint;
  gasPrice?: bigint;
  voiceReceiptCid?: string;
  amountSent?: string;
}

export interface PaymentStatus {
  orderId: number;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  sender: string;
  recipient: string;
  recipientENS: string;
  amount: string;
  currency: string;
  transactionHash?: string;
  timestamp: number;
  voiceReceiptHash?: string;
}

export class PaymentExecutor {
  private contract: Contract | null = null;
  private signer: JsonRpcSigner | null = null;
  private provider: BrowserProvider | null = null;

  constructor(
    private contractAddress?: string,
    private contractABI?: any[]
  ) {}

  /**
   * Initialize the payment executor with web3 provider
   */
  async initialize(provider: BrowserProvider, signer: JsonRpcSigner, contractAddress: string, contractABI: any[]): Promise<void> {
    this.provider = provider;
    this.signer = signer;
    this.contractAddress = contractAddress;
    this.contractABI = contractABI;
    
    this.contract = new Contract(contractAddress, contractABI, signer);
  }

  /**
   * Execute payment based on processed voice command with Filecoin storage
   */
  async executePayment(
    processedCommand: ProcessedVoiceCommand,
    audioBlob: Blob
  ): Promise<PaymentExecutionResult> {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Payment executor not initialized');
      }

      const { intent, ensResolution } = processedCommand;

      // Validate the command is for payment
      if (intent.action !== 'send_money') {
        throw new Error('Only send_money actions can be executed');
      }

      if (!processedCommand.isValid) {
        throw new Error(`Invalid payment command: ${processedCommand.errors.join(', ')}`);
      }

      // Ensure ENS is resolved
      if (!ensResolution?.address) {
        throw new Error('ENS name could not be resolved to an address');
      }

      // Convert amount to Wei (assuming ETH for now, can be extended for other currencies)
      const amountInWei = this.convertToWei(intent.amount, intent.currency);

      // Step 1: Store voice receipt on Filecoin via Synapse SDK
      console.log('Storing voice receipt on Filecoin...');
      const voiceReceiptMetadata = {
        transactionHash: '', // Will be updated after transaction
        amount: intent.amount,
        currency: intent.currency,
        sender: await this.signer.getAddress(),
        recipient: ensResolution.address,
        recipientENS: intent.recipient,
        timestamp: Date.now(),
        audioFormat: 'webm',
        audioDuration: 0, // Could be extracted from audioBlob
        audioSize: audioBlob.size,
        language: intent.language || 'en',
        confidence: intent.confidence,
        paymentIntent: intent
      };

      const storedReceipt = await synapseFilecoinStorage.storeVoiceReceipt(
        audioBlob,
        voiceReceiptMetadata
      );

      console.log('Voice receipt stored on Filecoin:', storedReceipt.pieceCid);

      // Prepare transaction parameters
      const metadata = JSON.stringify({
        language: intent.language,
        confidence: intent.confidence,
        timestamp: Date.now(),
        voiceCommand: intent.rawTranscript,
        filecoinPieceCid: storedReceipt.pieceCid
      });

      // Estimate gas before execution
      try {
        const estimatedGas = await this.contract.initiatePayment.estimateGas(
          intent.recipient,
          storedReceipt.pieceCid, // Use Filecoin PieceCID instead of hash
          intent.currency.toUpperCase(),
          metadata,
          { value: amountInWei }
        );

        const gasPrice = await this.provider!.getFeeData();

        console.log(`Estimated gas: ${estimatedGas.toString()}`);
        console.log(`Gas price: ${gasPrice.gasPrice?.toString()}`);

        // Execute the transaction
        const tx = await this.contract.initiatePayment(
          intent.recipient,
          storedReceipt.pieceCid, // Use Filecoin PieceCID
          intent.currency.toUpperCase(),
          metadata,
          { 
            value: amountInWei,
            gasLimit: estimatedGas * BigInt(120) / BigInt(100) // 20% buffer
          }
        );

        console.log('Transaction submitted:', tx.hash);

        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt.hash);

        // Extract order ID from events
        const orderId = await this.extractOrderIdFromReceipt(receipt);

        return {
          success: true,
          transactionHash: receipt.hash,
          orderId,
          estimatedGas,
          gasPrice: gasPrice.gasPrice || BigInt(0),
          voiceReceiptCid: storedReceipt.pieceCid,
          amountSent: intent.amount
        };

      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);
        throw new Error(`Transaction would fail: ${gasError instanceof Error ? gasError.message : 'Unknown error'}`);
      }

    } catch (error) {
      console.error('Payment execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Complete payment by resolving ENS and transferring funds
   */
  async completePayment(orderId: number, recipientAddress: string): Promise<PaymentExecutionResult> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tx = await this.contract.completePayment(orderId, recipientAddress);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        orderId
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment completion failed'
      };
    }
  }

  /**
   * Cancel a pending payment
   */
  async cancelPayment(orderId: number, reason: string): Promise<PaymentExecutionResult> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tx = await this.contract.cancelPayment(orderId, reason);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        orderId
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment cancellation failed'
      };
    }
  }

  /**
   * Get payment order details
   */
  async getPaymentOrder(orderId: number): Promise<PaymentStatus | null> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const order = await this.contract.getOrder(orderId);
      
      return {
        orderId: Number(order.id),
        status: this.mapContractStatus(order.status),
        sender: order.sender,
        recipient: order.recipientAddress || 'Pending resolution',
        recipientENS: order.recipientENS,
        amount: formatEther(order.amount),
        currency: order.currency,
        timestamp: Number(order.timestamp) * 1000, // Convert to milliseconds
        voiceReceiptHash: order.voiceReceiptHash
      };

    } catch (error) {
      console.error('Failed to get payment order:', error);
      return null;
    }
  }

  /**
   * Get user's payment orders
   */
  async getUserPaymentOrders(userAddress: string): Promise<PaymentStatus[]> {
    try {
      if (!this.contract) {
        console.warn('Contract not initialized, skipping order retrieval');
        return [];
      }

      const orderIds = await this.contract.getUserOrders(userAddress);
      const orders: PaymentStatus[] = [];

      for (const orderId of orderIds) {
        const order = await this.getPaymentOrder(Number(orderId));
        if (order) {
          orders.push(order);
        }
      }

      // Sort by timestamp (newest first)
      return orders.sort((a, b) => b.timestamp - a.timestamp);

    } catch (error) {
      console.error('Failed to get user payment orders:', error);
      return [];
    }
  }

  /**
   * Get user profile from contract
   */
  async getUserProfile(userAddress: string) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const profile = await this.contract.getUserProfile(userAddress);
      
      return {
        totalSent: formatEther(profile.totalSent),
        totalReceived: formatEther(profile.totalReceived),
        transactionCount: Number(profile.transactionCount),
        reputationScore: Number(profile.reputationScore),
        isVerified: profile.isVerified,
        ensName: profile.ensName,
        lastActivity: Number(profile.lastActivity) * 1000
      };

    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  /**
   * Estimate gas cost for a payment
   */
  async estimatePaymentCost(
    processedCommand: ProcessedVoiceCommand,
    voiceReceiptHash: string
  ): Promise<{ gasEstimate: bigint; gasCost: bigint; totalCost: bigint } | null> {
    try {
      if (!this.contract || !this.provider) {
        throw new Error('Payment executor not initialized');
      }

      const { intent } = processedCommand;
      const amountInWei = this.convertToWei(intent.amount, intent.currency);

      const metadata = JSON.stringify({
        language: intent.language,
        confidence: intent.confidence,
        timestamp: Date.now()
      });

      const gasEstimate = await this.contract.initiatePayment.estimateGas(
        intent.recipient,
        voiceReceiptHash,
        intent.currency.toUpperCase(),
        metadata,
        { value: amountInWei }
      );

      const gasPrice = (await this.provider.getFeeData()).gasPrice || BigInt(0);
      const gasCost = gasEstimate * gasPrice;
      const totalCost = amountInWei + gasCost;

      return {
        gasEstimate,
        gasCost,
        totalCost
      };

    } catch (error) {
      console.error('Gas estimation failed:', error);
      return null;
    }
  }

  /**
   * Check user balance
   */
  async checkUserBalance(userAddress: string): Promise<{ balance: string; balanceWei: bigint } | null> {
    try {
      if (!this.provider) {
        console.warn('Provider not initialized, skipping balance check');
        return null;
      }

      const balanceWei = await this.provider.getBalance(userAddress);
      
      return {
        balance: formatEther(balanceWei),
        balanceWei
      };

    } catch (error) {
      console.error('Failed to check balance:', error);
      return null;
    }
  }

  // Private helper methods

  private convertToWei(amount: string, currency: string): bigint {
    const numericAmount = parseFloat(amount);
    
    switch (currency.toLowerCase()) {
      case 'eth':
      case 'ether':
        return parseEther(amount);
      
      case 'usdc':
      case 'dollars':
        // For demo purposes, treat as ETH equivalent
        // In production, this would involve USDC token contracts
        return parseEther(amount);
      
      case 'cedis':
        // Convert Cedis to ETH equivalent (mock rate: 1 ETH = 40,000 GHS)
        const ethAmount = numericAmount / 40000;
        return parseEther(ethAmount.toString());
      
      default:
        return parseEther(amount);
    }
  }

  private async extractOrderIdFromReceipt(receipt: any): Promise<number | undefined> {
    try {
      // Look for PaymentInitiated event in the receipt
      const event = receipt.logs.find((log: any) => {
        try {
          const decoded = this.contract!.interface.parseLog(log);
          return decoded && decoded.name === 'PaymentInitiated';
        } catch {
          return false;
        }
      });

      if (event) {
        const decoded = this.contract!.interface.parseLog(event);
        return Number(decoded!.args.orderId);
      }

      return undefined;
    } catch (error) {
      console.error('Failed to extract order ID:', error);
      return undefined;
    }
  }

  private mapContractStatus(statusCode: number): PaymentStatus['status'] {
    switch (statusCode) {
      case 0: return 'pending';
      case 1: return 'completed';
      case 2: return 'cancelled';
      case 3: return 'failed';
      default: return 'pending';
    }
  }
}

// Export singleton instance
export const paymentExecutor = new PaymentExecutor();