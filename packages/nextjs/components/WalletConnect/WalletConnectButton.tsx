"use client";

import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { CheckIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { useAutoConnect } from "~~/hooks/scaffold-eth/useAutoConnect";

export const WalletConnectButton = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  useAutoConnect();

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowDropdown(false);
  };

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="relative">
      {isConnected ? (
        <div className="flex items-center gap-2">
          {/* Network selector */}
          <div className="hidden sm:block">
            <appkit-network-button />
          </div>

          {/* Connected account button */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="btn btn-primary btn-sm font-normal normal-case h-10 min-h-0 px-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 border-0 text-white hover:from-green-600 hover:to-emerald-700"
            >
              <div className="flex items-center gap-2">
                <BlockieAvatar address={address} size={24} className="rounded-full" />
                <span>{formatAddress(address || "")}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showDropdown ? "transform rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Dropdown menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-base-100 rounded-md shadow-lg border border-base-300 z-50">
                <div className="p-2">
                  <div className="px-4 py-2 text-sm text-base-content">
                    <div className="font-medium">Connected Wallet</div>
                    <div className="mt-1 text-sm opacity-70">{address}</div>
                  </div>

                  <div className="divider my-1" />

                  <button
                    onClick={handleCopyAddress}
                    className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-base-200 rounded-md"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="w-4 h-4 mr-2 text-green-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                        <span>Copy Address</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDisconnect}
                    className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-base-200 rounded-md text-red-500"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <appkit-button className="btn btn-primary btn-sm font-normal normal-case h-10 min-h-0 px-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 border-0 text-white hover:from-green-600 hover:to-emerald-700" />
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowDropdown(false)}
          role="button"
          tabIndex={0}
          aria-label="Close dropdown"
        />
      )}
    </div>
  );
};
