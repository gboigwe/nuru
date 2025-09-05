/**
 * Real Blockchain Transaction Service for Nuru MVP
 * Executes actual payments on Base Sepolia using deployed smart contract
 */

import { parseEther, formatEther, Address } from 'viem';
import { useScaffoldWriteContract, useScaffoldReadContract } from '~~/hooks/scaffold-eth';
import { PaymentIntent } from '../voice/VoiceCommandParser';

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  orderId?: number;
  error?: string;
  gasUsed?: bigint;
  blockNumber?: bigint;
  timestamp: number;
  receipt?: any;
}

export interface OrderDetails {
  id: number;
  sender: string;
  recipientENS: string;
  recipientAddress: string;
  amount: string;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled';
  timestamp: number;
  txHash?: string;
  voiceReceiptHash?: string;
}

export class NuruTransactionService {
  private contractAddress = "0xf163977578b6d41b464b989a5c7d6f9620D258B0";

  /**
   * Execute payment using smart contract
   */
  async executePayment(
    paymentIntent: PaymentIntent,
    voiceReceiptHash: string,
    senderAddress: Address
  ): Promise<TransactionResult> {
    const startTime = Date.now();

    try {
      console.log('Executing real payment on Base Sepolia...', {
        recipient: paymentIntent.recipientENS,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      });

      // Convert amount to wei (assuming amounts are in ETH/native token)
      const amountInWei = this.convertToWei(paymentIntent.amount, paymentIntent.currency);
      
      // Prepare contract interaction
      const contractWrite = useScaffoldWriteContract("VoiceRemittance");
      
      // Execute the transaction
      const result = await contractWrite.writeContractAsync({
        functionName: "initiatePayment",
        args: [
          paymentIntent.recipientENS,
          voiceReceiptHash,
          paymentIntent.currency,
          JSON.stringify(paymentIntent.metadata)
        ],
        value: amountInWei
      });

      console.log('Transaction submitted:', result);

      // Wait for confirmation (this might take time on testnet)
      // Note: In a real implementation, you'd want to handle this asynchronously
      
      return {
        success: true,
        txHash: result,
        timestamp: Date.now(),
        // orderId would be extracted from event logs in a full implementation
      };

    } catch (error) {
      console.error('Payment execution failed:', error);
      
      return {
        success: false,
        error: this.parseContractError(error),
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get user's payment history
   */
  async getUserOrders(userAddress: Address): Promise<OrderDetails[]> {
    try {
      const { data: orderIds } = useScaffoldReadContract({
        contractName: "VoiceRemittance",
        functionName: "getUserOrders",
        args: [userAddress]
      });

      if (!orderIds || orderIds.length === 0) {
        return [];
      }

      // Fetch details for each order
      const orders: OrderDetails[] = [];
      
      for (const orderId of orderIds) {
        try {
          const { data: orderData } = useScaffoldReadContract({
            contractName: "VoiceRemittance", 
            functionName: "getOrder",
            args: [orderId]
          });

          if (orderData) {
            orders.push({
              id: Number(orderData.id),
              sender: orderData.sender,
              recipientENS: orderData.recipientENS,
              recipientAddress: orderData.recipientAddress,
              amount: formatEther(orderData.amount),
              currency: orderData.currency,
              status: this.mapOrderStatus(orderData.status),
              timestamp: Number(orderData.timestamp) * 1000, // Convert to milliseconds
              voiceReceiptHash: orderData.voiceReceiptHash
            });
          }
        } catch (orderError) {
          console.warn(`Failed to fetch order ${orderId}:`, orderError);
        }
      }

      return orders.sort((a, b) => b.timestamp - a.timestamp);

    } catch (error) {
      console.error('Failed to fetch user orders:', error);
      return [];
    }
  }

  /**
   * Resolve ENS name to address using contract
   */
  async resolveENS(ensName: string): Promise<Address | null> {
    try {
      const { data: resolvedAddress } = useScaffoldReadContract({
        contractName: "VoiceRemittance",
        functionName: "resolveENS", 
        args: [ensName]
      });

      return resolvedAddress || null;
    } catch (error) {
      console.error('ENS resolution failed:', error);
      return null;
    }
  }

  /**
   * Get user profile from contract
   */
  async getUserProfile(userAddress: Address) {
    try {
      const { data: profile } = useScaffoldReadContract({
        contractName: "VoiceRemittance",
        functionName: "getUserProfile",
        args: [userAddress]
      });

      if (!profile) return null;

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
      console.error('Failed to fetch user profile:', error);
      return null;
    }
  }

  /**
   * Estimate gas cost for payment
   */
  async estimateGasCost(paymentIntent: PaymentIntent): Promise<bigint> {
    try {
      // This would use viem's estimateGas function
      // For now, return a reasonable estimate for Base Sepolia
      return BigInt("50000"); // ~0.0005 ETH at 10 gwei
    } catch (error) {
      console.error('Gas estimation failed:', error);
      return BigInt("100000"); // Conservative estimate
    }
  }

  // Private helper methods

  private convertToWei(amount: string, currency: string): bigint {
    const numAmount = parseFloat(amount);
    
    switch (currency.toLowerCase()) {
      case 'eth':
      case 'ethereum':
        return parseEther(amount);
      
      case 'cedis':
      case 'ghs':
        // For demo, treat cedis as equivalent to dollars (you'd use real exchange rates)
        return parseEther((numAmount * 0.001).toString()); // 1000 cedis = 1 ETH for demo
      
      case 'usd':
      case 'dollars':
      case 'usdc':
        // Convert USD to ETH (you'd use real exchange rates)
        return parseEther((numAmount * 0.0003).toString()); // $3000/ETH rate for demo
      
      default:
        return parseEther(amount); // Default to treating as ETH
    }
  }

  private mapOrderStatus(status: number): 'pending' | 'completed' | 'cancelled' {
    switch (status) {
      case 0: return 'pending';
      case 1: return 'completed';
      case 2: return 'cancelled';
      default: return 'pending';
    }
  }

  private parseContractError(error: any): string {
    if (error?.message) {
      // Parse common contract errors
      if (error.message.includes('insufficient funds')) {
        return 'Insufficient balance to complete payment';
      }
      if (error.message.includes('user denied')) {
        return 'Transaction cancelled by user';
      }
      if (error.message.includes('gas')) {
        return 'Transaction failed due to gas issues';
      }
      if (error.message.includes('revert')) {
        return 'Smart contract rejected the transaction';
      }
      
      return error.message;
    }
    
    return 'Unknown blockchain error occurred';
  }
}

// Export singleton instance  
export const nuruTransactionService = new NuruTransactionService();