"use client";

import { useAppKitAccount, useAppKit } from "@reown/appkit/react";

/**
 * WalletStatus Component
 * 
 * Displays wallet connection status with connect/disconnect actions.
 * Provides a simple UI for wallet connection state.
 */

interface WalletStatusProps {
    className?: string;
    showAddress?: boolean;
}

export const WalletStatus = ({ className = "", showAddress = true }: WalletStatusProps) => {
    const { address, isConnected } = useAppKitAccount();
    const { open } = useAppKit();

    if (!isConnected) {
        return (
            <button
                onClick={() => open()}
                className={`btn btn-primary ${className}`}
            >
                Connect Wallet
            </button>
        );
    }

    const shortAddress = address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : "";

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="badge badge-success gap-2">
                <div className="w-2 h-2 rounded-full bg-success-content animate-pulse"></div>
                Connected
            </div>
            {showAddress && address && (
                <span className="font-mono text-sm">{shortAddress}</span>
            )}
        </div>
    );
};
