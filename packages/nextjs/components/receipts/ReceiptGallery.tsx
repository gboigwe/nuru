"use client";

/**
 * Receipt Gallery Component
 *
 * Displays a gallery of stored voice receipts
 * Allows users to view, play, verify, and download receipts
 */

import { useEffect, useState } from "react";
import { receiptRetrievalService } from "~~/services/storage/ReceiptRetrievalService";
import { receiptVerificationService } from "~~/services/storage/ReceiptVerificationService";
import type { ReceiptPackage, VerificationResult } from "~~/services/storage/ReceiptVerificationService";

interface ReceiptGalleryProps {
  receipts: ReceiptPackage[];
  onPlay?: (cid: string) => void;
  onDownload?: (cid: string) => void;
  onVerify?: (cid: string) => void;
}

interface ReceiptCardData extends ReceiptPackage {
  audioUrl?: string;
  verified?: VerificationResult;
  loading?: boolean;
}

export const ReceiptGallery = ({ receipts, onPlay, onDownload, onVerify }: ReceiptGalleryProps) => {
  const [receiptData, setReceiptData] = useState<ReceiptCardData[]>([]);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    // Initialize receipt data
    setReceiptData(receipts.map(r => ({ ...r })));
  }, [receipts]);

  const handlePlay = async (receipt: ReceiptCardData) => {
    // Create playable URL if not already created
    if (!receipt.audioUrl) {
      const url = await receiptRetrievalService.createPlayableUrl(receipt.cid);

      if (url) {
        setReceiptData(prev =>
          prev.map(r => (r.cid === receipt.cid ? { ...r, audioUrl: url } : r)),
        );
      }
    }

    onPlay?.(receipt.cid);
  };

  const handleDownload = async (receipt: ReceiptCardData) => {
    const filename = `voice-receipt-${receipt.cid.slice(0, 8)}.webm`;
    await receiptRetrievalService.downloadReceipt(receipt.cid, filename);
    onDownload?.(receipt.cid);
  };

  const handleVerify = async (receipt: ReceiptCardData) => {
    setVerifying(receipt.cid);

    try {
      const result = await receiptVerificationService.verifyReceipt(receipt);

      setReceiptData(prev =>
        prev.map(r => (r.cid === receipt.cid ? { ...r, verified: result } : r)),
      );

      onVerify?.(receipt.cid);
    } catch (error) {
      console.error("Verification failed:", error);
    } finally {
      setVerifying(null);
    }
  };

  if (receipts.length === 0) {
    return (
      <div className="card bg-base-200 p-8 text-center">
        <p className="text-base-content/60">No voice receipts yet</p>
        <p className="text-sm text-base-content/40 mt-2">
          Your payment receipts will appear here after transactions
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {receiptData.map(receipt => (
        <ReceiptCard
          key={receipt.cid}
          receipt={receipt}
          onPlay={() => handlePlay(receipt)}
          onDownload={() => handleDownload(receipt)}
          onVerify={() => handleVerify(receipt)}
          verifying={verifying === receipt.cid}
        />
      ))}
    </div>
  );
};

interface ReceiptCardProps {
  receipt: ReceiptCardData;
  onPlay: () => void;
  onDownload: () => void;
  onVerify: () => void;
  verifying: boolean;
}

const ReceiptCard = ({ receipt, onPlay, onDownload, onVerify, verifying }: ReceiptCardProps) => {
  const { metadata, verified, audioUrl } = receipt;

  return (
    <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
      <div className="card-body p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-base">
              {metadata.amount} {metadata.currency}
            </h3>
            <p className="text-xs text-base-content/60 mt-1">
              {new Date(metadata.timestamp).toLocaleDateString()}
            </p>
          </div>

          {/* Verification Badge */}
          {verified && (
            <div
              className={`badge badge-sm ${verified.valid ? "badge-success" : "badge-error"}`}
            >
              {verified.valid ? "✓ Verified" : "✗ Invalid"}
            </div>
          )}
        </div>

        {/* Transaction Details */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-base-content/60">From:</span>
            <span className="font-mono text-base-content/80">
              {metadata.sender.slice(0, 6)}...{metadata.sender.slice(-4)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-base-content/60">To:</span>
            <span className="font-mono text-base-content/80">
              {metadata.recipient.slice(0, 6)}...{metadata.recipient.slice(-4)}
            </span>
          </div>

          {metadata.voiceCommand && (
            <div className="text-xs">
              <span className="text-base-content/60">Command:</span>
              <p className="italic text-base-content/80 mt-1">"{metadata.voiceCommand}"</p>
            </div>
          )}
        </div>

        {/* Audio Player */}
        {audioUrl && (
          <div className="mb-3">
            <audio controls className="w-full h-8" src={audioUrl}>
              Your browser does not support audio playback.
            </audio>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-2">
          <button
            className="btn btn-sm btn-primary flex-1"
            onClick={onPlay}
            disabled={!!audioUrl}
          >
            {audioUrl ? "▶ Playing" : "▶ Play"}
          </button>

          <button
            className="btn btn-sm btn-ghost"
            onClick={onDownload}
            title="Download receipt"
          >
            ⬇
          </button>

          <button
            className="btn btn-sm btn-ghost"
            onClick={onVerify}
            disabled={verifying || !!verified}
            title="Verify receipt"
          >
            {verifying ? "..." : verified ? "✓" : "🔍"}
          </button>
        </div>

        {/* Verification Details */}
        {verified && !verified.valid && (
          <div className="mt-3 p-2 bg-error/10 rounded text-xs">
            <p className="font-semibold text-error mb-1">Verification Issues:</p>
            <ul className="list-disc list-inside text-error/80">
              {verified.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* IPFS Link */}
        <div className="mt-2 pt-2 border-t border-base-300">
          <a
            href={`https://ipfs.io/ipfs/${receipt.cid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <span>View on IPFS</span>
            <span>↗</span>
          </a>
        </div>
      </div>
    </div>
  );
};
