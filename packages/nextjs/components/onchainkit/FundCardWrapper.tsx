"use client";

import { FundButton, getOnrampBuyUrl } from "@coinbase/onchainkit/fund";
import "@coinbase/onchainkit/styles.css";
import { useAccount } from "wagmi";

/**
 * FundCardWrapper Component
 *
 * OnchainKit-powered on-ramp component for buying USDC
 * Integrates with Coinbase Pay for easy fiat-to-crypto
 */

interface FundCardWrapperProps {
  targetAmount?: number;
  onSuccess?: () => void;
  className?: string;
}

export function FundCardWrapper({
  targetAmount,
  onSuccess,
  className = "",
}: FundCardWrapperProps) {
  const { address } = useAccount();

  if (!address) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <p className="text-yellow-800 text-sm">
          Please connect your wallet to add funds
        </p>
      </div>
    );
  }

  const fundingUrl = getOnrampBuyUrl({
    projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID || "",
    addresses: { [address]: ["base"] },
    assets: ["USDC"],
    presetFiatAmount: targetAmount || 50,
    fiatCurrency: "USD",
  });

  const handleSuccess = () => {
    console.log("✅ Funding successful");
    onSuccess?.();
  };

  return (
    <div className={`bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white ${className}`}>
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">💳</div>
        <h3 className="text-xl font-bold mb-2">Add Funds to Your Wallet</h3>
        <p className="text-blue-100 text-sm">
          {targetAmount
            ? `You need $${targetAmount} USDC to complete this payment`
            : "Buy USDC with your debit card or bank account"}
        </p>
      </div>

      <FundButton
        fundingUrl={fundingUrl}
        onSuccess={handleSuccess}
        text="Buy USDC"
        className="w-full bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
      />

      <div className="mt-4 space-y-1 text-sm text-blue-100">
        <div className="flex items-center gap-2">
          <span>💳</span>
          <span>Debit card, bank transfer, or Apple/Google Pay</span>
        </div>
        <div className="flex items-center gap-2">
          <span>⚡</span>
          <span>USDC available in seconds</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🔒</span>
          <span>Powered by Coinbase Pay</span>
        </div>
      </div>
    </div>
  );
}

/**
 * InlineFundButton Component
 *
 * Compact fund button for inline use
 */

interface InlineFundButtonProps {
  amount?: number;
  onSuccess?: () => void;
}

export function InlineFundButton({ amount, onSuccess }: InlineFundButtonProps) {
  const { address } = useAccount();

  if (!address) return null;

  const fundingUrl = getOnrampBuyUrl({
    projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID || "",
    addresses: { [address]: ["base"] },
    assets: ["USDC"],
    presetFiatAmount: amount || 50,
    fiatCurrency: "USD",
  });

  return (
    <FundButton
      fundingUrl={fundingUrl}
      onSuccess={onSuccess}
      text={amount ? `Buy $${amount} USDC` : "Add Funds"}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    />
  );
}
