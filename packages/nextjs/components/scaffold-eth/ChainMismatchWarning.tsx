/**
 * ChainMismatchWarning Component
 *
 * Displays warning when wallet network doesn't match target network.
 * Provides option to auto-switch networks to prevent wrong-chain transactions.
 */

"use client";

import { useChainValidation } from "~~/hooks/scaffold-eth/useChainValidation";

export const ChainMismatchWarning = () => {
  const { isChainMismatch, showMismatchWarning, currentChain, targetChain, switchToTargetChain, dismissWarning, isSwitching } =
    useChainValidation();

  if (!showMismatchWarning || !isChainMismatch) return null;

  return (
    <div className="alert alert-warning shadow-lg">
      <div className="flex flex-col gap-2 w-full">
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
            <h3 className="font-bold">Wrong Network Detected</h3>
            <div className="text-sm">
              Your wallet is on <strong>{currentChain?.name}</strong> but this app uses{" "}
              <strong>{targetChain?.name}</strong>. Please switch networks to continue.
            </div>
          </div>
          <button onClick={dismissWarning} className="btn btn-ghost btn-sm btn-circle" aria-label="Dismiss">
            ✕
          </button>
        </div>
        <div className="flex gap-2 ml-9">
          <button onClick={switchToTargetChain} disabled={isSwitching} className="btn btn-sm btn-warning">
            {isSwitching ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Switching...
              </>
            ) : (
              `Switch to ${targetChain?.name}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
