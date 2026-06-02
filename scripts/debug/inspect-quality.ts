import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset } from "../types/generated";

const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "output", "foods.generated.json"), "utf8")) as GeneratedDataset;

for (const food of dataset.foods.slice(0, 80)) {
  console.log(
    JSON.stringify({
      name: food.name,
      score: food.confidenceScore,
      nameScore: food.nameQualityScore,
      quality: food.displayQuality,
      review: food.reviewStatus,
      hidden: food.hidden,
      composite: food.compositeMenu,
      images: food.images.length,
      imageScore: food.images[0]?.imageConfidenceScore,
      shop: food.shop.name,
      area: food.area.name,
      reasons: food.rejectionReasons
    })
  );
}
