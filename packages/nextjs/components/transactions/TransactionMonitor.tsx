'use client';

import { useState, useEffect } from 'react';
import { TransactionStatus } from '~/services/transactions/TransactionMonitor';

interface TransactionMonitorProps {
  txHash: string;
  onStatusChange?: (status: TransactionStatus) => void;
  onSpeedUp?: () => void;
  onCancel?: () => void;
}

export const TransactionMonitor = ({ 
  txHash, 
  onStatusChange,
  onSpeedUp,
  onCancel 
}: TransactionMonitorProps) => {
  const [status, setStatus] = useState<TransactionStatus>('PENDING');
  const [confirmations, setConfirmations] = useState(0);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      // Status checking logic will be implemented with hooks
    };

    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [txHash]);

  const getStatusColor = () => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'TIMEOUT': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMING': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold">Transaction Status</h3>
          <p className="text-xs text-gray-500 font-mono">{txHash.slice(0, 10)}...{txHash.slice(-8)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {status}
        </span>
      </div>

      {status === 'CONFIRMING' && (
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span>Confirmations</span>
            <span>{confirmations}/3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(confirmations / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {isStuck && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
          <p className="text-sm text-yellow-800">Transaction appears stuck</p>
        </div>
      )}

      <div className="flex gap-2">
        {(status === 'PENDING' || isStuck) && onSpeedUp && (
          <button
            onClick={onSpeedUp}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Speed Up
          </button>
        )}
        {(status === 'PENDING' || isStuck) && onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
