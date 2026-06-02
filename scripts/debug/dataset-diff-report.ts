import fs from "node:fs";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";
import { getFoodImage } from "../../lib/utils/image";

const [beforePath, afterPath = "scripts/output/foods.generated.json"] = process.argv.slice(2);

if (!beforePath) {
  console.error("Usage: ts-node scripts/debug/dataset-diff-report.ts <before-json> [after-json]");
  process.exit(1);
}

const before = readDataset(beforePath);
const after = readDataset(afterPath);
const beforeVisible = visibleFoods(before);
const afterVisible = visibleFoods(after);
const beforeByKey = new Map(beforeVisible.map((food) => [foodKey(food), food]));
const afterByKey = new Map(afterVisible.map((food) => [foodKey(food), food]));
const regressions = [...beforeByKey.entries()].flatMap(([key, oldFood]) => {
  const nextFood = afterByKey.get(key);
  if (!nextFood) return [];
  const beforeImage = imageState(oldFood);
  const afterImage = imageState(nextFood);
  const hadRealImage = !beforeImage.display.startsWith("/placeholders/") || beforeImage.approved || beforeImage.verified || beforeImage.manuallyAdded;
  const regressedToPlaceholder = hadRealImage && afterImage.display.startsWith("/placeholders/");
  const lostApproved = beforeImage.approved && !afterImage.approved;
  const lostVerified = beforeImage.verified && !afterImage.verified;
  const lostManual = beforeImage.manuallyAdded && !afterImage.manuallyAdded;
  if (!regressedToPlaceholder && !lostApproved && !lostVerified && !lostManual) return [];
  return [
    {
      key,
      name: oldFood.name,
      before: beforeImage,
      after: afterImage,
      reasons: [
        regressedToPlaceholder ? "real-to-placeholder" : "",
        lostApproved ? "lost-approved" : "",
        lostVerified ? "lost-verified" : "",
        lostManual ? "lost-manual" : ""
      ].filter(Boolean)
    }
  ];
});

const beforePlaceholders = beforeVisible.filter((food) => getFoodImage(food).startsWith("/placeholders/")).length;
const afterPlaceholders = afterVisible.filter((food) => getFoodImage(food).startsWith("/placeholders/")).length;
const beforeSourceUrls = new Set(beforeVisible.map((food) => food.sourceUrl).filter(Boolean));
const afterSourceUrls = new Set(afterVisible.map((food) => food.sourceUrl).filter(Boolean));
const addedSourceUrls = [...afterSourceUrls].filter((url) => !beforeSourceUrls.has(url));

console.log(
  JSON.stringify(
    {
      beforeVisible: beforeVisible.length,
      afterVisible: afterVisible.length,
      addedVisible: afterVisible.length - beforeVisible.length,
      beforeImageFoods: beforeVisible.length - beforePlaceholders,
      afterImageFoods: afterVisible.length - afterPlaceholders,
      beforePlaceholders,
      afterPlaceholders,
      placeholderDelta: afterPlaceholders - beforePlaceholders,
      imageRegressions: regressions.length,
      regressions: regressions.slice(0, 30),
      beforeSourceUrls: beforeSourceUrls.size,
      afterSourceUrls: afterSourceUrls.size,
      addedSourceUrls: addedSourceUrls.length,
      addedSourceUrlSamples: addedSourceUrls.slice(0, 20),
      beforeByCategory: countBy(beforeVisible, (food) => food.category),
      afterByCategory: countBy(afterVisible, (food) => food.category)
    },
    null,
    2
  )
);

function readDataset(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as GeneratedDataset;
}

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

function foodKey(food: GeneratedFood) {
  return `${food.normalizedName}:${food.category}`;
}

function imageState(food: GeneratedFood) {
  return {
    imageUrl: food.imageUrl ?? "",
    representativeImageUrl: food.representativeImageUrl ?? "",
    display: getFoodImage(food),
    approved: food.images.some((image) => image.enabled && image.imageApproved),
    verified: food.images.some((image) => image.enabled && image.imageVerified),
    manuallyAdded: food.images.some((image) => image.enabled && image.manuallyAdded),
    enabledImages: food.images.filter((image) => image.enabled).map((image) => image.imageUrl)
  };
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
