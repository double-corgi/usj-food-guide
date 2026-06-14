"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { dictionaries, type TranslationKey } from "@/lib/i18n/dictionaries";
import { defaultLocale, isSupportedLocale, localeStorageKey, type Locale } from "@/lib/i18n/locales";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const localeChangeEvent = "unicolle-locale-change";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener("storage", onStoreChange);
    window.addEventListener(localeChangeEvent, onStoreChange);
    return () => {
      window.removeEventListener("storage", onStoreChange);
      window.removeEventListener(localeChangeEvent, onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return defaultLocale;
    const stored = window.localStorage.getItem(localeStorageKey);
    return isSupportedLocale(stored) ? stored : defaultLocale;
  }, []);

  const locale = useSyncExternalStore(subscribe, getSnapshot, () => defaultLocale);

  useEffect(() => {
    const stored = window.localStorage.getItem(localeStorageKey);
    if (stored !== null && !isSupportedLocale(stored)) {
      window.localStorage.setItem(localeStorageKey, defaultLocale);
      window.dispatchEvent(new Event(localeChangeEvent));
    }
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    const safeLocale = isSupportedLocale(nextLocale) ? nextLocale : defaultLocale;
    window.localStorage.setItem(localeStorageKey, safeLocale);
    document.documentElement.lang = safeLocale;
    window.dispatchEvent(new Event(localeChangeEvent));
  }, []);

  const t = useCallback(
    (key: TranslationKey) => {
      return dictionaries[locale][key] ?? dictionaries[defaultLocale][key] ?? key;
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
