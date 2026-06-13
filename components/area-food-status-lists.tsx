"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  dedupeFoodsByCanonical,
  formatFoodPrice,
  getCanonicalFoodKey,
  getEatenCanonicalKeys,
  getSaleStatus,
  isCompletableFood
} from "@/lib/food-utils";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { FoodWithRelations } from "@/types/domain";
import { FoodImage } from "@/components/food-image";

export function AreaFoodStatusLists({ foods, areaId }: { foods: FoodWithRelations[]; areaId?: string }) {
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
    <div className="grid gap-10">
      <section id="area-missing-foods" className="scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-ink">残りのフード</h2>
          </div>
          {missingFoods.length > 0 ? <p className="rounded-full bg-[#fffaf5] px-3 py-1 text-xs font-black text-[#8a5b16] ring-1 ring-[#eadcc8]">あと{missingFoods.length}品</p> : null}
        </div>
        <FoodTileGrid foods={missingFoods.slice(0, 12)} empty="現在販売中の残り商品はありません。" />
        {missingFoods.length > 12 ? (
          <Link href={`/foods?${new URLSearchParams({ ...(areaId ? { area: areaId } : {}), sale: "active", sort: "uneaten" }).toString()}`} className="inline-flex text-sm font-black text-park">
            残りをすべて見る
          </Link>
        ) : null}
      </section>

      {endedFoods.length > 0 ? (
        <details className="border-y border-[#eadcc8] py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span className="text-lg font-black text-ink">販売終了フード</span>
            <span className="inline-flex items-center gap-2 text-xs font-black text-slate-500">
              {endedFoods.length}品
              <ChevronDown size={14} aria-hidden />
            </span>
          </summary>
          <div className="mt-4">
            <FoodTileGrid foods={endedFoods} empty="このエリアに販売終了フードはありません。" ended />
          </div>
        </details>
      ) : null}
    </div>
  );
}

function FoodTileGrid({ foods, empty, ended = false }: { foods: FoodWithRelations[]; empty: string; ended?: boolean }) {
  if (foods.length === 0) {
    return (
      <p className="text-sm font-bold leading-6 text-slate-500">
        {empty}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
      {foods.map((food) => (
        <Link key={food.id} href={`/foods/${food.id}`} className="group min-w-0 transition active:scale-[0.99]">
          <div className="aspect-square overflow-hidden rounded-[13px] bg-[#f1e4d2]">
            <FoodImage food={food} className="h-full w-full saturate-[0.88] brightness-[1.03] transition duration-300 group-hover:scale-[1.03]" />
          </div>
          <p className="mt-2 line-clamp-2 min-h-9 text-xs font-black leading-[1.45] text-ink">{food.name}</p>
          <p className="mt-1 text-[11px] font-bold text-slate-500">{ended ? "販売終了" : formatFoodPrice(food)}</p>
        </Link>
      ))}
    </div>
  );
}
