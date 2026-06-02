import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";
import { getFoodImage } from "../../lib/utils/image";

const outputDir = path.join(process.cwd(), "scripts", "output");
const foodsPath = path.join(outputDir, "foods.generated.json");
const auditPath = path.join(outputDir, "placeholder-audit.json");

const dataset = JSON.parse(fs.readFileSync(foodsPath, "utf8")) as GeneratedDataset;
const visible = dataset.foods.filter(isVisibleFood);
const placeholders = visible.filter((food) => getFoodImage(food).startsWith("/placeholders/"));

const rows = placeholders.map((food) => {
  const primaryLocation = food.locations?.[0];
  const disabledImages = food.images.filter((image) => !image.enabled || image.imageMismatchReason || image.hasWatermark);

  return {
    food_id: food.id,
    name: food.name,
    normalized_name: food.normalizedName ?? food.normalized_name,
    category: food.category,
    area: primaryLocation?.areaName ?? food.areaName ?? food.area_name ?? null,
    shop: primaryLocation?.shopName ?? food.shopName ?? food.shop_name ?? null,
    source_url: food.sourceUrl ?? food.source_url ?? null,
    placeholder_reason: inferPlaceholderReason(food),
    disabled_image_reasons: disabledImages.map((image) => ({
      image_url: image.imageUrl,
      source_url: image.sourceUrl,
      score: image.imageCandidateScore ?? image.imageMatchScore ?? image.imageConfidenceScore ?? null,
      has_watermark: image.hasWatermark ?? false,
      watermark_reason: image.watermarkReason ?? null,
      mismatch_reason: image.imageMismatchReason ?? null,
      match_reason: image.imageMatchReason ?? null
    }))
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  visibleFoods: visible.length,
  placeholderCount: rows.length,
  placeholderByCategory: countBy(rows, (row) => row.category),
  rows
};

fs.writeFileSync(auditPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

function isVisibleFood(food: GeneratedFood) {
  return (
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

function inferPlaceholderReason(food: GeneratedFood) {
  if (!food.images.length) return "no image candidates saved";
  if (food.images.some((image) => image.hasWatermark)) return "candidate rejected: watermark";
  if (food.images.some((image) => image.imageMismatchReason)) return "candidate rejected: product mismatch or low quality";
  if (food.images.every((image) => !image.enabled)) return "all image candidates disabled";
  return "no verified product image above public threshold";
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
