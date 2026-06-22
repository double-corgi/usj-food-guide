import * as fs from "node:fs";
import * as path from "node:path";

type UnknownRecord = Record<string, unknown>;
type SaleStatus = "active" | "paused" | "ended" | "unknown";
type SourceType = "official" | "trusted-site" | "manual-confirmed";
type Confidence = "high" | "medium" | "low";

type ManualFoodOverride = {
  action: "update";
  targetFoodId: string;
  priceYen?: number | null;
  saleStatus?: SaleStatus;
  periodStart?: string | null;
  periodEnd?: string | null;
  image?: string | null;
  imageSourceUrl?: string | null;
  infoSourceUrl?: string;
  sourceType?: SourceType;
  confidence?: Confidence;
  notes?: string;
  reviewedBy: string;
  reviewedAt: string;
};

const foodsPath = path.resolve(process.cwd(), "scripts/output/foods.generated.json");
const overridesPath = path.resolve(process.cwd(), "data/manual-food-overrides.json");

const allowedOverrideFields = new Set([
  "action",
  "targetFoodId",
  "priceYen",
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

const allowedChangedFoodFields = new Set([
  "price",
  "priceMin",
  "price_min",
  "priceNote",
  "price_note",
  "priceSource",
  "price_source",
  "priceSourceUrl",
  "price_source_url",
  "priceLastCheckedAt",
  "price_last_checked_at",
  "priceConfidenceScore",
  "price_confidence_score",
  "sourceUrl",
  "source_url",
  "officialUrl",
  "official_url",
  "startDate",
  "start_date",
  "endDate",
  "end_date",
  "status",
  "saleStatus",
  "sale_status",
  "saleStartDate",
  "sale_start_date",
  "saleEndDate",
  "sale_end_date",
  "salePeriodLabel",
  "sale_period_label",
  "isCompletable",
  "is_completable",
  "imageUrl",
  "image_url",
  "representativeImageUrl",
  "representative_image_url",
  "images",
  "manualFoodMetadata",
  "manual_food_metadata",
  "lastCheckedAt",
  "last_checked_at",
  "manualOverride",
  "manual_override"
]);

const validSaleStatuses = new Set<SaleStatus>(["active", "paused", "ended", "unknown"]);
const validSourceTypes = new Set<SourceType>(["official", "trusted-site", "manual-confirmed"]);
const validConfidences = new Set<Confidence>(["high", "medium", "low"]);

main();

function main() {
  const overrides = readOverrides();
  if (overrides.length === 0) {
    console.log("data/manual-food-overrides.json is empty; no generated JSON changes.");
    return;
  }

  const dataset = readJson(foodsPath);
  if (!isRecord(dataset) || !Array.isArray(dataset.foods)) {
    throw new Error("scripts/output/foods.generated.json must contain { foods: [...] }");
  }

  const beforeDataset = clone(dataset);
  const foods = dataset.foods.filter(isRecord);
  const foodsById = new Map<string, UnknownRecord>();
  for (const food of foods) {
    const id = getString(food.id);
    if (id) foodsById.set(id, food);
  }

  const targetIds = new Set(overrides.map((override) => override.targetFoodId));
  const before = new Map<string, UnknownRecord>();
  for (const id of targetIds) {
    const food = foodsById.get(id);
    if (!food) throw new Error(`target food not found: ${id}`);
    before.set(id, clone(food));
  }

  console.log("Before manual food overrides:");
  printTargets(before);

  for (const override of overrides) {
    const food = foodsById.get(override.targetFoodId);
    if (!food) throw new Error(`target food not found: ${override.targetFoodId}`);
    applyOverride(food, override);
  }

  const after = new Map<string, UnknownRecord>();
  for (const id of targetIds) after.set(id, clone(foodsById.get(id)!));
  assertOnlyAllowedTargetChanges(before, after);
  assertNoUnexpectedDatasetChanges(beforeDataset, dataset, foodsById, targetIds);

  console.log("After manual food overrides:");
  printTargets(after);

  fs.writeFileSync(foodsPath, `${JSON.stringify(dataset, null, 2)}\n`);
}

function readOverrides(): ManualFoodOverride[] {
  const raw = readJson(overridesPath);
  if (!Array.isArray(raw)) throw new Error("data/manual-food-overrides.json must contain an array");
  return raw.map((entry) => {
    if (!isRecord(entry)) throw new Error("manual food override entries must be objects");
    for (const key of Object.keys(entry)) {
      if (!allowedOverrideFields.has(key)) throw new Error(`unsupported manual food override field: ${key}`);
    }

    const action = getString(entry.action);
    if (action !== "update") throw new Error(`manual food override action must be update: ${action}`);
    const targetFoodId = getRequiredString(entry.targetFoodId, "targetFoodId");
    const reviewedBy = getRequiredString(entry.reviewedBy, "reviewedBy");
    const reviewedAt = getRequiredString(entry.reviewedAt, "reviewedAt");
    const result: ManualFoodOverride = { action: "update", targetFoodId, reviewedBy, reviewedAt };

    if ("priceYen" in entry) {
      if (entry.priceYen !== null && (typeof entry.priceYen !== "number" || !Number.isInteger(entry.priceYen) || entry.priceYen < 0)) {
        throw new Error(`priceYen must be a non-negative integer or null for ${targetFoodId}`);
      }
      result.priceYen = entry.priceYen as number | null;
    }
    if ("saleStatus" in entry) result.saleStatus = readEnum(entry.saleStatus, validSaleStatuses, "saleStatus", targetFoodId);
    if ("periodStart" in entry) result.periodStart = optionalString(entry.periodStart);
    if ("periodEnd" in entry) result.periodEnd = optionalString(entry.periodEnd);
    if ("image" in entry) {
      const image = optionalString(entry.image);
      if (image && image !== "main.jpg") throw new Error(`Phase A image must be main.jpg for ${targetFoodId}`);
      result.image = image;
    }
    if ("imageSourceUrl" in entry) {
      const imageSourceUrl = optionalString(entry.imageSourceUrl);
      if (imageSourceUrl && !looksLikeUrl(imageSourceUrl)) throw new Error(`imageSourceUrl must be a URL for ${targetFoodId}`);
      result.imageSourceUrl = imageSourceUrl;
    }
    if ("infoSourceUrl" in entry) {
      const infoSourceUrl = getRequiredString(entry.infoSourceUrl, "infoSourceUrl");
      if (!looksLikeUrl(infoSourceUrl)) throw new Error(`infoSourceUrl must be a URL for ${targetFoodId}`);
      result.infoSourceUrl = infoSourceUrl;
    }
    if ("sourceType" in entry) result.sourceType = readEnum(entry.sourceType, validSourceTypes, "sourceType", targetFoodId);
    if ("confidence" in entry) result.confidence = readEnum(entry.confidence, validConfidences, "confidence", targetFoodId);
    if ("notes" in entry) result.notes = optionalString(entry.notes) || undefined;

    const changes = ["priceYen", "saleStatus", "periodStart", "periodEnd", "image", "imageSourceUrl", "infoSourceUrl", "sourceType", "confidence", "notes"];
    if (!changes.some((key) => key in entry)) throw new Error(`override for ${targetFoodId} does not change any allowed field`);
    if (result.image && !result.imageSourceUrl) throw new Error(`imageSourceUrl is required when image is set for ${targetFoodId}`);
    return result;
  });
}

function applyOverride(food: UnknownRecord, override: ManualFoodOverride) {
  const sourceType = override.sourceType ?? readExistingSourceType(food);
  const confidence = override.confidence ?? readExistingConfidence(food);

  if ("priceYen" in override) {
    if (override.priceYen === null) {
      delete food.price;
      delete food.priceMin;
      delete food.price_min;
    } else {
      food.price = override.priceYen;
      food.priceMin = override.priceYen;
      food.price_min = override.priceYen;
    }
    food.priceSource = sourceType === "official" ? "official" : sourceType === "trusted-site" ? "trusted_report" : "unknown";
    food.price_source = food.priceSource;
    if (override.infoSourceUrl) {
      food.priceSourceUrl = override.infoSourceUrl;
      food.price_source_url = override.infoSourceUrl;
    }
    food.priceLastCheckedAt = override.reviewedAt;
    food.price_last_checked_at = override.reviewedAt;
    food.priceConfidenceScore = confidenceScore(confidence);
    food.price_confidence_score = confidenceScore(confidence);
  }

  if (override.infoSourceUrl) {
    food.sourceUrl = override.infoSourceUrl;
    food.source_url = override.infoSourceUrl;
    if (sourceType === "official") {
      food.officialUrl = override.infoSourceUrl;
      food.official_url = override.infoSourceUrl;
    }
  }

  if (override.saleStatus) {
    food.status = mapFoodStatus(override.saleStatus);
    food.saleStatus = override.saleStatus;
    food.sale_status = override.saleStatus;
    food.isCompletable = override.saleStatus === "active";
    food.is_completable = override.saleStatus === "active";
  }

  if ("periodStart" in override) {
    food.startDate = override.periodStart || undefined;
    food.start_date = override.periodStart || undefined;
    food.saleStartDate = override.periodStart ?? null;
    food.sale_start_date = override.periodStart ?? null;
  }
  if ("periodEnd" in override) {
    food.endDate = override.periodEnd || undefined;
    food.end_date = override.periodEnd || undefined;
    food.saleEndDate = override.periodEnd ?? null;
    food.sale_end_date = override.periodEnd ?? null;
  }
  if ("saleStatus" in override || "periodStart" in override || "periodEnd" in override) {
    food.salePeriodLabel = buildSalePeriodLabel(
      getString(food.saleStatus) || "unknown",
      getNullableString(food.saleStartDate),
      getNullableString(food.saleEndDate)
    );
    food.sale_period_label = food.salePeriodLabel;
  }

  if (override.image) {
    const imageUrl = `manual-images/${override.targetFoodId}/${override.image}`;
    food.imageUrl = imageUrl;
    food.image_url = imageUrl;
    food.representativeImageUrl = imageUrl;
    food.representative_image_url = imageUrl;
    const images = Array.isArray(food.images) ? food.images.filter(isRecord) : [];
    food.images = [
      {
        id: `image-${override.targetFoodId.replace(/^food-/, "")}`,
        foodId: override.targetFoodId,
        imageUrl,
        sourceType: sourceType === "official" ? "official" : "own",
        sourceUrl: override.imageSourceUrl,
        altText: getString(food.name),
        alt: getString(food.name),
        imageConfidenceScore: confidenceScore(confidence),
        imageMatchScore: 80,
        imageSourceContext: "manual-food-overrides",
        imageMatchReason: "manual-food-overrides approved image",
        imageVerified: confidence === "high",
        hasWatermark: false,
        officialConfirmed: sourceType === "official",
        imageApproved: confidence === "high",
        image_approved: confidence === "high",
        manuallyAdded: true,
        manually_added: true,
        imageLastCheckedAt: override.reviewedAt,
        image_last_checked_at: override.reviewedAt,
        priority: 1,
        enabled: true
      },
      ...images.filter((image) => getString(image.imageUrl) !== imageUrl)
    ];
  }

  food.manualOverride = true;
  food.manual_override = true;
  food.lastCheckedAt = override.reviewedAt;
  food.last_checked_at = override.reviewedAt;
  food.manualFoodMetadata = {
    sourceType,
    confidence,
    notes: override.notes,
    reviewedBy: override.reviewedBy,
    reviewedAt: override.reviewedAt
  };
  food.manual_food_metadata = clone(food.manualFoodMetadata);
}

function assertOnlyAllowedTargetChanges(before: Map<string, UnknownRecord>, after: Map<string, UnknownRecord>) {
  for (const [id, beforeFood] of before) {
    const afterFood = after.get(id);
    if (!afterFood) throw new Error(`missing after target: ${id}`);
    for (const key of new Set([...Object.keys(beforeFood), ...Object.keys(afterFood)])) {
      if (JSON.stringify(beforeFood[key]) !== JSON.stringify(afterFood[key]) && !allowedChangedFoodFields.has(key)) {
        throw new Error(`unexpected field changed for ${id}: ${key}`);
      }
    }
  }
}

function assertNoUnexpectedDatasetChanges(
  beforeDataset: UnknownRecord,
  dataset: UnknownRecord,
  foodsById: Map<string, UnknownRecord>,
  targetIds: Set<string>
) {
  const beforeFoods = beforeDataset.foods;
  const foods = dataset.foods;
  if (!Array.isArray(beforeFoods)) throw new Error("before foods array disappeared");
  if (!Array.isArray(foods)) throw new Error("foods array disappeared");
  if (beforeFoods.length !== foods.length) {
    throw new Error(`foods array length changed from ${beforeFoods.length} to ${foods.length}`);
  }

  const changedIds = new Set<string>();
  for (let index = 0; index < foods.length; index += 1) {
    const beforeFood = beforeFoods[index];
    const food = foods[index];
    if (!isRecord(beforeFood) || !isRecord(food)) continue;
    const beforeId = getString(beforeFood.id);
    const id = getString(food.id);
    if (beforeId !== id) throw new Error(`food order or id changed at index ${index}: ${beforeId} -> ${id}`);
    if (JSON.stringify(beforeFood) === JSON.stringify(food)) continue;
    changedIds.add(id);
    if (!targetIds.has(id)) throw new Error(`unexpected changed food id: ${id}`);
  }

  assertSameSet(changedIds, targetIds, "changed food ids");
  const foundTargetIds = new Set(
    foods
      .filter(isRecord)
      .map((food) => getString(food.id))
      .filter((id) => targetIds.has(id))
  );
  assertSameSet(foundTargetIds, targetIds, "override target records");
  for (const food of foods.filter(isRecord)) {
    const id = getString(food.id);
    if (!id || !targetIds.has(id)) continue;
    if (foodsById.get(id) !== food) throw new Error(`unexpected object replacement for ${id}`);
  }
}

function printTargets(items: Map<string, UnknownRecord>) {
  for (const [id, food] of items) {
    console.log(
      [
        id,
        getString(food.name),
        `price=${String(food.price)}`,
        `saleStatus=${String(food.saleStatus)}`,
        `imageUrl=${String(food.imageUrl)}`
      ].join(" | ")
    );
  }
}

function mapFoodStatus(saleStatus: string) {
  if (saleStatus === "paused") return "inactive";
  if (saleStatus === "ended") return "ended";
  if (saleStatus === "unknown") return "unknown";
  return "active";
}

function buildSalePeriodLabel(saleStatus: string, periodStart: string | null, periodEnd: string | null) {
  if (periodStart && periodEnd) return `${periodStart} - ${periodEnd}`;
  if (periodStart) return `${periodStart} -`;
  if (periodEnd) return `- ${periodEnd}`;
  return saleStatus;
}

function readExistingSourceType(food: UnknownRecord): SourceType {
  const priceSource = getString(food.priceSource ?? food.price_source);
  if (priceSource === "official") return "official";
  if (priceSource === "trusted_report") return "trusted-site";
  return "manual-confirmed";
}

function readExistingConfidence(food: UnknownRecord): Confidence {
  const score = typeof food.confidenceScore === "number" ? food.confidenceScore : 0;
  if (score >= 85) return "high";
  if (score >= 60) return "medium";
  return "low";
}

function confidenceScore(confidence: Confidence) {
  if (confidence === "high") return 95;
  if (confidence === "medium") return 70;
  return 45;
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

function readEnum<T extends string>(value: unknown, allowed: Set<T>, field: string, target: string): T {
  const stringValue = getString(value);
  if (!allowed.has(stringValue as T)) throw new Error(`unsupported ${field} for ${target}: ${stringValue}`);
  return stringValue as T;
}

function looksLikeUrl(value: string) {
  return value.startsWith("https://") || value.startsWith("http://");
}

function getRequiredString(value: unknown, field: string) {
  const stringValue = getString(value);
  if (!stringValue) throw new Error(`${field} must be a non-empty string`);
  return stringValue;
}

function getNullableString(value: unknown) {
  const stringValue = getString(value);
  return stringValue || null;
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
