'use client';

import { PaymentStatus } from '~/services/payment/PaymentExecutor';
import { formatUnits } from 'viem';

interface RealPaymentHistoryProps {
  orders: PaymentStatus[];
}

export const RealPaymentHistory = ({ orders }: RealPaymentHistoryProps) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        <p>No payment history yet</p>
        <p className="text-sm mt-2">Your completed payments will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Payment History</h3>
        <p className="text-sm text-gray-500">
          Showing {orders.length} transaction{orders.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="divide-y">
        {orders.map((order) => (
          <div key={order.orderId} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold text-lg">
                  {order.amount} {order.currency}
                </div>
                <div className="text-sm text-gray-600">
                  To: {order.recipient.slice(0, 6)}...{order.recipient.slice(-4)}
                </div>
              </div>
              
              <StatusBadge status={order.status} />
            </div>

            {order.transactionHash && (
              <a
                href={`https://basescan.org/tx/${order.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1"
              >
                View on Basescan →
              </a>
            )}

            {order.voiceReceiptHash && (
              <div className="mt-2 text-xs text-gray-500">
                Voice proof: {order.voiceReceiptHash.slice(0, 10)}...
              </div>
            )}

            <div className="text-xs text-gray-400 mt-2">
              {new Date(order.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'processing': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800',
    'failed': 'bg-red-100 text-red-800',
    'cancelled': 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.pending}`}>
      {status}
    </span>
  );
};
