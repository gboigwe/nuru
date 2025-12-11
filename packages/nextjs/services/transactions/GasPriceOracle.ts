import { BrowserProvider } from 'ethers';

export interface GasPrice {
  baseFee: bigint;
  priorityFee: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

export class GasPriceOracle {
  private provider: BrowserProvider | null = null;
  private cache: { price: GasPrice; timestamp: number } | null = null;
  private readonly CACHE_TTL = 12000;

  initialize(provider: BrowserProvider) {
    this.provider = provider;
  }

  async getOptimalGasPrice(): Promise<GasPrice> {
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_TTL) {
      return this.cache.price;
    }

    if (!this.provider) throw new Error('Provider not initialized');

    const block = await this.provider.getBlock('latest');
    const baseFee = block?.baseFeePerGas || BigInt(0);
    const priorityFee = await this.estimatePriorityFee();

    const gasPrice: GasPrice = {
      baseFee,
      priorityFee,
      maxFeePerGas: baseFee * BigInt(2) + priorityFee,
      maxPriorityFeePerGas: priorityFee
    };

    this.cache = { price: gasPrice, timestamp: Date.now() };
    return gasPrice;
  }

  async estimatePriorityFee(): Promise<bigint> {
    if (!this.provider) throw new Error('Provider not initialized');

    try {
      const feeData = await this.provider.getFeeData();
      return feeData.maxPriorityFeePerGas || BigInt(1500000000);
    } catch {
      return BigInt(1500000000);
    }
  }

  async getSpeedUpGasPrice(currentGasPrice: bigint): Promise<bigint> {
    return (currentGasPrice * BigInt(110)) / BigInt(100);
  }

  clearCache() {
    this.cache = null;
  }
}

export const gasPriceOracle = new GasPriceOracle();
