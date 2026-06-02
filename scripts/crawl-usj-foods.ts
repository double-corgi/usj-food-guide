import fs from "node:fs";
import path from "node:path";
import type { CrawledFood, CrawlRunResult, CrawlSourceResult } from "./types/crawler";
import { crawlAllergy } from "./crawlers/crawl-allergy";
import { crawlMenuPdfs } from "./crawlers/crawl-menu-pdfs";
import { crawlNews } from "./crawlers/crawl-news";
import { crawlRestaurants } from "./crawlers/crawl-restaurants";
import { crawlSpecialPages } from "./crawlers/crawl-special-pages";
import { crawlTargetedPages } from "./crawlers/crawl-targeted-pages";
import { persistCrawlResult } from "./repositories/supabase-upsert";
import { buildGeneratedDataset } from "./utils/quality-foods";

type SourceName = "restaurants" | "allergy" | "events" | "news" | "pdfs" | "coverage" | "all";

const sourceMap = {
  restaurants: crawlRestaurants,
  allergy: crawlAllergy,
  events: crawlSpecialPages,
  news: crawlNews,
  pdfs: crawlMenuPdfs,
  coverage: () => crawlTargetedPages("coverage")
};

export async function crawlUsjFoods(source: SourceName = "all"): Promise<CrawlRunResult> {
  const startedAt = new Date().toISOString();
  const selected = (source === "all" ? Object.entries(sourceMap) : [[source, sourceMap[source]]]) as Array<
    [string, () => Promise<CrawlSourceResult>]
  >;
  const results: CrawlSourceResult[] = [];

  for (const [name, crawler] of selected) {
    try {
      console.log(`[crawl] start ${name}`);
      results.push(await crawler());
      console.log(`[crawl] done ${name}`);
    } catch (error) {
      results.push({
        sourceName: name,
        sourceUrl: "https://www.usj.co.jp/",
        pagesCrawled: 0,
        foods: [],
        errors: [error instanceof Error ? error.message : String(error)]
      });
    }
  }

  const quality = buildGeneratedDataset(results);
  const uniqueFoods = quality.dataset.foods.filter((food) => !food.hidden && food.reviewStatus !== "rejected");
  const run: CrawlRunResult = {
    startedAt,
    finishedAt: new Date().toISOString(),
    pagesCrawled: results.reduce((sum, result) => sum + result.pagesCrawled, 0),
    foodsFound: results.reduce((sum, result) => sum + result.foods.length, 0),
    uniqueFoods: uniqueFoods.length,
    addedCount: 0,
    updatedCount: 0,
    inactiveCount: 0,
    errors: results.flatMap((result) => result.errors),
    sources: results.map((result) => ({
      ...result,
      foods: dedupeFoods(result.foods)
    })),
    requiredSourceCoverage: buildRequiredSourceCoverage(results)
  };

  const persist = await persistCrawlResult(run, quality.dataset.foods);
  run.addedCount = persist.addedCount;
  run.updatedCount = persist.updatedCount;
  run.inactiveCount = persist.inactiveCount;

  writeReport(run, quality);
  return run;
}

function dedupeFoods(foods: CrawledFood[]) {
  const map = new Map<string, CrawledFood>();
  for (const food of foods) {
    const key = `${food.normalizedName}:${food.shopName}`;
    const current = map.get(key);
    if (!current || food.confidence > current.confidence || food.images.length > current.images.length) {
      map.set(key, food);
    }
  }
  return [...map.values()].sort((a, b) => b.confidence - a.confidence);
}

export const requiredSourceUrls = [
  "https://www.usj.co.jp/web/ja/jp/restaurants",
  "https://www.usj.co.jp/web/ja/jp/restaurants/food-cart",
  "https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food",
  "https://www.usj.co.jp/web/ja/jp/restaurants/super-nintendo-world-food",
  "https://www.usj.co.jp/web/ja/jp/restaurants/the-wizarding-world-of-harry-potter-food",
  "https://www.usj.co.jp/web/ja/jp/restaurants/minion-food",
  "https://castel.jp/p/3101"
];

export function buildRequiredSourceCoverage(results: CrawlSourceResult[]) {
  return requiredSourceUrls.map((url) => {
    const normalizedUrl = normalizeCoverageUrl(url);
    const matchedSources = results.filter((source) => {
      const fetched = source.fetchedUrls ?? [source.sourceUrl];
      return fetched.some((fetchedUrl) => normalizeCoverageUrl(fetchedUrl) === normalizedUrl);
    });
    const extractedFoods = results.reduce((sum, source) => {
      return sum + source.foods.filter((food) => normalizeCoverageUrl(food.sourceUrl) === normalizedUrl).length;
    }, 0);
    return {
      url,
      fetched: matchedSources.length > 0,
      sourceNames: matchedSources.map((source) => source.sourceName),
      extractedFoods
    };
  });
}

function normalizeCoverageUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    let pathname = parsed.pathname.replace(/\/$/, "");
    pathname = pathname.replace(/^\/tridiondata\/usj\/ja\/jp\//, "/web/ja/jp/");
    pathname = pathname.replace(/\/index\.html$/, "");
    return `${parsed.hostname.replace(/^www\./, "")}${pathname}`;
  } catch {
    return url.replace(/\/$/, "");
  }
}

function writeReport(run: CrawlRunResult, quality: ReturnType<typeof buildGeneratedDataset>) {
  const outputDir = path.join(process.cwd(), "scripts", "output");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "latest-crawl-report.json"), JSON.stringify(run, null, 2));
  fs.writeFileSync(
    path.join(outputDir, "latest-foods.json"),
    JSON.stringify(
      dedupeFoods(run.sources.flatMap((source) => source.foods)),
      null,
      2
    )
  );
  fs.writeFileSync(path.join(outputDir, "foods.generated.json"), JSON.stringify(quality.dataset, null, 2));
  fs.writeFileSync(path.join(outputDir, "shops.generated.json"), JSON.stringify(quality.shops, null, 2));
  fs.writeFileSync(path.join(outputDir, "areas.generated.json"), JSON.stringify(quality.areas, null, 2));
}

if (require.main === module) {
  const source = (process.argv[2] || "all") as SourceName;
  crawlUsjFoods(source)
    .then((result) => {
      console.log(
        JSON.stringify(
          {
            pagesCrawled: result.pagesCrawled,
            foodsFound: result.foodsFound,
            uniqueFoods: result.uniqueFoods,
            addedCount: result.addedCount,
            updatedCount: result.updatedCount,
            inactiveCount: result.inactiveCount,
            errors: result.errors.length
          },
          null,
          2
        )
      );
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
