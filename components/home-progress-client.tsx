"use client";

import Link from "next/link";
import {
  calculateArchiveRecordRate,
  calculateCompletion,
  dedupeFoodsByCanonical,
  getCanonicalFoodKey,
  getEatenCanonicalKeys,
  getSaleStatusLabel,
  isCompletableFood
} from "@/lib/food-utils";
import { useFoodLogs } from "@/lib/use-food-logs";
import { FoodImage } from "@/components/food-image";
import { appBrand } from "@/lib/constants";
import type { FoodWithRelations } from "@/types/domain";

export function HomeHeaderStats({
  foods
}: {
  foods: FoodWithRelations[];
}) {
  const { logs } = useFoodLogs();
  const completion = calculateCompletion(foods, logs);
  const archive = calculateArchiveRecordRate(foods, logs);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <StatusMini label="現在販売中" value={`${completion.eaten}/${completion.total}`} />
      <StatusMini label="現在販売中コンプ率" value={`${completion.rate}%`} />
      <StatusMini label="図鑑コンプ率" value={`${archive.rate}%`} />
    </div>
  );
}

export function HomeCollectionHero({ foods }: { foods: FoodWithRelations[] }) {
  const { logs } = useFoodLogs();
  const completion = calculateCompletion(foods, logs);
  const remaining = Math.max(completion.total - completion.eaten, 0);
  const activeFoods = dedupeFoodsByCanonical(foods.filter(isCompletableFood));
  const visualFoods = pickHeroFoods(activeFoods);

  return (
    <section className="py-1">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.78fr)] lg:items-center lg:gap-10">
        <div className="relative">
          <div className="absolute -left-4 -top-4 h-24 w-24 rounded-full bg-[#f6b73c]/20 blur-2xl" aria-hidden />
          <div className="absolute -bottom-6 right-4 h-28 w-28 rounded-full bg-[#0057b8]/10 blur-2xl" aria-hidden />
          <div className="relative grid h-[250px] grid-cols-6 grid-rows-2 gap-2 sm:h-[340px] lg:h-[430px]">
            {visualFoods.map((food, index) => (
              <div
                key={food.id}
                className={`min-h-0 overflow-hidden bg-slate-100 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ${
                  index === 0
                    ? "col-span-4 row-span-2 rounded-[1.8rem]"
                    : index === 1
                      ? "col-span-2 rounded-[1.35rem]"
                      : index === 2
                        ? "col-span-2 rounded-[1.35rem]"
                        : "hidden"
                }`}
                aria-hidden="true"
              >
                <FoodImage food={food} eager={index === 0} className="h-full w-full" alt="" />
              </div>
            ))}
            {visualFoods.slice(3, 5).map((food, index) => (
              <div
                key={food.id}
                className={`absolute hidden h-28 w-28 overflow-hidden rounded-[1.4rem] bg-slate-100 shadow-[0_16px_38px_rgba(15,23,42,0.14)] ring-4 ring-white sm:block lg:h-36 lg:w-36 ${
                  index === 0 ? "-bottom-5 left-8" : "-right-3 top-1/2"
                }`}
                aria-hidden="true"
              >
                <FoodImage food={food} className="h-full w-full" alt="" />
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-[520px] space-y-5 text-center lg:text-left">
          <div className="space-y-3">
            <p className="text-[11px] font-black tracking-[0.18em] text-[#0057b8]">{appBrand.name}</p>
            <h1 className="text-5xl font-black tracking-tight text-ink sm:text-6xl lg:text-7xl">{appBrand.shortName}</h1>
            <p className="text-base font-black leading-7 text-slate-700 sm:text-lg">{appBrand.tagline}</p>
            <p className="mx-auto max-w-md text-sm font-bold leading-6 text-slate-500 lg:mx-0">
              ユニバ（USJ）フードを写真で集めて、食べた記録をコレクションとして残せます。
            </p>
          </div>

          <div className="rounded-[1.6rem] bg-white/88 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
            <div className="flex items-end justify-between gap-4">
              <div className="text-left">
                <p className="text-xs font-black text-slate-500">コレクション進捗</p>
                <p className="mt-1 text-3xl font-black tracking-tight text-ink">{completion.eaten} / {completion.total}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black leading-none text-[#0057b8]">{completion.rate}%</p>
                <p className="mt-1 text-xs font-black text-slate-500">残り {remaining}品</p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#0057b8,#f6b73c)]"
                style={{ width: `${completion.rate}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-black text-slate-400">
              <span>食べた記録</span>
              <span>達成率</span>
              <span>残り</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeAnniversaryProgress({ foods }: { foods: FoodWithRelations[] }) {
  const { logs } = useFoodLogs();
  const eatenKeys = getEatenCanonicalKeys(foods, logs);
  const anniversaryFoods = dedupeFoodsByCanonical(foods.filter((food) => isCompletableFood(food) && is25thFood(food)));
  if (anniversaryFoods.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black tracking-[0.16em] text-sun">25thコレクション</p>
          <h2 className="mt-1 text-xl font-black text-ink">25thアニバーサリー</h2>
        </div>
        <Link href="/foods?q=25%E5%91%A8%E5%B9%B4" className="shrink-0 rounded-full bg-ink px-4 py-2 text-xs font-black text-white active:scale-95">
          25th商品を見る
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {anniversaryFoods.map((food) => {
          const eaten = eatenKeys.has(getCanonicalFoodKey(food));
          return (
            <Link
              key={food.id}
              href={`/foods/${food.id}`}
              className="w-[158px] shrink-0 transition active:scale-[0.99] md:hover:-translate-y-0.5"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-slate-100">
                <FoodImage food={food} className="h-full w-full" />
              </div>
              <div className="mt-2 space-y-1">
                <p className="line-clamp-2 min-h-9 text-xs font-black leading-[1.45] text-ink">{food.name}</p>
                <p className="text-[11px] font-black text-slate-500">{eaten ? "食べた" : "残り"} / {getSaleStatusLabel(food)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function HomeProgressStatusClient({ foodIds, total, archiveTotal }: { foodIds: string[]; total: number; archiveTotal?: number }) {
  const { logs } = useFoodLogs();
  const eatenCount = logs.filter((log) => foodIds.includes(log.foodId) && log.status === "eaten").length;
  const completionRate = total ? Math.round((eatenCount / total) * 100) : 0;
  const remainingCount = Math.max(total - eatenCount, 0);

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 px-3 py-2.5 shadow-[0_10px_28px_rgba(31,41,55,0.06)]">
      <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <StatusMini label="販売中GET" value={`${eatenCount}/${total}件`} />
        <StatusMini label="現在コンプ" value={`${completionRate}%`} />
        <StatusMini label="残り" value={`${remainingCount}件`} />
        {archiveTotal ? <StatusMini label="図鑑総数" value={`${archiveTotal}件`} /> : null}
      </div>
    </section>
  );
}

function is25thFood(food: FoodWithRelations) {
  const explicitText = [
    food.name,
    food.eventName,
    food.collaborationName,
    food.description,
    food.salePeriodLabel,
    food.releasePeriod,
    food.seasonalVersion
  ].filter(Boolean).join(" ");
  if (/25th|25周年/.test(explicitText)) return true;
  if (/アニバーサリー/.test(food.name) && /25周年|25th/i.test([food.description, food.eventName, food.collaborationName].filter(Boolean).join(" "))) return true;

  const evidenceText = [
    food.sourceUrl,
    food.officialUrl,
    ...(food.sourceNames ?? []),
    ...(food.images ?? []).flatMap((image) => [image.imageUrl, image.altText, image.imageSourceContext, image.sourceUrl])
  ].filter(Boolean).join(" ");
  return /25th-anniversary|25th|25周年/i.test(evidenceText) && !/5th-anniversary/i.test(evidenceText);
}

function pickHeroFoods(foods: FoodWithRelations[]) {
  const preferredCategories = ["churro", "burger", "popcorn", "drink", "dessert"] as const;
  const picks: FoodWithRelations[] = [];
  const usedKeys = new Set<string>();

  for (const category of preferredCategories) {
    const found = foods.find((food) => food.category === category && !usedKeys.has(getCanonicalFoodKey(food)));
    if (found) {
      picks.push(found);
      usedKeys.add(getCanonicalFoodKey(found));
    }
  }

  for (const food of foods) {
    const key = getCanonicalFoodKey(food);
    if (usedKeys.has(key)) continue;
    picks.push(food);
    usedKeys.add(key);
    if (picks.length >= 5) break;
  }

  return picks.slice(0, 5);
}

function StatusMini({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex min-w-[132px] shrink-0 items-center justify-between gap-2 rounded-full bg-white/70 px-3 py-2 text-xs font-black text-slate-500 ring-1 ring-slate-200/60">
      {label}
      <strong className="text-ink">{value}</strong>
    </span>
  );
}
