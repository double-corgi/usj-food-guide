"use client";

import Link from "next/link";
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

  return (
    <section className="relative isolate overflow-hidden rounded-[1.75rem] px-5 py-6 text-center sm:px-8 sm:py-8 lg:px-12 lg:py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_18%,rgba(253,187,48,0.24),transparent_31%),radial-gradient(circle_at_86%_12%,rgba(0,87,184,0.15),transparent_30%),linear-gradient(135deg,#fffdf8_0%,#f7fbff_46%,#fff7e1_100%)]" aria-hidden />
      <div className="pointer-events-none absolute -left-20 top-4 -z-10 h-56 w-56 rounded-full border border-[#0057b8]/12" aria-hidden />
      <div className="pointer-events-none absolute -right-16 bottom-4 -z-10 h-64 w-64 rounded-full border border-[#fdbb30]/24" aria-hidden />
      <div className="animate-home-light-sweep pointer-events-none absolute inset-y-0 left-[-32%] -z-10 w-1/2 rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.56),transparent)]" aria-hidden />

      <div className="mx-auto max-w-[980px] space-y-5">
        <div className="space-y-2">
          <div className="inline-flex flex-col items-center">
            <h1 className="home-unicole-logo select-none text-[2rem] font-black leading-none tracking-[0.02em] text-[#071b3a] sm:text-[2.35rem] lg:text-[2.55rem]">
              {appBrand.shortName}
            </h1>
            <span className="mt-2 h-[3px] w-16 rounded-full bg-[linear-gradient(90deg,#0057b8_0%,#fdbb30_58%,#8a5b16_100%)]" aria-hidden />
          </div>
          <p className="text-[0.95rem] font-black leading-7 text-[#10233f]">{appBrand.tagline}</p>
          <p className="mx-auto max-w-[31rem] whitespace-pre-line text-sm font-bold leading-7 text-slate-500 sm:text-[0.95rem]">
            {"ユニバ（USJ）フードを写真で集めて、\n食べた記録をコレクションとして残せます。"}
          </p>
        </div>

        <div className="mx-auto max-w-[760px] pt-1 text-left">
          <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-3">
            <div>
              <p className="text-xs font-black tracking-[0.14em] text-[#0057b8]">コレクション数</p>
              <p className="animate-home-stat-pop mt-1 text-[3.65rem] font-black leading-none tracking-[-0.05em] text-[#071b3a] sm:text-[5rem]">
                {completion.eaten}
                <span className="mx-1 text-[0.54em] text-slate-400">/</span>
                <span>{completion.total}</span>
              </p>
            </div>
            <div className="animate-home-stat-pop text-right [animation-delay:120ms]">
              <p className="text-[3.75rem] font-black leading-none tracking-[-0.05em] text-[#0057b8] sm:text-[5.1rem]">{completion.rate}%</p>
              <p className="mt-1 text-sm font-black text-[#8a5b16]">残り {remaining}品</p>
            </div>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#dfe5ee] shadow-inner">
            <div
              className="animate-home-progress-fill h-full rounded-full bg-[linear-gradient(90deg,#0057b8_0%,#0776df_46%,#fdbb30_100%)] shadow-[0_0_22px_rgba(253,187,48,0.42)]"
              style={{ width: `${Math.max(completion.rate, completion.eaten > 0 ? 2 : 0)}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-black text-slate-400">
            <span>食べた記録</span>
            <span>達成率</span>
            <span>残り</span>
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
          <p className="text-[11px] font-black tracking-[0.16em] text-[#0057b8]">販売中フード</p>
          <h2 className="mt-1 text-xl font-black text-ink">今集められるフード</h2>
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

function pickActiveCollectionFoods(foods: FoodWithRelations[]) {
  return dedupeFoodsByCanonical(foods.filter(isCompletableFood))
    .sort((a, b) => scoreHomeFood(b) - scoreHomeFood(a) || a.name.localeCompare(b.name, "ja"))
    .slice(0, 6);
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
