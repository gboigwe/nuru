'use client';

import { useState } from 'react';

export interface FiatCurrency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

const SUPPORTED_CURRENCIES: FiatCurrency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'GHS', symbol: '₵', name: 'Ghana Cedi', flag: '🇬🇭' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
];

interface FiatSelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: FiatCurrency) => void;
  className?: string;
}

export const FiatSelector = ({ selectedCurrency, onCurrencyChange, className = '' }: FiatSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const selected = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency) || SUPPORTED_CURRENCIES[0];

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="text-xl">{selected.flag}</span>
        <span className="font-medium">{selected.code}</span>
        <span className="text-gray-500">{selected.symbol}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {SUPPORTED_CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                type="button"
                onClick={() => {
                  onCurrencyChange(currency);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors
                  ${currency.code === selectedCurrency ? 'bg-blue-50' : ''}
                `}
              >
                <span className="text-2xl">{currency.flag}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium">{currency.name}</div>
                  <div className="text-sm text-gray-500">{currency.code} ({currency.symbol})</div>
                </div>
                {currency.code === selectedCurrency && (
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
