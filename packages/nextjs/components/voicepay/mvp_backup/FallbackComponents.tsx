/**
 * Fallback Components for Nuru MVP
 * Provides graceful degradation when services fail
 */

import React, { useState } from 'react';

// Fallback for when voice recognition fails
export const VoiceFallback: React.FC<{
  onTextSubmit: (text: string) => void;
  isProcessing?: boolean;
}> = ({ onTextSubmit, isProcessing = false }) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onTextSubmit(inputText.trim());
      setInputText('');
    }
  };

  const exampleCommands = [
    "Send 50 cedis to mama.family.eth",
    "Transfer 100 USDC to friend.eth",
    "Pay kofi.ghana.eth 25 dollars"
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-orange-600 text-xl">⌨️</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800">Voice Unavailable</h3>
        <p className="text-gray-600 text-sm">Type your payment command instead</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Command
          </label>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g., Send 50 cedis to mama.family.eth"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isProcessing}
          />
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
        >
          {isProcessing ? 'Processing...' : 'Process Payment'}
        </button>
      </form>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Example Commands:</h4>
        <div className="space-y-2">
          {exampleCommands.map((cmd, index) => (
            <button
              key={index}
              onClick={() => setInputText(cmd)}
              className="w-full text-left text-sm text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 p-2 rounded transition-colors"
            >
              "{cmd}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Fallback for when blockchain connection fails
export const BlockchainFallback: React.FC<{
  onRetry: () => void;
  error?: string;
}> = ({ onRetry, error }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-yellow-600 text-xl">⚡</span>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Blockchain Unavailable</h3>
      <p className="text-gray-600 text-sm mb-4">
        {error || 'Unable to connect to the blockchain network'}
      </p>

      <div className="space-y-3">
        <button
          onClick={onRetry}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-medium transition-colors"
        >
          Retry Connection
        </button>
        
        <div className="text-xs text-gray-500">
          <p>• Check your wallet connection</p>
          <p>• Verify network is Base Sepolia</p>
          <p>• Try refreshing the page</p>
        </div>
      </div>
    </div>
  );
};

// Fallback for when ENS resolution fails
export const ENSFallback: React.FC<{
  ensName: string;
  onAddressInput: (address: string) => void;
}> = ({ ensName, onAddressInput }) => {
  const [manualAddress, setManualAddress] = useState('');

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <span className="text-yellow-600">⚠️</span>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-yellow-800">ENS Resolution Failed</h4>
          <p className="text-sm text-yellow-700 mt-1">
            Cannot resolve {ensName} to an address
          </p>
          
          <div className="mt-3">
            <label className="block text-xs font-medium text-yellow-800 mb-1">
              Enter recipient address manually:
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="0x..."
                className="flex-1 text-sm px-2 py-1 border border-yellow-300 rounded focus:ring-1 focus:ring-yellow-500"
              />
              <button
                onClick={() => onAddressInput(manualAddress)}
                disabled={!manualAddress.startsWith('0x') || manualAddress.length !== 42}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white text-sm rounded"
              >
                Use
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fallback for when storage service fails
export const StorageFallback: React.FC<{
  onProceedWithoutStorage: () => void;
  onRetry: () => void;
}> = ({ onProceedWithoutStorage, onRetry }) => {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <span className="text-orange-600">📁</span>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-orange-800">Storage Service Unavailable</h4>
          <p className="text-sm text-orange-700 mt-1">
            Voice receipt storage is temporarily unavailable
          </p>
          
          <div className="mt-3 space-y-2">
            <button
              onClick={onProceedWithoutStorage}
              className="w-full text-sm bg-orange-600 hover:bg-orange-700 text-white py-2 rounded transition-colors"
            >
              Proceed Without Voice Storage
            </button>
            <button
              onClick={onRetry}
              className="w-full text-sm bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded transition-colors"
            >
              Retry Storage
            </button>
          </div>
          
          <p className="text-xs text-orange-600 mt-2">
            Transaction will complete but voice receipt won't be stored on Filecoin
          </p>
        </div>
      </div>
    </div>
  );
};

// Loading fallback component
export const LoadingFallback: React.FC<{
  message?: string;
  timeout?: number;
  onTimeout?: () => void;
}> = ({ message = 'Loading...', timeout = 30000, onTimeout }) => {
  const [showTimeout, setShowTimeout] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
      onTimeout?.();
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout, onTimeout]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{message}</h3>
      
      {showTimeout ? (
        <div className="text-red-600 text-sm">
          <p>This is taking longer than expected...</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            Refresh page
          </button>
        </div>
      ) : (
        <p className="text-gray-600 text-sm">Please wait while we set things up</p>
      )}
    </div>
  );
};