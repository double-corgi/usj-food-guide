import fs from "node:fs";
import { getFoodImage } from "../../lib/utils/image";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";

const [beforePath, afterPath = "scripts/output/foods.generated.json"] = process.argv.slice(2);
if (!beforePath) {
  console.error("Usage: ts-node scripts/debug/list-image-improvements.ts <before-json> [after-json]");
  process.exit(1);
}

const before = JSON.parse(fs.readFileSync(beforePath, "utf8")) as GeneratedDataset;
const after = JSON.parse(fs.readFileSync(afterPath, "utf8")) as GeneratedDataset;
const beforeById = new Map(before.foods.map((food) => [food.id, food]));

const improvements = after.foods
  .filter(isVisible)
  .flatMap((food) => {
    const beforeFood = beforeById.get(food.id);
    const beforeImage = beforeFood ? getFoodImage(beforeFood) : "";
    const afterImage = getFoodImage(food);
    if (beforeFood && !beforeImage.startsWith("/placeholders/")) return [];
    if (afterImage.startsWith("/placeholders/")) return [];
    return [
      {
        id: food.id,
        name: food.name,
        category: food.category,
        image: afterImage,
        source: food.images.find((image) => image.enabled && image.imageUrl === afterImage)?.sourceUrl ?? food.sourceUrl,
        kind: beforeFood ? "placeholder-replaced" : "new-food-with-image"
      }
    ];
  });

console.log(JSON.stringify({ count: improvements.length, improvements }, null, 2));

function isVisible(food: GeneratedFood) {
  return (
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
