"use client";

import React, { useState, useCallback } from "react";

interface DemoPayment {
  id: string;
  command: string;
  amount: string;
  currency: string;
  recipient: string;
  status: "processing" | "completed";
  txHash: string;
  timestamp: Date;
}

const DEMO_COMMANDS = [
  "Send 50 cedis to mama.family.eth",
  "Transfer 100 USDC to friend.eth",
  "Pay kofi.ghana.eth 25 dollars",
  "Send 0.1 ETH to sister.ens.eth",
];

export const NuruDemoInterface: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<"demo" | "recording" | "processing" | "success">("demo");
  const [isRecording, setIsRecording] = useState(false);
  const [demoPayments, setDemoPayments] = useState<DemoPayment[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  const simulatePayment = useCallback((command: string) => {
    setCurrentStep("processing");
    setSelectedCommand(command);

    // Extract payment details (simple parsing for demo)
    const amountMatch = command.match(/(\d+(?:\.\d+)?)\s+(cedis|USDC|dollars|ETH)/i);
    const recipientMatch = command.match(/to\s+([a-zA-Z0-9.-]+\.eth)/i);

    const amount = amountMatch ? amountMatch[1] : "50";
    const currency = amountMatch ? amountMatch[2].toUpperCase() : "CEDIS";
    const recipient = recipientMatch ? recipientMatch[1] : "mama.family.eth";

    // Simulate processing delay
    setTimeout(() => {
      const newPayment: DemoPayment = {
        id: Date.now().toString(),
        command,
        amount,
        currency,
        recipient,
        status: "completed",
        txHash: "0x" + Math.random().toString(16).substring(2, 66),
        timestamp: new Date(),
      };

      setDemoPayments(prev => [newPayment, ...prev]);
      setCurrentStep("success");
      setShowSuccess(true);

      // Auto return to demo mode
      setTimeout(() => {
        setCurrentStep("demo");
        setShowSuccess(false);
      }, 4000);
    }, 3000);
  }, []);

  const handleVoiceDemo = useCallback(() => {
    setCurrentStep("recording");
    setIsRecording(true);

    // Simulate recording for 2 seconds
    setTimeout(() => {
      setIsRecording(false);
      const randomCommand = DEMO_COMMANDS[Math.floor(Math.random() * DEMO_COMMANDS.length)];
      simulatePayment(randomCommand);
    }, 2000);
  }, [simulatePayment]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-32 h-32 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob"></div>
      </div>

      {/* Nuru Header */}
      <div className="relative z-10 bg-white/80 backdrop-blur-lg border-b border-green-200 shadow-sm">
        <div className="max-w-md mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">✨</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{color: '#0E7A4B'}}>Nuru</h1>
                <p className="font-medium text-sm" style={{color: '#12B76A'}}>Light up your payments</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600 mt-1">Base Sepolia</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-md mx-auto p-6 space-y-8">
        {/* Hero Status Card */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-green-200">
          <div className="text-center">
            {currentStep === "demo" && (
              <>
                <div className="text-6xl mb-4 animate-bounce">🎤</div>
                <h2 className="text-2xl font-bold mb-3" style={{color: '#0E7A4B'}}>Ready for Demo</h2>
                <p className="text-gray-700 text-lg mb-6">Experience the magic of voice-powered crypto payments</p>
                <div className="flex items-center justify-center space-x-2" style={{color: '#12B76A'}}>
                  <div className="w-2 h-2 rounded-full animate-ping" style={{backgroundColor: '#12B76A'}}></div>
                  <span className="text-sm font-medium">Live & Ready</span>
                </div>
              </>
            )}

            {currentStep === "recording" && (
              <>
                <div className="relative">
                  <div className="text-6xl mb-4 animate-pulse">🎙️</div>
                  <div className="absolute -inset-4 rounded-full animate-ping" style={{backgroundColor: '#12B76A', opacity: '0.2'}}></div>
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{color: '#12B76A'}}>Listening...</h2>
                <p className="text-gray-700 text-lg">Nuru is capturing your voice command</p>
                <div className="flex justify-center mt-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-8 rounded animate-pulse" style={{backgroundColor: '#12B76A'}}></div>
                    <div className="w-2 h-6 rounded animate-pulse" style={{backgroundColor: '#12B76A'}}></div>
                    <div className="w-2 h-10 rounded animate-pulse" style={{backgroundColor: '#12B76A'}}></div>
                    <div className="w-2 h-4 rounded animate-pulse" style={{backgroundColor: '#12B76A'}}></div>
                    <div className="w-2 h-7 rounded animate-pulse" style={{backgroundColor: '#12B76A'}}></div>
                  </div>
                </div>
              </>
            )}

            {currentStep === "processing" && (
              <>
                <div className="relative">
                  <div className="text-6xl mb-4 animate-spin">🌀</div>
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{color: '#0E7A4B'}}>Processing Payment...</h2>
                <p className="text-gray-700 text-lg mb-4">Understanding your command</p>
                <div className="bg-green-50 rounded-xl p-4 mb-4 border border-green-200">
                  <p className="font-mono text-sm" style={{color: '#12B76A'}}>"{selectedCommand}"</p>
                </div>
                <div className="text-xs text-gray-600">ENS resolution → Base L2 → Filecoin receipt</div>
                <div className="flex justify-center mt-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full animate-bounce" style={{backgroundColor: '#12B76A'}}></div>
                    <div className="w-3 h-3 rounded-full animate-bounce" style={{backgroundColor: '#12B76A'}}></div>
                    <div className="w-3 h-3 rounded-full animate-bounce" style={{backgroundColor: '#12B76A'}}></div>
                  </div>
                </div>
              </>
            )}

            {currentStep === "success" && (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold mb-2" style={{color: '#12B76A'}}>Payment Sent!</h2>
                <p className="text-gray-700 text-lg">Demo transaction completed successfully</p>
                <div className="mt-4 inline-flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-full">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#12B76A'}}></div>
                  <span className="text-sm font-medium" style={{color: '#12B76A'}}>Transaction Confirmed</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Demo Controls */}
        {currentStep === "demo" && (
          <div className="space-y-6">
            {/* Voice Demo Button */}
            <button
              onClick={handleVoiceDemo}
              disabled={isRecording}
              className="w-full text-white font-bold py-6 px-8 rounded-3xl transition-all transform hover:scale-105 shadow-2xl border-2"
              style={{
                background: `linear-gradient(135deg, #12B76A 0%, #0E7A4B 100%)`,
                borderColor: '#12B76A'
              }}
            >
              <div className="flex items-center justify-center space-x-4">
                <div className="text-3xl animate-pulse">🎤</div>
                <div>
                  <div className="text-lg">Try Voice Payment</div>
                  <div className="text-sm text-green-100">Tap to start demo</div>
                </div>
              </div>
            </button>

          </div>
        )}

        {/* Recent Demo Payments */}
        {demoPayments.length > 0 && currentStep === "demo" && (
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-green-200">
            <h3 className="text-lg font-semibold mb-4" style={{color: '#0E7A4B'}}>Demo Payments</h3>
            <div className="space-y-3">
              {demoPayments.slice(0, 3).map(payment => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{color: '#0E7A4B'}}>
                      {payment.amount} {payment.currency}
                    </p>
                    <p className="text-xs text-gray-600">To: {payment.recipient}</p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex px-2 py-1 rounded-full text-xs font-medium text-white" style={{backgroundColor: '#12B76A'}}>
                      {payment.status}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {payment.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Card */}
        {showSuccess && demoPayments.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{backgroundColor: '#12B76A'}}>
                <span className="text-white text-xl">✅</span>
              </div>
              <h3 className="text-lg font-semibold mb-3" style={{color: '#0E7A4B'}}>Payment Successful!</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">
                    {demoPayments[0].amount} {demoPayments[0].currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>To:</span>
                  <span className="font-medium" style={{color: '#12B76A'}}>{demoPayments[0].recipient}</span>
                </div>
                <div className="flex justify-between">
                  <span>TX Hash:</span>
                  <span className="font-mono text-xs">
                    {demoPayments[0].txHash.slice(0, 10)}...{demoPayments[0].txHash.slice(-4)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Showcase */}
        {currentStep === "demo" && (
          <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
            <h3 className="text-lg font-semibold mb-3" style={{color: '#0E7A4B'}}>Why Nuru?</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center space-x-3">
                <span>🎤</span>
                <span>Voice-powered payments</span>
              </div>
              <div className="flex items-center space-x-3">
                <span>⚡</span>
                <span>Instant Base L2 transactions</span>
              </div>
              <div className="flex items-center space-x-3">
                <span>🌍</span>
                <span>ENS names for easy sending</span>
              </div>
              <div className="flex items-center space-x-3">
                <span>💾</span>
                <span>Voice receipts on Filecoin</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};