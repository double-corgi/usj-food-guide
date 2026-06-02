import fs from "node:fs";
import type { GeneratedDataset } from "../types/generated";
import { getFoodImage } from "../../lib/utils/image";

const dataset = JSON.parse(fs.readFileSync("scripts/output/foods.generated.json", "utf8")) as GeneratedDataset;
const visibleKeys = new Set(
  dataset.foods
    .filter((food) => food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden && food.displayQuality !== "low" && food.nameQualityScore >= 60 && food.confidenceScore >= 45)
    .map((food) => `${food.normalizedName}:${food.category}`)
);

const candidates = dataset.foods
  .filter((food) => !visibleKeys.has(`${food.normalizedName}:${food.category}`))
  .filter((food) => food.reviewStatus === "approved" && food.displayQuality !== "low" && food.nameQualityScore >= 75 && food.confidenceScore >= 70)
  .filter((food) => !food.compositeMenu)
  .filter((food) => food.images.some((image) => image.enabled && image.imageVerified && !image.hasWatermark))
  .sort((a, b) => b.confidenceScore + b.nameQualityScore - (a.confidenceScore + a.nameQualityScore));

for (const food of candidates.slice(0, 120)) {
  console.log(
    JSON.stringify({
      id: food.id,
      name: food.name,
      category: food.category,
      hidden: food.hidden,
      canonicalFood: food.canonicalFood,
      sourceUrl: food.sourceUrl,
      shop: food.shop.name,
      image: getFoodImage(food),
      reasons: food.rejectionReasons
    })
  );
}
console.log(`candidates=${candidates.length}`);
