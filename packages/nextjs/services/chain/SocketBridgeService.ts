/**
 * Socket Bridge Service
 *
 * Integrates with Socket API for cross-chain token bridging
 * https://socket.tech/
 */

import type {
  BridgeQuote,
  SocketQuoteRequest,
  SocketQuoteResponse,
  SupportedChainId,
  BridgeTransaction,
} from "~~/types/chain-abstraction";
import { getUSDCAddress } from "~~/config/chains";

const SOCKET_API_BASE = "https://api.socket.tech/v2";
const SOCKET_API_KEY = process.env.NEXT_PUBLIC_SOCKET_API_KEY || "";

class SocketBridgeService {
  /**
   * Get bridge quote for cross-chain transfer
   */
  async getQuote(
    fromChain: SupportedChainId,
    toChain: SupportedChainId,
    amount: string,
    userAddress: string
  ): Promise<BridgeQuote | null> {
    if (!SOCKET_API_KEY) {
      console.warn("Socket API key not configured");
      return null;
    }

    const fromToken = getUSDCAddress(fromChain);
    const toToken = getUSDCAddress(toChain);

    if (!fromToken || !toToken) {
      throw new Error("USDC not supported on one of the chains");
    }

    const request: SocketQuoteRequest = {
      fromChainId: fromChain,
      toChainId: toChain,
      fromTokenAddress: fromToken,
      toTokenAddress: toToken,
      fromAmount: this.toWei(amount, 6), // USDC has 6 decimals
      userAddress,
      uniqueRoutesPerBridge: true,
      sort: "output",
    };

    try {
      const response = await fetch(`${SOCKET_API_BASE}/quote?${new URLSearchParams(request as any)}`, {
        headers: {
          "API-KEY": SOCKET_API_KEY,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Socket API error: ${response.statusText}`);
      }

      const data: SocketQuoteResponse = await response.json();

      if (!data.success || !data.result.routes.length) {
        return null;
      }

      // Use best route (first one, already sorted by output)
      const bestRoute = data.result.routes[0];

      return this.convertSocketQuoteToBridgeQuote(bestRoute, fromChain, toChain, fromToken, toToken, amount);
    } catch (error) {
      console.error("Socket quote error:", error);
      return null;
    }
  }

  /**
   * Convert Socket route to BridgeQuote
   */
  private convertSocketQuoteToBridgeQuote(
    route: any,
    fromChain: SupportedChainId,
    toChain: SupportedChainId,
    fromToken: string,
    toToken: string,
    amount: string
  ): BridgeQuote {
    const gasFeeUSD = route.totalGasFeesInUsd?.toString() || "0";

    return {
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount,
      estimatedOutput: this.fromWei(route.toAmount, 6),
      estimatedGas: gasFeeUSD,
      estimatedTime: route.serviceTime || 300,
      route: route.usedBridgeNames?.map((name: string) => ({
        protocol: name,
        fromChain,
        toChain,
        fromToken,
        toToken,
        bridgeType: "lock-mint" as const,
      })) || [],
      priceImpact: 0, // Calculate from route if available
      fees: {
        bridgeFee: "0",
        gasFee: gasFeeUSD,
        protocolFee: "0",
        totalFee: gasFeeUSD,
        totalFeeUSD: gasFeeUSD,
      },
    };
  }

  /**
   * Execute bridge transaction
   */
  async executeBridge(quote: BridgeQuote, userAddress: string): Promise<BridgeTransaction> {
    // This would integrate with Socket's build transaction API
    // For now, return a mock transaction
    return {
      id: `bridge-${Date.now()}`,
      fromChain: quote.fromChain,
      toChain: quote.toChain,
      fromTxHash: "0x...",
      status: "pending",
      amount: quote.amount,
      token: "USDC",
      sender: userAddress,
      recipient: userAddress,
      timestamp: new Date(),
      estimatedCompletion: new Date(Date.now() + quote.estimatedTime * 1000),
    };
  }

  /**
   * Check transaction status
   */
  async checkStatus(transactionId: string): Promise<BridgeTransaction | null> {
    // This would query Socket's status API
    // For now, return null
    return null;
  }

  /**
   * Convert to wei (for USDC, 6 decimals)
   */
  private toWei(amount: string, decimals: number): string {
    const value = parseFloat(amount) * Math.pow(10, decimals);
    return Math.floor(value).toString();
  }

  /**
   * Convert from wei
   */
  private fromWei(amount: string, decimals: number): string {
    const value = parseFloat(amount) / Math.pow(10, decimals);
    return value.toFixed(decimals);
  }

  /**
   * Check if Socket API is available
   */
  isAvailable(): boolean {
    return SOCKET_API_KEY !== "";
  }
}

export const socketBridgeService = new SocketBridgeService();
