/**
 * useBalanceCheck Hook
 *
 * Checks if user has sufficient balance (including gas fees) for a transaction.
 * Calculates shortfall and suggests on-ramp when balance is insufficient.
 */

import { useMemo } from "react";
import { useBalance, useEstimateGas, useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";
import { useTargetNetwork } from "./useTargetNetwork";

interface BalanceCheckResult {
  hasBalance: boolean;
  balance: bigint;
  required: bigint;
  shortfall: bigint;
  estimatedGas: bigint;
  formattedShortfall: string;
  formattedBalance: string;
  formattedRequired: string;
}

interface UseBalanceCheckParams {
  to?: string;
  amount?: string | bigint;
}

export function useBalanceCheck({ to, amount }: UseBalanceCheckParams = {}): BalanceCheckResult {
  const { address } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  // Get current balance
  const { data: balanceData } = useBalance({
    address,
    chainId: targetNetwork.id,
  });

  // Estimate gas for the transaction
  const { data: gasEstimate } = useEstimateGas({
    to: to as `0x${string}`,
    value: typeof amount === "string" ? parseEther(amount) : amount,
    account: address,
  });

  const result = useMemo(() => {
    const balance = balanceData?.value || BigInt(0);
    const amountBigInt = typeof amount === "string" ? parseEther(amount || "0") : (amount || BigInt(0));
    const estimatedGas = gasEstimate || parseEther("0.001"); // Default 0.001 ETH gas estimate
    const required = amountBigInt + estimatedGas;
    const hasBalance = balance >= required;
    const shortfall = hasBalance ? BigInt(0) : required - balance;

    return {
      hasBalance,
      balance,
      required,
      shortfall,
      estimatedGas,
      formattedShortfall: formatEther(shortfall),
      formattedBalance: formatEther(balance),
      formattedRequired: formatEther(required),
    };
  }, [balanceData, amount, gasEstimate]);

  return result;
}
