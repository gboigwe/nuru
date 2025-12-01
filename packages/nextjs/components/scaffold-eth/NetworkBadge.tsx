"use client";

import { useAppKitNetwork } from "@reown/appkit/react";

/**
 * NetworkBadge Component
 * 
 * Displays the current connected network as a badge.
 * Uses Reown AppKit hooks for network information.
 */

interface NetworkBadgeProps {
    className?: string;
    showIcon?: boolean;
}

export const NetworkBadge = ({ className = "", showIcon = true }: NetworkBadgeProps) => {
    const { chainId, caipNetwork } = useAppKitNetwork();

    if (!chainId) {
        return null;
    }

    const networkName = caipNetwork?.name || "Unknown Network";

    return (
        <div className={`badge badge-primary gap-2 ${className}`}>
            {showIcon && (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="inline-block w-4 h-4 stroke-current"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                </svg>
            )}
            <span>{networkName}</span>
        </div>
    );
};
