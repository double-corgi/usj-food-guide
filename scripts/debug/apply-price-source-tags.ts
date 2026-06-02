import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";
import type { PriceSource } from "../../types/domain";

const datasetPath = path.join(process.cwd(), "scripts", "output", "foods.generated.json");
const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8")) as GeneratedDataset;
const beforeImages = new Map(dataset.foods.map((food) => [food.id, imageSnapshot(food)]));

let official = 0;
let trusted = 0;
let unknown = 0;

for (const food of dataset.foods) {
  const source = inferPriceSource(food);
  food.priceSource = source;
  food.price_source = source;
  if (source === "official") official += 1;
  else if (source === "trusted_report") trusted += 1;
  else unknown += 1;
}

const regressions = dataset.foods.filter((food) => beforeImages.get(food.id) !== imageSnapshot(food));
if (regressions.length > 0) {
  throw new Error(`image regression detected: ${regressions.map((food) => food.name).join(", ")}`);
}

fs.writeFileSync(datasetPath, `${JSON.stringify(dataset, null, 2)}\n`);
console.log(JSON.stringify({ foods: dataset.foods.length, official, trusted_report: trusted, unknown, imageRegression: regressions.length }, null, 2));

function hasKnownPrice(food: GeneratedFood) {
  return Boolean(food.price ?? food.priceMin ?? food.price_min ?? food.locations?.find((location) => location.price)?.price);
}

function inferPriceSource(food: GeneratedFood): PriceSource {
  if (!hasKnownPrice(food)) return "unknown";
  if (food.priceSource && food.priceSource !== "unknown") return food.priceSource;
  const sourceUrl = food.priceSourceUrl ?? food.price_source_url ?? "";
  if (/usj\.co\.jp/i.test(sourceUrl)) return "official";
  return "trusted_report";
}

function imageSnapshot(food: GeneratedFood) {
  return JSON.stringify({
    imageUrl: food.imageUrl,
    representativeImageUrl: food.representativeImageUrl,
    images: food.images?.map((image) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      enabled: image.enabled,
      imageVerified: image.imageVerified,
      imageApproved: image.imageApproved,
      manuallyAdded: image.manuallyAdded
    }))
  });
}
