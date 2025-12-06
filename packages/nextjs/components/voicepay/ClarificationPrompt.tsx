/**
 * Clarification Prompt Component
 *
 * Shows when voice command is ambiguous or incomplete
 * Provides suggested corrections and allows user to clarify intent
 */

'use client';

import { useState } from 'react';
import { getClarificationQuestion } from '~~/services/ai/PromptTemplates';

export interface ClarificationPromptProps {
  question: string;
  suggestions?: string[];
  onAnswer: (answer: string) => void;
  onCancel: () => void;
  language?: string;
}

export function ClarificationPrompt({
  question,
  suggestions = [],
  onAnswer,
  onCancel,
  language = 'en',
}: ClarificationPromptProps) {
  const [customAnswer, setCustomAnswer] = useState('');
  const [isCustomInput, setIsCustomInput] = useState(false);

  const handleSuggestionClick = (suggestion: string) => {
    onAnswer(suggestion);
  };

  const handleCustomSubmit = () => {
    if (customAnswer.trim()) {
      onAnswer(customAnswer.trim());
      setCustomAnswer('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">🤔</span>
          </div>
        </div>

        {/* Question */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-gray-900">Need clarification</h3>
          <p className="text-gray-600">{question}</p>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && !isCustomInput && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Quick answers:</p>
            <div className="grid gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 bg-green-50 hover:bg-green-100 text-gray-800 rounded-xl transition-colors text-left border border-green-200 hover:border-green-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Input */}
        {isCustomInput ? (
          <div className="space-y-3">
            <input
              type="text"
              value={customAnswer}
              onChange={e => setCustomAnswer(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleCustomSubmit()}
              placeholder="Type your answer..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-green focus:border-transparent outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCustomSubmit}
                disabled={!customAnswer.trim()}
                className="flex-1 px-4 py-2 bg-primary-green hover:bg-dark-green text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
              <button
                onClick={() => {
                  setIsCustomInput(false);
                  setCustomAnswer('');
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCustomInput(true)}
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 hover:border-primary-green text-gray-600 hover:text-primary-green rounded-xl transition-colors"
          >
            ✏️ Type custom answer
          </button>
        )}

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
