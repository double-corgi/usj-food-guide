import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";

const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "output", "foods.generated.json"), "utf8")) as GeneratedDataset;
const foods = dataset.foods.filter((food) => food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden);

const missing = foods
  .filter((food) => !hasKnownPrice(food))
  .sort((a, b) => a.shop.name.localeCompare(b.shop.name, "ja") || a.name.localeCompare(b.name, "ja"));

for (const food of missing) {
  console.log([
    food.id,
    food.name,
    food.category,
    food.shop.name,
    food.area.name,
    food.sourceUrl
  ].join("\t"));
}

function hasKnownPrice(food: GeneratedFood) {
  return Boolean(food.price ?? food.priceMin ?? food.price_min ?? food.locations?.find((location) => location.price)?.price);
}
