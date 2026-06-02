import fs from "node:fs";
import type { GeneratedDataset } from "../types/generated";
import { getFoodImage } from "../../lib/utils/image";

const terms = process.argv.slice(2);
const dataset = JSON.parse(fs.readFileSync("scripts/output/foods.generated.json", "utf8")) as GeneratedDataset;

const foods = dataset.foods.filter((food) =>
  terms.length === 0 || terms.some((term) => `${food.name} ${food.normalizedName} ${food.sourceUrl}`.includes(term))
);

for (const food of foods.slice(0, 80)) {
  console.log(
    JSON.stringify(
      {
        id: food.id,
        name: food.name,
        category: food.category,
        reviewStatus: food.reviewStatus,
        displayQuality: food.displayQuality,
        hidden: food.hidden,
        canonicalFood: food.canonicalFood,
        confidenceScore: food.confidenceScore,
        nameQualityScore: food.nameQualityScore,
        compositeMenu: food.compositeMenu,
        sourceUrl: food.sourceUrl,
        shop: food.shop.name,
        locations: food.locations?.map((location) => location.shopName).slice(0, 4),
        displayImage: getFoodImage(food),
        imageVerified: food.images.some((image) => image.enabled && image.imageVerified),
        rejectionReasons: food.rejectionReasons
      },
      null,
      2
    )
  );
}

console.log(`matched=${foods.length}`);
