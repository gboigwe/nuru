'use client';

import { useAccount, useChainId } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

export const NetworkStatusIndicator = () => {
  const chainId = useChainId();
  const { isConnected } = useAccount();

  if (!isConnected) return null;

  const isBase = chainId === base.id;
  const isBaseSepolia = chainId === baseSepolia.id;
  const isSupported = isBase || isBaseSepolia;

  return (
    <div className={`
      inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium
      ${isSupported 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
      }
    `}>
      <div className={`w-2 h-2 rounded-full ${isSupported ? 'bg-green-600' : 'bg-red-600'}`}></div>
      {isBase && 'BASE Mainnet'}
      {isBaseSepolia && 'BASE Sepolia'}
      {!isSupported && 'Unsupported Network'}
    </div>
  );
};
