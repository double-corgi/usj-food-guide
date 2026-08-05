import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type StaffRole = "owner" | "editor";

const STAFF_API_ALLOWED_ORIGINS = new Set([
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "http://localhost:3000",
  "https://unicolle.vercel.app"
]);

export function staffApiHeaders(request: Request, methods = "GET, POST, OPTIONS") {
  const origin = request.headers.get("origin") ?? "";
  const headers: Record<string, string> = {
    "Cache-Control": "no-store, max-age=0",
    Vary: "Origin"
  };
  if (STAFF_API_ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = methods;
    headers["Access-Control-Allow-Headers"] = "authorization, content-type";
    headers["Access-Control-Max-Age"] = "0";
  }
  return headers;
}

export type StaffApiContext = {
  headers: Record<string, string>;
  supabase: ReturnType<typeof createClient<Database>>;
  user: User;
  staff: {
    role: StaffRole;
    active: boolean;
  };
};

export type StaffApiFailure = {
  response: NextResponse;
};

export async function requireStaffApi(request: Request, minRole: StaffRole = "editor", methods = "GET, POST, OPTIONS"): Promise<StaffApiContext | StaffApiFailure> {
  const headers = staffApiHeaders(request, methods);
  if (process.env.CAPACITOR_STATIC_EXPORT) {
    return { response: staffJson({ error: "unavailable" }, 401, headers) };
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey || !token) {
    return { response: staffJson({ error: "unauthorized", code: "missing_token" }, 401, headers) };
  }

  const supabase = createClient<Database>(supabaseUrl, anonKey, {
    global: { headers: { Authorization: "Bearer " + token } },
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return { response: staffJson({ error: "unauthorized", code: "invalid_token" }, 401, headers) };
  }

  const tokenAal2 = inspectStaffJwtAal2(token);
  if (!tokenAal2) {
    return { response: staffJson({ error: "forbidden", code: "aal2_required" }, 403, headers) };
  }

  const staffLookup = await lookupStaffMember(supabase, userData.user.id);
  const explicitStaffAllowed = staffLookup.ok === true && staffLookup.active === true && roleMeets(staffLookup.role, minRole);
  const { data: allowed, error: staffError } = await (supabase as any).rpc("is_staff_member", { min_role: minRole, require_aal2: true });
  if ((staffError || allowed !== true) && !explicitStaffAllowed) {
    const code = staffLookup.ok && staffLookup.role !== "none" && !staffLookup.active ? "staff_inactive" : minRole === "owner" ? "owner_required" : "staff_required";
    return { response: staffJson({ error: "forbidden", code }, 403, headers) };
  }

  const role = staffLookup.role === "owner" ? "owner" : "editor";
  return { headers, supabase, user: userData.user, staff: { role, active: true } };
}

export function staffJson(body: unknown, status: number, headers: Record<string, string>) {
  return NextResponse.json(body, { status, headers });
}

export function sanitizeStaffError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  if (code === "23505") return "already_exists";
  if (code === "23503") return "related_record_missing";
  if (code === "42501") return "permission_denied";
  if (SAFE_STAFF_ERROR_CODES.has(code)) return code;
  return "save_failed";
}

const SAFE_STAFF_ERROR_CODES = new Set([
  "invalid_product_kind",
  "invalid_category",
  "invalid_sale_status",
  "invalid_sale_period",
  "missing_sale_period",
  "invalid_image",
  "image_too_small",
  "unsupported_image"
]);

export function revalidateStaffManagedPaths(kind?: string, id?: string) {
  return { kind: kind ?? "all", id: id ?? null };
}

function inspectStaffJwtAal2(token: string) {
  try {
    const [, payload] = token.split(".");
    if (!payload) return false;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(Buffer.from(normalized, "base64").toString("utf8")) as { aal?: unknown; exp?: unknown };
    const exp = typeof decoded.exp === "number" ? decoded.exp : null;
    if (exp != null && exp * 1000 <= Date.now()) return false;
    return decoded.aal === "aal2";
  } catch {
    return false;
  }
}

function roleMeets(role: "owner" | "editor" | "other" | "none", minRole: StaffRole) {
  if (role === "owner") return true;
  return minRole === "editor" && role === "editor";
}

async function lookupStaffMember(supabase: ReturnType<typeof createClient<Database>>, userId: string): Promise<{ ok: boolean; role: "owner" | "editor" | "other" | "none"; active: boolean }> {
  try {
    const { data, error } = await supabase
      .from("staff_members")
      .select("role,is_active")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return { ok: false, role: "none", active: false };
    if (!data) return { ok: true, role: "none", active: false };
    const role: "owner" | "editor" | "other" = data.role === "owner" || data.role === "editor" ? data.role : "other";
    return { ok: true, role, active: data.is_active === true };
  } catch {
    return { ok: false, role: "none", active: false };
  }
}
