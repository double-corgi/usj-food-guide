import {
  dedupeFoodsByCanonical,
  foodMatchesArea,
  getCanonicalFoodKey,
  getEatenCanonicalKeys,
  isCompletableFood
} from "@/lib/food-utils";
import type { Area, FoodWithRelations, UserFoodLog } from "@/types/domain";

export type AreaEatenItem = {
  food: FoodWithRelations;
  latestLog?: UserFoodLog;
  eatenCount: number;
};

export type AreaProgress = {
  area: Area;
  foods: FoodWithRelations[];
  canonicalFoods: FoodWithRelations[];
  active: {
    total: number;
    eaten: number;
    rate: number;
    uneaten: number;
  };
  archive: {
    total: number;
    eaten: number;
    rate: number;
    uneaten: number;
  };
  recentEaten: AreaEatenItem[];
};

export function getAreaFoods(foods: FoodWithRelations[], area: Pick<Area, "id" | "name">) {
  return foods.filter((food) => foodMatchesArea(food, area.id, area.name));
}

export function calculateAreaProgress(foods: FoodWithRelations[], logs: UserFoodLog[], area: Area): AreaProgress {
  const areaFoods = getAreaFoods(foods, area);
  const canonicalFoods = dedupeFoodsByCanonical(areaFoods);
  const eatenKeys = getEatenCanonicalKeys(foods, logs);
  const areaCanonicalKeys = new Set(canonicalFoods.map(getCanonicalFoodKey));
  const activeFoods = dedupeFoodsByCanonical(areaFoods.filter(isCompletableFood));
  const activeEaten = activeFoods.filter((food) => eatenKeys.has(getCanonicalFoodKey(food))).length;
  const archiveEaten = canonicalFoods.filter((food) => eatenKeys.has(getCanonicalFoodKey(food))).length;
  const recentEaten = canonicalFoods
    .filter((food) => eatenKeys.has(getCanonicalFoodKey(food)))
    .map((food) => {
      const key = getCanonicalFoodKey(food);
      const relatedLogs = logs.filter((log) => {
        if (log.status !== "eaten") return false;
        const original = foods.find((candidate) => candidate.id === log.foodId);
        const logKey = original ? getCanonicalFoodKey(original) : log.foodId;
        return logKey === key && areaCanonicalKeys.has(logKey);
      });
      return {
        food,
        latestLog: relatedLogs.sort((a, b) => (b.eatenAt ?? "").localeCompare(a.eatenAt ?? ""))[0],
        eatenCount: relatedLogs.reduce((sum, log) => sum + (log.eatenCount ?? 1), 0)
      };
    })
    .sort((a, b) => (b.latestLog?.eatenAt ?? "").localeCompare(a.latestLog?.eatenAt ?? ""));

  return {
    area,
    foods: areaFoods,
    canonicalFoods,
    active: {
      total: activeFoods.length,
      eaten: activeEaten,
      rate: activeFoods.length === 0 ? 0 : Math.round((activeEaten / activeFoods.length) * 100),
      uneaten: Math.max(activeFoods.length - activeEaten, 0)
    },
    archive: {
      total: canonicalFoods.length,
      eaten: archiveEaten,
      rate: canonicalFoods.length === 0 ? 0 : Math.round((archiveEaten / canonicalFoods.length) * 100),
      uneaten: Math.max(canonicalFoods.length - archiveEaten, 0)
    },
    recentEaten
  };
}

export function calculateAreaProgressList(foods: FoodWithRelations[], logs: UserFoodLog[], areas?: Area[]) {
  const sourceAreas = areas ?? getAreasFromFoods(foods);
  return sourceAreas
    .map((area) => calculateAreaProgress(foods, logs, area))
    .filter((progress) => progress.archive.total > 0)
    .sort((a, b) => a.area.sortOrder - b.area.sortOrder || a.area.name.localeCompare(b.area.name, "ja"));
}

export function getAreasFromFoods(foods: FoodWithRelations[]) {
  return Array.from(new Map(foods.map((food) => [food.area.id, food.area])).values()).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"));
}

export function countActiveAreaFoods(foods: FoodWithRelations[], area: Area) {
  return dedupeFoodsByCanonical(getAreaFoods(foods, area).filter(isCompletableFood)).length;
}
