"use client";

import storeNamesRaw from "@/data/translations/store-names.json";
import { getShopNameI18n } from "@/lib/i18n/name-translations";
import { useLocale } from "@/lib/i18n/use-locale";
import type { Locale } from "@/lib/i18n/locales";
import type { StoreWithFoods } from "@/lib/store-utils";

type StoreNameSource = Pick<StoreWithFoods, "id" | "aliases" | "name">;

const translatedStoreIds = new Set(Object.keys(storeNamesRaw));

export function getStoreNameTranslationId(store: Pick<StoreWithFoods, "id" | "aliases">) {
  return [store.id, ...store.aliases].find((id) => translatedStoreIds.has(id)) ?? store.id;
}

export function getStoreNameI18n(store: StoreNameSource, locale: Locale) {
  return getShopNameI18n(getStoreNameTranslationId(store), locale, store.name);
}

export function StoreNameClient({ store }: { store: StoreNameSource }) {
  const { locale } = useLocale();
  return <>{getStoreNameI18n(store, locale)}</>;
}
