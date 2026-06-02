import fs from "node:fs";
import path from "node:path";
import type { Area, CrawlLog, FoodWithRelations, ImageCandidate, ReviewStatus, Shop } from "@/types/domain";

type GeneratedDatasetFile = {
  generatedAt?: string;
  summary?: Record<string, number>;
  foods?: FoodWithRelations[];
};

const outputDir = path.join(process.cwd(), "scripts", "output");

export function readGeneratedFoods(options: { includeHidden?: boolean; reviewStatuses?: ReviewStatus[] } = {}) {
  const dataset = readJson<GeneratedDatasetFile>("foods.generated.json");
  const foods = Array.isArray(dataset?.foods) ? dataset.foods : [];
  return foods.filter((food) => {
    if (!options.includeHidden && food.hidden) return false;
    if (options.reviewStatuses && !options.reviewStatuses.includes(food.reviewStatus)) return false;
    return true;
  });
}

export function readGeneratedAreas() {
  return readJson<Area[]>("areas.generated.json") ?? areasFromFoods(readGeneratedFoods({ includeHidden: true }));
}

export function readGeneratedShops() {
  return readJson<Shop[]>("shops.generated.json") ?? shopsFromFoods(readGeneratedFoods({ includeHidden: true }));
}

export function readGeneratedCrawlLogs(): CrawlLog[] {
  const report = readJson<{
    startedAt?: string;
    finishedAt?: string;
    pagesCrawled?: number;
    foodsFound?: number;
    uniqueFoods?: number;
    addedCount?: number;
    updatedCount?: number;
    inactiveCount?: number;
    errors?: string[];
  }>("latest-crawl-report.json");
  if (!report) return [];
  return [
    {
      id: "generated-latest",
      sourceName: "generated-json",
      sourceUrl: "scripts/output/foods.generated.json",
      status: report.errors && report.errors.length > 0 ? "failed" : "success",
      message: report.errors?.slice(0, 8).join("\n"),
      addedCount: report.addedCount ?? 0,
      updatedCount: report.updatedCount ?? 0,
      inactiveCount: report.inactiveCount ?? 0,
      pagesCrawled: report.pagesCrawled ?? 0,
      foodsFound: report.foodsFound ?? 0,
      createdAt: report.finishedAt ?? report.startedAt ?? new Date(0).toISOString()
    }
  ];
}

export function readGeneratedImageCandidates() {
  return readJson<ImageCandidate[]>("image-candidates.generated.json") ?? [];
}

export function readGeneratedImageCandidateReport() {
  return readJson<{
    generatedAt?: string;
    placeholderFoods?: number;
    candidates?: number;
    approved?: number;
    rejected?: number;
    watermark?: number;
    publicEligible?: number;
    googleEnabled?: boolean;
    googleStatus?: "ok" | "partial" | "not_configured";
    googleRequests?: number;
    googleQueriesExecuted?: number;
    googleItemsFetched?: number;
    googleErrors?: string[];
    googleCandidateCount?: number;
    mode?: string;
    noCandidateFoods?: string[];
  }>("image-candidates.crawl-report.json");
}

export function readGeneratedSummary() {
  const dataset = readJson<GeneratedDatasetFile>("foods.generated.json");
  const summary = dataset?.summary ?? {};
  const report = readJson<{
    generatedAt?: string;
    startedAt?: string;
    finishedAt?: string;
    pagesCrawled?: number;
    foodsFound?: number;
    sources?: Array<{ sourceName: string }>;
  }>("latest-crawl-report.json");
  return {
    ...summary,
    generatedAt: dataset?.generatedAt ?? report?.generatedAt ?? report?.finishedAt ?? report?.startedAt,
    totalCandidates: report?.foodsFound ?? summary.totalCandidates,
    pagesCrawled: report?.pagesCrawled ?? summary.pagesCrawled,
    sourceCount: report?.sources?.length ?? summary.sourceCount
  };
}

function readJson<T>(fileName: string): T | null {
  try {
    const filePath = path.join(outputDir, fileName);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch (error) {
    console.error(`Failed to read ${fileName}`, error);
    return null;
  }
}

function areasFromFoods(foods: FoodWithRelations[]) {
  return Array.from(new Map(foods.map((food) => [food.area.id, food.area])).values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

function shopsFromFoods(foods: FoodWithRelations[]) {
  return Array.from(new Map(foods.map((food) => [food.shop.id, food.shop])).values());
}
