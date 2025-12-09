import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock currency converter for testing
class MockCurrencyConverter {
  private exchangeRates: Record<string, number> = {
    'GHS/USD': 0.082, // 1 GHS = 0.082 USD
    'USD/GHS': 12.20, // 1 USD = 12.20 GHS
    'NGN/USD': 0.0013, // 1 NGN = 0.0013 USD
    'USD/NGN': 770, // 1 USD = 770 NGN
  };

  async convert(amount: number, from: string, to: string): Promise<number> {
    if (from === to) return amount;
    
    const rate = this.exchangeRates[`${from}/${to}`];
    if (!rate) {
      throw new Error(`Exchange rate not found for ${from}/${to}`);
    }
    
    return amount * rate;
  }

  async getExchangeRate(from: string, to: string): Promise<number> {
    if (from === to) return 1;
    
    const rate = this.exchangeRates[`${from}/${to}`];
    if (!rate) {
      throw new Error(`Exchange rate not found for ${from}/${to}`);
    }
    
    return rate;
  }

  async convertCedisToUSDC(cedisAmount: number): Promise<number> {
    return this.convert(cedisAmount, 'GHS', 'USD');
  }

  async convertNairaToUSDC(nairaAmount: number): Promise<number> {
    return this.convert(nairaAmount, 'NGN', 'USD');
  }

  formatCurrency(amount: number, currency: string): string {
    const symbols: Record<string, string> = {
      'GHS': '₵',
      'NGN': '₦',
      'USD': '$',
      'USDC': '$',
    };
    
    const symbol = symbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  }
}

describe('CurrencyConverter', () => {
  let converter: MockCurrencyConverter;

  beforeEach(() => {
    converter = new MockCurrencyConverter();
  });

  describe('convert', () => {
    it('should convert GHS to USD', async () => {
      const result = await converter.convert(100, 'GHS', 'USD');
      expect(result).toBeCloseTo(8.2, 1);
    });

    it('should convert USD to GHS', async () => {
      const result = await converter.convert(10, 'USD', 'GHS');
      expect(result).toBeCloseTo(122, 0);
    });

    it('should convert NGN to USD', async () => {
      const result = await converter.convert(1000, 'NGN', 'USD');
      expect(result).toBeCloseTo(1.3, 1);
    });

    it('should return same amount for same currency', async () => {
      const result = await converter.convert(100, 'USD', 'USD');
      expect(result).toBe(100);
    });

    it('should throw error for unsupported pair', async () => {
      await expect(
        converter.convert(100, 'GHS', 'NGN')
      ).rejects.toThrow('Exchange rate not found');
    });
  });

  describe('getExchangeRate', () => {
    it('should get GHS/USD rate', async () => {
      const rate = await converter.getExchangeRate('GHS', 'USD');
      expect(rate).toBe(0.082);
    });

    it('should return 1 for same currency', async () => {
      const rate = await converter.getExchangeRate('USD', 'USD');
      expect(rate).toBe(1);
    });
  });

  describe('convertCedisToUSDC', () => {
    it('should convert 50 cedis to USDC', async () => {
      const result = await converter.convertCedisToUSDC(50);
      expect(result).toBeCloseTo(4.1, 1);
    });

    it('should convert 100 cedis to USDC', async () => {
      const result = await converter.convertCedisToUSDC(100);
      expect(result).toBeCloseTo(8.2, 1);
    });

    it('should handle decimal amounts', async () => {
      const result = await converter.convertCedisToUSDC(12.50);
      expect(result).toBeCloseTo(1.025, 2);
    });
  });

  describe('convertNairaToUSDC', () => {
    it('should convert 1000 naira to USDC', async () => {
      const result = await converter.convertNairaToUSDC(1000);
      expect(result).toBeCloseTo(1.3, 1);
    });

    it('should convert 10000 naira to USDC', async () => {
      const result = await converter.convertNairaToUSDC(10000);
      expect(result).toBeCloseTo(13, 0);
    });
  });

  describe('formatCurrency', () => {
    it('should format GHS with cedis symbol', () => {
      const formatted = converter.formatCurrency(100, 'GHS');
      expect(formatted).toBe('₵100.00');
    });

    it('should format NGN with naira symbol', () => {
      const formatted = converter.formatCurrency(1000, 'NGN');
      expect(formatted).toBe('₦1000.00');
    });

    it('should format USD with dollar symbol', () => {
      const formatted = converter.formatCurrency(50, 'USD');
      expect(formatted).toBe('$50.00');
    });

    it('should format USDC with dollar symbol', () => {
      const formatted = converter.formatCurrency(25.50, 'USDC');
      expect(formatted).toBe('$25.50');
    });
  });
});

describe('Currency Conversion in Voice Payments', () => {
  let converter: MockCurrencyConverter;

  beforeEach(() => {
    converter = new MockCurrencyConverter();
  });

  it('should convert voice command "send 50 cedis" to USDC', async () => {
    const cedisAmount = 50;
    const usdcAmount = await converter.convertCedisToUSDC(cedisAmount);
    
    expect(usdcAmount).toBeGreaterThan(0);
    expect(usdcAmount).toBeCloseTo(4.1, 1);
  });

  it('should handle large amounts', async () => {
    const cedisAmount = 10000;
    const usdcAmount = await converter.convertCedisToUSDC(cedisAmount);
    
    expect(usdcAmount).toBeCloseTo(820, 0);
  });

  it('should handle small amounts', async () => {
    const cedisAmount = 1;
    const usdcAmount = await converter.convertCedisToUSDC(cedisAmount);
    
    expect(usdcAmount).toBeCloseTo(0.082, 3);
  });

  it('should provide formatted display for user confirmation', () => {
    const cedisFormatted = converter.formatCurrency(50, 'GHS');
    const usdcFormatted = converter.formatCurrency(4.1, 'USDC');
    
    expect(cedisFormatted).toBe('₵50.00');
    expect(usdcFormatted).toBe('$4.10');
  });
});
