"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useVoicePay } from "../../hooks/useVoicePay";
import { synapseFilecoinStorage } from "../../services/storage/SynapseFilecoinStorage";
import { VoiceRecognitionResult, voiceRecognitionPipeline } from "../../services/voice/VoiceRecognitionPipeline";
import { DemoModeIndicator } from "./DemoModeIndicator";
import { NetworkStatus } from "./NetworkStatus";
import { PaymentConfirmation } from "./PaymentConfirmation";
import { TransactionStatus } from "./TransactionStatus";
import { UserBalance } from "./UserBalance";
import { VoiceRecordingButton } from "./VoiceRecordingButton";
import { useAccount } from "wagmi";

/**
 * Main VoicePay Interface Component
 * Mobile-first design for voice-powered crypto remittances
 */

export const VoicePayInterface: React.FC = () => {
  const { address, isConnected } = useAccount();
  const voicePay = useVoicePay();

  // Local state
  const [voiceResult, setVoiceResult] = useState<VoiceRecognitionResult | null>(null);
  const [isVoiceReady, setIsVoiceReady] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "idle" | "recording" | "processing" | "confirming" | "executing" | "success" | "error"
  >("idle");

  // Initialize voice recognition on mount
  useEffect(() => {
    let isInitializing = false;

    const initializeVoice = async () => {
      if (isInitializing) return;
      isInitializing = true;

      try {
        console.log("Initializing voice recognition...");
        await voiceRecognitionPipeline.initialize();
        console.log("Voice recognition initialized successfully");

        console.log("Initializing Synapse Filecoin storage...");
        await synapseFilecoinStorage.initialize();
        console.log("Synapse storage initialized successfully");

        setIsVoiceReady(true);
      } catch (error) {
        console.error("Failed to initialize voice recognition:", error);

        // Don't set error state for microphone permission - let user trigger it manually
        if (error instanceof Error && error.message.includes("Microphone access denied")) {
          console.warn("Microphone permission required - will request when user starts recording");
          setIsVoiceReady(true); // Allow interface to load
        } else {
          setCurrentStep("error");
        }
      } finally {
        isInitializing = false;
      }
    };

    if (isConnected) {
      initializeVoice();
    } else {
      // Initialize storage even without wallet connection for service provider payment
      if (!isInitializing) {
        synapseFilecoinStorage
          .initialize()
          .then(() => {
            console.log("Synapse storage initialized (service provider mode)");
          })
          .catch(error => {
            console.error("Synapse storage initialization failed:", error);
          });
      }
    }
  }, [isConnected]);

  // Handle voice recording result
  const handleVoiceResult = useCallback(
    async (result: VoiceRecognitionResult) => {
      setVoiceResult(result);

      if (result.success && result.paymentIntent) {
        // Process the voice command
        await voicePay.processVoiceCommand(result.transcript || "");
        setCurrentStep("confirming");
        setShowConfirmation(true);
      } else {
        setCurrentStep("error");
      }
    },
    [voicePay],
  );

  // Handle payment confirmation
  const handleConfirmPayment = useCallback(async () => {
    if (!voiceResult?.audioData?.audioBlob) return;

    setCurrentStep("executing");
    setShowConfirmation(false);

    try {
      // Execute payment directly with audio blob - storage will be handled internally
      await voicePay.executePayment(voiceResult.audioData.audioBlob);

      if (voicePay.executionResult?.success) {
        setCurrentStep("success");
      } else {
        setCurrentStep("error");
      }
    } catch (error) {
      console.error("Payment execution failed:", error);
      setCurrentStep("error");
    }
  }, [voiceResult, voicePay, address]);

  // Handle payment cancellation
  const handleCancelPayment = useCallback(() => {
    setShowConfirmation(false);
    setCurrentStep("idle");
    setVoiceResult(null);
    voicePay.clearResults();
  }, [voicePay]);

  // Reset to idle state
  const resetToIdle = useCallback(() => {
    setCurrentStep("idle");
    setVoiceResult(null);
    setShowConfirmation(false);
    voicePay.clearResults();
  }, [voicePay]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="text-6xl mb-4">🎙️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">VoicePay Africa</h2>
          <p className="text-gray-600 mb-6">Connect your wallet to start making voice-powered crypto payments</p>
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            <p className="font-medium">Speak Money, Send Money</p>
            <p>Crypto remittances made simple with ENS names</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header with Nuru Branding */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">✨</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Nuru</h1>
                <p className="text-sm text-green-600 font-medium">Light up your payments</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-700">Demo Mode</div>
              <div className="text-xs text-green-600">Base Sepolia</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Nuru Demo Introduction */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-2xl">🌍</span>
            <div>
              <h3 className="font-bold text-gray-800">Welcome to Nuru</h3>
              <p className="text-sm text-green-700">Voice-powered crypto remittances for Africa</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-lg mb-1">🎤</div>
              <p className="text-xs text-gray-600">Voice First</p>
            </div>
            <div className="text-center">
              <div className="text-lg mb-1">🌐</div>
              <p className="text-xs text-gray-600">ENS Names</p>
            </div>
            <div className="text-center">
              <div className="text-lg mb-1">⚡</div>
              <p className="text-xs text-gray-600">Base L2</p>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center">
            {currentStep === "idle" && (
              <>
                <div className="text-4xl mb-3">💬</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Ready to Send</h2>
                <p className="text-gray-600 text-sm mb-4">
                  Tap the microphone and say:
                  <br />
                  <span className="font-medium">"Send 50 cedis to mama.family.eth"</span>
                </p>
              </>
            )}

            {currentStep === "recording" && (
              <>
                <div className="text-4xl mb-3 animate-pulse">🎤</div>
                <h2 className="text-xl font-semibold text-blue-600 mb-2">Listening...</h2>
                <p className="text-gray-600 text-sm">Speak your payment command clearly</p>
              </>
            )}

            {currentStep === "processing" && (
              <>
                <div className="text-4xl mb-3">🔄</div>
                <h2 className="text-xl font-semibold text-orange-600 mb-2">Processing...</h2>
                <p className="text-gray-600 text-sm">Understanding your voice command</p>
              </>
            )}

            {currentStep === "executing" && (
              <>
                <div className="text-4xl mb-3 animate-spin">⚡</div>
                <h2 className="text-xl font-semibold text-purple-600 mb-2">Executing Payment</h2>
                <p className="text-gray-600 text-sm">Sending transaction to Base network</p>
              </>
            )}

            {currentStep === "success" && (
              <>
                <div className="text-4xl mb-3">✅</div>
                <h2 className="text-xl font-semibold text-green-600 mb-2">Payment Sent!</h2>
                <p className="text-gray-600 text-sm">Your voice payment was successful</p>
              </>
            )}

            {currentStep === "error" && (
              <>
                <div className="text-4xl mb-3">❌</div>
                <h2 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h2>
                <p className="text-gray-600 text-sm mb-4">
                  {voicePay.error || voiceResult?.error || "Please try again"}
                </p>

                {/* Show OpenAI configuration hint if API key is missing */}
                {!process.env.OPENAI_API_KEY && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                    <p className="text-yellow-800 font-medium mb-1">🔑 OpenAI API Key Required</p>
                    <p className="text-yellow-700">
                      Set your OPENAI_API_KEY in .env.local for accurate voice recognition with Whisper AI.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Voice Recording Button */}
        {isVoiceReady && (currentStep === "idle" || currentStep === "error") && (
          <VoiceRecordingButton
            onResult={handleVoiceResult}
            onStateChange={state => {
              if (state === "recording") setCurrentStep("recording");
              if (state === "processing") setCurrentStep("processing");
            }}
            disabled={!isVoiceReady || voicePay.isProcessing}
          />
        )}

        {/* Payment Confirmation */}
        {showConfirmation && voicePay.result?.data && (
          <PaymentConfirmation
            processedCommand={voicePay.result.data}
            onConfirm={handleConfirmPayment}
            onCancel={handleCancelPayment}
            isExecuting={voicePay.isExecuting}
          />
        )}

        {/* Transaction Status */}
        {voicePay.executionResult && <TransactionStatus result={voicePay.executionResult} onReset={resetToIdle} />}

        {/* Recent Transactions */}
        {voicePay.userOrders.length > 0 && currentStep === "idle" && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Payments</h3>
            <div className="space-y-3">
              {voicePay.userOrders.slice(0, 3).map(order => (
                <div key={order.orderId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {order.amount} {order.currency.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500">To: {order.recipientENS || "Unknown ENS"}</p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {order.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        {currentStep === "idle" && (
          <div className="bg-blue-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Voice Commands</h3>
            <div className="space-y-2 text-sm text-blue-700">
              <p>• "Send 50 cedis to mama.family.eth"</p>
              <p>• "Transfer 100 USDC to friend.eth"</p>
              <p>• "Pay kofi.ghana.eth 25 dollars"</p>
              <p>• "Check my balance"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
