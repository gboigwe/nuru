import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { useAccount, useWalletClient } from 'wagmi';
import { voicePayService, VoiceToPaymentResult } from '../services/VoicePayService';
import { paymentExecutor, PaymentExecutionResult, PaymentStatus } from '../services/payment/PaymentExecutor';
import { useScaffoldContract } from './scaffold-eth';

/**
 * React hook for VoicePay functionality
 */
export interface VoicePayState {
  isProcessing: boolean;
  isExecuting: boolean;
  result: VoiceToPaymentResult | null;
  executionResult: PaymentExecutionResult | null;
  userBalance: string | null;
  userOrders: PaymentStatus[];
  error: string | null;
}

export interface VoicePayActions {
  processVoiceCommand: (transcript: string) => Promise<void>;
  executePayment: (audioBlob: Blob) => Promise<void>;
  cancelPayment: (orderId: number, reason: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
  clearResults: () => void;
}

export const useVoicePay = (): VoicePayState & VoicePayActions => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const { data: voiceRemittanceContract } = useScaffoldContract({
    contractName: "VoiceRemittance",
  });

  const [state, setState] = useState<VoicePayState>({
    isProcessing: false,
    isExecuting: false,
    result: null,
    executionResult: null,
    userBalance: null,
    userOrders: [],
    error: null
  });

  const [isPaymentExecutorInitialized, setIsPaymentExecutorInitialized] = useState(false);

  // Initialize payment executor when contract and wallet are available
  useEffect(() => {
    const initializePaymentExecutor = async () => {
      if (voiceRemittanceContract && walletClient && address && !isPaymentExecutorInitialized) {
        try {
          // Convert wagmi client to ethers provider and signer
          const provider = new BrowserProvider(walletClient);
          const signer = await provider.getSigner();
          
          // Initialize payment executor
          await paymentExecutor.initialize(
            provider,
            signer,
            voiceRemittanceContract.address,
            voiceRemittanceContract.abi
          );

          setIsPaymentExecutorInitialized(true);
          console.log('Payment executor initialized');
        } catch (error) {
          console.error('Failed to initialize payment executor:', error);
          setState(prev => ({
            ...prev,
            error: 'Failed to initialize payment system'
          }));
        }
      }
    };

    initializePaymentExecutor();
  }, [voiceRemittanceContract, walletClient, address, isPaymentExecutorInitialized]);

  // Process voice command
  const processVoiceCommand = useCallback(async (transcript: string) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await voicePayService.processVoiceCommand(transcript);
      
      setState(prev => ({
        ...prev,
        result,
        isProcessing: false,
        error: result.success ? null : result.error || 'Failed to process voice command'
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  }, []);

  // Execute payment
  const executePayment = useCallback(async (audioBlob: Blob) => {
    if (!state.result?.data || !state.result.success) {
      setState(prev => ({ ...prev, error: 'No valid payment command to execute' }));
      return;
    }

    setState(prev => ({ ...prev, isExecuting: true, error: null }));

    try {
      const executionResult = await paymentExecutor.executePayment(
        state.result.data,
        audioBlob
      );

      setState(prev => ({
        ...prev,
        executionResult,
        isExecuting: false,
        error: executionResult.success ? null : executionResult.error || 'Payment execution failed'
      }));

      // Refresh user data after successful payment
      if (executionResult.success) {
        await refreshUserData();
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        isExecuting: false,
        error: error instanceof Error ? error.message : 'Payment execution failed'
      }));
    }
  }, [state.result]);

  // Cancel payment
  const cancelPayment = useCallback(async (orderId: number, reason: string) => {
    setState(prev => ({ ...prev, isExecuting: true, error: null }));

    try {
      const result = await paymentExecutor.cancelPayment(orderId, reason);
      
      setState(prev => ({
        ...prev,
        isExecuting: false,
        error: result.success ? null : result.error || 'Payment cancellation failed'
      }));

      // Refresh user data after successful cancellation
      if (result.success) {
        await refreshUserData();
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        isExecuting: false,
        error: error instanceof Error ? error.message : 'Payment cancellation failed'
      }));
    }
  }, []);

  // Refresh user data (balance and orders)
  const refreshUserData = useCallback(async () => {
    if (!address) return;

    try {
      const [balanceResult, orders] = await Promise.all([
        paymentExecutor.checkUserBalance(address),
        paymentExecutor.getUserPaymentOrders(address)
      ]);

      setState(prev => ({
        ...prev,
        userBalance: balanceResult?.balance || null,
        userOrders: orders
      }));

    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, [address]);

  // Clear results
  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      result: null,
      executionResult: null,
      error: null
    }));
  }, []);

  // Auto-refresh user data when payment executor is initialized
  useEffect(() => {
    if (address && isPaymentExecutorInitialized) {
      // Add a small delay to ensure payment executor is fully initialized
      const timer = setTimeout(() => {
        refreshUserData();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [address, isPaymentExecutorInitialized]); // Only run when address or initialization state changes

  return {
    ...state,
    processVoiceCommand,
    executePayment,
    cancelPayment,
    refreshUserData,
    clearResults
  };
};

/**
 * Hook for voice payment statistics and insights
 */
export const useVoicePayStats = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalVolume: '0',
    averageTransactionSize: '0',
    successRate: 0,
    cacheStats: {
      addressCacheSize: 0,
      reverseCacheSize: 0,
      cacheDuration: 0
    }
  });

  const refreshStats = useCallback(async () => {
    try {
      // Get service stats
      const serviceStats = voicePayService.getStats();
      
      // Update stats state
      setStats(prev => ({
        ...prev,
        cacheStats: serviceStats.ens
      }));

    } catch (error) {
      console.error('Failed to get voice pay stats:', error);
    }
  }, []);

  useEffect(() => {
    refreshStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    stats,
    refreshStats
  };
};