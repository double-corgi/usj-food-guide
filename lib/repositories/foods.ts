import { applyFoodOverrides } from "@/lib/food-overrides";
import { listFoodOverrides } from "@/lib/repositories/food-overrides";
import { readGeneratedFoods } from "@/lib/repositories/generated-data";
import { getManualFoodById, listManualFoods } from "@/lib/repositories/manual-foods";
import type { FoodWithRelations } from "@/types/domain";

export async function listFoods(): Promise<FoodWithRelations[]> {
  const overrides = await listFoodOverrides();
  const generatedFoods = filterVisibleFoods(applyFoodOverrides(readGeneratedFoods({ reviewStatuses: ["approved"] }), overrides));
  const manualFoods = filterVisibleFoods(await listManualFoods({ publicOnly: true }));
  return mergeFoods(generatedFoods, manualFoods);
}

export async function getFoodById(id: string): Promise<FoodWithRelations | null> {
  const overrides = await listFoodOverrides();
  const generatedFood = applyFoodOverrides(readGeneratedFoods({ includeHidden: true }), overrides).find((candidate) => candidate.id === id) ?? null;
  if (generatedFood) return isVisibleFood(generatedFood) ? sanitizePublicFood(generatedFood) : null;

  const manualFood = await getManualFoodById(id, { publicOnly: true });
  if (!manualFood || !isVisibleFood(manualFood)) return null;
  return sanitizePublicFood(manualFood);
}

export async function listAllFoodCandidates(): Promise<FoodWithRelations[]> {
  const overrides = await listFoodOverrides();
  const generatedFoods = applyFoodOverrides(readGeneratedFoods({ includeHidden: true }), overrides);
  const manualFoods = await listManualFoods();
  return mergeFoods(generatedFoods, manualFoods);
}

function filterVisibleFoods(foods: FoodWithRelations[]) {
  return foods.filter(isVisibleFood).map(sanitizePublicFood);
}

function isVisibleFood(food: FoodWithRelations) {
  return (
    food.reviewStatus === "approved" &&
    food.canonicalFood !== false &&
    !food.hidden &&
    food.displayQuality !== "low" &&
    food.status !== "inactive" &&
    food.nameQualityScore >= 60 &&
    food.confidenceScore >= 45 &&
    !food.compositeMenu &&
    Boolean(food.sourceUrl) &&
    (
      food.shop.name !== "店舗未確認" ||
      food.locations?.some((location) => location.shopName !== "店舗未確認") ||
      food.images.some((image) => image.enabled && image.sourceType === "official" && !image.isSharedTooMuch) ||
      /castel\.jp/i.test(food.sourceUrl)
    )
  );
}

function sanitizePublicFood(food: FoodWithRelations): FoodWithRelations {
  return {
    ...food,
    imageUrl: undefined,
    images: food.images
      .filter(
        (image) =>
          image.enabled &&
          !image.isSharedTooMuch &&
          !image.imageMismatchReason &&
          (image.sourceType !== "official" || image.imageVerified === true) &&
          (image.imageMatchScore ?? 0) >= 70
      )
      .map((image) => ({
        id: image.id,
        foodId: image.foodId,
        imageUrl: image.imageUrl,
        sourceType: image.sourceType,
        sourceUrl: image.sourceUrl,
        priority: image.priority,
        altText: image.altText,
        alt: image.alt,
        width: image.width,
        height: image.height,
        imageConfidenceScore: image.imageConfidenceScore,
        imageMatchScore: image.imageMatchScore,
        categoryImageMatchScore: image.categoryImageMatchScore,
        imageVerified: image.imageVerified,
        isSharedTooMuch: image.isSharedTooMuch,
        enabled: image.enabled
      }))
  };
}

function mergeFoods(generatedFoods: FoodWithRelations[], manualFoods: FoodWithRelations[]) {
  const generatedIds = new Set(generatedFoods.map((food) => food.id));
  return [...generatedFoods, ...manualFoods.filter((food) => !generatedIds.has(food.id))];
}
