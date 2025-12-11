import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { OnrampMethod, FiatCurrency, OnrampTransaction } from '../types/onramp';

interface UseOnrampOptions {
  onSuccess?: (transaction: OnrampTransaction) => void;
  onError?: (error: Error) => void;
  autoRetry?: boolean;
}

interface UseOnrampReturn {
  isOpen: boolean;
  openOnramp: (amount?: string) => void;
  closeOnramp: () => void;
  selectedMethod: OnrampMethod;
  setSelectedMethod: (method: OnrampMethod) => void;
  selectedCurrency: FiatCurrency;
  setSelectedCurrency: (currency: FiatCurrency) => void;
  targetAmount: string | undefined;
  isProcessing: boolean;
  error: string | null;
  initiatePayment: (amount: string, method: OnrampMethod, currency: FiatCurrency) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing onramp state and operations
 *
 * @example
 * ```tsx
 * const { isOpen, openOnramp, closeOnramp, selectedMethod, setSelectedMethod } = useOnramp({
 *   onSuccess: (transaction) => {
 *     console.log('Payment successful:', transaction);
 *   },
 *   onError: (error) => {
 *     console.error('Payment failed:', error);
 *   }
 * });
 * ```
 */
export const useOnramp = (options: UseOnrampOptions = {}): UseOnrampReturn => {
  const { onSuccess, onError, autoRetry = false } = options;
  const { address } = useAccount();

  const [isOpen, setIsOpen] = useState(false);
  const [targetAmount, setTargetAmount] = useState<string | undefined>();
  const [selectedMethod, setSelectedMethod] = useState<OnrampMethod>('coinbase');
  const [selectedCurrency, setSelectedCurrency] = useState<FiatCurrency>('USD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openOnramp = useCallback((amount?: string) => {
    setTargetAmount(amount);
    setIsOpen(true);
    setError(null);
  }, []);

  const closeOnramp = useCallback(() => {
    setIsOpen(false);
    setTargetAmount(undefined);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const initiatePayment = useCallback(
    async (amount: string, method: OnrampMethod, currency: FiatCurrency) => {
      setIsProcessing(true);
      setError(null);

      try {
        if (method === 'mobile-money') {
          // Mobile money payment flow
          // This would be handled by the MobileMoneyOnramp component
          // Here we just track the state
          const transaction: OnrampTransaction = {
            id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
            provider: method,
            status: 'pending',
            amount,
            currency,
            walletAddress: address || '',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // In a real implementation, you would call the API here
          // For now, we'll simulate success
          if (onSuccess) {
            onSuccess(transaction);
          }
        } else if (method === 'coinbase') {
          // Coinbase Pay flow
          // This is handled by the FundWalletCard component
          // Just track the state here
          const transaction: OnrampTransaction = {
            id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
            provider: method,
            status: 'pending',
            amount,
            currency,
            walletAddress: address || '',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          if (onSuccess) {
            onSuccess(transaction);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Payment failed';
        setError(errorMessage);

        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMessage));
        }

        // Auto-retry logic
        if (autoRetry) {
          setTimeout(() => {
            initiatePayment(amount, method, currency);
          }, 3000);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [address, onSuccess, onError, autoRetry]
  );

  return {
    isOpen,
    openOnramp,
    closeOnramp,
    selectedMethod,
    setSelectedMethod,
    selectedCurrency,
    setSelectedCurrency,
    targetAmount,
    isProcessing,
    error,
    initiatePayment,
    clearError,
  };
};
