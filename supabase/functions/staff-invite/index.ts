// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type StaffRole = "owner" | "editor";

type InviteBody = {
  email?: string;
  role?: StaffRole;
  displayName?: string;
  mode?: "email" | "link";
};

type InviteUserResult =
  | { ok: true; user: { id: string; email?: string | null }; actionLink?: string; delivery: "email" | "link"; linkType?: "invite" | "recovery" }
  | { ok: false; error: string; status: number; providerMessage?: string; providerCode?: string; canCreateLink?: boolean };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: "missing_environment" }, 500);
  }

  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) {
    return json({ error: "unauthorized" }, 401);
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false }
  });
  const {
    data: { user },
    error: userError
  } = await callerClient.auth.getUser(token);
  if (userError || !user) {
    return json({ error: "unauthorized" }, 401);
  }

  const assurance = await callerClient.auth.mfa.getAuthenticatorAssuranceLevel(token);
  const accessTokenAal = readJwtAalClaim(token);
  if (assurance.error || assurance.data.currentLevel !== "aal2" || accessTokenAal !== "aal2") {
    return json({
      error: "mfa_required",
      currentLevel: assurance.data?.currentLevel ?? "aal1",
      accessTokenAal
    }, 403);
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const ownerCheck = await ensureOwnerMapping(serviceClient, {
    userId: user.id,
    email: user.email ?? null,
    emailVerified: Boolean(user.email_confirmed_at ?? user.confirmed_at),
    currentLevel: assurance.data?.currentLevel ?? "unknown",
    accessTokenAal
  });
  if (!ownerCheck.ok) {
    return json(ownerCheck.body, ownerCheck.status);
  }

  let body: InviteBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const email = normalizeEmail(body.email);
  const displayName = cleanText(body.displayName, 80);
  const mode = body.mode === "email" ? "email" : "link";
  if (!email || body.role !== "editor") {
    return json({ error: "invalid_input" }, 400);
  }
  const role: StaffRole = "editor";

  const redirectTo = buildRedirectTo(request);
  const inviteResult = await findOrInviteUser(serviceClient, email, mode, redirectTo);
  if (!inviteResult.ok) {
    await logInviteAttempt(serviceClient, {
      actorUserId: user.id,
      email,
      role,
      delivery: mode,
      ok: false,
      error: inviteResult.error
    });
    return json(
      {
        error: inviteResult.error,
        providerCode: inviteResult.providerCode,
        providerMessage: safeProviderMessage(inviteResult.providerMessage),
        canCreateLink: inviteResult.canCreateLink === true
      },
      inviteResult.status
    );
  }

  const existingStaff = await serviceClient
    .from("staff_members")
    .select("user_id, role, is_active")
    .eq("user_id", inviteResult.user.id)
    .maybeSingle();

  if (existingStaff.data?.role === "owner") {
    await logInviteAttempt(serviceClient, {
      actorUserId: user.id,
      email,
      role,
      delivery: inviteResult.delivery,
      ok: false,
      error: "existing_owner_not_changed"
    });
    return json({ error: "existing_owner_not_changed" }, 409);
  }

  const upsert = await serviceClient.from("staff_members").upsert(
    {
      user_id: inviteResult.user.id,
      email,
      display_name: displayName,
      role,
      is_active: true,
      created_by: user.id,
      updated_at: new Date().toISOString(),
      disabled_at: null,
      disabled_by: null
    },
    { onConflict: "user_id" }
  );

  if (upsert.error) {
    await logInviteAttempt(serviceClient, {
      actorUserId: user.id,
      email,
      role,
      delivery: inviteResult.delivery,
      ok: false,
      error: "staff_upsert_failed"
    });
    return json({ error: "staff_upsert_failed" }, 500);
  }

  await logInviteAttempt(serviceClient, {
    actorUserId: user.id,
    email,
    role,
    delivery: inviteResult.delivery,
    ok: true
  });

  return json({
    ok: true,
    userId: inviteResult.user.id,
    delivery: inviteResult.delivery,
    linkType: inviteResult.linkType,
    inviteLink: inviteResult.actionLink
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status
  });
}

type OwnerCheckContext = {
  userId: string;
  email: string | null;
  emailVerified: boolean;
  currentLevel: string;
  accessTokenAal: string | null;
};

type OwnerCheckResult =
  | { ok: true; repaired: boolean }
  | { ok: false; status: number; body: { error: string; currentLevel: string; accessTokenAal: string | null; reason?: string } };

async function ensureOwnerMapping(serviceClient: ReturnType<typeof createClient>, context: OwnerCheckContext): Promise<OwnerCheckResult> {
  const exact = await serviceClient
    .from("staff_members")
    .select("user_id,email,role,is_active")
    .eq("user_id", context.userId)
    .maybeSingle();

  if (exact.error) {
    return ownerError("owner_lookup_failed", context, "exact_lookup_failed", 500);
  }

  if (exact.data) {
    if (exact.data.is_active === false) return ownerError("owner_inactive", context, "exact_user_inactive");
    if (exact.data.role !== "owner") return ownerError("owner_role_mismatch", context, "exact_user_not_owner");
    return { ok: true, repaired: false };
  }

  const email = normalizeEmail(context.email);
  if (!email) return ownerError("owner_row_missing", context, "jwt_email_missing");

  const matches = await serviceClient
    .from("staff_members")
    .select("user_id,email,role,is_active")
    .ilike("email", email);

  if (matches.error) return ownerError("owner_lookup_failed", context, "email_lookup_failed", 500);
  const rows = matches.data ?? [];
  const ownerRows = rows.filter((row) => row.role === "owner");
  if (ownerRows.length === 0) return ownerError("owner_row_missing", context, "no_owner_for_email");
  if (ownerRows.length > 1) return ownerError("multiple_owner_rows", context, "multiple_owner_email_rows");

  const ownerRow = ownerRows[0];
  if (ownerRow.is_active === false) return ownerError("owner_inactive", context, "email_owner_inactive");
  if (!context.emailVerified) return ownerError("owner_uid_mismatch", context, "email_not_verified");

  const subRow = rows.find((row) => row.user_id === context.userId);
  if (subRow && subRow.role !== "owner") return ownerError("owner_uid_mismatch", context, "jwt_sub_already_staff_non_owner");

  const updated = await serviceClient
    .from("staff_members")
    .update({ user_id: context.userId, email, updated_at: new Date().toISOString() })
    .eq("user_id", ownerRow.user_id)
    .eq("role", "owner")
    .eq("is_active", true);

  if (updated.error) return ownerError("owner_uid_mismatch", context, "owner_uid_repair_failed", 500);
  return { ok: true, repaired: true };
}

function ownerError(error: string, context: OwnerCheckContext, reason: string, status = 403): OwnerCheckResult {
  return {
    ok: false,
    status,
    body: {
      error,
      currentLevel: context.currentLevel,
      accessTokenAal: context.accessTokenAal,
      reason
    }
  };
}

async function findOrInviteUser(
  serviceClient: ReturnType<typeof createClient>,
  email: string,
  mode: "email" | "link",
  redirectTo: string
): Promise<InviteUserResult> {
  const listed = await serviceClient.auth.admin.listUsers();
  let existing: { id: string; email?: string | null } | null = null;
  if (!listed.error) {
    existing = listed.data.users.find((user) => user.email?.toLowerCase() === email) ?? null;
  }

  if (mode === "email") {
    if (existing) return { ok: false, error: "user_already_registered", status: 409, canCreateLink: true };
    const invited = await serviceClient.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (invited.error) return classifyInviteError(invited.error);
    return { ok: true, user: invited.data.user, delivery: "email", linkType: "invite" };
  }

  const linkType = existing ? "recovery" : "invite";
  const generated = await serviceClient.auth.admin.generateLink({
    type: linkType,
    email,
    options: { redirectTo }
  });

  if (generated.error) return classifyInviteError(generated.error);
  const user = generated.data.user ?? existing;
  const actionLink = generated.data.properties?.action_link;
  if (!user?.id || !actionLink) {
    return { ok: false, error: "invite_link_failed", status: 500 };
  }
  return { ok: true, user, actionLink, delivery: "link", linkType };
}

function readJwtAalClaim(token: string | null | undefined) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const claims = JSON.parse(atob(padded));
    return typeof claims.aal === "string" ? claims.aal : null;
  } catch {
    return null;
  }
}

function normalizeEmail(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!email || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) return null;
  return email;
}

function cleanText(value: unknown, maxLength: number) {
  const text = String(value ?? "").trim();
  if (!text || text.length > maxLength || /[<>]/.test(text)) return null;
  return text;
}

function classifyInviteError(error: { message?: string; code?: string; status?: number; name?: string }): InviteUserResult {
  const message = String(error.message ?? "");
  const code = String(error.code ?? error.name ?? "");
  const status = Number(error.status ?? 500);
  const lower = `${code} ${message}`.toLowerCase();
  if (lower.includes("email address not authorized") || lower.includes("not authorized")) {
    return { ok: false, error: "email_not_authorized", status: 422, providerMessage: message, providerCode: code, canCreateLink: true };
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return { ok: false, error: "rate_limited", status: 429, providerMessage: message, providerCode: code, canCreateLink: true };
  }
  if (lower.includes("already") && lower.includes("registered")) {
    return { ok: false, error: "user_already_registered", status: 409, providerMessage: message, providerCode: code, canCreateLink: true };
  }
  if (lower.includes("invalid") && lower.includes("email")) {
    return { ok: false, error: "invalid_email", status: 400, providerMessage: message, providerCode: code };
  }
  if (lower.includes("smtp") || lower.includes("email provider") || lower.includes("mail")) {
    return { ok: false, error: "smtp_unavailable", status: 502, providerMessage: message, providerCode: code, canCreateLink: true };
  }
  return { ok: false, error: "invite_failed", status: status >= 400 && status < 600 ? status : 500, providerMessage: message, providerCode: code, canCreateLink: true };
}

function safeProviderMessage(message: unknown) {
  const text = String(message ?? "").trim();
  if (!text) return undefined;
  return text.replace(/https?:\/\/\S+/g, "[link]").slice(0, 180);
}

function buildRedirectTo(request: Request) {
  const allowedOrigins = (Deno.env.get("ALLOWED_APP_ORIGINS") ?? Deno.env.get("APP_ORIGIN") ?? "https://unicolle.vercel.app")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  const requestOrigin = (request.headers.get("Origin") ?? "").replace(/\/+$/, "");
  const origin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
  return `${origin}/auth/invite`;
}

async function logInviteAttempt(
  serviceClient: ReturnType<typeof createClient>,
  params: { actorUserId: string; email: string; role: StaffRole; delivery: "email" | "link"; ok: boolean; error?: string }
) {
  await serviceClient.from("staff_audit_logs").insert({
    table_name: "staff_invites",
    record_id: maskEmail(params.email),
    operation: "INSERT",
    actor_user_id: params.actorUserId,
    actor_aal: "aal2",
    new_data: {
      email: maskEmail(params.email),
      role: params.role,
      delivery: params.delivery,
      ok: params.ok,
      error: params.error ?? null
    }
  });
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "unknown";
  return `${local.slice(0, 2)}***@${domain}`;
}
