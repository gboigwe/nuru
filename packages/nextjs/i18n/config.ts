export const languages = {
  en: 'English',
  fr: 'Français',
  tw: 'Twi',
  ha: 'Hausa',
  yo: 'Yoruba',
  ig: 'Igbo',
  sw: 'Kiswahili',
  ar: 'العربية', // Arabic (RTL)
  pt: 'Português',
};

export type Language = keyof typeof languages;

export const defaultLanguage: Language = 'en';

// RTL languages
export const rtlLanguages: Language[] = ['ar'];

export const isRTL = (lang: Language) => rtlLanguages.includes(lang);