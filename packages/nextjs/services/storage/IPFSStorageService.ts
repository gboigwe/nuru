/**
 * IPFS Storage Service
 *
 * Client-side service for storing and retrieving voice receipts from IPFS/Filecoin
 * Uses server-side API route for actual storage operations
 *
 * Features:
 * - Store voice receipts to IPFS
 * - Retrieve receipts from IPFS gateways
 * - Verify receipt integrity
 * - Track storage statistics
 */

/**
 * Storage result from IPFS
 */
export interface StorageResult {
  success: boolean;
  cid?: string;
  metadataCid?: string;
  size?: number;
  timestamp?: string;
  gateways?: string[];
  error?: string;
}

/**
 * Receipt metadata
 */
export interface ReceiptMetadata {
  sender: string;
  recipient: string;
  amount: string;
  currency: string;
  transactionHash: string;
  voiceCommand: string;
  timestamp: string;
}

/**
 * IPFS Storage Service Class
 */
class IPFSStorageServiceClass {
  /**
   * Store voice receipt to IPFS via server API
   *
   * @param audioBlob - Audio blob to store
   * @param metadata - Payment metadata
   * @returns Storage result with CID
   */
  async storeVoiceReceipt(audioBlob: Blob, metadata: ReceiptMetadata): Promise<StorageResult> {
    try {
      // Convert blob to base64
      const audioData = await this.blobToBase64(audioBlob);

      // Call server-side API
      const response = await fetch("/api/filecoin/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioData,
          metadata,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to store to IPFS");
      }

      console.log("✅ Voice receipt stored to IPFS:", result.cid);

      return result;
    } catch (error) {
      console.error("❌ IPFS storage error:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Retrieve voice receipt from IPFS
   *
   * @param cid - IPFS Content Identifier
   * @returns Audio blob or null if not found
   */
  async retrieveVoiceReceipt(cid: string): Promise<Blob | null> {
    try {
      // Try server API first
      const response = await fetch(`/api/filecoin/store?cid=${cid}`);

      if (response.ok) {
        const blob = await response.blob();
        console.log("✅ Retrieved voice receipt from IPFS:", cid);
        return blob;
      }

      // Fallback to public gateways
      const gateways = [
        `https://ipfs.io/ipfs/${cid}`,
        `https://cloudflare-ipfs.com/ipfs/${cid}`,
        `https://gateway.pinata.cloud/ipfs/${cid}`,
      ];

      for (const gateway of gateways) {
        try {
          const gatewayResponse = await fetch(gateway, {
            signal: AbortSignal.timeout(5000),
          });

          if (gatewayResponse.ok) {
            const blob = await gatewayResponse.blob();
            console.log(`✅ Retrieved from gateway: ${gateway}`);
            return blob;
          }
        } catch (gatewayError) {
          console.warn(`Failed to fetch from ${gateway}:`, gatewayError);
          continue;
        }
      }

      console.error("❌ Failed to retrieve from all gateways");
      return null;
    } catch (error) {
      console.error("❌ IPFS retrieval error:", error);
      return null;
    }
  }

  /**
   * Get IPFS gateway URLs for a CID
   *
   * @param cid - IPFS Content Identifier
   * @returns Array of gateway URLs
   */
  getGatewayUrls(cid: string): string[] {
    return [
      `https://ipfs.io/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `https://dweb.link/ipfs/${cid}`,
    ];
  }

  /**
   * Verify receipt integrity
   *
   * @param cid - IPFS Content Identifier
   * @param expectedMetadata - Expected metadata
   * @returns Whether receipt is valid
   */
  async verifyReceipt(cid: string, expectedMetadata: Partial<ReceiptMetadata>): Promise<boolean> {
    try {
      // Retrieve the audio
      const audioBlob = await this.retrieveVoiceReceipt(cid);

      if (!audioBlob) {
        return false;
      }

      // In production, you would also retrieve and verify metadata CID
      // For now, we just check if the audio exists
      return true;
    } catch (error) {
      console.error("❌ Verification error:", error);
      return false;
    }
  }

  /**
   * Create audio player URL from CID
   *
   * @param cid - IPFS Content Identifier
   * @returns Playable URL
   */
  createPlayerUrl(cid: string): string {
    // Use fastest/most reliable gateway
    return `https://cloudflare-ipfs.com/ipfs/${cid}`;
  }

  /**
   * Download receipt as file
   *
   * @param cid - IPFS Content Identifier
   * @param filename - Download filename
   */
  async downloadReceipt(cid: string, filename: string = "voice-receipt.webm"): Promise<void> {
    try {
      const blob = await this.retrieveVoiceReceipt(cid);

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
    } catch (error) {
      console.error("❌ Download error:", error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   *
   * @returns Storage stats
   */
  getStats() {
    // In production, this would query The Graph or local storage
    return {
      totalReceipts: 0,
      totalSize: 0,
      successRate: 100,
    };
  }

  // Private helper methods

  /**
   * Convert Blob to Base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Singleton instance
export const ipfsStorageService = new IPFSStorageServiceClass();
