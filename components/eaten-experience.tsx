"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { categoryLabels } from "@/lib/constants";
import { calculateAreaProgressList } from "@/lib/area-progress";
import { calculateArchiveRecordRate, calculateCompletion, dedupeFoodsByCanonical, formatFoodPrice, getCanonicalFoodKey, getFoodAreaNames, getFoodAreaSummary } from "@/lib/food-utils";
import { tAreaName } from "@/lib/i18n/area-name";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { getFoodNameI18n } from "@/lib/i18n/name-translations";
import { useFoodLogs } from "@/lib/use-food-logs";
import { useNextWantFoods } from "@/lib/use-next-want-foods";
import type { FoodCategory, FoodWithRelations, UserFoodLog } from "@/types/domain";
import { FoodImage } from "@/components/food-image";
import { EatenGenreProgress } from "@/components/eaten-genre-progress";
import { useLocale } from "@/lib/i18n/use-locale";

type EatenAlbumRecord = {
  key: string;
  food: FoodWithRelations;
  log: UserFoodLog;
};

type AlbumMode = "recent" | "month" | "area" | "genre" | "all";
type EatenTab = "eaten" | "want";

export function EatenExperience({ foods }: { foods: FoodWithRelations[] }) {
  const { t } = useLocale();
  const { logs } = useFoodLogs();
  const { wantedFoods } = useNextWantFoods(foods);
  const [activeTab, setActiveTab] = useState<EatenTab>("eaten");
  const [areaFilter, setAreaFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<FoodCategory | "all">("all");
  const completion = calculateCompletion(foods, logs);
  const archiveRecord = calculateArchiveRecordRate(foods, logs);
  const areaProgress = useMemo(() => {
    return calculateAreaProgressList(foods, logs).sort(
      (a, b) => b.active.rate - a.active.rate || b.active.total - a.active.total || a.area.name.localeCompare(b.area.name, "ja")
    );
  }, [foods, logs]);
  const canonicalFoods = dedupeFoodsByCanonical(foods);
  const eatenRecords = useMemo(() => buildEatenAlbumRecords(foods, canonicalFoods, logs), [canonicalFoods, foods, logs]);
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
      .sort((a, b) => compareByDate(b.log, a.log));
  }, [areaFilter, categoryFilter, eatenRecords]);
  const albumSections = useMemo(() => buildAlbumSections(filteredEatenRecords, "all", t), [filteredEatenRecords, t]);
  const displayedRecordCount = albumSections.reduce((sum, section) => sum + section.records.length, 0);
  const totalSpend = logs
    .filter((log) => log.status === "eaten")
    .reduce((sum, log) => {
      if (typeof log.spentAmount === "number") return sum + log.spentAmount;
      const food = foods.find((item) => item.id === log.foodId);
      return sum + (food?.priceMin ?? food?.price ?? 0) * (log.eatenCount ?? 1);
    }, 0);
  return (
    <div className="space-y-8">
      <section className="space-y-2 py-1">
        <p className="text-xs font-black tracking-[0.16em] text-park/70">{t("eaten.kicker")}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink md:text-4xl">{t("eaten.title")}</h1>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold leading-5 text-slate-400">
          <span>{t("eaten.eatenCount", { count: eatenRecords.length })}</span>
          <span>{t("eaten.activeCompletion", { rate: completion.rate })}</span>
          <span>{t("eaten.archiveRecord", { rate: archiveRecord.rate })}</span>
          <span>{t("eaten.totalSpend")} {totalSpend ? `¥${totalSpend.toLocaleString("ja-JP")}` : t("eaten.noRecordValue")}</span>
        </p>
      </section>

      <div className="inline-grid grid-cols-2 rounded-full bg-slate-100 p-1 text-xs font-black text-slate-500">
        {[
          { id: "eaten" as const, label: t("common.eaten") },
          { id: "want" as const, label: t("foodDetail.wantNext") }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-9 rounded-full px-4 transition active:scale-[0.98] ${activeTab === tab.id ? "bg-white text-ink shadow-sm" : "hover:text-ink"}`}
            aria-pressed={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "want" ? (
        <section className="space-y-4">
          <p className="text-xs font-black text-slate-400">{t("eaten.albumCount", { shown: wantedFoods.length, total: wantedFoods.length })}</p>
          {wantedFoods.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
              {wantedFoods.map((food) => (
                <NextWantCard key={food.id} food={food} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center">
              <p className="text-sm font-black text-slate-500">{t("foods.noResultsInline")}</p>
            </div>
          )}
        </section>
      ) : (
        <>
      <section className="space-y-4">
        <p className="text-xs font-black text-slate-400">{t("eaten.albumCount", { shown: displayedRecordCount, total: filteredEatenRecords.length })}</p>

        <details className="group">
          <summary className="inline-flex min-h-10 cursor-pointer list-none items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-slate-500 marker:hidden">
            {t("eaten.filterToggle")}
          </summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)} className="h-11 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-600">
              <option value="all">{t("foods.areaFilterAll")}</option>
              {areaOptions.map((areaName) => (
                <option key={areaName} value={areaName}>{tAreaName(areaName, t)}</option>
              ))}
            </select>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as FoodCategory | "all")} className="h-11 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-600">
              <option value="all">{t("foods.categoryFilterAll")}</option>
              {(Object.keys(categoryLabels) as FoodCategory[]).map((category) => (
                <option key={category} value={category}>{t(`category.${category}` as TranslationKey)}</option>
              ))}
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
              <div className="grid grid-cols-5 gap-0.5 md:grid-cols-8 lg:grid-cols-10">
                {section.records.map((record) => (
                  <CollectionThumb key={`${section.id}-${record.key}-${record.log.eatenAt ?? "unknown"}`} record={record} />
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

      <section className="space-y-3 border-t border-slate-200 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black text-park">{t("eaten.areaProgress.kicker")}</p>
            <h2 className="mt-1 text-xl font-black text-ink">{t("eaten.areaProgress.title")}</h2>
          </div>
          <p className="text-xs font-black text-slate-400">{t("eaten.areaProgress.areaCount", { count: areaProgress.length })}</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
          {areaProgress.map((progress) => (
            <article key={progress.area.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 min-w-0 text-xs font-black leading-4 text-ink">{tAreaName(progress.area.name, t)}</h3>
                <p className="shrink-0 text-base font-black leading-none text-park">{progress.active.rate}%</p>
              </div>
              <div className="mt-2 text-[11px] font-black text-slate-500">
                <span>{progress.active.eaten} / {progress.active.total}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#0057b8,#fdbb30)]"
                  style={{ width: `${progress.active.rate}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

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
  const { locale } = useLocale();
  const displayName = getFoodNameI18n(food.id, locale, food.name);
  return (
    <Link href={`/foods/${food.id}`} className="group min-w-0 transition active:scale-[0.99]">
      <div className="aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <FoodImage food={food} alt={displayName} className="h-full w-full transition duration-300 group-hover:scale-105" variant="contain" />
      </div>
      <div className="mt-1.5 min-w-0">
        <p className="line-clamp-2 min-h-8 text-xs font-black leading-4 text-ink">{displayName}</p>
        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] font-black">
          <span className="text-park">{formatFoodPrice(food)}</span>
          <span className="line-clamp-1 text-slate-500">{getFoodAreaSummary(food)}</span>
        </div>
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
  const { locale, t } = useLocale();
  const { food, log } = record;
  const displayName = getFoodNameI18n(food.id, locale, food.name);
  return (
    <Link
      href={`/foods/${food.id}`}
      className="group min-w-0 transition active:scale-[0.99]"
    >
      <div className="aspect-square overflow-hidden rounded-[1.2rem] bg-slate-100">
        {log.userPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={log.userPhotoUrl} alt={displayName} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <FoodImage food={food} alt={displayName} className="h-full w-full transition duration-300 group-hover:scale-105" />
        )}
      </div>
      <div className="mt-2 min-w-0">
        <p className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-ink">{displayName}</p>
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

function CollectionThumb({ record }: { record: EatenAlbumRecord }) {
  const { locale } = useLocale();
  const { food } = record;
  const displayName = getFoodNameI18n(food.id, locale, food.name);
  return (
    <Link
      href={`/foods/${food.id}`}
      aria-label={displayName}
      className="group min-w-0 transition active:scale-95"
    >
      <div className="relative aspect-square overflow-hidden rounded-[0.45rem] border border-slate-200/60 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-opacity group-active:opacity-80">
        <FoodImage food={food} alt={displayName} className="h-full w-full transition duration-300 group-hover:scale-105" />
      </div>
    </Link>
  );
}

function buildAlbumSections(records: EatenAlbumRecord[], mode: AlbumMode, t: (key: TranslationKey) => string) {
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
      .map(([areaName, items]) => ({ id: `area-${areaName}`, title: tAreaName(areaName, t), records: items.slice(0, 20), total: items.length }))
      .sort((a, b) => b.total - a.total || a.title.localeCompare(b.title, "ja"))
      .slice(0, 8);
  }
  if (mode === "genre") {
    const groups = new Map<FoodCategory, EatenAlbumRecord[]>();
    for (const record of records) {
      const category = record.food.category;
      groups.set(category, [...(groups.get(category) ?? []), record]);
    }
    return Array.from(groups.entries())
      .map(([category, items]) => ({ id: `genre-${category}`, title: t(`category.${category}` as TranslationKey), records: items.slice(0, 20), total: items.length }))
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
