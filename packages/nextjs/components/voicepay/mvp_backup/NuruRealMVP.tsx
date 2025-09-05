"use client";

import React, { useCallback, useEffect, useState } from "react";
import { TransactionResult, useNuruContractRead, useNuruTransaction } from "../../hooks/useNuruTransaction";
import { synapseFilecoinStorage } from "../../services/storage/SynapseFilecoinStorage";
import { ParsedPaymentCommand, PaymentIntent, voiceCommandParser } from "../../services/voice/VoiceCommandParser";
import { VoiceRecognitionResult, voiceRecognitionPipeline } from "../../services/voice/VoiceRecognitionPipeline";
import { ENSResolver } from "./ENSResolver";
import { useAccount } from "wagmi";

/**
 * Real Nuru MVP with actual blockchain integration
 * This version executes real transactions on Base Sepolia
 */

type MVPStep = "idle" | "recording" | "processing" | "parsing" | "confirming" | "executing" | "success" | "error";

export const NuruRealMVP: React.FC = () => {
  const { address, isConnected } = useAccount();

  // Blockchain hooks
  const { executePayment, isLoading: isTransacting, error: transactionError } = useNuruTransaction();
  const contractRead = useNuruContractRead();

  // Core state
  const [currentStep, setCurrentStep] = useState<MVPStep>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [voiceResult, setVoiceResult] = useState<VoiceRecognitionResult | null>(null);
  const [parsedCommand, setParsedCommand] = useState<ParsedPaymentCommand | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null);
  const [error, setError] = useState<string>("");

  // Voice processing state
  const [isVoiceReady, setIsVoiceReady] = useState(false);

  // Update error state with transaction errors
  useEffect(() => {
    if (transactionError) {
      setError(transactionError);
      setCurrentStep("error");
    }
  }, [transactionError]);

  // Initialize voice recognition
  useEffect(() => {
    const initializeVoice = async () => {
      if (!isConnected) return;

      try {
        await voiceRecognitionPipeline.initialize();
        await synapseFilecoinStorage.initialize();
        setIsVoiceReady(true);
        console.log("Real MVP initialized successfully");
      } catch (error) {
        console.error("Failed to initialize MVP:", error);
        setError("Failed to initialize voice recognition");
      }
    };

    initializeVoice();
  }, [isConnected]);

  // Get user orders from contract
  const userOrderIds = address ? contractRead.useUserOrders(address) : [];

  // Handle voice recording
  const handleStartRecording = useCallback(async () => {
    try {
      setCurrentStep("recording");
      setIsRecording(true);
      setError("");

      await voiceRecognitionPipeline.startVoiceRecognition({
        maxDuration: 15000, // 15 seconds
        language: "en-US",
        confidenceThreshold: 0.6,
      });
    } catch (error) {
      console.error("Failed to start recording:", error);
      setError("Failed to start voice recording");
      setCurrentStep("error");
      setIsRecording(false);
    }
  }, []);

  const handleStopRecording = useCallback(async () => {
    try {
      setIsRecording(false);
      setCurrentStep("processing");

      // Stop recording and get transcription
      const result = await voiceRecognitionPipeline.stopVoiceRecognition();
      setVoiceResult(result);

      if (!result.success || !result.transcript) {
        setError(result.error || "Voice recognition failed");
        setCurrentStep("error");
        return;
      }

      // Parse the voice command
      setCurrentStep("parsing");
      const parsed = voiceCommandParser.parseVoiceCommand(result.transcript);
      setParsedCommand(parsed);

      if (!parsed.success) {
        setError(parsed.error || "Could not understand payment command");
        setCurrentStep("error");
        return;
      }

      // Create payment intent
      const intent = voiceCommandParser.createPaymentIntent(parsed);
      if (!intent) {
        setError("Failed to create payment intent");
        setCurrentStep("error");
        return;
      }

      setPaymentIntent(intent);
      setCurrentStep("confirming");
    } catch (error) {
      console.error("Voice processing failed:", error);
      setError("Voice processing failed");
      setCurrentStep("error");
      setIsRecording(false);
    }
  }, []);

  // Handle payment confirmation
  const handleConfirmPayment = useCallback(async () => {
    if (!paymentIntent || !address || !voiceResult?.audioData?.audioBlob) {
      setError("Missing payment data");
      setCurrentStep("error");
      return;
    }

    try {
      setCurrentStep("executing");

      // Store voice receipt on Filecoin first
      const voiceReceiptResult = await synapseFilecoinStorage.storeVoiceReceipt(voiceResult.audioData.audioBlob, {
        sender: address,
        recipient: address, // Will be updated with resolved address
        recipientENS: paymentIntent.recipientENS,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        timestamp: Date.now(),
        audioFormat: 'webm', // Default audio format
        audioDuration: voiceResult.audioData.duration || 0,
        audioSize: voiceResult.audioData.audioBlob.size,
        language: 'en-US',
        confidence: parsedCommand?.confidence || 0.8,
        paymentIntent: paymentIntent,
      });

      // Execute real blockchain transaction using the piece CID as receipt hash
      const result = await executePayment(paymentIntent, voiceReceiptResult.pieceCid, address);

      setTransactionResult(result);

      if (result.success) {
        setCurrentStep("success");
      } else {
        setError(result.error || "Transaction failed");
        setCurrentStep("error");
      }
    } catch (error) {
      console.error("Payment execution failed:", error);
      setError("Payment execution failed");
      setCurrentStep("error");
    }
  }, [paymentIntent, address, voiceResult]);

  // Handle cancellation
  const handleCancelPayment = useCallback(() => {
    setCurrentStep("idle");
    setVoiceResult(null);
    setParsedCommand(null);
    setPaymentIntent(null);
    setError("");
  }, []);

  // Reset to idle
  const resetToIdle = useCallback(() => {
    setCurrentStep("idle");
    setVoiceResult(null);
    setParsedCommand(null);
    setPaymentIntent(null);
    setTransactionResult(null);
    setError("");
  }, []);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">✨</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Nuru Real MVP</h2>
          <p className="text-green-600 font-medium mb-4">Light up your payments</p>
          <p className="text-gray-600 mb-6">
            Connect your wallet to test real voice-powered crypto payments on Base Sepolia
          </p>
          <div className="bg-green-50 rounded-lg p-4 text-sm">
            <p className="font-medium text-green-800">🔗 Real blockchain transactions</p>
            <p className="text-green-700">Voice recognition • ENS resolution • Filecoin storage</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">✨</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Nuru Real MVP</h1>
                <p className="text-sm text-green-600 font-medium">Actual blockchain payments</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-700">{isVoiceReady ? "🔴 Live" : "⏳ Loading"}</div>
              <div className="text-xs text-green-600">Base Sepolia</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Status Display */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center">
            {currentStep === "idle" && (
              <>
                <div className="text-4xl mb-3">🎤</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Ready for Real Payment</h2>
                <p className="text-gray-600 text-sm">Voice recognition connected to Base Sepolia blockchain</p>
              </>
            )}

            {currentStep === "recording" && (
              <>
                <div className="text-4xl mb-3 animate-pulse">🎙️</div>
                <h2 className="text-xl font-semibold text-green-600 mb-2">Listening...</h2>
                <p className="text-gray-600 text-sm">Say your payment command clearly</p>
              </>
            )}

            {currentStep === "processing" && (
              <>
                <div className="text-4xl mb-3">🔄</div>
                <h2 className="text-xl font-semibold text-orange-600 mb-2">Processing Voice...</h2>
                <p className="text-gray-600 text-sm">OpenAI Whisper transcribing audio</p>
              </>
            )}

            {currentStep === "parsing" && (
              <>
                <div className="text-4xl mb-3">🧠</div>
                <h2 className="text-xl font-semibold text-blue-600 mb-2">Understanding Command...</h2>
                <p className="text-gray-600 text-sm">Parsing payment details from voice</p>
              </>
            )}

            {currentStep === "confirming" && parsedCommand && (
              <>
                <div className="text-4xl mb-3">✅</div>
                <h2 className="text-xl font-semibold text-purple-600 mb-2">Confirm Real Payment</h2>
                <div className="bg-purple-50 rounded-lg p-4 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">
                      {parsedCommand.amount} {parsedCommand.currency.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>To:</span>
                    <span className="font-medium text-blue-600">{parsedCommand.recipientENS}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence:</span>
                    <span className="font-medium">{Math.round(parsedCommand.confidence * 100)}%</span>
                  </div>
                </div>
              </>
            )}

            {currentStep === "executing" && (
              <>
                <div className="text-4xl mb-3 animate-spin">⚡</div>
                <h2 className="text-xl font-semibold text-indigo-600 mb-2">Executing on Blockchain</h2>
                <p className="text-gray-600 text-sm">Storing voice receipt → Sending transaction</p>
              </>
            )}

            {currentStep === "success" && transactionResult && (
              <>
                <div className="text-4xl mb-3">🎉</div>
                <h2 className="text-xl font-semibold text-green-600 mb-2">Payment Sent!</h2>
                <p className="text-gray-600 text-sm">Real blockchain transaction completed</p>
                {transactionResult.txHash && (
                  <div className="mt-3 p-2 bg-green-50 rounded text-xs">
                    <span className="font-medium">TX: </span>
                    <span className="font-mono">
                      {transactionResult.txHash.slice(0, 10)}...{transactionResult.txHash.slice(-4)}
                    </span>
                  </div>
                )}
              </>
            )}

            {currentStep === "error" && (
              <>
                <div className="text-4xl mb-3">❌</div>
                <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
                <p className="text-gray-600 text-sm">{error}</p>
                {parsedCommand && (
                  <div className="mt-3 text-xs text-gray-500">
                    Suggestions: {voiceCommandParser.getSuggestions(parsedCommand.originalTranscript).join(", ")}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Voice Recording Controls */}
        {isVoiceReady && (currentStep === "idle" || currentStep === "error") && (
          <div className="text-center">
            <button
              onClick={handleStartRecording}
              disabled={!isVoiceReady}
              className="w-32 h-32 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center text-4xl transition-all transform hover:scale-105 shadow-lg"
            >
              🎤
            </button>
            <p className="mt-4 text-sm text-gray-500">Tap to start voice payment</p>
          </div>
        )}

        {/* Recording State */}
        {currentStep === "recording" && (
          <div className="text-center">
            <button
              onClick={handleStopRecording}
              className="w-32 h-32 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-4xl transition-all animate-pulse"
            >
              ⏹️
            </button>
            <p className="mt-4 text-sm text-red-500 font-medium">Recording... Tap to stop</p>
          </div>
        )}

        {/* Payment Confirmation */}
        {currentStep === "confirming" && parsedCommand && paymentIntent && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Real Payment</h3>

            {/* ENS Resolution Status */}
            <ENSResolver ensName={paymentIntent.recipientENS} className="mb-4" />

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span>Command:</span>
                <span className="font-medium text-sm">"{parsedCommand.originalTranscript}"</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">
                  {paymentIntent.amount} {paymentIntent.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Recipient:</span>
                <span className="font-medium text-blue-600">{paymentIntent.recipientENS}</span>
              </div>
              <div className="flex justify-between">
                <span>Network:</span>
                <span className="font-medium text-green-600">Base Sepolia</span>
              </div>
              <div className="flex justify-between">
                <span>Confidence:</span>
                <span className="font-medium">{Math.round(parsedCommand.confidence * 100)}%</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleConfirmPayment}
                disabled={isTransacting}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
              >
                {isTransacting ? "Sending..." : "Send Real Payment"}
              </button>
              <button
                onClick={handleCancelPayment}
                disabled={isTransacting}
                className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 text-gray-700 py-3 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Success Actions */}
        {currentStep === "success" && transactionResult && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-lg font-semibold text-green-600">Payment Successful!</h3>
            </div>

            {transactionResult.txHash && (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Transaction:</span>
                  <a
                    href={`https://sepolia.basescan.org/tx/${transactionResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-blue-600 hover:underline"
                  >
                    {transactionResult.txHash.slice(0, 10)}...{transactionResult.txHash.slice(-4)}
                  </a>
                </div>
              </div>
            )}

            <button
              onClick={resetToIdle}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Send Another Payment
            </button>
          </div>
        )}

        {/* Recent Real Orders */}
        {userOrderIds && userOrderIds.length > 0 && currentStep === "idle" && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Real Transaction History</h3>
            <div className="space-y-3">
              {userOrderIds.slice(0, 3).map(orderId => {
                const orderDetails = contractRead.useOrderDetails(Number(orderId));
                if (!orderDetails) return null;

                return (
                  <div key={orderDetails.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {orderDetails.amount} {orderDetails.currency}
                      </p>
                      <p className="text-xs text-gray-500">To: {orderDetails.recipientENS}</p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          orderDetails.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : orderDetails.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {orderDetails.status}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(orderDetails.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
