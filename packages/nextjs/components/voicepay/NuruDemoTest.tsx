"use client";

import React, { useState } from "react";

export const NuruDemoTest: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<"demo">("demo");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🎤</div>
            <h2 className="text-2xl font-bold mb-3" style={{color: '#0E7A4B'}}>
              Nuru Demo Test
            </h2>
            <p className="text-gray-700">Testing if basic component works</p>
          </div>
        </div>
      </div>
    </div>
  );
};