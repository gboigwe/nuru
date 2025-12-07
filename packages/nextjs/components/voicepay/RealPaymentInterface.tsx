'use client';

import { useState, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useVoicePay } from '~/hooks/useVoicePay';
import { VoiceRecorder } from './VoiceRecorder';
import { RealBalanceDisplay } from './RealBalanceDisplay';
import { PaymentConfirmationModal } from './PaymentConfirmationModal';
import { TransactionResult } from './TransactionResult';
import { RealPaymentHistory } from './RealPaymentHistory';
import { PaymentErrorBoundary } from './PaymentErrorBoundary';

export const RealPaymentInterface = () => {
  const { address, isConnected } = useAccount();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const {
    isProcessing,
    isExecuting,
    result,
    executionResult,
    userOrders,
    processVoiceCommand,
    executePayment,
    error,
    clearResults,
  } = useVoicePay();

  const handleRecordingComplete = async (blob: Blob, transcript: string) => {
    setAudioBlob(blob);
    await processVoiceCommand(transcript);
  };

  const handleConfirmPayment = async (blob: Blob) => {
    await executePayment(blob);
    setAudioBlob(null);
  };

  const handleCancelPayment = () => {
    clearResults();
    setAudioBlob(null);
  };

  if (!isConnected || !address) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
        <p className="text-gray-600">Please connect your wallet to start making voice payments</p>
      </div>
    );
  }

  return (
    <PaymentErrorBoundary>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <RealBalanceDisplay address={address} />

        <VoiceRecorder
          onRecordingComplete={handleRecordingComplete}
          isProcessing={isProcessing}
        />

        {result && result.success && result.data && audioBlob && (
          <PaymentConfirmationModal
            paymentData={result.data}
            onConfirm={handleConfirmPayment}
            onCancel={handleCancelPayment}
            isExecuting={isExecuting}
            audioBlob={audioBlob}
          />
        )}

        {executionResult && (
          <TransactionResult result={executionResult} />
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <RealPaymentHistory orders={userOrders} />
      </div>
    </PaymentErrorBoundary>
  );
};
