/**
 * Onramp Configuration
 *
 * This file contains configuration for all supported onramp providers
 * and payment gateways used in the Nuru payment application.
 */

import { OnrampConfig, DEFAULT_ONRAMP_CONFIG } from '../types/onramp';

// Base configuration for onramp functionality
export const onrampConfig: OnrampConfig = {
  ...DEFAULT_ONRAMP_CONFIG,

  // Feature flags
  enabled: true,

  // Supported payment methods
  supportedMethods: ['coinbase', 'mobile-money'],

  // Supported fiat currencies
  supportedCurrencies: ['USD', 'GHS', 'NGN', 'KES', 'EUR', 'GBP'],

  // Fee structure (in percentage)
  fees: {
    coinbase: 1.5,      // Coinbase Pay: 1.5%
    mobileMoney: 2.5,   // Mobile Money: 2.5%
    bankTransfer: 1.0,  // Bank Transfer: 1.0%
  },

  // Transaction limits per currency
  limits: {
    min: {
      USD: 10,
      GHS: 50,
      NGN: 5000,
      KES: 1000,
      EUR: 10,
      GBP: 10,
    },
    max: {
      USD: 10000,
      GHS: 50000,
      NGN: 5000000,
      KES: 1000000,
      EUR: 10000,
      GBP: 10000,
    },
  },
};

// Coinbase Developer Platform Configuration
export const coinbaseConfig = {
  projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID,

  // Supported assets for purchase
  supportedAssets: ['USDC', 'ETH', 'WETH'],

  // Default asset
  defaultAsset: 'USDC',

  // Supported networks
  supportedNetworks: ['base', 'base-sepolia'],

  // Default network
  defaultNetwork: 'base',

  // Payment methods
  paymentMethods: [
    'debit_card',
    'ach_bank_account',
    'apple_pay',
    'google_pay',
  ],

  // Default fiat currency
  defaultFiatCurrency: 'USD',

  // Coinbase Commerce settings
  commerce: {
    enabled: false, // Set to true to enable Coinbase Commerce
    apiKey: process.env.COINBASE_COMMERCE_API_KEY,
  },
};

// Flutterwave Configuration
export const flutterwaveConfig = {
  secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
  publicKey: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,

  // API endpoints
  baseUrl: 'https://api.flutterwave.com/v3',

  // Supported countries
  supportedCountries: ['GH', 'NG', 'KE', 'UG', 'TZ', 'RW'],

  // Mobile money networks by country
  mobileMoneyNetworks: {
    GH: ['MTN', 'VODAFONE', 'AIRTELTIGO'],
    NG: ['MTN', 'AIRTEL'],
    KE: ['MPESA'],
    UG: ['MTN', 'AIRTEL'],
    TZ: ['MPESA', 'AIRTEL'],
    RW: ['MTN'],
  },

  // Currency mapping
  currencyByCountry: {
    GH: 'GHS',
    NG: 'NGN',
    KE: 'KES',
    UG: 'UGX',
    TZ: 'TZS',
    RW: 'RWF',
  },

  // Webhook configuration
  webhooks: {
    enabled: true,
    url: process.env.NEXT_PUBLIC_APP_URL + '/api/webhooks/flutterwave',
    secretHash: process.env.FLUTTERWAVE_WEBHOOK_SECRET,
  },

  // Timeout for payment confirmation (in milliseconds)
  paymentTimeout: 120000, // 2 minutes

  // Polling interval for transaction status (in milliseconds)
  pollingInterval: 3000, // 3 seconds
};

// Paystack Configuration (Alternative)
export const paystackConfig = {
  secretKey: process.env.PAYSTACK_SECRET_KEY,
  publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,

  // API endpoints
  baseUrl: 'https://api.paystack.co',

  // Supported countries
  supportedCountries: ['NG', 'GH', 'ZA', 'KE'],

  // Mobile money channels
  mobileMoneyChannels: {
    NG: ['mobile_money'],
    GH: ['mobile_money_ghana'],
    KE: ['mpesa'],
  },

  // Webhook configuration
  webhooks: {
    enabled: true,
    url: process.env.NEXT_PUBLIC_APP_URL + '/api/webhooks/paystack',
  },
};

// Exchange rate API configuration (for currency conversion)
export const exchangeRateConfig = {
  provider: 'coinbase', // 'coinbase' | 'coingecko' | 'binance'

  // Cache duration in milliseconds
  cacheDuration: 60000, // 1 minute

  // Fallback rates (used when API is unavailable)
  fallbackRates: {
    'USDC/USD': 1.0,
    'GHS/USD': 0.065,
    'NGN/USD': 0.0007,
    'KES/USD': 0.0078,
    'EUR/USD': 1.1,
    'GBP/USD': 1.27,
  },
};

// USDC Contract Addresses (for BASE network)
export const usdcContractAddresses = {
  'base': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
};

// Validation rules
export const validationRules = {
  phoneNumber: {
    minLength: 10,
    maxLength: 15,
    pattern: /^[+]?[0-9]{10,15}$/,
  },

  amount: {
    minUSD: 10,
    maxUSD: 10000,
    decimals: 2,
  },

  walletAddress: {
    pattern: /^0x[a-fA-F0-9]{40}$/,
  },
};

// Error messages
export const errorMessages = {
  insufficientBalance: 'Insufficient balance to complete this transaction',
  invalidPhoneNumber: 'Please enter a valid phone number',
  invalidAmount: 'Amount must be between minimum and maximum limits',
  invalidCurrency: 'Selected currency is not supported',
  paymentFailed: 'Payment failed. Please try again.',
  paymentTimeout: 'Payment timed out. Please check your phone and try again.',
  networkError: 'Network error. Please check your connection and try again.',
  providerError: 'Payment provider error. Please try a different payment method.',
};

// Success messages
export const successMessages = {
  paymentInitiated: 'Payment initiated. Please check your phone to approve.',
  paymentCompleted: 'Payment completed successfully!',
  fundsAdded: 'Funds added to your wallet successfully.',
};

// Feature flags for different environments
export const featureFlags = {
  development: {
    enableMockPayments: true,
    enableTestMode: true,
    skipPhoneVerification: true,
  },
  production: {
    enableMockPayments: false,
    enableTestMode: false,
    skipPhoneVerification: false,
  },
};

// Get environment-specific feature flags
export const getFeatureFlags = () => {
  const env = process.env.NODE_ENV || 'development';
  return featureFlags[env as keyof typeof featureFlags] || featureFlags.development;
};
