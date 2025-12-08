"use client";

/**
 * PWA Install Prompt Component
 *
 * Prompts users to install the app
 */

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after 30 seconds (or on user action)
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log("✅ PWA installed");
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response: ${outcome}`);

    if (outcome === "accepted") {
      console.log("✅ User accepted the install prompt");
    } else {
      console.log("❌ User dismissed the install prompt");
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);

    // Don't show again for 7 days
    localStorage.setItem("nuru_install_prompt_dismissed", Date.now().toString());
  };

  // Don't show if installed or no prompt available
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  // Check if user dismissed recently
  const dismissed = localStorage.getItem("nuru_install_prompt_dismissed");
  if (dismissed) {
    const dismissedTime = parseInt(dismissed);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    if (dismissedTime > sevenDaysAgo) {
      return null;
    }
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:max-w-sm">
      <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-2xl">
        <div className="card-body p-4">
          <div className="flex items-start gap-3">
            <div className="text-3xl">📱</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Install Nuru App</h3>
              <p className="text-sm opacity-90 mt-1">
                Install Nuru for faster access, offline support, and a better mobile experience.
              </p>

              <div className="flex gap-2 mt-4">
                <button
                  className="btn btn-sm bg-white text-primary hover:bg-base-200 flex-1"
                  onClick={handleInstallClick}
                >
                  Install
                </button>
                <button
                  className="btn btn-sm btn-ghost text-white hover:bg-white/20"
                  onClick={handleDismiss}
                >
                  Not now
                </button>
              </div>
            </div>

            <button
              className="btn btn-ghost btn-sm btn-circle text-white"
              onClick={handleDismiss}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
