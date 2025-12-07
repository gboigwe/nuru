// On-ramp provider types and interfaces

export type MobileMoneyProvider = 'mtn' | 'vodafone' | 'airtel' | 'mpesa';

export type OnrampMethod = 'coinbase' | 'mobile-money' | 'bank-transfer';

export type FiatCurrency = 'USD' | 'GHS' | 'NGN' | 'KES' | 'EUR' | 'GBP';

export interface FiatCurrencyInfo {
  code: FiatCurrency;
  symbol: string;
  name: string;
  flag: string;
}

export interface MobileMoneyProviderInfo {
  id: MobileMoneyProvider;
  name: string;
  logo: string;
  countries: string[];
  supportedCurrencies: FiatCurrency[];
}

export interface OnrampTransaction {
  id: string;
  provider: OnrampMethod;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: string;
  currency: FiatCurrency;
  walletAddress: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  failureReason?: string;
  metadata?: {
    phoneNumber?: string;
    mobileMoneyProvider?: MobileMoneyProvider;
    flutterwaveRef?: string;
    coinbaseOrderId?: string;
  };
}

export interface OnrampConfig {
  enabled: boolean;
  supportedMethods: OnrampMethod[];
  supportedCurrencies: FiatCurrency[];
  mobileMoneyProviders: MobileMoneyProviderInfo[];
  fees: {
    coinbase: number; // percentage
    mobileMoney: number; // percentage
    bankTransfer: number; // percentage
  };
  limits: {
    min: {
      [key in FiatCurrency]?: number;
    };
    max: {
      [key in FiatCurrency]?: number;
    };
  };
}

export const SUPPORTED_CURRENCIES: FiatCurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'GHS', symbol: '₵', name: 'Ghana Cedi', flag: '🇬🇭' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
];

export const MOBILE_MONEY_PROVIDERS: MobileMoneyProviderInfo[] = [
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    logo: '📱',
    countries: ['Ghana', 'Nigeria', 'Uganda', 'Rwanda'],
    supportedCurrencies: ['GHS', 'NGN', 'USD'],
  },
  {
    id: 'vodafone',
    name: 'Vodafone Cash',
    logo: '💳',
    countries: ['Ghana'],
    supportedCurrencies: ['GHS'],
  },
  {
    id: 'mpesa',
    name: 'M-Pesa',
    logo: '💚',
    countries: ['Kenya', 'Tanzania'],
    supportedCurrencies: ['KES', 'USD'],
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    logo: '🔴',
    countries: ['Nigeria', 'Kenya', 'Uganda'],
    supportedCurrencies: ['NGN', 'KES', 'USD'],
  },
];

export const DEFAULT_ONRAMP_CONFIG: OnrampConfig = {
  enabled: true,
  supportedMethods: ['coinbase', 'mobile-money'],
  supportedCurrencies: ['USD', 'GHS', 'NGN', 'KES', 'EUR', 'GBP'],
  mobileMoneyProviders: MOBILE_MONEY_PROVIDERS,
  fees: {
    coinbase: 1.5, // 1.5%
    mobileMoney: 2.5, // 2.5%
    bankTransfer: 1.0, // 1.0%
  },
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

// Helper functions

export const getMobileMoneyProvider = (id: MobileMoneyProvider): MobileMoneyProviderInfo | undefined => {
  return MOBILE_MONEY_PROVIDERS.find(p => p.id === id);
};

export const getCurrencyInfo = (code: FiatCurrency): FiatCurrencyInfo | undefined => {
  return SUPPORTED_CURRENCIES.find(c => c.code === code);
};

export const formatCurrencyAmount = (amount: number, currency: FiatCurrency): string => {
  const currencyInfo = getCurrencyInfo(currency);
  if (!currencyInfo) return `${amount} ${currency}`;

  return `${currencyInfo.symbol}${amount.toLocaleString()}`;
};

export const calculateFee = (amount: number, method: OnrampMethod, config: OnrampConfig = DEFAULT_ONRAMP_CONFIG): number => {
  const feePercentage = config.fees[method] || 0;
  return (amount * feePercentage) / 100;
};

export const calculateTotal = (amount: number, method: OnrampMethod, config: OnrampConfig = DEFAULT_ONRAMP_CONFIG): number => {
  return amount + calculateFee(amount, method, config);
};
