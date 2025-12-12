/**
 * useXMTP Hook
 *
 * React hook for XMTP client management
 */

import { useEffect, useState } from "react";
import type { Conversation } from "@xmtp/xmtp-js";
import { useAccount } from "wagmi";
import { xmtpClient } from "~~/services/xmtp";
import { useEthersSigner } from "~~/utils/scaffold-eth/useEthersSigner";

export interface UseXMTPResult {
  isInitialized: boolean;
  isInitializing: boolean;
  error: Error | null;
  conversations: Conversation[];
  refreshConversations: () => Promise<void>;
  sendMessage: (peerAddress: string, message: string) => Promise<void>;
  canMessage: (address: string) => Promise<boolean>;
}

export function useXMTP(): UseXMTPResult {
  const { isConnected } = useAccount();
  const signer = useEthersSigner();

  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Initialize XMTP
  useEffect(() => {
    const initialize = async () => {
      if (!isConnected || !signer || isInitialized || isInitializing) {
        return;
      }

      setIsInitializing(true);
      setError(null);

      try {
        await xmtpClient.initialize(signer);
        setIsInitialized(true);

        // Load initial conversations
        const convs = await xmtpClient.getConversations();
        setConversations(convs);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to initialize XMTP");
        setError(error);
        console.error("XMTP initialization failed:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [isConnected, signer, isInitialized, isInitializing]);

  // Reset on disconnect
  useEffect(() => {
    if (!isConnected && isInitialized) {
      xmtpClient.disconnect();
      setIsInitialized(false);
      setConversations([]);
    }
  }, [isConnected, isInitialized]);

  // Refresh conversations
  const refreshConversations = async () => {
    if (!isInitialized) {
      return;
    }

    try {
      const convs = await xmtpClient.getConversations();
      setConversations(convs);
    } catch (err) {
      console.error("Failed to refresh conversations:", err);
    }
  };

  // Send message
  const sendMessage = async (peerAddress: string, message: string) => {
    if (!isInitialized) {
      throw new Error("XMTP not initialized");
    }

    await xmtpClient.sendMessage(peerAddress, message);

    // Refresh conversations to include new one if created
    await refreshConversations();
  };

  // Check if address can receive messages
  const canMessage = async (address: string): Promise<boolean> => {
    if (!isInitialized) {
      return false;
    }

    return await xmtpClient.canMessage(address);
  };

  return {
    isInitialized,
    isInitializing,
    error,
    conversations,
    refreshConversations,
    sendMessage,
    canMessage,
  };
}
