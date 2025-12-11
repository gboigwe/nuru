"use client";

import { useBalance } from "wagmi";
import { useAppKitAccount } from "@reown/appkit/react";

/**
 * WalletBalance Component
 * 
 * Displays the current wallet's native token balance with formatting.
 * Uses Reown AppKit hooks for account info and Wagmi for balance fetching.
 */

interface WalletBalanceProps {
    className?: string;
    showSymbol?: boolean;
    decimals?: number;
}

export const WalletBalance = ({ className = "", showSymbol = true, decimals = 4 }: WalletBalanceProps) => {
    const { address, isConnected } = useAppKitAccount();
    const { data: balance, isLoading } = useBalance({
        address: address as `0x${string}`,
    });

    if (!isConnected || !address) {
        return null;
    }

    if (isLoading) {
        return (
            <div className={`animate-pulse ${className}`}>
                <div className="h-6 w-24 bg-base-300 rounded"></div>
            </div>
        );
    }

    const formattedBalance = balance
        ? parseFloat(balance.formatted).toFixed(decimals)
        : "0.0000";

    return (
        <div className={`font-mono ${className}`}>
            {formattedBalance}
            {showSymbol && balance && <span className="ml-1 text-sm opacity-70">{balance.symbol}</span>}
        </div>
    );
};
