import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset } from "../types/generated";
import { getFoodImage } from "../../lib/utils/image";

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

const placeholders = visible.filter((food) => getFoodImage(food).startsWith("/placeholders/"));
const verified = visible.filter((food) => !getFoodImage(food).startsWith("/placeholders/"));
const verifiedOfficial = visible.filter((food) => food.images.some((image) => image.enabled && image.sourceType === "official" && image.imageVerified));
const verifiedSupplemental = visible.filter((food) =>
  !getFoodImage(food).startsWith("/placeholders/") &&
  !food.images.some((image) => image.enabled && image.sourceType === "official" && image.imageVerified)
);

const summary = {
  visible: visible.length,
  verified: verified.length,
  verifiedOfficial: verifiedOfficial.length,
  verifiedSupplemental: verifiedSupplemental.length,
  placeholders: placeholders.length,
  placeholdersByCategory: countBy(placeholders, (food) => food.category),
  verifiedByCategory: countBy(verified, (food) => food.category),
  placeholdersBySource: countBy(placeholders, (food) => food.sourceNames[0] ?? "unknown"),
  placeholderSamples: placeholders.slice(0, 80).map((food) => ({
    name: food.name,
    category: food.category,
    sourceUrl: food.sourceUrl,
    sourceNames: food.sourceNames,
    images: food.images.map((image) => ({
      url: image.imageUrl,
      enabled: image.enabled,
      verified: image.imageVerified,
      match: image.imageMatchScore,
      category: image.categoryImageMatchScore,
      mismatch: image.imageMismatchReason,
      reason: image.imageMatchReason,
      context: image.imageSourceContext?.slice(0, 120)
    }))
  }))
};

console.log(JSON.stringify(summary, null, 2));

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
