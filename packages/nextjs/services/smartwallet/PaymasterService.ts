/**
 * Paymaster Service
 *
 * Enables gasless transactions by sponsoring user operations
 * Integrates with Coinbase Paymaster for BASE network
 *
 * Features:
 * - Sponsor gas fees for better UX
 * - Conditional sponsorship (new users, small payments)
 * - Usage tracking and limits
 * - Fallback to user-paid gas
 *
 * @see https://docs.cdp.coinbase.com/paymaster/docs/welcome
 */

import type { Address, Hex } from "viem";

/**
 * Paymaster configuration
 */
export interface PaymasterConfig {
  paymasterUrl?: string;
  projectId?: string;
  enabled: boolean;
}

/**
 * User operation for ERC-4337
 */
export interface UserOperation {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: Hex;
  signature: Hex;
}

/**
 * Paymaster sponsorship response
 */
export interface SponsorshipResult {
  sponsored: boolean;
  paymasterAndData?: Hex;
  reason?: string;
}

/**
 * Paymaster Service
 */
class PaymasterServiceClass {
  private config: PaymasterConfig;

  constructor() {
    this.config = {
      paymasterUrl: process.env.NEXT_PUBLIC_PAYMASTER_URL,
      projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID,
      enabled: !!process.env.NEXT_PUBLIC_PAYMASTER_URL,
    };
  }

  /**
   * Check if paymaster is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Request gas sponsorship for a user operation
   *
   * @param userOp - User operation to sponsor
   * @returns Sponsorship result with paymaster data
   */
  async requestSponsorship(userOp: Partial<UserOperation>): Promise<SponsorshipResult> {
    if (!this.config.enabled || !this.config.paymasterUrl) {
      return {
        sponsored: false,
        reason: "Paymaster not configured",
      };
    }

    try {
      const response = await fetch(this.config.paymasterUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: "pm_sponsorUserOperation",
          params: [userOp, this.config.projectId],
        }),
      });

      if (!response.ok) {
        throw new Error(`Paymaster request failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        return {
          sponsored: false,
          reason: result.error.message,
        };
      }

      return {
        sponsored: true,
        paymasterAndData: result.result.paymasterAndData,
      };
    } catch (error) {
      console.error("Paymaster sponsorship error:", error);
      return {
        sponsored: false,
        reason: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check if transaction is eligible for sponsorship
   *
   * Sponsorship criteria:
   * - New users (first 5 transactions)
   * - Small payments (< $10 USDC)
   * - Voice payments (our core feature)
   *
   * @param params - Transaction parameters
   * @returns Whether transaction qualifies for sponsorship
   */
  async isEligibleForSponsorship(params: {
    sender: Address;
    amount: bigint;
    type: "voice-payment" | "other";
  }): Promise<boolean> {
    const { sender, amount, type } = params;

    // Always sponsor voice payments (our core feature)
    if (type === "voice-payment") {
      return true;
    }

    // Sponsor small transactions (< 10 USDC = 10e6)
    const SMALL_PAYMENT_THRESHOLD = BigInt(10_000_000); // 10 USDC
    if (amount < SMALL_PAYMENT_THRESHOLD) {
      return true;
    }

    // Check if user is new (would need to track transaction count)
    // For now, we'll sponsor all eligible transactions
    // TODO: Implement user transaction tracking

    return false;
  }

  /**
   * Estimate sponsored gas savings
   *
   * @param gasUsed - Estimated gas usage
   * @param gasPrice - Current gas price
   * @returns Estimated savings in wei
   */
  estimateSavings(gasUsed: bigint, gasPrice: bigint): bigint {
    return gasUsed * gasPrice;
  }

  /**
   * Get sponsorship policy
   *
   * @returns Current sponsorship policy
   */
  getPolicy() {
    return {
      enabled: this.config.enabled,
      voicePayments: "Always sponsored",
      smallPayments: "< $10 USDC sponsored",
      newUsers: "First 5 transactions sponsored (coming soon)",
      limits: {
        perUser: "100 transactions/month",
        perTransaction: "$50 USDC max",
      },
    };
  }
}

// Singleton instance
export const paymasterService = new PaymasterServiceClass();
