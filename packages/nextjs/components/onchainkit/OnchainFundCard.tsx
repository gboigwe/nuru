"use client";

import { FundButton } from "@coinbase/onchainkit/fund";
import "@coinbase/onchainkit/styles.css";

interface OnchainFundCardProps {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export function OnchainFundCard({ onSuccess, onError }: OnchainFundCardProps) {
  return (
    <div className="w-full">
      <FundButton
        className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all"
        text="Add Funds"
        onSuccess={() => {
          console.log("Funding successful");
          onSuccess?.();
        }}
        onError={(error: unknown) => {
          console.error("Funding error:", error);
          onError?.(error);
        }}
      />
    </div>
  );
}
