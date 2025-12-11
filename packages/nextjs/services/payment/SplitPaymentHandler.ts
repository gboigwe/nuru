/**
 * Split Payment Handler
 *
 * Handles complex payment scenarios:
 * - Split payments between multiple recipients
 * - Batch payments to multiple addresses
 * - Equal and custom split ratios
 */

import { Address, parseUnits } from 'viem';

export interface SplitRecipient {
  address: Address;
  amount: string; // Amount in wei/smallest unit
  percentage?: number; // For percentage-based splits
}

export interface SplitPaymentRequest {
  totalAmount: string;
  currency: string;
  recipients: Array<{
    address: string;
    amount?: string; // If undefined, split equally
    ensName?: string;
  }>;
  splitType: 'equal' | 'custom' | 'percentage';
}

export interface SplitPaymentResult {
  success: boolean;
  recipients: SplitRecipient[];
  totalAmount: string;
  individualAmounts: Record<string, string>;
  errors?: string[];
}

export class SplitPaymentHandler {
  /**
   * Calculate split amounts for multiple recipients
   */
  calculateSplit(request: SplitPaymentRequest): SplitPaymentResult {
    const errors: string[] = [];
    const recipients: SplitRecipient[] = [];
    const individualAmounts: Record<string, string> = {};

    try {
      const totalAmount = parseFloat(request.totalAmount);

      if (totalAmount <= 0) {
        errors.push('Total amount must be greater than zero');
        return { success: false, recipients, totalAmount: '0', individualAmounts, errors };
      }

      if (request.recipients.length === 0) {
        errors.push('At least one recipient is required');
        return { success: false, recipients, totalAmount: '0', individualAmounts, errors };
      }

      switch (request.splitType) {
        case 'equal':
          return this.calculateEqualSplit(request, totalAmount);

        case 'custom':
          return this.calculateCustomSplit(request, totalAmount);

        case 'percentage':
          return this.calculatePercentageSplit(request, totalAmount);

        default:
          errors.push('Invalid split type');
          return { success: false, recipients, totalAmount: '0', individualAmounts, errors };
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error calculating split');
      return { success: false, recipients, totalAmount: '0', individualAmounts, errors };
    }
  }

  /**
   * Parse split payment command from natural language
   */
  parseSplitCommand(command: string): SplitPaymentRequest | null {
    const normalized = command.toLowerCase();

    // Pattern: "split 100 usdc between alice.eth and bob.eth"
    const splitPattern = /split\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:between|among)\s+(.+)/i;
    const match = normalized.match(splitPattern);

    if (!match) {
      return null;
    }

    const [, amount, currency, recipientsStr] = match;

    // Parse recipients (comma or "and" separated)
    const recipientNames = recipientsStr
      .split(/\s+and\s+|,\s*/)
      .map(r => r.trim())
      .filter(r => r.length > 0);

    if (recipientNames.length < 2) {
      return null;
    }

    return {
      totalAmount: amount,
      currency: currency.toUpperCase(),
      recipients: recipientNames.map(name => ({
        address: name, // Will be resolved to actual address later
        ensName: name,
      })),
      splitType: 'equal',
    };
  }

  /**
   * Validate split payment request
   */
  validateSplit(request: SplitPaymentRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate total amount
    const totalAmount = parseFloat(request.totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      errors.push('Invalid total amount');
    }

    // Validate recipients
    if (request.recipients.length === 0) {
      errors.push('At least one recipient required');
    }

    if (request.recipients.length > 10) {
      errors.push('Maximum 10 recipients allowed per split payment');
    }

    // Validate custom amounts
    if (request.splitType === 'custom') {
      const customTotal = request.recipients.reduce((sum, r) => {
        return sum + (r.amount ? parseFloat(r.amount) : 0);
      }, 0);

      if (Math.abs(customTotal - totalAmount) > 0.01) {
        errors.push(`Custom amounts (${customTotal}) don't match total (${totalAmount})`);
      }
    }

    // Validate percentage splits
    if (request.splitType === 'percentage') {
      // Check if percentages are provided in amount field
      const hasPercentages = request.recipients.every(r => r.amount && parseFloat(r.amount) <= 100);

      if (!hasPercentages) {
        errors.push('Percentage split requires percentage values (0-100)');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format split payment summary for display
   */
  formatSplitSummary(result: SplitPaymentResult, currency: string): string {
    if (!result.success) {
      return `Split payment failed: ${result.errors?.join(', ')}`;
    }

    const lines = [
      `Split payment of ${result.totalAmount} ${currency}:`,
      ...result.recipients.map((r, i) => {
        const displayAmount = Object.values(result.individualAmounts)[i];
        return `  - ${r.address.slice(0, 10)}...: ${displayAmount} ${currency}`;
      }),
    ];

    return lines.join('\n');
  }

  // Private helper methods

  private calculateEqualSplit(request: SplitPaymentRequest, totalAmount: number): SplitPaymentResult {
    const numRecipients = request.recipients.length;
    const amountPerRecipient = totalAmount / numRecipients;
    const recipients: SplitRecipient[] = [];
    const individualAmounts: Record<string, string> = {};

    // Handle rounding by giving the remainder to the first recipient
    const baseAmount = Math.floor(amountPerRecipient * 100) / 100; // 2 decimal places
    let remainingAmount = totalAmount - baseAmount * numRecipients;

    request.recipients.forEach((recipient, index) => {
      let amount = baseAmount;

      if (index === 0) {
        amount += remainingAmount; // Give remainder to first recipient
      }

      const amountStr = amount.toFixed(6);

      recipients.push({
        address: recipient.address as Address,
        amount: this.toWei(amountStr, request.currency),
      });

      individualAmounts[recipient.address] = amountStr;
    });

    return {
      success: true,
      recipients,
      totalAmount: request.totalAmount,
      individualAmounts,
    };
  }

  private calculateCustomSplit(request: SplitPaymentRequest, totalAmount: number): SplitPaymentResult {
    const recipients: SplitRecipient[] = [];
    const individualAmounts: Record<string, string> = {};
    const errors: string[] = [];

    request.recipients.forEach(recipient => {
      if (!recipient.amount) {
        errors.push(`Missing amount for recipient ${recipient.address}`);
        return;
      }

      const amount = parseFloat(recipient.amount);
      const amountStr = amount.toFixed(6);

      recipients.push({
        address: recipient.address as Address,
        amount: this.toWei(amountStr, request.currency),
      });

      individualAmounts[recipient.address] = amountStr;
    });

    if (errors.length > 0) {
      return {
        success: false,
        recipients: [],
        totalAmount: '0',
        individualAmounts: {},
        errors,
      };
    }

    return {
      success: true,
      recipients,
      totalAmount: request.totalAmount,
      individualAmounts,
    };
  }

  private calculatePercentageSplit(request: SplitPaymentRequest, totalAmount: number): SplitPaymentResult {
    const recipients: SplitRecipient[] = [];
    const individualAmounts: Record<string, string> = {};
    const errors: string[] = [];

    let totalPercentage = 0;

    request.recipients.forEach(recipient => {
      if (!recipient.amount) {
        errors.push(`Missing percentage for recipient ${recipient.address}`);
        return;
      }

      const percentage = parseFloat(recipient.amount);
      totalPercentage += percentage;

      const amount = (totalAmount * percentage) / 100;
      const amountStr = amount.toFixed(6);

      recipients.push({
        address: recipient.address as Address,
        amount: this.toWei(amountStr, request.currency),
        percentage,
      });

      individualAmounts[recipient.address] = amountStr;
    });

    // Validate total percentage
    if (Math.abs(totalPercentage - 100) > 0.01) {
      errors.push(`Percentages must total 100% (got ${totalPercentage}%)`);
    }

    if (errors.length > 0) {
      return {
        success: false,
        recipients: [],
        totalAmount: '0',
        individualAmounts: {},
        errors,
      };
    }

    return {
      success: true,
      recipients,
      totalAmount: request.totalAmount,
      individualAmounts,
    };
  }

  private toWei(amount: string, currency: string): string {
    const decimals = this.getDecimals(currency);
    return parseUnits(amount, decimals).toString();
  }

  private getDecimals(currency: string): number {
    const decimalsMap: Record<string, number> = {
      USDC: 6,
      USDT: 6,
      DAI: 18,
      ETH: 18,
      WETH: 18,
    };

    return decimalsMap[currency.toUpperCase()] || 18;
  }
}

// Export singleton instance
export const splitPaymentHandler = new SplitPaymentHandler();
