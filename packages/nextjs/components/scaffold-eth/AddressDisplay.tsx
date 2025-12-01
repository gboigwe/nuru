"use client";

import { useAppKitAccount } from "@reown/appkit/react";
import { Address } from "./Address/Address";

/**
 * AddressDisplay Component
 * 
 * Displays the connected wallet address with optional ENS name resolution.
 * Wrapper around the existing Address component with Reown AppKit integration.
 */

interface AddressDisplayProps {
    className?: string;
    format?: "short" | "long";
    disableAddressLink?: boolean;
}

export const AddressDisplay = ({
    className = "",
    format = "short",
    disableAddressLink = false
}: AddressDisplayProps) => {
    const { address, isConnected } = useAppKitAccount();

    if (!isConnected || !address) {
        return null;
    }

    return (
        <div className={className}>
            <Address
                address={address as `0x${string}`}
                format={format}
                disableAddressLink={disableAddressLink}
            />
        </div>
    );
};
