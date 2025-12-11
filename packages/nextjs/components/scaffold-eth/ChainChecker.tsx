"use client";

import { useAppKitNetwork } from "@reown/appkit/react";
import { ReactNode } from "react";

/**
 * ChainChecker Component
 * 
 * Conditionally renders children based on the current connected chain.
 * Useful for showing/hiding features based on network.
 */

interface ChainCheckerProps {
    children: ReactNode;
    allowedChainIds?: number[];
    fallback?: ReactNode;
}

export const ChainChecker = ({
    children,
    allowedChainIds = [],
    fallback = null
}: ChainCheckerProps) => {
    const { chainId } = useAppKitNetwork();

    if (!chainId) {
        return <>{fallback}</>;
    }

    const isAllowed = allowedChainIds.length === 0 || allowedChainIds.includes(Number(chainId));

    return <>{isAllowed ? children : fallback}</>;
};
