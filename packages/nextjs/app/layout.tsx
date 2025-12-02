import { useEffect } from 'react';
'use client';

import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

// This is a workaround for the 'use client' directive with metadata
export const metadata = getMetadata({
  title: "Nuru - Light up your payments",
  description: "Voice-powered crypto remittances for Africa. Built with ✨ at ETH Accra 2024",
  themeColor: "#12B76A",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
});

// Service Worker Registration
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered with scope:', registration.scope);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              console.log('New content is available; please refresh.');
              // You can trigger a UI notification here
            }
          });
        }
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// Handle install prompt for PWA
const handleBeforeInstallPrompt = (e: Event) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  const deferredPrompt = e as any;
  
  // Show custom install button or UI element
  // You can store the event and show a custom install button
  window.dispatchEvent(new CustomEvent('show-pwa-install', { detail: deferredPrompt }));
};

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Register service worker
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker();
      
      // Listen for beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  return (
    <html suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Nuru" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nuru" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#12B76A" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#12B76A" />
        
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
