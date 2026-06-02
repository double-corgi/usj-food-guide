import fs from "node:fs";
import path from "node:path";
import type { FoodCategory } from "../../types/domain";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";

type Bucket =
  | "チュリトス"
  | "ピザ"
  | "バーガー"
  | "プレート"
  | "パスタ"
  | "ライス"
  | "キッズ"
  | "ドリンク"
  | "デザート"
  | "その他";

type TrustedPrice = {
  name: string;
  normalizedName: string;
  category?: FoodCategory;
  price: number;
  sourceName: string;
  sourceUrl: string;
  reason: string;
};

type CrawlReport = {
  sources?: Array<{
    sourceName?: string;
    sourceUrl?: string;
    foods?: Array<{
      name?: string;
      normalizedName?: string;
      category?: FoodCategory;
      price?: number;
      sourceUrl?: string;
      officialUrl?: string;
      status?: string;
      endDate?: string;
    }>;
  }>;
};

const applyChanges = process.argv.includes("--apply");
const outputDir = path.join(process.cwd(), "scripts", "output");
const datasetPath = path.join(outputDir, "foods.generated.json");
const crawlReportPath = path.join(outputDir, "latest-crawl-report.json");
const reportPath = path.join(outputDir, "trusted-price-backfill.generated.json");
const sourceScripts = [
  {
    file: "scripts/debug/promote-safe-official-visible-foods.ts",
    fallbackSourceName: "USJ公式 キノピオ・カフェ メニューPDF",
    fallbackSourceUrl: "https://www.usj.co.jp/tridiondata/usj/ja/jp/files/documents/usj-pdf-restaurant-other-menu-kinopios-cafe-en.pdf"
  },
  {
    file: "scripts/debug/apply-186-quality-phase.ts",
    fallbackSourceName: "USJ公式 レストランマップPDF",
    fallbackSourceUrl: "https://www.usj.co.jp/pdf/map_restaurant.pdf"
  },
  {
    file: "scripts/debug/complete-placeholder-zero-phase.ts",
    fallbackSourceName: "USJ公式 低アレルゲンメニュー詳細PDF",
    fallbackSourceUrl: "https://www.usj.co.jp/contentdata/usj/ja/jp/files/documents/usj-pdf-serviceguide-food-allergies-detail-20260303.pdf"
  }
];

const dataset = readJson<GeneratedDataset>(datasetPath);
const crawlReport = fs.existsSync(crawlReportPath) ? readJson<CrawlReport>(crawlReportPath) : { sources: [] };
const visibleBefore = visibleFoods(dataset.foods);
const before = summarize(visibleBefore);
const imageBefore = new Map(visibleBefore.map((food) => [food.id, imageState(food)]));
const trustedPrices = [...buildTrustedPrices(), ...buildDatasetPriceCandidates(dataset), ...buildCrawlReportPriceCandidates(crawlReport)];
const trustedByName = groupBy(trustedPrices, (price) => price.normalizedName);
const updates: Array<{ foodId: string; name: string; category: FoodCategory; price: number; sourceName: string; sourceUrl: string }> = [];
const skipped: Array<{ foodId: string; name: string; reason: string; candidates?: number; prices?: number[] }> = [];

for (const food of visibleBefore) {
  if (hasKnownPrice(food)) continue;
  const candidates = (trustedByName.get(normalizeName(food.normalizedName ?? food.name)) ?? []).filter((candidate) =>
    isSafeCandidate(food, candidate)
  );
  const uniquePrices = Array.from(new Set(candidates.map((candidate) => candidate.price)));
  if (uniquePrices.length === 1 && candidates.length > 0) {
    const chosen = preferCandidate(candidates, food);
    updates.push({
      foodId: food.id,
      name: food.name,
      category: food.category,
      price: chosen.price,
      sourceName: chosen.sourceName,
      sourceUrl: chosen.sourceUrl
    });
    if (applyChanges) applyPrice(food, chosen);
  } else if (candidates.length > 0) {
    skipped.push({ foodId: food.id, name: food.name, reason: "conflicting-trusted-prices", candidates: candidates.length, prices: uniquePrices });
  }
}

if (applyChanges && updates.length > 0) {
  dataset.generatedAt = new Date().toISOString();
  writeJson(datasetPath, dataset);
}

const visibleAfter = visibleFoods(dataset.foods);
const after = summarize(visibleAfter);
const imageRegressions = visibleAfter
  .map((food) => {
    const beforeState = imageBefore.get(food.id);
    const afterState = imageState(food);
    if (!beforeState) return undefined;
    if (beforeState.hasPublicImage && !afterState.hasPublicImage) return { id: food.id, name: food.name, before: beforeState, after: afterState };
    if (beforeState.primary && beforeState.primary !== afterState.primary) return { id: food.id, name: food.name, before: beforeState, after: afterState };
    return undefined;
  })
  .filter(Boolean);

const report = {
  mode: applyChanges ? "apply" : "dry-run",
  generatedAt: new Date().toISOString(),
  totals: {
    foodsBefore: before.foods,
    foodsAfter: after.foods,
    imagesBefore: before.images,
    imagesAfter: after.images,
    placeholdersBefore: before.placeholders,
    placeholdersAfter: after.placeholders,
    priceKnownBefore: before.priceKnown,
    priceKnownAfter: after.priceKnown,
    priceUnknownBefore: before.priceUnknown,
    priceUnknownAfter: after.priceUnknown,
    priceRateBefore: percent(before.priceKnown, before.foods),
    priceRateAfter: percent(after.priceKnown, after.foods),
    newPrices: updates.length,
    reducedUnknown: before.priceUnknown - after.priceUnknown,
    trustedRegistrySize: trustedPrices.length,
    skippedConflicts: skipped.length,
    imageRegressions: imageRegressions.length
  },
  categoryStats: buildCategoryStats(visibleAfter),
  updates,
  skipped,
  stillUnknown: visibleAfter
    .filter((food) => !hasKnownPrice(food))
    .map((food) => ({
      foodId: food.id,
      name: food.name,
      category: food.category,
      bucket: bucketFor(food.category),
      shop: food.shop?.name ?? "店舗未確認",
      area: food.area?.name ?? "エリア未確認",
      sourceUrl: food.sourceUrl
    })),
  imageRegressions
};

writeJson(reportPath, report);
console.log(JSON.stringify(report, null, 2));
if (imageRegressions.length > 0 || after.foods < before.foods || after.images < before.images || after.placeholders > before.placeholders) {
  process.exitCode = 1;
}

function buildTrustedPrices() {
  const rows: TrustedPrice[] = [];
  for (const source of sourceScripts) {
    if (!fs.existsSync(source.file)) continue;
    const raw = fs.readFileSync(source.file, "utf8");
    const objectPattern = /\{[\s\S]*?name:\s*["']([^"']+)["'][\s\S]*?price:\s*(\d+)[\s\S]*?\}/g;
    for (const match of raw.matchAll(objectPattern)) {
      const block = match[0];
      const name = match[1].trim();
      const price = Number(match[2]);
      const category = parseCategory(block);
      if (!name || !isValidPrice(price, category)) continue;
      const sourceUrl = parseSourceUrl(block, source.fallbackSourceUrl);
      const sourceName = parseSourceName(block, source.fallbackSourceName);
      if (!isOfficialSource(sourceUrl, sourceName)) continue;
      rows.push({
        name,
        normalizedName: normalizeName(name),
        category,
        price,
        sourceName,
        sourceUrl,
        reason: "trusted-existing-official-price-registry"
      });
    }
  }
  return dedupeTrusted(rows);
}

function buildDatasetPriceCandidates(input: GeneratedDataset) {
  const rows: TrustedPrice[] = [];
  for (const food of input.foods) {
    const price = food.price ?? food.priceMin ?? food.price_min ?? food.locations?.find((location) => location.price)?.price;
    if (!price || !isValidPrice(price, food.category)) continue;
    const sourceUrl = food.priceSourceUrl ?? food.price_source_url ?? food.sourceUrl ?? food.locations?.find((location) => location.price)?.sourceUrl ?? "";
    const sourceName = food.sourceNames?.find(Boolean) ?? "generated-food-price";
    if (!isOfficialSource(sourceUrl, sourceName)) continue;
    rows.push({
      name: food.name,
      normalizedName: normalizeName(food.normalizedName ?? food.name),
      category: food.category,
      price,
      sourceName,
      sourceUrl,
      reason: "exact-match-existing-generated-price"
    });
  }
  return rows;
}

function buildCrawlReportPriceCandidates(report: CrawlReport) {
  const rows: TrustedPrice[] = [];
  for (const source of report.sources ?? []) {
    const sourceName = source.sourceName ?? "crawl-report";
    for (const food of source.foods ?? []) {
      if (!food.name || !food.price || !isValidPrice(food.price, food.category)) continue;
      if (food.status === "ended" || (food.endDate && food.endDate < "2026-05-29")) continue;
      const sourceUrl = food.officialUrl ?? food.sourceUrl ?? source.sourceUrl ?? "";
      if (!isOfficialSource(sourceUrl, sourceName)) continue;
      rows.push({
        name: food.name,
        normalizedName: normalizeName(food.normalizedName ?? food.name),
        category: food.category,
        price: food.price,
        sourceName,
        sourceUrl,
        reason: "exact-match-crawl-report-price"
      });
    }
  }
  return rows;
}

function dedupeTrusted(rows: TrustedPrice[]) {
  const seen = new Set<string>();
  const deduped: TrustedPrice[] = [];
  for (const row of rows) {
    const key = `${row.normalizedName}:${row.category ?? "unknown"}:${row.price}:${row.sourceUrl}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }
  return deduped;
}

function parseCategory(block: string): FoodCategory | undefined {
  const match = block.match(/category:\s*["']([^"']+)["']/);
  return match?.[1] as FoodCategory | undefined;
}

function parseSourceUrl(block: string, fallback: string) {
  const literal = block.match(/sourceUrl:\s*["']([^"']+)["']/)?.[1];
  if (literal) return literal;
  if (/sourceUrl:\s*officialLowAllergenPdf/.test(block)) {
    return "https://www.usj.co.jp/contentdata/usj/ja/jp/files/documents/usj-pdf-serviceguide-food-allergies-detail-20260303.pdf";
  }
  if (/sourceUrl:\s*kinopioPdfSource/.test(block)) {
    return "https://www.usj.co.jp/tridiondata/usj/ja/jp/files/documents/usj-pdf-restaurant-other-menu-kinopios-cafe-en.pdf";
  }
  return fallback;
}

function parseSourceName(block: string, fallback: string) {
  return block.match(/sourceName:\s*["']([^"']+)["']/)?.[1] ?? fallback;
}

function isSafeCandidate(food: GeneratedFood, candidate: TrustedPrice) {
  if (candidate.category && candidate.category !== food.category) return false;
  if (candidate.normalizedName !== normalizeName(food.normalizedName ?? food.name)) return false;
  if (!isValidPrice(candidate.price, food.category)) return false;
  return true;
}

function preferCandidate(candidates: TrustedPrice[], food: GeneratedFood) {
  const foodSource = `${food.sourceUrl} ${food.officialUrl ?? ""} ${(food.sourceNames ?? []).join(" ")}`.toLowerCase();
  return [...candidates].sort((a, b) => {
    const aSameSource = foodSource.includes(lastSlug(a.sourceUrl));
    const bSameSource = foodSource.includes(lastSlug(b.sourceUrl));
    return Number(bSameSource) - Number(aSameSource) || scoreSource(b) - scoreSource(a);
  })[0];
}

function scoreSource(candidate: TrustedPrice) {
  if (/usj\.co\.jp/i.test(candidate.sourceUrl)) return 3;
  if (/^official-|USJ公式|公式/.test(candidate.sourceName)) return 2;
  return 1;
}

function applyPrice(food: GeneratedFood, candidate: TrustedPrice) {
  const now = new Date().toISOString();
  food.price = candidate.price;
  food.priceMin = candidate.price;
  food.price_min = candidate.price;
  food.priceMax = undefined;
  food.price_max = undefined;
  food.priceNote = "公式資料で確認した価格";
  food.price_note = food.priceNote;
  food.priceSourceUrl = candidate.sourceUrl;
  food.price_source_url = candidate.sourceUrl;
  food.priceLastCheckedAt = now;
  food.price_last_checked_at = now;
  food.priceConfidenceScore = 95;
  food.price_confidence_score = 95;
  food.lastCheckedAt = now;
  food.last_checked_at = now;
}

function isValidPrice(price: number, category?: FoodCategory) {
  if (!Number.isInteger(price) || price < 100 || price > 12000) return false;
  if (category === "churro" && price > 1800) return false;
  if (category === "drink" && (price < 500 || price > 3500)) return false;
  return true;
}

function isOfficialSource(sourceUrl: string, sourceName: string) {
  return /(?:^|\/\/)(?:www\.)?usj\.co\.jp/i.test(sourceUrl) || /^official-|USJ公式|公式/.test(sourceName);
}

function visibleFoods(foods: GeneratedFood[]) {
  return foods.filter(
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
}

function hasKnownPrice(food: GeneratedFood) {
  return Boolean(food.price ?? food.priceMin ?? food.price_min ?? food.locations?.find((location) => location.price)?.price);
}

function summarize(foods: GeneratedFood[]) {
  return {
    foods: foods.length,
    images: foods.filter((food) => imageState(food).hasPublicImage).length,
    placeholders: foods.filter((food) => imageState(food).primary.startsWith("/placeholders/")).length,
    priceKnown: foods.filter(hasKnownPrice).length,
    priceUnknown: foods.filter((food) => !hasKnownPrice(food)).length
  };
}

function imageState(food: GeneratedFood) {
  const primary = food.imageUrl ?? food.representativeImageUrl ?? food.images?.find((image) => image.enabled)?.imageUrl ?? "";
  return {
    primary,
    hasPublicImage: Boolean(primary) && !primary.startsWith("/placeholders/"),
    imageUrl: food.imageUrl,
    representativeImageUrl: food.representativeImageUrl,
    imageCount: food.images?.filter((image) => image.enabled && image.imageUrl).length ?? 0,
    approved: food.images?.some((image) => image.imageApproved || image.image_approved) ?? false,
    verified: food.images?.some((image) => image.imageVerified) ?? false,
    manuallyAdded: food.images?.some((image) => image.manuallyAdded || image.manually_added) ?? false
  };
}

function buildCategoryStats(foods: GeneratedFood[]) {
  const stats = new Map<Bucket, { total: number; known: number; unknown: number; rate: string }>();
  for (const food of foods) {
    const bucket = bucketFor(food.category);
    const current = stats.get(bucket) ?? { total: 0, known: 0, unknown: 0, rate: "0%" };
    current.total += 1;
    if (hasKnownPrice(food)) current.known += 1;
    else current.unknown += 1;
    current.rate = percent(current.known, current.total);
    stats.set(bucket, current);
  }
  return Object.fromEntries(stats.entries());
}

function bucketFor(category: FoodCategory): Bucket {
  if (category === "churro") return "チュリトス";
  if (category === "pizza") return "ピザ";
  if (category === "burger") return "バーガー";
  if (category === "set" || category === "chicken") return "プレート";
  if (category === "noodle") return "パスタ";
  if (category === "rice") return "ライス";
  if (category === "kids") return "キッズ";
  if (category === "drink") return "ドリンク";
  if (category === "dessert") return "デザート";
  return "その他";
}

function percent(numerator: number, denominator: number) {
  return `${Math.round((numerator / Math.max(denominator, 1)) * 1000) / 10}%`;
}

function normalizeName(name: string) {
  return name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ "'’`´“”‘、。・･～〜~\-‐‑‒–—―!！?？:：()（）[\]【】&＆・]/g, "")
    .replace(/\s+/g, "");
}

function lastSlug(url: string) {
  return url.split("?")[0].replace(/\/index\.html$/, "").replace(/\/$/, "").split("/").pop()?.toLowerCase() ?? "";
}

function groupBy<T, K>(items: T[], getKey: (item: T) => K) {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = getKey(item);
    const rows = map.get(key) ?? [];
    rows.push(item);
    map.set(key, rows);
  }
  return map;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
