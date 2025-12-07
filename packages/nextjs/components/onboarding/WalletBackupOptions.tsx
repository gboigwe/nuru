"use client";

import { useState } from "react";

interface WalletBackupOptionsProps {
  onNext: () => void;
  onSkip: () => void;
}

type BackupMethod = "email" | "sms" | "social" | null;

export const WalletBackupOptions = ({ onNext, onSkip }: WalletBackupOptionsProps) => {
  const [selectedMethod, setSelectedMethod] = useState<BackupMethod>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSetupBackup = async () => {
    if (!selectedMethod) return;

    setIsProcessing(true);

    // Simulate backup setup
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsProcessing(false);
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-gray-800">Secure Your Wallet</h2>
        <p className="text-gray-600">Choose a recovery method in case you lose access</p>
      </div>

      {/* Backup Options */}
      <div className="space-y-3">
        {/* Email Recovery */}
        <button
          onClick={() => setSelectedMethod("email")}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
            selectedMethod === "email"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-start space-x-4">
            <div className="text-3xl mt-1">📧</div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                Email Recovery
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Recommended</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Recover your wallet using your email address. Simple and secure.
              </p>
            </div>
            {selectedMethod === "email" && <div className="text-2xl text-blue-500">✓</div>}
          </div>
        </button>

        {/* SMS Recovery */}
        <button
          onClick={() => setSelectedMethod("sms")}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
            selectedMethod === "sms"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-start space-x-4">
            <div className="text-3xl mt-1">📱</div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">SMS Verification</h3>
              <p className="text-sm text-gray-600 mt-1">
                Receive a verification code via text message for recovery.
              </p>
            </div>
            {selectedMethod === "sms" && <div className="text-2xl text-blue-500">✓</div>}
          </div>
        </button>

        {/* Social Recovery */}
        <button
          onClick={() => setSelectedMethod("social")}
          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
            selectedMethod === "social"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-start space-x-4">
            <div className="text-3xl mt-1">👥</div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">Social Recovery</h3>
              <p className="text-sm text-gray-600 mt-1">
                Set up trusted contacts who can help you recover your wallet.
              </p>
            </div>
            {selectedMethod === "social" && <div className="text-2xl text-blue-500">✓</div>}
          </div>
        </button>
      </div>

      {/* Security Note */}
      <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
        <div className="flex items-start space-x-3">
          <div className="text-lg">⚠️</div>
          <div>
            <p className="text-sm font-medium text-orange-800">Important</p>
            <p className="text-xs text-orange-600 mt-1">
              Setting up recovery now helps protect your funds. You can always change this later in settings.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onSkip}
          className="flex-1 py-3 px-6 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Skip for Now
        </button>
        <button
          onClick={handleSetupBackup}
          disabled={!selectedMethod || isProcessing}
          className={`flex-1 py-3 px-6 rounded-xl font-semibold text-white transition-all ${
            !selectedMethod || isProcessing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Setting Up...</span>
            </div>
          ) : (
            "Set Up Recovery"
          )}
        </button>
      </div>
    </div>
  );
};
