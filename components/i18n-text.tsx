"use client";

import { useLocale } from "@/lib/i18n/use-locale";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

export function I18nText({ k }: { k: TranslationKey }) {
  const { t } = useLocale();
  return <>{t(k)}</>;
}
