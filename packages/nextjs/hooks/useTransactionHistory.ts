"use client";

import { useEffect, useState } from 'react';
import { Address } from 'viem';
import { basescanService, ProcessedTransaction } from '~~/services/blockchain/BasescanService';

/**
 * useTransactionHistory Hook
 *
 * Fetches and manages transaction history from Basescan
 */

export interface TransactionHistoryData {
  transactions: ProcessedTransaction[];
  isLoading: boolean;
  isError: boolean;
  error?: string;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTransactionHistory(
  address?: Address,
  initialPageSize = 10,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
): TransactionHistoryData {
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = async (pageNum: number, append = false) => {
    if (!address) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    try {
      const newTxs = await basescanService.getTransactionHistory(address, pageNum, initialPageSize);

      if (newTxs.length < initialPageSize) {
        setHasMore(false);
      }

      if (append) {
        setTransactions(prev => {
          // Deduplicate by hash
          const existingHashes = new Set(prev.map(tx => tx.hash));
          const uniqueNewTxs = newTxs.filter(tx => !existingHashes.has(tx.hash));
          return [...prev, ...uniqueNewTxs];
        });
      } else {
        setTransactions(newTxs);
      }

      setIsLoading(false);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchTransactions(nextPage, true);
  };

  const refresh = async () => {
    setPage(1);
    setHasMore(true);
    await fetchTransactions(1, false);
  };

  useEffect(() => {
    fetchTransactions(1, false);

    // Set up auto-refresh if enabled
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => fetchTransactions(1, false), refreshInterval);
      return () => clearInterval(interval);
    }
  }, [address, autoRefresh, refreshInterval]);

  return {
    transactions,
    isLoading,
    isError,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
