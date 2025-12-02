/**
 * useSessionManager Hook
 *
 * React hook for managing wallet sessions with auto-refresh and restoration.
 * Integrates with Reown AppKit's SIWE authentication system.
 *
 * Features:
 * - Auto-restore sessions on app load
 * - Auto-refresh before expiration
 * - Session expiration warnings
 * - Remember me functionality
 */

import { useEffect, useState, useCallback } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { sessionManager, type SessionData } from "~~/services/session/SessionManager";

const WARNING_THRESHOLD = 300000; // 5 minutes

export function useSessionManager() {
  const { address, chainId, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const [session, setSession] = useState<SessionData | null>(null);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number>(0);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);

  /**
   * Create a new session when user connects
   */
  const createSession = useCallback(
    (rememberMe: boolean = true) => {
      if (!address || !chainId) return;

      // Determine provider type from connector
      const provider =
        connector?.id === "email" || connector?.id === "social"
          ? (connector.id as "email" | "google" | "apple" | "discord" | "farcaster")
          : ("wallet" as const);

      const newSession = sessionManager.createSession({
        address,
        chainId,
        provider,
        rememberMe,
      });

      setSession(newSession);
    },
    [address, chainId, connector],
  );

  /**
   * Refresh the current session
   */
  const refreshSession = useCallback(() => {
    const refreshed = sessionManager.refreshSession();
    if (refreshed) {
      setSession(refreshed);
      setShowExpiryWarning(false);
    }
  }, []);

  /**
   * Clear session and disconnect wallet
   */
  const clearSession = useCallback(() => {
    sessionManager.clearSession();
    setSession(null);
    setShowExpiryWarning(false);
    disconnect();
  }, [disconnect]);

  /**
   * Restore session on mount
   */
  useEffect(() => {
    const existingSession = sessionManager.getSession();
    if (existingSession && !isConnected) {
      // Session exists but wallet not connected - attempt restoration
      setSession(existingSession);
    } else if (existingSession && isConnected) {
      // Both session and wallet connected - sync them
      setSession(existingSession);
    }
  }, [isConnected]);

  /**
   * Create session when wallet connects
   */
  useEffect(() => {
    if (isConnected && address && !session) {
      // Check if there's an existing session for this address
      const existingSession = sessionManager.getSession();
      if (existingSession && existingSession.address === address) {
        setSession(existingSession);
      } else {
        // Create new session
        createSession(true);
      }
    }
  }, [isConnected, address, session, createSession]);

  /**
   * Monitor session expiration
   */
  useEffect(() => {
    const interval = setInterval(() => {
      const currentSession = sessionManager.getSession();

      if (!currentSession) {
        setTimeUntilExpiry(0);
        setShowExpiryWarning(false);
        return;
      }

      const timeLeft = sessionManager.getTimeUntilExpiry();
      setTimeUntilExpiry(timeLeft);

      // Show warning when close to expiry
      if (timeLeft <= WARNING_THRESHOLD && timeLeft > 0) {
        setShowExpiryWarning(true);
      }

      // Auto-refresh if needed and user opted in
      if (sessionManager.needsRefresh() && currentSession.rememberMe) {
        refreshSession();
      }

      // Session expired - clear it
      if (timeLeft === 0 && session) {
        clearSession();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [session, refreshSession, clearSession]);

  return {
    session,
    timeUntilExpiry,
    showExpiryWarning,
    createSession,
    refreshSession,
    clearSession,
  };
}
