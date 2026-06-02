import fs from "node:fs";
import path from "node:path";
import type { CrawlRunResult } from "../types/crawler";
import type { GeneratedDataset } from "../types/generated";
import { cleanFoodName, inferCategory, isBadFoodName, looksLikeFoodName, normalizeFoodName, scoreFoodNameQuality, splitCompositeMenuName } from "../utils/normalize-food";

const report = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "output", "latest-crawl-report.json"), "utf8")) as CrawlRunResult;
const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "output", "foods.generated.json"), "utf8")) as GeneratedDataset;
const visibleNames = new Set(
  dataset.foods
    .filter((food) => food.canonicalFood && !food.hidden && food.reviewStatus === "approved" && food.displayQuality !== "low")
    .map((food) => food.normalizedName)
);
const seen = new Set<string>();
const rows = report.sources.flatMap((source) =>
  source.foods.map((food) => {
    const name = cleanFoodName(food.name);
    const normalizedName = normalizeFoodName(name);
    const category = inferCategory(`${name} ${food.description ?? ""}`);
    return {
      sourceName: source.sourceName,
      name,
      normalizedName,
      category,
      shop: food.shopName,
      area: food.areaName,
      price: food.price,
      images: food.images.length,
      sourceUrl: food.sourceUrl,
      nameQualityScore: scoreFoodNameQuality(name)
    };
  })
)
  .filter((row) => {
    const key = `${row.normalizedName}:${row.shop}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  })
  .filter((row) => !visibleNames.has(row.normalizedName))
  .filter((row) => looksLikeFoodName(row.name) && !isBadFoodName(row.name) && !splitCompositeMenuName(row.name).isComposite && row.nameQualityScore >= 75)
  .filter((row) => /(ピザ|ピッツァ|パスタ|スパゲ|ヌードル|ラーメン|カレー|ライス|丼|バーガー|サンド|キッズ|プレート|セット|ドリンク|ケーキ|デザート|パフェ|スイーツ|ステーキ|ロースト|ブリトー)/.test(row.name))
  .sort((a, b) => b.nameQualityScore - a.nameQualityScore || b.images - a.images || a.name.localeCompare(b.name, "ja"));

const byCategory = rows.reduce<Record<string, number>>((acc, row) => {
  acc[row.category] = (acc[row.category] ?? 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({ candidates: rows.length, byCategory, items: rows.slice(0, 200) }, null, 2));
