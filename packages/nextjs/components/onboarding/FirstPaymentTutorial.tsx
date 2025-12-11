"use client";

import { useState } from "react";

interface FirstPaymentTutorialProps {
  onNext: () => void;
  onSkip: () => void;
}

export const FirstPaymentTutorial = ({ onNext, onSkip }: FirstPaymentTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      icon: "🎤",
      title: "Speak Your Payment",
      description: "Just say what you want to do in plain language",
      example: '"Send 10 dollars to john.eth"',
    },
    {
      icon: "👤",
      title: "We Find the Recipient",
      description: "Nuru automatically resolves ENS names to wallet addresses",
      example: "john.eth → 0x1234...5678",
    },
    {
      icon: "✅",
      title: "Review & Confirm",
      description: "Check the payment details and confirm with one tap",
      example: "Amount, recipient, and fees are shown clearly",
    },
    {
      icon: "⚡",
      title: "Money Sent!",
      description: "Your payment is processed on the blockchain in seconds",
      example: "Transaction confirmed ✓",
    },
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onNext();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = tutorialSteps[currentStep];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-6xl mb-4">{step.icon}</div>
        <h2 className="text-2xl font-bold text-gray-800">How Voice Payments Work</h2>
        <p className="text-gray-600">
          Step {currentStep + 1} of {tutorialSteps.length}
        </p>
      </div>

      {/* Step Content */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 space-y-4 min-h-[280px]">
        <h3 className="text-xl font-bold text-gray-800">{step.title}</h3>
        <p className="text-gray-700">{step.description}</p>

        {/* Example */}
        <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
          <p className="text-xs text-blue-600 font-medium mb-2">EXAMPLE</p>
          <p className="text-gray-800 font-mono text-sm">{step.example}</p>
        </div>

        {/* Visual Animation */}
        {currentStep === 0 && (
          <div className="flex justify-center pt-4">
            <div className="relative">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-2xl animate-pulse">
                🎤
              </div>
              <div className="absolute -right-2 -top-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="flex justify-center items-center gap-4 pt-4">
            <div className="text-3xl">👤</div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="px-4 py-2 bg-white rounded-lg border-2 border-green-500 font-mono text-sm">
              0x1234...5678
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold">$10.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">To:</span>
              <span className="font-semibold">john.eth</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Fee:</span>
              <span className="font-semibold">~$0.02</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <button className="w-full py-2 bg-green-500 text-white rounded-lg font-semibold">
                Confirm Payment
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex flex-col items-center gap-4 pt-4">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-4xl">
              ✓
            </div>
            <div className="text-center">
              <p className="font-semibold text-green-700">Payment Successful!</p>
              <p className="text-sm text-gray-600">View on block explorer</p>
            </div>
          </div>
        )}
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center gap-2">
        {tutorialSteps.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStep(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              currentStep === index ? "bg-blue-500 w-8" : "bg-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {currentStep > 0 && (
          <button
            onClick={handlePrevious}
            className="px-6 py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            ← Previous
          </button>
        )}
        <button
          onClick={onSkip}
          className="flex-1 py-3 px-6 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Skip Tutorial
        </button>
        <button
          onClick={handleNext}
          className="flex-1 py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all"
        >
          {currentStep === tutorialSteps.length - 1 ? "Start Using Nuru" : "Next →"}
        </button>
      </div>
    </div>
  );
};
