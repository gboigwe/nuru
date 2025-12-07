"use client";

import { useEffect, useState } from "react";
import { SupportedCurrency } from "~~/constants/currencies";
import { currencyConverter, ConversionResult } from "~~/services/currency/CurrencyConverter";

/**
 * ConversionRateDisplay Component
 *
 * Displays real-time conversion rates with Chainlink price feeds
 * Shows conversion rate, slippage bounds, and data source
 */

interface ConversionRateDisplayProps {
  amount: number;
  fromCurrency: SupportedCurrency;
  toCurrency: SupportedCurrency;
  slippageTolerance?: number;
  className?: string;
  onConversionUpdate?: (result: ConversionResult) => void;
}

export function ConversionRateDisplay({
  amount,
  fromCurrency,
  toCurrency,
  slippageTolerance,
  className = "",
  onConversionUpdate,
}: ConversionRateDisplayProps) {
  const [conversion, setConversion] = useState<ConversionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversion = async () => {
      if (amount <= 0) {
        setConversion(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await currencyConverter.convert(
          amount,
          fromCurrency,
          toCurrency,
          slippageTolerance,
        );

        setConversion(result);
        onConversionUpdate?.(result);
      } catch (err) {
        console.error("Conversion error:", err);
        setError(err instanceof Error ? err.message : "Failed to convert");
      } finally {
        setLoading(false);
      }
    };

    fetchConversion();

    // Refresh conversion every 30 seconds
    const interval = setInterval(fetchConversion, 30000);

    return () => clearInterval(interval);
  }, [amount, fromCurrency, toCurrency, slippageTolerance, onConversionUpdate]);

  if (loading && !conversion) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading rate...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-red-600 ${className}`}>
        ⚠️ {error}
      </div>
    );
  }

  if (!conversion) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Main Conversion Rate */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
        <div className="text-sm text-gray-600">
          {fromCurrency} → {toCurrency}
        </div>
        <div className="text-lg font-bold text-gray-900">
          {conversion.toAmount.toFixed(6)} {toCurrency}
        </div>
      </div>

      {/* Exchange Rate Details */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white rounded-lg p-2 border border-gray-200">
          <div className="text-gray-500">Exchange Rate</div>
          <div className="font-semibold text-gray-900">
            1 {fromCurrency} = {conversion.rate.toFixed(6)} {toCurrency}
          </div>
        </div>

        <div className="bg-white rounded-lg p-2 border border-gray-200">
          <div className="text-gray-500">Slippage</div>
          <div className="font-semibold text-gray-900">
            {((conversion.slippage || 0) * 100).toFixed(2)}%
          </div>
        </div>

        {conversion.minAmount && conversion.maxAmount && (
          <>
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <div className="text-gray-500">Min Amount</div>
              <div className="font-semibold text-green-600">
                {conversion.minAmount.toFixed(6)} {toCurrency}
              </div>
            </div>

            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <div className="text-gray-500">Max Amount</div>
              <div className="font-semibold text-orange-600">
                {conversion.maxAmount.toFixed(6)} {toCurrency}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Last Updated */}
      <div className="text-xs text-gray-400 text-center">
        Updated {new Date(conversion.timestamp).toLocaleTimeString()}
        {loading && " • Refreshing..."}
      </div>
    </div>
  );
}

/**
 * CompactConversionRate Component
 *
 * Compact version showing only the conversion amount
 */

interface CompactConversionRateProps {
  amount: number;
  fromCurrency: SupportedCurrency;
  toCurrency: SupportedCurrency;
  className?: string;
}

export function CompactConversionRate({
  amount,
  fromCurrency,
  toCurrency,
  className = "",
}: CompactConversionRateProps) {
  const [toAmount, setToAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchConversion = async () => {
      if (amount <= 0) return;

      setLoading(true);
      try {
        const result = await currencyConverter.convert(
          amount,
          fromCurrency,
          toCurrency,
        );
        setToAmount(result.toAmount);
      } catch (err) {
        console.error("Conversion error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversion();
  }, [amount, fromCurrency, toCurrency]);

  if (loading || toAmount === null) {
    return <span className={`text-gray-400 ${className}`}>...</span>;
  }

  return (
    <span className={`font-medium ${className}`}>
      ≈ {toAmount.toFixed(2)} {toCurrency}
    </span>
  );
}
