"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function sendAdminMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = sanitizeNextPath(String(formData.get("next") ?? "/admin/foods"));
  if (!email) redirect(`/admin/login?error=${encodeURIComponent("メールアドレスを入力してください")}&next=${encodeURIComponent(next)}`);

  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect(`/admin/login?error=${encodeURIComponent("Supabase Auth が未設定です")}&next=${encodeURIComponent(next)}`);

  const origin = await getRequestOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`
    }
  });

  if (error) redirect(`/admin/login?error=${encodeURIComponent("ログインリンクを送信できませんでした")}&next=${encodeURIComponent(next)}`);
  redirect(`/admin/login?sent=1&next=${encodeURIComponent(next)}`);
}

function sanitizeNextPath(value: string) {
  return value.startsWith("/admin") && !value.startsWith("/admin/login") ? value : "/admin/foods";
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
