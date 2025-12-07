"use client";

import { useAccount } from "wagmi";
import { paymasterService } from "~~/services/smartwallet";

/**
 * SmartWalletInfo Component
 *
 * Displays information about Smart Wallet features and benefits
 * Shows gasless transaction eligibility and sponsorship policy
 */

interface SmartWalletInfoProps {
  className?: string;
}

export function SmartWalletInfo({ className = "" }: SmartWalletInfoProps) {
  const { address, connector } = useAccount();
  const policy = paymasterService.getPolicy();
  const isPaymasterEnabled = paymasterService.isEnabled();

  // Check if using Coinbase Smart Wallet
  const isSmartWallet = connector?.name === "Coinbase Wallet";

  if (!address) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl">
          🔐
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {isSmartWallet ? "Smart Wallet Active" : "Wallet Connected"}
          </h3>
          <p className="text-sm text-gray-600">
            {isSmartWallet ? "Passkey-secured, gasless transactions" : "Traditional wallet"}
          </p>
        </div>
      </div>

      {/* Smart Wallet Benefits */}
      {isSmartWallet && (
        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <div>
              <p className="font-semibold text-gray-900">Passkey Authentication</p>
              <p className="text-sm text-gray-600">
                No seed phrases - secured by your device's biometrics
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <div>
              <p className="font-semibold text-gray-900">Batch Transactions</p>
              <p className="text-sm text-gray-600">
                Approve and pay in a single transaction
              </p>
            </div>
          </div>

          {isPaymasterEnabled && (
            <div className="flex items-start gap-3">
              <span className="text-green-600 text-xl">✓</span>
              <div>
                <p className="font-semibold text-gray-900">Gasless Transactions</p>
                <p className="text-sm text-gray-600">{policy.voicePayments}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sponsorship Policy (if enabled) */}
      {isPaymasterEnabled && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2">Gas Sponsorship Policy</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Voice payments: {policy.voicePayments}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Small payments: {policy.smallPayments}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>Limits: {policy.limits.perUser}</span>
            </div>
          </div>
        </div>
      )}

      {/* Not Smart Wallet - Upgrade CTA */}
      {!isSmartWallet && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-700 mb-3">
            Upgrade to Coinbase Smart Wallet for:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="text-blue-600">•</span>
              Passkey login (no seed phrases)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-600">•</span>
              Gasless voice payments
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-600">•</span>
              Batch transactions
            </li>
          </ul>
          <button className="mt-3 w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all text-sm font-medium">
            Learn More
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * CompactSmartWalletBadge Component
 *
 * Small badge showing Smart Wallet status
 */

interface CompactSmartWalletBadgeProps {
  className?: string;
}

export function CompactSmartWalletBadge({ className = "" }: CompactSmartWalletBadgeProps) {
  const { connector } = useAccount();
  const isSmartWallet = connector?.name === "Coinbase Wallet";

  if (!isSmartWallet) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-xs font-medium ${className}`}>
      <span>🔐</span>
      <span>Smart Wallet</span>
    </div>
  );
}
