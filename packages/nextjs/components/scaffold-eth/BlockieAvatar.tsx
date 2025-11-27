"use client";

import { blo } from "blo";

/**
 * BlockieAvatar - Generates blockie-style avatars for Ethereum addresses
 * Can be used independently in the app for address visualization
 */
export const BlockieAvatar = ({
  address,
  ensImage,
  size = 24,
  className = "",
}: {
  address: string;
  ensImage?: string | null;
  size?: number;
  className?: string;
}) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    className={`rounded-full ${className}`}
    src={ensImage || blo(address as `0x${string}`)}
    width={size}
    height={size}
    alt={`${address} avatar`}
  />
);
