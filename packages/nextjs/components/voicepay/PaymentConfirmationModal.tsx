'use client';

import { ProcessedVoiceCommand } from '~/services/VoicePayService';

interface PaymentConfirmationModalProps {
  paymentData: ProcessedVoiceCommand;
  onConfirm: (audioBlob: Blob) => Promise<void>;
  onCancel: () => void;
  isExecuting: boolean;
  audioBlob: Blob;
}

export const PaymentConfirmationModal = ({ 
  paymentData, 
  onConfirm, 
  onCancel, 
  isExecuting,
  audioBlob 
}: PaymentConfirmationModalProps) => {
  const { intent, ensResolution } = paymentData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4">Confirm Payment</h3>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold">{intent.amount} {intent.currency.toUpperCase()}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">To:</span>
            <span className="font-semibold">{intent.recipient}</span>
          </div>
          
          {ensResolution?.address && (
            <div className="flex justify-between">
              <span className="text-gray-600">Address:</span>
              <span className="font-mono text-sm">
                {ensResolution.address.slice(0, 6)}...{ensResolution.address.slice(-4)}
              </span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-600">Confidence:</span>
            <span className={`font-semibold ${intent.confidence > 0.8 ? 'text-green-600' : 'text-yellow-600'}`}>
              {(intent.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-6">
          <p className="text-sm text-yellow-800">
            ⚠️ This transaction cannot be reversed. Please verify all details before confirming.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isExecuting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(audioBlob)}
            disabled={isExecuting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isExecuting ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};
