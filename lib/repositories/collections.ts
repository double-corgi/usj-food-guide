import { initialFoodCollections } from "@/lib/seasonal-collections";
import { listStaticNativeCollections } from "@/lib/repositories/static-native-catalog";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import type { Database } from "@/types/database";
import type { FoodCollection } from "@/types/domain";

type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];

export async function listFoodCollections(): Promise<FoodCollection[]> {
  const staticCollections = listStaticNativeCollections();
  if (staticCollections) return staticCollections;
  const supabase = createServiceSupabaseClient();
  if (!supabase) return initialFoodCollections;

  const { data, error } = await supabase.from("collections").select("*").order("sort_order", { ascending: true });
  if (error || !data) {
    console.warn("Collections unavailable; using built-in collection definitions", {
      code: error?.code,
      message: error?.message
    });
    return initialFoodCollections;
  }

  return data.filter(isVisibleCollectionRow).map(mapCollectionRow);
}

function isVisibleCollectionRow(row: CollectionRow) {
  const value = row as CollectionRow & { public_state?: string | null; hidden?: boolean | null; deleted_at?: string | null };
  return value.deleted_at == null && value.hidden !== true && (value.public_state == null || value.public_state === "published");
}

function mapCollectionRow(row: CollectionRow): FoodCollection {
  const value = row as CollectionRow & { description?: string | null; image_url?: string | null };
  return {
    id: row.id,
    name: row.name,
    description: value.description ?? null,
    imageUrl: value.image_url ?? null,
    seasonType: row.season_type,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    accentColor: row.accent_color,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
