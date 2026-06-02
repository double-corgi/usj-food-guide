import fs from "node:fs";
import path from "node:path";
import { getFoodImage } from "../../lib/utils/image";
import type { GeneratedDataset } from "../types/generated";
import { normalizeFoodName } from "../utils/normalize-food";

const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "output", "foods.generated.json"), "utf8")) as GeneratedDataset;
const visible = dataset.foods.filter(
  (food) =>
    food.reviewStatus === "approved" &&
    food.canonicalFood !== false &&
    !food.hidden &&
    food.displayQuality !== "low" &&
    food.nameQualityScore >= 60 &&
    food.confidenceScore >= 45 &&
    !food.compositeMenu
);
const visibleNames = new Set(visible.map((food) => normalizeFoodName(food.name)));
const visibleImages = new Set(visible.map((food) => getFoodImage(food)).filter((image) => !image.startsWith("/placeholders/")));

const rows = dataset.foods
  .filter((food) => food.hidden && food.reviewStatus === "approved" && food.sourceUrl.includes("usj.co.jp"))
  .map((food) => ({
    name: food.name,
    category: food.category,
    representedByName: visibleNames.has(normalizeFoodName(food.name)),
    imageAlreadyVisible: visibleImages.has(getFoodImage(food)),
    image: getFoodImage(food),
    shop: food.shop.name,
    area: food.area.name,
    sourceUrl: food.sourceUrl,
    sourceNames: food.sourceNames
  }))
  .filter((row) => !row.representedByName && !row.image.startsWith("/placeholders/"))
  .sort((a, b) => a.name.localeCompare(b.name, "ja"));

console.log(JSON.stringify({ count: rows.length, rows }, null, 2));
