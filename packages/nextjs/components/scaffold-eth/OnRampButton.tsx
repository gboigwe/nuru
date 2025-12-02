/**
 * OnRampButton Component
 *
 * Provides a button to trigger Reown AppKit's On-Ramp modal for buying crypto.
 * Users can purchase cryptocurrency using credit/debit cards or other payment methods.
 *
 * Features:
 * - Opens Reown's On-Ramp provider selection modal
 * - Multiple size variants (sm, md, lg)
 * - Mobile-optimized touch targets
 * - Nuru brand styling
 *
 * @see https://docs.reown.com/appkit/features/onramp
 */

"use client";

import { useAppKit } from "@reown/appkit/react";

interface OnRampButtonProps {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
  className?: string;
}

export const OnRampButton = ({ size = "md", variant = "primary", fullWidth = false, className = "" }: OnRampButtonProps) => {
  const { open } = useAppKit();

  const handleOpenOnRamp = () => {
    // Open Reown AppKit modal to the On-Ramp view
    open({ view: "OnRampProviders" });
  };

  const sizeClasses = {
    sm: "btn-sm text-xs px-3 py-1",
    md: "btn-md text-sm px-4 py-2",
    lg: "btn-lg text-base px-6 py-3",
  };

  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
  };

  return (
    <button
      onClick={handleOpenOnRamp}
      className={`btn ${sizeClasses[size]} ${variantClasses[variant]} ${fullWidth ? "w-full" : ""} ${className} gap-2`}
      aria-label="Buy cryptocurrency"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
      Buy Crypto
    </button>
  );
};
