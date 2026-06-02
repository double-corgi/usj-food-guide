import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset } from "../types/generated";

const filePath = path.join(process.cwd(), "scripts", "output", "foods.generated.json");
const dataset = JSON.parse(fs.readFileSync(filePath, "utf8")) as GeneratedDataset;

const visible = dataset.foods.filter(
  (food) => food.canonicalFood && !food.hidden && food.reviewStatus === "approved" && food.displayQuality !== "low"
);
const visibleKeys = new Set(visible.map((food) => `${food.normalizedName}:${food.category}`));
const visibleNames = new Set(visible.map((food) => food.normalizedName));

const candidates = dataset.foods
  .filter((food) => food.hidden || !food.canonicalFood || food.reviewStatus !== "approved" || food.displayQuality === "low")
  .filter((food) => food.reviewStatus === "approved" && food.displayQuality !== "low")
  .filter((food) => !visibleKeys.has(`${food.normalizedName}:${food.category}`) && !visibleNames.has(food.normalizedName))
  .sort((a, b) => b.confidenceScore - a.confidenceScore || b.nameQualityScore - a.nameQualityScore)
  .map((food) => ({
    id: food.id,
    name: food.name,
    category: food.category,
    hidden: food.hidden,
    canonicalFood: food.canonicalFood,
    displayQuality: food.displayQuality,
    confidenceScore: food.confidenceScore,
    nameQualityScore: food.nameQualityScore,
    shop: food.shop.name,
    area: food.area.name,
    sourceUrl: food.sourceUrl,
    image: food.representativeImageUrl ?? food.imageUrl ?? null,
    imageVerified: food.images.some((image) => image.enabled && image.imageVerified),
    reasons: food.rejectionReasons
  }));

console.log(JSON.stringify({ visible: visible.length, candidates: candidates.length, items: candidates.slice(0, 120) }, null, 2));
