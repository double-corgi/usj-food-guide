import fs from "node:fs";
import path from "node:path";
import type { CrawlRunResult } from "../types/crawler";
import type { GeneratedDataset } from "../types/generated";

const report = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "output", "latest-crawl-report.json"), "utf8")) as CrawlRunResult;
const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "output", "foods.generated.json"), "utf8")) as GeneratedDataset;
const usedImages = new Set(dataset.foods.flatMap((food) => food.images.map((image) => image.imageUrl)));
const visibleNames = new Set(dataset.foods.filter((food) => food.canonicalFood && !food.hidden).map((food) => food.name));

const rawImages = report.sources.flatMap((source) =>
  source.foods.flatMap((food) =>
    food.images.map((image) => ({
      sourceName: source.sourceName,
      foodName: food.name,
      sourceUrl: food.sourceUrl,
      imageUrl: image.imageUrl,
      altText: image.altText,
      caption: image.caption,
      used: usedImages.has(image.imageUrl),
      visibleName: visibleNames.has(food.name)
    }))
  )
);

const gaps = rawImages
  .filter((image) => /^https:\/\/www\.usj\.co\.jp\/tridiondata\/.+gds-images\/usj-gds-food-/i.test(image.imageUrl))
  .filter((image) => !image.used || !image.visibleName)
  .filter((image) => !/(logo|restaurant|hero|mainvisual|recommended|map|infocard|page-title|area)/i.test(`${image.imageUrl} ${image.altText ?? ""}`))
  .sort((a, b) => a.foodName.localeCompare(b.foodName, "ja"));

console.log(JSON.stringify({ gaps: gaps.length, items: gaps.slice(0, 200) }, null, 2));
