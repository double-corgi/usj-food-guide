import type { FoodVariant, FoodWithRelations } from "@/types/domain";

type UnknownRecord = Record<string, unknown>;

export function normalizeFoodVariants(value: unknown): FoodVariant[] {
  if (!Array.isArray(value)) return [];
  return value.map(readFoodVariant).filter((variant): variant is FoodVariant => Boolean(variant));
}

export function normalizeFoodFoundation<T extends FoodWithRelations>(food: T): T {
  const raw = food as T & UnknownRecord;
  const variants = normalizeFoodVariants(raw.variants ?? raw.foodVariants ?? raw.food_variants);
  const normalizedFood = {
    ...food,
    collectionId: readNullableString(raw.collectionId ?? raw.collection_id),
    collectionIds: normalizeCollectionIds(raw.collectionIds ?? raw.collection_ids),
    publishedAt: readNullableString(raw.publishedAt ?? raw.published_at),
    variants
  };
  return syncFoodPriceWithDefaultVariant(normalizedFood) as T;
}

export function getDefaultFoodVariant(food: Pick<FoodWithRelations, "variants">) {
  const variants = food.variants ?? [];
  return variants.find((variant) => variant.isDefault) ?? variants[0];
}

export function getEffectiveFoodPrice(food: Pick<FoodWithRelations, "price" | "variants">) {
  const defaultVariant = getDefaultFoodVariant(food);
  return defaultVariant?.price ?? food.price;
}

export function syncFoodPriceWithDefaultVariant<T extends Pick<FoodWithRelations, "price" | "variants">>(food: T): T {
  const defaultVariant = getDefaultFoodVariant(food);
  if (!defaultVariant || typeof defaultVariant.price !== "number") return food;
  if (food.price === defaultVariant.price) return food;
  return { ...food, price: defaultVariant.price };
}

function readFoodVariant(value: unknown): FoodVariant | null {
  if (!isRecord(value)) return null;
  const id = readString(value.id);
  const foodId = readString(value.foodId ?? value.food_id);
  const label = readString(value.label);
  if (!id || !foodId || !label) return null;
  return {
    id,
    foodId,
    label,
    price: readNullableNumber(value.price),
    isDefault: readBoolean(value.isDefault ?? value.is_default),
    sortOrder: readNumber(value.sortOrder ?? value.sort_order, 100),
    sourceUrl: readNullableString(value.sourceUrl ?? value.source_url),
    lastCheckedAt: readNullableString(value.lastCheckedAt ?? value.last_checked_at)
  };
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNullableString(value: unknown) {
  if (value === null || typeof value === "undefined") return null;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeCollectionIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())));
}

function readNullableNumber(value: unknown) {
  if (value === null || typeof value === "undefined" || value === "") return null;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readBoolean(value: unknown) {
  return value === true;
}
