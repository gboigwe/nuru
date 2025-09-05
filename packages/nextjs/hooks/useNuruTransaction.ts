/**
 * React hook for Nuru blockchain transactions
 * Provides real blockchain interaction for payments
 */

import { useState } from 'react';
import { parseEther, formatEther, Address } from 'viem';
import { useScaffoldWriteContract, useScaffoldReadContract } from '~~/hooks/scaffold-eth';
import { PaymentIntent } from '../services/voice/VoiceCommandParser';

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

export function useNuruTransaction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { writeContractAsync } = useScaffoldWriteContract("VoiceRemittance");

  // Convert amount to wei based on currency
  const convertToWei = (amount: string, currency: string): bigint => {
    const numAmount = parseFloat(amount);
    
    switch (currency.toLowerCase()) {
      case 'eth':
      case 'ethereum':
        return parseEther(amount);
      
      case 'cedis':
      case 'ghs':
        return parseEther((numAmount * 0.001).toString()); // 1000 cedis = 1 ETH for demo
      
      case 'usd':
      case 'dollars':
      case 'usdc':
        return parseEther((numAmount * 0.0003).toString()); // $3000/ETH rate for demo
      
      default:
        return parseEther(amount);
    }
  };

  // Parse contract errors into user-friendly messages
  const parseContractError = (error: any): string => {
    if (error?.message) {
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
  };

  // Execute payment using smart contract
  const executePayment = async (
    paymentIntent: PaymentIntent,
    voiceReceiptHash: string,
    senderAddress: Address
  ): Promise<TransactionResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Executing real payment on Base Sepolia...', {
        recipient: paymentIntent.recipientENS,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      });

      const amountInWei = convertToWei(paymentIntent.amount, paymentIntent.currency);
      
      const result = await writeContractAsync({
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

      return {
        success: true,
        txHash: result,
        timestamp: Date.now(),
      };

    } catch (error) {
      console.error('Payment execution failed:', error);
      const errorMessage = parseContractError(error);
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now()
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Estimate gas cost for payment
  const estimateGasCost = async (paymentIntent: PaymentIntent): Promise<bigint> => {
    try {
      // Return reasonable estimate for Base Sepolia
      return BigInt("50000"); // ~0.0005 ETH at 10 gwei
    } catch (error) {
      console.error('Gas estimation failed:', error);
      return BigInt("100000"); // Conservative estimate
    }
  };

  return {
    executePayment,
    estimateGasCost,
    isLoading,
    error,
    convertToWei,
    parseContractError
  };
}

// Hook for reading contract data
export function useNuruContractRead() {
  // Get user orders
  const useUserOrders = (userAddress: Address) => {
    const { data: orderIds } = useScaffoldReadContract({
      contractName: "VoiceRemittance",
      functionName: "getUserOrders",
      args: [userAddress]
    });

    return orderIds || [];
  };

  // Get single order details
  const useOrderDetails = (orderId: number) => {
    const { data: orderData } = useScaffoldReadContract({
      contractName: "VoiceRemittance", 
      functionName: "getOrder",
      args: [BigInt(orderId)]
    });

    if (!orderData) return null;

    const mapOrderStatus = (status: number): 'pending' | 'completed' | 'cancelled' => {
      switch (status) {
        case 0: return 'pending';
        case 1: return 'completed';
        case 2: return 'cancelled';
        default: return 'pending';
      }
    };

    return {
      id: Number(orderData.id),
      sender: orderData.sender,
      recipientENS: orderData.recipientENS,
      recipientAddress: orderData.recipientAddress,
      amount: formatEther(orderData.amount),
      currency: orderData.currency,
      status: mapOrderStatus(Number(orderData.status)),
      timestamp: Number(orderData.timestamp) * 1000,
      voiceReceiptHash: orderData.voiceReceiptHash
    };
  };

  // Resolve ENS name
  const useENSResolution = (ensName: string) => {
    const { data: resolvedAddress } = useScaffoldReadContract({
      contractName: "VoiceRemittance",
      functionName: "resolveENS", 
      args: [ensName]
    });

    return resolvedAddress;
  };

  // Get user profile
  const useUserProfile = (userAddress: Address) => {
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
  };

  return {
    useUserOrders,
    useOrderDetails,
    useENSResolution,
    useUserProfile
  };
}