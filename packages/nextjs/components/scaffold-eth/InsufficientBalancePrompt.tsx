'use client';

import { useState } from 'react';
import { FundWalletCard } from '../onramp/FundWalletCard';
import { MobileMoneyOnramp } from '../onramp/MobileMoneyOnramp';
import { FiatSelector, FiatCurrency } from '../onramp/FiatSelector';
import { useAccount } from 'wagmi';

interface InsufficientBalancePromptProps {
  requiredAmount: string;
  currentBalance: string;
  shortfall: string;
  onFundingSuccess?: () => void;
}

type OnrampMethod = 'coinbase' | 'mobile-money';

export const InsufficientBalancePrompt = ({
  requiredAmount,
  currentBalance,
  shortfall,
  onFundingSuccess,
}: InsufficientBalancePromptProps) => {
  const { address } = useAccount();
  const [selectedMethod, setSelectedMethod] = useState<OnrampMethod>('coinbase');
  const [selectedCurrency, setSelectedCurrency] = useState<FiatCurrency>({
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
  });

  return (
    <div className="space-y-4">
      {/* Balance Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="text-yellow-800 font-semibold">Insufficient Balance</p>
            <p className="text-sm text-yellow-700 mt-1">
              You have {currentBalance} USDC but need {requiredAmount} USDC
            </p>
            <p className="text-sm text-yellow-700">
              Shortfall: <strong>{shortfall} USDC</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Payment Method Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-semibold mb-3">Choose Payment Method</h4>
        <div className="grid grid-cols-2 gap-3">
          <button
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
            <div className="font-medium">Card/Bank</div>
            <div className="text-xs text-gray-500">Coinbase Pay</div>
          </button>

          <button
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
            <div className="font-medium">Mobile Money</div>
            <div className="text-xs text-gray-500">MTN, M-Pesa, etc.</div>
          </button>
        </div>
      </div>

      {/* Currency Selector (for mobile money) */}
      {selectedMethod === 'mobile-money' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold mb-3">Select Currency</h4>
          <FiatSelector
            selectedCurrency={selectedCurrency.code}
            onCurrencyChange={setSelectedCurrency}
          />
        </div>
      )}

      {/* On-Ramp Component */}
      {selectedMethod === 'coinbase' ? (
        <FundWalletCard targetAmount={shortfall} onSuccess={onFundingSuccess} />
      ) : (
        <MobileMoneyOnramp
          amount={shortfall}
          currency={selectedCurrency.code as 'GHS' | 'NGN' | 'KES' | 'USD'}
          onSuccess={onFundingSuccess || (() => {})}
          walletAddress={address}
        />
      )}

      {/* Alternative: Manual Transfer */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm">
        <p className="font-semibold mb-2">Alternative: Transfer USDC</p>
        <p className="text-gray-600 mb-2">
          Send USDC on BASE network to your wallet:
        </p>
        <div className="bg-white p-3 rounded border border-gray-200">
          <code className="block text-xs break-all font-mono">{address}</code>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Make sure to use the BASE network when sending USDC
        </p>
      </div>
    </div>
  );
};
