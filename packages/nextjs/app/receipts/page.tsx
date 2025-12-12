"use client";

/**
 * Receipts Page
 *
 * Display and manage payment receipt NFTs
 */

import dynamic from "next/dynamic";

// Dynamic import for ReceiptGallery to reduce initial bundle size
const ReceiptGallery = dynamic(() => import("~~/components/nft/ReceiptGallery").then(mod => ({ default: mod.ReceiptGallery })), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  ),
  ssr: false,
});

export default function ReceiptsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Payment Receipts</h1>
        <p className="text-base-content/70">
          Your collection of payment receipt NFTs - permanent proof of your transactions
        </p>
      </div>

      <ReceiptGallery />
    </div>
  );
}
