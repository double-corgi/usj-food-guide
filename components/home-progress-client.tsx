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
  const nextGoal = getNextGoal(completion.eaten, completion.total);

  return (
    <section className="pt-2">
      <div className="mx-auto max-w-[880px]">
        <div className="text-center">
          <h1 className="text-[30px] font-semibold leading-[1.8] tracking-[0.03em] text-[#1b1b1b]">{appBrand.shortName}</h1>
          <p className="mx-auto max-w-[520px] text-base font-medium leading-[2] text-[#3c3c3c]">
            食べた記録が、<br className="sm:hidden" />
            そのままコレクションになる。
          </p>
        </div>

        <div className="mt-7 border-y border-[#e6e6e6] py-6 sm:mt-9 sm:py-8">
          <p className="text-center text-sm font-semibold leading-[2] tracking-[0.03em] text-[#8c8c8c]">コレクション進捗</p>
          <div className="mt-2 flex items-end justify-center gap-4 sm:gap-6">
            <p className="text-[4.4rem] font-semibold leading-none tracking-[-0.05em] text-[#071b3a] sm:text-[6rem]">{completion.eaten}<span className="mx-1 text-[#c8c8c8]">/</span>{completion.total}</p>
            <p className="pb-2 text-[2.8rem] font-semibold leading-none text-[#0057b8] sm:text-[4rem]">{completion.rate}%</p>
          </div>
          <div className="mx-auto mt-5 h-1.5 max-w-[620px] overflow-hidden rounded-full bg-[#e6e6e6]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#0057b8_0%,#fdbb30_100%)]"
              style={{ width: `${completion.rate}%` }}
            />
          </div>
          <div className="mx-auto mt-5 grid max-w-[620px] grid-cols-3 divide-x divide-[#e6e6e6] text-center">
            <ProgressMini label="残り" value={`${remaining}品`} />
            <ProgressMini label="達成率" value={`${completion.rate}%`} />
            <ProgressMini label="次の目標" value={nextGoal} />
          </div>
        </div>

        <div className="mx-auto mt-7 max-w-[620px] overflow-hidden rounded-[1.15rem] bg-[#f8f7f6] ring-1 ring-[#e6e6e6]">
          <Image
            src="/hero/unicole-collection-hero.png"
            alt=""
            width={1680}
            height={945}
            priority
            unoptimized
            className="animate-hero-collection-drift aspect-[16/5] h-auto w-full select-none object-cover opacity-90"
            aria-hidden="true"
          />
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

function ProgressMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-2">
      <p className="text-xs font-semibold leading-[2] text-[#8c8c8c]">{label}</p>
      <p className="truncate text-base font-semibold leading-[1.8] text-[#1b1b1b]">{value}</p>
    </div>
  );
}

function getNextGoal(eaten: number, total: number) {
  const milestones = [5, 10, 25, 50, 100, 150, total].filter((value, index, values) => value > 0 && values.indexOf(value) === index);
  const next = milestones.find((milestone) => eaten < milestone);
  if (!next) return "達成済み";
  return `あと${next - eaten}品`;
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
