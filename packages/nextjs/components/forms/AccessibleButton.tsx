"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  ariaLabel?: string;
}

export const AccessibleButton = ({
  children,
  loading = false,
  variant = "primary",
  size = "medium",
  ariaLabel,
  disabled,
  ...props
}: AccessibleButtonProps) => {
  const baseStyles = "rounded-lg font-semibold transition-all focus:outline-none focus:ring-4 focus:ring-offset-2";
  
  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  const sizeStyles = {
    small: "px-3 py-1.5 text-sm min-h-[36px]",
    medium: "px-4 py-2 text-base min-h-[44px]",
    large: "px-6 py-3 text-lg min-h-[52px]",
  };

  const disabledStyles = "opacity-50 cursor-not-allowed";

  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-label={ariaLabel || (typeof children === "string" ? children : undefined)}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${(disabled || loading) ? disabledStyles : ""}`}
    >
      {loading && (
        <span className="loading-indicator mr-2" aria-hidden="true" />
      )}
      <span>{children}</span>
      {loading && <span className="sr-only">Loading...</span>}
    </button>
  );
};
