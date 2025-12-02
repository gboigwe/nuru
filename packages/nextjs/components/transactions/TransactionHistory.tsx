import React, { useState, useCallback } from 'react';
import { TransactionList } from './TransactionList';
import { useTransactionHistory } from '../../hooks/useTransactionHistory';
import { TransactionStatus } from '../../services/transactions/types';
import { FiSearch, FiFilter, FiDownload, FiX } from 'react-icons/fi';

export const TransactionHistory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    transactions,
    loading,
    loadMore,
    hasMore,
    updateFilters,
    refresh,
  } = useTransactionHistory();

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({
      search: searchQuery || undefined,
    });
  }, [searchQuery, updateFilters]);

  const handleStatusFilter = useCallback((status: TransactionStatus | 'all') => {
    setStatusFilter(status);
    updateFilters({
      status: status === 'all' ? undefined : status,
    });
  }, [updateFilters]);

  const exportToCSV = useCallback(() => {
    if (transactions.length === 0) return;
    
    const headers = [
      'Date',
      'Transaction Hash',
      'From',
      'To',
      'Amount',
      'Token',
      'Status',
      'Gas Paid',
      'Block Number',
    ].join(',');

    const rows = transactions.map(tx => {
      return [
        new Date(tx.timestamp).toISOString(),
        tx.hash,
        tx.from,
        tx.to,
        tx.amount.toString(),
        tx.token,
        tx.status,
        tx.gasPaid.toString(),
        tx.blockNumber.toString(),
      ].map(field => `"${field}"`).join(',');
    }).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [transactions]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiFilter className="mr-2 h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Filters'}
            </button>
            <button
              onClick={exportToCSV}
              disabled={transactions.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiDownload className="mr-2 h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="w-full max-w-lg">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md h-10"
              placeholder="Search by address or transaction hash"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  updateFilters({ search: undefined });
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <FiX className="h-5 w-5 text-gray-400 hover:text-gray-500" />
              </button>
            )}
          </div>
        </form>

        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="flex space-x-2">
                  {['all', 'pending', 'confirmed', 'failed'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusFilter(status as any)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusFilter === status
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <TransactionList
          transactions={transactions}
          loading={loading}
          onTransactionClick={(tx) => {
            // Handle transaction click (e.g., show details in a modal)
            console.log('Transaction clicked:', tx);
          }}
        />
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
