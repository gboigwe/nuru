"use client";

/**
 * Cross-Chain Payment Flow Component
 *
 * Handles cross-chain USDC payments with automatic chain detection,
 * bridge quote fetching, and transaction execution
 */

import { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { chainDetectionService, socketBridgeService } from "~~/services/chain";
import { getChainName, getChainInfo } from "~~/config/chains";
import type { SupportedChainId, BridgeQuote, ChainBalance } from "~~/types/chain-abstraction";

interface CrossChainPaymentFlowProps {
  recipientAddress: string;
  amount: string;
  onSuccess?: (txHash: string) => void;
  onCancel?: () => void;
}

export const CrossChainPaymentFlow = ({
  recipientAddress,
  amount,
  onSuccess,
  onCancel,
}: CrossChainPaymentFlowProps) => {
  const { address } = useAccount();
  const currentChainId = useChainId();

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"detect" | "select" | "quote" | "execute">("detect");

  const [userBalances, setUserBalances] = useState<ChainBalance[]>([]);
  const [recipientChain, setRecipientChain] = useState<SupportedChainId | null>(null);
  const [selectedSourceChain, setSelectedSourceChain] = useState<SupportedChainId | null>(null);
  const [bridgeQuote, setBridgeQuote] = useState<BridgeQuote | null>(null);
  const [needsBridge, setNeedsBridge] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address && recipientAddress) {
      detectChains();
    }
  }, [address, recipientAddress]);

  /**
   * Detect chains for both user and recipient
   */
  const detectChains = async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      // Detect user's chains and balances
      const userDetection = await chainDetectionService.detectChains(address);
      setUserBalances(userDetection.balances);

      // Detect recipient's preferred chain
      const recipientDetection = await chainDetectionService.detectChains(recipientAddress as any);
      const preferredChain = recipientDetection.recommendedChain;
      setRecipientChain(preferredChain);

      // Check if user has sufficient balance on recipient's chain
      const balanceOnRecipientChain = userDetection.balances.find(b => b.chainId === preferredChain);
      const hasSufficientBalance = balanceOnRecipientChain && parseFloat(balanceOnRecipientChain.usdcBalance) >= parseFloat(amount);

      if (hasSufficientBalance) {
        // Direct payment possible
        setNeedsBridge(false);
        setSelectedSourceChain(preferredChain);
        setStep("execute");
      } else {
        // Need to bridge from another chain
        setNeedsBridge(true);

        // Find chain with sufficient balance
        const sourceChain = userDetection.balances.find(b => parseFloat(b.usdcBalance) >= parseFloat(amount));

        if (sourceChain) {
          setSelectedSourceChain(sourceChain.chainId);
          setStep("select");
        } else {
          setError("Insufficient USDC balance across all chains");
          setStep("select");
        }
      }
    } catch (err) {
      console.error("Chain detection error:", err);
      setError("Failed to detect chains. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch bridge quote
   */
  const fetchBridgeQuote = async () => {
    if (!selectedSourceChain || !recipientChain || !address) return;

    setLoading(true);
    setError(null);

    try {
      const quote = await socketBridgeService.getQuote(
        selectedSourceChain,
        recipientChain,
        amount,
        address
      );

      if (quote) {
        setBridgeQuote(quote);
        setStep("quote");
      } else {
        setError("No bridge route available. Try a different chain.");
      }
    } catch (err) {
      console.error("Bridge quote error:", err);
      setError("Failed to fetch bridge quote. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Execute payment (with or without bridge)
   */
  const executePayment = async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      if (needsBridge && bridgeQuote) {
        // Execute bridge transaction
        const bridgeTx = await socketBridgeService.executeBridge(bridgeQuote, address);

        // TODO: Wait for bridge completion and then execute payment
        // For now, just simulate success
        setTimeout(() => {
          onSuccess?.("0x..." + Math.random().toString(36).substring(7));
        }, 2000);
      } else {
        // Direct payment on same chain
        // TODO: Execute direct USDC transfer
        setTimeout(() => {
          onSuccess?.("0x..." + Math.random().toString(36).substring(7));
        }, 1000);
      }
    } catch (err) {
      console.error("Payment execution error:", err);
      setError("Payment failed. Please try again.");
      setLoading(false);
    }
  };

  if (loading && step === "detect") {
    return (
      <div className="card bg-base-100 shadow-xl p-6">
        <div className="flex flex-col items-center justify-center gap-4">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="text-sm text-base-content/60">Detecting optimal payment route...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Cross-Chain Payment</h2>

        {/* Payment Summary */}
        <div className="bg-base-200 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-base-content/60">Amount</span>
            <span className="font-bold">${amount} USDC</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-base-content/60">Recipient</span>
            <span className="font-mono text-xs">{recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}</span>
          </div>
          {recipientChain && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-base-content/60">Recipient Chain</span>
              <span className="badge badge-primary">{getChainName(recipientChain)}</span>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Chain Selection */}
        {step === "select" && (
          <div className="space-y-4">
            <h3 className="font-semibold">Select Source Chain</h3>
            <p className="text-sm text-base-content/60">
              {needsBridge
                ? "Your funds will be bridged to the recipient's chain automatically."
                : "Choose which chain to send from."}
            </p>

            <div className="space-y-2">
              {userBalances
                .filter(b => parseFloat(b.usdcBalance) > 0)
                .map(balance => (
                  <button
                    key={balance.chainId}
                    className={`w-full btn btn-outline ${selectedSourceChain === balance.chainId ? "btn-primary" : ""}`}
                    onClick={() => setSelectedSourceChain(balance.chainId)}
                    disabled={parseFloat(balance.usdcBalance) < parseFloat(amount)}
                  >
                    <div className="flex justify-between w-full items-center">
                      <div className="flex items-center gap-2">
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-8">
                            <span className="text-xs">{balance.chainName.slice(0, 2)}</span>
                          </div>
                        </div>
                        <span>{balance.chainName}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${balance.usdcBalance} USDC</div>
                        {parseFloat(balance.usdcBalance) < parseFloat(amount) && (
                          <div className="text-xs text-error">Insufficient</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
            </div>

            <div className="card-actions justify-end">
              <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={needsBridge ? fetchBridgeQuote : () => setStep("execute")}
                disabled={!selectedSourceChain}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Bridge Quote */}
        {step === "quote" && bridgeQuote && (
          <div className="space-y-4">
            <h3 className="font-semibold">Bridge Route</h3>

            <div className="bg-base-200 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/60">From Chain</span>
                <span className="badge badge-outline">{getChainName(bridgeQuote.fromChain)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/60">To Chain</span>
                <span className="badge badge-outline">{getChainName(bridgeQuote.toChain)}</span>
              </div>
              <div className="divider my-1"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/60">You Send</span>
                <span className="font-bold">${bridgeQuote.amount} USDC</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/60">You Receive</span>
                <span className="font-bold">${bridgeQuote.estimatedOutput} USDC</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/60">Bridge Fee</span>
                <span className="text-sm">${bridgeQuote.fees.totalFeeUSD}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-base-content/60">Estimated Time</span>
                <span className="text-sm">{Math.ceil(bridgeQuote.estimatedTime / 60)} min</span>
              </div>
            </div>

            {bridgeQuote.route.length > 0 && (
              <div className="text-xs text-base-content/60">
                Via: {bridgeQuote.route.map(r => r.protocol).join(", ")}
              </div>
            )}

            <div className="card-actions justify-end">
              <button className="btn btn-ghost" onClick={() => setStep("select")}>Back</button>
              <button className="btn btn-primary" onClick={() => setStep("execute")}>
                Approve Bridge
              </button>
            </div>
          </div>
        )}

        {/* Execute Payment */}
        {step === "execute" && (
          <div className="space-y-4">
            <h3 className="font-semibold">
              {needsBridge ? "Ready to Bridge & Pay" : "Ready to Pay"}
            </h3>

            <div className="bg-base-200 p-4 rounded-lg">
              {needsBridge ? (
                <>
                  <p className="text-sm mb-3">
                    Your USDC will be bridged from {selectedSourceChain && getChainName(selectedSourceChain)} to {recipientChain && getChainName(recipientChain)}, then sent to the recipient.
                  </p>
                  <div className="text-xs text-base-content/60">
                    Total time: ~{bridgeQuote ? Math.ceil(bridgeQuote.estimatedTime / 60) + 1 : 6} minutes
                  </div>
                </>
              ) : (
                <p className="text-sm">
                  Payment will be sent directly on {recipientChain && getChainName(recipientChain)}.
                </p>
              )}
            </div>

            <div className="card-actions justify-end">
              <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={executePayment}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Processing...
                  </>
                ) : (
                  "Confirm Payment"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
