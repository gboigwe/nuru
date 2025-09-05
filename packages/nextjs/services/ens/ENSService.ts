import { createPublicClient, http, Address } from 'viem';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';

/**
 * ENS Service for VoicePay Africa
 * Handles ENS name resolution with caching and retry mechanisms
 */
export interface ENSProfile {
  address: string;
  name: string;
  avatar?: string;
  description?: string;
  twitter?: string;
  github?: string;
  email?: string;
}

export interface ENSResolutionResult {
  address: string | null;
  name: string;
  isValid: boolean;
  cached: boolean;
  timestamp: number;
}

export class ENSService {
  private client;
  private cache: Map<string, { address: string; timestamp: number }> = new Map();
  private reverseCache: Map<string, { name: string; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor(rpcUrl?: string) {
    this.client = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl || `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
    });
  }

  /**
   * Resolve ENS name to address with caching and retry logic
   */
  async resolveENSToAddress(ensName: string): Promise<ENSResolutionResult> {
    const normalizedName = this.normalizeENSName(ensName);
    
    if (!this.isValidENSFormat(normalizedName)) {
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
        const address = await this.client.getEnsAddress({
          name: normalize(normalizedName),
        });

        if (address) {
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
        
        // ENS name exists but no address set
        return {
          address: null,
          name: normalizedName,
          isValid: true,
          cached: false,
          timestamp: Date.now()
        };

      } catch (error) {
        console.warn(`ENS resolution attempt ${attempt} failed for ${normalizedName}:`, error);
        
        if (attempt === this.MAX_RETRIES) {
          throw new Error(`ENS resolution failed after ${attempt} attempts: ${error}`);
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
   * Reverse resolve address to ENS name
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
      const ensName = await this.client.getEnsName({
        address: address as Address,
      });

      if (ensName) {
        // Cache the result
        this.reverseCache.set(address, {
          name: ensName,
          timestamp: Date.now()
        });
      }

      return ensName;
    } catch (error) {
      console.warn(`Reverse ENS resolution failed for ${address}:`, error);
      return null;
    }
  }

  /**
   * Get ENS profile information
   */
  async getENSProfile(ensName: string): Promise<ENSProfile | null> {
    const normalizedName = this.normalizeENSName(ensName);
    
    try {
      const [address, avatar, description] = await Promise.all([
        this.client.getEnsAddress({ name: normalize(normalizedName) }),
        this.client.getEnsAvatar({ name: normalize(normalizedName) }).catch(() => null),
        this.client.getEnsText({ name: normalize(normalizedName), key: 'description' }).catch(() => null)
      ]);

      if (!address) {
        return null;
      }

      const [twitter, github, email] = await Promise.all([
        this.client.getEnsText({ name: normalize(normalizedName), key: 'com.twitter' }).catch(() => null),
        this.client.getEnsText({ name: normalize(normalizedName), key: 'com.github' }).catch(() => null),
        this.client.getEnsText({ name: normalize(normalizedName), key: 'email' }).catch(() => null)
      ]);

      return {
        address,
        name: normalizedName,
        avatar: avatar || undefined,
        description: description || undefined,
        twitter: twitter || undefined,
        github: github || undefined,
        email: email || undefined,
      };
    } catch (error) {
      console.error(`Failed to get ENS profile for ${normalizedName}:`, error);
      return null;
    }
  }

  /**
   * Validate ENS name format
   */
  validateENSName(ensName: string): { isValid: boolean; error?: string } {
    const normalized = this.normalizeENSName(ensName);
    
    if (!normalized) {
      return { isValid: false, error: 'ENS name cannot be empty' };
    }

    if (!this.isValidENSFormat(normalized)) {
      return { isValid: false, error: 'Invalid ENS name format' };
    }

    try {
      normalize(normalized);
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'ENS name contains invalid characters' };
    }
  }

  /**
   * Check if ENS name exists (has resolver)
   */
  async ensExists(ensName: string): Promise<boolean> {
    try {
      const normalizedName = this.normalizeENSName(ensName);
      const resolver = await this.client.getEnsResolver({
        name: normalize(normalizedName),
      });
      return resolver !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Batch resolve multiple ENS names
   */
  async batchResolveENS(ensNames: string[]): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();
    
    // Process in chunks of 10 to avoid rate limits
    const chunkSize = 10;
    for (let i = 0; i < ensNames.length; i += chunkSize) {
      const chunk = ensNames.slice(i, i + chunkSize);
      const promises = chunk.map(async (ensName) => {
        try {
          const result = await this.resolveENSToAddress(ensName);
          return { ensName, address: result.address };
        } catch (error) {
          return { ensName, address: null };
        }
      });

      const chunkResults = await Promise.all(promises);
      chunkResults.forEach(({ ensName, address }) => {
        results.set(ensName, address);
      });

      // Small delay between chunks
      if (i + chunkSize < ensNames.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Extract ENS names from voice command text
   */
  extractENSFromVoiceCommand(transcript: string): string[] {
    const ensNames: string[] = [];
    
    // Common voice-to-text patterns for ENS names
    const patterns = [
      // Standard pattern: "name.eth"
      /(\w+)\.eth\b/gi,
      // Spoken pattern: "name dot eth"
      /(\w+)\s+(?:dot|\.)\s+eth\b/gi,
      // Family domains: "name.family.eth"
      /(\w+)\.family\.eth\b/gi,
      // Spoken family domains: "name dot family dot eth"
      /(\w+)\s+(?:dot|\.)\s+family\s+(?:dot|\.)\s+eth\b/gi,
      // Common subdomains
      /(\w+)\.(?:pay|wallet|crypto|send)\.eth\b/gi,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(transcript)) !== null) {
        const ensName = this.normalizeENSFromSpeech(match[0]);
        if (ensName && !ensNames.includes(ensName)) {
          ensNames.push(ensName);
        }
      }
    });

    return ensNames;
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

  private normalizeENSName(ensName: string): string {
    return ensName.toLowerCase().trim();
  }

  private normalizeENSFromSpeech(spokenENS: string): string {
    return spokenENS
      .toLowerCase()
      .replace(/\s+dot\s+/g, '.')
      .replace(/\s+/g, '')
      .trim();
  }

  private isValidENSFormat(ensName: string): boolean {
    // Basic ENS validation - must end with .eth and contain valid characters
    return /^[a-z0-9\-]+(\.[a-z0-9\-]+)*\.eth$/.test(ensName);
  }

  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private getCachedAddress(ensName: string) {
    const cached = this.cache.get(ensName);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached;
    }
    if (cached) {
      this.cache.delete(ensName);
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
export const ensService = new ENSService();