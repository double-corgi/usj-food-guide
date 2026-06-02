import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset } from "../types/generated";

const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "output", "foods.generated.json"), "utf8")) as GeneratedDataset;

const visible = dataset.foods.filter(
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

const enabledImages = visible.flatMap((food) =>
  food.images
    .filter((image) => image.enabled && image.imageVerified && !image.imageMismatchReason && !image.hasWatermark)
    .map((image) => ({
      category: food.category,
      sourceType: image.sourceType,
      sourceHost: hostOf(image.imageUrl)
    }))
);

const mismatchExcluded = dataset.foods.flatMap((food) => food.images).filter((image) => image.imageMismatchReason && !image.enabled).length;

console.log(
  JSON.stringify(
    {
      enabledImages: enabledImages.length,
      mismatchExcluded,
      bySourceType: countBy(enabledImages, (image) => image.sourceType),
      bySourceHost: countBy(enabledImages, (image) => image.sourceHost),
      byCategory: countBy(enabledImages, (image) => image.category)
    },
    null,
    2
  )
);

function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return "unknown";
  }
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
