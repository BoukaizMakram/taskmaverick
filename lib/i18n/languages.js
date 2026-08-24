// Supported UI languages for the site's language switcher. `code` is the
// value stored in localStorage and set on <html lang>; `label` is the short
// two-letter chip shown in the navbar button (EN / ES / AR); `dir` drives the
// document direction (Arabic is right-to-left).
export const LANGS = [
  { code: 'en', label: 'EN', name: 'English', dir: 'ltr' },
  { code: 'es', label: 'ES', name: 'Español', dir: 'ltr' },
  { code: 'ar', label: 'AR', name: 'العربية', dir: 'rtl' },
];

export const DEFAULT_LANG = 'en';

export const isLang = (code) => LANGS.some((l) => l.code === code);

export const dirFor = (code) =>
  LANGS.find((l) => l.code === code)?.dir || 'ltr';
