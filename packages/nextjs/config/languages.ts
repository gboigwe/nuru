export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  whisperCode: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'en-US',
    name: 'English (US)',
    nativeName: 'English',
    whisperCode: 'en',
    region: 'global',
  },
  {
    code: 'en-GB',
    name: 'English (UK)',
    nativeName: 'English',
    whisperCode: 'en',
    region: 'global',
  },
  {
    code: 'en-NG',
    name: 'English (Nigeria)',
    nativeName: 'English',
    whisperCode: 'en',
    region: 'africa',
  },
  {
    code: 'en-GH',
    name: 'English (Ghana)',
    nativeName: 'English',
    whisperCode: 'en',
    region: 'africa',
  },
  {
    code: 'en-KE',
    name: 'English (Kenya)',
    nativeName: 'English',
    whisperCode: 'en',
    region: 'africa',
  },
  {
    code: 'ha-NG',
    name: 'Hausa',
    nativeName: 'Hausa',
    whisperCode: 'ha',
    region: 'africa',
  },
  {
    code: 'yo-NG',
    name: 'Yoruba',
    nativeName: 'Yorùbá',
    whisperCode: 'yo',
    region: 'africa',
  },
  {
    code: 'ig-NG',
    name: 'Igbo',
    nativeName: 'Igbo',
    whisperCode: 'ig',
    region: 'africa',
  },
  {
    code: 'sw-KE',
    name: 'Swahili',
    nativeName: 'Kiswahili',
    whisperCode: 'sw',
    region: 'africa',
  },
  {
    code: 'fr-FR',
    name: 'French',
    nativeName: 'Français',
    whisperCode: 'fr',
    region: 'global',
  },
];

export const DEFAULT_LANGUAGE = 'en-US';

export function getLanguageByCode(code: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

export function getAfricanLanguages(): LanguageConfig[] {
  return SUPPORTED_LANGUAGES.filter(lang => lang.region === 'africa');
}
