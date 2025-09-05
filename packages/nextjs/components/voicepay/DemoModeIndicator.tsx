"use client";

import React from "react";

export const DemoModeIndicator: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        <div className="text-2xl">🚀</div>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-800 mb-2">VoicePay MVP Active</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              ✅ <strong>Live functionality:</strong> Real voice payments on Base Sepolia
            </p>
            <p>
              ✅ <strong>Filecoin storage:</strong> Voice receipts stored with PDP proofs
            </p>
            <p>
              ✅ <strong>Service provider:</strong> Storage costs covered automatically
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-blue-600">
              <strong>Architecture:</strong> Users pay on Base, service covers Filecoin storage costs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
