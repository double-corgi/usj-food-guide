import { categoryLabels } from "@/lib/constants";
import { completionByArea, completionByCollection, isEaten, isWanted } from "@/lib/food-utils";
import type { FoodCategory, FoodWithRelations, UserFoodLog } from "@/types/domain";

export type RecommendationReason =
  | "want"
  | "limited"
  | "same-area"
  | "same-category"
  | "walkfood"
  | "popular"
  | "unfinished";

export type FoodRecommendation = {
  food: FoodWithRelations;
  reason: RecommendationReason;
  label: string;
  score: number;
};

export type CollectionMission = {
  id: string;
  label: string;
  href: string;
  eaten: number;
  total: number;
  rate: number;
  remaining: number;
  lead: string;
};

const categoryHrefs: Partial<Record<FoodCategory | "walkfood" | "foodcart" | "seasonal" | "all", string>> = {
  all: "/foods",
  pizza: "/foods?category=pizza",
  burger: "/foods?category=burger",
  noodle: "/foods?category=noodle",
  kids: "/foods?category=kids",
  dessert: "/foods?category=dessert",
  set: "/foods?category=set",
  rice: "/foods?category=rice",
  chicken: "/foods?category=chicken",
  churro: "/foods?category=churro",
  popcorn: "/foods?category=popcorn",
  drink: "/foods?category=drink",
  snack: "/foods?category=snack",
  seasonal: "/foods?category=seasonal",
  walkfood: "/foods?diningType=takeout",
  foodcart: "/foods?diningType=food_cart"
};

export function buildCollectionMissions(foods: FoodWithRelations[], logs: UserFoodLog[]): CollectionMission[] {
  return completionByCollection(foods, logs)
    .map((collection) => {
      const remaining = Math.max(collection.total - collection.eaten, 0);
      return {
        id: collection.id,
        label: collection.label,
        href: categoryHrefs[collection.id as keyof typeof categoryHrefs] ?? "/foods",
        eaten: collection.eaten,
        total: collection.total,
        rate: collection.rate,
        remaining,
        lead: remaining === 0 ? `${collection.label}コンプ済み` : `あと${remaining}件で${collection.label}コンプ`
      };
    })
    .sort(
      (a, b) =>
        Number(a.remaining === 0) - Number(b.remaining === 0) ||
        missionPriority(a.id) - missionPriority(b.id) ||
        b.rate - a.rate ||
        a.remaining - b.remaining ||
        b.total - a.total
    );
}

export function buildAreaMissions(foods: FoodWithRelations[], logs: UserFoodLog[]): CollectionMission[] {
  return completionByArea(foods, logs)
    .filter((area) => area.total > 0)
    .map((area) => {
      const remaining = Math.max(area.total - area.eaten, 0);
      return {
        id: area.id,
        label: area.label,
        href: `/areas/${area.id}`,
        eaten: area.eaten,
        total: area.total,
        rate: area.rate,
        remaining,
        lead: remaining === 0 ? `${area.label}コンプ済み` : `あと${remaining}件で${area.label}コンプ`
      };
    })
    .sort((a, b) => Number(a.remaining === 0) - Number(b.remaining === 0) || b.rate - a.rate || b.total - a.total);
}

export function recommendNextFoods(
  foods: FoodWithRelations[],
  logs: UserFoodLog[],
  options: { baseFood?: FoodWithRelations; areaId?: string; limit?: number; excludeIds?: Iterable<string>; recentIds?: Iterable<string>; displayedIds?: Iterable<string> } = {}
): FoodRecommendation[] {
  const limit = options.limit ?? 6;
  const baseFood = options.baseFood;
  const excludeIds = new Set(options.excludeIds ?? []);
  const recentIds = new Set(options.recentIds ?? []);
  const displayedIds = new Set(options.displayedIds ?? []);
  const newestCheckedAt = Math.max(0, ...foods.map((food) => parseFoodTime(food.lastCheckedAt)));
  const areaRepresentativeIds = buildAreaRepresentativeIds(foods);
  const candidates = foods.filter((food) => food.id !== baseFood?.id && !excludeIds.has(food.id) && !isEaten(logs, food.id) && food.status !== "ended" && food.status !== "inactive");
  const collectionProgress = new Map(completionByCollection(foods, logs).map((collection) => [collection.id, collection]));
  const areaProgress = new Map(completionByArea(foods, logs).map((area) => [area.id, area]));

  const ranked = candidates
    .map((food) => {
      let score = food.confidenceScore ?? 0;
      let reason: RecommendationReason = "popular";
      let label = "候補";
      const categoryProgress = collectionProgress.get(food.category);
      const foodCartProgress = food.diningType === "food_cart" ? collectionProgress.get("foodcart") : undefined;
      const walkFoodProgress = isWalkFood(food) ? collectionProgress.get("walkfood") : undefined;
      const areaMission = areaProgress.get(food.areaId);
      const categoryRemaining = remainingFor(categoryProgress);
      const areaRemaining = remainingFor(areaMission);

      if (isWanted(logs, food.id)) {
        score += 45;
        reason = "want";
        label = "保存済み";
      }
      if (categoryRemaining > 0 && categoryRemaining <= 3) {
        score += 130 - categoryRemaining * 15;
        reason = "unfinished";
        label = `あと${categoryRemaining}件で${categoryProgress?.label ?? categoryLabels[food.category]}コンプ`;
      }
      if (areaRemaining > 0 && areaRemaining <= 3) {
        score += 105 - areaRemaining * 12;
        if (reason !== "unfinished") {
          reason = "same-area";
          label = `あと${areaRemaining}件で${areaMission?.label ?? food.area.name}コンプ`;
        }
      }
      const foodCartRemaining = remainingFor(foodCartProgress);
      const completionGain = completionGainScore(categoryProgress) + completionGainScore(areaMission) + completionGainScore(collectionProgress.get("all"));
      score += completionGain;
      if (completionGain >= 34 && reason === "popular") {
        reason = "unfinished";
        label = "コンプ率アップ";
      }
      if (foodCartRemaining > 0 && foodCartRemaining <= 3) {
        score += 85 - foodCartRemaining * 10;
        if (reason !== "unfinished") {
          reason = "unfinished";
          label = `あと${foodCartRemaining}件でフードカートコンプ`;
        }
      }
      const walkFoodRemaining = remainingFor(walkFoodProgress);
      if (walkFoodRemaining > 0 && walkFoodRemaining <= 3) {
        score += 80 - walkFoodRemaining * 10;
        if (reason !== "unfinished") {
          reason = "walkfood";
          label = `あと${walkFoodRemaining}件で食べ歩きコンプ`;
        }
      }
      if (food.isLimited || food.rarity === "limited" || food.rarity === "event") {
        score += food.endDate ? 100 : 70;
        const keepActionLabel = reason === "want" || reason === "unfinished";
        if (!keepActionLabel) {
          reason = "limited";
          label = limitedLabel(food);
        }
      }
      if (options.areaId && (food.areaId === options.areaId || food.locations?.some((location) => location.areaId === options.areaId))) {
        score += 65;
        reason = reason === "want" ? reason : "same-area";
        label = reason === "want" ? label : "このエリア";
      }
      if (baseFood && food.category === baseFood.category) {
        score += 45;
        reason = reason === "want" ? reason : "same-category";
        label = reason === "want" ? label : `同じ${categoryLabels[food.category]}`;
      }
      if (baseFood && (food.areaId === baseFood.areaId || food.locations?.some((location) => location.areaId === baseFood.areaId))) {
        score += 40;
        reason = reason === "want" ? reason : "same-area";
        label = reason === "want" ? label : "同じエリア";
      }
      if (isWalkFood(food)) {
        score += 30;
        reason = reason === "popular" ? "walkfood" : reason;
        label = reason === "walkfood" ? "食べ歩き" : label;
      }
      if (hasKnownPrice(food)) score += 24;
      if (isRecentlyChecked(food, newestCheckedAt)) score += 18;
      if (areaRepresentativeIds.has(food.id)) score += 18;
      score += Math.min(food.extractionSourceCount ?? 0, 5) * 4;
      if (recentIds.has(food.id)) score -= 42;
      if (displayedIds.has(food.id)) score -= 90;

      return { food, reason, label, score };
    })
    .sort((a, b) => b.score - a.score || statusPriority(a.food) - statusPriority(b.food) || a.food.name.localeCompare(b.food.name, "ja"));

  return diversifyRecommendations(ranked, limit);
}

export function getPopularSearchTerms(foods: FoodWithRelations[]) {
  const fixed = ["ピザ", "バーガー", "キッズ", "スイーツ", "ドリンク", "食べ歩き", "チュリトス", "ポップコーン", "期間限定", "フードカート"];
  const dynamic = Array.from(new Set(foods.flatMap((food) => [categoryLabels[food.category], food.area.name].filter(Boolean)))).slice(0, 8);
  return [...fixed, ...dynamic].slice(0, 12);
}

function missionPriority(id: string) {
  const order = ["pizza", "burger", "noodle", "kids", "drink", "dessert", "set", "churro", "popcorn", "walkfood", "foodcart", "seasonal", "all"];
  const index = order.indexOf(id);
  return index === -1 ? order.length : index;
}

function isWalkFood(food: FoodWithRelations) {
  return (
    food.diningType === "takeout" ||
    food.diningType === "food_cart" ||
    food.category === "churro" ||
    food.category === "popcorn" ||
    food.category === "drink" ||
    food.category === "snack" ||
    food.shop.type === "cart" ||
    food.shop.type === "wagon"
  );
}

function remainingFor(progress?: { total: number; eaten: number }) {
  if (!progress || progress.total === 0) return 0;
  return Math.max(progress.total - progress.eaten, 0);
}

function completionGainScore(progress?: { total: number; eaten: number }) {
  if (!progress || progress.total === 0) return 0;
  const remaining = Math.max(progress.total - progress.eaten, 0);
  if (remaining === 0) return 0;
  return Math.min(55, Math.round(100 / progress.total));
}

function hasKnownPrice(food: FoodWithRelations) {
  return Boolean(food.priceMin ?? food.price ?? food.locations?.find((location) => location.price)?.price);
}

function parseFoodTime(value?: string | null) {
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

function isRecentlyChecked(food: FoodWithRelations, newestCheckedAt: number) {
  const time = parseFoodTime(food.lastCheckedAt);
  if (!time || !newestCheckedAt) return false;
  return newestCheckedAt - time <= 1000 * 60 * 60 * 24 * 45;
}

function buildAreaRepresentativeIds(foods: FoodWithRelations[]) {
  const representatives = new Map<string, FoodWithRelations>();
  for (const food of foods) {
    if (!food.areaId) continue;
    const current = representatives.get(food.areaId);
    if (!current || representativeScore(food) > representativeScore(current)) {
      representatives.set(food.areaId, food);
    }
  }
  return new Set(Array.from(representatives.values()).map((food) => food.id));
}

function representativeScore(food: FoodWithRelations) {
  return (food.confidenceScore ?? 0) + Math.min(food.extractionSourceCount ?? 0, 5) * 12 + (hasKnownPrice(food) ? 20 : 0) + (food.isLimited ? 10 : 0);
}

function diversifyRecommendations(items: FoodRecommendation[], limit: number) {
  const selected: FoodRecommendation[] = [];
  const categoryCount = new Map<FoodCategory, number>();
  const areaCount = new Map<string, number>();
  const selectedIds = new Set<string>();

  for (const item of items) {
    const categoryUsed = categoryCount.get(item.food.category) ?? 0;
    const areaUsed = areaCount.get(item.food.areaId) ?? 0;
    const shouldHoldBack =
      selected.length < Math.min(limit, 4) &&
      ((categoryUsed >= 2 && item.reason !== "limited" && item.reason !== "unfinished") || (areaUsed >= 2 && item.reason === "same-area"));

    if (shouldHoldBack) continue;

    selected.push(item);
    selectedIds.add(item.food.id);
    categoryCount.set(item.food.category, categoryUsed + 1);
    areaCount.set(item.food.areaId, areaUsed + 1);
    if (selected.length >= limit) return selected;
  }

  for (const item of items) {
    if (selectedIds.has(item.food.id)) continue;
    selected.push(item);
    if (selected.length >= limit) break;
  }

  return selected;
}

function limitedLabel(food: FoodWithRelations) {
  if (!food.endDate) return "期間限定";
  const end = new Date(food.endDate);
  if (Number.isNaN(end.getTime())) return "期間限定";
  const now = new Date();
  const days = Math.ceil((end.getTime() - now.getTime()) / 86_400_000);
  if (days <= 0) return "本日終了";
  if (days <= 14) return `あと${days}日`;
  return "期間限定";
}

function statusPriority(food: FoodWithRelations) {
  if (food.isLimited || food.rarity === "limited" || food.rarity === "event") return 0;
  if (food.diningType === "food_cart") return 1;
  if (isWalkFood(food)) return 2;
  return 3;
}
