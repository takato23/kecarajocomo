export const locales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ko', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ja: '日本語',
  zh: '中文',
  ko: '한국어',
  ar: 'العربية',
};

export const rtlLocales: Locale[] = ['ar'];

export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}