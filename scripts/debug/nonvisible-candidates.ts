import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";
import { getFoodImage } from "../../lib/utils/image";

const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "output", "foods.generated.json"), "utf8")) as GeneratedDataset;
const visibleKeys = new Set(visibleFoods(dataset).map((food) => food.id));

const candidates = dataset.foods
  .filter((food) => !visibleKeys.has(food.id))
  .filter((food) => food.reviewStatus === "approved" || food.reviewStatus === "pending")
  .filter((food) => food.nameQualityScore >= 60)
  .filter((food) => !food.compositeMenu)
  .sort((a, b) => b.confidenceScore - a.confidenceScore)
  .slice(0, 120)
  .map((food) => ({
    id: food.id,
    name: food.name,
    category: food.category,
    review: food.reviewStatus,
    hidden: food.hidden,
    canonicalFood: food.canonicalFood,
    displayQuality: food.displayQuality,
    confidenceScore: food.confidenceScore,
    nameQualityScore: food.nameQualityScore,
    shop: food.shop.name,
    area: food.area.name,
    source: food.sourceNames,
    sourceUrl: food.sourceUrl,
    image: getFoodImage(food),
    rejectionReasons: food.rejectionReasons
  }));

console.log(JSON.stringify(candidates, null, 2));

function visibleFoods(dataset: GeneratedDataset) {
  return dataset.foods.filter(
    (food) =>
      food.reviewStatus === "approved" &&
      food.canonicalFood !== false &&
      !food.hidden &&
      food.displayQuality !== "low" &&
      food.nameQualityScore >= 60 &&
      food.confidenceScore >= 45 &&
      !food.compositeMenu &&
      Boolean(food.sourceUrl) &&
      (
        food.shop.name !== "店舗未確認" ||
        food.locations?.some((location) => location.shopName !== "店舗未確認") ||
        food.images.some((image) => image.enabled && image.sourceType === "official" && image.imageVerified && !image.isSharedTooMuch && !image.hasWatermark) ||
        /castel\.jp/i.test(food.sourceUrl)
      )
  );
}
