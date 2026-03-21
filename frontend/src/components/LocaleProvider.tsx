'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { messages, type Locale } from '@/lib/messages';

const STORAGE_KEY = 'megladon-locale';

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: TFunction;
} | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'vi' || raw === 'en') {
      setLocaleState(raw);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === 'vi' ? 'vi' : 'en';
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback<TFunction>(
    (key, vars) => {
      const table = messages[locale];
      let s = table[key] ?? messages.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.split(`{{${k}}}`).join(String(v));
        }
      }
      return s;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}
