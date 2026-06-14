"use client";

import { useLocale } from "@/lib/i18n/use-locale";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

export function I18nText({ k, params }: { k: TranslationKey; params?: Record<string, string | number> }) {
  const { t } = useLocale();
  return <>{t(k, params)}</>;
}
