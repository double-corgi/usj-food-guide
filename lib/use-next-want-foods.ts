"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readLocalNextWantFoodIds, writeLocalNextWantFoodIds } from "@/lib/local-user-data";
import { getCanonicalFoodId, getCanonicalFoodKey } from "@/lib/food-utils";
import type { FoodWithRelations } from "@/types/domain";

export function useNextWantFoods(foods: FoodWithRelations[]) {
  const [foodIds, setFoodIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFoodIds(readLocalNextWantFoodIds());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const canonicalKeys = useMemo(() => {
    return new Set(
      foodIds.map((foodId) => {
        const food = foods.find((candidate) => candidate.id === foodId);
        return food ? getCanonicalFoodKey(food) : foodId;
      })
    );
  }, [foodIds, foods]);

  const wantedFoods = useMemo(() => {
    return foods.filter((food) => canonicalKeys.has(getCanonicalFoodKey(food)));
  }, [canonicalKeys, foods]);

  const persist = useCallback((nextIds: string[]) => {
    writeLocalNextWantFoodIds(nextIds);
    setFoodIds(nextIds);
  }, []);

  const isWanted = useCallback(
    (food: FoodWithRelations) => canonicalKeys.has(getCanonicalFoodKey(food)),
    [canonicalKeys]
  );

  const toggleWanted = useCallback(
    (food: FoodWithRelations) => {
      const canonicalId = getCanonicalFoodId(foods, food);
      const canonicalKey = getCanonicalFoodKey(food);
      if (canonicalKeys.has(canonicalKey)) {
        const next = foodIds.filter((foodId) => {
          const savedFood = foods.find((candidate) => candidate.id === foodId);
          return savedFood ? getCanonicalFoodKey(savedFood) !== canonicalKey : foodId !== food.id;
        });
        persist(next);
        return;
      }
      persist([canonicalId, ...foodIds].slice(0, 50));
    },
    [canonicalKeys, foodIds, foods, persist]
  );

  return {
    ready,
    foodIds,
    wantedFoods,
    isWanted,
    toggleWanted
  };
}
