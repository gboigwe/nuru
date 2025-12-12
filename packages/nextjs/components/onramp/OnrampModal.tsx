'use client';

import { useState } from 'react';
import { FundWalletCard } from './FundWalletCard';
import { MobileMoneyOnramp } from './MobileMoneyOnramp';
import { FiatSelector, FiatCurrency } from './FiatSelector';
import { useAccount } from 'wagmi';
import { OnrampMethod, SUPPORTED_CURRENCIES } from '../../types/onramp';

interface OnrampModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAmount?: string;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export const OnrampModal = ({
  isOpen,
  onClose,
  targetAmount,
  onSuccess,
  title = 'Add Funds to Your Wallet',
  description = 'Choose a payment method to buy USDC',
}: OnrampModalProps) => {
  const { address } = useAccount();
  const [selectedMethod, setSelectedMethod] = useState<OnrampMethod>('coinbase');
  const [selectedCurrency, setSelectedCurrency] = useState<FiatCurrency>(SUPPORTED_CURRENCIES[0]);

  if (!isOpen) return null;

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    // Optional: Close modal after success
    // onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{title}</h2>
                <p className="text-blue-100 text-sm">{description}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Amount Display */}
            {targetAmount && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-600 mb-1">Amount Needed</div>
                <div className="text-2xl font-bold text-blue-800">{targetAmount} USDC</div>
              </div>
            )}

            {/* Payment Method Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('coinbase')}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${selectedMethod === 'coinbase'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="text-2xl mb-2">💳</div>
                  <div className="font-medium text-gray-800">Card/Bank</div>
                  <div className="text-xs text-gray-500">Coinbase Pay</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('mobile-money')}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${selectedMethod === 'mobile-money'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="text-2xl mb-2">📱</div>
                  <div className="font-medium text-gray-800">Mobile Money</div>
                  <div className="text-xs text-gray-500">MTN, M-Pesa, etc.</div>
                </button>
              </div>
            </div>

            {/* Currency Selector (for mobile money) */}
            {selectedMethod === 'mobile-money' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Currency</label>
                <FiatSelector
                  selectedCurrency={selectedCurrency.code}
                  onCurrencyChange={setSelectedCurrency}
                />
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* On-Ramp Component */}
            {selectedMethod === 'coinbase' ? (
              <FundWalletCard targetAmount={targetAmount} onSuccess={handleSuccess} />
            ) : (
              <MobileMoneyOnramp
                amount={targetAmount || '50'}
                currency={selectedCurrency.code as 'GHS' | 'NGN' | 'KES' | 'USD'}
                onSuccess={handleSuccess}
                walletAddress={address}
              />
            )}

            {/* Alternative Method Notice */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <p className="font-semibold text-gray-700 mb-2">
                💡 Alternative: Transfer USDC Directly
              </p>
              <p className="text-gray-600 mb-2">
                If you already have USDC, send it to your wallet on the BASE network:
              </p>
              <div className="bg-white p-3 rounded border border-gray-200">
                <code className="block text-xs break-all font-mono text-gray-800">
                  {address || 'Connect wallet to see address'}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
