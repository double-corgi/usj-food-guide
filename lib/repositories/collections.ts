import { initialFoodCollections } from "@/lib/seasonal-collections";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import type { Database } from "@/types/database";
import type { FoodCollection } from "@/types/domain";

type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];

export async function listFoodCollections(): Promise<FoodCollection[]> {
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

  return data.map(mapCollectionRow);
}

function mapCollectionRow(row: CollectionRow): FoodCollection {
  return {
    id: row.id,
    name: row.name,
    seasonType: row.season_type,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    accentColor: row.accent_color,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    createdAt: row.created_at
  };
}
