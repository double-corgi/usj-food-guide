import { mapShop } from "@/lib/mappers";
import { readGeneratedShops } from "@/lib/repositories/generated-data";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Shop } from "@/types/domain";

export async function listShops(): Promise<Shop[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return readGeneratedShops();

  const { data, error } = await supabase.from("shops").select("*").eq("is_active", true).order("name", { ascending: true });
  if (error || !data) {
    console.error("Failed to fetch shops", error);
    return readGeneratedShops();
  }
  return data.map(mapShop);
}
