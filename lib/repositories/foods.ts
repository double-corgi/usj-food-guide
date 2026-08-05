import { applyFoodOverrides } from "@/lib/food-overrides";
import { listStaticNativeFoods } from "@/lib/repositories/static-native-catalog";
import { listFoodOverrides } from "@/lib/repositories/food-overrides";
import { readGeneratedFoods } from "@/lib/repositories/generated-data";
import { getManualFoodById, listManualFoods } from "@/lib/repositories/manual-foods";
import { applySeasonalFoodFoundation, listSeasonalFoodFoundation } from "@/lib/repositories/seasonal-food-foundation";
import { applyStaffStoreManagement, listStaffStoreManagement } from "@/lib/repositories/staff-store-management";
import type { FoodWithRelations } from "@/types/domain";

type ListAllFoodCandidatesOptions = {
  includeDeletedManualFoods?: boolean;
  deletedManualFoodsOnly?: boolean;
};

export async function listFoods(): Promise<FoodWithRelations[]> {
  const staticFoods = listStaticNativeFoods();
  if (staticFoods) return staticFoods;
  const [overrides, foundation, manualFoodRows, staffStores] = await Promise.all([listFoodOverrides(), listSeasonalFoodFoundation(), listManualFoods({ publicOnly: true }), listStaffStoreManagement({ publicOnly: true })]);
  const generatedFoods = filterVisibleFoods(applySeasonalFoodFoundation(applyFoodOverrides(readGeneratedFoods({ includeHidden: true }), overrides), foundation));
  const manualFoods = filterVisibleFoods(applySeasonalFoodFoundation(manualFoodRows, foundation));
  return applyStaffStoreManagement(mergeFoods(generatedFoods, manualFoods), staffStores);
}

export async function listHomeActiveCollectionFoods(): Promise<FoodWithRelations[]> {
  const staticFoods = listStaticNativeFoods();
  if (staticFoods) return staticFoods;
  const [overrides, foundation, manualFoodRows, staffStores] = await Promise.all([listFoodOverrides(), listSeasonalFoodFoundation(), listManualFoods(), listStaffStoreManagement({ publicOnly: true })]);
  const generatedFoods = filterHomeVisibleFoods(applySeasonalFoodFoundation(applyFoodOverrides(readGeneratedFoods({ includeHidden: true }), overrides), foundation));
  const manualFoods = filterHomeVisibleFoods(applySeasonalFoodFoundation(manualFoodRows, foundation));
  return applyStaffStoreManagement(mergeFoods(generatedFoods, manualFoods), staffStores);
}

export async function getFoodById(id: string): Promise<FoodWithRelations | null> {
  const staticFoods = listStaticNativeFoods();
  if (staticFoods) return staticFoods.find((food) => food.id === id) ?? null;
  const [overrides, foundation, staffStores] = await Promise.all([listFoodOverrides(), listSeasonalFoodFoundation(), listStaffStoreManagement({ publicOnly: true })]);
  const generatedFood = applySeasonalFoodFoundation(applyFoodOverrides(readGeneratedFoods({ includeHidden: true }), overrides), foundation).find((candidate) => candidate.id === id) ?? null;
  if (generatedFood) {
    const [withStores] = applyStaffStoreManagement([generatedFood], staffStores);
    return isVisibleFood(withStores) ? sanitizePublicFood(withStores) : null;
  }

  const manualFood = await getManualFoodById(id, { publicOnly: true });
  const [resolvedManualFood] = manualFood ? applyStaffStoreManagement(applySeasonalFoodFoundation([manualFood], foundation), staffStores) : [];
  if (!resolvedManualFood || !isVisibleFood(resolvedManualFood)) return null;
  return sanitizePublicFood(resolvedManualFood);
}

export async function listAllFoodCandidates(options: ListAllFoodCandidatesOptions = {}): Promise<FoodWithRelations[]> {
  const [overrides, foundation, manualFoodRows, staffStores] = await Promise.all([
    listFoodOverrides(),
    listSeasonalFoodFoundation(),
    listManualFoods({
      includeDeleted: options.includeDeletedManualFoods,
      deletedOnly: options.deletedManualFoodsOnly
    }),
    listStaffStoreManagement({ publicOnly: false })
  ]);
  const generatedFoods = applySeasonalFoodFoundation(applyFoodOverrides(readGeneratedFoods({ includeHidden: true }), overrides), foundation);
  const manualFoods = applySeasonalFoodFoundation(manualFoodRows, foundation);
  return applyStaffStoreManagement(mergeFoods(generatedFoods, manualFoods), staffStores);
}

function filterVisibleFoods(foods: FoodWithRelations[]) {
  return foods.filter(isVisibleFood).map(sanitizePublicFood);
}

function filterHomeVisibleFoods(foods: FoodWithRelations[]) {
  return foods.filter(isHomeVisibleFood).map(sanitizePublicFood);
}

function isVisibleFood(food: FoodWithRelations) {
  return (
    food.reviewStatus === "approved" &&
    food.canonicalFood !== false &&
    !food.hidden &&
    !food.deletedAt &&
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

function isHomeVisibleFood(food: FoodWithRelations) {
  return (
    food.reviewStatus === "approved" &&
    food.canonicalFood !== false &&
    !food.hidden &&
    !food.deletedAt &&
    food.displayQuality !== "low" &&
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
