'use client';

import { useState } from 'react';

export const AccessibleVoicePayInterface = () => {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <main role="main" aria-label="Voice payment interface">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Skip to main content
      </a>

      <div id="main-content">
        {/* Accessible heading structure */}
        <h1 className="text-3xl font-bold mb-6">
          Voice Payment System
        </h1>

        {/* Voice recorder with ARIA attributes */}
        <section aria-labelledby="recorder-heading">
          <h2 id="recorder-heading" className="sr-only">
            Voice Command Recorder
          </h2>

          <button
            onClick={() => setIsRecording(!isRecording)}
            aria-label={isRecording ? 'Stop recording voice command' : 'Start recording voice command'}
            aria-pressed={isRecording}
            aria-describedby="recorder-instructions"
            className="
              w-32 h-32 rounded-full
              focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2
              transition-all
              ${isRecording ? 'bg-red-500' : 'bg-blue-600'}
              hover:scale-105
            "
          >
            <span className="sr-only">
              {isRecording ? 'Recording in progress' : 'Click to record'}
            </span>
            <span aria-hidden="true" className="text-4xl text-white">
              {isRecording ? '⏹' : '🎤'}
            </span>
          </button>

          <p id="recorder-instructions" className="text-sm text-gray-600 mt-4">
            Press the button and say your payment command. For example:
            "Send 50 cedis to mama.family.eth"
          </p>

          {/* Live region for screen readers */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {isRecording && 'Recording started. Listening for your command.'}
          </div>
        </section>

        {/* Balance with semantic HTML */}
        <section aria-labelledby="balance-heading" className="mt-8">
          <h2 id="balance-heading" className="text-lg font-semibold mb-2">
            Your Balance
          </h2>
          <div
            role="status"
            aria-label="Current USDC balance"
            className="text-3xl font-bold text-blue-600"
          >
            1,234.56 <abbr title="USD Coin">USDC</abbr>
          </div>
        </section>

        {/* Error messages with proper ARIA */}
        <div
          role="alert"
          aria-live="assertive"
          className="mt-4 bg-red-50 border border-red-200 rounded p-4"
        >
          <h3 className="font-semibold text-red-900">Error</h3>
          <p className="text-red-800">
            Insufficient balance to complete payment
          </p>
        </div>
      </div>
    </main>
  );
};