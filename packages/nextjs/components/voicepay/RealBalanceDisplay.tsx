'use client';

import { useBalance } from 'wagmi';
import { base } from 'wagmi/chains';
import { formatUnits } from 'viem';

interface RealBalanceDisplayProps {
  address: `0x${string}`;
}

export const RealBalanceDisplay = ({ address }: RealBalanceDisplayProps) => {
  const { data: usdcBalance, isLoading: isLoadingUSDC } = useBalance({
    address,
    token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    chainId: base.id,
  });

  const { data: ethBalance, isLoading: isLoadingETH } = useBalance({
    address,
    chainId: base.id,
  });

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Your Balance</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">USDC</span>
          <div className="text-right">
            {isLoadingUSDC ? (
              <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-blue-600">
                {usdcBalance ? formatUnits(usdcBalance.value, 6) : '0.00'}
              </div>
            )}
            <div className="text-xs text-gray-500">on BASE</div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t">
          <span className="text-gray-600">ETH</span>
          <div className="text-right">
            {isLoadingETH ? (
              <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>
            ) : (
              <div className="text-xl font-semibold text-gray-700">
                {ethBalance ? parseFloat(formatUnits(ethBalance.value, 18)).toFixed(4) : '0.0000'}
              </div>
            )}
            <div className="text-xs text-gray-500">for gas fees</div>
          </div>
        </div>
      </div>
    </div>
  );
};
