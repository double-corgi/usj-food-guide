import foodNamesRaw from "@/data/translations/food-names.json";
import storeNamesRaw from "@/data/translations/store-names.json";
import type { Locale } from "@/lib/i18n/locales";

type TranslatedLocale = Exclude<Locale, "ja">;
type NameEntry = Partial<Record<TranslatedLocale, string>>;

const foodNames = foodNamesRaw as Record<string, NameEntry>;
const storeNames = storeNamesRaw as Record<string, NameEntry>;

function getTranslatedName(
  source: Record<string, NameEntry>,
  id: string,
  locale: Locale,
  fallback: string
): string {
  if (locale === "ja") return fallback;
  const translated = source[id]?.[locale];
  return translated && translated.trim().length > 0 ? translated : fallback;
}

export function getFoodNameI18n(foodId: string, locale: Locale, fallback: string): string {
  return getTranslatedName(foodNames, foodId, locale, fallback);
}

export function getShopNameI18n(shopId: string, locale: Locale, fallback: string): string {
  return getTranslatedName(storeNames, shopId, locale, fallback);
}
