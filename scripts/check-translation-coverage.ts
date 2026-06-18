import * as fs from "node:fs";
import * as path from "node:path";
import { buildStoresFromFoods } from "@/lib/store-utils";
import type { FoodWithRelations } from "@/types/domain";

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

type StoreCoverageExtended = {
  generated_total: number;
  translated: number;
  missing: number;
  display_total: number;
  display_translated: number;
  display_missing: number;
  display_seed: number;
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

function buildDisplayStoreInfo() {
  const raw = readJson("scripts/output/foods.generated.json") as { foods?: FoodWithRelations[] };
  const foods = Array.isArray(raw.foods) ? raw.foods : [];
  const stores = buildStoresFromFoods(foods);
  const keys = new Set<string>();
  for (const store of stores) {
    keys.add(store.id);
    for (const alias of store.aliases) keys.add(alias);
  }
  return { keys, stores };
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

function countStoreCoverage(
  generatedIds: string[],
  translations: Record<string, TranslationEntry>,
  displayInfo: ReturnType<typeof buildDisplayStoreInfo>
): StoreCoverageExtended {
  const generatedIdSet = new Set(generatedIds);
  const { keys: displayKeys, stores: displayStores } = displayInfo;
  const translationKeys = Object.keys(translations);

  let translated = 0;
  let missing = 0;
  generatedIds.forEach((id) => {
    if (hasAnyTranslation(translations[id])) translated += 1;
    else missing += 1;
  });

  const display_total = displayStores.length;
  let display_translated = 0;
  let display_missing = 0;
  displayStores.forEach((store) => {
    const hasTranslation = [store.id, ...store.aliases].some((key) => hasAnyTranslation(translations[key]));
    if (hasTranslation) display_translated += 1;
    else display_missing += 1;
  });

  let display_seed = 0;
  let orphan = 0;
  let verified = 0;
  let needs_review = 0;
  translationKeys.forEach((id) => {
    const entry = translations[id];
    if (entry._status === "verified") verified += 1;
    if (entry._status === "needs_review") needs_review += 1;
    if (!generatedIdSet.has(id)) {
      if (displayKeys.has(id)) display_seed += 1;
      else orphan += 1;
    }
  });

  return {
    generated_total: generatedIds.length,
    translated,
    missing,
    display_total,
    display_translated,
    display_missing,
    display_seed,
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

function printStoreCoverage(title: string, coverage: StoreCoverageExtended) {
  console.log(`=== ${title} ===`);
  console.log(`generated_total:    ${coverage.generated_total}`);
  console.log(`translated:         ${coverage.translated}`);
  console.log(`missing:            ${coverage.missing}`);
  console.log(`display_total:      ${coverage.display_total}`);
  console.log(`display_translated: ${coverage.display_translated}`);
  console.log(`display_missing:    ${coverage.display_missing}`);
  console.log(`display_seed:       ${coverage.display_seed}`);
  console.log(`verified:           ${coverage.verified}`);
  console.log(`needs_review:       ${coverage.needs_review}`);
  console.log(`orphan:             ${coverage.orphan}`);
  console.log("");
}

const foodIds = readGeneratedIds("scripts/output/foods.generated.json", "foods");
const shopIds = readGeneratedIds("scripts/output/shops.generated.json");
const foodTranslations = readTranslations("data/translations/food-names.json");
const storeTranslations = readTranslations("data/translations/store-names.json");
const displayInfo = buildDisplayStoreInfo();

printCoverage("Food Translation Coverage", countCoverage(foodIds, foodTranslations));
printStoreCoverage("Store Translation Coverage", countStoreCoverage(shopIds, storeTranslations, displayInfo));
