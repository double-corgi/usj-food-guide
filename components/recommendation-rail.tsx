"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { categoryLabels } from "@/lib/constants";
import { formatFoodPrice, getFoodAreaSummary } from "@/lib/food-utils";
import { recommendNextFoods } from "@/lib/recommendations";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { FoodWithRelations } from "@/types/domain";
import { FoodImage } from "@/components/food-image";

export function RecommendationRail({
  foods,
  baseFood,
  areaId,
  title = "チェック候補",
  description = "残り・限定・近いジャンルから、候補を絞れます。"
}: {
  foods: FoodWithRelations[];
  baseFood?: FoodWithRelations;
  areaId?: string;
  title?: string;
  description?: string;
}) {
  const { logs } = useFoodLogs();
  const recommendations = recommendNextFoods(foods, logs, { baseFood, areaId, limit: 6 });
  if (recommendations.length === 0) return null;

  return (
    <section className="rounded-lg border border-berry/20 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-berry">
            <Sparkles size={17} aria-hidden />
              候補
          </p>
          <h2 className="mt-1 text-xl font-black text-ink">{title}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">{description}</p>
        </div>
        <Link href="/foods?sort=uneaten" className="inline-flex items-center gap-1 text-sm font-black text-park">
          もっと探す
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {recommendations.map(({ food, label }) => (
          <Link key={food.id} href={`/foods/${food.id}`} className="group grid grid-cols-[82px_1fr] gap-3 rounded-lg border border-slate-100 p-2 transition hover:border-mint hover:bg-mint/30">
            <div className="aspect-square overflow-hidden rounded-lg bg-slate-100">
              <FoodImage food={food} alt={food.name} className="h-full w-full transition group-hover:scale-105" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-berry/10 px-2 py-0.5 text-[11px] font-black text-berry">{label}</span>
                <span className="truncate text-[11px] font-black text-slate-400">{categoryLabels[food.category]}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm font-black leading-snug text-ink">{food.name}</p>
              <p className="mt-1 text-xs font-black text-park">{formatFoodPrice(food)}</p>
              <p className="mt-1 line-clamp-2 h-8 text-xs font-bold leading-4 text-slate-400">{getFoodAreaSummary(food)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
