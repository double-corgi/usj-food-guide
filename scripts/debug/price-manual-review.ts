import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";
import type { FoodCategory } from "../../types/domain";

type CategoryBucket =
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

type MissingReason =
  | "source_url_missing"
  | "official_exact_price_not_found"
  | "product_name_mismatch"
  | "only_similar_product_found"
  | "set_or_size_ambiguous"
  | "pdf_manual_check_required"
  | "shop_page_check_required";

type ReviewRow = {
  id: string;
  name: string;
  category: FoodCategory;
  bucket: CategoryBucket;
  shopName: string;
  areaName: string;
  price: number | null;
  priceStatus: "price_missing";
  sourceUrl: string;
  imageUrl: string;
  officialUrl: string;
  reason: MissingReason;
  priorityRank: number;
};

const outputDir = path.join(process.cwd(), "scripts", "output");
const datasetPath = path.join(outputDir, "foods.generated.json");
const reportPath = path.join(outputDir, "price-manual-review.generated.json");

const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8")) as GeneratedDataset;
const visible = visibleFoods(dataset.foods);
const missing = visible.filter((food) => !hasKnownPrice(food)).sort(compareForReview);
const rows: ReviewRow[] = missing.map((food, index) => ({
  id: food.id,
  name: food.name,
  category: food.category,
  bucket: bucketFor(food.category),
  shopName: food.shop?.name ?? food.locations?.[0]?.shopName ?? "店舗未確認",
  areaName: food.area?.name ?? food.locations?.[0]?.areaName ?? "エリア未確認",
  price: null,
  priceStatus: "price_missing",
  sourceUrl: food.sourceUrl ?? "",
  imageUrl: primaryImage(food),
  officialUrl: food.officialUrl ?? food.sourceUrl ?? "",
  reason: reasonFor(food),
  priorityRank: index + 1
}));

const categoryStats = buildStats(visible, (food) => bucketFor(food.category));
const shopStats = buildStats(visible, (food) => food.shop?.name ?? "店舗未確認");
const areaStats = buildStats(visible, (food) => food.area?.name ?? "エリア未確認");
const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    foodTotal: visible.length,
    imageTotal: visible.filter((food) => Boolean(primaryImage(food))).length,
    placeholderCount: visible.filter((food) => primaryImage(food).startsWith("/placeholders/")).length,
    priceKnown: visible.filter(hasKnownPrice).length,
    priceUnknown: missing.length,
    priceRate: percent(visible.filter(hasKnownPrice).length, visible.length),
    sourceUrlMissing: missing.filter((food) => !food.sourceUrl).length,
    sourceUrlPresent: missing.filter((food) => Boolean(food.sourceUrl)).length
  },
  priceSourceCounts: buildPriceSourceCounts(visible),
  categoryStats,
  shopStats,
  areaStats,
  rows,
  top50: rows.slice(0, 50)
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

function visibleFoods(foods: GeneratedFood[]) {
  return foods.filter(
    (food) =>
      food.reviewStatus === "approved" &&
      food.canonicalFood !== false &&
      !food.hidden &&
      food.displayQuality !== "low" &&
      food.nameQualityScore >= 60 &&
      food.confidenceScore >= 45 &&
      !food.compositeMenu &&
      Boolean(food.sourceUrl)
  );
}

function hasKnownPrice(food: GeneratedFood) {
  return Boolean(food.price ?? food.priceMin ?? food.price_min ?? food.locations?.find((location) => location.price)?.price);
}

function priceSourceFor(food: GeneratedFood) {
  if (!hasKnownPrice(food)) return "unknown";
  if (food.priceSource) return food.priceSource;
  const sourceUrl = food.priceSourceUrl ?? food.price_source_url ?? "";
  if (/usj\.co\.jp/i.test(sourceUrl)) return "official";
  if (/official[_-]?app/i.test(sourceUrl)) return "official_app";
  if (/menu[_-]?photo|menus?|photo/i.test(sourceUrl)) return "menu_photo";
  return "trusted_report";
}

function buildPriceSourceCounts(foods: GeneratedFood[]) {
  return countBy(foods, priceSourceFor);
}

function primaryImage(food: GeneratedFood) {
  return food.imageUrl ?? food.representativeImageUrl ?? food.images?.find((image) => image.enabled)?.imageUrl ?? "";
}

function reasonFor(food: GeneratedFood): MissingReason {
  const source = `${food.sourceUrl ?? ""} ${food.officialUrl ?? ""}`;
  if (!food.sourceUrl) return "source_url_missing";
  if (/\.pdf(?:$|\?)/i.test(source)) return "pdf_manual_check_required";
  if (food.category === "set" || /セット|サイズ|キッズ|プレート/i.test(food.name)) return "set_or_size_ambiguous";
  if (/restaurants|restaurant|food-cart/i.test(source)) return "shop_page_check_required";
  return "official_exact_price_not_found";
}

function compareForReview(a: GeneratedFood, b: GeneratedFood) {
  return (
    Number(!a.sourceUrl) - Number(!b.sourceUrl) ||
    Number(!primaryImage(a)) - Number(!primaryImage(b)) ||
    priorityForBucket(bucketFor(a.category)) - priorityForBucket(bucketFor(b.category)) ||
    Number((a.shop?.name ?? "") === "店舗未確認") - Number((b.shop?.name ?? "") === "店舗未確認") ||
    a.name.localeCompare(b.name, "ja")
  );
}

function buildStats(foods: GeneratedFood[], getKey: (food: GeneratedFood) => string) {
  const stats = new Map<string, { label: string; total: number; known: number; unknown: number; rate: string }>();
  for (const food of foods) {
    const label = getKey(food) || "未確認";
    const current = stats.get(label) ?? { label, total: 0, known: 0, unknown: 0, rate: "0%" };
    current.total += 1;
    if (hasKnownPrice(food)) current.known += 1;
    else current.unknown += 1;
    current.rate = percent(current.known, current.total);
    stats.set(label, current);
  }
  return Array.from(stats.values()).sort((a, b) => b.unknown - a.unknown || a.label.localeCompare(b.label, "ja"));
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function bucketFor(category: FoodCategory): CategoryBucket {
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

function priorityForBucket(bucket: CategoryBucket) {
  const order: CategoryBucket[] = ["ドリンク", "デザート", "バーガー", "プレート", "ライス", "パスタ", "ピザ", "キッズ", "チュリトス", "その他"];
  const index = order.indexOf(bucket);
  return index === -1 ? order.length : index;
}

function percent(numerator: number, denominator: number) {
  return `${Math.round((numerator / Math.max(denominator, 1)) * 1000) / 10}%`;
}
