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
  const nextGoal = getNextGoal(completion.eaten, completion.total);
  const previewFoods = pickActiveCollectionFoods(foods).slice(0, 4);

  return (
    <section className="pt-1">
      <div className="relative mx-auto max-w-[980px] overflow-hidden rounded-[1.55rem] bg-[#fff7e8] px-4 py-4 ring-1 ring-[#efd9a9] sm:rounded-[2rem] sm:px-7 sm:py-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#0057b8]/10 blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-[#fdbb30]/25 blur-3xl" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.34] [background-image:radial-gradient(#f0c465_1px,transparent_1px)] [background-size:18px_18px]"
          aria-hidden
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl bg-[#0057b8] shadow-[inset_0_0_0_2px_rgba(253,187,48,0.62)] ring-1 ring-[#d8b56d]/50" aria-hidden="true">
                <div className="absolute inset-[7px] rounded-full border border-white/75" />
                <div className="absolute left-[13px] top-[9px] h-[22px] w-[4px] rotate-[-24deg] rounded-full bg-white shadow-[0_0_0_1px_rgba(253,187,48,0.35)]" />
                <div className="absolute right-[13px] top-[9px] h-[22px] w-[4px] rotate-[24deg] rounded-full bg-white shadow-[0_0_0_1px_rgba(253,187,48,0.35)]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-[1.35rem] font-semibold leading-[1.2] tracking-[0.02em] text-[#071b3a] sm:text-[1.55rem]">{appBrand.shortName}</h1>
                <p className="mt-0.5 text-xs font-semibold leading-[1.7] text-[#7b6a44] sm:text-sm">食べた記録が、そのままコレクションになる。</p>
              </div>
            </div>
            <div className="hidden shrink-0 rounded-full border border-[#d8b56d]/70 bg-white/70 px-3 py-1 text-xs font-semibold text-[#8a6418] sm:block">
              図鑑ホーム
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold leading-[1.8] text-[#6f7f96]">現在販売中コレクション</p>
              <div className="mt-1 flex items-end gap-2">
                <span className="pb-3 text-lg font-semibold leading-none text-[#071b3a]">残り</span>
                <strong className="text-[4.9rem] font-semibold leading-none tracking-[-0.07em] text-[#071b3a] sm:text-[6.4rem]">{remaining}</strong>
                <span className="pb-3 text-lg font-semibold leading-none text-[#071b3a]">品</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <p className="text-base font-semibold leading-[1.6] text-[#071b3a]">
                  {completion.eaten}<span className="mx-1 text-[#a3a3a3]">/</span>{completion.total}
                </p>
                <p className="text-base font-semibold leading-[1.6] text-[#0057b8]">達成率 {completion.rate}%</p>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/70 ring-1 ring-[#ead9b2]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#0057b8_0%,#1b74d8_55%,#fdbb30_100%)] shadow-[0_0_16px_rgba(253,187,48,0.24)]"
                  style={{ width: `${completion.rate}%` }}
                />
              </div>
              <div className="mt-3 inline-flex rounded-full bg-[#071b3a] px-4 py-2 text-sm font-semibold leading-[1.6] text-white shadow-[0_10px_26px_rgba(7,27,58,0.16)]">
                {nextGoal}
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-white/70 bg-white/65 p-3 backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold leading-[1.7] text-[#7b6a44]">今開けられるコレクション</p>
                <p className="text-xs font-semibold leading-[1.7] text-[#0057b8]">{previewFoods.length}品</p>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {previewFoods.map((food, index) => (
                  <CollectionSlot key={food.id} food={food} index={index} />
                ))}
                <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-[#d7c6a1] bg-[#fffaf0]/80 text-lg font-semibold text-[#b8953c]">
                  ?
                </div>
              </div>
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
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[1.55rem] font-semibold leading-[1.7] tracking-[0.02em] text-[#1b1b1b] sm:text-[1.875rem] sm:leading-[1.8]">今集められるフード</h2>
          <p className="text-base font-medium leading-[2] text-[#64748b]">販売中のフードから、写真でコレクションを選べます。</p>
        </div>
        <Link href="/foods" className="shrink-0 text-sm font-semibold leading-[2] text-[#0057b8]">すべて見る</Link>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-6">
        {activeFoods.map((food) => (
          <Link key={food.id} href={`/foods/${food.id}`} className="group min-w-0">
            <div className="aspect-[4/5] overflow-hidden rounded-[1rem] bg-[#f0f2f4] ring-1 ring-[#e6e6e6]">
              <FoodImage food={food} className="h-full w-full transition duration-300 group-hover:scale-105" />
            </div>
            <div className="mt-2 space-y-1">
              <p className="line-clamp-2 min-h-10 text-sm font-semibold leading-[1.55] text-[#1b1b1b]">{food.name}</p>
              <p className="text-xs font-semibold leading-[1.8] text-[#0057b8]">{formatFoodPrice(food)}</p>
              <p className="line-clamp-1 text-xs font-medium leading-[1.7] text-[#64748b]">{getFoodAreaSummary(food)}</p>
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
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[1.55rem] font-semibold leading-[1.7] tracking-[0.02em] text-[#1b1b1b] sm:text-[1.875rem] sm:leading-[1.8]">25thアニバーサリー</h2>
          <p className="text-base font-medium leading-[2] text-[#64748b]">対象フードだけを集めた小さな特集です。</p>
        </div>
        <Link href="/foods?q=25%E5%91%A8%E5%B9%B4" className="shrink-0 rounded-full border border-[#d9dde3] bg-white px-4 py-2 text-sm font-semibold text-[#071b3a] transition active:scale-95 md:hover:border-[#0057b8]">
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
              <div className="aspect-[4/3] overflow-hidden rounded-[1rem] bg-[#f0f2f4]">
                <FoodImage food={food} className="h-full w-full" />
              </div>
              <div className="mt-2 space-y-1">
                <p className="line-clamp-2 min-h-10 text-sm font-semibold leading-[1.55] text-[#1b1b1b]">{food.name}</p>
                <p className="text-xs font-medium leading-[1.8] text-[#64748b]">{eaten ? "食べた" : "残り"} / {getSaleStatusLabel(food)}</p>
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
    <section className="border-y border-[#e6e6e6] bg-white/55 px-3 py-2.5">
      <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <StatusMini label="販売中GET" value={`${eatenCount}/${total}件`} />
        <StatusMini label="現在コンプ" value={`${completionRate}%`} />
        <StatusMini label="残り" value={`${remainingCount}件`} />
        {archiveTotal ? <StatusMini label="図鑑総数" value={`${archiveTotal}件`} /> : null}
      </div>
    </section>
  );
}

function getNextGoal(eaten: number, total: number) {
  const milestones = [5, 10, 25, 50, 100, 150, total].filter((value, index, values) => value > 0 && values.indexOf(value) === index);
  const next = milestones.find((milestone) => eaten < milestone);
  if (!next) return "現在販売中フードを達成済み";
  return `${next}品達成まであと${next - eaten}品`;
}

function CollectionSlot({ food, index }: { food: FoodWithRelations; index: number }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl bg-white ring-1 ring-[#ead9b2]">
      <FoodImage food={food} eager={index === 0} className="h-full w-full" />
      <span className="absolute left-1 top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#071b3a]/88 px-1 text-[10px] font-semibold text-white">
        {index + 1}
      </span>
    </div>
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
    <span className="inline-flex min-w-[132px] shrink-0 items-center justify-between gap-2 rounded-full bg-white/70 px-3 py-2 text-xs font-semibold leading-[1.8] text-[#64748b] ring-1 ring-[#e6e6e6]">
      {label}
      <strong className="text-[#1b1b1b]">{value}</strong>
    </span>
  );
}
