"use server";

import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceSupabaseClient, getSupabaseAuthStorageKey } from "@/lib/supabase-server";
import type { Database } from "@/types/database";

const adminAuthAttemptTtlMs = 10 * 60 * 1000;

export async function sendAdminMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = sanitizeNextPath(String(formData.get("next") ?? "/admin/foods"));
  if (!email) redirect(`/admin/login?error=${encodeURIComponent("メールアドレスを入力してください")}&next=${encodeURIComponent(next)}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceSupabase = createServiceSupabaseClient();
  if (!supabaseUrl || !supabaseAnonKey || !serviceSupabase) {
    redirect(`/admin/login?error=${encodeURIComponent("Supabase Auth が未設定です")}&next=${encodeURIComponent(next)}`);
  }

  const attemptId = crypto.randomUUID();
  const origin = await getAdminAuthOrigin();
  const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}&attempt=${encodeURIComponent(attemptId)}`;
  const pkceStorage = createPkceCaptureStorage(getSupabaseAuthStorageKey(supabaseUrl));
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: true,
      storage: pkceStorage.storage
    }
  });
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo
    }
  });

  if (error) {
    logMagicLinkError(error, emailRedirectTo);
    redirect(`/admin/login?error=${encodeURIComponent("ログインリンクを送信できませんでした")}&next=${encodeURIComponent(next)}`);
  }

  const codeVerifier = pkceStorage.getCodeVerifier();
  if (!codeVerifier) {
    logPkceAttemptError("missing-code-verifier", emailRedirectTo);
    redirect(`/admin/login?error=${encodeURIComponent("ログインリンクを送信できませんでした")}&next=${encodeURIComponent(next)}`);
  }

  const expiresAt = new Date(Date.now() + adminAuthAttemptTtlMs).toISOString();
  const { error: attemptError } = await serviceSupabase.from("admin_auth_pkce_attempts").insert({
    id: attemptId,
    code_verifier: codeVerifier,
    next_path: next,
    expires_at: expiresAt
  });
  if (attemptError) {
    logPkceAttemptError("insert-failed", emailRedirectTo, attemptError);
    redirect(`/admin/login?error=${encodeURIComponent("ログインリンクを送信できませんでした")}&next=${encodeURIComponent(next)}`);
  }

  redirect(`/admin/login?sent=1&next=${encodeURIComponent(next)}`);
}

function sanitizeNextPath(value: string) {
  return value.startsWith("/admin") && !value.startsWith("/admin/login") ? value : "/admin/foods";
}

async function getAdminAuthOrigin() {
  const configuredSiteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (configuredSiteUrl) return configuredSiteUrl;
  return getRequestOrigin();
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

function normalizeSiteUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
}

function logMagicLinkError(error: unknown, emailRedirectTo: string) {
  const redirectUrl = new URL(emailRedirectTo);
  const authError = toAuthErrorLog(error);
  console.error("Admin magic link signInWithOtp failed", {
    errorName: authError.name,
    errorCode: authError.code,
    errorStatus: authError.status,
    errorMessage: authError.message,
    redirectOrigin: redirectUrl.origin,
    redirectPath: `${redirectUrl.pathname}${redirectUrl.search}`
  });
}

function logPkceAttemptError(reason: string, emailRedirectTo: string, error?: unknown) {
  const redirectUrl = new URL(emailRedirectTo);
  const authError = error ? toAuthErrorLog(error) : null;
  console.error("Admin magic link PKCE bridge setup failed", {
    reason,
    errorName: authError?.name,
    errorCode: authError?.code,
    errorStatus: authError?.status,
    errorMessage: authError?.message,
    redirectOrigin: redirectUrl.origin,
    redirectPath: redirectUrl.pathname
  });
}

function createPkceCaptureStorage(storageKey: string) {
  const values = new Map<string, string>();
  const codeVerifierKey = `${storageKey}-code-verifier`;
  let codeVerifier: string | null = null;

  return {
    storage: {
      getItem: async (key: string) => values.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        values.set(key, value);
        if (key === codeVerifierKey) codeVerifier = parseStoredString(value);
      },
      removeItem: async (key: string) => {
        values.delete(key);
        if (key === codeVerifierKey) codeVerifier = null;
      }
    },
    getCodeVerifier: () => codeVerifier
  };
}

function parseStoredString(value: string) {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "string" ? parsed : null;
  } catch {
    return value || null;
  }
}

function toAuthErrorLog(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      code: readStringProperty(error, "code"),
      status: readStringOrNumberProperty(error, "status"),
      message: error.message
    };
  }

  return {
    name: readStringProperty(error, "name"),
    code: readStringProperty(error, "code"),
    status: readStringOrNumberProperty(error, "status"),
    message: readStringProperty(error, "message")
  };
}

function readStringProperty(value: unknown, key: string) {
  if (!isRecord(value)) return undefined;
  const property = value[key];
  return typeof property === "string" ? property : undefined;
}

function readStringOrNumberProperty(value: unknown, key: string) {
  if (!isRecord(value)) return undefined;
  const property = value[key];
  return typeof property === "string" || typeof property === "number" ? property : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
