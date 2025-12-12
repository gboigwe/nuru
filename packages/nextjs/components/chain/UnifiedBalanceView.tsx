"use client";

/**
 * Unified Balance View Component
 *
 * Displays USDC balance across all supported chains
 */

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { chainDetectionService } from "~~/services/chain";
import { getChainName } from "~~/config/chains";
import type { UnifiedBalance } from "~~/types/chain-abstraction";

export const UnifiedBalanceView = () => {
  const { address } = useAccount();
  const [balance, setBalance] = useState<UnifiedBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (address) {
      loadBalance();
    }
  }, [address]);

  const loadBalance = async () => {
    if (!address) return;

    setLoading(true);
    try {
      const detection = await chainDetectionService.detectChains(address);

      const unifiedBalance: UnifiedBalance = {
        address,
        totalUSDC: detection.balances.reduce((sum, b) => sum + parseFloat(b.usdcBalance), 0).toFixed(2),
        totalValueUSD: detection.balances
          .reduce((sum, b) => sum + parseFloat(b.totalValueUSD), 0)
          .toFixed(2),
        chainBalances: detection.balances,
        lastUpdated: new Date(),
      };

      setBalance(unifiedBalance);
    } catch (error) {
      console.error("Error loading balance:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!address) {
    return null;
  }

  if (loading) {
    return (
      <div className="card bg-base-100 shadow-xl p-6">
        <div className="flex items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Multi-Chain Balance</h2>

        {/* Total Balance */}
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total USDC</div>
            <div className="stat-value text-primary">${balance.totalUSDC}</div>
            <div className="stat-desc">Across {balance.chainBalances.length} chains</div>
          </div>
          <div className="stat">
            <div className="stat-title">Total Value</div>
            <div className="stat-value text-success">${balance.totalValueUSD}</div>
            <div className="stat-desc">Including all assets</div>
          </div>
        </div>

        {/* Chain Breakdown Toggle */}
        <button className="btn btn-sm btn-outline mt-4" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Hide" : "Show"} Chain Breakdown
        </button>

        {/* Chain Balances */}
        {expanded && (
          <div className="mt-4 space-y-2">
            {balance.chainBalances
              .filter(b => parseFloat(b.totalValueUSD) > 0)
              .map(chainBalance => (
                <div key={chainBalance.chainId} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                      <div className="bg-neutral text-neutral-content rounded-full w-8">
                        <span className="text-xs">{chainBalance.chainName.slice(0, 2)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">{chainBalance.chainName}</div>
                      <div className="text-sm text-base-content/60">
                        {chainBalance.nativeBalance} {chainBalance.chainName === "Polygon" ? "MATIC" : "ETH"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${chainBalance.usdcBalance} USDC</div>
                    <div className="text-sm text-base-content/60">${chainBalance.totalValueUSD}</div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Refresh Button */}
        <button className="btn btn-sm btn-ghost mt-4" onClick={loadBalance}>
          🔄 Refresh
        </button>

        <div className="text-xs text-base-content/60 mt-2">
          Last updated: {balance.lastUpdated.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
