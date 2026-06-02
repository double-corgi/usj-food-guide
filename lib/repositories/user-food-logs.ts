import { mapUserFoodLog } from "@/lib/mappers";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { UserFoodLog } from "@/types/domain";

export async function listUserFoodLogs(userId: string): Promise<UserFoodLog[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("user_food_logs").select("*").eq("user_id", userId);
  if (error || !data) {
    console.error("Failed to fetch user food logs", error);
    return [];
  }
  return data.map(mapUserFoodLog);
}
