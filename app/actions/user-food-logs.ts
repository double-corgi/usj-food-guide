"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { UserFoodLog, UserFoodStatus } from "@/types/domain";

export async function upsertUserFoodLog(input: {
  foodId: string;
  status: UserFoodStatus;
  rating?: number;
  memo?: string;
  eatenAt?: string;
  userPhotoUrl?: string;
}) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Supabase is not configured." };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "Login required." };

  const { error } = await supabase.from("user_food_logs").upsert(
    {
      user_id: auth.user.id,
      food_id: input.foodId,
      status: input.status,
      rating: input.rating ?? null,
      memo: input.memo ?? null,
      eaten_at: input.eatenAt ?? null,
      user_photo_url: input.userPhotoUrl ?? null
    },
    { onConflict: "user_id,food_id,status" }
  );

  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  return { ok: true };
}

export async function deleteUserFoodLog(foodId: string, status: UserFoodStatus) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Supabase is not configured." };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "Login required." };

  const { error } = await supabase.from("user_food_logs").delete().eq("user_id", auth.user.id).eq("food_id", foodId).eq("status", status);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  return { ok: true };
}

export async function listMyFoodLogs(): Promise<UserFoodLog[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];

  const { data } = await supabase.from("user_food_logs").select("*").eq("user_id", auth.user.id);
  return (data ?? []).map((row) => ({
    foodId: row.food_id,
    status: row.status,
    rating: row.rating ?? undefined,
    memo: row.memo ?? undefined,
    eatenAt: row.eaten_at ?? undefined,
    userPhotoUrl: row.user_photo_url ?? undefined
  }));
}
