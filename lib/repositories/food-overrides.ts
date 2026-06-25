import { createServiceSupabaseClient } from "@/lib/supabase-server";
import type { Database } from "@/types/database";

export type FoodOverrideRow = Omit<
  Database["public"]["Tables"]["food_overrides"]["Row"],
  "admin_notes" | "created_by" | "updated_by"
>;

export async function listFoodOverrides(): Promise<FoodOverrideRow[]> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("food_overrides").select("*");
  if (error || !data) {
    console.warn("Food overrides unavailable; continuing without overrides", {
      code: error?.code,
      message: error?.message
    });
    return [];
  }

  return data.map(({ admin_notes: _adminNotes, created_by: _createdBy, updated_by: _updatedBy, ...override }) => override);
}
