import React from 'react';
import { TransactionRecord, TransactionStatus } from '../../services/transactions/types';
import { formatEther } from 'viem';
import { useEnsName } from 'wagmi';
import { shortenAddress } from '../../utils/address';
import { FiExternalLink, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import Link from 'next/link';

interface TransactionListProps {
  transactions: TransactionRecord[];
  loading: boolean;
  onTransactionClick?: (tx: TransactionRecord) => void;
}

const getBlockExplorerUrl = (hash: string, networkId: number) => {
  switch (networkId) {
    case 1: // Ethereum Mainnet
      return `https://etherscan.io/tx/${hash}`;
    case 5: // Goerli
      return `https://goerli.etherscan.io/tx/${hash}`;
    case 10: // Optimism
      return `https://optimistic.etherscan.io/tx/${hash}`;
    case 42161: // Arbitrum
      return `https://arbiscan.io/tx/${hash}`;
    default:
      return `https://etherscan.io/tx/${hash}`;
  }
};

const StatusBadge: React.FC<{ status: TransactionStatus }> = ({ status }) => {
  const statusConfig = {
    pending: {
      icon: <FiClock className="w-4 h-4" />,
      color: 'bg-yellow-100 text-yellow-800',
      label: 'Pending',
    },
    confirmed: {
      icon: <FiCheckCircle className="w-4 h-4" />,
      color: 'bg-green-100 text-green-800',
      label: 'Confirmed',
    },
    failed: {
      icon: <FiXCircle className="w-4 h-4" />,
      color: 'bg-red-100 text-red-800',
      label: 'Failed',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </span>
  );
};

const TransactionItem: React.FC<{ 
  tx: TransactionRecord; 
  isCurrentUserSender: boolean;
  onClick?: () => void;
}> = ({ tx, isCurrentUser, onClick }) => {
  const { data: ensName } = useEnsName({ 
    address: isCurrentUser ? tx.to : tx.from,
    chainId: tx.networkId,
  });

  const displayAddress = ensName || (isCurrentUser ? tx.to : tx.from);
  const action = isCurrentUser ? 'Sent' : 'Received';
  const amount = formatEther(tx.amount);
  const timestamp = new Date(tx.timestamp).toLocaleString();
  const explorerUrl = getBlockExplorerUrl(tx.hash, tx.networkId);

  return (
    <div 
      className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <StatusBadge status={tx.status} />
            <span className="ml-2 text-sm font-medium text-gray-900">
              {action} {amount} {tx.token}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 truncate">
            {tx.voiceCommand || `To: ${displayAddress}`}
          </p>
          <div className="mt-1 flex items-center text-xs text-gray-400">
            <span>{timestamp}</span>
            {tx.gasPaid > 0n && (
              <span className="ml-2">
                Fee: {formatEther(tx.gasPaid)} {tx.token}
              </span>
            )}
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-500"
            onClick={e => e.stopPropagation()}
          >
            <FiExternalLink className="h-5 w-5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  loading,
  onTransactionClick,
}) => {
  const { address } = useAccount();

  if (loading && transactions.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="divide-y divide-gray-200">
        {transactions.map((tx) => (
          <TransactionItem
            key={tx.hash}
            tx={tx}
            isCurrentUser={tx.from.toLowerCase() === address?.toLowerCase()}
            onClick={() => onTransactionClick?.(tx)}
          />
        ))}
      </div>
    </div>
  );
};
