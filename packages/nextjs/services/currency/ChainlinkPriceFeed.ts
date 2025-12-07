/**
 * Chainlink Price Feed Service
 *
 * Provides decentralized, real-time price data from Chainlink oracles on BASE mainnet
 * Uses Chainlink AggregatorV3Interface for secure, tamper-proof price feeds
 *
 * Supported Price Feeds on BASE Mainnet:
 * - ETH/USD: 0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70
 * - USDC/USD: Typically 1.00 (stablecoin peg)
 *
 * @see https://docs.chain.link/data-feeds/price-feeds/addresses?network=base
 */

import { createPublicClient, http, Address, formatUnits } from "viem";
import { base } from "viem/chains";

/**
 * Chainlink Aggregator V3 Interface ABI
 * Standard interface for all Chainlink price feeds
 */
const AGGREGATOR_V3_ABI = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "description",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint80", name: "_roundId", type: "uint80" }],
    name: "getRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "version",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Chainlink Price Feed Addresses on BASE Mainnet
 */
export const CHAINLINK_PRICE_FEEDS: Record<string, Address> = {
  "ETH/USD": "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
  // USDC/USD is assumed to be $1.00 (stablecoin peg)
  // For production, you may want to add a USDC/USD feed if available
};

/**
 * Price feed data structure
 */
export interface PriceFeedData {
  price: number;
  decimals: number;
  roundId: bigint;
  updatedAt: number;
  description: string;
}

/**
 * Chainlink Price Feed Service
 */
class ChainlinkPriceFeedService {
  private client;

  constructor() {
    // Create a public client for BASE mainnet
    this.client = createPublicClient({
      chain: base,
      transport: http(),
    });
  }

  /**
   * Get latest price from a Chainlink price feed
   *
   * @param priceFeedAddress - Address of the Chainlink price feed contract
   * @returns Price feed data including price, decimals, and timestamp
   */
  async getLatestPrice(priceFeedAddress: Address): Promise<PriceFeedData> {
    try {
      // Get latest round data
      const latestRoundData = await this.client.readContract({
        address: priceFeedAddress,
        abi: AGGREGATOR_V3_ABI,
        functionName: "latestRoundData",
      });

      // Get decimals
      const decimals = await this.client.readContract({
        address: priceFeedAddress,
        abi: AGGREGATOR_V3_ABI,
        functionName: "decimals",
      });

      // Get description
      const description = await this.client.readContract({
        address: priceFeedAddress,
        abi: AGGREGATOR_V3_ABI,
        functionName: "description",
      });

      const [roundId, answer, , updatedAt] = latestRoundData;

      // Convert price from big number to decimal
      const price = parseFloat(formatUnits(answer, decimals));

      return {
        price,
        decimals,
        roundId,
        updatedAt: Number(updatedAt),
        description: description as string,
      };
    } catch (error) {
      console.error(`Failed to fetch price from ${priceFeedAddress}:`, error);
      throw new Error(`Chainlink price feed error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get ETH price in USD
   *
   * @returns ETH price in USD
   */
  async getETHPrice(): Promise<number> {
    const priceFeed = await this.getLatestPrice(CHAINLINK_PRICE_FEEDS["ETH/USD"]);
    return priceFeed.price;
  }

  /**
   * Get USDC price in USD
   * For stablecoins, we assume 1:1 peg with USD
   *
   * @returns USDC price in USD (always 1.00)
   */
  getUSDCPrice(): number {
    return 1.0;
  }

  /**
   * Validate price feed data
   * Ensures the price is fresh and within reasonable bounds
   *
   * @param data - Price feed data to validate
   * @param maxStaleness - Maximum age of price data in seconds (default: 3600 = 1 hour)
   * @returns True if price data is valid
   */
  validatePriceFeed(data: PriceFeedData, maxStaleness: number = 3600): boolean {
    const now = Math.floor(Date.now() / 1000);
    const age = now - data.updatedAt;

    // Check if price is stale
    if (age > maxStaleness) {
      console.warn(`Price feed is stale: ${age}s old (max: ${maxStaleness}s)`);
      return false;
    }

    // Check if price is reasonable (not zero or negative)
    if (data.price <= 0) {
      console.warn(`Invalid price: ${data.price}`);
      return false;
    }

    return true;
  }

  /**
   * Get conversion rate between two assets
   *
   * @param from - Source asset (e.g., "ETH", "USDC")
   * @param to - Target asset (e.g., "USD")
   * @returns Conversion rate
   */
  async getConversionRate(from: string, to: string): Promise<number> {
    // Handle same-asset conversion
    if (from === to) {
      return 1.0;
    }

    // Handle crypto-to-USD conversions
    if (to === "USD") {
      if (from === "ETH") {
        return await this.getETHPrice();
      }
      if (from === "USDC" || from === "USDT" || from === "DAI") {
        return this.getUSDCPrice();
      }
    }

    // Handle USD-to-crypto conversions
    if (from === "USD") {
      if (to === "ETH") {
        const ethPrice = await this.getETHPrice();
        return 1 / ethPrice;
      }
      if (to === "USDC" || to === "USDT" || to === "DAI") {
        return 1 / this.getUSDCPrice();
      }
    }

    // Handle crypto-to-crypto conversions
    if ((from === "ETH" && to === "USDC") || (from === "ETH" && to === "USDT") || (from === "ETH" && to === "DAI")) {
      return await this.getETHPrice();
    }

    if ((from === "USDC" && to === "ETH") || (from === "USDT" && to === "ETH") || (from === "DAI" && to === "ETH")) {
      const ethPrice = await this.getETHPrice();
      return 1 / ethPrice;
    }

    // Stablecoin to stablecoin (1:1)
    if (
      (from === "USDC" || from === "USDT" || from === "DAI") &&
      (to === "USDC" || to === "USDT" || to === "DAI")
    ) {
      return 1.0;
    }

    throw new Error(`Unsupported conversion: ${from} to ${to}`);
  }
}

// Singleton instance
export const chainlinkPriceFeed = new ChainlinkPriceFeedService();
