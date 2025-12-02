"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useAccount, useDisconnect } from "wagmi";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useWalletConnection } from "~~/hooks/scaffold-eth/useWalletConnection";
import { ConnectionError } from "~~/components/scaffold-eth/ConnectionError";

/**
 * Custom Wallet Connect Modal for Nuru
 *
 * Features:
 * - Auto-shows on first visit if wallet not connected
 * - Custom Nuru-themed design
 * - Popular wallets prominently displayed with mobile deep linking
 * - WalletConnect QR code support
 * - Mobile-optimized connection flow
 * - PWA install prompt
 * - App store badges for wallet installation
 */

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  connector?: string;
  mobileOnly?: boolean;
  installLink?: string;
  deepLink?: string;
  isInstalled?: boolean;
  isMobilePreferred?: boolean;
}

// Base wallet options configuration without the computed properties
const BASE_WALLET_OPTIONS: Omit<WalletOption, 'isInstalled' | 'deepLink'>[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "/wallets/metamask.svg",
    description: "Connect with MetaMask browser extension",
    connector: "io.metamask",
    isMobilePreferred: true,
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "/wallets/coinbase-wallet.png",
    description: "Connect with Coinbase Wallet",
    connector: "coinbaseWalletSDK",
    isMobilePreferred: true,
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: "/wallets/trust-wallet.png",
    description: "Connect with Trust Wallet",
    connector: "walletConnect",
    isMobilePreferred: true,
  },
  {
    id: "rainbow",
    name: "Rainbow",
    icon: "/wallets/rainbow-wallet.png",
    description: "Connect with Rainbow Wallet",
    connector: "walletConnect",
    isMobilePreferred: true,
  },
  {
    id: "walletconnect",
    name: "Other Wallets",
    icon: "/wallets/walletconnect.svg",
    description: "Scan QR code with any wallet",
    connector: "walletConnect",
  },
];

// Define the WalletConnectModal component
export const WalletConnectModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletOption | null>(null);
  
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connectWallet, retry, clearError, error, isConnecting, connectingWallet } = useWalletConnection();

  // Auto-show modal on first visit if not connected
  useEffect(() => {
    // Check if user has seen the modal before
    const hasSeenModal = localStorage.getItem("nuru_wallet_modal_shown");

    if (!isConnected && !hasSeenModal && !hasShownModal) {
      // Wait a bit for page to load
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShownModal(true);
        localStorage.setItem("nuru_wallet_modal_shown", "true");
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isConnected, hasShownModal]);

  // Close modal when wallet connects
  useEffect(() => {
    if (isConnected) {
      setIsOpen(false);
    }
  }, [isConnected]);

  const handleConnect = async (walletId: string) => {
    clearError();
    await connectWallet(walletId);
  };
  
  // Handle showing QR code for a specific wallet
  const handleShowQRCode = (wallet: WalletOption) => {
    setSelectedWallet(wallet);
    setShowQRCode(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleManualOpen = () => {
    setIsOpen(true);
  };

  // Don't render if already connected
  if (isConnected) {
    return null;
  }

  if (!isOpen) {
    // Show a small "Connect Wallet" button when modal is closed
    return (
      <button
        onClick={handleManualOpen}
        className="btn btn-primary bg-[#12B76A] hover:bg-[#0E7A4B] border-none text-white font-semibold px-6 rounded-full flex items-center gap-2"
      >
        <DevicePhoneMobileIcon className="w-5 h-5" />
        <span>Connect Wallet</span>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-base-100 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp">
          {/* Header */}
          <div className="sticky top-0 bg-base-100 border-b border-base-300 p-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-base-content flex items-center gap-2">
                <span className="text-2xl">✨</span>
                Connect Your Wallet
              </h2>
              <p className="text-sm text-base-content/60 mt-1">
                Choose how you want to connect to Nuru
              </p>
            </div>
            <button
              onClick={handleClose}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="px-6 pt-4">
              <ConnectionError
                error={error}
                onRetry={() => retry(connectingWallet || "metamask")}
                onDismiss={clearError}
              />
            </div>
          )}

          {/* Wallet Options */}
          <div className="p-6 space-y-3">
            {WALLET_OPTIONS.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet.id)}
                disabled={isConnecting}
                className="w-full p-4 rounded-xl border-2 border-base-300 hover:border-[#12B76A] hover:bg-[#12B76A]/5 transition-all duration-200 flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 rounded-xl bg-base-200 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  {isConnecting && connectingWallet === wallet.id ? (
                    <span className="loading loading-spinner loading-md"></span>
                  ) : (
                    <Image
                      src={wallet.icon}
                      alt={wallet.name}
                      width={32}
                      height={32}
                      className="rounded-lg"
                    />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-base-content group-hover:text-[#12B76A] transition-colors">
                    {wallet.name}
                  </h3>
                  <p className="text-sm text-base-content/60">
                    {isConnecting && connectingWallet === wallet.id ? "Connecting..." : wallet.description}
                  </p>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Scan this QR code with {selectedWallet.name} to connect
                </p>
                <button
                  onClick={() => setShowQRCode(false)}
                  className="text-sm text-[#12B76A] hover:underline"
                >
                  ← Back to wallet list
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-medium text-gray-500 mb-2">RECOMMENDED</h3>
                {sortedWalletOptions
                  .filter(wallet => wallet.isInstalled || wallet.isMobilePreferred)
                  .map((wallet) => (
                    <div
                      key={wallet.id}
                      className="group relative"
                    >
                      <button
                        onClick={() => handleConnect(wallet)}
                        disabled={isPending}
                        className={`w-full p-4 rounded-xl border-2 ${
                          wallet.isInstalled 
                            ? 'border-[#12B76A] bg-[#12B76A]/5' 
                            : 'border-base-300 hover:border-[#12B76A] hover:bg-[#12B76A]/5'
                        } transition-all duration-200 flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-base-200 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Image
                            src={wallet.icon}
                            alt={wallet.name}
                            width={32}
                            height={32}
                            className="rounded-lg"
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base-content group-hover:text-[#12B76A] transition-colors">
                              {wallet.name}
                            </h3>
                            {wallet.isInstalled && (
                              <span className="text-xs bg-[#12B76A]/10 text-[#12B76A] px-2 py-0.5 rounded-full">
                                Installed
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-base-content/60">
                            {wallet.description}
                          </p>
                        </div>
                        {isMobile && wallet.deepLink ? (
                          <span className="text-xs text-[#12B76A] flex items-center gap-1">
                            Open <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                          </span>
                        ) : (
                          <svg
                            className="w-5 h-5 text-base-content/40 group-hover:text-[#12B76A] transition-colors"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        )}
                      </button>
                      
                      {!wallet.isInstalled && isMobile && wallet.id !== 'walletconnect' && (
                        <div className="absolute -bottom-2 right-0">
                          <a
                            href={wallet.installLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] bg-black/80 text-white px-2 py-0.5 rounded-full hover:bg-black transition-colors flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Install {wallet.name}
                          </a>
                        </div>
                      )}
                    </div>
                  ))}

                <div className="pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">OTHER OPTIONS</h3>
                  <button
                    onClick={() => handleShowQRCode({ 
                      id: 'walletconnect', 
                      name: 'WalletConnect', 
                      icon: '/wallets/walletconnect.svg',
                      description: 'Scan with any wallet app',
                      connector: 'walletConnect'
                    })}
                    className="w-full p-4 rounded-xl border-2 border-base-300 hover:border-[#12B76A] hover:bg-[#12B76A]/5 transition-all duration-200 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-base-200 flex items-center justify-center flex-shrink-0">
                      <QrCodeIcon className="w-6 h-6 text-base-content/70" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-base-content">
                        QR Code
                      </h3>
                      <p className="text-sm text-base-content/60">
                        Scan with any wallet app
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 text-base-content/40 group-hover:text-[#12B76A] transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-base-300 p-6 bg-base-200/50">
            <div className="text-center space-y-2">
              <div className="space-y-2">
                <p className="text-xs text-base-content/60">
                  New to Ethereum wallets?{" "}
                  <a
                    href="https://ethereum.org/en/wallets/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#12B76A] hover:underline font-medium"
                  >
                    Learn more
                  </a>
                </p>
                {isMobile && (
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-xs text-base-content/60">
                      Install Nuru as an app:
                    </p>
                    <button 
                      className="text-xs text-[#12B76A] font-medium hover:underline"
                      onClick={() => {
                        // This will trigger the PWA install prompt if available
                        const event = new Event('show-pwa-install');
                        window.dispatchEvent(event);
                      }}
                    >
                      Add to Home Screen
                    </button>
                  </div>
                )}
                <p className="text-xs text-base-content/40">
                  By connecting, you agree to our Terms of Service
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
