/**
 * Currency Constants for Nuru Voice Payment App
 *
 * Supports multiple currencies for the African remittance market
 */

export enum SupportedCurrency {
  // Fiat Currencies
  GHS = 'GHS', // Ghana Cedis
  USD = 'USD', // US Dollars
  NGN = 'NGN', // Nigerian Naira
  KES = 'KES', // Kenyan Shilling
  ZAR = 'ZAR', // South African Rand

  // Cryptocurrencies
  USDC = 'USDC', // USD Coin
  ETH = 'ETH', // Ethereum
  USDT = 'USDT', // Tether USD
  DAI = 'DAI', // Dai Stablecoin
}

export interface CurrencyInfo {
  code: SupportedCurrency;
  name: string;
  symbol: string;
  decimals: number;
  isCrypto: boolean;
  isStablecoin?: boolean;
  contractAddress?: string; // For ERC-20 tokens on BASE
}

/**
 * Currency Information Map
 */
export const CURRENCIES: Record<SupportedCurrency, CurrencyInfo> = {
  // Fiat
  [SupportedCurrency.GHS]: {
    code: SupportedCurrency.GHS,
    name: 'Ghana Cedis',
    symbol: 'GH₵',
    decimals: 2,
    isCrypto: false,
  },
  [SupportedCurrency.USD]: {
    code: SupportedCurrency.USD,
    name: 'US Dollar',
    symbol: '$',
    decimals: 2,
    isCrypto: false,
  },
  [SupportedCurrency.NGN]: {
    code: SupportedCurrency.NGN,
    name: 'Nigerian Naira',
    symbol: '₦',
    decimals: 2,
    isCrypto: false,
  },
  [SupportedCurrency.KES]: {
    code: SupportedCurrency.KES,
    name: 'Kenyan Shilling',
    symbol: 'KSh',
    decimals: 2,
    isCrypto: false,
  },
  [SupportedCurrency.ZAR]: {
    code: SupportedCurrency.ZAR,
    name: 'South African Rand',
    symbol: 'R',
    decimals: 2,
    isCrypto: false,
  },

  // Crypto
  [SupportedCurrency.USDC]: {
    code: SupportedCurrency.USDC,
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    isCrypto: true,
    isStablecoin: true,
    contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on BASE Mainnet
  },
  [SupportedCurrency.ETH]: {
    code: SupportedCurrency.ETH,
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    isCrypto: true,
    isStablecoin: false,
  },
  [SupportedCurrency.USDT]: {
    code: SupportedCurrency.USDT,
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    isCrypto: true,
    isStablecoin: true,
    contractAddress: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', // USDT on BASE Mainnet
  },
  [SupportedCurrency.DAI]: {
    code: SupportedCurrency.DAI,
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
    isCrypto: true,
    isStablecoin: true,
    contractAddress: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // DAI on BASE Mainnet
  },
};

/**
 * Voice command aliases for currencies
 * Maps spoken words to currency codes
 */
export const CURRENCY_ALIASES: Record<string, SupportedCurrency> = {
  // Ghana Cedis
  'cedis': SupportedCurrency.GHS,
  'cedi': SupportedCurrency.GHS,
  'ghana cedis': SupportedCurrency.GHS,
  'ghanaian cedi': SupportedCurrency.GHS,
  'ghs': SupportedCurrency.GHS,

  // US Dollar
  'dollar': SupportedCurrency.USD,
  'dollars': SupportedCurrency.USD,
  'us dollar': SupportedCurrency.USD,
  'american dollar': SupportedCurrency.USD,
  'usd': SupportedCurrency.USD,

  // Nigerian Naira
  'naira': SupportedCurrency.NGN,
  'nigerian naira': SupportedCurrency.NGN,
  'ngn': SupportedCurrency.NGN,

  // Kenyan Shilling
  'shilling': SupportedCurrency.KES,
  'shillings': SupportedCurrency.KES,
  'kenyan shilling': SupportedCurrency.KES,
  'kes': SupportedCurrency.KES,

  // South African Rand
  'rand': SupportedCurrency.ZAR,
  'south african rand': SupportedCurrency.ZAR,
  'zar': SupportedCurrency.ZAR,

  // USDC
  'usdc': SupportedCurrency.USDC,
  'usd coin': SupportedCurrency.USDC,
  'stable coin': SupportedCurrency.USDC,

  // Ethereum
  'eth': SupportedCurrency.ETH,
  'ether': SupportedCurrency.ETH,
  'ethereum': SupportedCurrency.ETH,

  // USDT
  'usdt': SupportedCurrency.USDT,
  'tether': SupportedCurrency.USDT,

  // DAI
  'dai': SupportedCurrency.DAI,
};

/**
 * Default currency for the app (USDC as primary payment method)
 */
export const DEFAULT_CURRENCY = SupportedCurrency.USDC;

/**
 * Preferred display currency (local fiat)
 */
export const DEFAULT_DISPLAY_CURRENCY = SupportedCurrency.GHS;

/**
 * Format currency amount for display
 */
export function formatCurrencyAmount(amount: number, currency: SupportedCurrency): string {
  const info = CURRENCIES[currency];

  if (info.isCrypto) {
    // Show more decimals for crypto
    const decimalsToShow = info.isStablecoin ? 2 : 4;
    return `${amount.toFixed(decimalsToShow)} ${info.symbol}`;
  } else {
    // Standard fiat formatting
    return `${info.symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: info.decimals,
      maximumFractionDigits: info.decimals,
    })}`;
  }
}

/**
 * Parse currency string from voice command
 */
export function parseCurrency(currencyStr: string): SupportedCurrency | null {
  const normalized = currencyStr.toLowerCase().trim();
  return CURRENCY_ALIASES[normalized] || null;
}
