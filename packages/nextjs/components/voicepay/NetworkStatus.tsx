"use client";

import React, { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

export const NetworkStatus: React.FC = () => {
  const { chain } = useAccount();
  const currentChainId = useChainId();
  const [isExpanded, setIsExpanded] = useState(false);

  // Use chainId from useChainId if chain is not available
  const activeChainId = chain?.id || currentChainId;

  const isFilecoinNetwork = activeChainId === 314 || activeChainId === 314159;
  const isBaseNetwork = activeChainId === 84532 || activeChainId === 8453;

  const getNetworkInfo = () => {
    if (!activeChainId) return { name: "Not Connected", status: "disconnected" };

    switch (activeChainId) {
      case 314:
        return { name: "Filecoin Mainnet", status: "filecoin", color: "green" };
      case 314159:
        return { name: "Filecoin Calibration", status: "filecoin", color: "green" };
      case 84532:
        return { name: "Base Sepolia", status: "base", color: "blue" };
      case 8453:
        return { name: "Base Mainnet", status: "base", color: "blue" };
      default:
        return { name: chain?.name || `Chain ${activeChainId}`, status: "other", color: "gray" };
    }
  };

  const networkInfo = getNetworkInfo();

  if (!activeChainId) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`
          bg-white rounded-lg shadow-lg border-2 cursor-pointer transition-all duration-200
          ${networkInfo.color === "green" ? "border-green-200" : ""}
          ${networkInfo.color === "blue" ? "border-blue-200" : ""}
          ${networkInfo.color === "gray" ? "border-gray-200" : ""}
          ${isExpanded ? "w-80" : "w-auto"}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Compact View */}
        <div className="p-3 flex items-center space-x-2">
          <div
            className={`
            w-3 h-3 rounded-full
            ${networkInfo.color === "green" ? "bg-green-500 animate-pulse" : ""}
            ${networkInfo.color === "blue" ? "bg-blue-500" : ""}
            ${networkInfo.color === "gray" ? "bg-gray-400" : ""}
          `}
          />
          <span className="text-sm font-medium">{networkInfo.name}</span>
          <span className="text-xs text-gray-500">{isExpanded ? "▼" : "▲"}</span>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="border-t px-4 pb-4">
            <div className="mt-3 space-y-3">
              {/* Current Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Chain ID:</span>
                <span className="text-xs text-gray-800">{activeChainId}</span>
              </div>

              {/* VoicePay Payments */}
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-xs font-medium text-blue-800">VoicePay Payments</span>
                </div>
                <p className="text-xs text-blue-600">
                  {isBaseNetwork ? "✅ Active on this network" : "❌ Requires Base network"}
                </p>
              </div>

              {/* Filecoin Storage */}
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${isFilecoinNetwork ? "bg-green-500" : "bg-gray-400"}`} />
                  <span className="text-xs font-medium text-purple-800">Filecoin Storage</span>
                </div>
                <p className="text-xs text-purple-600">
                  {isFilecoinNetwork ? "✅ Real Filecoin storage available" : "🔧 Demo mode - mock storage"}
                </p>
              </div>

              {/* Service Provider Info */}
              {!isFilecoinNetwork && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-purple-800 mb-2">🏢 Service Provider Storage</p>
                  <div className="text-xs text-purple-700 space-y-1">
                    <p>• You stay on Base Sepolia ✅</p>
                    <p>• Service pays storage costs ✅</p>
                    <p>• No network switching needed ✅</p>
                  </div>
                </div>
              )}

              {/* Demo Mode Notice */}
              {!isFilecoinNetwork && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-700">
                    ℹ️ <strong>Demo works perfectly!</strong> Voice receipts get mock Filecoin PieceCIDs for hackathon
                    demonstration.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
