'use client';

import { useState } from 'react';

type MobileMoneyProvider = 'mtn' | 'vodafone' | 'airtel' | 'mpesa';

interface MobileMoneyOnrampProps {
  amount: string;
  currency: 'GHS' | 'NGN' | 'KES' | 'USD';
  onSuccess: () => void;
  walletAddress?: string;
}

interface ProviderInfo {
  name: string;
  logo: string;
  countries: string[];
}

const providers: Record<MobileMoneyProvider, ProviderInfo> = {
  mtn: {
    name: 'MTN Mobile Money',
    logo: '📱',
    countries: ['Ghana', 'Nigeria', 'Uganda']
  },
  vodafone: {
    name: 'Vodafone Cash',
    logo: '💳',
    countries: ['Ghana']
  },
  mpesa: {
    name: 'M-Pesa',
    logo: '💚',
    countries: ['Kenya', 'Tanzania']
  },
  airtel: {
    name: 'Airtel Money',
    logo: '🔴',
    countries: ['Nigeria', 'Kenya']
  },
};

export const MobileMoneyOnramp = ({ amount, currency, onSuccess, walletAddress }: MobileMoneyOnrampProps) => {
  const [provider, setProvider] = useState<MobileMoneyProvider>('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMobileMoneyPurchase = async () => {
    if (!phoneNumber) {
      setError('Please enter a phone number');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Call backend API to initiate mobile money purchase
      const response = await fetch('/api/onramp/mobile-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          phoneNumber,
          amount,
          currency,
          walletAddress,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        alert(`✅ Please approve the payment on your phone (${phoneNumber})`);

        // Poll for payment confirmation
        pollPaymentStatus(data.transactionId);
      } else {
        setError(data.message || 'Failed to initiate payment');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Mobile money purchase failed:', error);
      setError('Failed to initiate mobile money payment. Please try again.');
      setIsProcessing(false);
    }
  };

  const pollPaymentStatus = async (transactionId: string) => {
    // Poll every 3 seconds for up to 2 minutes
    const maxAttempts = 40;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;

      try {
        const response = await fetch(`/api/onramp/status/${transactionId}`);
        const data = await response.json();

        if (data.status === 'completed') {
          clearInterval(interval);
          setIsProcessing(false);
          onSuccess();
        } else if (data.status === 'failed' || attempts >= maxAttempts) {
          clearInterval(interval);
          setIsProcessing(false);
          setError(data.message || 'Payment failed or timed out');
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, 3000);
  };

  const calculateFee = (amount: string): string => {
    return (parseFloat(amount) * 0.025).toFixed(2);
  };

  const calculateTotal = (amount: string): string => {
    return (parseFloat(amount) * 1.025).toFixed(2);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">Buy USDC with Mobile Money</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Provider</label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(providers).map(([key, { name, logo }]) => (
            <button
              key={key}
              type="button"
              onClick={() => setProvider(key as MobileMoneyProvider)}
              disabled={isProcessing}
              className={`
                p-3 rounded-lg border-2 transition-all
                ${provider === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="text-2xl mb-1">{logo}</div>
              <div className="text-xs font-medium">{name}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Phone Number</label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="024 123 4567"
          disabled={isProcessing}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span>Amount:</span>
          <span className="font-semibold">{amount} {currency}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span>Fee (2.5%):</span>
          <span>{calculateFee(amount)} {currency}</span>
        </div>
        <div className="border-t border-gray-300 my-2"></div>
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>{calculateTotal(amount)} {currency}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleMobileMoneyPurchase}
        disabled={!phoneNumber || isProcessing}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? 'Processing...' : 'Buy USDC'}
      </button>

      <p className="text-xs text-gray-500 mt-3 text-center">
        {isProcessing
          ? 'Waiting for payment approval on your phone...'
          : "You'll receive a prompt on your phone to approve this payment"
        }
      </p>
    </div>
  );
};
