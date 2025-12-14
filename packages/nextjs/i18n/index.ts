import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import en from './locales/en.json';
import fr from './locales/fr.json';
import tw from './locales/tw.json';
import ha from './locales/ha.json';
import yo from './locales/yo.json';
import ig from './locales/ig.json';
import sw from './locales/sw.json';
import ar from './locales/ar.json';

// Only initialize on client side
if (typeof window !== 'undefined') {
  i18n
    .use(LanguageDetector) // Detect user language
    .use(initReactI18next) // React integration
    .init({
      resources: {
        en: { translation: en },
        fr: { translation: fr },
        tw: { translation: tw },
        ha: { translation: ha },
        yo: { translation: yo },
        ig: { translation: ig },
        sw: { translation: sw },
        ar: { translation: ar },
      },
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, // React already escapes
      },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },
    });
} else {
  // Server-side initialization (minimal)
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        fr: { translation: fr },
        tw: { translation: tw },
        ha: { translation: ha },
        yo: { translation: yo },
        ig: { translation: ig },
        sw: { translation: sw },
        ar: { translation: ar },
      },
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n;