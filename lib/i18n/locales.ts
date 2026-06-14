export const supportedLocales = ["ja", "en", "ko", "zh-TW"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "ja";
export const localeStorageKey = "unicolle-locale";

export const localeLabels: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
  ko: "한국어",
  "zh-TW": "繁體中文"
};

export function isSupportedLocale(value: unknown): value is Locale {
  return typeof value === "string" && supportedLocales.includes(value as Locale);
}
