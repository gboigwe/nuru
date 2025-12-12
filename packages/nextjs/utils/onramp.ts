/**
 * Onramp Utility Functions
 *
 * Helper functions for onramp operations, validation, and formatting
 */

import { FiatCurrency, MobileMoneyProvider, OnrampMethod } from '../types/onramp';
import { onrampConfig, validationRules } from '../config/onramp.config';

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  const cleaned = phoneNumber.replace(/\s+/g, '');
  return validationRules.phoneNumber.pattern.test(cleaned);
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\s+/g, '');

  // Format as international number
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Add default country code if missing
  return `+${cleaned}`;
};

/**
 * Validate wallet address
 */
export const isValidWalletAddress = (address: string): boolean => {
  return validationRules.walletAddress.pattern.test(address);
};

/**
 * Validate amount against currency limits
 */
export const isValidAmount = (amount: string, currency: FiatCurrency): boolean => {
  const numAmount = parseFloat(amount);

  if (isNaN(numAmount) || numAmount <= 0) {
    return false;
  }

  const min = onrampConfig.limits.min[currency] || 0;
  const max = onrampConfig.limits.max[currency] || Infinity;

  return numAmount >= min && numAmount <= max;
};

/**
 * Get minimum amount for currency
 */
export const getMinAmount = (currency: FiatCurrency): number => {
  return onrampConfig.limits.min[currency] || 0;
};

/**
 * Get maximum amount for currency
 */
export const getMaxAmount = (currency: FiatCurrency): number => {
  return onrampConfig.limits.max[currency] || Infinity;
};

/**
 * Calculate fee for onramp transaction
 */
export const calculateOnrampFee = (
  amount: string,
  method: OnrampMethod
): number => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return 0;

  const feePercentage = onrampConfig.fees[method] || 0;
  return (numAmount * feePercentage) / 100;
};

/**
 * Calculate total amount including fees
 */
export const calculateTotalAmount = (
  amount: string,
  method: OnrampMethod
): number => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return 0;

  return numAmount + calculateOnrampFee(amount, method);
};

/**
 * Format currency amount with symbol
 */
export const formatCurrencyDisplay = (
  amount: number | string,
  currency: FiatCurrency
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) return `0 ${currency}`;

  const symbols: Record<FiatCurrency, string> = {
    USD: '$',
    GHS: '₵',
    NGN: '₦',
    KES: 'KSh',
    EUR: '€',
    GBP: '£',
  };

  const symbol = symbols[currency] || currency;

  // Format based on currency
  if (currency === 'KES') {
    return `${symbol} ${numAmount.toLocaleString()}`;
  }

  return `${symbol}${numAmount.toLocaleString()}`;
};

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (currency: FiatCurrency): string => {
  const symbols: Record<FiatCurrency, string> = {
    USD: '$',
    GHS: '₵',
    NGN: '₦',
    KES: 'KSh',
    EUR: '€',
    GBP: '£',
  };

  return symbols[currency] || currency;
};

/**
 * Check if mobile money provider supports currency
 */
export const providerSupportsCurrency = (
  provider: MobileMoneyProvider,
  currency: FiatCurrency
): boolean => {
  const providerInfo = onrampConfig.mobileMoneyProviders.find(
    p => p.id === provider
  );

  if (!providerInfo) return false;

  return providerInfo.supportedCurrencies.includes(currency);
};

/**
 * Get available mobile money providers for currency
 */
export const getAvailableProviders = (
  currency: FiatCurrency
): MobileMoneyProvider[] => {
  return onrampConfig.mobileMoneyProviders
    .filter(p => p.supportedCurrencies.includes(currency))
    .map(p => p.id);
};

/**
 * Estimate time to completion (in minutes)
 */
export const estimateCompletionTime = (method: OnrampMethod): number => {
  const times: Record<OnrampMethod, number> = {
    coinbase: 5, // 5 minutes
    'mobile-money': 2, // 2 minutes
    'bank-transfer': 1440, // 24 hours
  };

  return times[method] || 10;
};

/**
 * Format completion time for display
 */
export const formatCompletionTime = (method: OnrampMethod): string => {
  const minutes = estimateCompletionTime(method);

  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''}`;
};

/**
 * Convert USDC amount to fiat currency estimate
 */
export const usdcToFiat = (
  usdcAmount: string,
  currency: FiatCurrency
): number => {
  const numAmount = parseFloat(usdcAmount);
  if (isNaN(numAmount)) return 0;

  // Simple 1:1 conversion for USD/USDC
  if (currency === 'USD') {
    return numAmount;
  }

  // Use approximate exchange rates (in production, use a real exchange rate API)
  const approximateRates: Record<FiatCurrency, number> = {
    USD: 1,
    GHS: 15.5, // 1 USD ≈ 15.5 GHS
    NGN: 1450, // 1 USD ≈ 1450 NGN
    KES: 128, // 1 USD ≈ 128 KES
    EUR: 0.92, // 1 USD ≈ 0.92 EUR
    GBP: 0.79, // 1 USD ≈ 0.79 GBP
  };

  return numAmount * approximateRates[currency];
};

/**
 * Convert fiat currency to USDC estimate
 */
export const fiatToUsdc = (
  fiatAmount: string,
  currency: FiatCurrency
): number => {
  const numAmount = parseFloat(fiatAmount);
  if (isNaN(numAmount)) return 0;

  if (currency === 'USD') {
    return numAmount;
  }

  const approximateRates: Record<FiatCurrency, number> = {
    USD: 1,
    GHS: 15.5,
    NGN: 1450,
    KES: 128,
    EUR: 0.92,
    GBP: 0.79,
  };

  return numAmount / approximateRates[currency];
};

/**
 * Generate transaction reference
 */
export const generateTransactionRef = (prefix: string = 'NURU'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Mask sensitive data (phone number, etc.)
 */
export const maskPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\s+/g, '');

  if (cleaned.length < 4) return cleaned;

  const lastFour = cleaned.slice(-4);
  const masked = cleaned.slice(0, -4).replace(/\d/g, '*');

  return `${masked}${lastFour}`;
};

/**
 * Check if onramp is available for user's location
 */
export const isOnrampAvailable = (): boolean => {
  return onrampConfig.enabled;
};

/**
 * Get supported payment methods
 */
export const getSupportedMethods = (): OnrampMethod[] => {
  return onrampConfig.supportedMethods;
};

/**
 * Get supported currencies
 */
export const getSupportedCurrencies = (): FiatCurrency[] => {
  return onrampConfig.supportedCurrencies;
};
