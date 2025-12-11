"use client";

/**
 * PWA Provider Component
 *
 * Initializes all PWA services and displays PWA components
 */

import { useEffect, useState } from "react";
import { backgroundSyncService, pushNotificationService } from "~~/services/pwa";
import { InstallPrompt } from "./InstallPrompt";
import { OfflineIndicator } from "./OfflineIndicator";
import { UpdateNotification } from "./UpdateNotification";

export const PWAProvider = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const initializePWA = async () => {
      console.log("🚀 Initializing PWA services...");

      // Register service worker
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          });

          console.log("✅ Service Worker registered:", registration.scope);

          // Check for updates
          registration.update();

          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener("message", (event) => {
            if (event.data && event.data.type === "SYNC_QUEUE") {
              console.log("🔄 Service Worker requested queue sync");
              backgroundSyncService.syncQueue();
            }
          });
        } catch (error) {
          console.error("Service Worker registration failed:", error);
        }
      }

      // Initialize push notifications
      try {
        await pushNotificationService.initialize();
      } catch (error) {
        console.error("Push notification initialization failed:", error);
      }

      // Initialize background sync
      try {
        await backgroundSyncService.initialize();
      } catch (error) {
        console.error("Background sync initialization failed:", error);
      }

      setIsInitialized(true);
      console.log("✅ PWA services initialized");
    };

    initializePWA();

    // Cleanup on unmount
    return () => {
      backgroundSyncService.cleanup();
    };
  }, []);

  if (!isInitialized) {
    return null;
  }

  return (
    <>
      {/* Install prompt */}
      <InstallPrompt />

      {/* Offline indicator */}
      <OfflineIndicator />

      {/* Update notification */}
      <UpdateNotification />
    </>
  );
};
