import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const attemptId = url.searchParams.get("attempt");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  let next = sanitizeNextPath(url.searchParams.get("next") ?? "/admin/foods");
  let redirectUrl = new URL(next, url.origin);

  if (!code && !tokenHash) {
    logCallbackMissingVerifier(url);
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "?error=missing-code";
    return NextResponse.redirect(redirectUrl);
  }

  const pkceAttempt = code && attemptId ? await readPkceAttempt(attemptId) : null;
  if (pkceAttempt?.ok) {
    next = pkceAttempt.nextPath;
    redirectUrl = new URL(next, url.origin);
  } else if (code && attemptId) {
    logCallbackBridgeError(pkceAttempt?.reason ?? "unknown-attempt-error", url, { hasCode: true, hasAttempt: true });
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "?error=auth-callback-failed";
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createServerSupabaseClient(pkceAttempt?.ok ? { pkceCodeVerifier: pkceAttempt.codeVerifier } : {});
  if (!supabase) {
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "?error=supabase-not-configured";
    return NextResponse.redirect(redirectUrl);
  }

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : isEmailOtpType(type)
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash!, type })
      : { error: new Error("Invalid or missing OTP type") };

  if (error) {
    logCallbackAuthError(error, url, { hasCode: Boolean(code), hasTokenHash: Boolean(tokenHash), type });
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "?error=auth-callback-failed";
    return NextResponse.redirect(redirectUrl);
  }

  if (pkceAttempt?.ok) await markPkceAttemptUsed(pkceAttempt.id);

  return NextResponse.redirect(redirectUrl);
}

function sanitizeNextPath(value: string) {
  return value.startsWith("/admin") && !value.startsWith("/admin/login") ? value : "/admin/foods";
}

function isEmailOtpType(value: string | null): value is "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email" {
  return value === "signup" || value === "invite" || value === "magiclink" || value === "recovery" || value === "email_change" || value === "email";
}

async function readPkceAttempt(attemptId: string) {
  if (!isUuid(attemptId)) return { ok: false as const, reason: "invalid-attempt-id" };

  const supabase = createServiceSupabaseClient();
  if (!supabase) return { ok: false as const, reason: "service-client-unavailable" };

  const { data, error } = await supabase
    .from("admin_auth_pkce_attempts")
    .select("id, code_verifier, next_path, expires_at, used_at")
    .eq("id", attemptId)
    .maybeSingle();

  if (error) return { ok: false as const, reason: "attempt-query-failed" };
  if (!data) return { ok: false as const, reason: "attempt-not-found" };
  if (data.used_at) return { ok: false as const, reason: "attempt-already-used" };
  if (new Date(data.expires_at).getTime() <= Date.now()) return { ok: false as const, reason: "attempt-expired" };

  return {
    ok: true as const,
    id: data.id,
    codeVerifier: data.code_verifier,
    nextPath: sanitizeNextPath(data.next_path)
  };
}

async function markPkceAttemptUsed(attemptId: string) {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return;
  const { error } = await supabase.from("admin_auth_pkce_attempts").update({ used_at: new Date().toISOString() }).eq("id", attemptId).is("used_at", null);
  if (error) {
    console.error("Admin auth callback PKCE attempt mark-used failed", {
      errorName: error.name,
      errorCode: error.code,
      errorMessage: error.message
    });
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function logCallbackMissingVerifier(url: URL) {
  console.error("Admin auth callback missing verifier", {
    callbackOrigin: url.origin,
    callbackPath: url.pathname,
    hasCode: false,
    hasTokenHash: false,
    type: url.searchParams.get("type") ?? undefined,
    next: sanitizeNextPath(url.searchParams.get("next") ?? "/admin/foods")
  });
}

function logCallbackBridgeError(reason: string, url: URL, params: { hasCode: boolean; hasAttempt: boolean }) {
  console.error("Admin auth callback PKCE bridge failed", {
    reason,
    callbackOrigin: url.origin,
    callbackPath: url.pathname,
    hasCode: params.hasCode,
    hasAttempt: params.hasAttempt,
    hasTokenHash: Boolean(url.searchParams.get("token_hash")),
    type: url.searchParams.get("type") ?? undefined,
    next: sanitizeNextPath(url.searchParams.get("next") ?? "/admin/foods")
  });
}

function logCallbackAuthError(error: unknown, url: URL, params: { hasCode: boolean; hasTokenHash: boolean; type: string | null }) {
  const authError = toAuthErrorLog(error);
  console.error("Admin auth callback failed", {
    errorName: authError.name,
    errorCode: authError.code,
    errorStatus: authError.status,
    errorMessage: authError.message,
    callbackOrigin: url.origin,
    callbackPath: url.pathname,
    hasCode: params.hasCode,
    hasTokenHash: params.hasTokenHash,
    type: params.type ?? undefined,
    next: sanitizeNextPath(url.searchParams.get("next") ?? "/admin/foods")
  });
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
