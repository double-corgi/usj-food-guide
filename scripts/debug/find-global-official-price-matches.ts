import fs from "node:fs";
import path from "node:path";
import type { FoodCategory } from "../../types/domain";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";

type CrawlFood = {
  name?: string;
  normalizedName?: string;
  category?: FoodCategory;
  price?: number;
  sourceUrl?: string;
  officialUrl?: string;
  status?: string;
  endDate?: string;
};

type CrawlReport = {
  sources?: Array<{
    sourceName?: string;
    sourceUrl?: string;
    foods?: CrawlFood[];
  }>;
};

type Candidate = {
  name: string;
  category?: FoodCategory;
  price: number;
  sourceName: string;
  sourceUrl: string;
  officialUrl?: string;
  key: string;
};

const outputDir = path.join(process.cwd(), "scripts", "output");
const dataset = readJson<GeneratedDataset>(path.join(outputDir, "foods.generated.json"));
const report = readJson<CrawlReport>(path.join(outputDir, "latest-crawl-report.json"));
const today = "2026-05-29";

const foods = dataset.foods.filter(
  (food) =>
    food.reviewStatus === "approved" &&
    food.canonicalFood !== false &&
    !food.hidden &&
    food.displayQuality !== "low" &&
    food.nameQualityScore >= 60 &&
    food.confidenceScore >= 45 &&
    !food.compositeMenu &&
    Boolean(food.sourceUrl)
);
const missing = foods.filter((food) => !hasKnownPrice(food));
const candidates = buildCandidates(report);
const byKey = new Map<string, Candidate[]>();

for (const candidate of candidates) {
  const rows = byKey.get(candidate.key) ?? [];
  rows.push(candidate);
  byKey.set(candidate.key, rows);
}

const matches = missing
  .map((food) => {
    const key = keyFor(food.normalizedName ?? food.name, food.category);
    const candidatesForFood = (byKey.get(key) ?? []).filter((candidate) => isValidPrice(candidate.price, food.category));
    const uniquePrices = Array.from(new Set(candidatesForFood.map((candidate) => candidate.price)));
    return {
      foodId: food.id,
      name: food.name,
      category: food.category,
      currentSourceUrl: food.sourceUrl,
      candidates: candidatesForFood,
      uniquePrices
    };
  })
  .filter((row) => row.candidates.length > 0 && row.uniquePrices.length === 1)
  .sort((a, b) => a.name.localeCompare(b.name, "ja"));

console.log(JSON.stringify({ generatedAt: new Date().toISOString(), missing: missing.length, safeGlobalMatches: matches.length, matches }, null, 2));

function buildCandidates(crawlReport: CrawlReport) {
  const candidates: Candidate[] = [];
  for (const source of crawlReport.sources ?? []) {
    const sourceName = source.sourceName ?? "unknown";
    for (const food of source.foods ?? []) {
      if (!food.name || !food.price || !isValidPrice(food.price, food.category)) continue;
      const sourceUrl = food.officialUrl ?? food.sourceUrl ?? source.sourceUrl ?? "";
      if (!isOfficialSource(sourceUrl, sourceName)) continue;
      if (food.status === "ended" || (food.endDate && food.endDate < today)) continue;
      candidates.push({
        name: food.name,
        category: food.category,
        price: food.price,
        sourceName,
        sourceUrl,
        officialUrl: food.officialUrl,
        key: keyFor(food.normalizedName ?? food.name, food.category)
      });
    }
  }
  return candidates;
}

function hasKnownPrice(food: GeneratedFood) {
  return Boolean(food.price ?? food.priceMin ?? food.price_min ?? food.locations?.find((location) => location.price)?.price);
}

function isOfficialSource(sourceUrl: string, sourceName: string) {
  return /(?:^|\/\/)(?:www\.)?usj\.co\.jp/i.test(sourceUrl) || /^official-|USJ公式|公式/.test(sourceName);
}

function isValidPrice(price: number, category?: FoodCategory) {
  if (!Number.isInteger(price) || price < 100 || price > 12000) return false;
  if (category === "churro" && price > 1800) return false;
  if (category === "drink" && (price < 500 || price > 3500)) return false;
  return true;
}

function keyFor(name: string, category?: FoodCategory) {
  return `${category ?? "unknown"}:${normalizeName(name)}`;
}

function normalizeName(name: string) {
  return name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ "'’`´“”‘、。・･～〜~\-‐‑‒–—―!！?？:：()（）[\]【】]/g, "")
    .replace(/\s+/g, "");
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}
