"use client";

/**
 * Message Notification Badge
 *
 * Displays unread message count
 */

import { useEffect, useState } from "react";
import { readReceiptsService, xmtpClient } from "~~/services/xmtp";

export const MessageNotificationBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const updateUnreadCount = async () => {
      if (!xmtpClient.isInitialized()) {
        setUnreadCount(0);
        return;
      }

      setIsLoading(true);
      try {
        const count = await readReceiptsService.getTotalUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error("Failed to get unread count:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Update immediately
    updateUnreadCount();

    // Update every 30 seconds
    const interval = setInterval(updateUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading || unreadCount === 0) {
    return null;
  }

  return (
    <span className="badge badge-primary badge-sm absolute -top-1 -right-1">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
};
