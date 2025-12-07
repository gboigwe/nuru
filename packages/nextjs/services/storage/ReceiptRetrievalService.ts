/**
 * Receipt Retrieval Service
 *
 * Optimized service for retrieving and caching voice receipts
 * Provides fast access to stored receipts with intelligent caching
 *
 * Features:
 * - Multi-gateway retrieval with failover
 * - Client-side caching (IndexedDB)
 * - Batch retrieval
 * - Progress tracking
 * - Format conversion
 */

import { storageRedundancyService } from "./StorageRedundancyService";

/**
 * Cached receipt entry
 */
export interface CachedReceipt {
  cid: string;
  blob: Blob;
  cachedAt: number;
  expiresAt: number;
}

/**
 * Retrieval options
 */
export interface RetrievalOptions {
  useCache?: boolean;
  cacheExpiry?: number; // milliseconds
  preferredGateway?: string;
}

/**
 * Batch retrieval result
 */
export interface BatchRetrievalResult {
  cid: string;
  blob: Blob | null;
  success: boolean;
  error?: string;
}

/**
 * Receipt Retrieval Service Class
 */
class ReceiptRetrievalServiceClass {
  private cache: Map<string, CachedReceipt> = new Map();
  private readonly DEFAULT_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private db: IDBDatabase | null = null;

  constructor() {
    this.initializeIndexedDB();
  }

  /**
   * Initialize IndexedDB for persistent caching
   */
  private async initializeIndexedDB(): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const request = indexedDB.open("NuruReceiptCache", 1);

      request.onerror = () => {
        console.warn("IndexedDB not available, using memory cache only");
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("✅ IndexedDB cache initialized");
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains("receipts")) {
          db.createObjectStore("receipts", { keyPath: "cid" });
        }
      };
    } catch (error) {
      console.warn("Failed to initialize IndexedDB:", error);
    }
  }

  /**
   * Retrieve voice receipt with caching
   *
   * @param cid - IPFS Content Identifier
   * @param options - Retrieval options
   * @returns Audio blob or null
   */
  async retrieveReceipt(cid: string, options: RetrievalOptions = {}): Promise<Blob | null> {
    const { useCache = true, cacheExpiry = this.DEFAULT_CACHE_EXPIRY } = options;

    // Check memory cache first
    if (useCache) {
      const cached = this.cache.get(cid);

      if (cached && Date.now() < cached.expiresAt) {
        console.log("✅ Retrieved from memory cache:", cid);
        return cached.blob;
      }

      // Check IndexedDB cache
      const dbCached = await this.getFromIndexedDB(cid);
      if (dbCached && Date.now() < dbCached.expiresAt) {
        // Restore to memory cache
        this.cache.set(cid, dbCached);
        console.log("✅ Retrieved from IndexedDB cache:", cid);
        return dbCached.blob;
      }
    }

    // Retrieve from IPFS
    console.log("📥 Retrieving from IPFS:", cid);
    const blob = await storageRedundancyService.retrieveWithFailover(cid);

    if (!blob) {
      console.error("❌ Failed to retrieve receipt:", cid);
      return null;
    }

    // Cache the result
    if (useCache) {
      await this.cacheReceipt(cid, blob, cacheExpiry);
    }

    return blob;
  }

  /**
   * Retrieve multiple receipts in batch
   *
   * @param cids - Array of CIDs to retrieve
   * @param options - Retrieval options
   * @returns Array of retrieval results
   */
  async retrieveBatch(
    cids: string[],
    options: RetrievalOptions = {},
  ): Promise<BatchRetrievalResult[]> {
    console.log(`📥 Batch retrieving ${cids.length} receipts...`);

    const results = await Promise.all(
      cids.map(async cid => {
        try {
          const blob = await this.retrieveReceipt(cid, options);

          return {
            cid,
            blob,
            success: !!blob,
          };
        } catch (error) {
          return {
            cid,
            blob: null,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }),
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Batch retrieval complete: ${successCount}/${cids.length} successful`);

    return results;
  }

  /**
   * Create playable URL for audio receipt
   *
   * @param cid - IPFS Content Identifier
   * @returns Object URL for audio playback
   */
  async createPlayableUrl(cid: string): Promise<string | null> {
    const blob = await this.retrieveReceipt(cid);

    if (!blob) {
      return null;
    }

    return URL.createObjectURL(blob);
  }

  /**
   * Download receipt as file
   *
   * @param cid - Content Identifier
   * @param filename - Download filename
   */
  async downloadReceipt(cid: string, filename: string = "voice-receipt.webm"): Promise<void> {
    const blob = await this.retrieveReceipt(cid);

    if (!blob) {
      throw new Error("Failed to retrieve receipt");
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("✅ Downloaded receipt:", filename);
  }

  /**
   * Clear cache
   *
   * @param cid - Optional CID to clear, or clear all if not provided
   */
  async clearCache(cid?: string): Promise<void> {
    if (cid) {
      // Clear specific receipt
      this.cache.delete(cid);
      await this.removeFromIndexedDB(cid);
      console.log("🗑️ Cleared cache for:", cid);
    } else {
      // Clear all
      this.cache.clear();
      await this.clearIndexedDB();
      console.log("🗑️ Cleared all receipt cache");
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      memoryEntries: this.cache.size,
      totalSize: Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.blob.size, 0),
    };
  }

  // Private helper methods

  /**
   * Cache receipt in memory and IndexedDB
   */
  private async cacheReceipt(cid: string, blob: Blob, expiry: number): Promise<void> {
    const cachedEntry: CachedReceipt = {
      cid,
      blob,
      cachedAt: Date.now(),
      expiresAt: Date.now() + expiry,
    };

    // Memory cache
    this.cache.set(cid, cachedEntry);

    // IndexedDB cache
    await this.saveToIndexedDB(cachedEntry);
  }

  /**
   * Save to IndexedDB
   */
  private async saveToIndexedDB(entry: CachedReceipt): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      const transaction = this.db.transaction(["receipts"], "readwrite");
      const store = transaction.objectStore("receipts");

      // Convert blob to array buffer for storage
      const arrayBuffer = await entry.blob.arrayBuffer();

      store.put({
        cid: entry.cid,
        data: arrayBuffer,
        type: entry.blob.type,
        cachedAt: entry.cachedAt,
        expiresAt: entry.expiresAt,
      });
    } catch (error) {
      console.warn("Failed to save to IndexedDB:", error);
    }
  }

  /**
   * Get from IndexedDB
   */
  private async getFromIndexedDB(cid: string): Promise<CachedReceipt | null> {
    if (!this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(["receipts"], "readonly");
        const store = transaction.objectStore("receipts");
        const request = store.get(cid);

        request.onsuccess = () => {
          const result = request.result;

          if (!result) {
            resolve(null);
            return;
          }

          // Convert array buffer back to blob
          const blob = new Blob([result.data], { type: result.type });

          resolve({
            cid: result.cid,
            blob,
            cachedAt: result.cachedAt,
            expiresAt: result.expiresAt,
          });
        };

        request.onerror = () => {
          resolve(null);
        };
      } catch (error) {
        resolve(null);
      }
    });
  }

  /**
   * Remove from IndexedDB
   */
  private async removeFromIndexedDB(cid: string): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      const transaction = this.db.transaction(["receipts"], "readwrite");
      const store = transaction.objectStore("receipts");
      store.delete(cid);
    } catch (error) {
      console.warn("Failed to remove from IndexedDB:", error);
    }
  }

  /**
   * Clear IndexedDB
   */
  private async clearIndexedDB(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      const transaction = this.db.transaction(["receipts"], "readwrite");
      const store = transaction.objectStore("receipts");
      store.clear();
    } catch (error) {
      console.warn("Failed to clear IndexedDB:", error);
    }
  }
}

// Singleton instance
export const receiptRetrievalService = new ReceiptRetrievalServiceClass();
