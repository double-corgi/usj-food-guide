"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  calculateArchiveRecordRate,
  calculateCompletion,
  dedupeFoodsByCanonical,
  formatFoodPrice,
  getCanonicalFoodKey,
  getEatenCanonicalKeys,
  getFoodAreaSummary,
  getRemainingDays,
  getSaleUrgencyLabel,
  isCompletableFood
} from "@/lib/food-utils";
import { useFoodLogs } from "@/lib/use-food-logs";
import { FoodImage } from "@/components/food-image";
import { appBrand, featuredLimitedCollection } from "@/lib/constants";
import type { FoodWithRelations, UserFoodLog } from "@/types/domain";

const SHELF_SLOTS = 18;
const MOBILE_SHELF_SLOTS = 10;
const TABLET_SHELF_SLOTS = 16;

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
  const stampedKeys = useNewlyStampedKeys(eatenKeys);
  const shelfFoods = useMemo(() => pickShelfFoods(foods, logs, SHELF_SLOTS), [foods, logs]);

  return (
    <section className="relative isolate -mx-4 bg-[#fffaf5] px-4 pb-2 pt-4 sm:-mx-6 sm:px-6 sm:pt-5 lg:mx-0 lg:rounded-[2rem] lg:px-8 lg:py-8">
      <div className="mx-auto grid max-w-[1080px] gap-4 lg:grid-cols-[0.38fr_0.62fr] lg:grid-rows-[auto_auto] lg:items-center lg:gap-x-8 lg:gap-y-5">
        <div className="order-1 space-y-1.5 text-center lg:col-start-1 lg:row-start-1 lg:text-left">
          <div className="flex items-center justify-center gap-3 lg:justify-start">
            <span className="h-px w-5 bg-[#fdbb30]" aria-hidden />
            <h1
              className="home-unicole-logo relative select-none text-[1.85rem] font-black leading-none tracking-[0.04em] text-[#071b3a] sm:text-[2rem] lg:text-[2.15rem]"
              data-logo={appBrand.shortName}
            >
              {appBrand.shortName}
            </h1>
            <span className="h-px w-5 bg-[#fdbb30]" aria-hidden />
          </div>
          <p className="text-[13px] font-bold leading-6 text-slate-500">{appBrand.tagline}</p>
        </div>

        <div className="order-3 space-y-2.5 lg:col-start-1 lg:row-start-2">
          <div className="flex flex-wrap items-end justify-center gap-x-2 gap-y-1 lg:justify-start">
            <p className="text-[13px] font-black text-[#071b3a]">コレクション</p>
            <p className="animate-home-stat-pop text-[2.35rem] font-black leading-none tracking-[-0.04em] text-[#071b3a] sm:text-[2.5rem]">
              {completion.eaten}
            </p>
            <p className="pb-1 text-[12px] font-bold leading-5 text-slate-500">
              / 販売中 {completion.total}品（登録分）・残り {remaining}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-[#e7dccb]">
              <div
                className="animate-home-progress-fill h-full rounded-full bg-[linear-gradient(90deg,#0057b8_0%,#0a74db_50%,#fdbb30_100%)]"
                style={{ width: `${Math.max(completion.rate, completion.eaten > 0 ? 1 : 0)}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-[11px] font-black text-slate-500">{completion.rate}%</span>
          </div>
        </div>

        <div className="order-2 grid grid-cols-5 gap-1.5 md:grid-cols-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:grid-cols-6">
          {shelfFoods.map((food, index) => {
            const canonicalKey = getCanonicalFoodKey(food);
            const eaten = eatenKeys.has(canonicalKey);
            const hiddenForViewport = index >= TABLET_SHELF_SLOTS ? "hidden lg:block" : index >= MOBILE_SHELF_SLOTS ? "hidden md:block" : "";
            return (
              <Link
                key={`${food.id}-${index}`}
                href={`/foods/${food.id}`}
                className={`group relative aspect-square min-w-0 overflow-hidden rounded-[10px] bg-[#efe1cd] ${hiddenForViewport}`}
                aria-label={`${food.name}の詳細を見る`}
              >
                <FoodImage
                  food={food}
                  className={`h-full w-full transition duration-300 group-hover:scale-[1.03] ${eaten ? "saturate-100" : "opacity-90 sepia-[0.18] saturate-[0.56] brightness-[1.06]"}`}
                />
                {eaten ? (
                  <span
                    className={`absolute bottom-1 right-1 grid h-4 w-4 place-items-center rounded-full bg-[#fdbb30] text-[10px] font-black leading-none text-[#071b3a] ring-1 ring-white/80 ${stampedKeys.has(canonicalKey) ? "animate-achievement-unlock" : ""}`}
                    aria-hidden
                  >
                    ✓
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HomeActiveFoodCollection({ foods }: { foods: FoodWithRelations[] }) {
  const { logs } = useFoodLogs();
  const activeFoods = useMemo(() => pickActiveCollectionFoods(foods, logs), [foods, logs]);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-ink">今集められるフード</h2>
          <p className="mt-1 text-xs font-bold text-slate-500">写真で選べる、販売中の登録フード。</p>
        </div>
        <Link href="/foods" className="hidden shrink-0 text-xs font-black text-park lg:inline">すべて見る</Link>
      </div>

      {activeFoods.length > 0 ? (
        <div className="flex snap-x gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
          {activeFoods.map((food, index) => (
            <HomeFoodRailCard key={food.id} food={food} className={index >= 6 ? "lg:hidden" : ""} />
          ))}
          <Link
            href="/foods"
            className="flex min-h-[300px] w-[74vw] max-w-[300px] shrink-0 snap-start flex-col justify-end rounded-[1.25rem] bg-[#fffaf5] p-5 text-sm font-black text-ink ring-1 ring-[#eadcc8] lg:hidden"
          >
            <span>すべて見る</span>
            <span className="mt-1 text-xs font-bold text-slate-500">登録済みコレクションへ</span>
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#fffaf5] px-5 py-6 text-sm font-bold leading-7 text-slate-500">
          販売中の登録フードはすべて記録済みです。登録済みコレクションから写真を見返せます。
          <Link href="/foods" className="ml-2 font-black text-park">探す</Link>
        </div>
      )}
    </section>
  );
}

export function HomeLimitedCollection({ foods }: { foods: FoodWithRelations[] }) {
  const { logs } = useFoodLogs();
  const eatenKeys = getEatenCanonicalKeys(foods, logs);
  const collection = useMemo(() => buildLimitedCollection(foods), [foods]);
  if (!collection) return null;

  const remaining = collection.foods.filter((food) => !eatenKeys.has(getCanonicalFoodKey(food))).length;
  const complete = remaining === 0;

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-black text-ink">期間限定コレクション</h2>
          <p className="mt-1 text-xs font-bold text-slate-500">{collection.title}</p>
        </div>
        <div className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${complete ? "bg-[#fdbb30] text-[#071b3a]" : "bg-[#fffaf5] text-[#8a5b16] ring-1 ring-[#eadcc8]"}`}>
          {complete ? "コンプリート" : `あと ${remaining}品`}
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {collection.foods.map((food) => {
          const eaten = eatenKeys.has(getCanonicalFoodKey(food));
          return (
            <Link key={food.id} href={`/foods/${food.id}`} className="w-[136px] shrink-0 transition active:scale-[0.99] md:hover:-translate-y-0.5">
              <div className="relative aspect-square overflow-hidden rounded-[1rem] bg-[#efe1cd]">
                <FoodImage food={food} className={`h-full w-full ${eaten ? "saturate-100" : "opacity-90 sepia-[0.18] saturate-[0.56] brightness-[1.06]"}`} />
                {eaten ? (
                  <span className="absolute bottom-1.5 right-1.5 grid h-4 w-4 place-items-center rounded-full bg-[#fdbb30] text-[10px] font-black leading-none text-[#071b3a] ring-1 ring-white/80" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </div>
              <p className="mt-2 line-clamp-2 min-h-9 text-xs font-black leading-[1.45] text-ink">{food.name}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function HomeRecentRecords({ foods }: { foods: FoodWithRelations[] }) {
  const { logs } = useFoodLogs();
  const recentFoods = useMemo(() => pickRecentEatenFoods(foods, logs), [foods, logs]);
  if (recentFoods.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-ink">最近の記録</h2>
          <p className="mt-1 text-xs font-bold text-slate-500">色づいたコレクションを見返す。</p>
        </div>
        <Link href="/eaten" className="shrink-0 text-xs font-black text-park">アルバムを見る</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {recentFoods.map((food) => (
          <Link key={food.id} href={`/foods/${food.id}`} className="w-[148px] shrink-0">
            <div className="aspect-square overflow-hidden rounded-[1rem] bg-slate-100">
              <FoodImage food={food} className="h-full w-full transition duration-300 hover:scale-[1.03]" />
            </div>
            <p className="mt-2 line-clamp-2 min-h-9 text-xs font-black leading-[1.45] text-ink">{food.name}</p>
          </Link>
        ))}
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

function HomeFoodRailCard({ food, className = "" }: { food: FoodWithRelations; className?: string }) {
  const chip = getHomeFoodChip(food);

  return (
    <Link href={`/foods/${food.id}`} className={`group w-[74vw] max-w-[300px] shrink-0 snap-start lg:w-auto lg:max-w-none ${className}`}>
      <div className="aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-slate-100">
        <FoodImage food={food} className="h-full w-full transition duration-300 group-hover:scale-[1.03]" />
      </div>
      <div className="mt-3 space-y-1">
        <p className="line-clamp-2 min-h-[42px] text-[15px] font-black leading-[1.45] text-ink">{food.name}</p>
        <p className="line-clamp-1 text-xs font-bold text-slate-500">
          <span className="font-black text-[#071b3a]">{formatFoodPrice(food)}</span>
          <span className="px-1.5 text-slate-300">/</span>
          {getFoodAreaSummary(food)}
        </p>
        {chip ? <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${chip.tone}`}>{chip.label}</span> : null}
      </div>
    </Link>
  );
}

function useNewlyStampedKeys(eatenKeys: Set<string>) {
  const [stampedKeys, setStampedKeys] = useState<Set<string>>(new Set());
  const previousKeys = useRef<Set<string> | null>(null);
  const signature = Array.from(eatenKeys).sort().join("|");
  const keys = useMemo(() => (signature ? signature.split("|") : []), [signature]);

  useEffect(() => {
    const currentKeys = new Set(keys);
    if (!previousKeys.current) {
      previousKeys.current = currentKeys;
      return;
    }
    const nextStamped = new Set<string>();
    currentKeys.forEach((key) => {
      if (!previousKeys.current?.has(key)) nextStamped.add(key);
    });
    previousKeys.current = currentKeys;
    if (nextStamped.size === 0) return;

    setStampedKeys(nextStamped);
    const timer = window.setTimeout(() => setStampedKeys(new Set()), 900);
    return () => window.clearTimeout(timer);
  }, [keys]);

  return stampedKeys;
}

function pickShelfFoods(foods: FoodWithRelations[], logs: UserFoodLog[], limit: number) {
  const activeFoods = dedupeFoodsByCanonical(foods.filter((food) => isCompletableFood(food) && hasDisplayImage(food)));
  const byCanonical = new Map(activeFoods.map((food) => [getCanonicalFoodKey(food), food]));
  const eatenKeys = getEatenCanonicalKeys(foods, logs);
  const eatenFoods = latestEatenCanonicalKeys(logs, foods)
    .map((key) => byCanonical.get(key))
    .filter((food): food is FoodWithRelations => Boolean(food))
    .slice(0, Math.floor(limit / 2));
  const eatenSet = new Set(eatenFoods.map(getCanonicalFoodKey));
  const seed = getDailySeedKey();
  const uneatenFoods = activeFoods
    .filter((food) => !eatenSet.has(getCanonicalFoodKey(food)) && !eatenKeys.has(getCanonicalFoodKey(food)))
    .sort((a, b) => shelfScore(b, seed) - shelfScore(a, seed) || a.name.localeCompare(b.name, "ja"));

  return [...eatenFoods, ...uneatenFoods].slice(0, limit);
}

function pickActiveCollectionFoods(foods: FoodWithRelations[], logs: UserFoodLog[]) {
  const eatenKeys = getEatenCanonicalKeys(foods, logs);
  const seed = getDailySeedKey();
  return dedupeFoodsByCanonical(foods.filter((food) => isCompletableFood(food) && hasDisplayImage(food) && hasKnownPrice(food)))
    .filter((food) => !eatenKeys.has(getCanonicalFoodKey(food)))
    .sort((a, b) => activeFoodScore(b, seed) - activeFoodScore(a, seed) || a.name.localeCompare(b.name, "ja"))
    .slice(0, 8);
}

function buildLimitedCollection(foods: FoodWithRelations[]) {
  const activeFoods = dedupeFoodsByCanonical(foods.filter((food) => isCompletableFood(food) && hasDisplayImage(food)));
  const grouped = new Map<string, FoodWithRelations[]>();

  activeFoods.forEach((food) => {
    [food.eventName, food.collaborationName].forEach((value) => {
      const key = value?.trim();
      if (!key) return;
      grouped.set(key, [...(grouped.get(key) ?? []), food]);
    });
  });

  const eventGroup = Array.from(grouped.entries())
    .filter(([, groupFoods]) => groupFoods.length >= 3)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "ja"))[0];
  if (eventGroup) return { title: eventGroup[0], foods: eventGroup[1], stage: "event" as const };

  const keywordFoods = activeFoods.filter(matchesFeaturedLimitedCollection);
  if (keywordFoods.length > 0) {
    return { title: featuredLimitedCollection.title, foods: keywordFoods, stage: "featured" as const };
  }

  const limitedFoods = activeFoods.filter((food) => food.isLimited || food.saleType === "limited" || food.saleType === "event" || food.rarity === "limited" || food.rarity === "event");
  if (limitedFoods.length > 0) return { title: "期間限定", foods: limitedFoods, stage: "limited" as const };
  return null;
}

function pickRecentEatenFoods(foods: FoodWithRelations[], logs: UserFoodLog[]) {
  const byId = new Map(foods.map((food) => [food.id, food]));
  const seen = new Set<string>();
  return logs
    .filter((log) => log.status === "eaten")
    .sort((a, b) => Date.parse(b.eatenAt ?? "") - Date.parse(a.eatenAt ?? ""))
    .map((log) => byId.get(log.foodId))
    .filter((food): food is FoodWithRelations => Boolean(food))
    .filter((food) => {
      const key = getCanonicalFoodKey(food);
      if (seen.has(key)) return false;
      seen.add(key);
      return hasDisplayImage(food);
    })
    .slice(0, 3);
}

function latestEatenCanonicalKeys(logs: UserFoodLog[], foods: FoodWithRelations[]) {
  const byId = new Map(foods.map((food) => [food.id, food]));
  const seen = new Set<string>();
  return logs
    .filter((log) => log.status === "eaten")
    .sort((a, b) => Date.parse(b.eatenAt ?? "") - Date.parse(a.eatenAt ?? ""))
    .map((log) => byId.get(log.foodId))
    .filter((food): food is FoodWithRelations => Boolean(food))
    .map(getCanonicalFoodKey)
    .filter((key) => {
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function matchesFeaturedLimitedCollection(food: FoodWithRelations) {
  const evidence = [
    food.name,
    food.eventName,
    food.collaborationName,
    food.description,
    food.salePeriodLabel,
    food.releasePeriod,
    food.seasonalVersion,
    food.sourceUrl,
    food.officialUrl,
    ...(food.sourceNames ?? []),
    ...(food.images ?? []).flatMap((image) => [image.imageUrl, image.altText, image.imageSourceContext, image.sourceUrl])
  ].filter(Boolean).join(" ");
  const normalized = evidence.toLowerCase();
  if (featuredLimitedCollection.excludeKeywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) return false;
  return featuredLimitedCollection.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

function shelfScore(food: FoodWithRelations, seed: string) {
  return (food.isLimited ? 1000 : 0) + (hasKnownPrice(food) ? 80 : 0) + (hasDisplayImage(food) ? 40 : 0) + seededScore(`${seed}:${getCanonicalFoodKey(food)}`);
}

function activeFoodScore(food: FoodWithRelations, seed: string) {
  const days = getRemainingDays(food);
  const urgency = typeof days === "number" && days >= 0 ? Math.max(0, 240 - days * 8) : 0;
  return urgency + (food.isLimited ? 180 : 0) + scoreHomeFood(food) + seededScore(`${seed}:${getCanonicalFoodKey(food)}`);
}

function scoreHomeFood(food: FoodWithRelations) {
  let score = 0;
  if (food.isLimited) score += 28;
  if (food.price ?? food.priceMin) score += 16;
  if (food.images?.length) score += 8;
  if (/チュリトス|ポップコーン|バーガー|ドリンク|スイーツ|ピザ|カフェ|アイス/i.test(food.name)) score += 10;
  return score;
}

function getHomeFoodChip(food: FoodWithRelations) {
  const urgency = getSaleUrgencyLabel(food);
  if (urgency) return { label: urgency, tone: "bg-rose-50 text-rose-700" };
  if (food.isLimited) return { label: "限定", tone: "bg-[#fff4d7] text-[#8a5b16]" };
  return null;
}

function hasDisplayImage(food: FoodWithRelations) {
  return Boolean(food.imageUrl || food.images?.some((image) => image.enabled && image.imageUrl));
}

function hasKnownPrice(food: FoodWithRelations) {
  return Boolean(food.price ?? food.priceMin ?? food.locations?.find((location) => location.price)?.price) && food.priceSource !== "unknown";
}

function getDailySeedKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function seededScore(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 1000;
}

function StatusMini({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex min-w-[132px] shrink-0 items-center justify-between gap-2 rounded-full bg-white/70 px-3 py-2 text-xs font-black text-slate-500 ring-1 ring-slate-200/60">
      {label}
      <strong className="text-ink">{value}</strong>
    </span>
  );
}
