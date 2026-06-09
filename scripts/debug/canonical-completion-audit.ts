import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { calculateAreaProgressList, getAreasFromFoods } from "../../lib/area-progress";
import { dedupeFoodsByCanonical, getCanonicalFoodKey, getFoodAreaSummary, getSaleStatus, isCompletableFood, isExactOtherAreaName, needsAreaReview, normalizeFoodName } from "../../lib/food-utils";
import { readGeneratedFoods } from "../../lib/repositories/generated-data";
import { getFoodImage } from "../../lib/utils/image";
import type { FoodWithRelations } from "../../types/domain";

const outputPath = join(process.cwd(), "scripts", "output", "canonical-completion-audit.generated.json");
const foods = readGeneratedFoods({ includeHidden: true }).filter(
  (food) => food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden
);
const canonicalFoods = dedupeFoodsByCanonical(foods);
const duplicateCandidates = buildDuplicateCandidates(foods);
const canonicalGroups = groupBy(foods, getCanonicalFoodKey);
const explicitDuplicateGroups = Array.from(canonicalGroups.values()).filter((group) => group.length >= 2);
const saleUnknownFoods = foods.filter((food) => getSaleStatus(food) === "unknown");
const areaReviewFoods = foods.filter(needsAreaReview);
const rawOtherFoods = foods.filter((food) => isExactOtherAreaName(food.area?.name) || food.locations?.some((location) => isExactOtherAreaName(location.areaName)));
const displayOtherFoods = foods.filter((food) => getFoodAreaSummary(food).includes("その他"));
const activeCanonicalFoods = canonicalFoods.filter(isCompletableFood);
const archiveCanonicalFoods = canonicalFoods;
const placeholderFoods = foods.filter((food) => getFoodImage(food).startsWith("/placeholders/"));
const duplicateCandidatesMissingCanonical = duplicateCandidates.filter((group) =>
  group.foods.some((food) => !food.canonicalGroupId && !food.duplicateGroupId)
);
const areaProgressAudit = calculateAreaProgressList(foods, [], getAreasFromFoods(foods));
const areaDuplicateRawCount = areaProgressAudit.reduce((sum, area) => sum + Math.max(area.foods.length - area.canonicalFoods.length, 0), 0);

const report = {
  generatedAt: new Date().toISOString(),
  foodCount: foods.length,
  imageCount: foods.length - placeholderFoods.length,
  placeholderCount: placeholderFoods.length,
  canonicalFoodCount: canonicalFoods.length,
  duplicateCandidateCount: duplicateCandidates.length,
  explicitDuplicateGroupCount: explicitDuplicateGroups.length,
  canonicalFoodIdUnsetInDuplicateCandidates: duplicateCandidatesMissingCanonical.flatMap((group) => group.foods).length,
  saleUnknownCount: saleUnknownFoods.length,
  activeCompletableCanonicalCount: activeCanonicalFoods.length,
  archiveCanonicalCount: archiveCanonicalFoods.length,
  areaReviewNeededCount: areaReviewFoods.length,
  rawOtherAreaCount: rawOtherFoods.length,
  displayOtherAreaCount: displayOtherFoods.length,
  areaCanonicalDuplicateRawCount: areaDuplicateRawCount,
  eatenLogRuntimeNote: "食べた記録はlocalStorage保存のため、重複カウント監査は画面実行時にcanonicalFoodId単位で行います。",
  areaProgress: areaProgressAudit.map((area) => ({
    id: area.area.id,
    name: area.area.name,
    activeDenominator: area.active.total,
    archiveDenominator: area.archive.total,
    eatenCanonicalCount: area.active.eaten,
    archiveEatenCanonicalCount: area.archive.eaten,
    rawFoods: area.foods.length,
    canonicalFoods: area.canonicalFoods.length,
    duplicateRawRowsExcluded: Math.max(area.foods.length - area.canonicalFoods.length, 0)
  })),
  duplicateCandidates: duplicateCandidates.map((group) => ({
    key: group.key,
    count: group.foods.length,
    foods: group.foods.map((food) => ({
      id: food.id,
      canonicalKey: getCanonicalFoodKey(food),
      name: food.name,
      price: food.priceMin ?? food.price ?? null,
      area: getFoodAreaSummary(food),
      saleStatus: getSaleStatus(food)
    }))
  })),
  saleUnknownFoods: saleUnknownFoods.map(toSimpleFood),
  areaReviewFoods: areaReviewFoods.map(toSimpleFood),
  displayOtherFoods: displayOtherFoods.map(toSimpleFood),
  checks: {
    foodCountPreserved: foods.length >= 200,
    imageCountPreserved: foods.length - placeholderFoods.length >= 200,
    placeholderZero: placeholderFoods.length === 0,
    displayOtherZero: displayOtherFoods.length === 0,
    activeCompletableUsesCanonical: activeCanonicalFoods.length <= foods.filter(isCompletableFood).length,
    archiveUsesCanonical: archiveCanonicalFoods.length <= foods.length,
    areaProgressUsesCanonical: areaProgressAudit.every((area) => area.canonicalFoods.length <= area.foods.length)
  }
};

mkdirSync(join(process.cwd(), "scripts", "output"), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!Object.values(report.checks).every(Boolean)) {
  process.exitCode = 1;
}

function toSimpleFood(food: FoodWithRelations) {
  return {
    id: food.id,
    canonicalKey: getCanonicalFoodKey(food),
    name: food.name,
    category: food.category,
    area: getFoodAreaSummary(food),
    shop: food.shop?.name,
    saleStatus: getSaleStatus(food),
    sourceUrl: food.sourceUrl
  };
}

function buildDuplicateCandidates(items: FoodWithRelations[]) {
  const groups = groupBy(items, (food) => [
    normalizeFoodName(food.name),
    food.priceMin ?? food.price ?? "unknown-price",
    getFoodAreaSummary(food),
    food.shop?.name ?? "unknown-shop"
  ].join("|"));
  return Array.from(groups.entries())
    .filter(([, group]) => group.length >= 2)
    .map(([key, group]) => ({ key, foods: group }));
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
}
