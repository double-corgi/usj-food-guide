import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";
import type { FoodCategory } from "../../types/domain";

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

type CategoryBucket =
  | "チュリトス"
  | "ピザ"
  | "バーガー"
  | "プレート"
  | "デザート"
  | "ドリンク"
  | "キッズ"
  | "ライス"
  | "パスタ"
  | "その他";

type PriceCandidate = {
  name: string;
  normalizedName: string;
  category?: FoodCategory;
  price: number;
  sourceName: string;
  sourceUrl: string;
  officialUrl?: string;
  key: string;
};

type AuditRow = {
  foodId: string;
  name: string;
  category: FoodCategory;
  bucket: CategoryBucket;
  area: string;
  shop: string;
  sourceUrl: string;
  hasImage: boolean;
  priceStatus: "missing";
};

const outputDir = path.join(process.cwd(), "scripts", "output");
const datasetPath = path.join(outputDir, "foods.generated.json");
const crawlReportPath = path.join(outputDir, "latest-crawl-report.json");
const auditPath = path.join(outputDir, "price-audit.generated.json");
const applyChanges = process.argv.includes("--apply");
const today = "2026-05-29";

const dataset = readJson<GeneratedDataset>(datasetPath);
const crawlReport = readJson<CrawlReport>(crawlReportPath);
const visible = visibleFoods(dataset.foods);
const before = summarize(visible);
const unknownFoods = visible.filter((food) => !hasKnownPrice(food));
const candidates = buildCandidates(crawlReport);
const candidateByKey = new Map<string, PriceCandidate[]>();
for (const candidate of candidates) {
  const rows = candidateByKey.get(candidate.key) ?? [];
  rows.push(candidate);
  candidateByKey.set(candidate.key, rows);
}

const missingRows: AuditRow[] = unknownFoods.map((food) => ({
  foodId: food.id,
  name: food.name,
  category: food.category,
  bucket: bucketFor(food.category),
  area: food.area?.name ?? "エリア未確認",
  shop: food.shop?.name ?? "店舗未確認",
  sourceUrl: food.sourceUrl,
  hasImage: hasPublicImage(food),
  priceStatus: "missing"
}));

const updates: Array<{ foodId: string; name: string; price: number; sourceName: string; sourceUrl: string }> = [];
const skipped: Array<{ foodId: string; name: string; reason: string; candidateCount?: number }> = [];

for (const food of unknownFoods) {
  const key = keyFor(food.name, food.category);
  const matches = (candidateByKey.get(key) ?? []).filter((candidate) => isSafeCandidateForFood(candidate, food));
  const uniquePrices = Array.from(new Set(matches.map((candidate) => candidate.price)));
  if (uniquePrices.length === 1 && matches.length > 0) {
    const best = preferBestCandidate(matches);
    updates.push({ foodId: food.id, name: food.name, price: best.price, sourceName: best.sourceName, sourceUrl: best.officialUrl ?? best.sourceUrl });
    if (applyChanges) applyPrice(food, best);
  } else if (matches.length === 0) {
    skipped.push({ foodId: food.id, name: food.name, reason: "official-exact-price-candidate-not-found" });
  } else {
    skipped.push({ foodId: food.id, name: food.name, reason: "ambiguous-price-candidates", candidateCount: matches.length });
  }
}

if (applyChanges && updates.length > 0) {
  dataset.generatedAt = new Date().toISOString();
  writeJson(datasetPath, dataset);
}

const afterVisible = visibleFoods(dataset.foods);
const after = summarize(afterVisible);
const categoryStats = buildCategoryStats(afterVisible);
const missingByCategory = countBy(missingRows, (row) => row.bucket);
const report = {
  mode: applyChanges ? "apply" : "audit",
  generatedAt: new Date().toISOString(),
  totals: {
    foods: after.visibleFoods,
    images: after.imageFoods,
    placeholders: after.placeholders,
    priceKnownBefore: before.priceKnown,
    priceUnknownBefore: before.priceUnknown,
    priceKnownAfter: after.priceKnown,
    priceUnknownAfter: after.priceUnknown,
    priceRateAfter: `${Math.round((after.priceKnown / Math.max(after.visibleFoods, 1)) * 1000) / 10}%`,
    newPrices: updates.length,
    reducedUnknown: before.priceUnknown - after.priceUnknown
  },
  missingByCategory,
  categoryStats,
  updates,
  skipped,
  missingRows,
  missingTop50: [...missingRows].sort(compareMissingRows).slice(0, 50)
};

writeJson(auditPath, report);
console.log(JSON.stringify(report, null, 2));

function applyPrice(food: GeneratedFood, candidate: PriceCandidate) {
  const now = new Date().toISOString();
  food.price = candidate.price;
  food.priceMin = candidate.price;
  food.price_min = candidate.price;
  food.priceMax = undefined;
  food.price_max = undefined;
  food.priceNote = "公式ページで確認した価格";
  food.price_note = food.priceNote;
  food.priceSourceUrl = candidate.officialUrl ?? candidate.sourceUrl;
  food.price_source_url = food.priceSourceUrl;
  food.priceLastCheckedAt = now;
  food.price_last_checked_at = now;
  food.priceConfidenceScore = 95;
  food.price_confidence_score = 95;
  food.lastCheckedAt = now;
  food.last_checked_at = now;
}

function buildCandidates(report: CrawlReport) {
  const candidates: PriceCandidate[] = [];
  for (const source of report.sources ?? []) {
    const sourceName = source.sourceName ?? "unknown";
    for (const food of source.foods ?? []) {
      if (!food.name || !food.price || !isValidPrice(food.price, food.category)) continue;
      if (!isOfficialSource(source.sourceUrl ?? food.sourceUrl ?? food.officialUrl ?? "", sourceName)) continue;
      if (food.status === "ended" || (food.endDate && food.endDate < today)) continue;
      candidates.push({
        name: food.name,
        normalizedName: normalizeName(food.normalizedName ?? food.name),
        category: food.category,
        price: food.price,
        sourceName,
        sourceUrl: food.sourceUrl ?? source.sourceUrl ?? "",
        officialUrl: food.officialUrl,
        key: keyFor(food.normalizedName ?? food.name, food.category)
      });
    }
  }
  return candidates;
}

function isSafeCandidateForFood(candidate: PriceCandidate, food: GeneratedFood) {
  if (candidate.category && candidate.category !== food.category) return false;
  if (candidate.normalizedName !== normalizeName(food.normalizedName ?? food.name)) return false;
  if (!isValidPrice(candidate.price, food.category)) return false;
  return sameOfficialContext(candidate, food);
}

function sameOfficialContext(candidate: PriceCandidate, food: GeneratedFood) {
  const candidateUrls = [candidate.sourceUrl, candidate.officialUrl].filter(Boolean).map(normalizeUrl);
  const foodUrls = [food.sourceUrl, food.officialUrl, ...(food.locations ?? []).map((location) => location.sourceUrl ?? "")].filter(Boolean).map(normalizeUrl);
  if (candidateUrls.some((url) => foodUrls.includes(url))) return true;
  const candidateSlug = candidateUrls.map(lastPathSlug).find(Boolean);
  const foodSlugs = foodUrls.map(lastPathSlug).filter(Boolean);
  return Boolean(candidateSlug && foodSlugs.includes(candidateSlug));
}

function preferBestCandidate(candidates: PriceCandidate[]) {
  return [...candidates].sort((a, b) => Number(Boolean(b.officialUrl)) - Number(Boolean(a.officialUrl)) || a.sourceUrl.length - b.sourceUrl.length)[0];
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

function hasKnownPrice(food: GeneratedFood) {
  return Boolean(food.price ?? food.priceMin ?? food.price_min ?? food.locations?.find((location) => location.price)?.price);
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

function summarize(foods: GeneratedFood[]) {
  return {
    visibleFoods: foods.length,
    imageFoods: foods.filter((food) => Boolean(food.imageUrl ?? food.representativeImageUrl ?? food.images?.find((image) => image.enabled))).length,
    placeholders: foods.filter((food) => (food.imageUrl ?? food.representativeImageUrl ?? "").startsWith("/placeholders/")).length,
    priceKnown: foods.filter(hasKnownPrice).length,
    priceUnknown: foods.filter((food) => !hasKnownPrice(food)).length
  };
}

function hasPublicImage(food: GeneratedFood) {
  const imageUrl = food.imageUrl ?? food.representativeImageUrl ?? food.images?.find((image) => image.enabled)?.imageUrl;
  return Boolean(imageUrl) && !imageUrl?.startsWith("/placeholders/");
}

function compareMissingRows(a: AuditRow, b: AuditRow) {
  return priorityForBucket(a.bucket) - priorityForBucket(b.bucket) || a.name.localeCompare(b.name, "ja");
}

function priorityForBucket(bucket: CategoryBucket) {
  const order: CategoryBucket[] = ["ドリンク", "デザート", "バーガー", "プレート", "キッズ", "ピザ", "パスタ", "ライス", "チュリトス", "その他"];
  return order.indexOf(bucket) === -1 ? order.length : order.indexOf(bucket);
}

function buildCategoryStats(foods: GeneratedFood[]) {
  const rows = new Map<CategoryBucket, { total: number; known: number; unknown: number; rate: string }>();
  for (const food of foods) {
    const bucket = bucketFor(food.category);
    const current = rows.get(bucket) ?? { total: 0, known: 0, unknown: 0, rate: "0%" };
    current.total += 1;
    if (hasKnownPrice(food)) current.known += 1;
    else current.unknown += 1;
    current.rate = `${Math.round((current.known / Math.max(current.total, 1)) * 1000) / 10}%`;
    rows.set(bucket, current);
  }
  return Object.fromEntries(rows.entries());
}

function bucketFor(category: FoodCategory): CategoryBucket {
  if (category === "churro") return "チュリトス";
  if (category === "pizza") return "ピザ";
  if (category === "burger") return "バーガー";
  if (category === "dessert") return "デザート";
  if (category === "drink") return "ドリンク";
  if (category === "kids") return "キッズ";
  if (category === "rice") return "ライス";
  if (category === "noodle") return "パスタ";
  if (category === "set" || category === "chicken") return "プレート";
  return "その他";
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

function normalizeUrl(url: string) {
  return url.replace(/^https?:\/\/www\.usj\.co\.jp\/web\/ja\/jp\//, "https://www.usj.co.jp/tridiondata/usj/ja/jp/").replace(/\/$/, "");
}

function lastPathSlug(url: string) {
  const clean = url.split("?")[0].replace(/\/index\.html$/, "").replace(/\/$/, "");
  return clean.split("/").pop() ?? "";
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
