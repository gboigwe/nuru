"use client";

import { useAppKit } from "@reown/appkit/react";

/**
 * NetworkSwitcher Component
 * 
 * Button to open the network selection modal.
 * Allows users to switch between configured networks.
 */

interface NetworkSwitcherProps {
    className?: string;
    label?: string;
}

export const NetworkSwitcher = ({
    className = "",
    label = "Switch Network"
}: NetworkSwitcherProps) => {
    const { open } = useAppKit();

    return (
        <button
            onClick={() => open({ view: "Networks" })}
            className={`btn btn-outline ${className}`}
        >
            {label}
        </button>
    );
};
