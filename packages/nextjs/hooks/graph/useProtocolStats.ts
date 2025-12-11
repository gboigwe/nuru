"use client";

import { useEffect, useState } from "react";
import { graphQuery, GET_PROTOCOL_STATS } from "~~/services/graph";

/**
 * Protocol statistics data structure
 */
export interface ProtocolStats {
  totalVolumeAllTime: string;
  totalPaymentsAllTime: number;
  totalFeesAllTime: string;
  totalUniqueUsers: number;
  totalCompletedPayments: number;
  totalCancelledPayments: number;
  averagePaymentAmount: string;
  lastUpdated: string;
}

/**
 * Hook options
 */
export interface UseProtocolStatsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Hook result
 */
export interface UseProtocolStatsResult {
  stats: ProtocolStats | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * useProtocolStats Hook
 *
 * Fetches global protocol statistics from The Graph subgraph
 */
export function useProtocolStats(
  options: UseProtocolStatsOptions = {},
): UseProtocolStatsResult {
  const { autoRefresh = false, refreshInterval = 60000 } = options; // 60 seconds default

  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await graphQuery(GET_PROTOCOL_STATS, {
        cache: true,
        cacheDuration: 30000, // 30 seconds cache
      });

      if (result.protocolStat) {
        setStats(result.protocolStat);
      }
    } catch (err) {
      console.error("Failed to fetch protocol stats:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch stats"));
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchStats();
  };

  // Initial fetch
  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStats();
    }, refreshInterval);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, refreshInterval]);

  return {
    stats,
    loading,
    error,
    refetch,
  };
}
