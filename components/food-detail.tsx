"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Check, ChevronLeft, ChevronRight, ExternalLink, Flag, MapPin, Store } from "lucide-react";
import { getCanonicalFoodId, getCanonicalFoodKey, getDisplayLocationAreaName, getFoodAreaSummary, getFoodAreaNames, getPriceSource, getPriceSourceLabel, getSaleEndDate, getSaleStartDate, getSaleStatus, getSaleStatusTone, getZukanCode, isCompletableFood, isEatenCanonical } from "@/lib/food-utils";
import { useFoodLogs } from "@/lib/use-food-logs";
import { useNextWantFoods } from "@/lib/use-next-want-foods";
import { isFoodInCollection, SUMMER_2026_COLLECTION_ID } from "@/lib/seasonal-collections";
import { filterDeletedFoodIds, isDeletedFoodId } from "@/lib/deleted-foods";
import type { DiningType, FoodCategory, FoodLocation, FoodWithRelations } from "@/types/domain";
import { FoodImage } from "@/components/food-image";
import { AdSlot } from "@/components/ads/ad-slot";
import { FoodCorrectionReportForm } from "@/components/food-correction-report-form";
import { FoodReviews } from "@/components/food-reviews";
import { UnofficialNotice } from "@/components/unofficial-notice";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { formatDateI18n } from "@/lib/i18n/format-date";
import { formatPriceI18n } from "@/lib/i18n/format-price";
import { getFoodNameI18n } from "@/lib/i18n/name-translations";
import { getSalePeriodLabelI18n, getSaleStatusLabelI18n, getUrgencyLabelI18n } from "@/lib/i18n/sale-label-utils";
import { useLocale } from "@/lib/i18n/use-locale";

type RelatedGroups = {
  sameCategory: FoodWithRelations[];
  sameArea: FoodWithRelations[];
  sameShop: FoodWithRelations[];
  sameEvent?: FoodWithRelations[];
  sameSeries?: FoodWithRelations[];
  together?: FoodWithRelations[];
};

export function FoodDetail({
  food,
  allFoods,
  previousFood,
  nextFood,
  relatedGroups,
}: {
  food: FoodWithRelations;
  allFoods?: FoodWithRelations[];
  previousFood?: FoodWithRelations;
  nextFood?: FoodWithRelations;
  relatedGroups?: RelatedGroups;
}) {
  const { locale, t } = useLocale();
  const { logs, toggleEaten } = useFoodLogs();
  const foodPool = allFoods ?? [food];
  const { isWanted, toggleWanted } = useNextWantFoods(foodPool);
  const eatenActionFoodId = getCanonicalActionFoodId(foodPool, logs, food, "eaten");
  const eaten = isEatenCanonical(foodPool, logs, food);
  const wanted = isWanted(food);
  const eatToggleFoodId = eatenActionFoodId;
  const locations = getDisplayLocations(food);
  const primaryLocation = locations[0];
  const periodLabel = getSalePeriodLabelI18n(food, locale, t);
  const saleStatus = getSaleStatus(food);
  const saleStartDate = getSaleStartDate(food);
  const saleEndDate = getSaleEndDate(food);
  const urgencyLabel = getUrgencyLabelI18n(food, t);
  const priceSource = getPriceSource(food);
  const knownPrice = Boolean(food.price ?? food.priceMin);
  const diningType = food.diningType && food.diningType !== "unknown" ? food.diningType : inferDiningType(food);
  const diningLabel = t(`diningType.${diningType}` as TranslationKey);
  const officialHref = food.officialUrl ?? food.sourceUrl;
  const salesSummary = getSalesSummary(food, t);
  const relatedFoods = buildRelatedFoods(food, foodPool, relatedGroups).slice(0, 12);
  const displayName = getFoodNameI18n(food.id, locale, food.name);

  useEffect(() => {
    try {
      const key = "uniba-recent-foods-v1";
      const current = JSON.parse(window.localStorage.getItem(key) ?? "[]") as string[];
      const currentFoodIds = filterDeletedFoodIds(current.filter((id): id is string => typeof id === "string"));
      const next = isDeletedFoodId(food.id) ? currentFoodIds.slice(0, 20) : [food.id, ...currentFoodIds.filter((id) => id !== food.id)].slice(0, 20);
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // localStorage may be unavailable in private contexts.
    }
  }, [food.id]);

  return (
    <div className="min-w-0 space-y-5 overflow-x-hidden pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/foods" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 text-sm font-black text-slate-700">
          <ChevronLeft size={17} aria-hidden />
          {t("foodDetail.backToList")}
        </Link>
        <div className="grid grid-cols-2 gap-2">
          {previousFood ? (
            <Link href={`/foods/${previousFood.id}`} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-full bg-white/70 px-3 text-xs font-black text-slate-600">
              <ChevronLeft size={15} aria-hidden />
              {t("foodDetail.previous")}
            </Link>
          ) : null}
          {nextFood ? (
            <Link href={`/foods/${nextFood.id}`} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-full bg-white/70 px-3 text-xs font-black text-slate-600">
              {t("foodDetail.next")}
              <ChevronRight size={15} aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>

      <section className="space-y-5 text-ink">
        <div className="relative h-[300px] overflow-hidden rounded-[1.45rem] bg-slate-100 shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:h-[540px] sm:rounded-[2rem]">
          <FoodImage food={food} alt={displayName} eager className="h-full w-full" variant="contain" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-park shadow-sm">{getZukanCode(food, allFoods)}</span>
            {saleStatus === "ended" ? (
              <span className="rounded-full bg-slate-800/88 px-3 py-1.5 text-xs font-black text-white shadow-sm">× {t("common.ended")}</span>
            ) : null}
            {saleStatus === "upcoming" ? (
              <span className="rounded-full bg-sun px-3 py-1.5 text-xs font-black text-ink shadow-sm">{t("foods.badgeUpcoming")}</span>
            ) : null}
          {food.isLimited ? (
              <span className="rounded-full bg-berry px-3 py-1.5 text-xs font-black text-white shadow-sm">◇ {t("foods.badgeLimited")}</span>
            ) : null}
          </div>
        </div>

        <div className="mobile-page-section grid gap-5 px-4 py-4 sm:px-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="min-w-0 space-y-3">
            <p className="text-xs font-black text-park">{t(`category.${food.category}` as TranslationKey)}</p>
            <h1 className="break-words text-[1.75rem] font-black leading-tight tracking-tight text-ink [overflow-wrap:anywhere] sm:text-5xl">
              {displayName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="text-[1.65rem] font-black leading-none text-park sm:text-3xl">{formatPriceI18n(food, locale, t)}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${getSaleStatusTone(food)}`}>{getSaleStatusLabelI18n(food, t)}</span>
              {urgencyLabel ? <span className="rounded-full bg-berry px-3 py-1 text-xs font-black text-white">{urgencyLabel}</span> : null}
              {food.isLimited ? <span className="rounded-full bg-sun/30 px-3 py-1 text-xs font-black text-ink">{t("foods.badgeLimited")}</span> : null}
              {isFoodInCollection(food, SUMMER_2026_COLLECTION_ID) ? (
                <Link href="/collections/summer-2026" className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#0f5f78] ring-1 ring-[#d9e8ef]">
                  2026年夏限定
                </Link>
              ) : null}
            </div>
            {!knownPrice ? <p className="text-xs font-black leading-5 text-amber-700">{t("foodDetail.priceUnknownNote")}</p> : null}
            <p className="flex min-w-0 items-start gap-2 text-sm font-bold text-slate-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-park" aria-hidden />
              <span className="min-w-0 break-words [overflow-wrap:anywhere]">{primaryLocation?.shopName ?? food.shop.name}</span>
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:w-[360px]">
            <button
              type="button"
              onClick={() => toggleEaten(eatToggleFoodId, getStoredSpendAmount(food))}
              className={`inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full text-base font-black shadow-sm active:scale-[0.98] ${eaten ? "bg-park text-white" : "bg-park text-white"}`}
            >
              <Check size={20} aria-hidden />
              {eaten ? t("foodCard.eatenDone") : t("foodCard.markEaten")}
            </button>
            <button
              type="button"
              onClick={() => toggleWanted(food)}
              className={`inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full border text-sm font-black active:scale-[0.98] ${
                wanted ? "border-park bg-mint text-park" : "border-slate-200 bg-white/75 text-slate-700"
              }`}
              aria-pressed={wanted}
            >
              <Flag size={18} aria-hidden />
              {wanted ? t("foodDetail.wantSaved") : t("foodDetail.wantNext")}
            </button>
          </div>
        </div>
      </section>

      <section className="mobile-page-section space-y-4 px-4 py-5 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black text-park">{t("foodDetail.howToBuy")}</p>
            <h2 className="mt-1 flex items-center gap-2 text-xl font-black text-ink">
              <Store size={20} aria-hidden className="text-park" />
              {t("area.salesLocations")}
            </h2>
          </div>
          <p className="text-xs font-black leading-5 text-slate-500">
            {salesSummary.shopLabel} / {salesSummary.areaLabel}
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {locations.map((location, index) => (
            <div
              key={`${location.shopName}-${location.areaName}-${location.sourceUrl ?? index}`}
              className="py-3"
              data-location-map-slot="ready"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-base font-black leading-6 text-ink [overflow-wrap:anywhere]">
                    {location.shopId ? (
                      <Link href={`/stores/${location.shopId}`} className="underline decoration-slate-300 underline-offset-4 transition hover:text-park">
                        {location.shopName}
                      </Link>
                    ) : (
                      location.shopName
                    )}
                  </p>
                  <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-black text-slate-600">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-park" aria-hidden />
                    <span className="line-clamp-2">{getDisplayLocationAreaName(location, food)}</span>
                  </p>
                </div>
                <span className="shrink-0 text-[11px] font-black text-slate-400">{t(`shopType.${location.shopType}` as TranslationKey)}</span>
              </div>
              <p className="mt-2 text-xs font-bold text-slate-500">
                {location.price ? formatPriceI18n({ price: location.price }, locale, t) : formatPriceI18n(food, locale, t)} / {diningLabel}
              </p>
            </div>
          ))}
        </div>
      </section>

      <FoodReviews food={food} allFoods={foodPool} />

      {officialHref ? (
        <a
          href={officialHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/75 text-sm font-black text-slate-700"
        >
          {t("foodDetail.officialSite")}
          <ExternalLink size={17} aria-hidden />
        </a>
      ) : null}

      <AdSlot placement="food-detail-middle" />

      <section className="space-y-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-black text-park">{t("foodDetail.relatedKicker")}</p>
          <h2 className="mt-1 text-lg font-black text-ink">{t("foodDetail.relatedTitle")}</h2>
        </div>
        <RelatedRail title={t("foodDetail.relatedRailTitle")} foods={relatedFoods} locale={locale} t={t} />
      </section>

      <details className="border-b border-slate-200 pb-4 text-xs font-bold text-slate-500">
        <summary className="cursor-pointer text-xs font-black text-slate-500">{t("foodDetail.confirmationInfo")}</summary>
        <dl className="mt-3 grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">{t("foodDetail.category")}</dt>
            <dd className="font-black text-slate-700">{t(`category.${food.category}` as TranslationKey)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">{t("foodDetail.diningType")}</dt>
            <dd className="font-black text-slate-700">{diningLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">{t("foodDetail.period")}</dt>
            <dd className="font-black text-slate-700">{periodLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">{t("foodDetail.completable")}</dt>
            <dd className="font-black text-slate-700">{isCompletableFood(food) ? t("foodDetail.completableYes") : t("foodDetail.completableNo")}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">{t("foodDetail.saleStart")}</dt>
            <dd className="font-black text-slate-700">{formatDateI18n(saleStartDate, locale) ?? t("foodDetail.dateUnknown")}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">{t("foodDetail.saleEnd")}</dt>
            <dd className="font-black text-slate-700">{saleEndDate ? formatDateI18n(saleEndDate, locale) ?? t("foodDetail.dateUnknown") : saleStatus === "active" ? t("foodDetail.dateUndecided") : t("foodDetail.dateUnknown")}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">{t("foodDetail.priceCheck")}</dt>
            <dd className="font-black text-slate-700">{getPriceSourceLabel(priceSource)}</dd>
          </div>
          {!knownPrice ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">{t("foodDetail.priceStatus")}</dt>
              <dd className="font-black text-amber-700">{t("foods.priceUnknown")}</dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">{t("foodDetail.checkedDate")}</dt>
            <dd className="font-black text-slate-700">{formatDateI18n(food.priceLastCheckedAt, locale, { month: "numeric", day: "numeric" }) ?? t("foodDetail.dateUnknown")}</dd>
          </div>
        </dl>
      </details>

      <FoodCorrectionReportForm food={food} />

      <UnofficialNotice />
    </div>
  );
}

function buildRelatedFoods(food: FoodWithRelations, allFoods: FoodWithRelations[], groups?: RelatedGroups) {
  const scores = new Map<string, { food: FoodWithRelations; score: number }>();
  const currentKey = getCanonicalFoodKey(food);
  const add = (items: FoodWithRelations[] | undefined, weight: number) => {
    (items ?? []).forEach((candidate, index) => {
      const key = getCanonicalFoodKey(candidate);
      if (key === currentKey) return;
      const current = scores.get(key);
      const score = weight + Math.max(0, 12 - index);
      scores.set(key, { food: current?.food ?? candidate, score: (current?.score ?? 0) + score });
    });
  };

  add(groups?.sameSeries, 100);
  add(groups?.sameCategory, 84);
  add(groups?.sameArea, 68);
  add(groups?.sameShop, 62);
  add(groups?.together, 62);
  add(groups?.sameEvent, 56);

  for (const candidate of allFoods) {
    const key = getCanonicalFoodKey(candidate);
    if (key === currentKey) continue;
    const current = scores.get(key);
    const sameArea = candidate.areaId === food.areaId || candidate.locations?.some((location) => location.areaId === food.areaId);
    const categoryAffinity = categoryAffinityScore(food.category, candidate.category);
    const baseScore =
      (sameArea ? 26 : 0) +
      categoryAffinity +
      Math.min(candidate.extractionSourceCount ?? 0, 5) * 5 +
      Math.min(candidate.confidenceScore ?? 0, 100) / 12 +
      (candidate.isLimited ? 8 : 0) +
      (candidate.price || candidate.priceMin ? 6 : 0);
    if (baseScore <= 0 && !current) continue;
    scores.set(key, { food: current?.food ?? candidate, score: (current?.score ?? 0) + baseScore });
  }

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name, "ja"))
    .map((item) => item.food);
}

function getSalesSummary(food: FoodWithRelations, t: ReturnType<typeof useLocale>["t"]) {
  const shops = new Set<string>();
  const areas = new Set<string>();
  for (const location of food.locations ?? []) {
    if (location.shopName && location.shopName !== "店舗未確認") shops.add(location.shopName);
    const areaName = getDisplayLocationAreaName(location, food);
    if (areaName !== "エリア確認中") areas.add(areaName);
  }
  if (food.shop.name && food.shop.name !== "店舗未確認") shops.add(food.shop.name);
  for (const areaName of getFoodAreaNames(food)) {
    if (areaName !== "エリア確認中") areas.add(areaName);
  }
  return {
    shopCount: shops.size,
    areaCount: areas.size,
    shopLabel: shops.size <= 1 ? t("foodDetail.shopCountSingle") : t("foodDetail.shopCount", { count: shops.size }),
    areaLabel: areas.size === 0 ? t("foodDetail.areaChecking") : areas.size === 1 ? t("foodDetail.areaCountSingle") : t("foodDetail.areaCount", { count: areas.size })
  };
}

function getStoredSpendAmount(food: FoodWithRelations) {
  return food.priceMin ?? food.price ?? food.locations?.find((location) => location.price)?.price;
}

function getCanonicalActionFoodId(foods: FoodWithRelations[], logs: ReturnType<typeof useFoodLogs>["logs"], food: FoodWithRelations, status: "eaten") {
  const canonicalKey = getCanonicalFoodKey(food);
  const existing = logs.find((log) => {
    if (log.status !== status) return false;
    const loggedFood = foods.find((candidate) => candidate.id === log.foodId);
    return loggedFood ? getCanonicalFoodKey(loggedFood) === canonicalKey : log.foodId === food.id;
  });
  return existing?.foodId ?? getCanonicalFoodId(foods, food);
}

function categoryAffinityScore(source: FoodCategory, target: FoodCategory) {
  if (source === target) return 30;
  const lightFoods = new Set<FoodCategory>(["drink", "dessert", "snack", "popcorn", "churro"]);
  const mealFoods = new Set<FoodCategory>(["burger", "pizza", "noodle", "rice", "set", "chicken", "kids"]);
  if (lightFoods.has(source) && lightFoods.has(target)) return 10;
  if (mealFoods.has(source) && mealFoods.has(target)) return 8;
  if ((source === "drink" && mealFoods.has(target)) || (mealFoods.has(source) && target === "drink")) return -24;
  return -8;
}

function RelatedRail({
  title,
  foods,
  locale,
  t
}: {
  title: string;
  foods: FoodWithRelations[];
  locale: ReturnType<typeof useLocale>["locale"];
  t: ReturnType<typeof useLocale>["t"];
}) {
  if (foods.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-black text-ink">{title}</h3>
      <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-3">
          {foods.map((food) => {
            const displayName = getFoodNameI18n(food.id, locale, food.name);
            return (
              <Link key={`${title}-${food.id}`} href={`/foods/${food.id}`} className="w-[148px] shrink-0 transition active:scale-[0.99] hover:-translate-y-0.5">
                <div className="h-[104px] overflow-hidden rounded-2xl bg-slate-100">
                  <FoodImage food={food} alt={displayName} className="h-full w-full" />
                </div>
                <div className="mt-2 space-y-1">
                  <p className="line-clamp-2 h-10 break-words text-xs font-black leading-5 text-ink [overflow-wrap:anywhere]">{displayName}</p>
                  <p className="truncate text-xs font-black text-park">{formatPriceI18n(food, locale, t)}</p>
                  <p className="line-clamp-2 h-7 text-[10px] font-bold leading-[0.85rem] text-slate-600">{getFoodAreaSummary(food)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getDisplayLocations(food: FoodWithRelations): FoodLocation[] {
  const locations = food.locations?.filter((location) => location.shopName && location.shopName !== "店舗未確認") ?? [];
  if (locations.length > 0) return locations;
  return [
    {
      id: `${food.id}-fallback-location`,
      foodId: food.id,
      shopId: food.shop.id,
      shopName: food.shop.name,
      areaId: food.area.id,
      areaName: getDisplayLocationAreaName({ areaName: food.area.name, shopName: food.shop.name }, food),
      shopType: food.shop.type,
      price: food.price,
      sourceUrl: food.sourceUrl,
      status: food.status,
      startDate: food.startDate,
      endDate: food.endDate,
      lastCheckedAt: food.lastCheckedAt
    }
  ];
}

function inferDiningType(food: FoodWithRelations): DiningType {
  if (food.shop.type === "cart" || food.shop.type === "wagon") return "food_cart";
  if (food.category === "churro" || food.category === "popcorn" || food.category === "drink" || food.category === "snack") return "takeout";
  if (food.shop.type === "restaurant") return "eat_in";
  return "unknown";
}
