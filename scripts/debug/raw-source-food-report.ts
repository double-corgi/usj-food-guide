import fs from "node:fs";
import path from "node:path";
import type { CrawlRunResult } from "../types/crawler";
import { cleanFoodName, inferCategory, normalizeFoodName } from "../utils/normalize-food";

const reportPath = path.join(process.cwd(), "scripts", "output", "latest-crawl-report.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as CrawlRunResult;

const terms = process.argv.slice(2).join("|");
const filter = terms ? new RegExp(terms, "i") : null;
const seen = new Set<string>();
const rows = report.sources.flatMap((source) =>
  source.foods.map((food) => {
    const name = cleanFoodName(food.name);
    return {
      sourceName: source.sourceName,
      name,
      normalizedName: normalizeFoodName(name),
      category: inferCategory(`${name} ${food.description ?? ""}`),
      shop: food.shopName,
      area: food.areaName,
      price: food.price,
      images: food.images.length,
      sourceUrl: food.sourceUrl
    };
  })
);

const filtered = rows
  .filter((row) => !filter || filter.test(`${row.name} ${row.category} ${row.shop} ${row.sourceUrl}`))
  .filter((row) => {
    const key = `${row.normalizedName}:${row.shop}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  })
  .sort((a, b) => a.name.localeCompare(b.name, "ja"));

const byCategory = filtered.reduce<Record<string, number>>((acc, row) => {
  acc[row.category] = (acc[row.category] ?? 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({ total: filtered.length, byCategory, items: filtered.slice(0, 300) }, null, 2));
