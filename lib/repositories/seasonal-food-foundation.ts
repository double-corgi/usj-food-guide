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

  const collectionByFoodId = new Map<string, string>();
  const collectionsByFoodId = new Map<string, string[]>();
  for (const membership of foundation.memberships) {
    const collectionIds = collectionsByFoodId.get(membership.food_id) ?? [];
    if (!collectionIds.includes(membership.collection_id)) {
      collectionIds.push(membership.collection_id);
      collectionsByFoodId.set(membership.food_id, collectionIds);
    }
    if (!collectionByFoodId.has(membership.food_id)) collectionByFoodId.set(membership.food_id, membership.collection_id);
  }

  const metadataByFoodId = new Map(foundation.publicationMetadata.map((metadata) => [metadata.food_id, metadata]));
  const variantsByFoodId = new Map<string, FoodVariant[]>();
  for (const row of foundation.variants) {
    const next = variantsByFoodId.get(row.food_id) ?? [];
    next.push(mapFoodVariantRow(row));
    variantsByFoodId.set(row.food_id, next);
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

function mapFoodVariantRow(row: FoodVariantRow): FoodVariant {
  return {
    id: row.id,
    foodId: row.food_id,
    label: row.label,
    price: row.price,
    isDefault: row.is_default,
    sortOrder: row.sort_order,
    sourceUrl: row.source_url,
    lastCheckedAt: row.last_checked_at
  };
}
