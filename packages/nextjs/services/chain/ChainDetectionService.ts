/**
 * Chain Detection Service
 *
 * Detects which chains a wallet address is active on
 * and recommends the best chain for transactions
 */

import { createPublicClient, http, type Address } from "viem";
import { mainnet, base, polygon, arbitrum, optimism, baseSepolia } from "viem/chains";
import type {
  ChainDetectionResult,
  ChainBalance,
  SupportedChainId,
} from "~~/types/chain-abstraction";
import { CHAIN_CONFIG, getChainName, getUSDCAddress } from "~~/config/chains";

class ChainDetectionService {
  private clients: Map<SupportedChainId, any> = new Map();

  constructor() {
    this.initializeClients();
  }

  /**
   * Initialize RPC clients for all supported chains
   */
  private initializeClients() {
    const chainMap = {
      1: mainnet,
      8453: base,
      137: polygon,
      42161: arbitrum,
      10: optimism,
      84532: baseSepolia,
    };

    for (const [chainId, chain] of Object.entries(chainMap)) {
      this.clients.set(parseInt(chainId) as SupportedChainId,
        createPublicClient({
          chain,
          transport: http(),
        })
      );
    }
  }

  /**
   * Detect active chains for an address
   */
  async detectChains(address: Address): Promise<ChainDetectionResult> {
    const balances: ChainBalance[] = [];
    const activeChains: SupportedChainId[] = [];
    const lastActivity: Record<SupportedChainId, Date | null> = {} as any;

    // Check each chain in parallel
    const checkPromises = Array.from(this.clients.entries()).map(async ([chainId, client]) => {
      try {
        const balance = await this.getChainBalance(chainId, address, client);
        balances.push(balance);

        // Consider chain active if has any balance or recent activity
        if (parseFloat(balance.totalValueUSD) > 0.01) {
          activeChains.push(chainId);
        }

        // Get last activity (simplified - in production, query transaction history)
        lastActivity[chainId] = null;
      } catch (error) {
        console.error(`Error checking chain ${chainId}:`, error);
      }
    });

    await Promise.all(checkPromises);

    // Recommend best chain
    const recommendedChain = this.recommendChain(balances, activeChains);

    return {
      address,
      activeChains,
      recommendedChain,
      balances: balances.sort((a, b) => parseFloat(b.totalValueUSD) - parseFloat(a.totalValueUSD)),
      lastActivity,
    };
  }

  /**
   * Get balance for a specific chain
   */
  private async getChainBalance(
    chainId: SupportedChainId,
    address: Address,
    client: any
  ): Promise<ChainBalance> {
    try {
      // Get native balance
      const nativeBalance = await client.getBalance({ address });
      const nativeBalanceEth = (Number(nativeBalance) / 1e18).toFixed(6);

      // Get USDC balance (simplified - in production, use ERC20 contract)
      const usdcBalance = "0"; // Placeholder - implement ERC20 balance check

      // Estimate USD value (simplified)
      const nativePrice = this.getNativeTokenPrice(chainId);
      const totalValueUSD = (parseFloat(nativeBalanceEth) * nativePrice + parseFloat(usdcBalance)).toString();

      return {
        chainId,
        chainName: getChainName(chainId),
        nativeBalance: nativeBalanceEth,
        usdcBalance,
        totalValueUSD,
      };
    } catch (error) {
      console.error(`Error getting balance for chain ${chainId}:`, error);
      return {
        chainId,
        chainName: getChainName(chainId),
        nativeBalance: "0",
        usdcBalance: "0",
        totalValueUSD: "0",
      };
    }
  }

  /**
   * Recommend best chain based on balances and gas costs
   */
  private recommendChain(
    balances: ChainBalance[],
    activeChains: SupportedChainId[]
  ): SupportedChainId {
    // Priority 1: BASE if active (lowest gas)
    if (activeChains.includes(8453)) {
      return 8453;
    }

    // Priority 2: Chain with highest balance
    const chainWithMostBalance = balances.reduce((max, current) => {
      return parseFloat(current.totalValueUSD) > parseFloat(max.totalValueUSD) ? current : max;
    }, balances[0]);

    if (chainWithMostBalance && parseFloat(chainWithMostBalance.totalValueUSD) > 1) {
      return chainWithMostBalance.chainId;
    }

    // Priority 3: Default to BASE
    return 8453;
  }

  /**
   * Get native token price in USD (simplified)
   */
  private getNativeTokenPrice(chainId: SupportedChainId): number {
    const prices: Record<SupportedChainId, number> = {
      1: 2000,    // ETH
      8453: 2000, // ETH on Base
      137: 0.8,   // MATIC
      42161: 2000, // ETH on Arbitrum
      10: 2000,   // ETH on Optimism
      84532: 2000, // ETH on Base Sepolia
    };
    return prices[chainId] || 0;
  }

  /**
   * Quick check if address is active on a specific chain
   */
  async isActiveOnChain(address: Address, chainId: SupportedChainId): Promise<boolean> {
    const client = this.clients.get(chainId);
    if (!client) return false;

    try {
      const balance = await client.getBalance({ address });
      return Number(balance) > 0;
    } catch (error) {
      return false;
    }
  }
}

export const chainDetectionService = new ChainDetectionService();
