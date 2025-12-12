import { useEffect, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { base } from 'wagmi/chains';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

export interface BalanceCheckResult {
  hasEnough: boolean;
  currentBalance: string;
  requiredAmount: string;
  shortfall: string;
  isLoading: boolean;
  refetch: () => void;
}

export const useBalanceCheck = (requiredAmount: string): BalanceCheckResult => {
  const { address } = useAccount();
  const { data: balance, refetch, isLoading } = useBalance({
    address,
    token: USDC_ADDRESS,
    chainId: base.id,
  });

  const [result, setResult] = useState<BalanceCheckResult>({
    hasEnough: false,
    currentBalance: '0',
    requiredAmount: '0',
    shortfall: '0',
    isLoading: true,
    refetch: () => {},
  });

  useEffect(() => {
    if (!balance || !requiredAmount) {
      setResult(prev => ({ ...prev, isLoading }));
      return;
    }

    const current = formatUnits(balance.value, 6);
    const required = parseFloat(requiredAmount);
    const hasEnough = parseFloat(current) >= required;
    const shortfall = hasEnough ? '0' : (required - parseFloat(current)).toFixed(2);

    setResult({
      hasEnough,
      currentBalance: current,
      requiredAmount: requiredAmount,
      shortfall,
      isLoading,
      refetch,
    });
  }, [balance, requiredAmount, isLoading, refetch]);

  return result;
};
