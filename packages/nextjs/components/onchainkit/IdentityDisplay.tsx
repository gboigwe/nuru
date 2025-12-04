"use client";

import { Avatar, Identity, Name, Address, Badge } from "@coinbase/onchainkit/identity";
import "@coinbase/onchainkit/styles.css";
import { base } from "wagmi/chains";

/**
 * IdentityDisplay Component
 *
 * Wraps OnchainKit's Identity component to display user identity
 * Automatically shows Basename or ENS name with avatar
 *
 * Supports both .base.eth (Basenames) and .eth (ENS) names
 */

interface IdentityDisplayProps {
  address: `0x${string}`;
  showAvatar?: boolean;
  showName?: boolean;
  showAddress?: boolean;
  showBadge?: boolean;
  className?: string;
}

export function IdentityDisplay({
  address,
  showAvatar = true,
  showName = true,
  showAddress = true,
  showBadge = false,
  className = "",
}: IdentityDisplayProps) {
  return (
    <Identity
      address={address}
      chain={base}
      className={`flex items-center gap-2 ${className}`}
    >
      {showAvatar && <Avatar className="w-10 h-10" />}
      <div className="flex flex-col">
        {showName && (
          <Name className="font-semibold text-base">
            {showBadge && <Badge />}
          </Name>
        )}
        {showAddress && <Address className="text-sm text-gray-500" />}
      </div>
    </Identity>
  );
}

/**
 * CompactIdentity Component
 *
 * Simplified identity display for small spaces
 * Shows only avatar and name
 */
interface CompactIdentityProps {
  address: `0x${string}`;
  className?: string;
}

export function CompactIdentity({ address, className = "" }: CompactIdentityProps) {
  return (
    <Identity
      address={address}
      chain={base}
      className={`flex items-center gap-2 ${className}`}
    >
      <Avatar className="w-8 h-8" />
      <Name className="font-medium text-sm" />
    </Identity>
  );
}

/**
 * AddressOrName Component
 *
 * Shows name if available, otherwise shows truncated address
 * Useful for recipient displays
 */
interface AddressOrNameProps {
  address: `0x${string}`;
  className?: string;
}

export function AddressOrName({ address, className = "" }: AddressOrNameProps) {
  return (
    <Identity address={address} chain={base} className={className}>
      <Name>
        <Address />
      </Name>
    </Identity>
  );
}
