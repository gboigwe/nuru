"use client";

/**
 * Receipt Gallery
 *
 * Displays user's collection of payment receipt NFTs
 */

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";

interface Receipt {
  tokenId: bigint;
  sender: string;
  recipient: string;
  amount: bigint;
  currency: string;
  timestamp: bigint;
  transactionHash: string;
  tokenURI: string;
}

export const ReceiptGallery = () => {
  const { address } = useAccount();
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // Get user's receipt token IDs
  const { data: tokenIds } = useReadContract({
    address: process.env.NEXT_PUBLIC_PAYMENT_RECEIPT_CONTRACT as `0x${string}`,
    abi: [
      {
        inputs: [{ name: "owner", type: "address" }],
        name: "getReceiptsByOwner",
        outputs: [{ name: "", type: "uint256[]" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "getReceiptsByOwner",
    args: address ? [address] : undefined,
  });

  const handleDownload = (receipt: Receipt) => {
    // TODO: Download receipt image
    console.log("Download receipt:", receipt.tokenId);
  };

  const handleShare = (receipt: Receipt) => {
    // TODO: Share receipt
    if (navigator.share) {
      navigator.share({
        title: `Payment Receipt #${receipt.tokenId}`,
        text: `${receipt.amount} ${receipt.currency} payment receipt`,
        url: window.location.href,
      });
    }
  };

  const handleVerify = (receipt: Receipt) => {
    // TODO: Verify on blockchain
    const explorerUrl = `https://basescan.org/tx/${receipt.transactionHash}`;
    window.open(explorerUrl, "_blank");
  };

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-base-content/60">Connect your wallet to view your receipt NFTs</p>
      </div>
    );
  }

  if (!tokenIds || tokenIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-xl font-semibold mb-2">No Receipts Yet</h3>
        <p className="text-base-content/60">Your payment receipt NFTs will appear here</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold">My Payment Receipts</h2>
          <p className="text-base-content/60 mt-1">{tokenIds.length} receipt NFTs</p>
        </div>

        {/* Filter/Sort */}
        <select className="select select-bordered">
          <option>All Receipts</option>
          <option>Recent</option>
          <option>Highest Amount</option>
          <option>By Currency</option>
        </select>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tokenIds.map((tokenId) => (
          <ReceiptCard
            key={tokenId.toString()}
            tokenId={tokenId}
            onSelect={setSelectedReceipt}
            onDownload={handleDownload}
            onShare={handleShare}
            onVerify={handleVerify}
          />
        ))}
      </div>

      {/* Receipt Detail Modal */}
      {selectedReceipt && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              Receipt #{selectedReceipt.tokenId.toString()}
            </h3>

            {/* Receipt Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-sm text-base-content/60">Amount</span>
                <p className="font-semibold text-lg">
                  {selectedReceipt.amount.toString()} {selectedReceipt.currency}
                </p>
              </div>
              <div>
                <span className="text-sm text-base-content/60">Date</span>
                <p className="font-semibold">
                  {new Date(Number(selectedReceipt.timestamp) * 1000).toLocaleDateString()}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-base-content/60">From</span>
                <p className="font-mono text-sm">{selectedReceipt.sender}</p>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-base-content/60">To</span>
                <p className="font-mono text-sm">{selectedReceipt.recipient}</p>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-base-content/60">Transaction Hash</span>
                <p className="font-mono text-xs break-all">{selectedReceipt.transactionHash}</p>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setSelectedReceipt(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => handleDownload(selectedReceipt)}>
                Download
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelectedReceipt(null)} />
        </div>
      )}
    </div>
  );
};

// Receipt Card Component
interface ReceiptCardProps {
  tokenId: bigint;
  onSelect: (receipt: Receipt) => void;
  onDownload: (receipt: Receipt) => void;
  onShare: (receipt: Receipt) => void;
  onVerify: (receipt: Receipt) => void;
}

const ReceiptCard = ({ tokenId, onSelect, onDownload, onShare, onVerify }: ReceiptCardProps) => {
  // Get receipt data
  const { data: receipt } = useReadContract({
    address: process.env.NEXT_PUBLIC_PAYMENT_RECEIPT_CONTRACT as `0x${string}`,
    abi: [
      {
        inputs: [{ name: "tokenId", type: "uint256" }],
        name: "getReceipt",
        outputs: [
          {
            components: [
              { name: "sender", type: "address" },
              { name: "recipient", type: "address" },
              { name: "amount", type: "uint256" },
              { name: "currency", type: "string" },
              { name: "timestamp", type: "uint256" },
              { name: "transactionHash", type: "bytes32" },
            ],
            name: "",
            type: "tuple",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "getReceipt",
    args: [tokenId],
  });

  if (!receipt) {
    return (
      <div className="card bg-base-200 animate-pulse">
        <div className="card-body h-64"></div>
      </div>
    );
  }

  const [sender, recipient, amount, currency, timestamp, transactionHash] = receipt;

  const receiptData: Receipt = {
    tokenId,
    sender: sender as string,
    recipient: recipient as string,
    amount: amount as bigint,
    currency: currency as string,
    timestamp: timestamp as bigint,
    transactionHash: transactionHash as string,
    tokenURI: "",
  };

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
      <div className="card-body" onClick={() => onSelect(receiptData)}>
        <div className="flex justify-between items-start mb-2">
          <h3 className="card-title text-lg">Receipt #{tokenId.toString()}</h3>
          <span className="badge badge-primary">{currency}</span>
        </div>

        <div className="text-3xl font-bold text-primary mb-2">{amount.toString()}</div>

        <div className="text-sm space-y-1">
          <div>
            <span className="text-base-content/60">Date:</span>{" "}
            {new Date(Number(timestamp) * 1000).toLocaleDateString()}
          </div>
          <div>
            <span className="text-base-content/60">To:</span>{" "}
            <span className="font-mono text-xs">
              {recipient.slice(0, 6)}...{recipient.slice(-4)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="card-actions justify-end mt-4">
          <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(receiptData);
            }}
          >
            Download
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onShare(receiptData);
            }}
          >
            Share
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onVerify(receiptData);
            }}
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
};
