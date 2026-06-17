"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
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
import { useLocale } from "@/lib/i18n/use-locale";
import { useFoodLogs } from "@/lib/use-food-logs";
import { FoodImage } from "@/components/food-image";
import { appBrand, featuredLimitedCollection } from "@/lib/constants";
import type { FoodWithRelations, UserFoodLog } from "@/types/domain";

const SHELF_SLOTS = 18;
const MOBILE_SHELF_SLOTS = 8;
const TABLET_SHELF_SLOTS = 16;
const LIMITED_COLLECTION_MAX = 24;
const LIMITED_COLLECTION_MIN = 3;
const LIMITED_GROUP_RATIO = 0.7;
const PURE_IP_GROUP_NAMES = ["ミニオン", "マリオ", "ハローキティ", "ジュラシック・パーク", "ハリー・ポッター", "スヌーピー", "セサミストリート"];
const LIMITED_WORDS = ["25th", "25周年", "期間限定", "限定", "イベント", "コラボ", "ハロウィーン", "ハロウィン", "クリスマス", "イースター", "夏", "冬"];

export function HomeCollectionHero({ foods }: { foods: FoodWithRelations[] }) {
  const { t } = useLocale();
  const { logs, ready } = useFoodLogs();
  const completion = calculateCompletion(foods, logs);
  const remaining = Math.max(completion.total - completion.eaten, 0);
  const eatenKeys = getEatenCanonicalKeys(foods, logs);
  const stampedKeys = useNewlyStampedKeys(eatenKeys, ready);
  const shelfFoods = useMemo(() => pickShelfFoods(foods, logs, SHELF_SLOTS), [foods, logs]);
  const hasCollection = completion.eaten > 0;

  return (
    <section className="home-collection-hero relative isolate -mx-4 bg-[#fffaf5] px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-[2rem] lg:px-8 lg:pb-8">
      <div className="mx-auto grid max-w-[1080px] gap-4 lg:grid-cols-[0.36fr_0.64fr] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-8 lg:gap-y-4">
        <div className="order-1 space-y-2 text-center lg:col-start-1 lg:row-start-1 lg:text-left">
          <div className="flex items-center justify-center gap-2.5 lg:justify-start">
            <span className="h-px w-4 shrink-0 bg-[#fdbb30]" aria-hidden />
            <p className="select-none text-[10.5px] font-black tracking-[0.14em] text-[#8a5b16] sm:text-[11px] lg:text-[11.5px]">
              USJ FOOD COLLECTION
            </p>
            <span className="h-px w-4 shrink-0 bg-[#fdbb30]" aria-hidden />
          </div>
          <h1 className="select-none text-[1.4rem] font-black leading-[1.2] tracking-[0.02em] text-[#071b3a] sm:text-[1.6rem] lg:text-[1.45rem]">
            {appBrand.name}
          </h1>
          <p className="text-[12px] font-bold leading-6 text-slate-500 sm:text-[13px]">{t("footer.tagline")}</p>
        </div>

        <div className="order-3 space-y-2.5 lg:col-start-1 lg:row-start-2 lg:self-start">
          {hasCollection ? (
            <>
              <div className="flex flex-wrap items-end justify-center gap-x-2 gap-y-1 lg:justify-start">
                <p className="text-[13px] font-black text-[#071b3a]">{t("home.collectionCount")}</p>
                <p className="animate-home-stat-pop text-[2.35rem] font-black leading-none tracking-[-0.04em] text-[#071b3a] sm:text-[2.5rem]">
                  {completion.eaten}
                </p>
                <p className="pb-1 text-[12px] font-bold leading-5 text-slate-500">
                  / {t("home.activeCount", { count: completion.total })}・{t("home.remainingCount", { count: remaining })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-[#e7dccb]">
                  <div
                    className="animate-home-progress-fill h-full rounded-full bg-[linear-gradient(90deg,#0057b8_0%,#0a74db_50%,#fdbb30_100%)]"
                    style={{ width: `${Math.max(completion.rate, 1)}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-[11px] font-black text-slate-500">{completion.rate}%</span>
              </div>
            </>
          ) : (
            <div className="space-y-1.5 text-center lg:text-left">
              <p className="text-sm font-black leading-7 text-[#071b3a]">{t("collection.firstBite")}</p>
              <p className="text-[12px] font-bold text-slate-500">{t("home.activeCount", { count: completion.total })}</p>
            </div>
          )}
        </div>

        <div className="order-2 space-y-2 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <p className="text-center text-[12px] font-black tracking-[0.02em] text-[#8a5b16] lg:text-left">{t("collection.tagline")}</p>
          <div className="grid grid-cols-4 gap-1.5 md:grid-cols-8 lg:grid-cols-6">
            {shelfFoods.map((food, index) => {
              const canonicalKey = getCanonicalFoodKey(food);
              const eaten = eatenKeys.has(canonicalKey);
              const hiddenForViewport = index >= TABLET_SHELF_SLOTS ? "hidden lg:block" : index >= MOBILE_SHELF_SLOTS ? "hidden md:block" : "";
              return (
                <Link
                  key={`${food.id}-${index}`}
                  href={`/foods/${food.id}`}
                  className={`group relative aspect-square min-w-0 overflow-hidden rounded-[11px] bg-[#f1e4d2] ${eaten ? "ring-2 ring-[#fdbb30]/85 ring-offset-1 ring-offset-[#fffaf5]" : ""} ${hiddenForViewport}`}
                  aria-label={`${food.name}の詳細を見る`}
                >
                  <FoodImage
                    food={food}
                    className={`h-full w-full transition duration-300 group-hover:scale-[1.03] ${eaten ? "saturate-100" : "saturate-[0.88] brightness-[1.03]"}`}
                  />
                  {eaten ? (
                    <span
                      className={`absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-[#fdbb30] text-[13px] font-black leading-none text-[#071b3a] ring-1 ring-white/90 shadow-[inset_0_0_6px_rgba(255,255,255,0.42),0_1px_4px_rgba(7,27,58,0.18)] ${stampedKeys.has(canonicalKey) ? "animate-achievement-unlock" : ""}`}
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
      </div>
    </section>
  );
}

export function HomeActiveFoodCollection({ foods }: { foods: FoodWithRelations[] }) {
  const { t } = useLocale();
  const { logs } = useFoodLogs();
  const shelfKeys = useMemo(() => new Set(pickShelfFoods(foods, logs, SHELF_SLOTS).map(getCanonicalFoodKey)), [foods, logs]);
  const activeFoods = useMemo(() => pickActiveCollectionFoods(foods, logs, shelfKeys), [foods, logs, shelfKeys]);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-ink">{t("home.collectibleFoods")}</h2>
          <p className="mt-1 text-xs font-bold text-slate-500">{t("home.collectibleFoodsDescription")}</p>
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
  const { t } = useLocale();
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
          <h2 className="text-xl font-black text-ink">{t("home.limitedCollection")}</h2>
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
                <FoodImage food={food} className={`h-full w-full ${eaten ? "saturate-100" : "saturate-[0.88] brightness-[1.03]"}`} />
                {eaten ? (
                  <span className="absolute bottom-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#fdbb30] text-[13px] font-black leading-none text-[#071b3a] ring-1 ring-white/90 shadow-[inset_0_0_6px_rgba(255,255,255,0.42),0_1px_4px_rgba(7,27,58,0.18)]" aria-hidden>
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

function useNewlyStampedKeys(eatenKeys: Set<string>, ready: boolean) {
  const [stampedKeys, setStampedKeys] = useState<Set<string>>(new Set());
  const previousKeys = useRef<Set<string> | null>(null);
  const signature = Array.from(eatenKeys).sort().join("|");
  const keys = useMemo(() => (signature ? signature.split("|") : []), [signature]);

  useEffect(() => {
    if (!ready) return;
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
  }, [keys, ready]);

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

function pickActiveCollectionFoods(foods: FoodWithRelations[], logs: UserFoodLog[], excludedShelfKeys: Set<string>) {
  const eatenKeys = getEatenCanonicalKeys(foods, logs);
  const seed = getDailySeedKey();
  const candidates = dedupeFoodsByCanonical(foods.filter((food) => isCompletableFood(food) && hasDisplayImage(food) && hasKnownPrice(food)))
    .filter((food) => !eatenKeys.has(getCanonicalFoodKey(food)))
    .sort((a, b) => activeFoodScore(b, seed) - activeFoodScore(a, seed) || a.name.localeCompare(b.name, "ja"));
  const nonShelfFoods = candidates.filter((food) => !excludedShelfKeys.has(getCanonicalFoodKey(food)));
  if (nonShelfFoods.length >= 8) return nonShelfFoods.slice(0, 8);

  const selected = [...nonShelfFoods];
  candidates.forEach((food) => {
    if (selected.length >= 8) return;
    const key = getCanonicalFoodKey(food);
    if (selected.some((item) => getCanonicalFoodKey(item) === key)) return;
    selected.push(food);
  });
  return selected;
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
    .map(([title, groupFoods]) => {
      const candidateFoods = groupFoods.filter(isLimitedCollectionCandidate);
      return {
        title,
        foods: candidateFoods,
        ratio: groupFoods.length ? candidateFoods.length / groupFoods.length : 0
      };
    })
    .filter((group) => {
      const pureIpOnly = PURE_IP_GROUP_NAMES.includes(group.title) && !containsLimitedWord(group.title);
      return group.foods.length >= LIMITED_COLLECTION_MIN && group.foods.length <= LIMITED_COLLECTION_MAX && group.ratio >= LIMITED_GROUP_RATIO && !pureIpOnly;
    })
    .sort((a, b) => b.foods.length - a.foods.length || a.title.localeCompare(b.title, "ja"))[0];
  if (eventGroup) return { title: eventGroup.title, foods: eventGroup.foods, stage: "event" as const };

  const keywordFoods = activeFoods.filter(matchesFeaturedLimitedCollection).slice(0, LIMITED_COLLECTION_MAX);
  if (keywordFoods.length > 0) {
    return { title: featuredLimitedCollection.title, foods: keywordFoods, stage: "featured" as const };
  }

  const limitedFoods = activeFoods.filter((food) => food.isLimited);
  if (limitedFoods.length > 0 && limitedFoods.length <= LIMITED_COLLECTION_MAX) return { title: "期間限定", foods: limitedFoods, stage: "limited" as const };
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

function isLimitedCollectionCandidate(food: FoodWithRelations) {
  return Boolean(
    food.isLimited ||
      food.saleType === "limited" ||
      food.saleType === "event" ||
      food.rarity === "limited" ||
      food.rarity === "event" ||
      food.salePeriodLabel ||
      food.saleEndDate ||
      food.endDate ||
      food.releasePeriod ||
      containsLimitedWord([food.eventName, food.collaborationName, food.name, food.description, food.seasonalVersion].filter(Boolean).join(" "))
  );
}

function containsLimitedWord(value: string) {
  const normalized = value.toLowerCase();
  return LIMITED_WORDS.some((word) => normalized.includes(word.toLowerCase()));
}

function shelfScore(food: FoodWithRelations, seed: string) {
  return (food.isLimited ? 1000 : 0) + (hasKnownPrice(food) ? 80 : 0) + imageQualityScore(food) + seededScore(`${seed}:${getCanonicalFoodKey(food)}`);
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

function imageQualityScore(food: FoodWithRelations) {
  const imageScore = Math.max(
    food.imageUrl ? 60 : 0,
    ...(food.images ?? []).map((image) => {
      const sourceScore = image.sourceType === "official" ? 42 : image.sourceType === "own" ? 32 : image.sourceType === "user" ? 24 : 8;
      return sourceScore + (image.imageMatchScore ?? 0) / 4 + (image.imageConfidenceScore ?? 0) / 5 - (image.priority ?? 100) / 25;
    })
  );
  return Math.max(0, imageScore);
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
