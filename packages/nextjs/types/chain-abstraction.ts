/**
 * Chain Abstraction Types
 *
 * Types for cross-chain payments and chain detection
 */

import type { Chain } from "viem";

// Supported chains for cross-chain payments
export type SupportedChainId = 1 | 8453 | 137 | 42161 | 10 | 84532;

export interface ChainInfo {
  id: SupportedChainId;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorers: string[];
  usdcAddress?: string;
  logoUrl?: string;
  averageGasPrice?: string;
}

// Chain detection result
export interface ChainDetectionResult {
  address: string;
  activeChains: SupportedChainId[];
  recommendedChain: SupportedChainId;
  balances: ChainBalance[];
  lastActivity: Record<SupportedChainId, Date | null>;
}

export interface ChainBalance {
  chainId: SupportedChainId;
  chainName: string;
  nativeBalance: string;
  usdcBalance: string;
  totalValueUSD: string;
}

// Bridge quote for cross-chain transfers
export interface BridgeQuote {
  fromChain: SupportedChainId;
  toChain: SupportedChainId;
  fromToken: string;
  toToken: string;
  amount: string;
  estimatedOutput: string;
  estimatedGas: string;
  estimatedTime: number; // seconds
  route: BridgeRoute[];
  priceImpact: number;
  fees: BridgeFees;
}

export interface BridgeRoute {
  protocol: string;
  fromChain: SupportedChainId;
  toChain: SupportedChainId;
  fromToken: string;
  toToken: string;
  bridgeType: "native" | "lock-mint" | "liquidity";
}

export interface BridgeFees {
  bridgeFee: string;
  gasFee: string;
  protocolFee: string;
  totalFee: string;
  totalFeeUSD: string;
}

// Bridge transaction status
export interface BridgeTransaction {
  id: string;
  fromChain: SupportedChainId;
  toChain: SupportedChainId;
  fromTxHash: string;
  toTxHash?: string;
  status: BridgeStatus;
  amount: string;
  token: string;
  sender: string;
  recipient: string;
  timestamp: Date;
  estimatedCompletion?: Date;
}

export type BridgeStatus =
  | "pending"
  | "confirming"
  | "bridging"
  | "completed"
  | "failed"
  | "refunded";

// Unified balance across all chains
export interface UnifiedBalance {
  address: string;
  totalUSDC: string;
  totalValueUSD: string;
  chainBalances: ChainBalance[];
  lastUpdated: Date;
}

// Cross-chain payment intent
export interface CrossChainPaymentIntent {
  sender: string;
  recipient: string;
  amount: string;
  currency: string;
  fromChain: SupportedChainId;
  toChain: SupportedChainId;
  autoDetectChain: boolean;
  maxSlippage: number;
}

// Socket API types
export interface SocketQuoteRequest {
  fromChainId: number;
  toChainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  fromAmount: string;
  userAddress: string;
  recipient?: string;
  uniqueRoutesPerBridge?: boolean;
  sort?: "output" | "gas" | "time";
}

export interface SocketQuoteResponse {
  success: boolean;
  result: {
    routes: SocketRoute[];
    fromChainId: number;
    toChainId: number;
    fromAsset: SocketAsset;
    toAsset: SocketAsset;
  };
}

export interface SocketRoute {
  routeId: string;
  fromAmount: string;
  toAmount: string;
  usedBridgeNames: string[];
  totalGasFeesInUsd: number;
  recipient: string;
  totalUserTx: number;
  sender: string;
  userTxs: SocketUserTx[];
  serviceTime: number;
  maxServiceTime: number;
}

export interface SocketUserTx {
  userTxType: string;
  txType: string;
  chainId: number;
  toAmount: string;
  toAsset: SocketAsset;
  stepCount: number;
  routePath: string;
  sender: string;
  approvalData: any;
  steps: any[];
  gasFees: {
    gasAmount: string;
    gasLimit: number;
    asset: SocketAsset;
    feesInUsd: number;
  };
}

export interface SocketAsset {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
  logoURI: string;
  chainAgnosticId: string | null;
}

// Chain selection criteria
export interface ChainSelectionCriteria {
  prioritizeGas?: boolean;
  prioritizeSpeed?: boolean;
  preferredChain?: SupportedChainId;
  maxBridgeTime?: number; // seconds
  maxFeeUSD?: number;
}
