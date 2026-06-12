"use client";

import Link from "next/link";
import { LockKeyhole, Sparkles } from "lucide-react";
import {
  calculateArchiveRecordRate,
  calculateCompletion,
  dedupeFoodsByCanonical,
  formatFoodPrice,
  getCanonicalFoodKey,
  getEatenCanonicalKeys,
  getFoodAreaSummary,
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
  const eatenKeys = getEatenCanonicalKeys(foods, logs);
  const activeFoods = pickActiveCollectionFoods(foods);
  const eatenPreview = activeFoods.filter((food) => eatenKeys.has(getCanonicalFoodKey(food))).slice(0, 4);
  const nextPreview = activeFoods.filter((food) => !eatenKeys.has(getCanonicalFoodKey(food))).slice(0, Math.max(0, 4 - eatenPreview.length));
  const slotFoods = [...eatenPreview, ...nextPreview].slice(0, 4);
  const nextGoal = getNextGoal(completion.eaten, completion.total);

  return (
    <section className="pt-0">
      <div className="relative mx-auto max-w-[1120px] overflow-hidden rounded-[1.75rem] bg-[linear-gradient(135deg,#fffdf8_0%,#fff7e4_42%,#f7fbff_100%)] px-4 py-5 shadow-[0_18px_52px_rgba(7,27,58,0.10)] ring-1 ring-[#f1dba3]/70 sm:px-6 sm:py-7 lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.72fr)] lg:items-center lg:gap-8 lg:px-8 lg:py-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-[#0057b8]/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-[#fdbb30]/18 blur-3xl" aria-hidden />

        <div className="relative space-y-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[1rem] bg-[#071b3a] text-white shadow-[0_10px_28px_rgba(7,27,58,0.18)] ring-2 ring-[#fdbb30]/70">
              <Sparkles className="h-5 w-5 text-[#fdbb30]" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="text-[1.45rem] font-black leading-none tracking-[0.02em] text-[#071b3a] sm:text-[1.8rem]">
                <span className="relative inline-block">
                  {appBrand.shortName}
                  <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-[linear-gradient(90deg,#0057b8,#fdbb30)] opacity-80" aria-hidden />
                </span>
              </h1>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-500 sm:text-sm">{appBrand.tagline}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[13px] font-black text-[#0057b8]">現在販売中コレクション</p>
            <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
              <div>
                <p className="text-6xl font-black leading-none tracking-[-0.05em] text-[#071b3a] sm:text-7xl">{remaining}</p>
                <p className="mt-1 text-sm font-black text-[#8a6418]">残り品数</p>
              </div>
              <div className="pb-2">
                <p className="text-3xl font-black leading-none text-[#0057b8] sm:text-4xl">{completion.eaten} / {completion.total}</p>
                <p className="mt-1 text-sm font-black text-slate-500">達成率 {completion.rate}%</p>
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white shadow-inner ring-1 ring-[#d9e2ef]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#0057b8_0%,#0b6ed8_58%,#fdbb30_100%)] shadow-[0_0_20px_rgba(253,187,48,0.32)]"
                style={{ width: `${completion.rate}%` }}
              />
            </div>
            <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/78 px-3 py-2 text-xs font-black text-[#071b3a] ring-1 ring-[#f1dba3]">
              <span className="h-2 w-2 rounded-full bg-[#fdbb30]" aria-hidden />
              <span className="truncate">{nextGoal}</span>
            </div>
          </div>

          <p className="max-w-[34rem] whitespace-pre-line text-sm font-bold leading-7 text-slate-600 sm:text-[15px]">
            {"ユニバ（USJ）フードを写真で集めて、\n食べた記録をコレクションとして残せます。"}
          </p>
        </div>

        <div className="relative mt-6 lg:mt-0">
          <div className="rounded-[1.55rem] bg-white/82 p-3 shadow-[0_16px_42px_rgba(7,27,58,0.09)] ring-1 ring-white">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <p className="text-xs font-black text-[#071b3a]">コレクションブック</p>
              <p className="text-[11px] font-black text-slate-400">食べた記録で埋まる</p>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {slotFoods.map((food) => (
                <CollectionBookSlot key={food.id} food={food} unlocked={eatenKeys.has(getCanonicalFoodKey(food))} />
              ))}
              {Array.from({ length: Math.max(0, 8 - slotFoods.length) }).map((_, index) => (
                <LockedCollectionSlot key={`locked-${index}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeActiveFoodCollection({ foods }: { foods: FoodWithRelations[] }) {
  const activeFoods = pickActiveCollectionFoods(foods);
  if (activeFoods.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-ink">今集められるフード</h2>
        </div>
        <Link href="/foods" className="shrink-0 text-xs font-black text-park">すべて見る</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {activeFoods.map((food) => (
          <Link key={food.id} href={`/foods/${food.id}`} className="group min-w-0">
            <div className="aspect-[4/5] overflow-hidden rounded-[1.15rem] bg-slate-100 ring-1 ring-slate-200/60">
              <FoodImage food={food} className="h-full w-full transition duration-300 group-hover:scale-105" />
            </div>
            <div className="mt-2 space-y-1">
              <p className="line-clamp-2 min-h-9 text-xs font-black leading-[1.45] text-ink">{food.name}</p>
              <p className="text-[11px] font-black text-[#0057b8]">{formatFoodPrice(food)}</p>
              <p className="line-clamp-1 text-[11px] font-bold text-slate-500">{getFoodAreaSummary(food)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function HomeAnniversaryProgress({ foods }: { foods: FoodWithRelations[] }) {
  const { logs } = useFoodLogs();
  const eatenKeys = getEatenCanonicalKeys(foods, logs);
  const limitedFoods = pickLimitedCollectionFoods(foods);
  if (limitedFoods.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black tracking-[0.16em] text-sun">期間限定</p>
          <h2 className="mt-1 text-xl font-black text-ink">期間限定コレクション</h2>
          <p className="mt-1 text-xs font-bold text-slate-500">今だけのフードを控えめにまとめています。</p>
        </div>
        <Link href="/foods?sale=limited" className="shrink-0 rounded-full bg-ink px-4 py-2 text-xs font-black text-white active:scale-95">
          期間限定を見る
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {limitedFoods.map((food) => {
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

function CollectionBookSlot({ food, unlocked }: { food: FoodWithRelations; unlocked: boolean }) {
  return (
    <Link
      href={`/foods/${food.id}`}
      className={[
        "group relative aspect-square overflow-hidden rounded-[1rem] ring-1 transition active:scale-[0.98]",
        unlocked ? "bg-white ring-[#fdbb30]/60 shadow-[0_10px_24px_rgba(253,187,48,0.18)]" : "bg-[#edf3fb] ring-[#d9e2ef]"
      ].join(" ")}
    >
      <FoodImage food={food} className={["h-full w-full transition duration-300 group-hover:scale-105", unlocked ? "" : "opacity-45 grayscale-[0.25]"].join(" ")} />
      {!unlocked ? (
        <div className="absolute inset-0 grid place-items-center bg-[#071b3a]/18">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/82 text-[#071b3a] shadow-sm">
            <LockKeyhole className="h-4 w-4" aria-hidden />
          </span>
        </div>
      ) : null}
    </Link>
  );
}

function LockedCollectionSlot() {
  return (
    <div className="grid aspect-square place-items-center rounded-[1rem] bg-[linear-gradient(135deg,#f8fafc,#edf3fb)] ring-1 ring-dashed ring-[#cbd5e1]">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-white/85 text-[#94a3b8] shadow-sm">
        <LockKeyhole className="h-4 w-4" aria-hidden />
      </span>
    </div>
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

function pickActiveCollectionFoods(foods: FoodWithRelations[]) {
  return dedupeFoodsByCanonical(foods.filter(isCompletableFood))
    .sort((a, b) => scoreHomeFood(b) - scoreHomeFood(a) || a.name.localeCompare(b.name, "ja"))
    .slice(0, 6);
}

function pickLimitedCollectionFoods(foods: FoodWithRelations[]) {
  return dedupeFoodsByCanonical(
    foods.filter((food) => isCompletableFood(food) && (food.isLimited || food.rarity === "limited" || food.rarity === "event" || is25thFood(food)))
  )
    .sort((a, b) => scoreHomeFood(b) - scoreHomeFood(a) || a.name.localeCompare(b.name, "ja"))
    .slice(0, 8);
}

function getNextGoal(eaten: number, total: number) {
  if (total <= 0) return "販売中コレクションを確認中";
  const milestones = [5, 10, 25, 50, 100, 150, total].filter((value, index, array) => value <= total && array.indexOf(value) === index);
  const next = milestones.find((value) => value > eaten) ?? total;
  if (eaten >= total) return "販売中コレクションを達成済み";
  return `${next}品達成まであと${next - eaten}品`;
}

function scoreHomeFood(food: FoodWithRelations) {
  let score = 0;
  if (food.isLimited) score += 28;
  if (food.price ?? food.priceMin) score += 16;
  if (food.images?.length) score += 8;
  if (/チュリトス|ポップコーン|バーガー|ドリンク|スイーツ|ピザ|カフェ|アイス/i.test(food.name)) score += 10;
  return score;
}

function StatusMini({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex min-w-[132px] shrink-0 items-center justify-between gap-2 rounded-full bg-white/70 px-3 py-2 text-xs font-black text-slate-500 ring-1 ring-slate-200/60">
      {label}
      <strong className="text-ink">{value}</strong>
    </span>
  );
}
