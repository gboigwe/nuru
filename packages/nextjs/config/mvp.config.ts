/**
 * Nuru MVP Configuration
 * Centralized configuration for the real MVP implementation
 */

export const MVP_CONFIG = {
  // Smart Contract Configuration
  contracts: {
    voiceRemittance: {
      address: "0xf163977578b6d41b464b989a5c7d6f9620D258B0" as const,
      network: "base-sepolia" as const,
      chainId: 84532,
    }
  },

  // Network Configuration
  networks: {
    baseSepolia: {
      name: "Base Sepolia",
      chainId: 84532,
      rpcUrl: "https://sepolia.base.org",
      blockExplorer: "https://sepolia.basescan.org",
      nativeCurrency: {
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
      }
    }
  },

  // Voice Recognition Configuration
  voice: {
    maxRecordingDuration: 15000, // 15 seconds
    confidenceThreshold: 0.6,
    supportedLanguages: ["en-US"] as const,
    openai: {
      model: "whisper-1",
      temperature: 0.1,
      language: "en",
    }
  },

  // Payment Configuration
  payments: {
    supportedCurrencies: {
      ETH: {
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
        exchangeRate: 1, // Base rate
      },
      CEDIS: {
        name: "Ghana Cedis",
        symbol: "GHS",
        decimals: 2,
        exchangeRate: 0.001, // 1000 cedis = 1 ETH for demo
      },
      USD: {
        name: "US Dollar",
        symbol: "USD",
        decimals: 2,
        exchangeRate: 0.0003, // $3000/ETH rate for demo
      },
      USDC: {
        name: "USD Coin",
        symbol: "USDC",
        decimals: 6,
        exchangeRate: 0.0003,
      },
      NAIRA: {
        name: "Nigerian Naira",
        symbol: "NGN",
        decimals: 2,
        exchangeRate: 0.00001, // 100,000 naira = 1 ETH for demo
      }
    } as const,

    limits: {
      minAmount: 0.01,
      maxAmount: 1000000,
      dailyLimit: 10000, // In USD equivalent
    },

    fees: {
      gasEstimate: 50000n, // Conservative gas estimate
      maxGasPrice: 10000000000n, // 10 gwei
    }
  },

  // ENS Configuration
  ens: {
    supportedDomains: [
      ".eth",
      ".ens.eth",
      ".family.eth",
      ".ghana.eth",
      ".nigeria.eth"
    ] as const,
    
    resolutionTimeout: 5000, // 5 seconds
  },

  // Storage Configuration
  storage: {
    filecoin: {
      network: "calibration" as const,
      retries: 3,
      timeout: 30000, // 30 seconds
    },
    
    metadata: {
      version: "1.0",
      application: "Nuru Voice Payments",
      provider: "Filecoin Synapse SDK",
    }
  },

  // UI Configuration
  ui: {
    theme: {
      primary: "green-600",
      secondary: "blue-600",
      accent: "purple-600",
      success: "green-500",
      warning: "yellow-500",
      error: "red-500",
    },

    animations: {
      recordingPulse: "animate-pulse",
      loadingSpinner: "animate-spin",
      scaleHover: "hover:scale-105",
    },

    timeouts: {
      notification: 5000, // 5 seconds
      loadingState: 30000, // 30 seconds
      errorDisplay: 10000, // 10 seconds
    }
  },

  // Development Configuration
  development: {
    enableDebugLogs: process.env.NODE_ENV === 'development',
    mockServices: false, // Set to true to use mock services
    showDevTools: process.env.NODE_ENV === 'development',
  },

  // Feature Flags
  features: {
    realBlockchainTransactions: true,
    voiceRecognition: true,
    ensResolution: true,
    filecoinStorage: true,
    transactionHistory: true,
    errorBoundaries: true,
    retryMechanism: true,
  },

  // Error Handling Configuration
  errors: {
    maxRetries: {
      blockchain: 3,
      voice: 2,
      storage: 3,
      ens: 2,
    },
    
    retryDelays: {
      blockchain: 2000,
      voice: 1000,
      storage: 1500,
      ens: 1000,
    },

    fallbacks: {
      enableVoiceFallback: true,
      enableBlockchainFallback: true,
      enableStorageFallback: true,
      enableENSFallback: true,
    }
  }
} as const;

// Type definitions for configuration
export type MVPConfig = typeof MVP_CONFIG;
export type SupportedCurrency = keyof typeof MVP_CONFIG.payments.supportedCurrencies;
export type SupportedNetwork = keyof typeof MVP_CONFIG.networks;
export type ENSDomain = typeof MVP_CONFIG.ens.supportedDomains[number];

// Helper functions
export const getCurrencyConfig = (currency: string) => {
  const upperCurrency = currency.toUpperCase() as SupportedCurrency;
  return MVP_CONFIG.payments.supportedCurrencies[upperCurrency];
};

export const isValidENSDomain = (domain: string): boolean => {
  return MVP_CONFIG.ens.supportedDomains.some(d => domain.endsWith(d));
};

export const getExchangeRate = (from: string, to: string = 'ETH'): number => {
  const fromConfig = getCurrencyConfig(from);
  const toConfig = getCurrencyConfig(to);
  
  if (!fromConfig || !toConfig) return 1;
  
  return fromConfig.exchangeRate / toConfig.exchangeRate;
};

export const formatCurrency = (amount: number, currency: string): string => {
  const config = getCurrencyConfig(currency);
  if (!config) return `${amount} ${currency}`;
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount) + ` ${config.symbol}`;
};

export default MVP_CONFIG;