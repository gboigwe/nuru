"use client";

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownBasename,
  WalletDropdownDisconnect,
  WalletDropdownFundLink,
  WalletDropdownLink,
} from "@coinbase/onchainkit/wallet";
import "@coinbase/onchainkit/styles.css";
import { Address, Avatar, Name, Identity } from "@coinbase/onchainkit/identity";
import { base } from "wagmi/chains";

/**
 * WalletWrapper Component
 *
 * OnchainKit-powered wallet connection and display
 * Shows connected wallet with dropdown for account details
 */

interface WalletWrapperProps {
  className?: string;
}

export function WalletWrapper({ className = "" }: WalletWrapperProps) {
  return (
    <div className={className}>
      <Wallet>
        <ConnectWallet>
          <Avatar className="w-6 h-6" />
          <Name />
        </ConnectWallet>
        <WalletDropdown>
          <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
            <Avatar />
            <Name />
            <Address />
          </Identity>
          <WalletDropdownBasename />
          <WalletDropdownLink
            icon="wallet"
            href="https://wallet.coinbase.com"
          >
            Wallet
          </WalletDropdownLink>
          <WalletDropdownFundLink />
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    </div>
  );
}

/**
 * CompactWalletButton Component
 *
 * Simplified wallet connection button
 * Shows only avatar and connect/disconnect
 */

export function CompactWalletButton() {
  return (
    <Wallet>
      <ConnectWallet className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
        <Avatar className="w-5 h-5" />
        <Name className="font-medium" />
      </ConnectWallet>
      <WalletDropdown>
        <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
          <Avatar />
          <Name />
          <Address />
        </Identity>
        <WalletDropdownDisconnect />
      </WalletDropdown>
    </Wallet>
  );
}
