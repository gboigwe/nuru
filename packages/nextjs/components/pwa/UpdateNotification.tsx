"use client";

/**
 * App Update Notification Component
 *
 * Notifies users when a new version is available
 */

import { useEffect, useState } from "react";

export const UpdateNotification = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Check for service worker updates
    const checkForUpdates = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        setRegistration(reg);

        // Check for updates every hour
        setInterval(() => {
          reg.update();
        }, 60 * 60 * 1000);

        // Listen for updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;

          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New service worker available
                console.log("🔄 New app version available");
                setShowUpdate(true);
              }
            });
          }
        });
      } catch (error) {
        console.error("Service worker check failed:", error);
      }
    };

    checkForUpdates();

    // Listen for controller change (new SW activated)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("🔄 New service worker activated");
      window.location.reload();
    });
  }, []);

  const handleUpdate = () => {
    if (!registration || !registration.waiting) {
      return;
    }

    // Tell the waiting service worker to skip waiting
    registration.waiting.postMessage({ type: "SKIP_WAITING" });

    setShowUpdate(false);
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="alert alert-info shadow-2xl">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-start gap-2">
            <span className="text-2xl">🔄</span>
            <div className="flex-1">
              <h3 className="font-bold">Update Available</h3>
              <p className="text-sm mt-1">
                A new version of Nuru is available. Update now for the latest features and improvements.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="btn btn-sm btn-primary flex-1"
              onClick={handleUpdate}
            >
              Update Now
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={handleDismiss}
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
