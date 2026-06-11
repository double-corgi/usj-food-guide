"use client";

import Image from "next/image";
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
    <section className="pt-0">
      <div className="mx-auto grid max-w-[1120px] gap-5 lg:grid-cols-[minmax(0,1.24fr)_minmax(340px,0.76fr)] lg:items-center lg:gap-8">
        <div className="relative mx-auto w-full max-w-[980px] overflow-hidden rounded-[1.35rem] bg-[#f4c76d] shadow-[0_18px_54px_rgba(15,23,42,0.12)] ring-1 ring-white/80 sm:rounded-[1.75rem]">
          <Image
            src="/hero/unicole-firstview.png"
            alt=""
            width={1680}
            height={945}
            priority
            unoptimized
            className="animate-hero-globe-drift aspect-[16/9] h-auto w-full select-none object-contain"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.18),transparent_44%),linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(7,27,58,0.05)_100%)]"
            aria-hidden
          />
        </div>

        <div className="mx-auto max-w-[640px] space-y-5 text-center lg:mx-0 lg:max-w-none lg:text-left">
          <div className="mx-auto max-w-[560px] rounded-[1.55rem] bg-white/92 p-4 text-left shadow-[0_18px_52px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 sm:p-5">
            <div className="flex items-end justify-between gap-4">
              <div className="text-left">
                <p className="text-xs font-black text-slate-500">コレクション進捗</p>
                <p className="mt-1 text-4xl font-black tracking-tight text-[#071b3a] sm:text-5xl">{completion.eaten} / {completion.total}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black leading-none text-[#0057b8] sm:text-5xl">{completion.rate}%</p>
                <p className="mt-1 text-xs font-black text-slate-500">残り {remaining}品</p>
              </div>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#0057b8_0%,#0a6bdc_48%,#f6b73c_100%)] shadow-[0_0_18px_rgba(246,183,60,0.35)]"
                style={{ width: `${completion.rate}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-black text-slate-400">
              <span>食べた記録</span>
              <span>達成率</span>
              <span>残り</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex flex-col items-center lg:items-start">
              <h1 className="select-none text-[2rem] font-extrabold leading-none tracking-[-0.01em] text-[#071b3a] sm:text-[2.55rem] lg:text-[2.85rem]">
                {appBrand.shortName}
              </h1>
              <span className="mt-2 h-0.5 w-12 rounded-full bg-[linear-gradient(90deg,#0057b8,#c08a24,#f6b73c)] sm:w-16" aria-hidden />
            </div>
            <p className="text-sm font-black leading-6 text-slate-700 sm:text-base">{appBrand.tagline}</p>
            <p className="mx-auto max-w-md whitespace-pre-line text-sm font-bold leading-7 text-slate-500 lg:mx-0">
              {"ユニバ（USJ）フードを写真で集めて、\n食べた記録をコレクションとして残せます。"}
            </p>
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
