'use client';

import { ReactNode, useEffect } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from '~~/i18n';
import { isRTL } from '~~/i18n/config';

interface I18nProviderProps {
  children: ReactNode;
}

const I18nLayoutEffect = () => {
  const { i18n: i18nInstance } = useTranslation();

  useEffect(() => {
    const currentLang = i18nInstance.language as any;
    document.documentElement.lang = currentLang;
    document.documentElement.dir = isRTL(currentLang) ? 'rtl' : 'ltr';
  }, [i18nInstance.language]);

  return null;
};

export const I18nProvider = ({ children }: I18nProviderProps) => {
  return (
    <I18nextProvider i18n={i18n}>
      <I18nLayoutEffect />
      {children}
    </I18nextProvider>
  );
};
