"use client";

import { WalletConnectButton } from "~~/components/WalletConnect/WalletConnectButton";

/**
 * Reown AppKit Connect Button for Nuru
 * Wrapper around the consolidated WalletConnectButton for backward compatibility
 * 
 * @deprecated Use WalletConnectButton directly instead
 */
export const ReownConnectButton = () => {
  return <WalletConnectButton />;
};

export default ReownConnectButton;
