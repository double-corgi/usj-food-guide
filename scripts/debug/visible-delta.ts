import fs from "node:fs";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";

const [beforePath, afterPath = "scripts/output/foods.generated.json"] = process.argv.slice(2);

if (!beforePath) {
  console.error("Usage: ts-node scripts/debug/visible-delta.ts <before-json> [after-json]");
  process.exit(1);
}

const before = readDataset(beforePath);
const after = readDataset(afterPath);
const beforeVisible = visibleFoods(before);
const afterVisible = visibleFoods(after);
const beforeKeys = new Set(beforeVisible.map((food) => food.normalizedName || normalizeName(food.name)));
const afterKeys = new Set(afterVisible.map((food) => food.normalizedName || normalizeName(food.name)));

const added = afterVisible.filter((food) => !beforeKeys.has(food.normalizedName || normalizeName(food.name)));
const missing = beforeVisible.filter((food) => !afterKeys.has(food.normalizedName || normalizeName(food.name)));

console.log(
  JSON.stringify(
    {
      beforeVisible: beforeVisible.length,
      afterVisible: afterVisible.length,
      addedCount: added.length,
      missingCount: missing.length,
      added: added.map(pickFood),
      missing: missing.map(pickFood)
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
      Boolean(food.sourceUrl)
  );
}

function pickFood(food: GeneratedFood) {
  return {
    id: food.id,
    name: food.name,
    category: food.category,
    shop: food.shop?.name,
    area: food.area?.name,
    image: food.representativeImageUrl || food.imageUrl || food.images.find((image) => image.enabled)?.imageUrl || "",
    sourceUrl: food.sourceUrl
  };
}

function normalizeName(name: string) {
  return name
    .normalize("NFKC")
    .replace(/[〜～]/g, "~")
    .replace(/\s+/g, "")
    .toLowerCase();
}
