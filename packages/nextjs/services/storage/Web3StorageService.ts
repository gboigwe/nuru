/**
 * Web3.Storage Service
 *
 * Fallback storage service using Web3.Storage
 * Provides redundancy and additional IPFS pinning
 *
 * Features:
 * - Upload to Web3.Storage (Filecoin backing)
 * - Automatic IPFS pinning
 * - CAR file support
 * - Gateway URLs
 *
 * @see https://web3.storage/docs/
 */

import type { ReceiptMetadata } from "./IPFSStorageService";

export interface Web3StorageResult {
  success: boolean;
  cid?: string;
  size?: number;
  gateways?: string[];
  error?: string;
}

/**
 * Web3.Storage Service Class
 */
class Web3StorageServiceClass {
  private apiToken: string | undefined;

  constructor() {
    this.apiToken = process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN;
  }

  /**
   * Check if Web3.Storage is configured
   */
  isConfigured(): boolean {
    return !!this.apiToken;
  }

  /**
   * Store voice receipt to Web3.Storage
   *
   * @param audioBlob - Audio blob to store
   * @param metadata - Receipt metadata
   * @returns Storage result with CID
   */
  async storeVoiceReceipt(audioBlob: Blob, metadata: ReceiptMetadata): Promise<Web3StorageResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "Web3.Storage not configured",
      };
    }

    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append("file", audioBlob, "voice-receipt.webm");

      // Add metadata as separate file
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: "application/json",
      });
      formData.append("file", metadataBlob, "metadata.json");

      // Upload to Web3.Storage
      const response = await fetch("https://api.web3.storage/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Web3.Storage upload failed: ${error}`);
      }

      const result = await response.json();
      const cid = result.cid;

      console.log("✅ Voice receipt stored to Web3.Storage:", cid);

      return {
        success: true,
        cid,
        size: audioBlob.size,
        gateways: this.getGatewayUrls(cid),
      };
    } catch (error) {
      console.error("❌ Web3.Storage error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get gateway URLs for a CID
   *
   * @param cid - IPFS Content Identifier
   * @returns Array of gateway URLs
   */
  getGatewayUrls(cid: string): string[] {
    return [
      `https://w3s.link/ipfs/${cid}`,
      `https://${cid}.ipfs.w3s.link`,
      `https://ipfs.io/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
    ];
  }

  /**
   * Check storage status
   *
   * @param cid - Content Identifier
   * @returns Storage status information
   */
  async getStatus(cid: string): Promise<{
    cid: string;
    deals: number;
    pins: number;
  } | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(`https://api.web3.storage/status/${cid}`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      return {
        cid: data.cid,
        deals: data.deals?.length || 0,
        pins: data.pins?.length || 0,
      };
    } catch (error) {
      console.error("Failed to get Web3.Storage status:", error);
      return null;
    }
  }

  /**
   * List all uploads
   *
   * @returns Array of upload information
   */
  async listUploads(): Promise<
    Array<{
      cid: string;
      created: string;
      name: string;
    }>
  > {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const response = await fetch("https://api.web3.storage/user/uploads", {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return data.map((upload: { cid: string; created: string; name: string }) => ({
        cid: upload.cid,
        created: upload.created,
        name: upload.name,
      }));
    } catch (error) {
      console.error("Failed to list Web3.Storage uploads:", error);
      return [];
    }
  }
}

// Singleton instance
export const web3StorageService = new Web3StorageServiceClass();
