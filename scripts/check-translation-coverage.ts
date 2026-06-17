import * as fs from "node:fs";
import * as path from "node:path";

type GeneratedItem = {
  id?: unknown;
};

type TranslationEntry = {
  en?: unknown;
  ko?: unknown;
  "zh-TW"?: unknown;
  _status?: unknown;
};

type Coverage = {
  total: number;
  translated: number;
  missing: number;
  verified: number;
  needs_review: number;
  orphan: number;
};

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), "utf-8")) as unknown;
}

function readGeneratedIds(filePath: string, collectionKey?: string): string[] {
  const raw = readJson(filePath);
  const items = collectionKey && isRecord(raw) ? raw[collectionKey] : raw;
  if (!Array.isArray(items)) {
    throw new Error(`${filePath} does not contain a generated item array`);
  }

  return (items as GeneratedItem[])
    .map((item) => item.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

function readTranslations(filePath: string): Record<string, TranslationEntry> {
  const raw = readJson(filePath);
  if (!isRecord(raw)) {
    throw new Error(`${filePath} must be an object`);
  }
  return raw as Record<string, TranslationEntry>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasAnyTranslation(entry: TranslationEntry | undefined): boolean {
  if (!entry) return false;
  return ["en", "ko", "zh-TW"].some((locale) => {
    const value = entry[locale as keyof TranslationEntry];
    return typeof value === "string" && value.trim().length > 0;
  });
}

function countCoverage(generatedIds: string[], translations: Record<string, TranslationEntry>): Coverage {
  let translated = 0;
  let missing = 0;
  let verified = 0;
  let needs_review = 0;
  const generatedIdSet = new Set(generatedIds);

  generatedIds.forEach((id) => {
    const entry = translations[id];
    if (hasAnyTranslation(entry)) translated += 1;
    else missing += 1;
  });

  Object.entries(translations).forEach(([id, entry]) => {
    if (entry._status === "verified") verified += 1;
    if (entry._status === "needs_review") needs_review += 1;
    if (!generatedIdSet.has(id)) return;
  });

  const orphan = Object.keys(translations).filter((id) => !generatedIdSet.has(id)).length;

  return {
    total: generatedIds.length,
    translated,
    missing,
    verified,
    needs_review,
    orphan
  };
}

function printCoverage(title: string, coverage: Coverage) {
  console.log(`=== ${title} ===`);
  console.log(`total:        ${coverage.total}`);
  console.log(`translated:   ${coverage.translated}`);
  console.log(`missing:      ${coverage.missing}`);
  console.log(`verified:     ${coverage.verified}`);
  console.log(`needs_review: ${coverage.needs_review}`);
  console.log(`orphan:       ${coverage.orphan}`);
  console.log("");
}

const foodIds = readGeneratedIds("scripts/output/foods.generated.json", "foods");
const shopIds = readGeneratedIds("scripts/output/shops.generated.json");
const foodTranslations = readTranslations("data/translations/food-names.json");
const storeTranslations = readTranslations("data/translations/store-names.json");

printCoverage("Food Translation Coverage", countCoverage(foodIds, foodTranslations));
printCoverage("Store Translation Coverage", countCoverage(shopIds, storeTranslations));
