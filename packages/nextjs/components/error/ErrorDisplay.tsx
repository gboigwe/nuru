'use client';

import { UserError } from '../../../services/error/ErrorMessageService';
import React from 'react';

interface ErrorDisplayProps {
  error: UserError;
  onRetry?: () => void;
  className?: string;
}

export const ErrorDisplay = ({ error, onRetry, className = '' }: ErrorDisplayProps) => {
  const colors: Record<UserError['severity'], string> = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    error: 'bg-red-50 border-red-200 text-red-900',
  };

  const icons: Record<UserError['severity'], React.ReactNode> = {
    info: (
      <svg
        className="w-5 h-5 text-blue-500"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg
        className="w-5 h-5 text-yellow-500"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg
        className="w-5 h-5 text-red-500"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  return (
    <div
      className={`rounded-md p-4 border ${colors[error.severity]} ${className}`}
      role="alert"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          {icons[error.severity]}
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium">{error.title}</h3>
          <div className="mt-2 text-sm">
            <p>{error.message}</p>
          </div>
          {error.action && onRetry && (
            <div className="mt-4">
              <div className="-mx-2 -my-1.5 flex">
                <button
                  type="button"
                  onClick={onRetry}
                  className="bg-white px-2 py-1.5 rounded-md text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  {error.actionLabel || 'Retry'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
