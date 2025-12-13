"use client";

import { InputHTMLAttributes, useState } from "react";

interface AccessibleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
}

export const AccessibleInput = ({
  label,
  error,
  helpText,
  id,
  required,
  ...props
}: AccessibleInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id;
  const errorId = id + "-error";
  const helpId = id + "-help";

  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="block text-sm font-medium mb-1">
        {label}
        {required && (
          <span className="text-red-600 ml-1" aria-label="required">*</span>
        )}
      </label>

      <input
        {...props}
        id={inputId}
        required={required}
        aria-invalid={error ? "true" : "false"}
        aria-required={required}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500"
      />

      {helpText && <p id={helpId} className="text-sm text-gray-600 mt-1">{helpText}</p>}
      {error && <p id={errorId} role="alert" className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
};
