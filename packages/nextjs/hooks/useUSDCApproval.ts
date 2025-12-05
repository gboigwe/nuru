import { useState } from "react";
import { type Address } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { USDCPaymentHandler } from "~~/services/payment/USDCPaymentHandler";

export type ApprovalStatus = "idle" | "approving" | "approved" | "failed";

export interface USDCApprovalData {
  approvalStatus: ApprovalStatus;
  approvalTxHash: Address | null;
  approvalError: Error | null;
  isApproving: boolean;
  approve: (spender: Address, amount: string) => Promise<Address | null>;
  resetApproval: () => void;
}

export function useUSDCApproval(): USDCApprovalData {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>("idle");
  const [approvalTxHash, setApprovalTxHash] = useState<Address | null>(null);
  const [approvalError, setApprovalError] = useState<Error | null>(null);

  const approve = async (spender: Address, amount: string): Promise<Address | null> => {
    if (!address || !publicClient || !walletClient) {
      const error = new Error("Wallet not connected");
      setApprovalError(error);
      setApprovalStatus("failed");
      return null;
    }

    try {
      setApprovalStatus("approving");
      setApprovalError(null);
      setApprovalTxHash(null);

      console.log("Starting USDC approval:", {
        owner: address,
        spender,
        amount,
      });

      const handler = new USDCPaymentHandler(publicClient, walletClient);

      const txHash = await handler.approveUSDC({
        owner: address,
        spender,
        amount,
      });

      setApprovalTxHash(txHash);
      setApprovalStatus("approved");

      console.log("USDC approval successful:", txHash);

      return txHash;
    } catch (err) {
      console.error("USDC approval failed:", err);
      const error = err instanceof Error ? err : new Error("Failed to approve USDC");
      setApprovalError(error);
      setApprovalStatus("failed");
      return null;
    }
  };

  const resetApproval = () => {
    setApprovalStatus("idle");
    setApprovalTxHash(null);
    setApprovalError(null);
  };

  return {
    approvalStatus,
    approvalTxHash,
    approvalError,
    isApproving: approvalStatus === "approving",
    approve,
    resetApproval,
  };
}
