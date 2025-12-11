/**
 * InsufficientBalancePrompt Component
 *
 * Displays when user doesn't have enough balance for a payment.
 * Shows exact shortfall and provides on-ramp option to add funds.
 * Monitors balance changes and can auto-retry payment when sufficient.
 */

"use client";

import { useEffect, useState } from "react";
import { useBalance } from "wagmi";
import { formatEther } from "viem";
import { OnchainFundCard } from "~~/components/onchainkit/OnchainFundCard";

interface InsufficientBalancePromptProps {
  currentBalance: bigint;
  requiredAmount: bigint;
  shortfall: bigint;
  userAddress?: string;
  onBalanceSufficient?: () => void;
  onDismiss?: () => void;
}

export const InsufficientBalancePrompt = ({
  currentBalance,
  requiredAmount,
  shortfall,
  userAddress,
  onBalanceSufficient,
  onDismiss,
}: InsufficientBalancePromptProps) => {
  const [isWaitingForFunds, setIsWaitingForFunds] = useState(false);

  // Watch balance for changes
  const { data: balanceData } = useBalance({
    address: userAddress as `0x${string}`,
    query: {
      refetchInterval: isWaitingForFunds ? 1000 : false,
    },
  });

  // Check if balance became sufficient
  useEffect(() => {
    if (isWaitingForFunds && balanceData && balanceData.value >= requiredAmount) {
      onBalanceSufficient?.();
    }
  }, [balanceData, requiredAmount, isWaitingForFunds, onBalanceSufficient]);

  // Start watching for funds when component mounts
  useEffect(() => {
    setIsWaitingForFunds(true);
  }, []);

  return (
    <div className="alert alert-warning shadow-lg">
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-start gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="font-bold">Insufficient Balance</h3>
            <div className="text-sm space-y-1">
              <p>
                You need <strong>{formatEther(shortfall)} ETH</strong> more to complete this payment.
              </p>
              <div className="text-xs opacity-80">
                <p>Current: {formatEther(currentBalance)} ETH</p>
                <p>Required: {formatEther(requiredAmount)} ETH (including fees)</p>
              </div>
            </div>
          </div>
          {onDismiss && (
            <button onClick={onDismiss} className="btn btn-ghost btn-sm btn-circle" aria-label="Dismiss">
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <OnchainFundCard
            onSuccess={() => {
              console.log("Funds added successfully, checking balance...");
              setIsWaitingForFunds(true);
            }}
            onError={(error: unknown) => {
              console.error("Failed to add funds:", error);
            }}
          />
          {isWaitingForFunds && (
            <div className="bg-base-200 rounded-lg p-3 flex items-center gap-2">
              <span className="loading loading-spinner loading-sm"></span>
              <p className="text-xs opacity-70">
                Waiting for funds to arrive...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
