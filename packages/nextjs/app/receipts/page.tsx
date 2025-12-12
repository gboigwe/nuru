"use client";

/**
 * Receipts Page
 *
 * Display and manage payment receipt NFTs
 */

import { ReceiptGallery } from "~~/components/nft/ReceiptGallery";

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
