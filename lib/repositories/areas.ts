import { mapArea } from "@/lib/mappers";
import { readGeneratedAreas } from "@/lib/repositories/generated-data";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Area } from "@/types/domain";

export async function listAreas(): Promise<Area[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return readGeneratedAreas();

  const { data, error } = await supabase.from("areas").select("*").order("sort_order", { ascending: true });
  if (error || !data) {
    console.error("Failed to fetch areas", error);
    return readGeneratedAreas();
  }
  return data.map(mapArea);
}
