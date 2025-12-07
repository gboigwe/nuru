'use client';

import { useState } from 'react';
import { SUPPORTED_LANGUAGES, getAfricanLanguages, DEFAULT_LANGUAGE } from '~/config/languages';

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
  showAfricanOnly?: boolean;
}

export const LanguageSelector = ({ value, onChange, showAfricanOnly }: LanguageSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const languages = showAfricanOnly ? getAfricanLanguages() : SUPPORTED_LANGUAGES;
  const selected = languages.find(lang => lang.code === value) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <span className="text-2xl">🌍</span>
        <span className="font-medium">{selected.nativeName}</span>
        <span className="text-gray-500 text-sm">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onChange(lang.code);
                setIsOpen(false);
              }}
              className={`
                w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors
                ${lang.code === value ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
              `}
            >
              <div className="font-medium">{lang.nativeName}</div>
              <div className="text-sm text-gray-500">{lang.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
