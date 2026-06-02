import { categoryLabels } from "@/lib/constants";
import { isEaten } from "@/lib/food-utils";
import type { FoodCategory, FoodWithRelations, UserFoodLog } from "@/types/domain";

export type FoodStrategy =
  | "first-visit"
  | "expert"
  | "limited"
  | "value"
  | "social"
  | "rising"
  | "rainy"
  | "family"
  | "solo";

export type FoodValueScore = {
  total: number;
  reasons: string[];
  metrics: {
    recommendation: number;
    taste: number;
    rarity: number;
    volume: number;
    satisfaction: number;
    difficulty: number;
    limitedness: number;
    photo: number;
    waitCost: number;
    price: number;
  };
  stars: {
    recommendation: number;
    taste: number;
    rarity: number;
    volume: number;
    satisfaction: number;
    difficulty: number;
    limitedness: number;
    photo: number;
    waitCost: number;
    price: number;
  };
};

export function getFoodValueScore(food: FoodWithRelations, foods: FoodWithRelations[] = []): FoodValueScore {
  const raw = rawValueScore(food, foods);
  const metrics = buildMetrics(food, foods, raw);
  const total = calibrateTotalScore(food, foods, raw);

  return {
    total,
    reasons: Array.from(new Set(raw.reasons)).slice(0, 3),
    metrics,
    stars: {
      recommendation: toStars(metrics.recommendation),
      taste: toStars(metrics.taste),
      rarity: toStars(metrics.rarity),
      volume: toStars(metrics.volume),
      satisfaction: toStars(metrics.satisfaction),
      difficulty: toStars(metrics.difficulty),
      limitedness: toStars(metrics.limitedness),
      photo: toStars(metrics.photo),
      waitCost: toStars(metrics.waitCost),
      price: toStars(metrics.price)
    }
  };
}

function rawValueScore(food: FoodWithRelations, foods: FoodWithRelations[] = []) {
  const priceKnown = hasKnownPrice(food);
  const limited = isLimited(food);
  const price = getPrimaryPrice(food);
  const areaKnown = !isUnknown(food.area?.name);
  const shopKnown = !isUnknown(food.shop?.name);
  const sourceDepth = Math.min(food.extractionSourceCount ?? 0, 5);
  const sourceTrust = Math.min(food.confidenceScore ?? 0, 100);
  const areaRepresentative = isAreaRepresentative(food, foods);
  const rareCategory = food.category === "churro" || food.category === "popcorn" || food.category === "seasonal";
  const reasons: string[] = [];
  let score = 28;

  if (limited) {
    score += 18;
    reasons.push("限定");
  }
  if (priceKnown) {
    score += 14;
    reasons.push("予算を決めやすい");
  }
  if (price && price <= 1000) {
    score += 8;
    reasons.push("手に取りやすい価格");
  }
  if (areaKnown) score += 8;
  if (shopKnown) score += 6;
  if (areaRepresentative) {
    score += 10;
    reasons.push("エリア代表候補");
  }
  if (rareCategory || food.rarity === "limited" || food.rarity === "event") {
    score += 7;
    reasons.push("レア感");
  }
  if (isWalkable(food)) {
    score += 6;
    reasons.push("食べ歩き向き");
  }
  score += sourceDepth * 3;
  score += Math.round(sourceTrust / 12);
  score += categoryBaseScore(food.category);

  return { score, reasons };
}

function buildMetrics(food: FoodWithRelations, foods: FoodWithRelations[], raw: ReturnType<typeof rawValueScore>) {
  const priceKnown = hasKnownPrice(food);
  const limited = isLimited(food);
  const price = getPrimaryPrice(food);
  const sourceTrust = Math.min(food.confidenceScore ?? 0, 100);
  const rareCategory = food.category === "churro" || food.category === "popcorn" || food.category === "seasonal";
  return {
    recommendation: calibrateTotalScore(food, foods, raw),
    taste: clamp(Math.round(tasteScore(food.category, sourceTrust)), 0, 100),
    rarity: clamp(Math.round((limited ? 70 : 34) + (rareCategory ? 18 : 0) + (food.rarity === "event" ? 12 : 0)), 0, 100),
    volume: clamp(Math.round(volumeScore(food.category)), 0, 100),
    satisfaction: clamp(Math.round((priceKnown ? 58 : 42) + sourceTrust / 4 + categoryBaseScore(food.category)), 0, 100),
    difficulty: clamp(Math.round((limited ? 60 : 30) + (food.diningType === "food_cart" ? 10 : 0) + (food.status === "ended" ? 28 : 0)), 0, 100),
    limitedness: clamp(Math.round((limited ? 86 : 28) + (food.rarity === "event" ? 12 : 0) + (food.endDate ? 8 : 0)), 0, 100),
    photo: clamp(Math.round(socialBuzzScore(food) + (limited ? 18 : 0) + (food.images.length > 0 ? 34 : 18)), 0, 100),
    waitCost: clamp(Math.round(waitCostScore(food)), 0, 100),
    price: clamp(Math.round(priceValueScore(price)), 0, 100)
  };
}

function calibrateTotalScore(food: FoodWithRelations, foods: FoodWithRelations[], raw: ReturnType<typeof rawValueScore>) {
  if (foods.length < 20) return clamp(Math.round(raw.score), 0, 97);

  const ranked = foods
    .map((candidate) => ({ id: candidate.id, raw: rawValueScore(candidate, foods).score }))
    .sort((a, b) => b.raw - a.raw || a.id.localeCompare(b.id));
  const rank = ranked.findIndex((candidate) => candidate.id === food.id);
  if (rank < 0) return clamp(Math.round(raw.score), 0, 97);
  if (rank < 2) return 100;
  if (rank < 10) return 99 - Math.floor((rank - 2) / 2);
  if (rank < 20) return 94 - Math.floor((rank - 10) / 2);

  const min = ranked[ranked.length - 1]?.raw ?? raw.score;
  const max = ranked[20]?.raw ?? ranked[0]?.raw ?? raw.score;
  const normalized = max === min ? 0.5 : (raw.score - min) / (max - min);
  return clamp(Math.round(45 + normalized * 44), 45, 89);
}

export function rankFoodsByStrategy(
  foods: FoodWithRelations[],
  strategy: FoodStrategy,
  logs: UserFoodLog[] = [],
  limit = 10,
  excludeIds: Iterable<string> = []
) {
  const excluded = new Set(excludeIds);
  return foods
    .filter((food) => !excluded.has(food.id) && food.status !== "inactive")
    .map((food) => ({ food, score: strategyScore(food, foods, strategy, logs) }))
    .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name, "ja"))
    .slice(0, limit)
    .map((item) => item.food);
}

export function strategyLabel(strategy: FoodStrategy) {
  const labels: Record<FoodStrategy, string> = {
    "first-visit": "初めてならこれ",
    expert: "おすすめ",
    limited: "限定フード",
    value: "コスパ最強",
    social: "SNSで人気",
    rising: "今週急上昇",
    rainy: "雨の日おすすめ",
    family: "子供連れおすすめ",
    solo: "一人USJおすすめ"
  };
  return labels[strategy];
}

export function valueReason(food: FoodWithRelations, strategy?: FoodStrategy) {
  if (strategy === "limited" && isLimited(food)) return "限定";
  if (strategy === "value" && hasKnownPrice(food)) return "コスパ";
  if (strategy === "family" && food.category === "kids") return "子供向け";
  if (strategy === "rainy" && food.diningType === "eat_in") return "店内で選びやすい";
  if (strategy === "solo" && isWalkable(food)) return "一人でも選びやすい";
  const score = getFoodValueScore(food);
  return score.reasons[0] ?? categoryLabels[food.category] ?? "おすすめ";
}

export function strategyStarHighlights(food: FoodWithRelations, strategy?: FoodStrategy) {
  const stars = getFoodValueScore(food).stars;
  if (strategy === "expert") return [{ label: "味", value: stars.taste }, { label: "満足度", value: stars.satisfaction }];
  if (strategy === "limited") return [{ label: "限定性", value: stars.limitedness }, { label: "希少性", value: stars.rarity }];
  if (strategy === "value") return [{ label: "価格", value: stars.price }, { label: "ボリューム", value: stars.volume }];
  if (strategy === "social") return [{ label: "写真映え", value: stars.photo }, { label: "満足度", value: stars.satisfaction }];
  if (strategy === "rainy") return [{ label: "買いやすさ", value: stars.waitCost }, { label: "満足度", value: stars.satisfaction }];
  if (strategy === "family") return [{ label: "満足度", value: stars.satisfaction }, { label: "価格", value: stars.price }];
  if (strategy === "solo") return [{ label: "買いやすさ", value: stars.waitCost }, { label: "価格", value: stars.price }];
  return [{ label: "味", value: stars.taste }, { label: "満足度", value: stars.satisfaction }];
}

export function scoreFormulaText() {
  return "限定感、価格、エリア代表性、レア感、食べ歩きしやすさ、情報の確かさを総合し、全200商品の中で相対評価しています。100点は上位1%、95点以上は上位5%、90点以上は上位10%に絞っています。";
}

export function scoreReasonText(score: FoodValueScore) {
  const high: string[] = [];
  const low: string[] = [];
  const entries = [
    ["味", score.stars.taste],
    ["満足度", score.stars.satisfaction],
    ["希少性", score.stars.rarity],
    ["限定性", score.stars.limitedness],
    ["ボリューム", score.stars.volume],
    ["写真映え", score.stars.photo],
    ["買いやすさ", score.stars.waitCost],
    ["価格", score.stars.price],
    ["入手難度", score.stars.difficulty]
  ] as const;

  for (const [label, value] of entries) {
    if (value >= 4) high.push(`${label}が高い`);
    if (value <= 2) low.push(`${label}は控えめ`);
  }

  return {
    high: high.slice(0, 3),
    low: low.slice(0, 3)
  };
}

export function hasKnownPrice(food: FoodWithRelations) {
  return Boolean(food.priceMin ?? food.price ?? food.locations?.find((location) => location.price)?.price);
}

export function getPrimaryPrice(food: FoodWithRelations) {
  return food.priceMin ?? food.price ?? food.locations?.find((location) => location.price)?.price;
}

export function isLimited(food: FoodWithRelations) {
  return Boolean(food.isLimited || food.endDate || food.rarity === "limited" || food.rarity === "event");
}

export function isWalkable(food: FoodWithRelations) {
  return (
    food.diningType === "takeout" ||
    food.diningType === "food_cart" ||
    food.shop.type === "cart" ||
    food.shop.type === "wagon" ||
    food.category === "churro" ||
    food.category === "popcorn" ||
    food.category === "drink" ||
    food.category === "snack"
  );
}

function strategyScore(food: FoodWithRelations, foods: FoodWithRelations[], strategy: FoodStrategy, logs: UserFoodLog[]) {
  const base = getFoodValueScore(food, foods).total;
  const eatenPenalty = isEaten(logs, food.id) ? -34 : 18;
  const price = getPrimaryPrice(food);
  let score = base + eatenPenalty;

  if (strategy === "first-visit") {
    score += isAreaRepresentative(food, foods) ? 26 : 0;
    score += food.category === "churro" || food.category === "drink" || food.category === "burger" ? 12 : 0;
  }
  if (strategy === "expert") {
    score += isLimited(food) ? 18 : 0;
    score += food.rarity === "event" || food.rarity === "limited" ? 14 : 0;
    score += Math.min(food.extractionSourceCount ?? 0, 5) * 5;
  }
  if (strategy === "limited") score += isLimited(food) ? 46 : -30;
  if (strategy === "value") {
    score += hasKnownPrice(food) ? 28 : -24;
    if (price) score += Math.max(0, 24 - Math.floor(price / 180));
  }
  if (strategy === "social") {
    score += socialBuzzScore(food);
  }
  if (strategy === "rising") {
    score += Date.parse(food.lastCheckedAt ?? "") > Date.now() - 1000 * 60 * 60 * 24 * 60 ? 28 : 0;
    score += isLimited(food) ? 14 : 0;
  }
  if (strategy === "rainy") {
    score += food.diningType === "eat_in" || food.diningType === "both" ? 28 : -8;
    score += food.shop.type === "restaurant" ? 18 : 0;
  }
  if (strategy === "family") {
    score += food.category === "kids" ? 42 : 0;
    score += food.area.name.includes("ワンダーランド") ? 22 : 0;
    score += food.category === "dessert" || food.category === "drink" ? 8 : 0;
  }
  if (strategy === "solo") {
    score += isWalkable(food) ? 32 : 0;
    score += food.category === "drink" || food.category === "churro" || food.category === "snack" ? 16 : 0;
  }
  return score;
}

function isAreaRepresentative(food: FoodWithRelations, foods: FoodWithRelations[]) {
  if (!food.areaId) return false;
  const sameArea = foods.filter((candidate) => candidate.areaId === food.areaId);
  if (sameArea.length === 0) return false;
  const sorted = sameArea
    .map((candidate) => ({ candidate, score: (candidate.confidenceScore ?? 0) + Math.min(candidate.extractionSourceCount ?? 0, 5) * 10 + (isLimited(candidate) ? 15 : 0) }))
    .sort((a, b) => b.score - a.score);
  return sorted.slice(0, 3).some((item) => item.candidate.id === food.id);
}

function socialBuzzScore(food: FoodWithRelations) {
  let score = 0;
  if (/マリオ|ミニオン|ハリー|ポッター|ジョーズ|キティ|クロミ|ピカチュウ|ゼニガメ|ドンキー|フリーレン|コナン/i.test(food.name)) score += 28;
  if (food.isLimited || food.rarity === "event") score += 22;
  if (food.category === "churro" || food.category === "dessert" || food.category === "drink") score += 12;
  return score;
}

function categoryBaseScore(category: FoodCategory) {
  const scores: Partial<Record<FoodCategory, number>> = {
    churro: 8,
    popcorn: 7,
    drink: 7,
    dessert: 7,
    burger: 6,
    pizza: 6,
    kids: 5,
    set: 5,
    rice: 4,
    noodle: 4
  };
  return scores[category] ?? 3;
}

function volumeScore(category: FoodCategory) {
  if (category === "set" || category === "chicken" || category === "rice" || category === "burger") return 82;
  if (category === "pizza" || category === "noodle" || category === "kids") return 68;
  if (category === "churro" || category === "dessert" || category === "popcorn") return 46;
  if (category === "drink") return 30;
  return 52;
}

function tasteScore(category: FoodCategory, sourceTrust: number) {
  const base: Partial<Record<FoodCategory, number>> = {
    set: 76,
    burger: 74,
    pizza: 72,
    noodle: 72,
    rice: 70,
    dessert: 76,
    churro: 72,
    popcorn: 68,
    drink: 66,
    kids: 66
  };
  return (base[category] ?? 64) + sourceTrust / 8;
}

function waitCostScore(food: FoodWithRelations) {
  let score = 60;
  if (isWalkable(food)) score += 18;
  if (food.shop.type === "restaurant") score -= 8;
  if (isLimited(food)) score -= 10;
  if (food.status === "ended") score -= 30;
  return score;
}

function priceValueScore(price?: number) {
  if (!price) return 38;
  if (price <= 700) return 90;
  if (price <= 1000) return 78;
  if (price <= 1500) return 64;
  if (price <= 2200) return 50;
  if (price <= 3200) return 38;
  return 28;
}

function toStars(score: number) {
  return clamp(Math.round(score / 20), 1, 5);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isUnknown(value?: string | null) {
  return !value || /未確認|不明|unknown/i.test(value);
}
