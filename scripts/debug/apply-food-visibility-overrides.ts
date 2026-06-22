import * as fs from "node:fs";
import * as path from "node:path";

type UnknownRecord = Record<string, unknown>;
type ReviewStatus = "pending" | "approved" | "rejected";
type DisplayQuality = "high" | "medium" | "low";

type FoodVisibilityOverride = {
  foodId: string;
  hidden?: boolean;
  reviewStatus?: ReviewStatus;
  displayQuality?: DisplayQuality;
  reason?: string;
};

const foodsPath = path.resolve(process.cwd(), "scripts/output/foods.generated.json");
const overridesPath = path.resolve(process.cwd(), "data/food-visibility-overrides.json");
const allowedFoodFields = new Set(["hidden", "reviewStatus", "review_status", "displayQuality", "display_quality"]);
const allowedOverrideFields = new Set(["foodId", "hidden", "reviewStatus", "displayQuality", "reason"]);
const validReviewStatuses = new Set<ReviewStatus>(["pending", "approved", "rejected"]);
const validDisplayQualities = new Set<DisplayQuality>(["high", "medium", "low"]);

main();

function main() {
  const dataset = readJson(foodsPath);
  const overrides = readOverrides();
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

  const targetIds = new Set(overrides.map((override) => override.foodId));
  if (targetIds.size === 0) throw new Error("expected at least one food visibility override target id");

  const before = new Map<string, UnknownRecord>();
  for (const id of targetIds) {
    const food = foodsById.get(id);
    if (!food) throw new Error(`target food not found: ${id}`);
    before.set(id, clone(food));
  }

  console.log("Before food visibility override:");
  printTargets(before);

  for (const override of overrides) {
    const food = foodsById.get(override.foodId);
    if (!food) throw new Error(`target food not found: ${override.foodId}`);
    if (typeof override.hidden === "boolean") food.hidden = override.hidden;
    if (override.reviewStatus) {
      food.reviewStatus = override.reviewStatus;
      food.review_status = override.reviewStatus;
    }
    if (override.displayQuality) {
      food.displayQuality = override.displayQuality;
      food.display_quality = override.displayQuality;
    }
  }

  const after = new Map<string, UnknownRecord>();
  for (const id of targetIds) after.set(id, clone(foodsById.get(id)!));
  assertOnlyAllowedTargetChanges(before, after);
  assertNoUnexpectedDatasetChanges(beforeDataset, dataset, foodsById, targetIds);

  console.log("After food visibility override:");
  printTargets(after);

  fs.writeFileSync(foodsPath, `${JSON.stringify(dataset, null, 2)}\n`);
}

function readOverrides(): FoodVisibilityOverride[] {
  const raw = readJson(overridesPath);
  if (!Array.isArray(raw)) throw new Error("data/food-visibility-overrides.json must contain an array");
  return raw.map((entry) => {
    if (!isRecord(entry)) throw new Error("food visibility override entries must be objects");
    for (const key of Object.keys(entry)) {
      if (!allowedOverrideFields.has(key)) throw new Error(`unsupported override field: ${key}`);
    }

    const foodId = getString(entry.foodId);
    if (!foodId) throw new Error("each override must contain foodId");

    const result: FoodVisibilityOverride = { foodId };
    if ("hidden" in entry) {
      if (typeof entry.hidden !== "boolean") throw new Error(`hidden must be boolean for ${foodId}`);
      result.hidden = entry.hidden;
    }
    if ("reviewStatus" in entry) {
      const reviewStatus = getString(entry.reviewStatus);
      if (!validReviewStatuses.has(reviewStatus as ReviewStatus)) {
        throw new Error(`unsupported reviewStatus for ${foodId}: ${reviewStatus}`);
      }
      result.reviewStatus = reviewStatus as ReviewStatus;
    }
    if ("displayQuality" in entry) {
      const displayQuality = getString(entry.displayQuality);
      if (!validDisplayQualities.has(displayQuality as DisplayQuality)) {
        throw new Error(`unsupported displayQuality for ${foodId}: ${displayQuality}`);
      }
      result.displayQuality = displayQuality as DisplayQuality;
    }
    if ("reason" in entry) {
      const reason = getString(entry.reason);
      if (!reason) throw new Error(`reason must be a non-empty string for ${foodId}`);
      result.reason = reason;
    }
    if (result.hidden === undefined && !result.reviewStatus && !result.displayQuality) {
      throw new Error(`override for ${foodId} does not change any allowed field`);
    }
    return result;
  });
}

function assertOnlyAllowedTargetChanges(before: Map<string, UnknownRecord>, after: Map<string, UnknownRecord>) {
  for (const [id, beforeFood] of before) {
    const afterFood = after.get(id);
    if (!afterFood) throw new Error(`missing after target: ${id}`);
    for (const key of new Set([...Object.keys(beforeFood), ...Object.keys(afterFood)])) {
      if (JSON.stringify(beforeFood[key]) !== JSON.stringify(afterFood[key]) && !allowedFoodFields.has(key)) {
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
        `hidden=${String(food.hidden)}`,
        `reviewStatus=${String(food.reviewStatus)}`,
        `displayQuality=${String(food.displayQuality)}`
      ].join(" | ")
    );
  }
}

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function assertSameSet(actual: Set<string>, expected: Set<string>, label: string) {
  if (actual.size !== expected.size) {
    throw new Error(`expected ${expected.size} ${label}, found ${actual.size}`);
  }
  for (const id of expected) {
    if (!actual.has(id)) throw new Error(`missing ${label}: ${id}`);
  }
  for (const id of actual) {
    if (!expected.has(id)) throw new Error(`unexpected ${label}: ${id}`);
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
