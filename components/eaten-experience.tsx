"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { categoryLabels } from "@/lib/constants";
import { calculateArchiveRecordRate, calculateCompletion, dedupeFoodsByCanonical, formatFoodPrice, getCanonicalFoodKey, getFoodAreaNames, getFoodAreaSummary, getSaleStatusLabel } from "@/lib/food-utils";
import { useFoodLogs } from "@/lib/use-food-logs";
import { useNextWantFoods } from "@/lib/use-next-want-foods";
import type { FoodCategory, FoodWithRelations, UserFoodLog } from "@/types/domain";
import { FoodImage } from "@/components/food-image";
import { EatenAreaProgress } from "@/components/eaten-area-progress";
import { EatenGenreProgress } from "@/components/eaten-genre-progress";
import { useLocale } from "@/lib/i18n/use-locale";

type EatenAlbumRecord = {
  key: string;
  food: FoodWithRelations;
  log: UserFoodLog;
};

type EatenSort = "recent" | "priceDesc" | "priceAsc";
type AlbumMode = "recent" | "month" | "area" | "genre" | "all";
type EatenTab = "eaten" | "want";

const albumModes: Array<{ id: AlbumMode; labelKey: "eaten.albumMode.recent" | "eaten.albumMode.month" | "eaten.albumMode.area" | "eaten.albumMode.genre" | "eaten.albumMode.all"; descriptionKey: "eaten.albumMode.recentDescription" | "eaten.albumMode.monthDescription" | "eaten.albumMode.areaDescription" | "eaten.albumMode.genreDescription" | "eaten.albumMode.allDescription" }> = [
  { id: "recent", labelKey: "eaten.albumMode.recent", descriptionKey: "eaten.albumMode.recentDescription" },
  { id: "month", labelKey: "eaten.albumMode.month", descriptionKey: "eaten.albumMode.monthDescription" },
  { id: "area", labelKey: "eaten.albumMode.area", descriptionKey: "eaten.albumMode.areaDescription" },
  { id: "genre", labelKey: "eaten.albumMode.genre", descriptionKey: "eaten.albumMode.genreDescription" },
  { id: "all", labelKey: "eaten.albumMode.all", descriptionKey: "eaten.albumMode.allDescription" }
];

export function EatenExperience({ foods }: { foods: FoodWithRelations[] }) {
  const { t } = useLocale();
  const { logs } = useFoodLogs();
  const { wantedFoods } = useNextWantFoods(foods);
  const [activeTab, setActiveTab] = useState<EatenTab>("eaten");
  const [albumMode, setAlbumMode] = useState<AlbumMode>("recent");
  const [areaFilter, setAreaFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<FoodCategory | "all">("all");
  const [sort, setSort] = useState<EatenSort>("recent");
  const completion = calculateCompletion(foods, logs);
  const archiveRecord = calculateArchiveRecordRate(foods, logs);
  const canonicalFoods = dedupeFoodsByCanonical(foods);
  const eatenRecords = useMemo(() => buildEatenAlbumRecords(foods, canonicalFoods, logs), [canonicalFoods, foods, logs]);
  const recentLogs = eatenRecords.slice(0, 5);
  const areaOptions = useMemo(() => {
    const names = new Set<string>();
    for (const record of eatenRecords) {
      for (const areaName of getFoodAreaNames(record.food)) names.add(areaName);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "ja"));
  }, [eatenRecords]);
  const filteredEatenRecords = useMemo(() => {
    return eatenRecords
      .filter((record) => areaFilter === "all" || getFoodAreaNames(record.food).includes(areaFilter))
      .filter((record) => categoryFilter === "all" || record.food.category === categoryFilter)
      .sort((a, b) => {
        if (sort === "priceDesc") return getFoodPriceValue(b.food) - getFoodPriceValue(a.food) || compareByDate(b.log, a.log);
        if (sort === "priceAsc") return getFoodPriceValue(a.food) - getFoodPriceValue(b.food) || compareByDate(b.log, a.log);
        return compareByDate(b.log, a.log);
      });
  }, [areaFilter, categoryFilter, eatenRecords, sort]);
  const albumSections = useMemo(() => buildAlbumSections(filteredEatenRecords, albumMode), [albumMode, filteredEatenRecords]);
  const displayedRecordCount = albumSections.reduce((sum, section) => sum + section.records.length, 0);
  const totalSpend = logs
    .filter((log) => log.status === "eaten")
    .reduce((sum, log) => {
      if (typeof log.spentAmount === "number") return sum + log.spentAmount;
      const food = foods.find((item) => item.id === log.foodId);
      return sum + (food?.priceMin ?? food?.price ?? 0) * (log.eatenCount ?? 1);
    }, 0);
  const hasWantedFoods = wantedFoods.length > 0;
  const visibleTab: EatenTab = hasWantedFoods ? activeTab : "eaten";

  return (
    <div className="space-y-8">
      <section className="space-y-2 py-1">
        <p className="text-xs font-black tracking-[0.16em] text-park/70">{t("eaten.kicker")}</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-ink md:text-4xl">{t("eaten.title")}</h1>
        <p className="max-w-2xl text-sm font-bold leading-6 text-slate-500">
          {t("eaten.subtitle")}
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold leading-5 text-slate-400">
          <span>{t("eaten.eatenCount", { count: eatenRecords.length })}</span>
          <span>{t("eaten.activeCompletion", { rate: completion.rate })}</span>
          <span>{t("eaten.archiveRecord", { rate: archiveRecord.rate })}</span>
          <span>{t("eaten.totalSpend")} {totalSpend ? `¥${totalSpend.toLocaleString("ja-JP")}` : t("eaten.noRecordValue")}</span>
        </p>
      </section>

      {hasWantedFoods ? (
        <div className="inline-grid grid-cols-2 rounded-full bg-slate-100 p-1 text-xs font-black text-slate-500">
          {[
            { id: "eaten" as const, label: t("common.eaten") },
            { id: "want" as const, label: t("foodDetail.wantNext") }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-10 rounded-full px-5 transition active:scale-[0.98] ${visibleTab === tab.id ? "bg-white text-ink shadow-sm" : "hover:text-ink"}`}
              aria-pressed={visibleTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      {visibleTab === "want" ? (
        <section className="space-y-5">
          <div>
            <p className="text-xs font-black text-park">{t("eaten.wantTabKicker")}</p>
            <h2 className="mt-1 text-2xl font-black text-ink">{t("foodDetail.wantNext")}</h2>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-500">
              {t("eaten.wantDescription")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 xl:grid-cols-5">
            {wantedFoods.map((food) => (
              <NextWantCard key={food.id} food={food} />
            ))}
          </div>
        </section>
      ) : (
        <>
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black text-park">{t("eaten.recentKicker")}</p>
            <h2 className="mt-1 text-2xl font-black text-ink">{t("eaten.recentTitle")}</h2>
          </div>
        </div>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-5">
          {recentLogs.map(({ food, log }) => (
            <Link key={`${food.id}-${log.eatenAt ?? "unknown"}`} href={`/foods/${food.id}`} className="group w-48 shrink-0 min-w-0 transition active:scale-[0.99] sm:w-auto">
              <div className="aspect-[4/5] overflow-hidden rounded-[1.35rem] bg-slate-100">
                {log.userPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={log.userPhotoUrl} alt={`${food.name}の食べた写真`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                ) : (
                  <FoodImage food={food} alt={food.name} className="h-full w-full transition duration-300 group-hover:scale-105" />
                )}
              </div>
              <div className="mt-2 min-w-0">
                <div className="flex flex-wrap gap-2 text-[11px] font-black text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={12} aria-hidden />
                    {formatDate(log.eatenAt, t("eaten.dateUnknown"))}
                  </span>
                  <span>{t("eaten.timesCount", { count: log.eatenCount ?? 1 })}</span>
                </div>
                <p className="mt-1 line-clamp-2 min-h-10 text-sm font-black leading-5 text-ink">{food.name}</p>
                <p className="mt-1 text-xs font-black text-park">{formatFoodPrice(food)}</p>
              </div>
            </Link>
          ))}
          {recentLogs.length === 0 ? (
            <div className="w-full rounded-[1.35rem] border border-dashed border-slate-200 bg-white/70 p-6 text-center sm:col-span-3 lg:col-span-5">
              <p className="text-sm font-black text-slate-500">{t("eaten.emptyTitle")}</p>
              <Link href="/foods" className="mt-3 inline-flex h-11 items-center justify-center rounded-full bg-park px-5 text-sm font-black text-white">
                {t("eaten.emptyCta")}
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black text-park">{t("eaten.albumKicker")}</p>
            <h2 className="mt-1 text-2xl font-black text-ink">{t("eaten.albumTitle")}</h2>
          </div>
          <p className="text-xs font-black text-slate-400">{t("eaten.albumCount", { shown: displayedRecordCount, total: filteredEatenRecords.length })}</p>
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
          {albumModes.map((mode) => {
            const active = albumMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setAlbumMode(mode.id)}
                className={[
                  "min-h-10 shrink-0 rounded-full border px-4 text-xs font-black transition active:scale-[0.98]",
                  active ? "border-park bg-park text-white shadow-[0_10px_24px_rgba(0,87,184,0.16)]" : "border-slate-200 bg-white text-slate-500 hover:border-park/40 hover:text-park"
                ].join(" ")}
                aria-pressed={active}
                title={t(mode.descriptionKey)}
              >
                {t(mode.labelKey)}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] font-bold leading-5 text-slate-400">
          {t(albumModes.find((mode) => mode.id === albumMode)?.descriptionKey ?? "eaten.albumMode.recentDescription")}
        </p>

        <details className="group">
          <summary className="inline-flex min-h-10 cursor-pointer list-none items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-slate-500 marker:hidden">
            {t("eaten.filterToggle")}
          </summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)} className="h-11 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-600">
              <option value="all">{t("foods.areaFilterAll")}</option>
              {areaOptions.map((areaName) => (
                <option key={areaName} value={areaName}>{areaName}</option>
              ))}
            </select>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as FoodCategory | "all")} className="h-11 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-600">
              <option value="all">{t("foods.categoryFilterAll")}</option>
              {(Object.entries(categoryLabels) as Array<[FoodCategory, string]>).map(([category, label]) => (
                <option key={category} value={category}>{label}</option>
              ))}
            </select>
            <select value={sort} onChange={(event) => setSort(event.target.value as EatenSort)} className="h-11 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-600">
              <option value="recent">{t("eaten.sortRecent")}</option>
              <option value="priceDesc">{t("eaten.sortPriceDesc")}</option>
              <option value="priceAsc">{t("eaten.sortPriceAsc")}</option>
            </select>
          </div>
        </details>

        <div className="space-y-7">
          {albumSections.map((section) => (
            <div key={section.id} className="space-y-3">
              {section.title ? (
                <div className="flex items-center justify-between gap-3">
                  <h3 className="line-clamp-2 text-sm font-black text-ink">{section.title}</h3>
                  <span className="shrink-0 text-[11px] font-black text-slate-400">{t("eaten.sectionCount", { total: section.total, count: section.records.length })}</span>
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 xl:grid-cols-4">
                {section.records.map((record) => (
                  <EatenAlbumCard key={`${section.id}-${record.key}-${record.log.eatenAt ?? "unknown"}`} record={record} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredEatenRecords.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center">
            <p className="text-sm font-black text-slate-500">{t("eaten.noFilterResults")}</p>
          </div>
        ) : null}
      </section>

      <EatenAreaProgress foods={foods} />

      <EatenGenreProgress foods={foods} />

      <p className="border-t border-slate-200 pt-4 text-[11px] font-bold leading-5 text-slate-400">
        {t("eaten.calcNote")}
      </p>
        </>
      )}
    </div>
  );
}

function NextWantCard({ food }: { food: FoodWithRelations }) {
  const { t } = useLocale();
  return (
    <Link href={`/foods/${food.id}`} className="group min-w-0 transition active:scale-[0.99]">
      <div className="aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-slate-100">
        <FoodImage food={food} alt={food.name} className="h-full w-full transition duration-300 group-hover:scale-105" />
      </div>
      <div className="mt-2 min-w-0">
        <p className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-ink">{food.name}</p>
        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px] font-black">
          <span className="text-park">{formatFoodPrice(food)}</span>
          <span className="line-clamp-1 text-slate-500">{getFoodAreaSummary(food)}</span>
        </div>
        <p className="mt-1 text-[11px] font-bold text-slate-400">{food.isLimited ? `${t("common.limited")} / ` : ""}{getSaleStatusLabel(food)}</p>
      </div>
    </Link>
  );
}

function buildEatenAlbumRecords(foods: FoodWithRelations[], canonicalFoods: FoodWithRelations[], logs: UserFoodLog[]): EatenAlbumRecord[] {
  const byCanonicalKey = new Map<string, EatenAlbumRecord>();
  for (const log of logs) {
    if (log.status !== "eaten") continue;
    const food = findLogFood(foods, canonicalFoods, log.foodId);
    if (!food) continue;
    const key = getCanonicalFoodKey(food);
    const existing = byCanonicalKey.get(key);
    if (!existing || compareByDate(log, existing.log) > 0) {
      byCanonicalKey.set(key, { key, food, log });
    }
  }
  return Array.from(byCanonicalKey.values()).sort((a, b) => compareByDate(b.log, a.log));
}

function EatenAlbumCard({ record }: { record: EatenAlbumRecord }) {
  const { t } = useLocale();
  const { food, log } = record;
  return (
    <Link
      href={`/foods/${food.id}`}
      className="group min-w-0 transition active:scale-[0.99]"
    >
      <div className="aspect-square overflow-hidden rounded-[1.2rem] bg-slate-100">
        {log.userPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={log.userPhotoUrl} alt={`${food.name}の食べた写真`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <FoodImage food={food} alt={food.name} className="h-full w-full transition duration-300 group-hover:scale-105" />
        )}
      </div>
      <div className="mt-2 min-w-0">
        <p className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-ink">{food.name}</p>
        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px] font-black">
          <span className="text-park">{formatFoodPrice(food)}</span>
          <span className="line-clamp-1 text-slate-500">{getFoodAreaSummary(food)}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] font-black text-slate-500">
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={12} aria-hidden />
            {formatDate(log.eatenAt, t("eaten.dateUnknown"))}
          </span>
          <span>{t("eaten.timesCount", { count: log.eatenCount ?? 1 })}</span>
        </div>
        {log.memo ? <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{log.memo}</p> : null}
      </div>
    </Link>
  );
}

function buildAlbumSections(records: EatenAlbumRecord[], mode: AlbumMode) {
  if (mode === "recent") {
    return [{ id: "recent", title: "", records: records.slice(0, 24), total: records.length }];
  }
  if (mode === "month") {
    const monthlyRecords = records.filter((record) => isCurrentMonth(record.log.eatenAt));
    return [{ id: "month", title: "", records: monthlyRecords.slice(0, 36), total: monthlyRecords.length }];
  }
  if (mode === "area") {
    const groups = new Map<string, EatenAlbumRecord[]>();
    for (const record of records) {
      const areaName = getFoodAreaNames(record.food)[0] ?? "場所確認中";
      groups.set(areaName, [...(groups.get(areaName) ?? []), record]);
    }
    return Array.from(groups.entries())
      .map(([areaName, items]) => ({ id: `area-${areaName}`, title: areaName, records: items.slice(0, 4), total: items.length }))
      .sort((a, b) => b.total - a.total || a.title.localeCompare(b.title, "ja"))
      .slice(0, 8);
  }
  if (mode === "genre") {
    const groups = new Map<string, EatenAlbumRecord[]>();
    for (const record of records) {
      const label = categoryLabels[record.food.category] ?? "カテゴリ確認中";
      groups.set(label, [...(groups.get(label) ?? []), record]);
    }
    return Array.from(groups.entries())
      .map(([label, items]) => ({ id: `genre-${label}`, title: label, records: items.slice(0, 4), total: items.length }))
      .sort((a, b) => b.total - a.total || a.title.localeCompare(b.title, "ja"))
      .slice(0, 8);
  }
  return [{ id: "all", title: "", records, total: records.length }];
}

function findLogFood(foods: FoodWithRelations[], canonicalFoods: FoodWithRelations[], foodId: string) {
  const exactFood = foods.find((food) => food.id === foodId);
  if (!exactFood) return undefined;
  const canonicalKey = getCanonicalFoodKey(exactFood);
  return canonicalFoods.find((food) => getCanonicalFoodKey(food) === canonicalKey) ?? exactFood;
}

function compareByDate(a: UserFoodLog, b: UserFoodLog) {
  return (a.eatenAt ?? "").localeCompare(b.eatenAt ?? "");
}

function getFoodPriceValue(food: FoodWithRelations) {
  return food.priceMin ?? food.price ?? food.locations?.find((location) => location.price)?.price ?? 0;
}

function isCurrentMonth(value?: string) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "numeric", timeZone: "Asia/Tokyo" });
  return formatter.format(date) === formatter.format(now);
}

function formatDate(value?: string, fallback = "日付未記録") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" }).format(date);
}
