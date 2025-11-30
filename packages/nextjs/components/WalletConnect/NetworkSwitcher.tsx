"use client";

import { useState } from "react";
import { useAccount, useSwitchChain, useChainId } from "wagmi";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { baseSepolia, mainnet } from "viem/chains";

/**
 * Network Switcher for Nuru
 *
 * Allows users to switch between:
 * - Base Sepolia (for transactions)
 * - Mainnet (for ENS resolution)
 */

const SUPPORTED_NETWORKS = [
  {
    id: baseSepolia.id,
    name: "Base Sepolia",
    shortName: "Base",
    icon: "🔵",
    description: "Test network for transactions",
  },
  {
    id: mainnet.id,
    name: "Ethereum Mainnet",
    shortName: "Ethereum",
    icon: "⟠",
    description: "For ENS name resolution",
  },
];

export const NetworkSwitcher = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const [showDropdown, setShowDropdown] = useState(false);

  const currentNetwork = SUPPORTED_NETWORKS.find(n => n.id === chainId) || SUPPORTED_NETWORKS[0];

  const handleSwitchNetwork = async (networkId: number) => {
    try {
      await switchChain({ chainId: networkId });
      setShowDropdown(false);
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  // Don't show if not connected
  if (!isConnected) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isPending}
        className="btn btn-sm bg-base-200 hover:bg-base-300 border-base-300 gap-2 rounded-full px-4 h-10 disabled:opacity-50"
      >
        <span className="text-lg">{currentNetwork.icon}</span>
        <span className="font-medium hidden md:inline">{currentNetwork.shortName}</span>
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
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-semibold text-base-content/60 uppercase">
                Select Network
              </p>
              {SUPPORTED_NETWORKS.map((network) => {
                const isActive = network.id === chainId;
                return (
                  <button
                    key={network.id}
                    onClick={() => handleSwitchNetwork(network.id)}
                    disabled={isActive || isPending}
                    className={`w-full px-3 py-2 text-left rounded-lg flex items-center gap-3 transition-colors ${
                      isActive
                        ? "bg-[#12B76A]/10 text-[#12B76A]"
                        : "hover:bg-base-200"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="text-2xl">{network.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{network.name}</p>
                      <p className="text-xs text-base-content/60">
                        {network.description}
                      </p>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-[#12B76A]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
