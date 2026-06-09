const deletedFoodIdList = [
  "food-dmnp8a",
  "food-wcuih9",
  "food-1hcq7im",
  "food-1ok6wib",
  "food-11pjv41",
  "food-cetcxk",
  "food-1jfqxy1",
  "food-ogc1ha",
  "food-gmhhr6",
  "food-pe8zd1",
  "food-1yvvf8m",
  "food-kgxfwd",
  "food-o4pm0y",
  "food-1tbvv8s",
  "food-1u1wwri"
] as const;

export const deletedFoodIds = new Set<string>(deletedFoodIdList);

export function isDeletedFoodId(foodId: string | null | undefined) {
  return typeof foodId === "string" && deletedFoodIds.has(foodId);
}

export function filterDeletedFoodIds(foodIds: string[]) {
  return foodIds.filter((foodId) => !isDeletedFoodId(foodId));
}

