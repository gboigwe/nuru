'use client';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({ message = 'Loading...' }: LoadingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );
};

export const PaymentProcessingState = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <div>
          <h3 className="font-semibold text-blue-900">Processing Payment</h3>
          <p className="text-sm text-blue-700">Please wait while we process your transaction...</p>
        </div>
      </div>
    </div>
  );
};

export const VoiceProcessingState = () => {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
      <div className="flex items-center gap-4">
        <div className="animate-pulse text-3xl">🎤</div>
        <div>
          <h3 className="font-semibold text-purple-900">Processing Voice Command</h3>
          <p className="text-sm text-purple-700">Analyzing your voice command...</p>
        </div>
      </div>
    </div>
  );
};
