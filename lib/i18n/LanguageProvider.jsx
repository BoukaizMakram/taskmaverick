'use client';

// ---------------------------------------------------------------------------
// LanguageProvider — app-wide language state for the site. It:
//   • remembers the choice in localStorage ('tm-lang'),
//   • reflects it on <html lang> and <html dir> (Arabic → rtl),
//   • exposes a `t(englishString)` translator that looks the string up in the
//     locale dictionary and falls back to the English source.
// All text-bearing components read `t` via the useT() hook; English renders
// with zero lookups (t is the identity function when lang === 'en').
// ---------------------------------------------------------------------------

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { DEFAULT_LANG, dirFor, isLang } from './languages';
import { DICTIONARIES } from './index';

const STORAGE_KEY = 'tm-lang';

const LangContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LANG);

  // Hydrate the saved choice after mount (localStorage is client-only).
  useEffect(() => {
    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage blocked — stay on default */
    }
    if (saved && isLang(saved)) setLangState(saved);
  }, []);

  // Reflect the language on the document element (lang + dir), so CSS
  // ([dir="rtl"], :lang(ar)) and assistive tech pick it up.
  useEffect(() => {
    const el = document.documentElement;
    const dir = dirFor(lang);
    el.setAttribute('lang', lang);
    el.setAttribute('dir', dir);
  }, [lang]);

  const setLang = useCallback((code) => {
    if (!isLang(code)) return;
    setLangState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (str) => {
      if (lang === 'en' || !str) return str;
      const dict = DICTIONARIES[lang];
      return (dict && dict[str]) || str;
    },
    [lang]
  );

  return (
    <LangContext.Provider value={{ lang, setLang, dir: dirFor(lang), t }}>
      {children}
    </LangContext.Provider>
  );
}

// Safe outside a provider (e.g. isolated previews): returns English identity.
export function useLang() {
  return (
    useContext(LangContext) || {
      lang: 'en',
      setLang: () => {},
      dir: 'ltr',
      t: (s) => s,
    }
  );
}

export function useT() {
  return useLang().t;
}
