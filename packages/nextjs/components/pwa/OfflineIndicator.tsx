"use client";

/**
 * Offline Indicator Component
 *
 * Shows connection status and queued transactions
 */

import { useEffect, useState } from "react";
import { offlineQueueService } from "~~/services/pwa";

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [queueStats, setQueueStats] = useState({ pending: 0, failed: 0 });

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine);

    // Update queue stats
    const updateStats = () => {
      const stats = offlineQueueService.getStats();
      setQueueStats({ pending: stats.pending, failed: stats.failed });
    };

    updateStats();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      console.log("🟢 Connection restored");
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log("🔴 Connection lost");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && queueStats.pending === 0 && queueStats.failed === 0) {
    return null; // Don't show anything when online and no pending transactions
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Offline Status */}
      {!isOnline && (
        <div className="alert alert-warning shadow-lg mb-2 max-w-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">📡</span>
              <span className="font-semibold">You're offline</span>
            </div>
            <p className="text-xs">
              Transactions will be queued and sent when connection is restored.
            </p>
          </div>
        </div>
      )}

      {/* Pending Transactions */}
      {queueStats.pending > 0 && (
        <div className="alert alert-info shadow-lg max-w-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="loading loading-spinner loading-sm"></span>
              <span className="font-semibold">
                {queueStats.pending} transaction{queueStats.pending !== 1 ? "s" : ""} queued
              </span>
            </div>
            <p className="text-xs">
              {isOnline ? "Syncing..." : "Will sync when online"}
            </p>
          </div>
        </div>
      )}

      {/* Failed Transactions */}
      {queueStats.failed > 0 && (
        <div className="alert alert-error shadow-lg mt-2 max-w-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠</span>
              <span className="font-semibold">
                {queueStats.failed} transaction{queueStats.failed !== 1 ? "s" : ""} failed
              </span>
            </div>
            <p className="text-xs">
              Check your transaction history for details
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
