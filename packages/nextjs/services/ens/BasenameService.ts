import { createPublicClient, http, Address, encodePacked, keccak256, namehash } from 'viem';
import { base } from 'viem/chains';
import { normalize } from 'viem/ens';

/**
 * Basename Service for BASE L2 Identity
 * Handles .base.eth name resolution with caching and retry mechanisms
 *
 * Basenames are BASE's native identity system built on top of ENS
 */

// L2 Resolver Contract Address on BASE Mainnet
const BASENAME_L2_RESOLVER_ADDRESS = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD' as Address;

// Simplified L2 Resolver ABI - only the functions we need
const L2_RESOLVER_ABI = [
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'addr',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'text',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface BasenameProfile {
  address: string;
  name: string;
  avatar?: string;
  description?: string;
  twitter?: string;
  github?: string;
  email?: string;
}

export interface BasenameResolutionResult {
  address: string | null;
  name: string;
  isValid: boolean;
  cached: boolean;
  timestamp: number;
}

export class BasenameService {
  private client;
  private cache: Map<string, { address: string; timestamp: number }> = new Map();
  private reverseCache: Map<string, { name: string; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor(rpcUrl?: string) {
    this.client = createPublicClient({
      chain: base,
      transport: http(rpcUrl || `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
    });
  }

  /**
   * Resolve Basename to address with caching and retry logic
   */
  async resolveBasenameToAddress(basename: string): Promise<BasenameResolutionResult> {
    const normalizedName = this.normalizeBasename(basename);

    if (!this.isValidBasenameFormat(normalizedName)) {
      return {
        address: null,
        name: normalizedName,
        isValid: false,
        cached: false,
        timestamp: Date.now()
      };
    }

    // Check cache first
    const cached = this.getCachedAddress(normalizedName);
    if (cached) {
      return {
        address: cached.address,
        name: normalizedName,
        isValid: true,
        cached: true,
        timestamp: cached.timestamp
      };
    }

    // Attempt resolution with retry logic
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const node = namehash(normalizedName);

        const address = await this.client.readContract({
          abi: L2_RESOLVER_ABI,
          address: BASENAME_L2_RESOLVER_ADDRESS,
          functionName: 'addr',
          args: [node],
        });

        if (address && address !== '0x0000000000000000000000000000000000000000') {
          // Cache the result
          this.cache.set(normalizedName, {
            address,
            timestamp: Date.now()
          });

          return {
            address,
            name: normalizedName,
            isValid: true,
            cached: false,
            timestamp: Date.now()
          };
        }

        // Basename exists but no address set
        return {
          address: null,
          name: normalizedName,
          isValid: true,
          cached: false,
          timestamp: Date.now()
        };

      } catch (error) {
        console.warn(`Basename resolution attempt ${attempt} failed for ${normalizedName}:`, error);

        if (attempt === this.MAX_RETRIES) {
          throw new Error(`Basename resolution failed after ${attempt} attempts: ${error}`);
        }

        // Exponential backoff with jitter
        const delay = Math.min(
          this.RETRY_DELAY * Math.pow(2, attempt - 1),
          5000
        ) + Math.random() * 1000;

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      address: null,
      name: normalizedName,
      isValid: false,
      cached: false,
      timestamp: Date.now()
    };
  }

  /**
   * Reverse resolve address to Basename
   * Converts address to reverse node and queries the L2 resolver
   */
  async reverseResolve(address: string): Promise<string | null> {
    if (!this.isValidAddress(address)) {
      throw new Error('Invalid Ethereum address format');
    }

    // Check cache first
    const cached = this.getCachedName(address);
    if (cached) {
      return cached.name;
    }

    try {
      const reverseNode = this.convertReverseNodeToBytes(address as Address, base.id);

      const basename = await this.client.readContract({
        abi: L2_RESOLVER_ABI,
        address: BASENAME_L2_RESOLVER_ADDRESS,
        functionName: 'name',
        args: [reverseNode],
      });

      if (basename) {
        // Cache the result
        this.reverseCache.set(address, {
          name: basename,
          timestamp: Date.now()
        });
      }

      return basename || null;
    } catch (error) {
      console.warn(`Reverse Basename resolution failed for ${address}:`, error);
      return null;
    }
  }

  /**
   * Get Basename profile information
   */
  async getBasenameProfile(basename: string): Promise<BasenameProfile | null> {
    const normalizedName = this.normalizeBasename(basename);

    try {
      const node = namehash(normalizedName);

      // Get address first
      const address = await this.client.readContract({
        abi: L2_RESOLVER_ABI,
        address: BASENAME_L2_RESOLVER_ADDRESS,
        functionName: 'addr',
        args: [node],
      });

      if (!address || address === '0x0000000000000000000000000000000000000000') {
        return null;
      }

      // Get text records
      const [description, avatar, twitter, github, email] = await Promise.allSettled([
        this.getTextRecord(normalizedName, 'description'),
        this.getTextRecord(normalizedName, 'avatar'),
        this.getTextRecord(normalizedName, 'com.twitter'),
        this.getTextRecord(normalizedName, 'com.github'),
        this.getTextRecord(normalizedName, 'email'),
      ]);

      return {
        address,
        name: normalizedName,
        description: description.status === 'fulfilled' ? description.value : undefined,
        avatar: avatar.status === 'fulfilled' ? avatar.value : undefined,
        twitter: twitter.status === 'fulfilled' ? twitter.value : undefined,
        github: github.status === 'fulfilled' ? github.value : undefined,
        email: email.status === 'fulfilled' ? email.value : undefined,
      };
    } catch (error) {
      console.error(`Failed to get Basename profile for ${normalizedName}:`, error);
      return null;
    }
  }

  /**
   * Get text record for a Basename
   */
  async getTextRecord(basename: string, key: string): Promise<string | undefined> {
    try {
      const normalizedName = this.normalizeBasename(basename);
      const node = namehash(normalizedName);

      const text = await this.client.readContract({
        abi: L2_RESOLVER_ABI,
        address: BASENAME_L2_RESOLVER_ADDRESS,
        functionName: 'text',
        args: [node],
      });

      return text || undefined;
    } catch (error) {
      console.warn(`Failed to get text record ${key} for ${basename}:`, error);
      return undefined;
    }
  }

  /**
   * Validate Basename format
   */
  validateBasename(basename: string): { isValid: boolean; error?: string } {
    const normalized = this.normalizeBasename(basename);

    if (!normalized) {
      return { isValid: false, error: 'Basename cannot be empty' };
    }

    if (!this.isValidBasenameFormat(normalized)) {
      return { isValid: false, error: 'Invalid Basename format. Must end with .base.eth' };
    }

    try {
      normalize(normalized);
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Basename contains invalid characters' };
    }
  }

  /**
   * Check if Basename exists
   */
  async basenameExists(basename: string): Promise<boolean> {
    try {
      const result = await this.resolveBasenameToAddress(basename);
      return result.address !== null;
    } catch {
      return false;
    }
  }

  /**
   * Extract Basenames from voice command text
   */
  extractBasenameFromVoiceCommand(transcript: string): string[] {
    const basenames: string[] = [];

    // Common voice-to-text patterns for Basenames
    const patterns = [
      // Standard pattern: "name.base.eth"
      /(\w+)\.base\.eth\b/gi,
      // Spoken pattern: "name dot base dot eth"
      /(\w+)\s+(?:dot|\.)\s+base\s+(?:dot|\.)\s+eth\b/gi,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(transcript)) !== null) {
        const basename = this.normalizeBasenameFromSpeech(match[0]);
        if (basename && !basenames.includes(basename)) {
          basenames.push(basename);
        }
      }
    });

    return basenames;
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();

    // Clear address cache
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }

    // Clear reverse cache
    for (const [key, value] of this.reverseCache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.reverseCache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      addressCacheSize: this.cache.size,
      reverseCacheSize: this.reverseCache.size,
      cacheDuration: this.CACHE_DURATION
    };
  }

  // Private helper methods

  /**
   * Convert address to reverse node bytes for reverse resolution
   */
  private convertReverseNodeToBytes(address: Address, chainId: number): `0x${string}` {
    const addressFormatted = address.toLocaleLowerCase() as Address;
    const addressNode = keccak256(addressFormatted.substring(2) as `0x${string}`);
    const chainCoinType = (0x80000000 | chainId) >>> 0;
    const baseReverseNode = namehash(`${chainCoinType.toString(16).toLocaleUpperCase()}.reverse`);
    const addressReverseNode = keccak256(encodePacked(['bytes32', 'bytes32'], [baseReverseNode, addressNode]));
    return addressReverseNode;
  }

  private normalizeBasename(basename: string): string {
    let normalized = basename.toLowerCase().trim();

    // Auto-append .base.eth if not present
    if (!normalized.endsWith('.base.eth')) {
      if (normalized.endsWith('.eth')) {
        // Replace .eth with .base.eth
        normalized = normalized.replace(/\.eth$/, '.base.eth');
      } else {
        // Add .base.eth
        normalized = `${normalized}.base.eth`;
      }
    }

    return normalized;
  }

  private normalizeBasenameFromSpeech(spokenBasename: string): string {
    return spokenBasename
      .toLowerCase()
      .replace(/\s+dot\s+/g, '.')
      .replace(/\s+/g, '')
      .trim();
  }

  private isValidBasenameFormat(basename: string): boolean {
    // Must end with .base.eth and contain valid characters
    return /^[a-z0-9\-]+\.base\.eth$/.test(basename);
  }

  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private getCachedAddress(basename: string) {
    const cached = this.cache.get(basename);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached;
    }
    if (cached) {
      this.cache.delete(basename);
    }
    return null;
  }

  private getCachedName(address: string) {
    const cached = this.reverseCache.get(address);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached;
    }
    if (cached) {
      this.reverseCache.delete(address);
    }
    return null;
  }
}

// Singleton instance
export const basenameService = new BasenameService();
