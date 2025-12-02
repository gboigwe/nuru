"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ProcessedVoiceCommand } from "../../services/VoicePayService";
import { useBalanceCheck } from "~~/hooks/scaffold-eth/useBalanceCheck";
import { InsufficientBalancePrompt } from "~~/components/scaffold-eth/InsufficientBalancePrompt";

interface PaymentConfirmationProps {
  processedCommand: ProcessedVoiceCommand;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting: boolean;
}

export const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  processedCommand,
  onConfirm,
  onCancel,
  isExecuting,
}) => {
  const { intent, ensResolution } = processedCommand;
  const { address } = useAccount();
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);

  // Check balance before payment
  const balanceCheck = useBalanceCheck({
    to: ensResolution?.address || undefined,
    amount: intent.amount,
  });

  // Show insufficient balance prompt if needed
  useEffect(() => {
    if (!balanceCheck.hasBalance && ensResolution?.isValid) {
      setShowInsufficientBalance(true);
    }
  }, [balanceCheck.hasBalance, ensResolution]);

  const handleConfirmPayment = () => {
    // Check balance before confirming
    if (!balanceCheck.hasBalance) {
      setShowInsufficientBalance(true);
      return;
    }
    onConfirm();
  };

  const handleBalanceSufficient = () => {
    setShowInsufficientBalance(false);
    // Auto-retry payment
    onConfirm();
  };

  // Format amount for display
  const formatAmount = (amount: string, currency: string): string => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return `${amount} ${currency.toUpperCase()}`;

    // Handle different currencies
    switch (currency.toLowerCase()) {
      case "cedis":
      case "ghs":
        return `GH₵ ${numAmount.toLocaleString()}`;
      case "dollars":
      case "usd":
      case "usdc":
        return `$${numAmount.toLocaleString()}`;
      case "eth":
      case "ethereum":
        return `${numAmount.toFixed(4)} ETH`;
      default:
        return `${numAmount.toLocaleString()} ${currency.toUpperCase()}`;
    }
  };

  // Format address for display
  const formatAddress = (address: string): string => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="text-center">
            <div className="text-4xl mb-2">💸</div>
            <h2 className="text-xl font-bold">Confirm Payment</h2>
            <p className="text-blue-100 text-sm">Please review the details carefully</p>
          </div>
        </div>

        {/* Payment Details */}
        <div className="p-6 space-y-6">
          {/* Amount Section */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Amount</h3>
            <div className="text-3xl font-bold text-gray-800">{formatAmount(intent.amount, intent.currency)}</div>
            {intent.currency.toLowerCase() !== "eth" && (
              <p className="text-sm text-gray-500 mt-1">≈ {parseFloat(intent.amount) * 0.0003} ETH (estimated)</p>
            )}
          </div>

          {/* Recipient Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-600">Send To</h3>

            {/* ENS Name */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">👤</div>
                <div className="flex-1">
                  <p className="font-semibold text-blue-800">{intent.recipient}</p>
                  <p className="text-sm text-blue-600">ENS Name</p>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    ensResolution?.isValid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {ensResolution?.isValid ? "✓ Verified" : "✗ Invalid"}
                </div>
              </div>
            </div>

            {/* Resolved Address */}
            {ensResolution?.isValid && ensResolution.address && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-lg">🔗</div>
                  <div className="flex-1">
                    <p className="font-mono text-sm text-gray-800">{formatAddress(ensResolution.address)}</p>
                    <p className="text-xs text-gray-500">Resolved Address</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Voice Command */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600">Voice Command</h3>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-lg mt-0.5">🎤</div>
                <div className="flex-1">
                  <p className="text-purple-800 italic">&quot;{intent.rawTranscript || "Voice command processed"}&quot;</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-purple-600">Action: {intent.action.toUpperCase()}</p>
                    <p className="text-xs text-purple-600">Confidence: {Math.round((intent.confidence || 0) * 100)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insufficient Balance Warning */}
          {showInsufficientBalance && (
            <InsufficientBalancePrompt
              currentBalance={balanceCheck.balance}
              requiredAmount={balanceCheck.required}
              shortfall={balanceCheck.shortfall}
              userAddress={address}
              onBalanceSufficient={handleBalanceSufficient}
              onDismiss={() => setShowInsufficientBalance(false)}
            />
          )}

          {/* Network Info */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="text-lg">🌐</div>
              <div className="flex-1">
                <p className="font-medium text-orange-800">Base Sepolia Testnet</p>
                <p className="text-sm text-orange-600">Transaction will be processed on L2</p>
              </div>
            </div>
          </div>

          {/* Warning for Invalid ENS */}
          {!ensResolution?.isValid && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-lg">⚠️</div>
                <div className="flex-1">
                  <p className="font-medium text-red-800">ENS Resolution Failed</p>
                  <p className="text-sm text-red-600">
                    The ENS name could not be resolved to a valid address. Please check the name and try again.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 space-y-3">
          {ensResolution?.isValid ? (
            <>
              <button
                onClick={handleConfirmPayment}
                disabled={isExecuting || !balanceCheck.hasBalance}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-colors ${
                  isExecuting || !balanceCheck.hasBalance
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 active:scale-98"
                }`}
              >
                {isExecuting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing Payment...</span>
                  </div>
                ) : !balanceCheck.hasBalance ? (
                  "Insufficient Balance - Add Funds Above"
                ) : (
                  `✓ Confirm & Send ${formatAmount(intent.amount, intent.currency)}`
                )}
              </button>

              <button
                onClick={onCancel}
                disabled={isExecuting}
                className="w-full py-3 px-6 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel Payment
              </button>
            </>
          ) : (
            <button
              onClick={onCancel}
              className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
