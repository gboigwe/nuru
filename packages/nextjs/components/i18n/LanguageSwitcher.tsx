'use client';

import { useTranslation } from 'react-i18next';
import { languages, type Language, isRTL } from '~~/i18n/config';
import { Menu } from '@headlessui/react';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lang: Language) => {
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50"
        aria-label="Select language"
      >
        <span className="text-xl" aria-hidden="true">🌐</span>
        <span>{languages[i18n.language as Language]}</span>
      </Menu.Button>

      <Menu.Items className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border focus:outline-none">
        <div className="p-2">
          {Object.entries(languages).map(([code, name]) => (
            <Menu.Item key={code}>
              {({ active }) => (
                <button
                  onClick={() => changeLanguage(code as Language)}
                  className={`
                    w-full text-left px-4 py-2 rounded
                    ${active ? 'bg-blue-50' : ''}
                    ${i18n.language === code ? 'font-bold text-blue-600' : ''}
                  `}
                  aria-current={i18n.language === code ? 'true' : undefined}
                >
                  {name}
                </button>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Menu>
  );
};