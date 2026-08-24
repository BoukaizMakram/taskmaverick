// Translation dictionaries, keyed by locale, then by the exact English source
// string. `t(str)` (see LanguageProvider) looks a string up here and falls back
// to the English source when there is no entry — so partial translations, and
// English itself, always render safely.
//
// Both `ui` (hand-written UI chrome) and `content` (generated from the chapter
// + industry-deck data — see scripts/i18n-extract) are merged per locale.
import esUI from './dictionaries/es.ui';
import arUI from './dictionaries/ar.ui';
import esContent from './dictionaries/es.content';
import arContent from './dictionaries/ar.content';

export const DICTIONARIES = {
  es: { ...esUI, ...esContent },
  ar: { ...arUI, ...arContent },
};
