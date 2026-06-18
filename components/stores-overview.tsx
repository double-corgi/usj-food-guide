"use client";

import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { FoodImage } from "@/components/food-image";
import { getStoreNameI18n } from "@/components/store-name-client";
import type { Locale } from "@/lib/i18n/locales";
import { useLocale } from "@/lib/i18n/use-locale";
import { getStoreBadge, getStoreSummary, pickRepresentativeFood, type StoreWithFoods } from "@/lib/store-utils";
import type { FoodWithRelations } from "@/types/domain";

export function StoresOverview({ stores }: { stores: StoreWithFoods[] }) {
  const { t, locale } = useLocale();
  const areaGroups = groupStoresByArea(stores);

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <section className="space-y-2">
        <p className="text-xs font-black text-park">{t("stores.kicker")}</p>
        <h1 className="text-3xl font-black tracking-tight text-ink md:text-4xl">{t("stores.title")}</h1>
      </section>

      <section className="space-y-7">
        {areaGroups.map(({ areaName, stores: areaStores }) => (
          <div key={areaName} className="space-y-2.5">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-lg font-black leading-tight text-ink [overflow-wrap:anywhere]">
                  <MapPin size={16} className="shrink-0 text-park" aria-hidden />
                  {areaName}
                </h2>
              </div>
              <p className="shrink-0 text-xs font-bold text-slate-400">{t("stores.areaStoreCount", { count: areaStores.length })}</p>
            </div>

            <div className="divide-y divide-slate-100 rounded-[1rem] border border-slate-100 bg-white">
              {areaStores.map((store) => (
                <StoreRow key={store.id} store={store} representativeFood={pickRepresentativeFood(store)} locale={locale} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <p className="border-t border-slate-200 pt-5 text-xs font-bold text-slate-400">
        {t("stores.listSummary", { count: stores.length })}
      </p>
    </div>
  );
}

function StoreRow({ store, representativeFood, locale }: { store: StoreWithFoods; representativeFood?: FoodWithRelations; locale: Locale }) {
  const badge = getStoreBadge(store);
  const summary = getStoreSummary(store, representativeFood);
  const storeName = getStoreNameI18n(store, locale);

  return (
    <Link
      href={`/stores/${store.id}`}
      className="grid min-h-[82px] min-w-0 grid-cols-[58px_1fr_30px] items-center gap-3 px-3 py-2.5 transition hover:bg-slate-50 active:bg-slate-100 sm:min-h-[88px] sm:grid-cols-[64px_1fr_32px] sm:px-3.5"
    >
      <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-slate-100 sm:h-16 sm:w-16">
        {representativeFood ? (
          <FoodImage food={representativeFood} alt={`${store.name}の代表商品`} className="h-full w-full" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-mint to-white" />
        )}
        <span
          className="absolute left-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-white/95 px-1 text-[11px] shadow-sm"
          aria-label={badge.label}
          title={badge.label}
        >
          {badge.icon}
        </span>
      </div>

      <div className="min-w-0">
        <h3 className="line-clamp-2 text-[0.98rem] font-black leading-[1.35] text-ink [overflow-wrap:anywhere] sm:text-[1.05rem]">
          {storeName}
        </h3>
        <p className="mt-1 line-clamp-1 text-[0.78rem] font-bold leading-tight text-slate-400 [overflow-wrap:anywhere] sm:text-[0.82rem]">
          {summary}
        </p>
      </div>

      <span className="grid h-7 w-7 place-items-center self-center rounded-full bg-mint text-park sm:h-8 sm:w-8">
        <ChevronRight size={16} aria-hidden />
      </span>
    </Link>
  );
}

function groupStoresByArea(stores: StoreWithFoods[]) {
  const groups = new Map<string, StoreWithFoods[]>();
  for (const store of stores) {
    groups.set(store.areaName, [...(groups.get(store.areaName) ?? []), store]);
  }
  return Array.from(groups.entries()).map(([areaName, areaStores]) => ({
    areaName,
    stores: areaStores,
  }));
}
