"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dictionaries, type TranslationKey } from "@/lib/i18n/dictionaries";
import { defaultLocale, isSupportedLocale, localeStorageKey, type Locale } from "@/lib/i18n/locales";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const localeChangeEvent = "unicolle-locale-change";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const syncLocale = () => {
      const stored = window.localStorage.getItem(localeStorageKey);
      const safeLocale = isSupportedLocale(stored) ? stored : defaultLocale;
      if (stored !== null && !isSupportedLocale(stored)) {
        window.localStorage.setItem(localeStorageKey, safeLocale);
      }
      setLocaleState(safeLocale);
      document.documentElement.lang = safeLocale;
    };

    syncLocale();
    window.addEventListener("storage", syncLocale);
    window.addEventListener(localeChangeEvent, syncLocale);
    return () => {
      window.removeEventListener("storage", syncLocale);
      window.removeEventListener(localeChangeEvent, syncLocale);
    };
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    const safeLocale = isSupportedLocale(nextLocale) ? nextLocale : defaultLocale;
    window.localStorage.setItem(localeStorageKey, safeLocale);
    setLocaleState(safeLocale);
    document.documentElement.lang = safeLocale;
    window.dispatchEvent(new Event(localeChangeEvent));
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      let value: string = dictionaries[locale][key] ?? dictionaries[defaultLocale][key] ?? key;
      if (!params) return value;
      for (const [paramKey, paramValue] of Object.entries(params)) {
        value = value.replaceAll(`{{${paramKey}}}`, String(paramValue));
      }
      return value;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
