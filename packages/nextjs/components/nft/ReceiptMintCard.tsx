"use client";

/**
 * Receipt Mint Card
 *
 * Component for minting payment receipt NFTs
 */

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import type { PaymentReceiptData } from "~~/services/nft";
import { receiptImageGenerator, receiptMetadataService } from "~~/services/nft";

interface ReceiptMintCardProps {
  receiptData: PaymentReceiptData;
  onMinted?: (tokenId: bigint) => void;
  onError?: (error: Error) => void;
}

export const ReceiptMintCard = ({ receiptData, onMinted, onError }: ReceiptMintCardProps) => {
  const { address } = useAccount();
  const [isMinting, setIsMinting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleMint = async () => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    setIsMinting(true);
    setError(null);

    try {
      // Generate receipt image
      const imageDataUrl = await receiptImageGenerator.generateImage(receiptData);
      setImageUrl(imageDataUrl);

      // TODO: Upload image to IPFS
      const imageUri = `ipfs://placeholder_${Date.now()}`;

      // Generate metadata
      const metadata = receiptMetadataService.generateMetadata(receiptData, imageUri);

      // TODO: Upload metadata to IPFS
      const metadataUri = await receiptMetadataService.uploadToIPFS(metadata);

      // Convert transaction hash to bytes32
      const txHashBytes = receiptData.transactionHash as `0x${string}`;

      // Mint NFT
      writeContract({
        address: process.env.NEXT_PUBLIC_PAYMENT_RECEIPT_CONTRACT as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: "to", type: "address" },
              { name: "sender", type: "address" },
              { name: "recipient", type: "address" },
              { name: "amount", type: "uint256" },
              { name: "currency", type: "string" },
              { name: "txHash", type: "bytes32" },
              { name: "tokenURI", type: "string" },
            ],
            name: "mintReceipt",
            outputs: [{ name: "tokenId", type: "uint256" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "mintReceipt",
        args: [
          address,
          receiptData.sender as `0x${string}`,
          receiptData.recipient as `0x${string}`,
          BigInt(receiptData.amount),
          receiptData.currency,
          txHashBytes,
          metadataUri,
        ],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to mint receipt";
      setError(errorMessage);
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      setIsMinting(false);
    }
  };

  // Handle successful mint
  if (isSuccess && onMinted) {
    // Extract token ID from transaction receipt
    // onMinted(tokenId);
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Mint Payment Receipt NFT</h2>

        <p className="text-base-content/70">
          Create a permanent, verifiable proof of your payment on the blockchain as an NFT.
        </p>

        {/* Receipt Preview */}
        <div className="bg-base-200 rounded-lg p-6 my-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-base-content/60">Amount:</span>
              <p className="font-semibold">
                {receiptData.amount} {receiptData.currency}
              </p>
            </div>
            <div>
              <span className="text-base-content/60">Date:</span>
              <p className="font-semibold">{new Date(receiptData.timestamp).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-base-content/60">From:</span>
              <p className="font-mono text-xs">
                {receiptData.sender.slice(0, 6)}...{receiptData.sender.slice(-4)}
              </p>
            </div>
            <div>
              <span className="text-base-content/60">To:</span>
              <p className="font-mono text-xs">
                {receiptData.recipient.slice(0, 6)}...{receiptData.recipient.slice(-4)}
              </p>
            </div>
          </div>
        </div>

        {/* Image Preview */}
        {imageUrl && (
          <div className="mt-4">
            <img src={imageUrl} alt="Receipt preview" className="w-full max-w-md mx-auto rounded-lg" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="card-actions justify-end mt-4">
          {!address ? (
            <div className="text-sm text-base-content/60">Connect your wallet to mint</div>
          ) : isConfirming ? (
            <button className="btn btn-primary" disabled>
              <span className="loading loading-spinner loading-sm"></span>
              Confirming...
            </button>
          ) : isSuccess ? (
            <div className="flex flex-col items-end">
              <div className="text-success mb-2">✓ Receipt NFT minted successfully!</div>
              <button className="btn btn-sm btn-ghost" onClick={() => window.location.reload()}>
                View in Gallery
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleMint}
              disabled={isMinting || !address}
            >
              {isMinting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Generating...
                </>
              ) : (
                "Mint Receipt NFT"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
