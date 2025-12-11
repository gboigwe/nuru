import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ENS service for testing
class MockENSService {
  async resolveENSToAddress(ensName: string): Promise<string | null> {
    const mockAddresses: Record<string, string> = {
      'vitalik.eth': '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      'mama.family.eth': '0x1234567890123456789012345678901234567890',
      'test.eth': '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    };
    return mockAddresses[ensName.toLowerCase()] || null;
  }

  async reverseResolve(address: string): Promise<string | null> {
    const mockNames: Record<string, string> = {
      '0xd8da6bf26964af9d7eed9e03e53415d37aa96045': 'vitalik.eth',
      '0x1234567890123456789012345678901234567890': 'mama.family.eth',
    };
    return mockNames[address.toLowerCase()] || null;
  }

  async validateENSName(ensName: string): Promise<boolean> {
    return /^[a-z0-9-]+(\\.[a-z0-9-]+)*\\.eth$/.test(ensName);
  }

  isValidENSFormat(ensName: string): boolean {
    return /^[a-z0-9-]+(\\.[a-z0-9-]+)*\\.eth$/.test(ensName);
  }
}

describe('ENSService', () => {
  let ensService: MockENSService;

  beforeEach(() => {
    ensService = new MockENSService();
  });

  describe('resolveENSToAddress', () => {
    it('should resolve vitalik.eth to correct address', async () => {
      const address = await ensService.resolveENSToAddress('vitalik.eth');
      expect(address).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    });

    it('should resolve mama.family.eth', async () => {
      const address = await ensService.resolveENSToAddress('mama.family.eth');
      expect(address).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should return null for non-existent ENS', async () => {
      const address = await ensService.resolveENSToAddress('nonexistent.eth');
      expect(address).toBeNull();
    });

    it('should handle case insensitivity', async () => {
      const address1 = await ensService.resolveENSToAddress('VITALIK.ETH');
      const address2 = await ensService.resolveENSToAddress('vitalik.eth');
      expect(address1).toBe(address2);
    });
  });

  describe('reverseResolve', () => {
    it('should reverse resolve vitalik address', async () => {
      const name = await ensService.reverseResolve('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
      expect(name).toBe('vitalik.eth');
    });

    it('should return null for address without ENS', async () => {
      const name = await ensService.reverseResolve('0x0000000000000000000000000000000000000000');
      expect(name).toBeNull();
    });

    it('should handle case insensitivity for addresses', async () => {
      const name1 = await ensService.reverseResolve('0xD8DA6BF26964AF9D7EED9E03E53415D37AA96045');
      const name2 = await ensService.reverseResolve('0xd8da6bf26964af9d7eed9e03e53415d37aa96045');
      expect(name1).toBe(name2);
    });
  });

  describe('validateENSName', () => {
    it('should validate correct ENS names', async () => {
      expect(await ensService.validateENSName('test.eth')).toBe(true);
      expect(await ensService.validateENSName('mama.family.eth')).toBe(true);
      expect(await ensService.validateENSName('my-wallet.eth')).toBe(true);
    });

    it('should reject invalid ENS names', async () => {
      expect(await ensService.validateENSName('test')).toBe(false);
      expect(await ensService.validateENSName('test.com')).toBe(false);
      expect(await ensService.validateENSName('.eth')).toBe(false);
      expect(await ensService.validateENSName('test..eth')).toBe(false);
    });

    it('should reject ENS with uppercase', async () => {
      expect(await ensService.validateENSName('TEST.eth')).toBe(false);
      expect(await ensService.validateENSName('Test.eth')).toBe(false);
    });

    it('should reject ENS with special characters', async () => {
      expect(await ensService.validateENSName('test@.eth')).toBe(false);
      expect(await ensService.validateENSName('test!.eth')).toBe(false);
      expect(await ensService.validateENSName('test_.eth')).toBe(false);
    });
  });

  describe('isValidENSFormat', () => {
    it('should validate ENS format', () => {
      expect(ensService.isValidENSFormat('test.eth')).toBe(true);
      expect(ensService.isValidENSFormat('sub.domain.eth')).toBe(true);
      expect(ensService.isValidENSFormat('my-name.eth')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(ensService.isValidENSFormat('test')).toBe(false);
      expect(ensService.isValidENSFormat('test.com')).toBe(false);
      expect(ensService.isValidENSFormat('')).toBe(false);
    });
  });
});

describe('ENS Integration with Voice Commands', () => {
  let ensService: MockENSService;

  beforeEach(() => {
    ensService = new MockENSService();
  });

  it('should extract and resolve ENS from voice command', async () => {
    const voiceCommand = 'send 50 cedis to mama.family.eth';
    const ensMatch = voiceCommand.match(/([a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.eth)/i);
    
    expect(ensMatch).toBeTruthy();
    if (ensMatch) {
      const ensName = ensMatch[1];
      const address = await ensService.resolveENSToAddress(ensName);
      expect(address).toBeTruthy();
    }
  });

  it('should handle voice recognition errors in ENS', async () => {
    // Simulate voice recognition error: "dot eat" instead of ".eth"
    const incorrectCommand = 'send 50 cedis to mama dot family dot eat';
    const corrected = incorrectCommand.replace(/dot/g, '.').replace(/eat/g, 'eth');
    
    const ensMatch = corrected.match(/([a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.eth)/i);
    expect(ensMatch).toBeTruthy();
  });

  it('should validate ENS before attempting resolution', async () => {
    const validENS = 'test.eth';
    const invalidENS = 'test.com';

    expect(await ensService.validateENSName(validENS)).toBe(true);
    expect(await ensService.validateENSName(invalidENS)).toBe(false);
  });
});
