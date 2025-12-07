/**
 * useChainValidation Hook
 *
 * Detects when wallet chain doesn't match target chain and provides auto-switch capability.
 * Prevents transactions on wrong chains that could result in fund loss.
 */

import { useEffect, useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { useTargetNetwork } from "./useTargetNetwork";

export function useChainValidation() {
  const { chain } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [showMismatchWarning, setShowMismatchWarning] = useState(false);

  // Check if current chain matches target
  const isChainMismatch = chain && targetNetwork && chain.id !== targetNetwork.id;

  /**
   * Auto-detect chain mismatch
   */
  useEffect(() => {
    if (isChainMismatch) {
      setShowMismatchWarning(true);
    } else {
      setShowMismatchWarning(false);
    }
  }, [isChainMismatch]);

  /**
   * Switch to target network
   */
  const switchToTargetChain = async () => {
    if (!targetNetwork) return;

    try {
      await switchChain({ chainId: targetNetwork.id });
      setShowMismatchWarning(false);
    } catch (error) {
      console.error("Failed to switch chain:", error);
    }
  };

  /**
   * Dismiss warning (user acknowledges mismatch)
   */
  const dismissWarning = () => {
    setShowMismatchWarning(false);
  };

  return {
    isChainMismatch: !!isChainMismatch,
    showMismatchWarning,
    currentChain: chain,
    targetChain: targetNetwork,
    switchToTargetChain,
    dismissWarning,
    isSwitching,
  };
}
