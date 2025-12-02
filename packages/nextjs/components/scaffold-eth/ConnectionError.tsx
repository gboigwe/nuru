/**
 * ConnectionError Component
 *
 * Displays wallet connection errors with specific messages and actions.
 * Handles various error scenarios: user rejection, network failures, timeouts, etc.
 */

"use client";

import { useEffect } from "react";

export type WalletErrorType =
  | "user_rejected"
  | "wallet_not_found"
  | "network_error"
  | "timeout"
  | "chain_unsupported"
  | "unknown";

interface ConnectionErrorProps {
  error: WalletErrorType | null;
  walletName?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const ERROR_MESSAGES: Record<WalletErrorType, { title: string; message: string; action?: string }> = {
  user_rejected: {
    title: "Connection Cancelled",
    message: "You cancelled the wallet connection request. Click retry to try again.",
    action: "Retry Connection",
  },
  wallet_not_found: {
    title: "Wallet Not Found",
    message: "Couldn't detect a wallet. Please install MetaMask or another Web3 wallet.",
    action: "Install Wallet",
  },
  network_error: {
    title: "Network Error",
    message: "Unable to connect to the network. Check your internet connection and try again.",
    action: "Retry Connection",
  },
  timeout: {
    title: "Connection Timeout",
    message: "The connection request took too long. Please try again.",
    action: "Retry Connection",
  },
  chain_unsupported: {
    title: "Unsupported Network",
    message: "This network is not supported. Please switch to a supported network in your wallet.",
    action: "Try Again",
  },
  unknown: {
    title: "Connection Failed",
    message: "An unexpected error occurred. Please try again or contact support.",
    action: "Retry Connection",
  },
};

export const ConnectionError = ({ error, walletName = "wallet", onRetry, onDismiss }: ConnectionErrorProps) => {
  if (!error) return null;

  const errorInfo = ERROR_MESSAGES[error];

  const handleAction = () => {
    if (error === "wallet_not_found") {
      window.open("https://metamask.io/download/", "_blank");
    } else if (onRetry) {
      onRetry();
    }
  };

  return (
    <div className="alert alert-error shadow-lg">
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
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="font-bold">{errorInfo.title}</h3>
            <div className="text-sm">{errorInfo.message}</div>
          </div>
          {onDismiss && (
            <button onClick={onDismiss} className="btn btn-ghost btn-sm btn-circle" aria-label="Dismiss">
              ✕
            </button>
          )}
        </div>
        <div className="flex gap-2 ml-9">
          {errorInfo.action && (
            <button onClick={handleAction} className="btn btn-sm btn-ghost">
              {errorInfo.action}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
