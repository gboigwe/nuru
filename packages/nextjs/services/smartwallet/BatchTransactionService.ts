/**
 * Batch Transaction Service
 *
 * Utilities for batching multiple contract calls into a single transaction
 * Optimized for Smart Wallets and Account Abstraction (ERC-4337)
 *
 * Use cases:
 * - Approve + Pay in one transaction
 * - Multiple recipient payments
 * - Gas optimization for complex workflows
 */

import type { Address, Hex } from "viem";
import { encodeFunctionData } from "viem";

/**
 * Call data structure for batch transactions
 */
export interface Call {
  to: Address;
  value?: bigint;
  data: Hex;
}

/**
 * Batch transaction parameters
 */
export interface BatchTransactionParams {
  calls: Call[];
  account: Address;
}

/**
 * Create ERC-20 approve call
 *
 * @param tokenAddress - ERC-20 token contract address
 * @param spender - Address to approve (usually payment contract)
 * @param amount - Amount to approve in wei
 * @returns Call data for approve transaction
 */
export function createApproveCall(
  tokenAddress: Address,
  spender: Address,
  amount: bigint,
): Call {
  const ERC20_ABI = [
    {
      name: "approve",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [{ name: "", type: "bool" }],
    },
  ] as const;

  const data = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "approve",
    args: [spender, amount],
  });

  return {
    to: tokenAddress,
    data,
  };
}

/**
 * Create USDC payment call
 *
 * @param contractAddress - VoiceRemittance contract address
 * @param recipient - Payment recipient address
 * @param amount - Payment amount in wei
 * @param voiceHash - IPFS hash of voice recording
 * @param metadata - Payment metadata JSON
 * @returns Call data for payment transaction
 */
export function createUSDCPaymentCall(
  contractAddress: Address,
  recipient: Address,
  amount: bigint,
  voiceHash: string,
  metadata: string,
): Call {
  const PAYMENT_ABI = [
    {
      name: "initiateUSDCPayment",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "recipient", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "voiceHash", type: "string" },
        { name: "metadata", type: "string" },
      ],
      outputs: [{ name: "", type: "uint256" }],
    },
  ] as const;

  const data = encodeFunctionData({
    abi: PAYMENT_ABI,
    functionName: "initiateUSDCPayment",
    args: [recipient, amount, voiceHash, metadata],
  });

  return {
    to: contractAddress,
    data,
  };
}

/**
 * Create batch approve + pay transaction
 *
 * Combines ERC-20 approve and payment into single transaction.
 * Perfect for Smart Wallets that support batch calls.
 *
 * @param usdcAddress - USDC token address on BASE
 * @param contractAddress - VoiceRemittance contract address
 * @param recipient - Payment recipient
 * @param amount - Payment amount in wei
 * @param voiceHash - IPFS hash of voice recording
 * @param metadata - Payment metadata JSON
 * @returns Array of calls for batch transaction
 */
export function createApproveAndPayBatch(
  usdcAddress: Address,
  contractAddress: Address,
  recipient: Address,
  amount: bigint,
  voiceHash: string,
  metadata: string,
): Call[] {
  return [
    createApproveCall(usdcAddress, contractAddress, amount),
    createUSDCPaymentCall(contractAddress, recipient, amount, voiceHash, metadata),
  ];
}

/**
 * Create multi-recipient batch payment
 *
 * Send payments to multiple recipients in a single transaction.
 * Gas efficient for bulk payouts.
 *
 * @param usdcAddress - USDC token address
 * @param contractAddress - VoiceRemittance contract address
 * @param payments - Array of payment details
 * @returns Array of calls for batch transaction
 */
export interface MultiPayment {
  recipient: Address;
  amount: bigint;
  voiceHash: string;
  metadata: string;
}

export function createMultiPaymentBatch(
  usdcAddress: Address,
  contractAddress: Address,
  payments: MultiPayment[],
): Call[] {
  // Calculate total amount for single approval
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, BigInt(0));

  // Create approve call for total amount
  const calls: Call[] = [createApproveCall(usdcAddress, contractAddress, totalAmount)];

  // Add payment call for each recipient
  for (const payment of payments) {
    calls.push(
      createUSDCPaymentCall(
        contractAddress,
        payment.recipient,
        payment.amount,
        payment.voiceHash,
        payment.metadata,
      ),
    );
  }

  return calls;
}

/**
 * Estimate gas for batch transaction
 *
 * Note: This is a rough estimate. Actual gas usage may vary.
 * Smart Wallets with paymasters may sponsor gas costs.
 *
 * @param calls - Array of calls
 * @returns Estimated gas units
 */
export function estimateBatchGas(calls: Call[]): bigint {
  // Base gas per transaction
  const BASE_GAS = BigInt(21000);

  // Estimated gas per call (varies by contract)
  const GAS_PER_CALL = BigInt(50000);

  // Total estimated gas
  return BASE_GAS + GAS_PER_CALL * BigInt(calls.length);
}

/**
 * Check if wallet supports batch transactions
 *
 * Smart Wallets (ERC-4337) support batch calls natively.
 * EOA wallets need to use multicall contracts.
 *
 * @param address - Wallet address
 * @returns Whether wallet is a Smart Wallet
 */
export async function isSmartWallet(address: Address): Promise<boolean> {
  // Check if address is a contract (Smart Wallet)
  // In a real implementation, you would check the chain
  // For now, we'll use a simple heuristic or provider check

  try {
    // Smart Wallets deployed via Coinbase use deterministic addresses
    // This is a placeholder - actual implementation would check contract code
    return true; // Assume Smart Wallet for now
  } catch {
    return false;
  }
}
