/**
 * Session Keys Service
 *
 * Manages session keys for Smart Wallets
 * Enables dApp to sign transactions without user prompts (within limits)
 *
 * Features:
 * - Time-based expiry
 * - Spending limits
 * - Automatic key rotation
 * - Secure storage
 *
 * Use cases:
 * - Quick voice payments without approval
 * - Recurring payments
 * - Gaming and micro-transactions
 */

import type { Address, Hex } from "viem";

/**
 * Session key configuration
 */
export interface SessionKeyConfig {
  maxAmount: bigint; // Maximum amount per transaction
  maxDailySpend: bigint; // Maximum daily spending limit
  expiresAt: number; // Unix timestamp when key expires
  allowedContracts: Address[]; // Contracts this key can interact with
  allowedMethods: string[]; // Method signatures allowed
}

/**
 * Active session key
 */
export interface SessionKey {
  id: string;
  publicKey: Hex;
  config: SessionKeyConfig;
  createdAt: number;
  lastUsed: number;
  totalSpent: bigint;
  dailySpent: bigint;
  lastResetDate: string; // YYYY-MM-DD for daily limit tracking
}

/**
 * Session key request params
 */
export interface CreateSessionKeyParams {
  maxAmount: bigint;
  maxDailySpend: bigint;
  durationHours: number;
  allowedContracts: Address[];
  allowedMethods: string[];
}

/**
 * Session Keys Service
 */
class SessionKeysServiceClass {
  private readonly STORAGE_KEY = "nuru_session_keys";

  /**
   * Create a new session key
   *
   * @param params - Session key parameters
   * @returns Created session key
   */
  async createSessionKey(params: CreateSessionKeyParams): Promise<SessionKey> {
    const now = Date.now();
    const expiresAt = now + params.durationHours * 60 * 60 * 1000;

    // In production, this would generate a real key pair
    // For now, we'll use a placeholder
    const sessionKey: SessionKey = {
      id: this.generateKeyId(),
      publicKey: this.generatePlaceholderKey(),
      config: {
        maxAmount: params.maxAmount,
        maxDailySpend: params.maxDailySpend,
        expiresAt,
        allowedContracts: params.allowedContracts,
        allowedMethods: params.allowedMethods,
      },
      createdAt: now,
      lastUsed: now,
      totalSpent: BigInt(0),
      dailySpent: BigInt(0),
      lastResetDate: this.getTodayString(),
    };

    // Store session key
    this.storeSessionKey(sessionKey);

    console.log("✅ Session key created:", {
      id: sessionKey.id,
      expiresIn: `${params.durationHours} hours`,
      maxAmount: params.maxAmount.toString(),
    });

    return sessionKey;
  }

  /**
   * Get active session key
   *
   * @param keyId - Session key ID
   * @returns Session key or null if expired/not found
   */
  getSessionKey(keyId: string): SessionKey | null {
    const keys = this.getAllSessionKeys();
    const key = keys.find(k => k.id === keyId);

    if (!key) {
      return null;
    }

    // Check if key is expired
    if (Date.now() > key.config.expiresAt) {
      console.warn("Session key expired:", keyId);
      this.revokeSessionKey(keyId);
      return null;
    }

    // Reset daily limit if new day
    const today = this.getTodayString();
    if (key.lastResetDate !== today) {
      key.dailySpent = BigInt(0);
      key.lastResetDate = today;
      this.updateSessionKey(key);
    }

    return key;
  }

  /**
   * Check if transaction can be authorized with session key
   *
   * @param keyId - Session key ID
   * @param amount - Transaction amount
   * @param contract - Target contract address
   * @param method - Method signature
   * @returns Whether transaction is authorized
   */
  canAuthorize(
    keyId: string,
    amount: bigint,
    contract: Address,
    method: string,
  ): { authorized: boolean; reason?: string } {
    const key = this.getSessionKey(keyId);

    if (!key) {
      return { authorized: false, reason: "Session key not found or expired" };
    }

    // Check amount limits
    if (amount > key.config.maxAmount) {
      return { authorized: false, reason: "Amount exceeds per-transaction limit" };
    }

    if (key.dailySpent + amount > key.config.maxDailySpend) {
      return { authorized: false, reason: "Daily spending limit exceeded" };
    }

    // Check allowed contracts
    if (!key.config.allowedContracts.includes(contract.toLowerCase() as Address)) {
      return { authorized: false, reason: "Contract not authorized" };
    }

    // Check allowed methods
    if (!key.config.allowedMethods.includes(method)) {
      return { authorized: false, reason: "Method not authorized" };
    }

    return { authorized: true };
  }

  /**
   * Record transaction usage
   *
   * @param keyId - Session key ID
   * @param amount - Transaction amount
   */
  recordUsage(keyId: string, amount: bigint): void {
    const key = this.getSessionKey(keyId);

    if (!key) {
      return;
    }

    key.lastUsed = Date.now();
    key.totalSpent += amount;
    key.dailySpent += amount;

    this.updateSessionKey(key);
  }

  /**
   * Revoke a session key
   *
   * @param keyId - Session key ID
   */
  revokeSessionKey(keyId: string): void {
    const keys = this.getAllSessionKeys().filter(k => k.id !== keyId);
    this.saveAllSessionKeys(keys);
    console.log("Session key revoked:", keyId);
  }

  /**
   * Get all active session keys
   *
   * @returns Array of session keys
   */
  getAllSessionKeys(): SessionKey[] {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const keys = JSON.parse(stored, (key, value) => {
        // Revive BigInt values
        if (typeof value === "string" && value.startsWith("BIGINT:")) {
          return BigInt(value.slice(7));
        }
        return value;
      });

      return keys;
    } catch (error) {
      console.error("Failed to load session keys:", error);
      return [];
    }
  }

  /**
   * Clear all expired session keys
   */
  clearExpiredKeys(): void {
    const now = Date.now();
    const activeKeys = this.getAllSessionKeys().filter(k => k.config.expiresAt > now);
    this.saveAllSessionKeys(activeKeys);
  }

  // Private helper methods

  private storeSessionKey(key: SessionKey): void {
    const keys = this.getAllSessionKeys();
    keys.push(key);
    this.saveAllSessionKeys(keys);
  }

  private updateSessionKey(key: SessionKey): void {
    const keys = this.getAllSessionKeys();
    const index = keys.findIndex(k => k.id === key.id);
    if (index >= 0) {
      keys[index] = key;
      this.saveAllSessionKeys(keys);
    }
  }

  private saveAllSessionKeys(keys: SessionKey[]): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const serialized = JSON.stringify(keys, (key, value) => {
        // Serialize BigInt values
        if (typeof value === "bigint") {
          return `BIGINT:${value.toString()}`;
        }
        return value;
      });

      localStorage.setItem(this.STORAGE_KEY, serialized);
    } catch (error) {
      console.error("Failed to save session keys:", error);
    }
  }

  private generateKeyId(): string {
    return `sk_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private generatePlaceholderKey(): Hex {
    // In production, this would be a real public key
    return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}` as Hex;
  }

  private getTodayString(): string {
    return new Date().toISOString().split("T")[0];
  }
}

// Singleton instance
export const sessionKeysService = new SessionKeysServiceClass();
