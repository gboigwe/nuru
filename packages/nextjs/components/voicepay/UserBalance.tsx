"use client";

import React, { useEffect, useState } from "react";
import { formatEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

export const UserBalance: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [showFullBalance, setShowFullBalance] = useState(false);

  const { targetNetwork } = useTargetNetwork();

  // Get ETH balance
  const {
    data: ethBalance,
    isLoading: ethLoading,
    refetch: refetchEth,
  } = useBalance({
    address: address,
    chainId: targetNetwork.id,
  });

  // Get USDC balance (if available on the target network)
  const { data: usdcBalance, isLoading: usdcLoading } = useBalance({
    address: address,
    token: targetNetwork.id === 84532 ? 
      "0x036CbD53842c5426634e7929541eC2318f3dCF7e" : // USDC on Base Sepolia
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",  // USDC on Mainnet
    chainId: targetNetwork.id,
  });

  // Format balance for display
  const formatBalance = (balance: bigint | undefined, decimals: number = 4): string => {
    if (!balance) return "0.0000";
    const formatted = formatEther(balance);
    const num = parseFloat(formatted);
    return num.toFixed(decimals);
  };

  // Format balance in compact form
  const formatCompactBalance = (balance: bigint | undefined): string => {
    if (!balance) return "0";
    const formatted = formatEther(balance);
    const num = parseFloat(formatted);

    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    if (num >= 1) return num.toFixed(2);
    if (num >= 0.001) return num.toFixed(4);
    return "<0.001";
  };

  // Refresh balances
  const handleRefresh = () => {
    refetchEth();
  };

  if (!isConnected) {
    return (
      <div className="text-right">
        <p className="text-xs text-gray-500">Not connected</p>
      </div>
    );
  }

  return (
    <div className="text-right">
      {/* Main Balance Display */}
      <button
        onClick={() => setShowFullBalance(!showFullBalance)}
        className="text-right hover:bg-gray-50 rounded-lg p-2 transition-colors"
      >
        <div className="space-y-0.5">
          {ethLoading ? (
            <div className="animate-pulse">
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <p className="font-semibold text-gray-800">
              {showFullBalance
                ? `${formatBalance(ethBalance?.value)} ETH`
                : `${formatCompactBalance(ethBalance?.value)} ETH`}
            </p>
          )}
          <p className="text-xs text-gray-500">{showFullBalance ? "Tap to minimize" : "Tap for details"}</p>
        </div>
      </button>

      {/* Expanded Balance Details */}
      {showFullBalance && (
        <div className="absolute right-4 top-16 bg-white rounded-xl shadow-xl border p-4 min-w-64 z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <h3 className="font-semibold text-gray-800">Your Balance</h3>
            <button onClick={handleRefresh} className="text-blue-500 hover:text-blue-600 text-sm">
              🔄 Refresh
            </button>
          </div>

          {/* ETH Balance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">Ξ</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Ethereum</p>
                  <p className="text-xs text-gray-500">ETH</p>
                </div>
              </div>
              <div className="text-right">
                {ethLoading ? (
                  <div className="animate-pulse">
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-gray-800">{formatBalance(ethBalance?.value)}</p>
                    <p className="text-xs text-gray-500">
                      ${(parseFloat(formatBalance(ethBalance?.value)) * 2800).toLocaleString()}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* USDC Balance */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">$</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">USD Coin</p>
                  <p className="text-xs text-gray-500">USDC</p>
                </div>
              </div>
              <div className="text-right">
                {usdcLoading ? (
                  <div className="animate-pulse">
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-gray-800">{formatBalance(usdcBalance?.value, 2)}</p>
                    <p className="text-xs text-gray-500">${formatBalance(usdcBalance?.value, 2)}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Network Info */}
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-xs text-gray-600">{targetNetwork.name}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 space-y-2">
            <button
              onClick={() => window.open("https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet", "_blank")}
              className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-colors"
            >
              🚰 Get Testnet ETH
            </button>

            <button
              onClick={() => setShowFullBalance(false)}
              className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>

          {/* Address Display */}
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500 mb-1">Wallet Address:</p>
            <div className="bg-gray-50 rounded p-2">
              <p className="font-mono text-xs text-gray-700 break-all">{address}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
