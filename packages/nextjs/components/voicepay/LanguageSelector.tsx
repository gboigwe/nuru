/**
 * Language Selector for Voice Commands
 *
 * Allows users to select their preferred language for voice payments
 * Supports: English, Twi, Hausa, Igbo, Yoruba, French, Swahili
 */

'use client';

import { useState } from 'react';
import { LANGUAGE_NAMES } from '~~/services/ai/PromptTemplates';

export interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  className?: string;
}

const LANGUAGE_FLAGS: Record<string, string> = {
  en: '🇬🇧',
  tw: '🇬🇭',
  ha: '🇳🇬',
  ig: '🇳🇬',
  yo: '🇳🇬',
  fr: '🇫🇷',
  sw: '🇰🇪',
};

export function LanguageSelector({ selectedLanguage, onLanguageChange, className = '' }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (language: string) => {
    onLanguageChange(language);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 hover:border-primary-green transition-all shadow-sm"
        aria-label="Select language"
      >
        <span className="text-xl">{LANGUAGE_FLAGS[selectedLanguage]}</span>
        <span className="text-sm font-medium text-gray-700">{LANGUAGE_NAMES[selectedLanguage]}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
          {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
            <button
              key={code}
              onClick={() => handleSelect(code)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors ${
                selectedLanguage === code ? 'bg-green-50 text-primary-green' : 'text-gray-700'
              }`}
            >
              <span className="text-xl">{LANGUAGE_FLAGS[code]}</span>
              <span className="text-sm font-medium">{name}</span>
              {selectedLanguage === code && (
                <svg className="w-4 h-4 ml-auto text-primary-green" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
