"use client";

import { useEffect, useState } from "react";
import { graphQuery, GET_PAYMENTS_BY_SENDER, GET_PAYMENTS_BY_RECIPIENT } from "~~/services/graph";

/**
 * Payment data structure from subgraph
 */
export interface Payment {
  id: string;
  orderId: string;
  sender: string;
  recipient: string;
  ensName?: string;
  basename?: string;
  amount: string;
  currency: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "DISPUTED";
  initiatedAt: string;
  completedAt?: string;
  transactionHash: string;
}

/**
 * Hook options
 */
export interface UseTransactionHistoryOptions {
  address?: string;
  direction?: "sent" | "received" | "all";
  first?: number;
  skip?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Hook result
 */
export interface UseTransactionHistoryResult {
  payments: Payment[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

/**
 * useTransactionHistory Hook
 *
 * Fetches transaction history from The Graph subgraph
 * Supports pagination and auto-refresh
 */
export function useTransactionHistory(
  options: UseTransactionHistoryOptions = {},
): UseTransactionHistoryResult {
  const {
    address,
    direction = "all",
    first = 20,
    skip = 0,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentSkip, setCurrentSkip] = useState(skip);
  const [hasMore, setHasMore] = useState(true);

  const fetchPayments = async (skipValue = currentSkip, append = false) => {
    if (!address) {
      setPayments([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result: any;

      if (direction === "sent") {
        result = await graphQuery(GET_PAYMENTS_BY_SENDER, {
          variables: {
            sender: address.toLowerCase(),
            first,
            skip: skipValue,
          },
        });
        const fetchedPayments = result.payments || [];
        setPayments(prev => (append ? [...prev, ...fetchedPayments] : fetchedPayments));
        setHasMore(fetchedPayments.length === first);
      } else if (direction === "received") {
        result = await graphQuery(GET_PAYMENTS_BY_RECIPIENT, {
          variables: {
            recipient: address.toLowerCase(),
            first,
            skip: skipValue,
          },
        });
        const fetchedPayments = result.payments || [];
        setPayments(prev => (append ? [...prev, ...fetchedPayments] : fetchedPayments));
        setHasMore(fetchedPayments.length === first);
      } else {
        // Fetch both sent and received
        const [sentResult, receivedResult] = await Promise.all([
          graphQuery(GET_PAYMENTS_BY_SENDER, {
            variables: {
              sender: address.toLowerCase(),
              first: Math.floor(first / 2),
              skip: Math.floor(skipValue / 2),
            },
          }),
          graphQuery(GET_PAYMENTS_BY_RECIPIENT, {
            variables: {
              recipient: address.toLowerCase(),
              first: Math.floor(first / 2),
              skip: Math.floor(skipValue / 2),
            },
          }),
        ]);

        const allPayments = [
          ...(sentResult.payments || []),
          ...(receivedResult.payments || []),
        ].sort((a, b) => parseInt(b.initiatedAt) - parseInt(a.initiatedAt));

        setPayments(prev => (append ? [...prev, ...allPayments] : allPayments));
        setHasMore(allPayments.length === first);
      }
    } catch (err) {
      console.error("Failed to fetch transaction history:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch payments"));
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    setCurrentSkip(0);
    await fetchPayments(0, false);
  };

  const loadMore = async () => {
    const newSkip = currentSkip + first;
    setCurrentSkip(newSkip);
    await fetchPayments(newSkip, true);
  };

  // Initial fetch
  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, direction, first]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !address) return;

    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, refreshInterval, address]);

  return {
    payments,
    loading,
    error,
    refetch,
    hasMore,
    loadMore,
  };
}
