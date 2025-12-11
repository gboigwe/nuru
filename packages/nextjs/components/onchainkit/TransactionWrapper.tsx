"use client";

import {
  Transaction,
  TransactionButton,
  TransactionSponsor,
  TransactionStatus,
  TransactionStatusAction,
  TransactionStatusLabel,
} from "@coinbase/onchainkit/transaction";
import type { LifecycleStatus } from "@coinbase/onchainkit/transaction";
import "@coinbase/onchainkit/styles.css";
import { base } from "wagmi/chains";
import type { ContractFunctionParameters } from "viem";

/**
 * TransactionWrapper Component
 *
 * Wraps OnchainKit's Transaction component for USDC payments
 * Handles both approve and payment in a single transaction flow
 */

interface TransactionWrapperProps {
  calls: ContractFunctionParameters[];
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
  buttonText?: string;
  disabled?: boolean;
}

export function TransactionWrapper({
  calls,
  onSuccess,
  onError,
  buttonText = "Confirm Payment",
  disabled = false,
}: TransactionWrapperProps) {
  const handleOnStatus = (status: LifecycleStatus) => {
    console.log("Transaction status:", status);

    if (status.statusName === "success" && status.statusData?.transactionReceipts?.[0]?.transactionHash) {
      onSuccess?.(status.statusData.transactionReceipts[0].transactionHash);
    }

    if (status.statusName === "error" && status.statusData?.error) {
      onError?.(status.statusData.error as Error);
    }
  };

  return (
    <Transaction
      chainId={base.id}
      calls={calls}
      onStatus={handleOnStatus}
    >
      <TransactionButton
        text={buttonText}
        disabled={disabled}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      />
      <TransactionSponsor />
      <TransactionStatus>
        <TransactionStatusLabel />
        <TransactionStatusAction />
      </TransactionStatus>
    </Transaction>
  );
}

/**
 * USDCPaymentTransaction Component
 *
 * Pre-configured transaction for USDC payments
 * Handles approve + payment in one transaction
 */

interface USDCPaymentTransactionProps {
  usdcAddress: `0x${string}`;
  contractAddress: `0x${string}`;
  recipient: `0x${string}`;
  amount: bigint;
  voiceHash: string;
  metadata: string;
  usdcAbi: any;
  contractAbi: any;
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

export function USDCPaymentTransaction({
  usdcAddress,
  contractAddress,
  recipient,
  amount,
  voiceHash,
  metadata,
  usdcAbi,
  contractAbi,
  onSuccess,
  onError,
}: USDCPaymentTransactionProps) {
  const calls: ContractFunctionParameters[] = [
    {
      to: usdcAddress,
      abi: usdcAbi,
      functionName: "approve",
      args: [contractAddress, amount],
    },
    {
      to: contractAddress,
      abi: contractAbi,
      functionName: "initiateUSDCPayment",
      args: [recipient, amount, voiceHash, metadata],
    },
  ];

  return (
    <TransactionWrapper
      calls={calls}
      onSuccess={onSuccess}
      onError={onError}
      buttonText="Send Payment"
    />
  );
}
