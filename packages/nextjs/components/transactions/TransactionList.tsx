'use client';

import { TransactionMonitor } from './TransactionMonitor';

interface Transaction {
  hash: string;
  timestamp: number;
  amount: string;
  recipient: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onSpeedUp?: (txHash: string) => void;
  onCancel?: (txHash: string) => void;
}

export const TransactionList = ({ transactions, onSpeedUp, onCancel }: TransactionListProps) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>No recent transactions</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((tx) => (
        <TransactionMonitor
          key={tx.hash}
          txHash={tx.hash}
          onSpeedUp={onSpeedUp ? () => onSpeedUp(tx.hash) : undefined}
          onCancel={onCancel ? () => onCancel(tx.hash) : undefined}
        />
      ))}
    </div>
  );
};
