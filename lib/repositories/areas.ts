import { readGeneratedAreas } from "@/lib/repositories/generated-data";
import { listStaticNativeAreas } from "@/lib/repositories/static-native-catalog";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Area } from "@/types/domain";

export async function listAreas(): Promise<Area[]> {
  const staticAreas = listStaticNativeAreas();
  if (staticAreas) return staticAreas;
  const generated = readGeneratedAreas();
  const supabase = await createServerSupabaseClient();
  if (!supabase) return generated;

  const { data, error } = await (supabase as any)
    .from("staff_areas")
    .select("id,name,public_state,hidden,deleted_at,sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    if (!/does not exist|schema cache|not found/i.test(error.message ?? "")) {
      console.error("Failed to fetch staff areas", error);
    }
    return generated;
  }

  const byId = new Map(generated.map((area) => [area.id, area]));
  for (const row of data ?? []) {
    if (row.deleted_at || row.hidden || row.public_state !== "published") continue;
    byId.set(String(row.id), {
      id: String(row.id),
      name: String(row.name ?? row.id),
      sortOrder: Number(row.sort_order ?? 1000)
    });
  }

  return Array.from(byId.values()).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"));
}
