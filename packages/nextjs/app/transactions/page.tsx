'use client';

import { TransactionHistory } from '@/components/transactions/TransactionHistory';
import { Web3Provider } from '@/components/providers/Web3Provider';
import { Toaster } from 'react-hot-toast';

export default function TransactionsPage() {
  return (
    <Web3Provider>
      <div className="min-h-screen bg-gray-50">
        <main className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TransactionHistory />
          </div>
        </main>
        <Toaster position="bottom-right" />
      </div>
    </Web3Provider>
  );
}
