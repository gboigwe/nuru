/**
 * Chain Configuration
 *
 * Centralized configuration for all supported chains
 */

import type { ChainInfo, SupportedChainId } from "~~/types/chain-abstraction";

export const CHAIN_CONFIG: Record<SupportedChainId, ChainInfo> = {
  // Ethereum Mainnet
  1: {
    id: 1,
    name: "Ethereum",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [
      "https://eth-mainnet.g.alchemy.com/v2/",
      "https://mainnet.infura.io/v3/",
      "https://rpc.ankr.com/eth",
    ],
    blockExplorers: ["https://etherscan.io"],
    usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    logoUrl: "/chains/ethereum.svg",
    averageGasPrice: "20",
  },

  // Base Mainnet
  8453: {
    id: 8453,
    name: "Base",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://mainnet.base.org", "https://base.publicnode.com"],
    blockExplorers: ["https://basescan.org"],
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    logoUrl: "/chains/base.svg",
    averageGasPrice: "0.001",
  },

  // Polygon
  137: {
    id: 137,
    name: "Polygon",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    rpcUrls: [
      "https://polygon-rpc.com",
      "https://polygon-mainnet.g.alchemy.com/v2/",
      "https://rpc.ankr.com/polygon",
    ],
    blockExplorers: ["https://polygonscan.com"],
    usdcAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    logoUrl: "/chains/polygon.svg",
    averageGasPrice: "30",
  },

  // Arbitrum One
  42161: {
    id: 42161,
    name: "Arbitrum",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [
      "https://arb1.arbitrum.io/rpc",
      "https://arbitrum-mainnet.infura.io/v3/",
      "https://rpc.ankr.com/arbitrum",
    ],
    blockExplorers: ["https://arbiscan.io"],
    usdcAddress: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    logoUrl: "/chains/arbitrum.svg",
    averageGasPrice: "0.1",
  },

  // Optimism
  10: {
    id: 10,
    name: "Optimism",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: [
      "https://mainnet.optimism.io",
      "https://optimism-mainnet.infura.io/v3/",
      "https://rpc.ankr.com/optimism",
    ],
    blockExplorers: ["https://optimistic.etherscan.io"],
    usdcAddress: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
    logoUrl: "/chains/optimism.svg",
    averageGasPrice: "0.001",
  },

  // Base Sepolia (Testnet)
  84532: {
    id: 84532,
    name: "Base Sepolia",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://sepolia.base.org"],
    blockExplorers: ["https://sepolia.basescan.org"],
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    logoUrl: "/chains/base.svg",
    averageGasPrice: "0.001",
  },
};

// Get chain info by ID
export function getChainInfo(chainId: SupportedChainId): ChainInfo | undefined {
  return CHAIN_CONFIG[chainId];
}

// Get all supported chain IDs
export function getSupportedChainIds(): SupportedChainId[] {
  return Object.keys(CHAIN_CONFIG).map(id => parseInt(id) as SupportedChainId);
}

// Get USDC address for a chain
export function getUSDCAddress(chainId: SupportedChainId): string | undefined {
  return CHAIN_CONFIG[chainId]?.usdcAddress;
}

// Check if chain is supported
export function isChainSupported(chainId: number): chainId is SupportedChainId {
  return chainId in CHAIN_CONFIG;
}

// Get chain name
export function getChainName(chainId: SupportedChainId): string {
  return CHAIN_CONFIG[chainId]?.name || "Unknown Chain";
}

// Get chains sorted by gas price (cheapest first)
export function getChainsByGasPrice(): ChainInfo[] {
  return Object.values(CHAIN_CONFIG).sort((a, b) => {
    const gasA = parseFloat(a.averageGasPrice || "999");
    const gasB = parseFloat(b.averageGasPrice || "999");
    return gasA - gasB;
  });
}

// Recommended chain for different use cases
export const RECOMMENDED_CHAINS = {
  lowest_gas: 8453, // Base
  fastest: 42161, // Arbitrum
  most_liquid: 1, // Ethereum
  default: 8453, // Base
} as const;
