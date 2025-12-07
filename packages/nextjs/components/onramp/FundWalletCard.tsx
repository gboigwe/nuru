'use client';

import { FundButton, getOnrampBuyUrl } from '@coinbase/onchainkit/fund';
import { useAccount } from 'wagmi';
import { base } from 'wagmi/chains';

interface FundWalletCardProps {
  targetAmount?: string; // Amount user needs
  onSuccess?: () => void;
}

export const FundWalletCard = ({ targetAmount, onSuccess }: FundWalletCardProps) => {
  const { address } = useAccount();

  const fundingUrl = getOnrampBuyUrl({
    projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID!,
    addresses: address ? { [address]: ['base'] } : {},
    assets: ['USDC'],
    presetFiatAmount: targetAmount ? parseFloat(targetAmount) : 50,
    fiatCurrency: 'USD',
  });

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
      <h3 className="text-xl font-bold mb-2">Add Funds to Your Wallet</h3>
      <p className="mb-4 opacity-90">
        {targetAmount
          ? `You need ${targetAmount} USDC to complete this payment`
          : 'Buy USDC with your debit card or bank account'
        }
      </p>

      <FundButton
        fundingUrl={fundingUrl}
        onSuccess={() => {
          console.log('✅ Funding successful');
          onSuccess?.();
        }}
        text="Buy USDC"
        className="w-full bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
      />

      <div className="mt-4 text-sm opacity-75">
        <p>💳 Debit card, bank transfer, or Apple/Google Pay</p>
        <p>⚡ USDC available in seconds</p>
        <p>🔒 Powered by Coinbase Pay</p>
      </div>
    </div>
  );
};
