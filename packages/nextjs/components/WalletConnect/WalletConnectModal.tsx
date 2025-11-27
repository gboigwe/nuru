"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { XMarkIcon } from "@heroicons/react/24/outline";

/**
 * Custom Wallet Connect Modal for Nuru
 *
 * Features:
 * - Auto-shows on first visit if wallet not connected
 * - Custom Nuru-themed design
 * - Popular wallets prominently displayed
 * - WalletConnect QR code support
 * - Mobile responsive
 */

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  connector?: string;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
    description: "Connect with MetaMask browser extension",
    connector: "io.metamask",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "https://altcoinsbox.com/wp-content/uploads/2023/03/coinbase-wallet-logo.png",
    description: "Connect with Coinbase Wallet",
    connector: "coinbaseWalletSDK",
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: "https://trustwallet.com/assets/images/media/assets/TWT.png",
    description: "Connect with Trust Wallet mobile app",
    connector: "walletConnect",
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    icon: "https://altcoinsbox.com/wp-content/uploads/2023/03/walletconnect-logo.webp",
    description: "Scan QR code with any mobile wallet",
    connector: "walletConnect",
  },
];

export const WalletConnectModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

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
    try {
      // Find the appropriate connector
      const connector = connectors.find(c => {
        const connectorId = c.id.toLowerCase();
        const walletOption = WALLET_OPTIONS.find(w => w.id === walletId);

        if (walletId === "metamask") {
          return connectorId.includes("metamask") || c.name.toLowerCase().includes("metamask");
        }
        if (walletId === "coinbase") {
          return connectorId.includes("coinbase") || c.name.toLowerCase().includes("coinbase");
        }
        if (walletId === "walletconnect" || walletId === "trust") {
          return connectorId.includes("walletconnect") || c.name.toLowerCase().includes("walletconnect");
        }

        return false;
      });

      if (connector) {
        await connect({ connector });
      } else {
        // Fallback: use first available connector (usually WalletConnect)
        if (connectors.length > 0) {
          await connect({ connector: connectors[0] });
        }
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
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
        className="btn btn-primary bg-[#12B76A] hover:bg-[#0E7A4B] border-none text-white font-semibold px-6 rounded-full"
      >
        Connect Wallet
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

          {/* Wallet Options */}
          <div className="p-6 space-y-3">
            {WALLET_OPTIONS.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet.id)}
                disabled={isPending}
                className="w-full p-4 rounded-xl border-2 border-base-300 hover:border-[#12B76A] hover:bg-[#12B76A]/5 transition-all duration-200 flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <h3 className="font-semibold text-base-content group-hover:text-[#12B76A] transition-colors">
                    {wallet.name}
                  </h3>
                  <p className="text-sm text-base-content/60">
                    {wallet.description}
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
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-base-300 p-6 bg-base-200/50">
            <div className="text-center space-y-2">
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
              <p className="text-xs text-base-content/40">
                By connecting, you agree to our Terms of Service
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
