"use client";

import { dedupeFoodsByCanonical, getCanonicalFoodKey, getEatenCanonicalKeys, isCompletableFood } from "@/lib/food-utils";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { FoodWithRelations } from "@/types/domain";

export function AreaCollectionSummary({ foods, allFoods = foods }: { foods: FoodWithRelations[]; allFoods?: FoodWithRelations[] }) {
  const { logs } = useFoodLogs();
  const canonicalFoods = dedupeFoodsByCanonical(foods);
  const eatenCanonicalKeys = getEatenCanonicalKeys(allFoods, logs);
  const activeFoods = canonicalFoods.filter(isCompletableFood);
  const activeEaten = activeFoods.filter((food) => eatenCanonicalKeys.has(getCanonicalFoodKey(food))).length;
  const completion = {
    total: activeFoods.length,
    eaten: activeEaten,
    rate: activeFoods.length === 0 ? 0 : Math.round((activeEaten / activeFoods.length) * 100)
  };
  const limited = canonicalFoods.filter((food) => food.isLimited).length;
  const uneaten = Math.max(completion.total - completion.eaten, 0);

  return (
    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black text-white/60">未食</p>
          <p className="mt-1 text-3xl font-black leading-none text-white">{uneaten}品</p>
        </div>
        <p className="shrink-0 text-right text-sm font-black text-white/85">
          {completion.eaten} / {completion.total}
          <span className="block text-[11px] text-white/55">コンプ率 {completion.rate}%</span>
        </p>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/12">
        <div className="h-full rounded-full bg-mint" style={{ width: `${completion.rate}%` }} />
      </div>
      <p className="mt-3 text-xs font-bold text-white/60">限定 {limited}品</p>
    </div>
  );
}
