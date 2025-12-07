/**
 * Type definitions for VoicePay components
 */

export interface VoiceRecordingResult {
  audioBlob: Blob;
  transcript: string;
  duration: number;
  timestamp: number;
}

export interface PaymentConfirmation {
  amount: string;
  currency: string;
  recipient: string;
  recipientAddress?: string;
  confidence: number;
  audioBlob: Blob;
}

export interface TransactionDetails {
  hash: string;
  orderId: number;
  amount: string;
  recipient: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  voiceReceiptCid?: string;
}

export interface NetworkInfo {
  chainId: number;
  name: string;
  isSupported: boolean;
  explorerUrl: string;
}

export interface BalanceInfo {
  usdc: string;
  eth: string;
  isLoading: boolean;
}

export interface PaymentError {
  code: string;
  message: string;
  details?: string;
  recoverable: boolean;
}

export interface VoiceProcessingStatus {
  isRecording: boolean;
  isProcessing: boolean;
  isExecuting: boolean;
  currentStep: 'idle' | 'recording' | 'processing' | 'confirming' | 'executing' | 'completed' | 'error';
}
