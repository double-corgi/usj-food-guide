import fs from "node:fs";
import path from "node:path";
import type { FoodWithRelations } from "../../types/domain";
import { getFoodImage } from "../../lib/utils/image";
import type { PriceSource } from "../../types/domain";

type GeneratedDataset = {
  generatedAt?: string;
  foods: FoodWithRelations[];
};

const outputDir = path.join(process.cwd(), "scripts", "output");
const dataset = JSON.parse(fs.readFileSync(path.join(outputDir, "foods.generated.json"), "utf8")) as GeneratedDataset;
const foods = dataset.foods.filter((food) => food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden);
const imageFoods = foods.filter((food) => !getFoodImage(food).startsWith("/placeholders/"));
const placeholderFoods = foods.filter((food) => getFoodImage(food).startsWith("/placeholders/"));
const priceKnown = foods.filter(hasKnownPrice);
const priceUnknown = foods.filter((food) => !hasKnownPrice(food));

const report = {
  generatedAt: new Date().toISOString(),
  datasetGeneratedAt: dataset.generatedAt,
  summary: {
    foods: foods.length,
    images: imageFoods.length,
    placeholders: placeholderFoods.length,
    priceKnown: priceKnown.length,
    priceUnknown: priceUnknown.length,
    priceRate: percent(priceKnown.length, foods.length),
    userProgressDataSource: "localStorage: uniba-food-logs-v1",
    uneatenRateNote: "未食率は端末内localStorageの食べた記録から画面側で算出します。このレポートは共有商品データ品質のみを集計します。"
  },
  categoryDistribution: buildStats(foods, (food) => food.category),
  areaDistribution: buildStats(foods, (food) => food.area?.name || "エリア未確認"),
  priceSourceDistribution: countBy(foods, getPriceSource),
  priceByCategory: buildPriceCoverageStats(foods, (food) => food.category),
  priceByArea: buildPriceCoverageStats(foods, (food) => food.area?.name || "エリア未確認"),
  priceUnknownByCategory: buildStats(priceUnknown, (food) => food.category),
  priceUnknownByArea: buildStats(priceUnknown, (food) => food.area?.name || "エリア未確認"),
  imageSourceDistribution: countBy(foods, (food) => {
    const primary = getFoodImage(food);
    const match = food.images?.find((image) => image.url === primary || image.localPath === primary);
    return match?.sourceType || (primary.includes("usj.co.jp") ? "official" : "other");
  }),
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, "app-quality-distribution.generated.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

function hasKnownPrice(food: FoodWithRelations) {
  return Boolean(food.priceMin ?? food.price ?? food.locations?.find((location) => location.price)?.price);
}

function getPriceSource(food: Pick<FoodWithRelations, "price" | "priceMin" | "priceSource" | "priceSourceUrl">): PriceSource {
  if (!food.price && !food.priceMin) return "unknown";
  if (food.priceSource) return food.priceSource;
  const sourceUrl = food.priceSourceUrl ?? "";
  if (/usj\.co\.jp/i.test(sourceUrl)) return "official";
  if (/x\.com|twitter\.com|instagram\.com|threads\.net/i.test(sourceUrl)) return "social_report";
  if (/castel\.jp|usjhack|happyell|ameblo|travel|guide/i.test(sourceUrl)) return "trusted_report";
  return "trusted_report";
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item) || "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function buildStats<T>(items: T[], getKey: (item: T) => string) {
  const counts = countBy(items, getKey);
  return Object.fromEntries(
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
      .map(([key, total]) => [key, { total, share: percent(total, items.length) }])
  );
}

function buildPriceCoverageStats<T>(items: T[], getKey: (item: T) => string) {
  const stats = new Map<string, { total: number; known: number; unknown: number; rate: string }>();
  for (const item of items) {
    const key = getKey(item) || "unknown";
    const current = stats.get(key) ?? { total: 0, known: 0, unknown: 0, rate: "0%" };
    current.total += 1;
    if (hasKnownPrice(item as FoodWithRelations)) current.known += 1;
    else current.unknown += 1;
    current.rate = percent(current.known, current.total);
    stats.set(key, current);
  }

  return Object.fromEntries(
    Array.from(stats.entries()).sort((a, b) => {
      const leftRate = a[1].known / Math.max(a[1].total, 1);
      const rightRate = b[1].known / Math.max(b[1].total, 1);
      return leftRate - rightRate || b[1].unknown - a[1].unknown || a[0].localeCompare(b[0], "ja");
    })
  );
}

function percent(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 1000) / 10}%`;
}
