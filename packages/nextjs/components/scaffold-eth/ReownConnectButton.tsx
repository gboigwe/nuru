"use client";

/**
 * Reown AppKit Connect Button for Nuru
 * Replaces RainbowKitCustomConnectButton with Reown's wallet connection UI
 */
export const ReownConnectButton = () => {
  return (
    <div className="flex items-center">
      {/* Reown AppKit button - automatically provides wallet connection UI */}
      <appkit-button />
    </div>
  );
};
