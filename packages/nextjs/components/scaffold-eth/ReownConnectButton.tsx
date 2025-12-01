"use client";

import { WalletConnectButton } from "~~/components/WalletConnect/WalletConnectButton";

/**
 * Reown AppKit Connect Button for Nuru
 * Replaces RainbowKitCustomConnectButton with Reown's wallet connection UI
 *
 * Features:
 * - Wallet connection modal with all major wallets
 * - Account management (balance, address, disconnect)
 * - Network switching (Base Sepolia ↔ Mainnet)
 * - Mobile-friendly responsive design
 * - Styled to match Nuru's green theme
 */
export const ReownConnectButton = () => {
  return (
    <div className="flex items-center gap-2">
      {/* Network selector button - allows switching between Base Sepolia and Mainnet */}
      {/* Show on all screen sizes for better mobile experience */}
      <div className="flex-shrink-0">
        <appkit-network-button />
      </div>

      {/* Main wallet connect button - handles connection, account, and disconnection */}
      <div className="flex-shrink-0">
        <appkit-button />
      </div>
    </div>
  );
};

export default ReownConnectButton;
