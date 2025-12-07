/**
 * Storage Redundancy Service
 *
 * Manages redundant storage across multiple providers
 * Ensures voice receipts are stored with high availability
 *
 * Features:
 * - Multi-provider storage (IPFS, Web3.Storage)
 * - Automatic failover
 * - Verification across providers
 * - Health monitoring
 */

import { ipfsStorageService, type ReceiptMetadata, type StorageResult } from "./IPFSStorageService";
import { web3StorageService } from "./Web3StorageService";

/**
 * Multi-provider storage result
 */
export interface RedundantStorageResult {
  success: boolean;
  primary: {
    provider: string;
    cid?: string;
    success: boolean;
    error?: string;
  };
  fallback?: {
    provider: string;
    cid?: string;
    success: boolean;
    error?: string;
  };
  gateways: string[];
  timestamp: string;
}

/**
 * Storage provider health status
 */
export interface ProviderHealth {
  provider: string;
  available: boolean;
  latency?: number;
  lastChecked: string;
}

/**
 * Storage Redundancy Service Class
 */
class StorageRedundancyServiceClass {
  /**
   * Store voice receipt with redundancy
   *
   * Stores to primary provider (IPFS) and fallback (Web3.Storage)
   * Returns success if at least one provider succeeds
   *
   * @param audioBlob - Audio blob to store
   * @param metadata - Receipt metadata
   * @returns Redundant storage result
   */
  async storeWithRedundancy(
    audioBlob: Blob,
    metadata: ReceiptMetadata,
  ): Promise<RedundantStorageResult> {
    const timestamp = new Date().toISOString();
    const gateways: string[] = [];

    // Try primary storage (IPFS via Kubo)
    console.log("📤 Storing to primary provider (IPFS)...");
    const primaryResult = await ipfsStorageService.storeVoiceReceipt(audioBlob, metadata);

    const result: RedundantStorageResult = {
      success: primaryResult.success,
      primary: {
        provider: "IPFS",
        cid: primaryResult.cid,
        success: primaryResult.success,
        error: primaryResult.error,
      },
      gateways: primaryResult.gateways || [],
      timestamp,
    };

    // If primary succeeds, add gateways
    if (primaryResult.success && primaryResult.gateways) {
      gateways.push(...primaryResult.gateways);
    }

    // Try fallback storage (Web3.Storage)
    if (web3StorageService.isConfigured()) {
      console.log("📤 Storing to fallback provider (Web3.Storage)...");
      const fallbackResult = await web3StorageService.storeVoiceReceipt(audioBlob, metadata);

      result.fallback = {
        provider: "Web3.Storage",
        cid: fallbackResult.cid,
        success: fallbackResult.success,
        error: fallbackResult.error,
      };

      // If fallback succeeds, add gateways and update success
      if (fallbackResult.success && fallbackResult.gateways) {
        gateways.push(...fallbackResult.gateways);
        result.success = true; // At least one provider succeeded
      }
    }

    // Deduplicate gateways
    result.gateways = Array.from(new Set(gateways));

    // Log results
    if (result.success) {
      console.log("✅ Redundant storage successful:", {
        primary: result.primary.success ? "✓" : "✗",
        fallback: result.fallback?.success ? "✓" : "✗",
        cid: result.primary.cid || result.fallback?.cid,
      });
    } else {
      console.error("❌ All storage providers failed");
    }

    return result;
  }

  /**
   * Retrieve voice receipt with failover
   *
   * Tries to retrieve from available gateways in order of reliability
   *
   * @param cid - IPFS Content Identifier
   * @returns Audio blob or null
   */
  async retrieveWithFailover(cid: string): Promise<Blob | null> {
    // Get all possible gateways
    const ipfsGateways = ipfsStorageService.getGatewayUrls(cid);
    const web3Gateways = web3StorageService.getGatewayUrls(cid);

    // Combine and prioritize (Web3.Storage gateways first as they're usually faster)
    const allGateways = [
      ...web3Gateways.slice(0, 2), // First 2 Web3.Storage gateways
      ...ipfsGateways.slice(0, 2), // First 2 IPFS gateways
      ...web3Gateways.slice(2), // Remaining Web3.Storage
      ...ipfsGateways.slice(2), // Remaining IPFS
    ];

    // Try each gateway with timeout
    for (const gateway of allGateways) {
      try {
        console.log(`🔍 Trying gateway: ${gateway}`);

        const response = await fetch(gateway, {
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (response.ok) {
          const blob = await response.blob();
          console.log(`✅ Retrieved from: ${gateway}`);
          return blob;
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${gateway}:`, error);
        continue;
      }
    }

    console.error("❌ Failed to retrieve from all gateways");
    return null;
  }

  /**
   * Verify receipt exists on multiple providers
   *
   * @param cid - Content Identifier
   * @returns Verification results
   */
  async verifyRedundancy(cid: string): Promise<{
    verified: boolean;
    providers: Array<{ name: string; available: boolean }>;
  }> {
    const providers: Array<{ name: string; available: boolean }> = [];

    // Check IPFS
    try {
      const ipfsBlob = await ipfsStorageService.retrieveVoiceReceipt(cid);
      providers.push({
        name: "IPFS",
        available: !!ipfsBlob,
      });
    } catch {
      providers.push({
        name: "IPFS",
        available: false,
      });
    }

    // Check Web3.Storage if configured
    if (web3StorageService.isConfigured()) {
      try {
        const status = await web3StorageService.getStatus(cid);
        providers.push({
          name: "Web3.Storage",
          available: !!status,
        });
      } catch {
        providers.push({
          name: "Web3.Storage",
          available: false,
        });
      }
    }

    const verified = providers.some(p => p.available);

    return {
      verified,
      providers,
    };
  }

  /**
   * Check health of storage providers
   *
   * @returns Provider health status
   */
  async checkProviderHealth(): Promise<ProviderHealth[]> {
    const health: ProviderHealth[] = [];
    const timestamp = new Date().toISOString();

    // Test CID (IPFS logo - always available)
    const testCid = "QmT78zSuBmuS4z925WZfrqQ1qHaJ56DQaTfyMUF7F8ff5o";

    // Check IPFS
    const ipfsStart = Date.now();
    try {
      const response = await fetch(`https://ipfs.io/ipfs/${testCid}`, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });

      health.push({
        provider: "IPFS",
        available: response.ok,
        latency: Date.now() - ipfsStart,
        lastChecked: timestamp,
      });
    } catch {
      health.push({
        provider: "IPFS",
        available: false,
        lastChecked: timestamp,
      });
    }

    // Check Web3.Storage
    if (web3StorageService.isConfigured()) {
      const web3Start = Date.now();
      try {
        const response = await fetch(`https://w3s.link/ipfs/${testCid}`, {
          method: "HEAD",
          signal: AbortSignal.timeout(5000),
        });

        health.push({
          provider: "Web3.Storage",
          available: response.ok,
          latency: Date.now() - web3Start,
          lastChecked: timestamp,
        });
      } catch {
        health.push({
          provider: "Web3.Storage",
          available: false,
          lastChecked: timestamp,
        });
      }
    }

    return health;
  }

  /**
   * Get storage statistics
   *
   * @returns Storage stats across providers
   */
  getStats() {
    return {
      providers: {
        ipfs: {
          enabled: true,
          type: "Primary",
        },
        web3Storage: {
          enabled: web3StorageService.isConfigured(),
          type: "Fallback",
        },
      },
      redundancyLevel: web3StorageService.isConfigured() ? "High (2 providers)" : "Medium (1 provider)",
    };
  }
}

// Singleton instance
export const storageRedundancyService = new StorageRedundancyServiceClass();
