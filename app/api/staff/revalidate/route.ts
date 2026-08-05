import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STAFF_API_ALLOWED_ORIGINS = new Set([
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "http://localhost:3000",
  "https://unicolle.vercel.app"
]);

function staffApiHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  const headers: Record<string, string> = {
    "Cache-Control": "no-store, max-age=0",
    "Vary": "Origin"
  };
  if (STAFF_API_ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "authorization, content-type";
    headers["Access-Control-Max-Age"] = "0";
  }
  return headers;
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: staffApiHeaders(request) });
}

type RevalidateBody = {
  kind?: "food" | "store" | "area" | "collection" | "all";
  id?: string;
};

export async function POST(request: Request) {
  const headers = staffApiHeaders(request);
  if (process.env.CAPACITOR_STATIC_EXPORT) {
    return NextResponse.json({ error: "unavailable in local app export" }, { status: 401, headers });
  }
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey || !token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers });
  }

  const supabase = createClient<Database>(supabaseUrl, anonKey, {
    global: { headers: { Authorization: "Bearer " + token } },
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers });
  }

  const staffLookup = await lookupStaffMember(supabase, userData.user.id);
  const tokenAal2 = inspectStaffJwtAal2(token);
  const explicitStaffAllowed = tokenAal2 === true && staffLookup.ok === true && staffLookup.active === true && (staffLookup.role === "owner" || staffLookup.role === "editor");
  const { data: allowed, error: staffError } = await (supabase as any).rpc("is_staff_member", { min_role: "editor", require_aal2: true });
  if ((staffError || allowed !== true) && !explicitStaffAllowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers });
  }

  const body = (await request.json().catch(() => ({}))) as RevalidateBody;
  const kind = body.kind ?? "all";
  const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : undefined;

  revalidatePath("/");
  revalidatePath("/foods");
  revalidatePath("/stores");
  revalidatePath("/areas");
  revalidatePath("/staff");

  if (kind === "food" && id) revalidatePath(`/foods/${id}`);
  if (kind === "store" && id) revalidatePath(`/stores/${id}`);
  if (kind === "area" && id) revalidatePath(`/areas/${id}`);
  if (kind === "collection" && id) revalidatePath(`/collections/${id}`);
  if (kind === "collection") revalidatePath("/");

  return NextResponse.json({ ok: true, kind, id: id ?? null }, { headers });
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

async function lookupStaffMember(supabase: ReturnType<typeof createClient<Database>>, userId: string): Promise<{ ok: boolean; role: "owner" | "editor" | "other" | "none"; active: boolean }> {
  try {
    const { data, error } = await supabase
      .from("staff_members")
      .select("role,is_active")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return { ok: false, role: "none" as const, active: false };
    if (!data) return { ok: true, role: "none" as const, active: false };
    const role: "owner" | "editor" | "other" = data.role === "owner" || data.role === "editor" ? data.role : "other";
    return { ok: true, role, active: data.is_active === true };
  } catch {
    return { ok: false, role: "none" as const, active: false };
  }
}
