import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = sanitizeNextPath(url.searchParams.get("next") ?? "/admin/foods");
  const redirectUrl = new URL(next, url.origin);

  if (!code && !tokenHash) {
    logCallbackMissingVerifier(url);
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

  return NextResponse.redirect(redirectUrl);
}

function sanitizeNextPath(value: string) {
  return value.startsWith("/admin") && !value.startsWith("/admin/login") ? value : "/admin/foods";
}

function isEmailOtpType(value: string | null): value is "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email" {
  return value === "signup" || value === "invite" || value === "magiclink" || value === "recovery" || value === "email_change" || value === "email";
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
