import Link from "next/link";
import { MapPin } from "lucide-react";
import { getCanonicalFoodId, getCanonicalFoodKey, getDisplayLocationAreaName, getFoodAreaDisplay, getSaleStatus, isEatenCanonical } from "@/lib/food-utils";
import { tAreaName } from "@/lib/i18n/area-name";
import { formatPriceI18n } from "@/lib/i18n/format-price";
import { getFoodNameI18n } from "@/lib/i18n/name-translations";
import { getUrgencyLabelI18n } from "@/lib/i18n/sale-label-utils";
import { useLocale } from "@/lib/i18n/use-locale";
import type { FoodWithRelations, UserFoodLog } from "@/types/domain";
import { FoodImage } from "@/components/food-image";

export function FoodCard({
  food,
  allFoods,
  logs,
  onToggleEaten
}: {
  food: FoodWithRelations;
  allFoods?: FoodWithRelations[];
  logs: UserFoodLog[];
  onToggleEaten: (foodId: string, spentAmount?: number) => void;
}) {
  const { locale, t } = useLocale();
  const locations = getDisplayLocations(food);
  const primaryLocation = locations[0];
  const areaDisplay = getFoodAreaDisplay(food);
  const areaSummary = getTranslatedAreaSummary(areaDisplay, t);
  const knownPrice = hasPrice(food);
  const canonicalFoods = allFoods ?? [food];
  const eatenActionFoodId = getCanonicalActionFoodId(canonicalFoods, logs, food, "eaten");
  const eaten = isEatenCanonical(canonicalFoods, logs, food);
  const eatToggleFoodId = eatenActionFoodId;
  const state = eaten ? cardStates.eaten : cardStates.uneaten;
  const badges = getCardBadges({ food, t });
  const displayName = getFoodNameI18n(food.id, locale, food.name);

  return (
    <article data-food-card data-food-name={food.name} className={`group relative min-w-0 overflow-hidden rounded-[1.25rem] bg-white pb-[50px] ring-1 ring-slate-200/70 transition duration-200 active:scale-[0.99] md:hover:-translate-y-0.5 ${state.borderClass} ${getSaleStatus(food) === "ended" ? "opacity-75 grayscale" : ""}`}>
      <Link href={`/foods/${food.id}`} className="flex min-w-0 flex-col">
        <div className="relative aspect-square shrink-0 overflow-hidden bg-white">
          <FoodImage food={food} alt={displayName} className="h-full w-full transition duration-300 group-hover:scale-105" variant="contain" />
          <div className="absolute left-3 top-3 flex max-h-8 max-w-[68%] flex-wrap gap-2 overflow-hidden">
            {badges.map((badge) => (
              <span key={badge.label} className={`rounded-full px-2.5 py-1 text-[11px] font-black ${badge.className}`}>
                {badge.label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex min-h-[160px] min-w-0 flex-col px-3 py-3">
          <div className="min-w-0">
            <p data-food-card-title className="line-clamp-3 h-[3.9rem] break-words text-[14px] font-black leading-[1.3rem] text-ink [overflow-wrap:anywhere] group-hover:text-park sm:text-[15px]">
              {displayName}
            </p>
            <p data-food-card-price className={`mt-2 h-7 truncate ${knownPrice ? "text-lg font-black leading-7 text-park" : "text-xs font-bold leading-7 text-slate-500"}`}>
              {displayPrice(food, locale, t)}
            </p>
          </div>
          <p data-food-card-area className="mt-auto flex h-8 min-w-0 items-start gap-1.5 text-xs font-bold leading-4 text-slate-500">
            <MapPin size={13} aria-hidden className="shrink-0" />
            <span className="line-clamp-2 break-words [overflow-wrap:anywhere]" title={`${primaryLocation?.shopName ?? food.shop.name} / ${areaDisplay.areas.map((areaName) => tAreaName(areaName, t)).join(" / ")}`}>
              {areaSummary}
            </span>
          </p>
        </div>
      </Link>
      <div data-food-card-actions className="absolute inset-x-0 bottom-0 z-10 grid h-[50px] border-t border-slate-100 bg-white px-3 py-2">
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleEaten(eatToggleFoodId, getStoredSpendAmount(food));
          }}
          className={`inline-flex h-9 items-center justify-center rounded-full text-xs font-black transition active:scale-95 ${
            eaten ? "bg-park text-white" : "bg-ink text-white"
          }`}
        >
          {eaten ? t("foodCard.eatenDone") : t("foodCard.markEaten")}
        </button>
      </div>
    </article>
  );
}

function getTranslatedAreaSummary(areaDisplay: ReturnType<typeof getFoodAreaDisplay>, t: ReturnType<typeof useLocale>["t"]) {
  const visibleAreas = areaDisplay.visibleAreas.map((areaName) => tAreaName(areaName, t));
  return `${visibleAreas.join(" / ")}${areaDisplay.hiddenCount > 0 ? ` ${t("foodCard.moreAreas", { count: areaDisplay.hiddenCount })}` : ""}`;
}

const cardStates = {
  uneaten: {
    borderClass: "hover:ring-slate-300"
  },
  eaten: {
    borderClass: "ring-park/20 hover:ring-park/35"
  }
};

function getDisplayLocations(food: FoodWithRelations) {
  const locations = food.locations?.filter((location) => location.shopName && location.shopName !== "店舗未確認") ?? [];
  if (locations.length > 0) return locations;
  return [
    {
      id: `${food.id}-fallback-location`,
      foodId: food.id,
      shopName: food.shop.name,
      areaId: food.area.id,
      areaName: getDisplayLocationAreaName({ areaName: food.area.name, shopName: food.shop.name }, food),
      shopType: food.shop.type,
      status: food.status,
      lastCheckedAt: food.lastCheckedAt
    }
  ];
}

function hasPrice(food: FoodWithRelations) {
  return Boolean(food.priceMin ?? food.price ?? food.locations?.find((location) => location.price)?.price);
}

function displayPrice(food: FoodWithRelations, locale: ReturnType<typeof useLocale>["locale"], t: ReturnType<typeof useLocale>["t"]) {
  const locationPrice = food.locations?.find((location) => location.price)?.price;
  if (!food.price && !food.priceMin && locationPrice) return formatPriceI18n({ price: locationPrice }, locale, t);
  return hasPrice(food) ? formatPriceI18n(food, locale, t) : t("foods.priceUnknown");
}

function getStoredSpendAmount(food: FoodWithRelations) {
  return food.priceMin ?? food.price ?? food.locations?.find((location) => location.price)?.price;
}

function getCanonicalActionFoodId(foods: FoodWithRelations[], logs: UserFoodLog[], food: FoodWithRelations, status: "eaten") {
  const canonicalKey = getCanonicalFoodKey(food);
  const existing = logs.find((log) => {
    if (log.status !== status) return false;
    const loggedFood = foods.find((candidate) => candidate.id === log.foodId);
    return loggedFood ? getCanonicalFoodKey(loggedFood) === canonicalKey : log.foodId === food.id;
  });
  return existing?.foodId ?? getCanonicalFoodId(foods, food);
}

function getCardBadges({
  food,
  t
}: {
  food: FoodWithRelations;
  t: ReturnType<typeof useLocale>["t"];
}) {
  const badges: Array<{ label: string; className: string }> = [];
  const urgencyLabel = getUrgencyLabelI18n(food, t);
  if (urgencyLabel && getSaleStatus(food) === "active") badges.push({ label: urgencyLabel, className: "bg-berry text-white" });
  if (food.isLimited) badges.push({ label: t("foods.badgeLimited"), className: "animate-soft-glow bg-berry text-white" });
  if (getSaleStatus(food) === "ended") badges.unshift({ label: t("common.ended"), className: "bg-slate-800/88 text-white" });
  if (getSaleStatus(food) === "upcoming") badges.unshift({ label: t("foods.badgeUpcoming"), className: "bg-sun text-ink" });
  return badges.slice(0, 2);
}
