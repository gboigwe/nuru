import { useEffect, useState } from "react";
import { type Address, formatEther, formatUnits } from "viem";
import { useAccount, useBalance, usePublicClient } from "wagmi";
import { ERC20_ABI } from "~~/constants/abis/ERC20_ABI";
import { CURRENCIES, SupportedCurrency } from "~~/constants/currencies";

export interface USDCBalanceData {
  usdcBalance: bigint;
  usdcBalanceFormatted: string;
  ethBalance: bigint;
  ethBalanceFormatted: string;
  allowance: bigint;
  allowanceFormatted: string;
  isLoading: boolean;
  error: Error | null;
  hasEnoughUSDC: (amount: string) => boolean;
  hasEnoughETHForGas: (estimatedGas: bigint) => boolean;
  hasEnoughAllowance: (amount: string) => boolean;
  refetch: () => Promise<void>;
}

export function useUSDCBalance(contractAddress?: Address): USDCBalanceData {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const [usdcBalance, setUsdcBalance] = useState<bigint>(BigInt(0));
  const [allowance, setAllowance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get ETH balance using wagmi hook
  const { data: ethBalanceData } = useBalance({
    address,
  });

  const usdcAddress = CURRENCIES[SupportedCurrency.USDC].contractAddress as Address;
  const usdcDecimals = CURRENCIES[SupportedCurrency.USDC].decimals;

  // Fetch USDC balance and allowance
  const fetchBalances = async () => {
    if (!address || !publicClient) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch USDC balance
      const balance = (await publicClient.readContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;

      setUsdcBalance(balance);

      // Fetch USDC allowance if contract address is provided
      if (contractAddress) {
        const allowanceValue = (await publicClient.readContract({
          address: usdcAddress,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, contractAddress],
        })) as bigint;

        setAllowance(allowanceValue);
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching USDC balance:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch USDC balance"));
      setIsLoading(false);
    }
  };

  // Fetch balances on mount and when dependencies change
  useEffect(() => {
    fetchBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, contractAddress, publicClient]);

  // Helper function to check if user has enough USDC
  const hasEnoughUSDC = (amount: string): boolean => {
    try {
      const requiredAmount = BigInt(Math.floor(parseFloat(amount) * 10 ** usdcDecimals));
      return usdcBalance >= requiredAmount;
    } catch {
      return false;
    }
  };

  // Helper function to check if user has enough ETH for gas
  const hasEnoughETHForGas = (estimatedGas: bigint): boolean => {
    const ethBalance = ethBalanceData?.value || BigInt(0);
    // Add 20% buffer for gas price fluctuations
    const gasWithBuffer = (estimatedGas * BigInt(120)) / BigInt(100);
    return ethBalance >= gasWithBuffer;
  };

  // Helper function to check if user has enough allowance
  const hasEnoughAllowance = (amount: string): boolean => {
    try {
      const requiredAmount = BigInt(Math.floor(parseFloat(amount) * 10 ** usdcDecimals));
      return allowance >= requiredAmount;
    } catch {
      return false;
    }
  };

  return {
    usdcBalance,
    usdcBalanceFormatted: formatUnits(usdcBalance, usdcDecimals),
    ethBalance: ethBalanceData?.value || BigInt(0),
    ethBalanceFormatted: formatEther(ethBalanceData?.value || BigInt(0)),
    allowance,
    allowanceFormatted: formatUnits(allowance, usdcDecimals),
    isLoading,
    error,
    hasEnoughUSDC,
    hasEnoughETHForGas,
    hasEnoughAllowance,
    refetch: fetchBalances,
  };
}
