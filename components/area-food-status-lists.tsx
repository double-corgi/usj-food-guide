"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  dedupeFoodsByCanonical,
  formatFoodPrice,
  getCanonicalFoodKey,
  getEatenCanonicalKeys,
  getFoodAreaSummary,
  getSaleStatus,
  getSaleStatusLabel,
  isCompletableFood
} from "@/lib/food-utils";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { FoodWithRelations } from "@/types/domain";
import { FoodImage } from "@/components/food-image";

export function AreaFoodStatusLists({ foods }: { foods: FoodWithRelations[] }) {
  const { logs } = useFoodLogs();
  const canonicalFoods = dedupeFoodsByCanonical(foods);
  const eatenKeys = getEatenCanonicalKeys(foods, logs);
  const missingFoods = canonicalFoods
    .filter((food) => isCompletableFood(food) && !eatenKeys.has(getCanonicalFoodKey(food)))
    .sort((a, b) => Number(Boolean(b.isLimited || b.endDate)) - Number(Boolean(a.isLimited || a.endDate)) || a.name.localeCompare(b.name, "ja"));
  const endedFoods = canonicalFoods
    .filter((food) => getSaleStatus(food) === "ended")
    .sort((a, b) => (b.saleEndDate ?? b.endDate ?? "").localeCompare(a.saleEndDate ?? a.endDate ?? "") || a.name.localeCompare(b.name, "ja"));

  return (
    <div className="grid gap-4">
      <section id="area-missing-foods" className="scroll-mt-24 rounded-[1.5rem] border border-amber-100 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Missing Foods</p>
            <h2 className="mt-1 text-xl font-black text-ink">このエリアの未食フード</h2>
          </div>
          <p className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">{missingFoods.length}品</p>
        </div>
        <FoodList foods={missingFoods.slice(0, 12)} empty="現在販売中の未食商品はありません。" />
        {missingFoods.length > 12 ? (
          <Link href="/foods?sort=uneaten&sale=active" className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-ink px-4 text-xs font-black text-white">
            さらに未食を探す
          </Link>
        ) : null}
      </section>

      <details className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-soft">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <span>
            <span className="block text-xs font-black uppercase tracking-[0.2em] text-slate-500">Archive Foods</span>
            <span className="mt-1 block text-xl font-black text-ink">販売終了フード一覧</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
            {endedFoods.length}品
            <ChevronDown size={14} aria-hidden />
          </span>
        </summary>
        <div className="mt-4">
          <FoodList foods={endedFoods} empty="このエリアに販売終了フードはありません。" />
        </div>
      </details>
    </div>
  );
}

function FoodList({ foods, empty }: { foods: FoodWithRelations[]; empty: string }) {
  if (foods.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500">
        {empty}
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {foods.map((food) => (
        <Link key={food.id} href={`/foods/${food.id}`} className="grid grid-cols-[82px_1fr] gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-2 transition active:scale-[0.99] hover:border-park hover:bg-mint/40">
          <div className="h-[82px] overflow-hidden rounded-xl bg-white">
            <FoodImage food={food} className="h-full w-full" />
          </div>
          <div className="min-w-0 py-1">
            <div className="flex flex-wrap gap-1.5 text-[10px] font-black">
              <span className="rounded-full bg-white px-2 py-0.5 text-slate-500">{getSaleStatusLabel(food)}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-park">{formatFoodPrice(food)}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm font-black leading-5 text-ink">{food.name}</p>
            <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-4 text-slate-500">{getFoodAreaSummary(food)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
