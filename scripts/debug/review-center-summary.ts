import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";
import type { FoodCategory } from "../../types/domain";

type Bucket =
  | "チュリトス"
  | "ピザ"
  | "バーガー"
  | "プレート"
  | "パスタ"
  | "ライス"
  | "キッズ"
  | "ドリンク"
  | "デザート"
  | "その他";

const outputDir = path.join(process.cwd(), "scripts", "output");
const datasetPath = path.join(outputDir, "foods.generated.json");
const reportPath = path.join(outputDir, "review-center-summary.generated.json");

const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8")) as GeneratedDataset;
const foods = dataset.foods.filter(
  (food) => food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden,
);
const duplicateCandidates = buildDuplicateCandidates(foods);
const duplicateFoodIds = new Set(duplicateCandidates.flatMap((candidate) => [candidate.food.id, candidate.other.id]));
const imageCount = foods.filter(hasPublicImage).length;
const placeholderCount = foods.filter((food) => primaryImage(food).startsWith("/placeholders/")).length;
const priceKnown = foods.filter(hasKnownPrice).length;
const sourceKnown = foods.filter((food) => Boolean(food.sourceUrl)).length;
const shopKnown = foods.filter((food) => !isUnknownName(food.shop?.name)).length;
const areaKnown = foods.filter((food) => !isUnknownName(food.area?.name)).length;
const highPriorityOpen = foods.filter(
  (food) =>
    reviewPriorityScore(food, duplicateFoodIds.has(food.id)) >= 70 &&
    (!hasKnownPrice(food) ||
      isUnknownName(food.shop?.name) ||
      isUnknownName(food.area?.name) ||
      !food.sourceUrl ||
      duplicateFoodIds.has(food.id)),
).length;

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    foodCount: foods.length,
    imageCount,
    placeholderCount,
    sourceUrlRate: percent(sourceKnown, foods.length),
    priceRate: percent(priceKnown, foods.length),
    shopRate: percent(shopKnown, foods.length),
    areaRate: percent(areaKnown, foods.length),
    duplicateCandidateCount: duplicateCandidates.length,
    highPriorityOpen,
  },
  categoryStats: buildCategoryStats(foods),
  duplicateCandidates: duplicateCandidates.slice(0, 40).map((candidate) => ({
    foodId: candidate.food.id,
    foodName: candidate.food.name,
    otherFoodId: candidate.other.id,
    otherFoodName: candidate.other.name,
    reason: candidate.reason,
  })),
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

function hasKnownPrice(food: GeneratedFood) {
  return Boolean(food.price ?? food.priceMin ?? food.price_min ?? food.locations?.find((location) => location.price)?.price);
}

function hasPublicImage(food: GeneratedFood) {
  const image = primaryImage(food);
  return Boolean(image) && !image.startsWith("/placeholders/");
}

function primaryImage(food: GeneratedFood) {
  return food.imageUrl ?? food.representativeImageUrl ?? food.images?.find((image) => image.enabled)?.imageUrl ?? "";
}

function buildCategoryStats(foods: GeneratedFood[]) {
  const stats = new Map<Bucket, { total: number; priceKnown: number; sourceKnown: number; shopKnown: number; areaKnown: number }>();
  for (const food of foods) {
    const bucket = bucketFor(food.category);
    const current = stats.get(bucket) ?? { total: 0, priceKnown: 0, sourceKnown: 0, shopKnown: 0, areaKnown: 0 };
    current.total += 1;
    if (hasKnownPrice(food)) current.priceKnown += 1;
    if (food.sourceUrl) current.sourceKnown += 1;
    if (!isUnknownName(food.shop?.name)) current.shopKnown += 1;
    if (!isUnknownName(food.area?.name)) current.areaKnown += 1;
    stats.set(bucket, current);
  }
  return Array.from(stats.entries()).map(([bucket, stat]) => ({
    bucket,
    total: stat.total,
    priceRate: percent(stat.priceKnown, stat.total),
    sourceUrlRate: percent(stat.sourceKnown, stat.total),
    shopRate: percent(stat.shopKnown, stat.total),
    areaRate: percent(stat.areaKnown, stat.total),
  }));
}

function buildDuplicateCandidates(foods: GeneratedFood[]) {
  const candidates: Array<{ food: GeneratedFood; other: GeneratedFood; reason: string }> = [];
  for (let i = 0; i < foods.length; i += 1) {
    for (let j = i + 1; j < foods.length; j += 1) {
      const a = foods[i];
      const b = foods[j];
      if (a.category !== b.category) continue;
      const sameImage = Boolean(primaryImage(a) && primaryImage(a) === primaryImage(b));
      const sameSource = Boolean(a.sourceUrl && a.sourceUrl === b.sourceUrl);
      const sameShop = a.shop?.name === b.shop?.name && !isUnknownName(a.shop?.name);
      const nameSimilarity = similarityKey(a.name) === similarityKey(b.name) || isNearName(a.name, b.name);
      if (!nameSimilarity && !sameImage) continue;
      candidates.push({
        food: a,
        other: b,
        reason: [
          nameSimilarity ? "商品名類似" : undefined,
          sameImage ? "同画像" : undefined,
          sameShop ? "同店舗" : undefined,
          sameSource ? "同source_url" : undefined,
        ]
          .filter(Boolean)
          .join(" / "),
      });
    }
  }
  return candidates.filter((candidate) => candidate.reason);
}

function reviewPriorityScore(food: GeneratedFood, duplicateCandidate: boolean) {
  let score = 0;
  if (food.sourceUrl) score += 25;
  if (hasPublicImage(food)) score += 20;
  if (!hasKnownPrice(food)) score += 25;
  if (["drink", "dessert", "burger", "set", "rice", "noodle", "pizza", "kids", "churro"].includes(food.category)) score += 15;
  if (duplicateCandidate) score += 15;
  if (!isUnknownName(food.shop?.name)) score += 5;
  if (!isUnknownName(food.area?.name)) score += 5;
  return Math.min(score, 100);
}

function similarityKey(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[〜~\-・!！?？™®©()（）【】「」『』、，,\s]/g, "")
    .replace(/セット|プレート|マグカップ付き|スプーン付き|コースターセット/g, "");
}

function isNearName(a: string, b: string) {
  const left = similarityKey(a);
  const right = similarityKey(b);
  if (!left || !right || left.length < 6 || right.length < 6) return false;
  return left.includes(right) || right.includes(left);
}

function isUnknownName(value?: string) {
  return !value || /未確認|不明|unknown/i.test(value);
}

function bucketFor(category: FoodCategory): Bucket {
  if (category === "churro") return "チュリトス";
  if (category === "pizza") return "ピザ";
  if (category === "burger") return "バーガー";
  if (category === "set" || category === "chicken") return "プレート";
  if (category === "noodle") return "パスタ";
  if (category === "rice") return "ライス";
  if (category === "kids") return "キッズ";
  if (category === "drink") return "ドリンク";
  if (category === "dessert") return "デザート";
  return "その他";
}

function percent(numerator: number, denominator: number) {
  return `${Math.round((numerator / Math.max(denominator, 1)) * 1000) / 10}%`;
}
