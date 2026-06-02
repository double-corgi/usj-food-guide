import fs from "node:fs";
import path from "node:path";
import type { FoodCategory } from "../../types/domain";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";

type PriceHit = {
  foodId: string;
  name: string;
  category: FoodCategory;
  price: number;
  sourceUrl: string;
  reason: string;
  context: string;
};

const applyChanges = process.argv.includes("--apply");
const outputDir = path.join(process.cwd(), "scripts", "output");
const datasetPath = path.join(outputDir, "foods.generated.json");
const reportPath = path.join(outputDir, "official-price-context.generated.json");
const dataset = readJson<GeneratedDataset>(datasetPath);
const visible = visibleFoods(dataset.foods);
const before = summarize(visible);
const unknownFoods = visible.filter((food) => !hasKnownPrice(food));
const foodsBySource = groupBy(
  unknownFoods.filter((food) => isOfficialUrl(food.sourceUrl)),
  (food) => food.sourceUrl
);
const hits: PriceHit[] = [];
const noHits: Array<{ foodId: string; name: string; sourceUrl: string; reason: string }> = [];
const errors: Array<{ sourceUrl: string; message: string }> = [];

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  for (const [sourceUrl, foods] of foodsBySource.entries()) {
    try {
      const text = await fetchText(sourceUrl);
      const blocks = extractBlocks(text);
      for (const food of foods) {
        const foodHits = findPriceHits(food, sourceUrl, blocks);
        if (foodHits.length === 1) {
          hits.push(foodHits[0]);
          if (applyChanges) applyPrice(food, foodHits[0]);
        } else if (foodHits.length === 0) {
          noHits.push({ foodId: food.id, name: food.name, sourceUrl, reason: "same-block-official-price-not-found" });
        } else {
          noHits.push({ foodId: food.id, name: food.name, sourceUrl, reason: "multiple-same-block-prices" });
        }
      }
    } catch (error) {
      errors.push({ sourceUrl, message: error instanceof Error ? error.message : String(error) });
    }
  }

  if (applyChanges && hits.length > 0) {
    dataset.generatedAt = new Date().toISOString();
    writeJson(datasetPath, dataset);
  }

  const afterVisible = visibleFoods(dataset.foods);
  const after = summarize(afterVisible);
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
      newPrices: hits.length,
      reducedUnknown: before.priceUnknown - after.priceUnknown,
      sourcesChecked: foodsBySource.size,
      errors: errors.length
    },
    hits,
    noHits,
    errors
  };
  writeJson(reportPath, report);
  console.log(JSON.stringify(report, null, 2));
}

function findPriceHits(food: GeneratedFood, sourceUrl: string, blocks: string[]): PriceHit[] {
  const exactName = normalize(food.name);
  const shortName = normalize(shortenName(food.name));
  const candidates = new Map<number, PriceHit>();
  for (const block of blocks) {
    const prices = extractPriceMatches(block)
      .filter((match) => isValidPrice(match.price, food.category))
      .filter((match) => {
        const window = normalize(block.slice(Math.max(0, match.index - 300), match.index + 300));
        return window.includes(exactName) || (shortName.length >= 6 && window.includes(shortName));
      });
    const uniquePrices = Array.from(new Set(prices.map((match) => match.price)));
    if (uniquePrices.length !== 1) continue;
    const price = uniquePrices[0];
    const firstMatch = prices.find((match) => match.price === price);
    candidates.set(price, {
      foodId: food.id,
      name: food.name,
      category: food.category,
      price,
      sourceUrl,
      reason: "official-same-block-name-price",
      context: block.slice(Math.max(0, (firstMatch?.index ?? 0) - 220), (firstMatch?.index ?? 0) + 220)
    });
  }
  return Array.from(candidates.values());
}

function extractBlocks(text: string) {
  const blocks: string[] = [];
  try {
    const json = JSON.parse(text);
    collectJsonBlocks(json, blocks);
  } catch {
    // Plain HTML fallback below.
  }
  const htmlBlocks = text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .split(/<\/(?:li|article|section|tr|dl|div|p|h[1-6])>/gi)
    .map((block) => stripHtml(block))
    .filter((block) => block.length >= 8 && /(?:円|￥|¥)/.test(block));
  blocks.push(...htmlBlocks);
  return Array.from(new Set(blocks.map(normalizeSpace).filter((block) => block.length >= 8 && /(?:円|￥|¥)/.test(block))));
}

function collectJsonBlocks(value: unknown, blocks: string[]) {
  if (!value) return;
  if (typeof value === "string") {
    const stripped = stripHtml(value);
    if (/(?:円|￥|¥)/.test(stripped)) blocks.push(stripped);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectJsonBlocks(item, blocks);
    return;
  }
  if (typeof value === "object") {
    const strings: string[] = [];
    for (const item of Object.values(value)) collectStrings(item, strings);
    const block = stripHtml(strings.join(" "));
    if (/(?:円|￥|¥)/.test(block) && block.length <= 2200) blocks.push(block);
    for (const item of Object.values(value)) collectJsonBlocks(item, blocks);
  }
}

function collectStrings(value: unknown, rows: string[]) {
  if (!value) return;
  if (typeof value === "string") rows.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, rows));
  else if (typeof value === "object") Object.values(value).forEach((item) => collectStrings(item, rows));
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; usj-food-price-audit/1.0)"
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function applyPrice(food: GeneratedFood, hit: PriceHit) {
  const now = new Date().toISOString();
  food.price = hit.price;
  food.priceMin = hit.price;
  food.price_min = hit.price;
  food.priceMax = undefined;
  food.price_max = undefined;
  food.priceNote = "公式ページ同一ブロックで確認した価格";
  food.price_note = food.priceNote;
  food.priceSourceUrl = hit.sourceUrl;
  food.price_source_url = hit.sourceUrl;
  food.priceLastCheckedAt = now;
  food.price_last_checked_at = now;
  food.priceConfidenceScore = 90;
  food.price_confidence_score = 90;
  food.lastCheckedAt = now;
  food.last_checked_at = now;
}

function extractPriceMatches(text: string) {
  const prices = new Map<string, { price: number; index: number }>();
  const patterns = [
    /(?:税込\s*)?[￥¥]\s*([0-9]{1,2}(?:,[0-9]{3})|[0-9]{3,5})/g,
    /([0-9]{1,2}(?:,[0-9]{3})|[0-9]{3,5})\s*円/g
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const price = Number(match[1].replace(/,/g, ""));
      prices.set(`${price}:${match.index ?? 0}`, { price, index: match.index ?? 0 });
    }
  }
  return Array.from(prices.values());
}

function isValidPrice(price: number, category?: FoodCategory) {
  if (!Number.isInteger(price) || price < 100 || price > 12000) return false;
  if (category === "churro" && price > 1800) return false;
  if (category === "drink" && (price < 500 || price > 3500)) return false;
  return true;
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
    hasPublicImage: Boolean(primary) && !primary.startsWith("/placeholders/")
  };
}

function shortenName(name: string) {
  return name
    .replace(/[（(].*?[）)]/g, "")
    .replace(/~.*?~/g, "")
    .replace(/～.*?～/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(value: string) {
  return normalizeSpace(
    value
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
  );
}

function normalizeSpace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalize(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ "'’`´“”‘、。・･～〜~\-‐‑‒–—―!！?？:：()（）[\]【】&＆・]/g, "")
    .replace(/\s+/g, "");
}

function isOfficialUrl(url: string) {
  return /(?:^|\/\/)(?:www\.)?usj\.co\.jp/i.test(url);
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

function percent(numerator: number, denominator: number) {
  return `${Math.round((numerator / Math.max(denominator, 1)) * 1000) / 10}%`;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
