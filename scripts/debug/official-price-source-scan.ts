import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";
import type { FoodCategory } from "../../types/domain";

type Match = {
  foodId: string;
  name: string;
  category: FoodCategory;
  price: number;
  sourceUrl: string;
  reason: string;
};

type Skip = {
  foodId: string;
  name: string;
  sourceUrl: string;
  reason: string;
  prices?: number[];
};

const outputDir = path.join(process.cwd(), "scripts", "output");
const datasetPath = path.join(outputDir, "foods.generated.json");
const outputPath = path.join(outputDir, "official-price-source-scan.generated.json");
const applyChanges = process.argv.includes("--apply");

const dataset = readJson<GeneratedDataset>(datasetPath);
const visible = visibleFoods(dataset.foods);
const missing = visible.filter((food) => !hasKnownPrice(food) && isOfficialUrl(food.sourceUrl));
const before = summarize(visible);
const matches: Match[] = [];
const skips: Skip[] = [];
const cache = new Map<string, string>();

for (const food of missing) {
  const sourceUrl = toFetchableUrl(food.sourceUrl);
  let raw = cache.get(sourceUrl);
  if (!raw) {
    try {
      const response = await fetch(sourceUrl, { headers: { "user-agent": "Mozilla/5.0 price-audit" } });
      if (!response.ok) {
        skips.push({ foodId: food.id, name: food.name, sourceUrl, reason: `fetch-failed-${response.status}` });
        continue;
      }
      raw = await response.text();
      cache.set(sourceUrl, raw);
    } catch (error) {
      skips.push({ foodId: food.id, name: food.name, sourceUrl, reason: `fetch-error:${error instanceof Error ? error.message : String(error)}` });
      continue;
    }
  }
  const priceMatch = findExactNamePrice(raw, food);
  if (priceMatch) {
    matches.push({ foodId: food.id, name: food.name, category: food.category, price: priceMatch.price, sourceUrl, reason: priceMatch.reason });
    if (applyChanges) applyPrice(food, priceMatch.price, sourceUrl);
  } else {
    const nearby = collectPricesNearName(raw, food);
    skips.push({
      foodId: food.id,
      name: food.name,
      sourceUrl,
      reason: nearby.length > 1 ? "ambiguous-nearby-prices" : nearby.length === 1 ? "nearby-price-below-confidence" : "exact-name-price-not-found",
      prices: nearby.slice(0, 8)
    });
  }
}

if (applyChanges && matches.length > 0) {
  dataset.generatedAt = new Date().toISOString();
  writeJson(datasetPath, dataset);
}

const afterVisible = visibleFoods(dataset.foods);
const after = summarize(afterVisible);
const report = {
  mode: applyChanges ? "apply" : "scan",
  generatedAt: new Date().toISOString(),
  totals: {
    foods: after.visibleFoods,
    images: after.imageFoods,
    placeholders: after.placeholders,
    priceKnownBefore: before.priceKnown,
    priceUnknownBefore: before.priceUnknown,
    priceKnownAfter: after.priceKnown,
    priceUnknownAfter: after.priceUnknown,
    newPrices: matches.length,
    reducedUnknown: before.priceUnknown - after.priceUnknown,
    scannedFoods: missing.length,
    fetchedSourceUrls: cache.size
  },
  matches,
  skips
};

writeJson(outputPath, report);
console.log(JSON.stringify(report, null, 2));

function findExactNamePrice(raw: string, food: GeneratedFood) {
  const windows = windowsForFood(raw, food);
  const candidatePrices = windows
    .flatMap((window) => extractPrices(window.text).map((price) => ({ price, reason: window.reason })))
    .filter(({ price }) => isValidPrice(price, food.category));
  const uniquePrices = Array.from(new Set(candidatePrices.map(({ price }) => price)));
  if (uniquePrices.length !== 1) return undefined;
  const selected = candidatePrices.find(({ price }) => price === uniquePrices[0]);
  return selected ? { price: selected.price, reason: selected.reason } : undefined;
}

function windowsForFood(raw: string, food: GeneratedFood) {
  const windows: Array<{ text: string; reason: string }> = [];
  for (const variant of nameVariants(food.name)) {
    const index = raw.indexOf(variant);
    if (index >= 0) {
      windows.push({ text: raw.slice(Math.max(0, index - 800), index + variant.length + 1400), reason: "exact-raw-name-window" });
    }
  }
  const objectWindows = componentLikeWindows(raw);
  const normalizedName = normalizeName(food.name);
  for (const objectText of objectWindows) {
    if (normalizeName(objectText).includes(normalizedName)) {
      windows.push({ text: objectText, reason: "same-json-object-window" });
    }
  }
  return dedupeTextWindows(windows);
}

function collectPricesNearName(raw: string, food: GeneratedFood) {
  return Array.from(new Set(windowsForFood(raw, food).flatMap((window) => extractPrices(window.text)).filter((price) => isValidPrice(price, food.category))));
}

function componentLikeWindows(raw: string) {
  const chunks: string[] = [];
  const normalizedNeedles = ["GDSOfferCard", "GDSContentFeature", "GDSArticleDetail", "GDSCard"];
  for (const needle of normalizedNeedles) {
    let start = 0;
    while (true) {
      const index = raw.indexOf(needle, start);
      if (index < 0) break;
      chunks.push(raw.slice(Math.max(0, index - 5000), Math.min(raw.length, index + 8000)));
      start = index + needle.length;
    }
  }
  return chunks;
}

function extractPrices(text: string) {
  const prices = new Set<number>();
  const patterns = [
    /[￥¥]\s*([0-9]{1,2}(?:,[0-9]{3})|[0-9]{3,5})/g,
    /([0-9]{1,2}(?:,[0-9]{3})|[0-9]{3,5})\s*円/g,
    /税込\s*([0-9]{1,2}(?:,[0-9]{3})|[0-9]{3,5})/g
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const value = Number(match[1].replace(/,/g, ""));
      if (Number.isFinite(value)) prices.add(value);
    }
  }
  return Array.from(prices);
}

function applyPrice(food: GeneratedFood, price: number, sourceUrl: string) {
  const now = new Date().toISOString();
  food.price = price;
  food.priceMin = price;
  food.price_min = price;
  food.priceMax = undefined;
  food.price_max = undefined;
  food.priceNote = "公式ページの商品名近傍で確認";
  food.price_note = food.priceNote;
  food.priceSourceUrl = sourceUrl;
  food.price_source_url = sourceUrl;
  food.priceLastCheckedAt = now;
  food.price_last_checked_at = now;
  food.priceConfidenceScore = 90;
  food.price_confidence_score = 90;
  food.lastCheckedAt = now;
  food.last_checked_at = now;
}

function nameVariants(name: string) {
  const variants = new Set<string>();
  variants.add(name);
  variants.add(name.replace(/~/g, "～").replace(/&/g, "＆"));
  variants.add(name.replace(/～/g, "~").replace(/＆/g, "&"));
  variants.add(name.replace(/\s+/g, ""));
  variants.add(name.replace(/\([^)]*\)/g, "").replace(/（[^）]*）/g, "").trim());
  variants.add(name.replace(/セット$/, ""));
  variants.add(name.replace(/・セット$/, ""));
  variants.add(name.replace(/プレート$/, ""));
  return Array.from(variants).filter((variant) => variant.length >= 4);
}

function isValidPrice(price: number, category?: FoodCategory) {
  if (!Number.isInteger(price) || price < 100 || price > 12000) return false;
  if (category === "churro" && price > 1800) return false;
  if (category === "drink" && (price < 500 || price > 3500)) return false;
  if (category === "popcorn" && price > 7000) return false;
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
    visibleFoods: foods.length,
    imageFoods: foods.filter((food) => Boolean(food.imageUrl ?? food.representativeImageUrl ?? food.images?.find((image) => image.enabled))).length,
    placeholders: foods.filter((food) => (food.imageUrl ?? food.representativeImageUrl ?? "").startsWith("/placeholders/")).length,
    priceKnown: foods.filter(hasKnownPrice).length,
    priceUnknown: foods.filter((food) => !hasKnownPrice(food)).length
  };
}

function isOfficialUrl(url: string) {
  return /(^https?:\/\/)?(?:www\.)?usj\.co\.jp/i.test(url);
}

function toFetchableUrl(url: string) {
  if (/^https?:\/\/www\.usj\.co\.jp\/web\/ja\/jp\//i.test(url)) {
    return url.replace("https://www.usj.co.jp/web/ja/jp/", "https://www.usj.co.jp/tridiondata/usj/ja/jp/").replace(/\/?$/, "/index.html");
  }
  return url;
}

function normalizeName(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ "'’`´“”‘、。・･～〜~\-‐‑‒–—―!！?？:：()（）[\]【】]/g, "")
    .replace(/\s+/g, "");
}

function dedupeTextWindows(windows: Array<{ text: string; reason: string }>) {
  const seen = new Set<string>();
  return windows.filter((window) => {
    const key = window.text.slice(0, 120);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
