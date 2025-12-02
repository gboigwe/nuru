/**
 * LowBalancePrompt Component
 *
 * Displays a contextual prompt when user has insufficient balance.
 * Suggests buying crypto via On-Ramp for seamless onboarding.
 *
 * Features:
 * - Shows when balance is below threshold
 * - Direct link to On-Ramp modal
 * - Dismissible alert
 * - Mobile-friendly design
 */

"use client";

import { useState } from "react";
import { OnRampButton } from "./OnRampButton";

interface LowBalancePromptProps {
  currentBalance: bigint;
  minimumRequired?: bigint;
  onDismiss?: () => void;
}

export const LowBalancePrompt = ({
  currentBalance,
  minimumRequired = BigInt(0),
  onDismiss,
}: LowBalancePromptProps) => {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Don't show if balance is sufficient or user dismissed
  if (currentBalance > minimumRequired || dismissed) {
    return null;
  }

  return (
    <div className="alert alert-info shadow-lg mb-4">
      <div className="flex items-start gap-3 w-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-current shrink-0 w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <div className="flex-1">
          <h3 className="font-bold">Insufficient Balance</h3>
          <div className="text-xs">You need crypto to send payments. Buy with a card to get started!</div>
        </div>
        <div className="flex items-center gap-2">
          <OnRampButton size="sm" variant="ghost" />
          <button onClick={handleDismiss} className="btn btn-ghost btn-sm btn-circle" aria-label="Dismiss">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};
