"use client";

import React from "react";
import { PaymentExecutionResult } from "../../services/payment/PaymentExecutor";

interface TransactionStatusProps {
  result: PaymentExecutionResult;
  onReset: () => void;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({ result, onReset }) => {
  // Format transaction hash for display
  const formatTxHash = (hash: string): string => {
    if (hash.length <= 10) return hash;
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  // Format amount for display
  const formatAmount = (amount?: string): string => {
    if (!amount) return "N/A";
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return amount;
    return numAmount.toLocaleString();
  };

  // Get Base Sepolia explorer URL
  const getExplorerUrl = (txHash: string): string => {
    return `https://sepolia.basescan.org/tx/${txHash}`;
  };

  const isSuccess = result.success;
  const isError = !result.success;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
      {/* Status Header */}
      <div className="text-center">
        <div className={`text-6xl mb-4 ${isSuccess ? "animate-bounce" : "animate-pulse"}`}>
          {isSuccess ? "✅" : "❌"}
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${isSuccess ? "text-green-600" : "text-red-600"}`}>
          {isSuccess ? "Payment Successful!" : "Payment Failed"}
        </h2>
        <p className={`text-sm ${isSuccess ? "text-green-700" : "text-red-700"}`}>
          {isSuccess
            ? "Your voice payment was processed successfully"
            : result.error || "Something went wrong with your payment"}
        </p>
      </div>

      {/* Transaction Details */}
      {isSuccess && (
        <div className="space-y-4">
          {/* Transaction Hash */}
          {result.transactionHash && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Transaction Hash</p>
                  <p className="font-mono text-sm text-green-600">{formatTxHash(result.transactionHash)}</p>
                </div>
                <a
                  href={getExplorerUrl(result.transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                >
                  View 🔗
                </a>
              </div>
            </div>
          )}

          {/* Order ID */}
          {result.orderId && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="text-lg">🧾</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">Order ID</p>
                  <p className="font-mono text-sm text-blue-600">#{result.orderId}</p>
                </div>
              </div>
            </div>
          )}

          {/* Amount Sent */}
          {result.amountSent && (
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="text-lg">💰</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-800">Amount Sent</p>
                  <p className="text-lg font-semibold text-purple-600">{formatAmount(result.amountSent)} ETH</p>
                </div>
              </div>
            </div>
          )}

          {/* Voice Receipt */}
          {result.voiceReceiptCid && (
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-lg">🎤</div>
                  <div>
                    <p className="text-sm font-medium text-orange-800">Voice Receipt</p>
                    <p className="font-mono text-xs text-orange-600">{result.voiceReceiptCid.slice(0, 12)}...</p>
                  </div>
                </div>
                <a
                  href={`https://ipfs.io/ipfs/${result.voiceReceiptCid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                >
                  IPFS 🔗
                </a>
              </div>
            </div>
          )}

          {/* Network Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="text-lg">🌐</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Network</p>
                <p className="text-sm text-gray-600">Base Sepolia Testnet</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Block confirmations</p>
                <p className="text-sm font-medium text-green-600">✓ Confirmed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Details */}
      {isError && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-lg">⚠️</div>
              <div className="flex-1">
                <p className="font-medium text-red-800">Error Details</p>
                <p className="text-sm text-red-600 mt-1">
                  {result.error || "An unknown error occurred during payment processing"}
                </p>

                {/* Transaction hash for failed transactions */}
                {result.transactionHash && (
                  <div className="mt-3">
                    <p className="text-xs text-red-500">Failed Transaction:</p>
                    <a
                      href={getExplorerUrl(result.transactionHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-red-600 hover:text-red-800 underline"
                    >
                      {formatTxHash(result.transactionHash)}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Troubleshooting Tips */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-lg">💡</div>
              <div className="flex-1">
                <p className="font-medium text-yellow-800">Common Issues</p>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>• Check your wallet balance for sufficient funds</li>
                  <li>• Ensure the ENS name is valid and resolves correctly</li>
                  <li>• Verify you're connected to Base Sepolia testnet</li>
                  <li>• Try again with a smaller amount</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {isSuccess && (
          <div className="text-center space-y-3">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-700">
                🎉 Your payment has been sent successfully! The recipient will receive the funds shortly.
              </p>
            </div>

            <button
              onClick={onReset}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-colors"
            >
              Make Another Payment
            </button>
          </div>
        )}

        {isError && (
          <div className="space-y-2">
            <button
              onClick={onReset}
              className="w-full py-3 px-6 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>

            <p className="text-center text-xs text-gray-500">Need help? Check our FAQ or contact support</p>
          </div>
        )}
      </div>
    </div>
  );
};
