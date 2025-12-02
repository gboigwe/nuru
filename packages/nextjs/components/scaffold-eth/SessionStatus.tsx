/**
 * SessionStatus Component
 *
 * Displays session expiration countdown and provides session management controls.
 * Shows warnings when session is about to expire and allows manual refresh.
 */

"use client";

import { useSessionManager } from "~~/hooks/scaffold-eth/useSessionManager";

export const SessionStatus = () => {
  const { session, timeUntilExpiry, showExpiryWarning, refreshSession } = useSessionManager();

  if (!session || !session.rememberMe) return null;

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {showExpiryWarning ? (
        <div className="alert alert-warning py-2 px-3 text-xs flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Session expires in {formatTime(timeUntilExpiry)}</span>
          <button onClick={refreshSession} className="btn btn-xs btn-ghost">
            Extend
          </button>
        </div>
      ) : (
        <div className="text-xs text-base-content/70">Session: {formatTime(timeUntilExpiry)}</div>
      )}
    </div>
  );
};
