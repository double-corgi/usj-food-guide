import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

type UnknownRecord = Record<string, unknown>;
type SaleStatus = "active" | "paused" | "ended" | "unknown";
type SourceType = "official" | "trusted-site" | "manual-confirmed";
type Confidence = "high" | "medium" | "low";
type FoodCategory =
  | "churro"
  | "popcorn"
  | "drink"
  | "dessert"
  | "burger"
  | "snack"
  | "seasonal"
  | "unknown";

type ManualFood = {
  action: "add";
  foodNameJa: string;
  foodNameEn?: string;
  priceYen: number | null;
  area: string;
  shopName: string;
  categoryTags: string[];
  saleStatus: SaleStatus;
  periodStart?: string | null;
  periodEnd?: string | null;
  image?: string | null;
  imageSourceUrl?: string | null;
  infoSourceUrl: string;
  sourceType: SourceType;
  confidence: Confidence;
  notes?: string;
  reviewedBy: string;
  reviewedAt: string;
};

const foodsPath = path.resolve(process.cwd(), "scripts/output/foods.generated.json");
const manualFoodsPath = path.resolve(process.cwd(), "data/manual-foods.json");

const allowedManualFoodFields = new Set([
  "action",
  "foodNameJa",
  "foodNameEn",
  "priceYen",
  "area",
  "shopName",
  "categoryTags",
  "saleStatus",
  "periodStart",
  "periodEnd",
  "image",
  "imageSourceUrl",
  "infoSourceUrl",
  "sourceType",
  "confidence",
  "notes",
  "reviewedBy",
  "reviewedAt"
]);

const allowedCategoryTags = new Set([
  "churros",
  "popcorn",
  "drink",
  "burger",
  "plate",
  "dessert",
  "snack",
  "cart",
  "seasonal",
  "universal-market",
  "nintendo",
  "minion",
  "jurassic",
  "harry-potter",
  "conan",
  "sanrio"
]);

const validSaleStatuses = new Set<SaleStatus>(["active", "paused", "ended", "unknown"]);
const validSourceTypes = new Set<SourceType>(["official", "trusted-site", "manual-confirmed"]);
const validConfidences = new Set<Confidence>(["high", "medium", "low"]);

main();

function main() {
  const manualFoods = readManualFoods();
  if (manualFoods.length === 0) {
    console.log("data/manual-foods.json is empty; no generated JSON changes.");
    return;
  }

  const dataset = readJson(foodsPath);
  if (!isRecord(dataset) || !Array.isArray(dataset.foods)) {
    throw new Error("scripts/output/foods.generated.json must contain { foods: [...] }");
  }

  const beforeDataset = clone(dataset);
  const foods = dataset.foods.filter(isRecord);
  const existingIds = new Set<string>();
  for (const food of foods) {
    const id = getString(food.id);
    if (id) existingIds.add(id);
  }

  const additions = manualFoods.map((manualFood) => {
    const id = buildManualFoodId(manualFood);
    if (existingIds.has(id)) throw new Error(`manual food id collides with existing food: ${id}`);
    if (existingIds.has(manualFood.foodNameJa)) throw new Error(`manual food name cannot be used as id: ${manualFood.foodNameJa}`);
    existingIds.add(id);
    return buildGeneratedFood(id, manualFood, foods);
  });

  for (const addition of additions) dataset.foods.push(addition);
  assertOnlyAppendedFoods(beforeDataset, dataset, new Set(additions.map((food) => getString(food.id))));

  console.log("Manual foods added:");
  for (const food of additions) {
    console.log([getString(food.id), getString(food.name), getString(food.sourceUrl)].join(" | "));
  }

  fs.writeFileSync(foodsPath, `${JSON.stringify(dataset, null, 2)}\n`);
}

function readManualFoods(): ManualFood[] {
  const raw = readJson(manualFoodsPath);
  if (!Array.isArray(raw)) throw new Error("data/manual-foods.json must contain an array");
  return raw.map((entry) => {
    if (!isRecord(entry)) throw new Error("manual food entries must be objects");
    for (const key of Object.keys(entry)) {
      if (!allowedManualFoodFields.has(key)) throw new Error(`unsupported manual food field: ${key}`);
    }

    const action = getString(entry.action);
    if (action !== "add") throw new Error(`manual food action must be add: ${action}`);

    const foodNameJa = getRequiredString(entry.foodNameJa, "foodNameJa");
    const area = getRequiredString(entry.area, "area");
    const shopName = getRequiredString(entry.shopName, "shopName");
    const infoSourceUrl = getRequiredString(entry.infoSourceUrl, "infoSourceUrl");
    const reviewedBy = getRequiredString(entry.reviewedBy, "reviewedBy");
    const reviewedAt = getRequiredString(entry.reviewedAt, "reviewedAt");
    const categoryTags = readCategoryTags(entry.categoryTags, foodNameJa);
    const saleStatus = readEnum(entry.saleStatus, validSaleStatuses, "saleStatus", foodNameJa);
    const sourceType = readEnum(entry.sourceType, validSourceTypes, "sourceType", foodNameJa);
    const confidence = readEnum(entry.confidence, validConfidences, "confidence", foodNameJa);

    if (!looksLikeUrl(infoSourceUrl)) throw new Error(`infoSourceUrl must be a URL for ${foodNameJa}`);
    if (entry.priceYen !== null && (typeof entry.priceYen !== "number" || !Number.isInteger(entry.priceYen) || entry.priceYen < 0)) {
      throw new Error(`priceYen must be a non-negative integer or null for ${foodNameJa}`);
    }
    if (entry.priceYen === null && confidence !== "low") {
      throw new Error(`priceYen null requires confidence low for ${foodNameJa}`);
    }

    const image = optionalString(entry.image);
    if (image && image !== "main.jpg") throw new Error(`Phase A image must be main.jpg for ${foodNameJa}`);
    const imageSourceUrl = optionalString(entry.imageSourceUrl);
    if (image && (!imageSourceUrl || !looksLikeUrl(imageSourceUrl))) {
      throw new Error(`imageSourceUrl is required when image is set for ${foodNameJa}`);
    }

    return {
      action: "add",
      foodNameJa,
      foodNameEn: optionalString(entry.foodNameEn) || undefined,
      priceYen: entry.priceYen,
      area,
      shopName,
      categoryTags,
      saleStatus,
      periodStart: optionalString(entry.periodStart),
      periodEnd: optionalString(entry.periodEnd),
      image,
      imageSourceUrl,
      infoSourceUrl,
      sourceType,
      confidence,
      notes: optionalString(entry.notes) || undefined,
      reviewedBy,
      reviewedAt
    };
  });
}

function buildGeneratedFood(id: string, manualFood: ManualFood, foods: UnknownRecord[]): UnknownRecord {
  const matchingShopFood = foods.find((food) => {
    const shop = isRecord(food.shop) ? food.shop : undefined;
    const area = isRecord(food.area) ? food.area : undefined;
    return getString(shop?.name) === manualFood.shopName && getString(area?.name) === manualFood.area;
  });
  if (!matchingShopFood) {
    throw new Error(`manual food shop/area must match an existing generated food: ${manualFood.area} / ${manualFood.shopName}`);
  }

  const shop = clone(getRequiredRecord(matchingShopFood.shop, "shop"));
  const area = clone(getRequiredRecord(matchingShopFood.area, "area"));
  const shopId = getRequiredString(shop.id, "shop.id");
  const areaId = getRequiredString(area.id, "area.id");
  const now = new Date().toISOString();
  const category = inferCategory(manualFood.categoryTags);
  const imageUrl = manualFood.image ? `manual-images/${id}/${manualFood.image}` : undefined;
  const priceFields = manualFood.priceYen === null ? {} : buildPriceFields(manualFood.priceYen, manualFood);
  const saleFields = buildSaleFields(manualFood);
  const imageFields = imageUrl ? buildImageFields(id, manualFood, imageUrl, now, category) : { images: [] };

  return {
    id,
    shopId,
    areaId,
    name: manualFood.foodNameJa,
    normalizedName: normalizeFoodName(manualFood.foodNameJa),
    normalized_name: normalizeFoodName(manualFood.foodNameJa),
    category,
    diningType: manualFood.categoryTags.includes("cart") ? "food_cart" : "unknown",
    dining_type: manualFood.categoryTags.includes("cart") ? "food_cart" : "unknown",
    diningTypeConfidenceScore: manualFood.categoryTags.includes("cart") ? 80 : 40,
    dining_type_confidence_score: manualFood.categoryTags.includes("cart") ? 80 : 40,
    diningTypeReason: "manual-foods scaffold",
    dining_type_reason: "manual-foods scaffold",
    officialUrl: manualFood.sourceType === "official" ? manualFood.infoSourceUrl : undefined,
    official_url: manualFood.sourceType === "official" ? manualFood.infoSourceUrl : undefined,
    sourceUrl: manualFood.infoSourceUrl,
    source_url: manualFood.infoSourceUrl,
    startDate: manualFood.periodStart || undefined,
    start_date: manualFood.periodStart || undefined,
    endDate: manualFood.periodEnd || undefined,
    end_date: manualFood.periodEnd || undefined,
    status: mapFoodStatus(manualFood.saleStatus),
    isLimited: manualFood.categoryTags.includes("seasonal"),
    is_limited: manualFood.categoryTags.includes("seasonal"),
    confidenceScore: confidenceScore(manualFood.confidence),
    confidence_score: confidenceScore(manualFood.confidence),
    nameQualityScore: 90,
    name_quality_score: 90,
    displayQuality: imageUrl ? "medium" : "low",
    display_quality: imageUrl ? "medium" : "low",
    extractionSourceCount: 1,
    extraction_source_count: 1,
    reviewStatus: manualFood.confidence === "high" && imageUrl ? "approved" : "pending",
    review_status: manualFood.confidence === "high" && imageUrl ? "approved" : "pending",
    hidden: !imageUrl || manualFood.saleStatus === "paused" || manualFood.saleStatus === "ended",
    duplicateGroupId: `manual-${id}`,
    duplicate_group_id: `manual-${id}`,
    manualOverride: true,
    manual_override: true,
    compositeMenu: false,
    composite_menu: false,
    canonicalFood: true,
    canonical_food: true,
    canonicalGroupId: `manual-${id}`,
    canonical_group_id: `manual-${id}`,
    rarity: manualFood.categoryTags.includes("seasonal") ? "event" : "standard",
    trustedPlaceholder: false,
    trusted_placeholder: false,
    lastCheckedAt: manualFood.reviewedAt,
    last_checked_at: manualFood.reviewedAt,
    sourceNames: ["manual-foods"],
    source_names: ["manual-foods"],
    rejectionReasons: [],
    rejection_reasons: [],
    locations: [
      {
        id: `location-${id.replace(/^food-/, "")}`,
        foodId: id,
        shopId,
        shopName: manualFood.shopName,
        areaId,
        areaName: manualFood.area,
        shopType: getString(shop.type) || "unknown",
        sourceUrl: manualFood.infoSourceUrl,
        status: mapFoodStatus(manualFood.saleStatus),
        startDate: manualFood.periodStart || undefined,
        endDate: manualFood.periodEnd || undefined,
        lastCheckedAt: manualFood.reviewedAt,
        price: manualFood.priceYen ?? undefined
      }
    ],
    area,
    shop,
    ...priceFields,
    ...saleFields,
    ...imageFields,
    manualFoodMetadata: {
      foodNameEn: manualFood.foodNameEn,
      categoryTags: manualFood.categoryTags,
      sourceType: manualFood.sourceType,
      confidence: manualFood.confidence,
      notes: manualFood.notes,
      reviewedBy: manualFood.reviewedBy,
      reviewedAt: manualFood.reviewedAt
    },
    manual_food_metadata: {
      foodNameEn: manualFood.foodNameEn,
      categoryTags: manualFood.categoryTags,
      sourceType: manualFood.sourceType,
      confidence: manualFood.confidence,
      notes: manualFood.notes,
      reviewedBy: manualFood.reviewedBy,
      reviewedAt: manualFood.reviewedAt
    }
  };
}

function buildPriceFields(price: number, manualFood: ManualFood): UnknownRecord {
  const priceSource = manualFood.sourceType === "official" ? "official" : manualFood.sourceType === "trusted-site" ? "trusted_report" : "unknown";
  return {
    price,
    priceMin: price,
    price_min: price,
    priceSource: priceSource,
    price_source: priceSource,
    priceSourceUrl: manualFood.infoSourceUrl,
    price_source_url: manualFood.infoSourceUrl,
    priceLastCheckedAt: manualFood.reviewedAt,
    price_last_checked_at: manualFood.reviewedAt,
    priceConfidenceScore: confidenceScore(manualFood.confidence),
    price_confidence_score: confidenceScore(manualFood.confidence)
  };
}

function buildSaleFields(manualFood: ManualFood): UnknownRecord {
  return {
    saleStatus: manualFood.saleStatus,
    sale_status: manualFood.saleStatus,
    saleStartDate: manualFood.periodStart ?? null,
    sale_start_date: manualFood.periodStart ?? null,
    saleEndDate: manualFood.periodEnd ?? null,
    sale_end_date: manualFood.periodEnd ?? null,
    salePeriodLabel: buildSalePeriodLabel(manualFood),
    sale_period_label: buildSalePeriodLabel(manualFood),
    isCompletable: manualFood.saleStatus === "active",
    is_completable: manualFood.saleStatus === "active"
  };
}

function buildImageFields(id: string, manualFood: ManualFood, imageUrl: string, now: string, category: FoodCategory): UnknownRecord {
  return {
    imageUrl,
    image_url: imageUrl,
    representativeImageUrl: imageUrl,
    representative_image_url: imageUrl,
    images: [
      {
        id: `image-${id.replace(/^food-/, "")}`,
        foodId: id,
        imageUrl,
        sourceType: manualFood.sourceType === "official" ? "official" : "own",
        sourceUrl: manualFood.imageSourceUrl ?? manualFood.infoSourceUrl,
        altText: manualFood.foodNameJa,
        alt: manualFood.foodNameJa,
        imageConfidenceScore: confidenceScore(manualFood.confidence),
        imageMatchScore: 80,
        categoryImageMatchScore: category === "unknown" ? 40 : 70,
        imageSourceContext: "manual-foods",
        imageMatchReason: "manual-foods scaffold approved image",
        imageVerified: manualFood.confidence === "high",
        hasWatermark: false,
        officialConfirmed: manualFood.sourceType === "official",
        imageApproved: manualFood.confidence === "high",
        image_approved: manualFood.confidence === "high",
        manuallyAdded: true,
        manually_added: true,
        imageLastCheckedAt: now,
        image_last_checked_at: now,
        priority: 1,
        enabled: true
      }
    ]
  };
}

function assertOnlyAppendedFoods(beforeDataset: UnknownRecord, dataset: UnknownRecord, addedIds: Set<string>) {
  const beforeFoods = beforeDataset.foods;
  const foods = dataset.foods;
  if (!Array.isArray(beforeFoods)) throw new Error("before foods array disappeared");
  if (!Array.isArray(foods)) throw new Error("foods array disappeared");
  if (foods.length !== beforeFoods.length + addedIds.size) {
    throw new Error(`foods array length changed unexpectedly: ${beforeFoods.length} -> ${foods.length}`);
  }

  for (let index = 0; index < beforeFoods.length; index += 1) {
    if (JSON.stringify(beforeFoods[index]) !== JSON.stringify(foods[index])) {
      const beforeId = isRecord(beforeFoods[index]) ? getString(beforeFoods[index].id) : "";
      const afterId = isRecord(foods[index]) ? getString(foods[index].id) : "";
      throw new Error(`existing food changed at index ${index}: ${beforeId} -> ${afterId}`);
    }
  }

  const appendedIds = new Set<string>();
  for (let index = beforeFoods.length; index < foods.length; index += 1) {
    const food = foods[index];
    if (!isRecord(food)) throw new Error(`appended food is not an object at index ${index}`);
    appendedIds.add(getString(food.id));
  }
  assertSameSet(appendedIds, addedIds, "appended food ids");
}

function buildManualFoodId(manualFood: ManualFood) {
  const basis = `${manualFood.area}:${manualFood.shopName}:${manualFood.foodNameJa}`;
  const hash = createHash("sha256").update(basis).digest("hex").slice(0, 12);
  return `food-manual-${hash}`;
}

function inferCategory(tags: string[]): FoodCategory {
  if (tags.includes("churros")) return "churro";
  if (tags.includes("popcorn")) return "popcorn";
  if (tags.includes("drink")) return "drink";
  if (tags.includes("burger")) return "burger";
  if (tags.includes("dessert")) return "dessert";
  if (tags.includes("snack") || tags.includes("cart")) return "snack";
  if (tags.includes("seasonal")) return "seasonal";
  return "unknown";
}

function mapFoodStatus(saleStatus: SaleStatus) {
  if (saleStatus === "paused") return "inactive";
  if (saleStatus === "ended") return "ended";
  if (saleStatus === "unknown") return "unknown";
  return "active";
}

function confidenceScore(confidence: Confidence) {
  if (confidence === "high") return 95;
  if (confidence === "medium") return 70;
  return 45;
}

function buildSalePeriodLabel(manualFood: ManualFood) {
  if (manualFood.periodStart && manualFood.periodEnd) return `${manualFood.periodStart} - ${manualFood.periodEnd}`;
  if (manualFood.periodStart) return `${manualFood.periodStart} -`;
  if (manualFood.periodEnd) return `- ${manualFood.periodEnd}`;
  return manualFood.saleStatus;
}

function normalizeFoodName(name: string) {
  return name.normalize("NFKC").replace(/[\s・ー〜~]/g, "").toLowerCase();
}

function readCategoryTags(value: unknown, foodName: string) {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`categoryTags must be a non-empty array for ${foodName}`);
  const tags = value.map(getString).filter(Boolean);
  if (tags.length !== value.length) throw new Error(`categoryTags must contain only strings for ${foodName}`);
  for (const tag of tags) {
    if (!allowedCategoryTags.has(tag)) throw new Error(`unsupported categoryTag for ${foodName}: ${tag}`);
  }
  return tags;
}

function readEnum<T extends string>(value: unknown, allowed: Set<T>, field: string, foodName: string): T {
  const stringValue = getString(value);
  if (!allowed.has(stringValue as T)) throw new Error(`unsupported ${field} for ${foodName}: ${stringValue}`);
  return stringValue as T;
}

function looksLikeUrl(value: string) {
  return value.startsWith("https://") || value.startsWith("http://");
}

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function assertSameSet(actual: Set<string>, expected: Set<string>, label: string) {
  if (actual.size !== expected.size) throw new Error(`expected ${expected.size} ${label}, found ${actual.size}`);
  for (const id of expected) {
    if (!actual.has(id)) throw new Error(`missing ${label}: ${id}`);
  }
  for (const id of actual) {
    if (!expected.has(id)) throw new Error(`unexpected ${label}: ${id}`);
  }
}

function getRequiredRecord(value: unknown, field: string) {
  if (!isRecord(value)) throw new Error(`${field} must be an object`);
  return value;
}

function getRequiredString(value: unknown, field: string) {
  const stringValue = getString(value);
  if (!stringValue) throw new Error(`${field} must be a non-empty string`);
  return stringValue;
}

function optionalString(value: unknown) {
  if (value === undefined || value === null) return null;
  return getString(value);
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
