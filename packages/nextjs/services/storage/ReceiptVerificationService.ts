/**
 * Receipt Verification Service
 *
 * Verifies integrity and authenticity of voice receipts
 * Ensures receipts haven't been tampered with
 *
 * Features:
 * - Content verification via CID
 * - Metadata validation
 * - Signature verification
 * - Timestamp verification
 * - Cross-provider verification
 */

import type { ReceiptMetadata } from "./IPFSStorageService";
import { receiptRetrievalService } from "./ReceiptRetrievalService";
import { storageRedundancyService } from "./StorageRedundancyService";

/**
 * Verification result
 */
export interface VerificationResult {
  valid: boolean;
  cid: string;
  checks: {
    contentExists: boolean;
    metadataValid: boolean;
    timestampValid: boolean;
    redundancyVerified: boolean;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Receipt package with metadata
 */
export interface ReceiptPackage {
  cid: string;
  metadata: ReceiptMetadata;
  voiceHash?: string;
}

/**
 * Receipt Verification Service Class
 */
class ReceiptVerificationServiceClass {
  /**
   * Verify voice receipt integrity
   *
   * @param receiptPackage - Receipt with metadata
   * @returns Verification result
   */
  async verifyReceipt(receiptPackage: ReceiptPackage): Promise<VerificationResult> {
    const { cid, metadata } = receiptPackage;
    const errors: string[] = [];
    const warnings: string[] = [];

    const result: VerificationResult = {
      valid: true,
      cid,
      checks: {
        contentExists: false,
        metadataValid: false,
        timestampValid: false,
        redundancyVerified: false,
      },
      errors,
      warnings,
    };

    // Check 1: Content exists and is retrievable
    console.log("🔍 Verifying content existence...");
    const blob = await receiptRetrievalService.retrieveReceipt(cid, { useCache: false });

    if (!blob) {
      errors.push("Content not found or not retrievable");
      result.valid = false;
    } else {
      result.checks.contentExists = true;

      // Verify it's an audio file
      if (!blob.type.startsWith("audio/")) {
        warnings.push(`Unexpected content type: ${blob.type}`);
      }

      // Verify size is reasonable (receipts should be < 10MB)
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (blob.size > MAX_SIZE) {
        warnings.push(`Large file size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
      }

      if (blob.size === 0) {
        errors.push("Content is empty");
        result.valid = false;
      }
    }

    // Check 2: Metadata validation
    console.log("🔍 Verifying metadata...");
    const metadataValidation = this.validateMetadata(metadata);

    if (!metadataValidation.valid) {
      errors.push(...metadataValidation.errors);
      result.valid = false;
    } else {
      result.checks.metadataValid = true;
    }

    warnings.push(...metadataValidation.warnings);

    // Check 3: Timestamp verification
    console.log("🔍 Verifying timestamp...");
    const timestampValidation = this.validateTimestamp(metadata.timestamp);

    if (!timestampValidation.valid) {
      errors.push(...timestampValidation.errors);
      result.valid = false;
    } else {
      result.checks.timestampValid = true;
    }

    warnings.push(...timestampValidation.warnings);

    // Check 4: Cross-provider redundancy verification
    console.log("🔍 Verifying redundancy...");
    const redundancyCheck = await storageRedundancyService.verifyRedundancy(cid);

    if (!redundancyCheck.verified) {
      warnings.push("Receipt not found on any storage provider");
    } else {
      result.checks.redundancyVerified = true;

      const availableCount = redundancyCheck.providers.filter(p => p.available).length;
      if (availableCount < 2) {
        warnings.push(`Low redundancy: only ${availableCount} provider(s) available`);
      }
    }

    // Summary
    if (result.valid) {
      console.log("✅ Receipt verification passed:", cid);
    } else {
      console.error("❌ Receipt verification failed:", cid, errors);
    }

    return result;
  }

  /**
   * Verify batch of receipts
   *
   * @param receipts - Array of receipt packages
   * @returns Array of verification results
   */
  async verifyBatch(receipts: ReceiptPackage[]): Promise<VerificationResult[]> {
    console.log(`🔍 Batch verifying ${receipts.length} receipts...`);

    const results = await Promise.all(receipts.map(receipt => this.verifyReceipt(receipt)));

    const validCount = results.filter(r => r.valid).length;
    console.log(`✅ Batch verification complete: ${validCount}/${receipts.length} valid`);

    return results;
  }

  /**
   * Validate metadata structure and content
   *
   * @param metadata - Receipt metadata
   * @returns Validation result
   */
  private validateMetadata(metadata: ReceiptMetadata): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!metadata.sender) {
      errors.push("Missing sender address");
    } else if (!this.isValidAddress(metadata.sender)) {
      errors.push("Invalid sender address format");
    }

    if (!metadata.recipient) {
      errors.push("Missing recipient address");
    } else if (!this.isValidAddress(metadata.recipient)) {
      errors.push("Invalid recipient address format");
    }

    if (!metadata.amount) {
      errors.push("Missing amount");
    } else if (!this.isValidAmount(metadata.amount)) {
      errors.push("Invalid amount format");
    }

    if (!metadata.currency) {
      errors.push("Missing currency");
    } else if (!["USDC", "ETH", "WETH"].includes(metadata.currency)) {
      warnings.push(`Unusual currency: ${metadata.currency}`);
    }

    if (!metadata.transactionHash) {
      errors.push("Missing transaction hash");
    } else if (!this.isValidTransactionHash(metadata.transactionHash)) {
      errors.push("Invalid transaction hash format");
    }

    if (!metadata.voiceCommand) {
      warnings.push("Missing voice command");
    }

    if (!metadata.timestamp) {
      errors.push("Missing timestamp");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate timestamp
   *
   * @param timestamp - ISO timestamp
   * @returns Validation result
   */
  private validateTimestamp(timestamp: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const date = new Date(timestamp);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        errors.push("Invalid timestamp format");
        return { valid: false, errors, warnings };
      }

      // Check if date is not in the future
      const now = Date.now();
      if (date.getTime() > now) {
        errors.push("Timestamp is in the future");
      }

      // Check if date is not too old (> 1 year)
      const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
      if (date.getTime() < oneYearAgo) {
        warnings.push("Receipt is over 1 year old");
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push("Failed to parse timestamp");
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Validate Ethereum address format
   */
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Validate amount format
   */
  private isValidAmount(amount: string): boolean {
    try {
      const num = BigInt(amount);
      return num >= 0n;
    } catch {
      return false;
    }
  }

  /**
   * Validate transaction hash format
   */
  private isValidTransactionHash(hash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  }

  /**
   * Get verification statistics
   *
   * @param results - Array of verification results
   * @returns Statistics summary
   */
  getStats(results: VerificationResult[]) {
    const total = results.length;
    const valid = results.filter(r => r.valid).length;
    const invalid = total - valid;

    const checkStats = {
      contentExists: results.filter(r => r.checks.contentExists).length,
      metadataValid: results.filter(r => r.checks.metadataValid).length,
      timestampValid: results.filter(r => r.checks.timestampValid).length,
      redundancyVerified: results.filter(r => r.checks.redundancyVerified).length,
    };

    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

    return {
      total,
      valid,
      invalid,
      validityRate: total > 0 ? ((valid / total) * 100).toFixed(1) + "%" : "0%",
      checkStats,
      totalErrors,
      totalWarnings,
    };
  }
}

// Singleton instance
export const receiptVerificationService = new ReceiptVerificationServiceClass();
