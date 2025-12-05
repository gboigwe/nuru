"use client";

import { FundButton } from "@coinbase/onchainkit/fund";
import "@coinbase/onchainkit/styles.css";

export function OnchainFundCard() {
  return (
    <div className="w-full">
      <FundButton
        className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all"
        text="Add Funds"
      />
    </div>
  );
}
