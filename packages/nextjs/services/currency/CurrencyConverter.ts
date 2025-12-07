/**
 * Currency Converter Service
 *
 * Provides real-time currency conversion using:
 * 1. Chainlink Price Feeds on BASE (primary)
 * 2. Public exchange rate APIs (fallback)
 *
 * Supports conversions between fiat currencies (GHS, USD, NGN, etc.) and
 * cryptocurrencies (USDC, ETH, etc.)
 */

import { SupportedCurrency, CURRENCIES } from '~~/constants/currencies';
import { chainlinkPriceFeed, CHAINLINK_PRICE_FEEDS } from './ChainlinkPriceFeed';

/**
 * Exchange rate data structure
 */
export interface ExchangeRate {
  from: SupportedCurrency;
  to: SupportedCurrency;
  rate: number;
  timestamp: number;
  source: 'chainlink' | 'api' | 'cache';
}

/**
 * Conversion result
 */
export interface ConversionResult {
  fromAmount: number;
  toAmount: number;
  fromCurrency: SupportedCurrency;
  toCurrency: SupportedCurrency;
  rate: number;
  timestamp: number;
  fee?: number;
}

class CurrencyConverterService {
  private cache: Map<string, ExchangeRate> = new Map();
  private readonly CACHE_DURATION = 60 * 1000; // 1 minute for exchange rates
  private readonly CHAINLINK_CACHE_DURATION = 30 * 1000; // 30 seconds for Chainlink (more frequent updates)
  private readonly API_RATE_LIMIT_DELAY = 1000; // 1 second between API calls
  private lastApiCall = 0;
  private priceValidationEnabled = true; // Enable price validation by default

  /**
   * Convert amount from one currency to another
   */
  async convert(
    amount: number,
    fromCurrency: SupportedCurrency,
    toCurrency: SupportedCurrency,
  ): Promise<ConversionResult> {
    // If currencies are the same, return as-is
    if (fromCurrency === toCurrency) {
      return {
        fromAmount: amount,
        toAmount: amount,
        fromCurrency,
        toCurrency,
        rate: 1,
        timestamp: Date.now(),
      };
    }

    // Get exchange rate
    const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);

    // Calculate converted amount
    const toAmount = amount * exchangeRate.rate;

    return {
      fromAmount: amount,
      toAmount,
      fromCurrency,
      toCurrency,
      rate: exchangeRate.rate,
      timestamp: exchangeRate.timestamp,
    };
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(
    from: SupportedCurrency,
    to: SupportedCurrency,
  ): Promise<ExchangeRate> {
    const cacheKey = `${from}-${to}`;

    // Check cache first
    const cached = this.getCachedRate(cacheKey);
    if (cached) {
      return cached;
    }

    // Try to get rate from external sources
    let rate: number;
    let source: 'chainlink' | 'api' | 'cache' = 'api';

    try {
      // For crypto-to-crypto, use direct conversion
      if (CURRENCIES[from].isCrypto && CURRENCIES[to].isCrypto) {
        rate = await this.getCryptoToCryptoRate(from, to);
      }
      // For fiat-to-crypto, convert through USD
      else if (!CURRENCIES[from].isCrypto && CURRENCIES[to].isCrypto) {
        rate = await this.getFiatToCryptoRate(from, to);
      }
      // For crypto-to-fiat, convert through USD
      else if (CURRENCIES[from].isCrypto && !CURRENCIES[to].isCrypto) {
        rate = await this.getCryptoToFiatRate(from, to);
      }
      // For fiat-to-fiat, use exchange API
      else {
        rate = await this.getFiatToFiatRate(from, to);
      }

      // Cache the result
      const exchangeRate: ExchangeRate = {
        from,
        to,
        rate,
        timestamp: Date.now(),
        source,
      };

      this.cache.set(cacheKey, exchangeRate);
      return exchangeRate;
    } catch (error) {
      console.error(`Failed to get exchange rate for ${from} to ${to}:`, error);
      throw new Error(`Unable to fetch exchange rate for ${from} to ${to}`);
    }
  }

  /**
   * Get crypto-to-crypto exchange rate
   */
  private async getCryptoToCryptoRate(
    from: SupportedCurrency,
    to: SupportedCurrency,
  ): Promise<number> {
    // For stablecoin to stablecoin, assume 1:1
    if (CURRENCIES[from].isStablecoin && CURRENCIES[to].isStablecoin) {
      return 1.0;
    }

    // Convert through USD for other pairs
    const fromUSD = await this.getCryptoToUSD(from);
    const toUSD = await this.getCryptoToUSD(to);

    return fromUSD / toUSD;
  }

  /**
   * Get fiat-to-crypto exchange rate
   */
  private async getFiatToCryptoRate(
    from: SupportedCurrency,
    to: SupportedCurrency,
  ): Promise<number> {
    // Convert fiat to USD first
    const fiatToUSD = from === SupportedCurrency.USD ? 1 : await this.getFiatToUSD(from);

    // Then USD to crypto
    const usdToCrypto = await this.getUSDToCrypto(to);

    return fiatToUSD * usdToCrypto;
  }

  /**
   * Get crypto-to-fiat exchange rate
   */
  private async getCryptoToFiatRate(
    from: SupportedCurrency,
    to: SupportedCurrency,
  ): Promise<number> {
    // Convert crypto to USD
    const cryptoToUSD = await this.getCryptoToUSD(from);

    // Then USD to target fiat
    const usdToFiat = to === SupportedCurrency.USD ? 1 : await this.getUSDToFiat(to);

    return cryptoToUSD * usdToFiat;
  }

  /**
   * Get fiat-to-fiat exchange rate
   */
  private async getFiatToFiatRate(
    from: SupportedCurrency,
    to: SupportedCurrency,
  ): Promise<number> {
    // Use public exchange rate API (free tier)
    // Alternative: exchangerate-api.com, fixer.io, etc.
    try {
      await this.respectRateLimit();

      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${from}`,
      );

      if (!response.ok) {
        throw new Error(`Exchange API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.rates[to] || 0;
    } catch (error) {
      console.error('Fiat exchange rate API error:', error);
      // Fallback to hardcoded rates for common pairs
      return this.getFallbackRate(from, to);
    }
  }

  /**
   * Get crypto price in USD
   * Uses Chainlink price feeds first, falls back to API
   */
  private async getCryptoToUSD(currency: SupportedCurrency): Promise<number> {
    // Stablecoins are always ~$1
    if (CURRENCIES[currency].isStablecoin) {
      return 1.0;
    }

    // Try Chainlink first for ETH
    if (currency === SupportedCurrency.ETH) {
      try {
        const priceFeedData = await chainlinkPriceFeed.getLatestPrice(
          CHAINLINK_PRICE_FEEDS['ETH/USD']
        );

        // Validate price feed data
        if (this.priceValidationEnabled && !chainlinkPriceFeed.validatePriceFeed(priceFeedData)) {
          throw new Error('Price feed validation failed');
        }

        console.log(`✅ Chainlink ETH/USD price: $${priceFeedData.price} (updated: ${new Date(priceFeedData.updatedAt * 1000).toISOString()})`);
        return priceFeedData.price;
      } catch (error) {
        console.warn('⚠️ Chainlink price feed failed, falling back to API:', error);
      }
    }

    // Fallback to CoinGecko API for crypto prices
    const coinIds: Record<string, string> = {
      [SupportedCurrency.ETH]: 'ethereum',
      [SupportedCurrency.USDC]: 'usd-coin',
      [SupportedCurrency.USDT]: 'tether',
      [SupportedCurrency.DAI]: 'dai',
    };

    const coinId = coinIds[currency];
    if (!coinId) {
      throw new Error(`Unsupported crypto currency: ${currency}`);
    }

    try {
      await this.respectRateLimit();

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }

      const data = await response.json();
      const price = data[coinId]?.usd || 0;
      console.log(`✅ CoinGecko ${currency}/USD price: $${price}`);
      return price;
    } catch (error) {
      console.error('Crypto price API error:', error);
      // Fallback to reasonable defaults
      if (currency === SupportedCurrency.ETH) return 2000; // Approx ETH price
      return 1; // Stablecoins
    }
  }

  /**
   * Get USD to crypto rate
   */
  private async getUSDToCrypto(currency: SupportedCurrency): Promise<number> {
    const cryptoToUSD = await this.getCryptoToUSD(currency);
    return 1 / cryptoToUSD;
  }

  /**
   * Get fiat currency to USD rate
   */
  private async getFiatToUSD(currency: SupportedCurrency): Promise<number> {
    return await this.getFiatToFiatRate(currency, SupportedCurrency.USD);
  }

  /**
   * Get USD to fiat currency rate
   */
  private async getUSDToFiat(currency: SupportedCurrency): Promise<number> {
    return await this.getFiatToFiatRate(SupportedCurrency.USD, currency);
  }

  /**
   * Fallback exchange rates (approximate, updated periodically)
   * Used when APIs are unavailable
   */
  private getFallbackRate(from: SupportedCurrency, to: SupportedCurrency): number {
    // Approximate rates as of 2025 (to be updated)
    const usdRates: Record<SupportedCurrency, number> = {
      [SupportedCurrency.USD]: 1.0,
      [SupportedCurrency.GHS]: 15.5, // 1 USD = 15.5 GHS
      [SupportedCurrency.NGN]: 1500, // 1 USD = 1500 NGN
      [SupportedCurrency.KES]: 145, // 1 USD = 145 KES
      [SupportedCurrency.ZAR]: 18.5, // 1 USD = 18.5 ZAR
      [SupportedCurrency.USDC]: 1.0,
      [SupportedCurrency.USDT]: 1.0,
      [SupportedCurrency.DAI]: 1.0,
      [SupportedCurrency.ETH]: 0.0005, // 1 USD = 0.0005 ETH (ETH @ $2000)
    };

    // Convert through USD
    const fromRate = usdRates[from] || 1;
    const toRate = usdRates[to] || 1;

    return toRate / fromRate;
  }

  /**
   * Respect API rate limits
   */
  private async respectRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;

    if (timeSinceLastCall < this.API_RATE_LIMIT_DELAY) {
      await new Promise(resolve =>
        setTimeout(resolve, this.API_RATE_LIMIT_DELAY - timeSinceLastCall),
      );
    }

    this.lastApiCall = Date.now();
  }

  /**
   * Get cached exchange rate if still valid
   * Uses different cache durations based on source
   */
  private getCachedRate(cacheKey: string): ExchangeRate | null {
    const cached = this.cache.get(cacheKey);

    if (cached) {
      // Use shorter cache for Chainlink prices (more fresh data)
      const cacheDuration = cached.source === 'chainlink'
        ? this.CHAINLINK_CACHE_DURATION
        : this.CACHE_DURATION;

      if (Date.now() - cached.timestamp < cacheDuration) {
        return { ...cached, source: 'cache' };
      }

      // Expired - remove from cache
      this.cache.delete(cacheKey);
    }

    return null;
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();

    for (const [key, rate] of this.cache.entries()) {
      if (now - rate.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      cacheDuration: this.CACHE_DURATION,
    };
  }
}

// Singleton instance
export const currencyConverter = new CurrencyConverterService();
