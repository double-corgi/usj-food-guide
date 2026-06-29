import type { FoodWithRelations } from "@/types/domain";

export function pickRecentAdminFoodsForHome(foods: FoodWithRelations[]) {
  return foods
    .filter(isVisibleRecentAdminFood)
    .map((food) => ({ food, recencyTime: getAdminRecencyTime(food) }))
    .filter(({ recencyTime }) => recencyTime > 0)
    .sort((a, b) => b.recencyTime - a.recencyTime || a.food.name.localeCompare(b.food.name, "ja") || a.food.id.localeCompare(b.food.id))
    .map(({ food }) => food);
}

export function getAdminRecencyTime(food: FoodWithRelations) {
  const value = isManualFood(food) ? maxDateString(food.createdAt, food.updatedAt) : food.updatedAt;
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

export function isManualFood(food: FoodWithRelations) {
  return food.manualOverride === true || food.sourceNames?.includes("manual_foods") === true || food.id.startsWith("food-manual-");
}

function isOverriddenFood(food: FoodWithRelations) {
  return food.sourceNames?.includes("food_overrides") === true;
}

function isVisibleRecentAdminFood(food: FoodWithRelations) {
  return (
    (isManualFood(food) || isOverriddenFood(food)) &&
    food.reviewStatus === "approved" &&
    food.canonicalFood !== false &&
    !food.hidden &&
    !food.deletedAt
  );
}

function maxDateString(left?: string, right?: string) {
  const leftTime = left ? Date.parse(left) : 0;
  const rightTime = right ? Date.parse(right) : 0;
  const validLeftTime = Number.isFinite(leftTime) ? leftTime : 0;
  const validRightTime = Number.isFinite(rightTime) ? rightTime : 0;
  if (!validLeftTime && !validRightTime) return undefined;
  return validLeftTime >= validRightTime ? left : right;
}
