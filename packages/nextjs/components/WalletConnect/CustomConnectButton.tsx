"use client";

import { useState } from "react";
import { useAccount, useDisconnect, useEnsName, useEnsAvatar } from "wagmi";
import { mainnet } from "viem/chains";
import { ChevronDownIcon, ArrowRightOnRectangleIcon, DocumentDuplicateIcon, CheckIcon } from "@heroicons/react/24/outline";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { WalletConnectModal } from "./WalletConnectModal";

/**
 * Custom Connect Button for Nuru
 *
 * Shows:
 * - "Connect Wallet" button when disconnected (opens custom modal)
 * - Account dropdown when connected (address, balance, disconnect)
 * - ENS name/avatar if available
 * - Copy address functionality
 */

export const CustomConnectButton = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: ensName } = useEnsName({
    address,
    chainId: mainnet.id,
  });

  const { data: ensAvatar } = useEnsAvatar({
    name: ensName,
    chainId: mainnet.id,
  });

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

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Not connected - show WalletConnectModal button
  if (!isConnected || !address) {
    return <WalletConnectModal />;
  }

  // Connected - show account dropdown
  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="btn btn-sm bg-base-200 hover:bg-base-300 border-base-300 gap-2 rounded-full px-4 h-10"
      >
        <BlockieAvatar address={address} ensImage={ensAvatar} size={24} />
        <span className="font-medium hidden sm:inline">
          {ensName || formatAddress(address)}
        </span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-base-100 rounded-xl shadow-xl border border-base-300 z-50 overflow-hidden">
            {/* Account Info */}
            <div className="p-4 bg-base-200/50 border-b border-base-300">
              <div className="flex items-center gap-3 mb-2">
                <BlockieAvatar address={address} ensImage={ensAvatar} size={40} />
                <div className="flex-1 min-w-0">
                  {ensName && (
                    <p className="font-semibold text-base-content truncate">
                      {ensName}
                    </p>
                  )}
                  <p className="text-sm text-base-content/60 font-mono">
                    {formatAddress(address)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={handleCopyAddress}
                className="w-full px-4 py-2 text-left hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckIcon className="w-5 h-5 text-success" />
                    <span className="text-sm text-success font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <DocumentDuplicateIcon className="w-5 h-5 text-base-content/60" />
                    <span className="text-sm text-base-content">Copy Address</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDisconnect}
                className="w-full px-4 py-2 text-left hover:bg-error/10 rounded-lg flex items-center gap-3 transition-colors text-error"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Disconnect</span>
              </button>
            </div>

            {/* Footer */}
            <div className="p-3 bg-base-200/30 border-t border-base-300">
              <p className="text-xs text-base-content/40 text-center">
                Connected to Nuru ✨
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
