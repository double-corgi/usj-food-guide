"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import type { AdminRole } from "@/lib/admin-auth";

const allowedRoles = new Set<AdminRole>(["owner", "editor", "viewer"]);

export async function inviteAdminOperator(formData: FormData): Promise<void> {
  await requireAdmin("owner");
  const supabase = createServiceSupabaseClient();
  if (!supabase) redirect("/admin/operators?error=supabase");

  const email = normalizeEmail(formData.get("email"));
  const role = normalizeRole(formData.get("role"));
  if (!email || !role) redirect("/admin/operators?error=invalid-input");

  const user = await findOrInviteUser(supabase, email);
  if (!user?.id) redirect("/admin/operators?error=invite-failed");

  const { error } = await supabase.from("admin_users").upsert(
    {
      id: user.id,
      email,
      role
    },
    { onConflict: "id" }
  );
  if (error) redirect(`/admin/operators?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/operators");
  redirect("/admin/operators?saved=invited");
}

export async function updateAdminOperatorRole(formData: FormData): Promise<void> {
  const admin = await requireAdmin("owner");
  const supabase = createServiceSupabaseClient();
  if (!supabase) redirect("/admin/operators?error=supabase");

  const userId = cleanText(formData.get("userId"), 80);
  const role = normalizeRole(formData.get("role"));
  if (!userId || !role) redirect("/admin/operators?error=invalid-input");
  if (admin.userId === userId && role !== "owner") redirect("/admin/operators?error=self-owner");

  const { error } = await supabase.from("admin_users").update({ role }).eq("id", userId);
  if (error) redirect(`/admin/operators?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/operators");
  redirect("/admin/operators?saved=role");
}

export async function disableAdminOperator(formData: FormData): Promise<void> {
  const admin = await requireAdmin("owner");
  const supabase = createServiceSupabaseClient();
  if (!supabase) redirect("/admin/operators?error=supabase");

  const userId = cleanText(formData.get("userId"), 80);
  if (!userId) redirect("/admin/operators?error=invalid-input");
  if (admin.userId === userId) redirect("/admin/operators?error=self-disable");

  const { error } = await supabase.from("admin_users").delete().eq("id", userId);
  if (error) redirect(`/admin/operators?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/operators");
  redirect("/admin/operators?saved=disabled");
}

async function findOrInviteUser(supabase: NonNullable<ReturnType<typeof createServiceSupabaseClient>>, email: string) {
  const listed = await supabase.auth.admin.listUsers();
  if (!listed.error) {
    const existing = listed.data.users.find((user) => user.email?.toLowerCase() === email);
    if (existing) return existing;
  }
  const invited = await supabase.auth.admin.inviteUserByEmail(email);
  if (invited.error) return null;
  return invited.data.user;
}

function normalizeEmail(value: FormDataEntryValue | null) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!email || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) return null;
  return email;
}

function normalizeRole(value: FormDataEntryValue | null): AdminRole | null {
  const role = String(value ?? "").trim() as AdminRole;
  return allowedRoles.has(role) ? role : null;
}

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  const text = String(value ?? "").trim();
  if (!text || text.length > maxLength || /[<>]/.test(text)) return null;
  return text;
}
