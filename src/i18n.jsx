import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Globe } from 'lucide-react';
import { HI } from './locales/hi';

// Language support: English (default) and Hindi. The brand name "SkyLink" is never translated.
const LS_LANG = 'skylink_lang';
const LANGS = ['en', 'hi'];

function readStored() {
  try {
    const v = localStorage.getItem(LS_LANG);
    return LANGS.includes(v) ? v : null;
  } catch {
    return null;
  }
}

let currentLang = readStored() || 'en';
export const getLang = () => currentLang;

// Keys containing {0}, {1}… are templates. They are also compiled into regexes so that
// already-interpolated runtime strings (e.g. messages returned by the data layer) can be translated.
const esc = (s) => s.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
const patterns = Object.keys(HI)
  .filter((k) => /\{\d+\}/.test(k))
  .map((k) => {
    const order = [];
    const src = k.split(/(\{\d+\})/).map((part) => {
      const m = part.match(/^\{(\d+)\}$/);
      if (m) { order.push(Number(m[1])); return '(.+?)'; }
      return esc(part);
    }).join('');
    return { re: new RegExp(`^${src}$`), order, hi: HI[k] };
  });

function fill(str, args) {
  return args.length ? str.replace(/\{(\d+)\}/g, (_, i) => (args[i] !== undefined ? args[i] : '')) : str;
}

export function translate(lang, key, ...args) {
  if (typeof key !== 'string' || lang !== 'hi') return fill(key, args);
  if (HI[key] !== undefined) return fill(HI[key], args);
  for (const p of patterns) {
    const m = key.match(p.re);
    if (m) {
      const captured = [];
      p.order.forEach((n, i) => { captured[n] = translate('hi', m[i + 1]); });
      return fill(p.hi, captured);
    }
  }
  // A comma-separated list (e.g. password rules): translate each item.
  if (key.includes(', ')) {
    const parts = key.split(', ');
    const out = parts.map((p) => translate('hi', p));
    if (out.some((p, i) => p !== parts[i])) return fill(out.join(', '), args);
  }
  return key;
}

// For non-React code (data helpers) that needs the active language.
export const tr = (key, ...args) => translate(currentLang, key, ...args);

const LangCtx = createContext({ lang: 'en', setLang: () => {}, t: (k, ...a) => translate('en', k, ...a), chosen: true });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(currentLang);
  const [chosen, setChosen] = useState(() => readStored() !== null);

  const setLang = useCallback((l) => {
    currentLang = l;
    setLangState(l);
    setChosen(true);
    try { localStorage.setItem(LS_LANG, l); } catch { /* storage unavailable */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = translate(lang, 'SkyLink — Fly further. Live closer.');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', translate(lang, 'Search and book flights worldwide with SkyLink. Compare fares, pick your seats, check destination weather and manage your trip in one place.'));
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, chosen, t: (k, ...a) => translate(lang, k, ...a) }), [lang, setLang, chosen]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);
export const useT = () => useContext(LangCtx).t;

// Compact toggle used in the header.
export function LanguageSwitch({ className = '' }) {
  const { lang, setLang, t } = useLang();
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={t('Language')}>
      <Globe size={14} aria-hidden="true" />
      <button type="button" className={lang === 'en' ? 'lang-switch__btn lang-switch__btn--active' : 'lang-switch__btn'} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
      <button type="button" className={lang === 'hi' ? 'lang-switch__btn lang-switch__btn--active' : 'lang-switch__btn'} aria-pressed={lang === 'hi'} onClick={() => setLang('hi')} lang="hi">हिं</button>
    </div>
  );
}
