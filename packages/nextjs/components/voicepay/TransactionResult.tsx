'use client';

import { PaymentExecutionResult } from '~/services/payment/PaymentExecutor';

interface TransactionResultProps {
  result: PaymentExecutionResult;
}

export const TransactionResult = ({ result }: TransactionResultProps) => {
  if (!result) return null;

  const isSuccess = result.success;

  return (
    <div className={`
      rounded-lg p-6 mb-6
      ${isSuccess 
        ? 'bg-green-50 border-2 border-green-200' 
        : 'bg-red-50 border-2 border-red-200'
      }
    `}>
      <div className="flex items-start gap-4">
        {isSuccess ? (
          <div className="w-12 h-12 text-green-600 flex-shrink-0 text-4xl">✓</div>
        ) : (
          <div className="w-12 h-12 text-red-600 flex-shrink-0 text-4xl">✗</div>
        )}

        <div className="flex-1">
          <h3 className={`text-lg font-bold mb-2 ${isSuccess ? 'text-green-900' : 'text-red-900'}`}>
            {isSuccess ? 'Payment Successful! 🎉' : 'Payment Failed'}
          </h3>

          {isSuccess && result.transactionHash && (
            <>
              <p className="text-gray-700 mb-4">
                Your payment of <strong>{result.amountSent}</strong> has been sent!
              </p>

              <div className="bg-white rounded p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction Hash:</span>
                  <a 
                    href={`https://basescan.org/tx/${result.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-mono"
                  >
                    {result.transactionHash.slice(0, 10)}...{result.transactionHash.slice(-8)}
                  </a>
                </div>

                {result.orderId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-mono">#{result.orderId}</span>
                  </div>
                )}

                {result.voiceReceiptCid && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Voice Receipt:</span>
                    <span className="font-mono text-xs">{result.voiceReceiptCid.slice(0, 15)}...</span>
                  </div>
                )}
              </div>

              <a
                href={`https://basescan.org/tx/${result.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View on Basescan →
              </a>
            </>
          )}

          {!isSuccess && result.error && (
            <div className="bg-white rounded p-4 mt-3">
              <p className="text-red-800 font-semibold mb-2">Error:</p>
              <p className="text-gray-700 text-sm">{result.error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
