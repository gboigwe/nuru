/**
 * useWalletConnection Hook
 *
 * Enhanced wallet connection with comprehensive error handling and loading states.
 * Handles user rejection, network errors, timeouts, and missing wallets.
 */

import { useState, useCallback } from "react";
import { useConnect } from "wagmi";
import type { WalletErrorType } from "~~/components/scaffold-eth/ConnectionError";

const CONNECTION_TIMEOUT = 15000; // 15 seconds

export function useWalletConnection() {
  const { connect, connectors, isPending } = useConnect();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<WalletErrorType | null>(null);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  /**
   * Parse error message to determine error type
   */
  const parseError = (error: Error): WalletErrorType => {
    const message = error.message.toLowerCase();

    if (message.includes("user rejected") || message.includes("user denied") || message.includes("cancelled")) {
      return "user_rejected";
    }

    if (message.includes("not found") || message.includes("not installed") || message.includes("no provider")) {
      return "wallet_not_found";
    }

    if (
      message.includes("network") ||
      message.includes("connection") ||
      message.includes("rpc") ||
      message.includes("offline")
    ) {
      return "network_error";
    }

    if (message.includes("timeout") || message.includes("timed out")) {
      return "timeout";
    }

    if (message.includes("chain") || message.includes("unsupported")) {
      return "chain_unsupported";
    }

    return "unknown";
  };

  /**
   * Connect to wallet with error handling and timeout
   */
  const connectWallet = useCallback(
    async (connectorId: string) => {
      setError(null);
      setIsConnecting(true);
      setConnectingWallet(connectorId);

      const connector = connectors.find(c => c.id === connectorId);

      if (!connector) {
        setError("wallet_not_found");
        setIsConnecting(false);
        setConnectingWallet(null);
        return;
      }

      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Connection timeout")), CONNECTION_TIMEOUT);
        });

        // Race between connection and timeout
        await Promise.race([
          new Promise<void>((resolve, reject) => {
            connect(
              { connector },
              {
                onSuccess: () => {
                  setIsConnecting(false);
                  setConnectingWallet(null);
                  resolve();
                },
                onError: error => {
                  reject(error);
                },
              },
            );
          }),
          timeoutPromise,
        ]);
      } catch (err) {
        const errorType = parseError(err as Error);
        setError(errorType);
        console.error("Wallet connection error:", err);
      } finally {
        setIsConnecting(false);
        setConnectingWallet(null);
      }
    },
    [connect, connectors],
  );

  /**
   * Retry connection (clears error and attempts reconnect)
   */
  const retry = useCallback(
    (connectorId: string) => {
      setError(null);
      connectWallet(connectorId);
    },
    [connectWallet],
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    connectWallet,
    retry,
    clearError,
    error,
    isConnecting,
    connectingWallet,
    isPending,
  };
}
