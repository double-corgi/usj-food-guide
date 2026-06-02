import fs from "node:fs";
import path from "node:path";
import { getFoodImage } from "../../lib/utils/image";
import type { FoodCategory } from "../../types/domain";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";

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

const outputPath = path.join(process.cwd(), "scripts", "output", "data-quality-review.generated.json");
const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "output", "foods.generated.json"), "utf8")) as GeneratedDataset;
const manualReviewPath = path.join(process.cwd(), "scripts", "output", "manual-price-decisions.json");
const manualDecisions = readJson<Record<string, ManualDecision>>(manualReviewPath, {});

const foods = dataset.foods.filter((food) => food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden);
const duplicateCandidates = buildDuplicateCandidates(foods);
const duplicateFoodIds = new Set(duplicateCandidates.flatMap((candidate) => [candidate.food.id, candidate.other.id]));
const priceKnown = foods.filter(hasKnownPrice).length;
const priceUnknown = foods.length - priceKnown;
const imageCount = foods.filter(hasPublicImage).length;
const placeholderCount = foods.filter((food) => primaryImage(food).startsWith("/placeholders/")).length;
const sourceMissing = foods.filter((food) => !food.sourceUrl).length;
const shopUnknown = foods.filter((food) => isUnknownName(food.shop.name)).length;
const areaUnknown = foods.filter((food) => isUnknownName(food.area.name)).length;
const categoryPending = foods.filter((food) => food.category === "unknown" || bucketFor(food.category) === "その他").length;
const manualUnconfirmable = foods.filter((food) => manualDecisions[food.id]?.status === "unconfirmable").length;
const priceReviewed = Math.min(priceKnown + manualUnconfirmable, foods.length);
const priceReviewOpen = Math.max(foods.length - priceReviewed, 0);
const priceSourceStats = buildPriceSourceStats(foods);
const highPriorityOpen = foods.filter(
  (food) =>
    priceNeedsReview(food) ||
    isUnknownName(food.shop.name) ||
    isUnknownName(food.area.name) ||
    food.category === "unknown" ||
    !food.sourceUrl
).length;

const report = {
  generatedAt: new Date().toISOString(),
  foodTotal: foods.length,
  imageTotal: imageCount,
  placeholderCount,
  priceKnown,
  priceUnknown,
  priceRate: percent(priceKnown, foods.length),
  priceReviewed,
  priceReviewOpen,
  priceReviewRate: percent(priceReviewed, foods.length),
  sourceUrlSet: foods.length - sourceMissing,
  sourceUrlMissing: sourceMissing,
  sourceUrlRate: percent(foods.length - sourceMissing, foods.length),
  shopSet: foods.length - shopUnknown,
  shopUnknown,
  shopRate: percent(foods.length - shopUnknown, foods.length),
  areaSet: foods.length - areaUnknown,
  areaUnknown,
  areaRate: percent(foods.length - areaUnknown, foods.length),
  categorySet: foods.length - foods.filter((food) => food.category === "unknown").length,
  categoryUnknown: foods.filter((food) => food.category === "unknown").length,
  categoryRate: percent(foods.length - foods.filter((food) => food.category === "unknown").length, foods.length),
  categoryPending,
  manualUnconfirmable,
  priceSourceStats,
  missingPriceReasonStats: buildMissingPriceReasonStats(foods),
  missingPriceItems: foods.filter((food) => !hasKnownPrice(food)).map((food) => ({
    id: food.id,
    name: food.name,
    category: food.category,
    bucket: bucketFor(food.category),
    shopName: food.shop.name,
    areaName: food.area.name,
    sourceUrl: food.sourceUrl,
    reason: missingPriceReason(food),
    manualStatus: manualDecisions[food.id]?.status ?? "unreviewed",
    manualReason: manualDecisions[food.id]?.reason
  })),
  areaMissingItems: foods.filter((food) => isUnknownName(food.area.name)).map((food) => ({ id: food.id, name: food.name, category: food.category, shopName: food.shop.name, sourceUrl: food.sourceUrl })),
  shopMissingItems: foods.filter((food) => isUnknownName(food.shop.name)).map((food) => ({ id: food.id, name: food.name, category: food.category, areaName: food.area.name, sourceUrl: food.sourceUrl })),
  categoryPendingItems: foods.filter((food) => food.category === "unknown" || bucketFor(food.category) === "その他").map((food) => ({ id: food.id, name: food.name, category: food.category, shopName: food.shop.name, areaName: food.area.name, sourceUrl: food.sourceUrl })),
  duplicateCandidateCount: duplicateCandidates.length,
  highPriorityOpen,
  categoryStats: buildCategoryStats(foods),
  duplicateCandidates: duplicateCandidates.slice(0, 20).map((candidate) => ({
    foodId: candidate.food.id,
    foodName: candidate.food.name,
    otherFoodId: candidate.other.id,
    otherFoodName: candidate.other.name,
    reason: candidate.reason
  }))
};

fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

type ManualDecision = {
  status?: string;
  reason?: string;
  reasonCode?: string;
  updatedAt?: string;
};

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function hasKnownPrice(food: GeneratedFood) {
  return Boolean(food.price ?? food.priceMin ?? food.locations?.find((location) => location.price)?.price);
}

function hasPublicImage(food: GeneratedFood) {
  const image = primaryImage(food);
  return Boolean(image) && !image.startsWith("/placeholders/");
}

function primaryImage(food: GeneratedFood) {
  return food.imageUrl ?? food.representativeImageUrl ?? getFoodImage(food);
}

function buildCategoryStats(items: GeneratedFood[]) {
  const stats = new Map<Bucket, { total: number; known: number; unknown: number; reviewed: number; reviewOpen: number; rate: string; reviewRate: string }>();
  for (const food of items) {
    const bucket = bucketFor(food.category);
    const current = stats.get(bucket) ?? { total: 0, known: 0, unknown: 0, reviewed: 0, reviewOpen: 0, rate: "0%", reviewRate: "0%" };
    current.total += 1;
    if (hasKnownPrice(food)) current.known += 1;
    else current.unknown += 1;
    if (hasKnownPrice(food) || manualDecisions[food.id]?.status === "unconfirmable") current.reviewed += 1;
    else current.reviewOpen += 1;
    current.rate = percent(current.known, current.total);
    current.reviewRate = percent(current.reviewed, current.total);
    stats.set(bucket, current);
  }
  return Object.fromEntries(stats.entries());
}

function buildPriceSourceStats(items: GeneratedFood[]) {
  const stats = new Map<string, number>();
  for (const food of items) {
    const source = priceSourceFor(food);
    stats.set(source, (stats.get(source) ?? 0) + 1);
  }
  return Object.fromEntries(Array.from(stats.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function buildMissingPriceReasonStats(items: GeneratedFood[]) {
  const stats = new Map<string, number>();
  for (const food of items) {
    if (hasKnownPrice(food)) continue;
    const reason = missingPriceReason(food);
    stats.set(reason, (stats.get(reason) ?? 0) + 1);
  }
  return Object.fromEntries(Array.from(stats.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function priceSourceFor(food: GeneratedFood) {
  if (!hasKnownPrice(food)) return "unknown";
  if (food.priceSource || food.price_source) return food.priceSource ?? food.price_source ?? "unknown";
  const sourceUrl = food.priceSourceUrl ?? food.price_source_url ?? "";
  if (/usj\.co\.jp/i.test(sourceUrl)) return "official";
  if (/x\.com|twitter\.com|instagram\.com|threads\.net/i.test(sourceUrl)) return "social_report";
  if (/castel\.jp|usjhack|happyell|travel|guide|ameblo/i.test(sourceUrl)) return "trusted_report";
  return "trusted_report";
}

function missingPriceReason(food: GeneratedFood) {
  const manual = manualDecisions[food.id];
  if (manual?.reasonCode) return manual.reasonCode;
  if (!food.sourceUrl) return "source_url_missing";
  if (food.category === "set" || food.category === "kids") return "set_or_size_ambiguous";
  if (isUnknownName(food.shop.name) || isUnknownName(food.area.name)) return "shop_page_check_required";
  if (/\.pdf/i.test(food.sourceUrl)) return "pdf_manual_check_required";
  return "official_exact_price_not_found";
}

function buildDuplicateCandidates(items: GeneratedFood[]) {
  const candidates: Array<{ food: GeneratedFood; other: GeneratedFood; reason: string }> = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i];
      const b = items[j];
      if (a.category !== b.category) continue;
      const sameImage = Boolean(primaryImage(a) && primaryImage(a) === primaryImage(b));
      const sameSource = Boolean(a.sourceUrl && a.sourceUrl === b.sourceUrl);
      const sameShop = a.shop.name === b.shop.name && !isUnknownName(a.shop.name);
      const nameSimilarity = similarityKey(a.name) === similarityKey(b.name) || isNearName(a.name, b.name);
      if (!nameSimilarity && !sameImage) continue;
      if (sameImage || sameSource || sameShop || nameSimilarity) {
        candidates.push({
          food: a,
          other: b,
          reason: [
            nameSimilarity ? "商品名類似" : undefined,
            sameImage ? "同画像" : undefined,
            sameShop ? "同店舗" : undefined,
            sameSource ? "同source_url" : undefined
          ].filter(Boolean).join(" / ")
        });
      }
    }
  }
  return candidates
    .filter((candidate) => candidate.reason)
    .sort((a, b) => reviewPriorityScore(b.food, true) - reviewPriorityScore(a.food, true) || a.food.name.localeCompare(b.food.name, "ja"))
    .slice(0, 40);
}

function priceNeedsReview(food: GeneratedFood) {
  return !hasKnownPrice(food) && manualDecisions[food.id]?.status !== "unconfirmable";
}

function reviewPriorityScore(food: GeneratedFood, duplicateCandidate: boolean, priceReviewedAsUnconfirmable = false) {
  let score = 0;
  if (food.sourceUrl) score += 25;
  if (hasPublicImage(food)) score += 20;
  if (!hasKnownPrice(food) && !priceReviewedAsUnconfirmable) score += 25;
  if (["drink", "dessert", "burger", "set", "rice", "noodle", "pizza", "kids", "churro"].includes(food.category)) score += 15;
  if (duplicateCandidate) score += 15;
  if (!isUnknownName(food.shop.name)) score += 5;
  if (!isUnknownName(food.area.name)) score += 5;
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
  if (!left || !right) return false;
  if (left.length < 6 || right.length < 6) return false;
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
