import * as fs from "node:fs";
import * as path from "node:path";

type UnknownRecord = Record<string, unknown>;

type DuplicateOverride = {
  canonicalId: string;
  duplicateIds: string[];
};

const foodsPath = path.resolve(process.cwd(), "scripts/output/foods.generated.json");
const overridesPath = path.resolve(process.cwd(), "data/duplicate-overrides.json");
const allowedFields = new Set(["canonicalFood", "canonical_food", "hidden", "duplicateGroupId", "duplicate_group_id"]);

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

  const targetIds = new Set<string>();
  for (const override of overrides) {
    targetIds.add(override.canonicalId);
    for (const duplicateId of override.duplicateIds) targetIds.add(duplicateId);
  }
  if (targetIds.size === 0) throw new Error("expected at least one duplicate override target id");

  const before = new Map<string, UnknownRecord>();
  for (const id of targetIds) {
    const food = foodsById.get(id);
    if (!food) throw new Error(`target food not found: ${id}`);
    before.set(id, clone(food));
  }

  console.log("Before duplicate override:");
  printTargets(before);

  for (const override of overrides) {
    const groupId = `override-${override.canonicalId}`;
    const canonical = foodsById.get(override.canonicalId);
    if (!canonical) throw new Error(`canonicalId not found: ${override.canonicalId}`);
    canonical.canonicalFood = true;
    canonical.canonical_food = true;
    canonical.hidden = false;
    canonical.duplicateGroupId = groupId;
    canonical.duplicate_group_id = groupId;

    for (const duplicateId of override.duplicateIds) {
      const duplicate = foodsById.get(duplicateId);
      if (!duplicate) throw new Error(`duplicateId not found: ${duplicateId}`);
      duplicate.canonicalFood = false;
      duplicate.canonical_food = false;
      duplicate.hidden = true;
      duplicate.duplicateGroupId = groupId;
      duplicate.duplicate_group_id = groupId;
    }
  }

  const after = new Map<string, UnknownRecord>();
  for (const id of targetIds) after.set(id, clone(foodsById.get(id)!));
  assertOnlyAllowedTargetChanges(before, after);
  assertNoUnexpectedDatasetChanges(beforeDataset, dataset, foodsById, targetIds);

  console.log("After duplicate override:");
  printTargets(after);

  fs.writeFileSync(foodsPath, `${JSON.stringify(dataset, null, 2)}\n`);
}

function readOverrides(): DuplicateOverride[] {
  const raw = readJson(overridesPath);
  if (!Array.isArray(raw)) throw new Error("data/duplicate-overrides.json must contain an array");
  return raw.map((entry) => {
    if (!isRecord(entry)) throw new Error("duplicate override entries must be objects");
    const canonicalId = getString(entry.canonicalId);
    const duplicateIds = Array.isArray(entry.duplicateIds) ? entry.duplicateIds.map(getString).filter(Boolean) : [];
    if (!canonicalId || duplicateIds.length !== 1) throw new Error("each override must contain canonicalId and exactly one duplicateId");
    return { canonicalId, duplicateIds };
  });
}

function assertOnlyAllowedTargetChanges(before: Map<string, UnknownRecord>, after: Map<string, UnknownRecord>) {
  for (const [id, beforeFood] of before) {
    const afterFood = after.get(id);
    if (!afterFood) throw new Error(`missing after target: ${id}`);
    for (const key of new Set([...Object.keys(beforeFood), ...Object.keys(afterFood)])) {
      if (JSON.stringify(beforeFood[key]) !== JSON.stringify(afterFood[key]) && !allowedFields.has(key)) {
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

  const targetRecords = foods.filter(isRecord).filter((food) => targetIds.has(getString(food.id))).map((food) => getString(food.id));
  const foundTargetIds = new Set(targetRecords);
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
        `canonicalFood=${String(food.canonicalFood)}`,
        `hidden=${String(food.hidden)}`,
        `duplicateGroupId=${String(food.duplicateGroupId)}`
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
