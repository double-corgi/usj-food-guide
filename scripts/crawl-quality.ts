import fs from "node:fs";
import path from "node:path";
import type { CrawlRunResult } from "./types/crawler";
import { crawlTargetedPages } from "./crawlers/crawl-targeted-pages";
import { buildRequiredSourceCoverage } from "./crawl-usj-foods";
import { buildGeneratedDataset } from "./utils/quality-foods";

const outputDir = path.join(process.cwd(), "scripts", "output");
const reportPath = path.join(outputDir, "latest-crawl-report.json");

async function main() {
  const baseReport = fs.existsSync(reportPath)
    ? (JSON.parse(fs.readFileSync(reportPath, "utf8")) as CrawlRunResult)
    : ({
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        pagesCrawled: 0,
        foodsFound: 0,
        uniqueFoods: 0,
        addedCount: 0,
        updatedCount: 0,
    inactiveCount: 0,
    errors: [],
    requiredSourceCoverage: [],
    sources: []
      } satisfies CrawlRunResult);
  const coverage = await crawlTargetedPages("coverage");
  const sources = [...baseReport.sources.filter((source) => source.sourceName !== coverage.sourceName), coverage];
  const quality = buildGeneratedDataset(sources);
  const report: CrawlRunResult = {
    ...baseReport,
    finishedAt: new Date().toISOString(),
    pagesCrawled: sources.reduce((sum, source) => sum + source.pagesCrawled, 0),
    foodsFound: sources.reduce((sum, source) => sum + source.foods.length, 0),
    uniqueFoods: quality.dataset.foods.filter((food) => !food.hidden && food.reviewStatus !== "rejected").length,
    errors: sources.flatMap((source) => source.errors),
    requiredSourceCoverage: buildRequiredSourceCoverage(sources),
    sources
  };
  fs.writeFileSync(path.join(outputDir, "foods.generated.json"), JSON.stringify(quality.dataset, null, 2));
  fs.writeFileSync(path.join(outputDir, "shops.generated.json"), JSON.stringify(quality.shops, null, 2));
  fs.writeFileSync(path.join(outputDir, "areas.generated.json"), JSON.stringify(quality.areas, null, 2));
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        foods: quality.dataset.summary.generatedFoods,
        approved: quality.dataset.summary.approved,
        pending: quality.dataset.summary.pending,
        rejected: quality.dataset.summary.rejected,
        hidden: quality.dataset.summary.hidden,
        canonical: quality.dataset.foods.filter((food) => food.canonicalFood).length,
        coveragePages: coverage.pagesCrawled,
        coverageFoods: coverage.foods.length,
        shops: quality.shops.length,
        areas: quality.areas.length
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
