import { useEffect, useState, useCallback } from 'react';
import { TransactionRecord, TransactionStatus } from '../services/transactions/types';
import { transactionStorage } from '../services/transactions/IndexedDBStorage';
import { useAccount } from 'wagmi';

export function useTransactionHistory() {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<{
    status?: TransactionStatus;
    limit: number;
    offset: number;
    hasMore: boolean;
  }>({ limit: 10, offset: 0, hasMore: true });

  const loadTransactions = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const txs = await transactionStorage.getTransactions({
        ...filters,
        address,
      });
      
      setTransactions(prev => 
        filters.offset === 0 ? txs : [...prev, ...txs]
      );
      setFilters(prev => ({
        ...prev,
        hasMore: txs.length === filters.limit,
      }));
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError(err instanceof Error ? err : new Error('Failed to load transactions'));
    } finally {
      setLoading(false);
    }
  }, [address, filters]);

  const loadMore = useCallback(() => {
    if (loading || !filters.hasMore) return;
    
    setFilters(prev => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }));
  }, [filters.hasMore, loading]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      offset: 0, // Reset offset when filters change
    }));
  }, []);

  // Load transactions when address or filters change
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Listen for new transactions
  useEffect(() => {
    if (!address) return;
    
    const handleNewTransaction = async (tx: TransactionRecord) => {
      if (tx.from.toLowerCase() === address.toLowerCase() || 
          tx.to.toLowerCase() === address.toLowerCase()) {
        // If we're on the first page, refresh the list
        if (filters.offset === 0) {
          await loadTransactions();
        }
      }
    };

    // In a real app, you might want to use an event emitter or context
    // to notify about new transactions. For now, we'll just re-fetch periodically.
    const interval = setInterval(loadTransactions, 15000); // Refresh every 15s
    
    return () => clearInterval(interval);
  }, [address, filters.offset, loadTransactions]);

  return {
    transactions,
    loading,
    error,
    loadMore,
    hasMore: filters.hasMore,
    updateFilters,
    currentFilters: filters,
    refresh: loadTransactions,
  };
}

// Hook to track and save new transactions
export function useTrackTransaction() {
  const saveTransaction = useCallback(async (tx: Omit<TransactionRecord, 'timestamp'>) => {
    try {
      await transactionStorage.saveTransaction(tx);
      return true;
    } catch (err) {
      console.error('Failed to save transaction:', err);
      return false;
    }
  }, []);

  return { saveTransaction };
}
