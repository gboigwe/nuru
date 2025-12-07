"use client";

import { formatEther } from "viem";
import { useTransactionHistory, type Payment } from "~~/hooks/graph";

/**
 * TransactionHistory Component
 *
 * Displays transaction history from The Graph subgraph
 * Shows sent and received payments with status and amounts
 */

interface TransactionHistoryProps {
  address?: string;
  direction?: "sent" | "received" | "all";
  maxItems?: number;
  className?: string;
}

export function TransactionHistory({
  address,
  direction = "all",
  maxItems = 20,
  className = "",
}: TransactionHistoryProps) {
  const { payments, loading, error, refetch, hasMore, loadMore } = useTransactionHistory({
    address,
    direction,
    first: maxItems,
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
  });

  if (!address) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">Connect your wallet to view transaction history</p>
      </div>
    );
  }

  if (loading && payments.length === 0) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading transactions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-600 mb-2">⚠️ Error loading transactions</p>
        <p className="text-sm text-gray-600 mb-4">{error.message}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">No transactions found</p>
        <p className="text-sm text-gray-400 mt-2">Your payment history will appear here</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Transaction History
          {direction !== "all" && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({direction === "sent" ? "Sent" : "Received"})
            </span>
          )}
        </h3>
        <button
          onClick={refetch}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {payments.map(payment => (
          <TransactionCard
            key={payment.id}
            payment={payment}
            userAddress={address}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center mt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * TransactionCard Component
 * Individual transaction card
 */

interface TransactionCardProps {
  payment: Payment;
  userAddress: string;
}

function TransactionCard({ payment, userAddress }: TransactionCardProps) {
  const isSent = payment.sender.toLowerCase() === userAddress.toLowerCase();
  const amount = parseFloat(formatEther(BigInt(payment.amount)));
  const date = new Date(parseInt(payment.initiatedAt) * 1000);

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    DISPUTED: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* Left: Type & Address */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-medium ${isSent ? "text-red-600" : "text-green-600"}`}>
              {isSent ? "↑ Sent" : "↓ Received"}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[payment.status]}`}>
              {payment.status}
            </span>
          </div>

          <p className="text-sm text-gray-600">
            {isSent ? "To: " : "From: "}
            <span className="font-mono">
              {payment.basename || payment.ensName || `${(isSent ? payment.recipient : payment.sender).slice(0, 6)}...${(isSent ? payment.recipient : payment.sender).slice(-4)}`}
            </span>
          </p>

          <p className="text-xs text-gray-400 mt-1">
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </p>
        </div>

        {/* Right: Amount */}
        <div className="text-right">
          <p className={`text-lg font-bold ${isSent ? "text-red-600" : "text-green-600"}`}>
            {isSent ? "-" : "+"}{amount.toFixed(4)} {payment.currency}
          </p>
          <a
            href={`https://basescan.org/tx/${payment.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            View on BaseScan →
          </a>
        </div>
      </div>
    </div>
  );
}
