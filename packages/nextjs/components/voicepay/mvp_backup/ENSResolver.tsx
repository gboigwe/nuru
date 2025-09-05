/**
 * ENS Resolution Component for Nuru
 * Shows ENS name resolution status during payments
 */
import React from "react";
import { useNuruContractRead } from "../../hooks/useNuruTransaction";

interface ENSResolverProps {
  ensName: string;
  className?: string;
}

export const ENSResolver: React.FC<ENSResolverProps> = ({ ensName, className = "" }) => {
  const contractRead = useNuruContractRead();
  const resolvedAddress = contractRead.useENSResolution(ensName);

  if (!ensName) return null;

  return (
    <div className={`bg-blue-50 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600">🔗</span>
          <span className="text-sm font-medium text-gray-700">ENS Resolution</span>
        </div>
        <div className="text-right">
          {resolvedAddress ? (
            <div className="text-xs">
              <div className="text-green-600 font-medium">✅ Resolved</div>
              <div className="text-gray-500 font-mono">
                {resolvedAddress.slice(0, 6)}...{resolvedAddress.slice(-4)}
              </div>
            </div>
          ) : (
            <div className="text-xs">
              <div className="text-orange-500 font-medium">🔍 Resolving...</div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-600">
        <div className="font-medium text-blue-700">{ensName}</div>
        {resolvedAddress && <div className="text-green-600 mt-1">Ready to receive payment</div>}
      </div>
    </div>
  );
};
