"use client";

/**
 * Reown AppKit Connect Button for Nuru
 * Replaces RainbowKitCustomConnectButton with Reown's wallet connection UI
 *
 * Features:
 * - Wallet connection modal with all major wallets
 * - Account management (balance, address, disconnect)
 * - Network switching (Base Sepolia ↔ Mainnet)
 * - Styled to match Nuru's green theme
 */
export const ReownConnectButton = () => {
  return (
    <div className="flex items-center gap-2">
      {/* Network selector button - allows switching between Base Sepolia and Mainnet */}
      <div className="hidden sm:block">
        <appkit-network-button />
      </div>

      {/* Main wallet connect button - handles connection, account, and disconnection */}
      <appkit-button />
    </div>
  );
};
