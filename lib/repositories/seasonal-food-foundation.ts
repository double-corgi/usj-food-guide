import { syncFoodPriceWithDefaultVariant } from "@/lib/food-variants";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import type { Database } from "@/types/database";
import type { FoodVariant, FoodWithRelations } from "@/types/domain";

export type MembershipRow = Database["public"]["Tables"]["food_collection_memberships"]["Row"];
export type PublicationMetadataRow = Database["public"]["Tables"]["food_publication_metadata"]["Row"];
export type FoodVariantRow = Database["public"]["Tables"]["food_variants"]["Row"];

export type SeasonalFoodFoundation = {
  memberships: MembershipRow[];
  publicationMetadata: PublicationMetadataRow[];
  variants: FoodVariantRow[];
};

export async function listSeasonalFoodFoundation(): Promise<SeasonalFoodFoundation> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return emptyFoundation();

  const [memberships, publicationMetadata, variants] = await Promise.all([
    listRows<MembershipRow>("food_collection_memberships"),
    listRows<PublicationMetadataRow>("food_publication_metadata"),
    listRows<FoodVariantRow>("food_variants", "sort_order")
  ]);

  return { memberships, publicationMetadata, variants };
}

export function applySeasonalFoodFoundation<T extends FoodWithRelations>(foods: T[], foundation: SeasonalFoodFoundation): T[] {
  if (foundation.memberships.length === 0 && foundation.publicationMetadata.length === 0 && foundation.variants.length === 0) return foods;

  const canonicalFoodIdByGroup = new Map<string, string>();
  for (const food of foods) {
    if (!food.canonicalGroupId || food.canonicalFood === false) continue;
    if (!canonicalFoodIdByGroup.has(food.canonicalGroupId)) canonicalFoodIdByGroup.set(food.canonicalGroupId, food.id);
  }
  const foundationTargetByFoodId = new Map<string, string>();
  for (const food of foods) {
    if (!food.canonicalGroupId || food.canonicalFood !== false) continue;
    const canonicalFoodId = canonicalFoodIdByGroup.get(food.canonicalGroupId);
    if (canonicalFoodId && canonicalFoodId !== food.id) foundationTargetByFoodId.set(food.id, canonicalFoodId);
  }

  const collectionByFoodId = new Map<string, string>();
  const collectionsByFoodId = new Map<string, string[]>();
  for (const membership of foundation.memberships) {
    const targetFoodIds = getFoundationTargetFoodIds(membership.food_id, foundationTargetByFoodId);
    for (const foodId of targetFoodIds) {
      const collectionIds = collectionsByFoodId.get(foodId) ?? [];
      if (!collectionIds.includes(membership.collection_id)) {
        collectionIds.push(membership.collection_id);
        collectionsByFoodId.set(foodId, collectionIds);
      }
      if (!collectionByFoodId.has(foodId)) collectionByFoodId.set(foodId, membership.collection_id);
    }
  }

  const metadataByFoodId = new Map<string, PublicationMetadataRow>();
  for (const metadata of foundation.publicationMetadata) {
    const targetFoodIds = getFoundationTargetFoodIds(metadata.food_id, foundationTargetByFoodId);
    for (const foodId of targetFoodIds) {
      if (!metadataByFoodId.has(foodId) || foodId === metadata.food_id) metadataByFoodId.set(foodId, metadata);
    }
  }
  const variantsByFoodId = new Map<string, FoodVariant[]>();
  for (const row of foundation.variants) {
    const targetFoodIds = getFoundationTargetFoodIds(row.food_id, foundationTargetByFoodId);
    for (const foodId of targetFoodIds) {
      const next = variantsByFoodId.get(foodId) ?? [];
      next.push(mapFoodVariantRow(row, foodId));
      variantsByFoodId.set(foodId, next);
    }
  }

  return foods.map((food) => {
    const metadata = metadataByFoodId.get(food.id);
    const variants = variantsByFoodId.get(food.id);
    const collectionIds = collectionsByFoodId.get(food.id) ?? food.collectionIds ?? [];
    const collectionId = collectionByFoodId.get(food.id);
    const merged = {
      ...food,
      collectionId: collectionId ?? food.collectionId ?? null,
      collectionIds,
      publishedAt: metadata?.published_at ?? food.publishedAt ?? null,
      reviewStatus: metadata?.review_status ?? food.reviewStatus,
      variants: variants ?? food.variants ?? []
    };
    return syncFoodPriceWithDefaultVariant(merged) as T;
  });
}

function emptyFoundation(): SeasonalFoodFoundation {
  return { memberships: [], publicationMetadata: [], variants: [] };
}

function getFoundationTargetFoodIds(foodId: string, foundationTargetByFoodId: Map<string, string>) {
  const canonicalFoodId = foundationTargetByFoodId.get(foodId);
  if (!canonicalFoodId) return [foodId];
  return [foodId, canonicalFoodId];
}

async function listRows<T>(table: "food_collection_memberships" | "food_publication_metadata" | "food_variants", orderColumn?: string) {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return [];
  let query = supabase.from(table).select("*");
  if (orderColumn) query = query.order(orderColumn, { ascending: true });
  const { data, error } = await query;
  if (error || !data) {
    console.warn("Seasonal food foundation table unavailable; continuing without it", {
      table,
      code: error?.code,
      message: error?.message
    });
    return [];
  }
  return data as T[];
}

function mapFoodVariantRow(row: FoodVariantRow, foodId = row.food_id): FoodVariant {
  return {
    id: row.id,
    foodId,
    label: row.label,
    price: row.price,
    isDefault: row.is_default,
    sortOrder: row.sort_order,
    sourceUrl: row.source_url,
    lastCheckedAt: row.last_checked_at
  };
}
