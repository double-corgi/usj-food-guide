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

type EatenAlbumRecord = {
  key: string;
  food: FoodWithRelations;
  log: UserFoodLog;
};

type EatenSort = "recent" | "priceDesc" | "priceAsc";
type AlbumMode = "recent" | "month" | "area" | "genre" | "all";
type EatenTab = "eaten" | "want";

const albumModes: Array<{ id: AlbumMode; label: string; description: string }> = [
  { id: "recent", label: "最近", description: "新しい記録を24件まで" },
  { id: "month", label: "今月", description: "今月食べた記録" },
  { id: "area", label: "エリア別", description: "エリアごとに整理" },
  { id: "genre", label: "ジャンル別", description: "ジャンルごとに整理" },
  { id: "all", label: "全て", description: "すべての記録" }
];

export function EatenExperience({ foods }: { foods: FoodWithRelations[] }) {
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
        <p className="text-xs font-black tracking-[0.16em] text-park/70">記録アルバム</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-ink md:text-4xl">食べた記録</h1>
        <p className="max-w-2xl text-sm font-bold leading-6 text-slate-500">
          これまでに食べたUSJフードを、写真で振り返る。
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold leading-5 text-slate-400">
          <span>食べた {eatenRecords.length}品</span>
          <span>販売中コンプ {completion.rate}%</span>
          <span>図鑑 {archiveRecord.rate}%</span>
          <span>総額 {totalSpend ? `¥${totalSpend.toLocaleString("ja-JP")}` : "未記録"}</span>
        </p>
      </section>

      {hasWantedFoods ? (
        <div className="inline-grid grid-cols-2 rounded-full bg-slate-100 p-1 text-xs font-black text-slate-500">
          {[
            { id: "eaten" as const, label: "食べた" },
            { id: "want" as const, label: "次回食べたい" }
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
            <p className="text-xs font-black text-park">次回の候補</p>
            <h2 className="mt-1 text-2xl font-black text-ink">次回食べたい</h2>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-500">
              商品詳細のボタンから保存した、次の来園で食べたいフードです。
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
            <p className="text-xs font-black text-park">最近の記録</p>
            <h2 className="mt-1 text-2xl font-black text-ink">最近食べたもの</h2>
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
                    {formatDate(log.eatenAt)}
                  </span>
                  <span>{log.eatenCount ?? 1}回</span>
                </div>
                <p className="mt-1 line-clamp-2 min-h-10 text-sm font-black leading-5 text-ink">{food.name}</p>
                <p className="mt-1 text-xs font-black text-park">{formatFoodPrice(food)}</p>
              </div>
            </Link>
          ))}
          {recentLogs.length === 0 ? (
            <div className="w-full rounded-[1.35rem] border border-dashed border-slate-200 bg-white/70 p-6 text-center sm:col-span-3 lg:col-span-5">
              <p className="text-sm font-black text-slate-500">まだ食べた記録がありません。</p>
              <Link href="/foods" className="mt-3 inline-flex h-11 items-center justify-center rounded-full bg-park px-5 text-sm font-black text-white">
                最初の一品を探す
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black text-park">アルバム</p>
            <h2 className="mt-1 text-2xl font-black text-ink">食べた商品一覧</h2>
          </div>
          <p className="text-xs font-black text-slate-400">{displayedRecordCount} / {filteredEatenRecords.length}品</p>
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
                title={mode.description}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] font-bold leading-5 text-slate-400">
          {albumModes.find((mode) => mode.id === albumMode)?.description}
        </p>

        <details className="group">
          <summary className="inline-flex min-h-10 cursor-pointer list-none items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-slate-500 marker:hidden">
            表示を絞る
          </summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)} className="h-11 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-600">
              <option value="all">全エリア</option>
              {areaOptions.map((areaName) => (
                <option key={areaName} value={areaName}>{areaName}</option>
              ))}
            </select>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as FoodCategory | "all")} className="h-11 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-600">
              <option value="all">全ジャンル</option>
              {(Object.entries(categoryLabels) as Array<[FoodCategory, string]>).map(([category, label]) => (
                <option key={category} value={category}>{label}</option>
              ))}
            </select>
            <select value={sort} onChange={(event) => setSort(event.target.value as EatenSort)} className="h-11 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-600">
              <option value="recent">食べた日順</option>
              <option value="priceDesc">価格が高い順</option>
              <option value="priceAsc">価格が低い順</option>
            </select>
          </div>
        </details>

        <div className="space-y-7">
          {albumSections.map((section) => (
            <div key={section.id} className="space-y-3">
              {section.title ? (
                <div className="flex items-center justify-between gap-3">
                  <h3 className="line-clamp-2 text-sm font-black text-ink">{section.title}</h3>
                  <span className="shrink-0 text-[11px] font-black text-slate-400">{section.total}品中 {section.records.length}品</span>
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
            <p className="text-sm font-black text-slate-500">条件に合う食べた記録はありません。</p>
          </div>
        ) : null}
      </section>

      <EatenAreaProgress foods={foods} />

      <EatenGenreProgress foods={foods} />

      <p className="border-t border-slate-200 pt-4 text-[11px] font-bold leading-5 text-slate-400">
        集計の考え方: 現在販売中コンプ率は販売中の商品だけを母数にします。販売終了商品は図鑑全体の記録として残り、食べた履歴からは消えません。
      </p>
        </>
      )}
    </div>
  );
}

function NextWantCard({ food }: { food: FoodWithRelations }) {
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
        <p className="mt-1 text-[11px] font-bold text-slate-400">{food.isLimited ? "限定 / " : ""}{getSaleStatusLabel(food)}</p>
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
            {formatDate(log.eatenAt)}
          </span>
          <span>{log.eatenCount ?? 1}回</span>
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

function formatDate(value?: string) {
  if (!value) return "日付未記録";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" }).format(date);
}
