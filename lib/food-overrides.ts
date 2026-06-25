import type { FoodOverrideRow } from "@/lib/repositories/food-overrides";
import type { FoodCategory, FoodStatus, FoodWithRelations, SaleStatus } from "@/types/domain";

const FOOD_CATEGORIES = new Set<FoodCategory>([
  "churro",
  "popcorn",
  "drink",
  "dessert",
  "burger",
  "pizza",
  "chicken",
  "rice",
  "noodle",
  "snack",
  "kids",
  "seasonal",
  "set",
  "unknown"
]);

const FOOD_STATUSES = new Set<FoodStatus>(["active", "scheduled", "ended", "inactive", "unknown"]);
const SALE_STATUSES = new Set<SaleStatus>(["active", "paused", "ended", "unknown"]);

export function applyFoodOverrides(generatedFoods: FoodWithRelations[], overrides: FoodOverrideRow[]): FoodWithRelations[] {
  if (overrides.length === 0) return generatedFoods;

  const overrideByFoodId = new Map(overrides.map((override) => [override.food_id, override]));
  return generatedFoods.map((food) => {
    const override = overrideByFoodId.get(food.id);
    if (!override) return food;
    return applyFoodOverride(food, override);
  });
}

function applyFoodOverride(food: FoodWithRelations, override: FoodOverrideRow): FoodWithRelations {
  if (!hasEffectiveFoodOverride(override)) return food;

  const next: FoodWithRelations = {
    ...food,
    name: override.name ?? food.name,
    price: override.price ?? food.price,
    priceMin: override.price_min ?? food.priceMin,
    priceMax: override.price_max ?? food.priceMax,
    priceNote: override.price_note ?? food.priceNote,
    sourceUrl: override.info_source_url ?? food.sourceUrl,
    lastCheckedAt: override.updated_at ?? food.lastCheckedAt,
    hidden: typeof override.hidden === "boolean" ? override.hidden : food.hidden,
    sourceNames: Array.from(new Set([...(food.sourceNames ?? []), "food_overrides"]))
  };

  if (override.image_path) {
    const imageUrl = buildFoodImagePublicUrl(override.image_path);
    if (imageUrl) {
      const overrideImage = {
        id: `${food.id}-override-image-main`,
        foodId: food.id,
        imageUrl,
        sourceType: "own" as const,
        sourceUrl: override.image_source_url ?? food.sourceUrl,
        priority: 0,
        altText: next.name,
        alt: next.name,
        width: 960,
        height: 720,
        imageConfidenceScore: 100,
        imageMatchScore: 100,
        categoryImageMatchScore: 100,
        imageVerified: true,
        isSharedTooMuch: false,
        hasWatermark: false,
        manuallyAdded: true,
        enabled: true
      };
      next.imageUrl = imageUrl;
      next.images = [overrideImage, ...food.images.filter((image) => image.id !== overrideImage.id)];
    }
  }

  if (override.category && isFoodCategory(override.category)) {
    next.category = override.category;
  }

  if (override.sale_status && isSaleStatus(override.sale_status)) {
    next.saleStatus = override.sale_status;
  }

  if (override.status && isFoodStatus(override.status)) {
    next.status = override.status;
  }

  const areaId = override.area_id ?? food.areaId;
  const areaName = override.area_name ?? food.area.name;
  const shopId = override.shop_id ?? food.shopId;
  const shopName = override.shop_name ?? food.shop.name;

  next.areaId = areaId;
  next.shopId = shopId;
  next.area = {
    ...food.area,
    id: areaId,
    name: areaName
  };
  next.shop = {
    ...food.shop,
    id: shopId,
    areaId,
    name: shopName
  };

  if (food.locations) {
    next.locations = food.locations.map((location) => ({
      ...location,
      areaId: override.area_id ?? location.areaId,
      areaName: override.area_name ?? location.areaName,
      shopId: override.shop_id ?? location.shopId,
      shopName: override.shop_name ?? location.shopName
    }));
  }

  return next;
}

export function hasEffectiveFoodOverride(override: FoodOverrideRow) {
  return Boolean(
    override.name ||
      override.name_en ||
      typeof override.price === "number" ||
      typeof override.price_min === "number" ||
      typeof override.price_max === "number" ||
      override.price_note ||
      override.area_name ||
      override.area_id ||
      override.shop_name ||
      override.shop_id ||
      override.category ||
      (override.category_tags && override.category_tags.length > 0) ||
      override.image_path ||
      override.image_source_url ||
      override.info_source_url ||
      override.sale_status ||
      override.status ||
      typeof override.hidden === "boolean" ||
      override.is_deleted
  );
}

function isFoodCategory(value: string): value is FoodCategory {
  return FOOD_CATEGORIES.has(value as FoodCategory);
}

function isFoodStatus(value: string): value is FoodStatus {
  return FOOD_STATUSES.has(value as FoodStatus);
}

function isSaleStatus(value: string): value is SaleStatus {
  return SALE_STATUSES.has(value as SaleStatus);
}

function buildFoodImagePublicUrl(imagePath: string) {
  const trimmedPath = imagePath.trim().replace(/^\/+/, "");
  if (!trimmedPath || /[<>]/.test(trimmedPath)) return null;

  if (/^https?:\/\//.test(trimmedPath)) return trimmedPath;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  try {
    const url = new URL(`/storage/v1/object/public/food-images/${trimmedPath}`, supabaseUrl);
    return url.toString();
  } catch {
    return null;
  }
}
