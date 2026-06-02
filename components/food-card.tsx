import Link from "next/link";
import { Flag, MapPin } from "lucide-react";
import { formatFoodPrice, formatPrice, getSalePeriodLabel, getSaleStatus, getSaleStatusLabel, getSaleStatusTone, getSaleUrgencyLabel, isEaten, isWanted } from "@/lib/food-utils";
import type { FoodWithRelations, UserFoodLog } from "@/types/domain";
import { FoodImage } from "@/components/food-image";

export function FoodCard({
  food,
  allFoods,
  logs,
  onToggleEaten,
  onToggleWant
}: {
  food: FoodWithRelations;
  allFoods?: FoodWithRelations[];
  logs: UserFoodLog[];
  onToggleEaten: (foodId: string) => void;
  onToggleWant: (foodId: string) => void;
}) {
  const locations = getDisplayLocations(food);
  const primaryLocation = locations[0];
  const knownPrice = hasPrice(food);
  const eaten = isEaten(logs, food.id);
  const wanted = isWanted(logs, food.id);
  const urgencyLabel = getSaleUrgencyLabel(food);
  const rankedFoods = [...(allFoods ?? [])].sort(
    (a, b) => ((b.extractionSourceCount ?? 0) * 10 + (b.confidenceScore ?? 0)) - ((a.extractionSourceCount ?? 0) * 10 + (a.confidenceScore ?? 0))
  );
  const rankIndex = rankedFoods.findIndex((candidate) => candidate.id === food.id);
  const recommended = !eaten && rankIndex >= 0 && rankIndex < Math.ceil(Math.max(rankedFoods.length, 1) * 0.1);
  const state = eaten ? cardStates.eaten : recommended ? cardStates.recommended : cardStates.uneaten;
  const badges = getCardBadges({ food, recommended });

  return (
    <article data-food-card data-food-name={food.name} className={`group relative h-[460px] min-w-0 overflow-hidden rounded-[1.35rem] border bg-white/95 shadow-[0_12px_30px_rgba(15,23,42,0.07)] backdrop-blur transition duration-200 active:scale-[0.99] md:hover:-translate-y-1 md:hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)] ${state.borderClass} ${getSaleStatus(food) === "ended" ? "opacity-75 grayscale" : ""}`}>
      <Link href={`/foods/${food.id}`} className="flex h-full min-w-0 flex-col">
        <div className="relative h-[232px] shrink-0 overflow-hidden bg-slate-100">
          <FoodImage food={food} className="h-full w-full transition duration-300 group-hover:scale-105" />
          <div className="absolute left-3 top-3 flex max-h-16 max-w-[66%] flex-wrap gap-2 overflow-hidden">
            {badges.map((badge) => (
              <span key={badge.label} className={`rounded-full px-2.5 py-1 text-[11px] font-black shadow-sm ${badge.className}`}>
                {badge.label}
              </span>
            ))}
          </div>
          {wanted ? (
            <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-black text-white shadow-sm">🏁 次回食べたい</span>
          ) : null}
        </div>
        <div className="flex h-[178px] min-w-0 flex-col px-3 py-3">
          <div className="min-w-0">
            <p data-food-card-title className="line-clamp-4 h-[5rem] break-words text-[13px] font-black leading-[1.25rem] text-ink [overflow-wrap:anywhere] group-hover:text-park sm:text-[14px]">
              {food.name}
            </p>
            <p data-food-card-price className={`mt-1 h-7 truncate ${knownPrice ? "text-lg font-black leading-7 text-park" : "text-xs font-bold leading-7 text-slate-600"}`}>
              {displayPrice(food)}
            </p>
            <p className="line-clamp-2 h-9 text-[11px] font-black leading-[1.05rem] text-slate-500">
              <span className={`mr-1 rounded-full px-2 py-0.5 ${getSaleStatusTone(food)}`}>{urgencyLabel ?? getSaleStatusLabel(food)}</span>
              {getSalePeriodLabel(food)}
            </p>
          </div>
          <p className="mt-auto flex h-8 min-w-0 items-start gap-1.5 text-xs font-bold leading-4 text-slate-600">
            <MapPin size={13} aria-hidden className="shrink-0" />
            <span className="line-clamp-2" title={`${primaryLocation?.shopName ?? food.shop.name} / ${primaryLocation?.areaName ?? food.area.name}`}>
              {primaryLocation?.areaName ?? food.area.name}
            </span>
          </p>
        </div>
      </Link>
      <div data-food-card-actions className="absolute inset-x-0 bottom-0 z-10 grid h-[50px] grid-cols-[1fr_48px] gap-2 border-t border-slate-100 bg-white/95 px-3 py-2 backdrop-blur">
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleEaten(food.id);
          }}
          className={`inline-flex h-9 items-center justify-center rounded-xl text-xs font-black transition active:scale-95 ${
            eaten ? "bg-emerald-600 text-white" : "bg-ink text-white"
          }`}
        >
          {eaten ? "GET済み" : "食べた"}
        </button>
        <button
          type="button"
          aria-label={wanted ? "次回食べたいから外す" : "次回食べたいにする"}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleWant(food.id);
          }}
          className={`grid h-9 w-full place-items-center rounded-xl border transition active:scale-95 ${
            wanted ? "border-amber-300 bg-amber-400 text-white" : "border-slate-200 bg-white text-slate-500"
          }`}
        >
          <Flag size={16} aria-hidden fill={wanted ? "currentColor" : "none"} />
        </button>
      </div>
    </article>
  );
}

const cardStates = {
  uneaten: {
    label: "未食",
    borderClass: "border-slate-900/12 hover:border-slate-900/30",
    badgeClass: "bg-slate-900/90"
  },
  eaten: {
    label: "食べた",
    borderClass: "border-emerald-300 hover:border-emerald-500",
    badgeClass: "bg-emerald-600"
  },
  recommended: {
    label: "おすすめ",
    borderClass: "border-amber-300 hover:border-amber-500",
    badgeClass: "bg-amber-500"
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
      areaName: food.area.name,
      shopType: food.shop.type,
      status: food.status,
      lastCheckedAt: food.lastCheckedAt
    }
  ];
}

function hasPrice(food: FoodWithRelations) {
  return Boolean(food.priceMin ?? food.price ?? food.locations?.find((location) => location.price)?.price);
}

function displayPrice(food: FoodWithRelations) {
  const locationPrice = food.locations?.find((location) => location.price)?.price;
  if (!food.price && !food.priceMin && locationPrice) return formatPrice(locationPrice);
  return hasPrice(food) ? formatFoodPrice(food) : "¥ --";
}

function getCardBadges({
  food,
  recommended
}: {
  food: FoodWithRelations;
  recommended: boolean;
}) {
  const badges: Array<{ label: string; className: string }> = [];
  const urgencyLabel = getSaleUrgencyLabel(food);
  if (urgencyLabel && getSaleStatus(food) === "active") badges.push({ label: urgencyLabel, className: "bg-berry text-white" });
  if (food.isLimited) badges.push({ label: "限定", className: "animate-soft-glow bg-berry text-white" });
  if (recommended) badges.push({ label: "おすすめ", className: "bg-orange-500 text-white" });
  if (getSaleStatus(food) === "ended") badges.unshift({ label: "販売終了", className: "bg-slate-800/88 text-white" });
  if (getSaleStatus(food) === "upcoming") badges.unshift({ label: "近日販売", className: "bg-sky-600 text-white" });
  return badges.slice(0, 2);
}
