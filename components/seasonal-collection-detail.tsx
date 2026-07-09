"use client";

import Link from "next/link";
import { CalendarDays, CheckCircle2, MapPin, Search } from "lucide-react";
import { FoodCard } from "@/components/food-card";
import { getCanonicalFoodKey, getEatenCanonicalKeys } from "@/lib/food-utils";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { FoodCollection, FoodWithRelations } from "@/types/domain";

type SeasonalCollectionDetailProps = {
  collection: FoodCollection;
  foods: FoodWithRelations[];
  allFoods: FoodWithRelations[];
};

export function SeasonalCollectionDetail({ collection, foods, allFoods }: SeasonalCollectionDetailProps) {
  const { logs, ready, error, toggleEaten } = useFoodLogs();
  const collectionFoods = [...foods].sort(sortCollectionFood);
  const eatenKeys = getEatenCanonicalKeys(allFoods, logs);
  const eatenCount = ready ? collectionFoods.filter((food) => eatenKeys.has(getCanonicalFoodKey(food))).length : 0;
  const total = collectionFoods.length;
  const progress = total > 0 ? Math.round((eatenCount / total) * 100) : 0;
  const lastUpdated = getLastUpdatedLabel(collectionFoods);
  const period = formatCollectionPeriod(collection);

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-4 pb-24 pt-2 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[1.5rem] border border-[#eadcc8] bg-[#fffaf5] shadow-[0_18px_44px_rgba(15,23,42,0.08)]">
        <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f5f78]">2026 summer collection</p>
            <h1 className="mt-2 break-words text-[2rem] font-black leading-tight text-ink sm:text-5xl">
              2026年夏限定
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-slate-600">
              USJの2026年夏シーズンで確認済みの限定フード・ドリンクをまとめた非公式コレクションです。公開中の商品だけを掲載し、確認中の商品は管理画面で整備します。
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[#0f5f78] ring-1 ring-[#d9e8ef]">
                <CheckCircle2 size={14} aria-hidden />
                公開中 {total.toLocaleString("ja-JP")}件
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[#8a5b16] ring-1 ring-[#eadcc8]">
                <CalendarDays size={14} aria-hidden />
                {period}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-slate-600 ring-1 ring-slate-200">
                最終更新 {lastUpdated}
              </span>
            </div>
          </div>
          <div className="rounded-[1.25rem] border border-white/80 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-3 gap-2 text-center">
              <CollectionMetric label="食べた" value={`${eatenCount}`} />
              <CollectionMetric label="残り" value={`${Math.max(total - eatenCount, 0)}`} />
              <CollectionMetric label="達成率" value={`${progress}%`} />
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[#f5b841]" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
              食べた記録は既存の端末内ログを使います。Web、PWA、iOSでも同じfoodIdで扱えます。
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link href="/foods?collection=summer-2026" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-black text-white shadow-sm active:scale-[0.98]">
          <Search size={17} aria-hidden />
          夏商品だけ検索
        </Link>
        <Link href="/areas" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-ink active:scale-[0.98]">
          <MapPin size={17} aria-hidden />
          エリアから探す
        </Link>
        <Link href="/stores" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-ink active:scale-[0.98]">
          店舗から探す
        </Link>
      </section>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-800">
          食べた記録を読み込めませんでした。商品一覧はそのまま確認できます。
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-ink">掲載商品</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">
              approved商品のみ表示しています。確認中の商品は一般公開には含めません。
            </p>
          </div>
          <p className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#0f5f78] ring-1 ring-[#d9e8ef]">
            {total.toLocaleString("ja-JP")}件
          </p>
        </div>
        {collectionFoods.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-5">
            {collectionFoods.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                allFoods={allFoods}
                logs={logs}
                onToggleEaten={toggleEaten}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.35rem] border border-dashed border-slate-200 bg-white p-6 text-center shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            <p className="text-lg font-black text-ink">公開中の商品はまだありません</p>
            <p className="mt-2 text-sm font-bold text-slate-500">管理画面でapprovedになった商品だけがここに表示されます。</p>
          </div>
        )}
      </section>
    </div>
  );
}

function CollectionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#fffaf5] px-3 py-4">
      <p className="text-[11px] font-black text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-ink">{value}</p>
    </div>
  );
}

function sortCollectionFood(a: FoodWithRelations, b: FoodWithRelations) {
  return (b.lastCheckedAt || "").localeCompare(a.lastCheckedAt || "") || a.name.localeCompare(b.name, "ja");
}

function formatCollectionPeriod(collection: FoodCollection) {
  if (collection.startsOn && collection.endsOn) return `${formatDate(collection.startsOn)}〜${formatDate(collection.endsOn)}`;
  if (collection.startsOn) return `${formatDate(collection.startsOn)}〜`;
  return "2026年夏 / 商品ごとに確認";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric" }).format(date);
}

function getLastUpdatedLabel(foods: FoodWithRelations[]) {
  const latest = foods.map((food) => food.lastCheckedAt || food.updatedAt || food.createdAt).filter(Boolean).sort().at(-1);
  if (!latest) return "未確認";
  return formatDate(latest);
}
