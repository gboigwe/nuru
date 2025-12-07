import { useState, useEffect, useCallback } from 'react';
import { useWalletClient } from 'wagmi';
import { BrowserProvider } from 'ethers';
import { transactionMonitor, TransactionStatus } from '~/services/transactions/TransactionMonitor';
import { stuckTransactionDetector } from '~/services/transactions/StuckTransactionDetector';
import { transactionReplacer } from '~/services/transactions/TransactionReplacer';

export const useTransactionMonitor = (txHash: string | null) => {
  const [status, setStatus] = useState<TransactionStatus>('PENDING');
  const [confirmations, setConfirmations] = useState(0);
  const [isStuck, setIsStuck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    if (!txHash || !walletClient) return;

    const provider = new BrowserProvider(walletClient);
    transactionMonitor.initialize(provider);
    stuckTransactionDetector.initialize(provider);

    const pollStatus = async () => {
      try {
        const newStatus = await transactionMonitor.pollTransactionStatus(txHash, 1);
        setStatus(newStatus);

        const tx = transactionMonitor.getTransaction(txHash);
        if (tx) {
          setConfirmations(tx.confirmations);
          const stuck = stuckTransactionDetector.isStuck(tx.timestamp);
          setIsStuck(stuck);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 5000);

    return () => clearInterval(interval);
  }, [txHash, walletClient]);

  const speedUp = useCallback(async () => {
    if (!txHash || !walletClient) return;

    try {
      const provider = new BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      transactionReplacer.initialize(provider, signer);

      const newTxHash = await transactionReplacer.speedUpTransaction(txHash);
      return newTxHash;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speed up failed');
      throw err;
    }
  }, [txHash, walletClient]);

  const cancel = useCallback(async () => {
    if (!txHash || !walletClient) return;

    try {
      const provider = new BrowserProvider(walletClient);
      const signer = await provider.getSigner();
      transactionReplacer.initialize(provider, signer);

      const newTxHash = await transactionReplacer.cancelTransaction(txHash);
      return newTxHash;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
      throw err;
    }
  }, [txHash, walletClient]);

  return {
    status,
    confirmations,
    isStuck,
    error,
    speedUp,
    cancel
  };
};
