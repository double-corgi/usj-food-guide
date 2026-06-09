"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { dedupeFoodsByCanonical, formatFoodPrice, getCanonicalFoodKey, getEatenCanonicalKeys, getSaleStatusLabel } from "@/lib/food-utils";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { FoodWithRelations } from "@/types/domain";
import { FoodImage } from "@/components/food-image";

export function AreaEatenFoods({ foods }: { foods: FoodWithRelations[] }) {
  const { logs } = useFoodLogs();
  const canonicalFoods = dedupeFoodsByCanonical(foods);
  const eatenKeys = getEatenCanonicalKeys(foods, logs);
  const eatenFoods = canonicalFoods
    .filter((food) => eatenKeys.has(getCanonicalFoodKey(food)))
    .map((food) => {
      const relatedLogs = logs.filter((log) => {
        const original = foods.find((candidate) => candidate.id === log.foodId);
        return log.status === "eaten" && (original ? getCanonicalFoodKey(original) === getCanonicalFoodKey(food) : log.foodId === food.id);
      });
      return {
        food,
        latestLog: relatedLogs.sort((a, b) => (b.eatenAt ?? "").localeCompare(a.eatenAt ?? ""))[0],
        count: relatedLogs.reduce((sum, log) => sum + (log.eatenCount ?? 1), 0)
      };
    })
    .sort((a, b) => (b.latestLog?.eatenAt ?? "").localeCompare(a.latestLog?.eatenAt ?? ""));

  return (
    <section id="area-eaten-foods" className="scroll-mt-24 rounded-[1.5rem] border border-park/15 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-park">Area Memory</p>
          <h2 className="mt-1 text-xl font-black text-ink">このエリアで食べたフード</h2>
        </div>
        <p className="rounded-full bg-mint px-3 py-1 text-xs font-black text-park">{eatenFoods.length}品</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {eatenFoods.slice(0, 8).map(({ food, latestLog, count }) => (
          <Link key={food.id} href={`/foods/${food.id}`} className="grid grid-cols-[82px_1fr] gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-2 transition active:scale-[0.99] hover:border-park/25 hover:bg-mint/50">
            <div className="h-[82px] overflow-hidden rounded-xl bg-white">
              <FoodImage food={food} className="h-full w-full" />
            </div>
            <div className="min-w-0 py-1">
              <div className="flex flex-wrap gap-1.5 text-[10px] font-black">
                <span className="rounded-full bg-white px-2 py-0.5 text-slate-500">{getSaleStatusLabel(food)}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-park">{count}回</span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm font-black leading-5 text-ink">{food.name}</p>
              <p className="mt-1 text-xs font-black text-park">{formatFoodPrice(food)}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                <CalendarDays size={12} aria-hidden />
                {formatDate(latestLog?.eatenAt)}
              </p>
            </div>
          </Link>
        ))}
        {eatenFoods.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500 md:col-span-2">
            このエリアの食べた記録はまだありません。
          </div>
        ) : null}
      </div>
    </section>
  );
}

function formatDate(value?: string) {
  if (!value) return "日付未記録";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", timeZone: "Asia/Tokyo" }).format(date);
}
