import type { Locale } from "@/lib/i18n/locales";

const intlLocaleMap: Record<Locale, string> = {
  ja: "ja-JP",
  en: "en-US",
  ko: "ko-KR",
  "zh-TW": "zh-TW"
};

export function formatDateI18n(
  dateStr: string | null | undefined,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }
): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat(intlLocaleMap[locale], {
      timeZone: "Asia/Tokyo",
      ...options
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatDateShortI18n(dateStr: string | null | undefined, locale: Locale): string | null {
  return formatDateI18n(dateStr, locale, { month: "short", day: "numeric" });
}
