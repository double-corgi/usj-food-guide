"use client";

import Link from "next/link";
import { Clock, Sparkles } from "lucide-react";
import { dedupeFoodsByCanonical, formatFoodPrice, getCanonicalFoodKey, getEatenCanonicalKeys, getRemainingDays, getSaleUrgencyLabel, isCompletableFood, isEndingSoon } from "@/lib/food-utils";
import { recommendNextFoods } from "@/lib/recommendations";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { FoodWithRelations } from "@/types/domain";
import { FoodImage } from "@/components/food-image";

export function EatenFoodRails({ foods }: { foods: FoodWithRelations[] }) {
  const { logs } = useFoodLogs();
  const canonicalFoods = dedupeFoodsByCanonical(foods);
  const eatenKeys = getEatenCanonicalKeys(foods, logs);
  const nextFoods = recommendNextFoods(canonicalFoods, logs, { limit: 5 }).map((item) => item.food);
  const endingSoonFoods = canonicalFoods
    .filter((food) => isCompletableFood(food) && isEndingSoon(food, 30) && !eatenKeys.has(getCanonicalFoodKey(food)))
    .sort((a, b) => (getRemainingDays(a) ?? Number.MAX_SAFE_INTEGER) - (getRemainingDays(b) ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name, "ja"))
    .slice(0, 5);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <FoodRailCard icon={Sparkles} title="次に食べるべき商品" foods={nextFoods} empty="候補はまだありません。" />
      <FoodRailCard icon={Clock} title="終了前に確認したい商品" foods={endingSoonFoods} empty="終了間近の未食商品はありません。" showRemaining />
    </div>
  );
}

function FoodRailCard({ icon: Icon, title, foods, empty, showRemaining = false }: { icon: typeof Sparkles; title: string; foods: FoodWithRelations[]; empty: string; showRemaining?: boolean }) {
  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_16px_42px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-mint text-park">
          <Icon size={17} aria-hidden />
        </span>
        <h2 className="text-lg font-black text-ink">{title}</h2>
      </div>
      <div className="mt-4 grid gap-2">
        {foods.map((food) => (
          <Link key={food.id} href={`/foods/${food.id}`} className="grid grid-cols-[64px_1fr] gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-2 transition active:scale-[0.99] hover:border-park hover:bg-mint/40">
            <div className="h-16 overflow-hidden rounded-xl bg-white">
              <FoodImage food={food} className="h-full w-full" />
            </div>
            <div className="min-w-0 py-1">
              <p className="line-clamp-2 text-sm font-black leading-5 text-ink">{food.name}</p>
              <p className="mt-1 text-xs font-black text-park">{formatFoodPrice(food)}</p>
              <p className="mt-0.5 text-[11px] font-bold text-slate-500">
                {showRemaining ? getSaleUrgencyLabel(food) ?? "終了間近" : food.isLimited ? "限定" : "未食候補"}
              </p>
            </div>
          </Link>
        ))}
        {foods.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500">
            {empty}
          </div>
        ) : null}
      </div>
    </section>
  );
}
