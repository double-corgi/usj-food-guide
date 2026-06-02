"use client";

import type { LucideIcon } from "lucide-react";
import { Sparkles, Star, Trophy, Utensils } from "lucide-react";
import { getFoodValueScore } from "@/lib/food-value-score";
import { calculateCompletion, isCompletableFood } from "@/lib/food-utils";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { FoodWithRelations } from "@/types/domain";
import { CompletionMeter } from "@/components/completion-meter";
import { FoodImage } from "@/components/food-image";

export function AreaCollectionSummary({ foods }: { foods: FoodWithRelations[] }) {
  const { logs } = useFoodLogs();
  const completion = calculateCompletion(foods, logs);
  const limited = foods.filter((food) => food.isLimited).length;
  const uneaten = Math.max(completion.total - completion.eaten, 0);
  const activeCount = foods.filter(isCompletableFood).length;
  const averageScore = foods.length
    ? Math.round(foods.reduce((sum, food) => sum + getFoodValueScore(food, foods).total, 0) / foods.length)
    : 0;
  const popularTop3 = [...foods]
    .sort((a, b) => getFoodValueScore(b, foods).total - getFoodValueScore(a, foods).total || a.name.localeCompare(b.name, "ja"))
    .slice(0, 3);
  const nextFood = foods
    .filter((food) => isCompletableFood(food) && !logs.some((log) => log.foodId === food.id && log.status === "eaten"))
    .sort((a, b) => Number(Boolean(b.isLimited || b.endDate)) - Number(Boolean(a.isLimited || a.endDate)) || (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0))[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
        <p className="text-sm font-black text-mint">{uneaten === 0 ? "エリアコンプ完了" : `このエリアの未食 ${uneaten}件`}</p>
        <div className="mt-3">
          <CompletionMeter label="エリアコンプ率" {...completion} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <AreaMiniStat icon={Utensils} label="販売中" value={activeCount} />
        <AreaMiniStat icon={Sparkles} label="限定" value={limited} />
        <AreaMiniStat icon={Star} label="平均攻略" value={averageScore} suffix="点" />
        <AreaMiniStat icon={Trophy} label="コンプ率" value={completion.rate} suffix="%" />
      </div>
      {popularTop3.length > 0 ? (
        <div className="lg:col-span-2 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
          <p className="text-xs font-black text-mint">人気TOP3</p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {popularTop3.map((food, index) => (
              <a key={food.id} href={`/foods/${food.id}`} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-white transition active:scale-[0.99]">
                <span className="mr-2 text-mint">#{index + 1}</span>
                <span className="line-clamp-1">{food.name}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}
      {nextFood ? (
        <a href={`/foods/${nextFood.id}`} className="lg:col-span-2 grid grid-cols-[88px_1fr] gap-3 rounded-2xl bg-white/10 p-3 text-white ring-1 ring-white/10 transition active:scale-[0.99]">
          <div className="h-[88px] overflow-hidden rounded-2xl bg-white/10">
            <FoodImage food={nextFood} className="h-full w-full" />
          </div>
          <div className="min-w-0 py-1">
            <p className="text-xs font-black text-mint">このエリアで次に食べるなら</p>
            <p className="mt-1 line-clamp-2 text-base font-black leading-5">{nextFood.name}</p>
            <p className="mt-1 text-sm font-black text-white/85">{nextFood.price ? `¥${nextFood.price.toLocaleString("ja-JP")}` : "価格未確認"}</p>
          </div>
        </a>
      ) : null}
    </div>
  );
}

function AreaMiniStat({ icon: Icon, label, value, suffix = "" }: { icon: LucideIcon; label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-lg bg-white/10 p-3 text-white">
      <Icon size={17} aria-hidden className="text-mint" />
      <p className="mt-2 text-[11px] font-bold text-slate-300">{label}</p>
      <p className="text-xl font-black">{value}{suffix}</p>
    </div>
  );
}
