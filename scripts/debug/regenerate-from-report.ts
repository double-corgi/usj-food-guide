import fs from "node:fs";
import path from "node:path";
import type { CrawlRunResult } from "../types/crawler";
import { buildGeneratedDataset } from "../utils/quality-foods";

const outputDir = path.join(process.cwd(), "scripts", "output");
const reportPath = path.join(outputDir, "latest-crawl-report.json");

const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as CrawlRunResult;
const quality = buildGeneratedDataset(report.sources);

fs.writeFileSync(path.join(outputDir, "foods.generated.json"), JSON.stringify(quality.dataset, null, 2));
fs.writeFileSync(path.join(outputDir, "shops.generated.json"), JSON.stringify(quality.shops, null, 2));
fs.writeFileSync(path.join(outputDir, "areas.generated.json"), JSON.stringify(quality.areas, null, 2));
fs.writeFileSync(
  reportPath,
  JSON.stringify(
    {
      ...report,
      finishedAt: new Date().toISOString(),
      uniqueFoods: quality.dataset.foods.filter((food) => !food.hidden && food.reviewStatus !== "rejected").length
    },
    null,
    2
  )
);

console.log(
  JSON.stringify(
    {
      generatedFoods: quality.dataset.summary.generatedFoods,
      approved: quality.dataset.summary.approved,
      pending: quality.dataset.summary.pending,
      rejected: quality.dataset.summary.rejected,
      hidden: quality.dataset.summary.hidden,
      visible: quality.dataset.foods.filter(
        (food) => food.canonicalFood && !food.hidden && food.reviewStatus === "approved" && food.displayQuality !== "low"
      ).length,
      placeholders: quality.dataset.foods.filter(
        (food) =>
          food.canonicalFood &&
          !food.hidden &&
          food.reviewStatus === "approved" &&
          food.displayQuality !== "low" &&
          !food.representativeImageUrl &&
          !food.imageUrl
      ).length
    },
    null,
    2
  )
);
