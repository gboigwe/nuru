"use client";

import { useEffect, useState } from 'react';
import { SupportedCurrency } from '~~/constants/currencies';
import { currencyConverter, ConversionResult } from '~~/services/currency/CurrencyConverter';

/**
 * useCurrencyConversion Hook
 *
 * Provides real-time currency conversion with automatic refresh
 */

export interface CurrencyConversionData {
  result: ConversionResult | null;
  isLoading: boolean;
  isError: boolean;
  error?: string;
  refresh: () => Promise<void>;
}

export function useCurrencyConversion(
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  autoRefresh = false,
  refreshInterval = 60000, // 1 minute
): CurrencyConversionData {
  const [data, setData] = useState<CurrencyConversionData>({
    result: null,
    isLoading: false,
    isError: false,
    refresh: async () => {},
  });

  const performConversion = async () => {
    if (amount <= 0) {
      setData(prev => ({
        ...prev,
        result: null,
        isLoading: false,
        isError: false,
      }));
      return;
    }

    setData(prev => ({ ...prev, isLoading: true, isError: false }));

    try {
      const result = await currencyConverter.convert(amount, fromCurrency, toCurrency);

      setData(prev => ({
        ...prev,
        result,
        isLoading: false,
        isError: false,
        error: undefined,
      }));
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        isError: true,
        error: error instanceof Error ? error.message : 'Conversion failed',
      }));
    }
  };

  useEffect(() => {
    performConversion();

    // Set up auto-refresh if enabled
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(performConversion, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [amount, fromCurrency, toCurrency, autoRefresh, refreshInterval]);

  // Update refresh function
  useEffect(() => {
    setData(prev => ({
      ...prev,
      refresh: performConversion,
    }));
  }, [amount, fromCurrency, toCurrency]);

  return data;
}

/**
 * useExchangeRate Hook
 *
 * Get just the exchange rate between two currencies
 */
export function useExchangeRate(
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  autoRefresh = true,
) {
  const { result, isLoading, isError, error, refresh } = useCurrencyConversion(
    1, // Get rate for 1 unit
    fromCurrency,
    toCurrency,
    autoRefresh,
  );

  return {
    rate: result?.rate || null,
    timestamp: result?.timestamp || null,
    isLoading,
    isError,
    error,
    refresh,
  };
}
