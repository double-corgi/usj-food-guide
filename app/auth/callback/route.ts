import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = sanitizeNextPath(url.searchParams.get("next") ?? "/admin/foods");
  const redirectUrl = new URL(next, url.origin);

  if (!code) {
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "?error=missing-code";
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "?error=supabase-not-configured";
    return NextResponse.redirect(redirectUrl);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "?error=auth-callback-failed";
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(redirectUrl);
}

function sanitizeNextPath(value: string) {
  return value.startsWith("/admin") && !value.startsWith("/admin/login") ? value : "/admin/foods";
}
