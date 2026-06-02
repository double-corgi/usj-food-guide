import { createServerSupabaseClient } from "@/lib/supabase-server";
import { mapFood } from "@/lib/mappers";
import { readGeneratedFoods } from "@/lib/repositories/generated-data";
import type { FoodWithRelations } from "@/types/domain";

const foodSelect = `
  *,
  areas (*),
  shops (*),
  food_images (*),
  food_locations (*)
`;

export async function listFoods(): Promise<FoodWithRelations[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return filterVisibleFoods(readGeneratedFoods({ reviewStatuses: ["approved"] }));

  const { data, error } = await supabase
    .from("foods")
    .select(foodSelect)
    .eq("review_status", "approved")
    .eq("canonical_food", true)
    .eq("hidden", false)
    .neq("status", "inactive")
    .neq("display_quality", "low")
    .gte("name_quality_score", 60)
    .gte("confidence_score", 45)
    .order("status", { ascending: true })
    .order("confidence_score", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error || !data) {
    console.error("Failed to fetch foods", error);
    return filterVisibleFoods(readGeneratedFoods({ reviewStatuses: ["approved"] }));
  }

  return filterVisibleFoods(data.map((row) => mapFood(row)));
}

export async function getFoodById(id: string): Promise<FoodWithRelations | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    const food = readGeneratedFoods({ includeHidden: true }).find((candidate) => candidate.id === id) ?? null;
    return food && isVisibleFood(food) ? sanitizePublicFood(food) : null;
  }

  const { data, error } = await supabase.from("foods").select(foodSelect).eq("id", id).maybeSingle();

  if (error) {
    console.error("Failed to fetch food", error);
    return readGeneratedFoods({ includeHidden: true }).find((food) => food.id === id && food.reviewStatus === "approved" && !food.hidden) ?? null;
  }

  const food = data ? mapFood(data) : null;
  if (!food || !isVisibleFood(food)) return null;
  return sanitizePublicFood(food);
}

export async function listAllFoodCandidates(): Promise<FoodWithRelations[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return readGeneratedFoods({ includeHidden: true });

  const { data, error } = await supabase
    .from("foods")
    .select(foodSelect)
    .order("review_status", { ascending: true })
    .order("confidence_score", { ascending: false })
    .limit(1000);

  if (error || !data) {
    console.error("Failed to fetch food candidates", error);
    return readGeneratedFoods({ includeHidden: true });
  }

  return data.map((row) => mapFood(row));
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
