import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { listAllFoodCandidates } from "@/lib/repositories/foods";
import { buildPublicCatalog, type PublicCatalogFood, type PublicCatalogShop } from "@/lib/repositories/public-catalog";
import { getFoodImage } from "@/lib/utils/image";
import type { Database } from "@/types/database";
import type { FoodWithRelations, SaleStatus } from "@/types/domain";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STAFF_API_ALLOWED_ORIGINS = new Set([
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "http://localhost:3000",
  "https://unicolle.vercel.app"
]);

type StaffCatalogTrace = {
  event: string;
  method: string;
  path: string;
  origin: string;
  status: number;
  hasAuthorization?: boolean;
  jwtParsed?: boolean;
  tokenExpired?: boolean;
  aal2?: boolean;
  userVerified?: boolean;
  staffLookupOk?: boolean;
  staffRole?: "owner" | "editor" | "other" | "none";
  staffActive?: boolean;
  rpcAllowed?: boolean;
  schemaVersion?: number;
  hasDashboard?: boolean;
  onSaleFoodCount?: number;
  unpublishedFoodCount?: number;
  areaCount?: number;
  shopCount?: number;
  activeSeasonalCollectionCount?: number;
  foodsLength?: number;
  areasLength?: number;
  shopsLength?: number;
  collectionsLength?: number;
  reason?: string;
};

function logStaffCatalogTrace(trace: StaffCatalogTrace) {
  if (process.env.STAFF_CATALOG_TRACE !== "1") return;
  console.info("staff-catalog-trace", JSON.stringify({
    requestAt: new Date().toISOString(),
    ...trace
  }));
}

function requestTraceBase(request: Request) {
  const url = new URL(request.url);
  return {
    method: request.method,
    path: url.pathname,
    origin: request.headers.get("origin") ?? "none"
  };
}

function staffApiHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  const headers: Record<string, string> = {
    "Cache-Control": "no-store, max-age=0",
    "Vary": "Origin"
  };
  if (STAFF_API_ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "authorization, content-type";
    headers["Access-Control-Max-Age"] = "0";
  }
  return headers;
}

export async function OPTIONS(request: Request) {
  logStaffCatalogTrace({ event: "preflight", ...requestTraceBase(request), status: 204 });
  return new Response(null, { status: 204, headers: staffApiHeaders(request) });
}

export async function GET(request: Request) {
  const headers = staffApiHeaders(request);
  const traceBase = requestTraceBase(request);
  if (process.env.CAPACITOR_STATIC_EXPORT) {
    logStaffCatalogTrace({ event: "response", ...traceBase, status: 401, reason: "static_export" });
    return NextResponse.json({ error: "unavailable in local app export" }, { status: 401, headers });
  }
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const tokenTrace = inspectStaffJwt(token);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey || !token) {
    const reason = !token ? "missing_token" : "missing_config";
    logStaffCatalogTrace({ event: "response", ...traceBase, status: 401, hasAuthorization: Boolean(authHeader), ...tokenTrace, reason });
    return NextResponse.json({ error: "unauthorized", code: reason }, { status: 401, headers });
  }

  const supabase = createClient<Database>(supabaseUrl, anonKey, {
    global: { headers: { Authorization: "Bearer " + token } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    const reason = tokenTrace.tokenExpired ? "token_expired" : "invalid_token";
    logStaffCatalogTrace({ event: "response", ...traceBase, status: 401, hasAuthorization: true, ...tokenTrace, userVerified: false, reason });
    return NextResponse.json({ error: "unauthorized", code: reason }, { status: 401, headers });
  }

  const staffLookup = await lookupStaffMember(supabase, userData.user.id);
  const explicitStaffAllowed = tokenTrace.aal2 === true && staffLookup.ok === true && staffLookup.active === true && (staffLookup.role === "owner" || staffLookup.role === "editor");
  const { data: allowed, error: staffError } = await (supabase as any).rpc("is_staff_member", { min_role: "editor", require_aal2: true });
  if ((staffError || allowed !== true) && !explicitStaffAllowed) {
    const reason = staffError
      ? "staff_rpc_error"
      : tokenTrace.aal2 !== true
        ? "aal2_required"
        : staffLookup.role === "none"
          ? "staff_row_missing"
          : staffLookup.active !== true
            ? "staff_inactive"
            : staffLookup.role === "other"
              ? "staff_role_mismatch"
              : "staff_or_aal2_required";
    logStaffCatalogTrace({
      event: "response",
      ...traceBase,
      status: 403,
      hasAuthorization: true,
      ...tokenTrace,
      userVerified: true,
      staffLookupOk: staffLookup.ok,
      staffRole: staffLookup.role,
      staffActive: staffLookup.active,
      rpcAllowed: allowed === true,
      reason
    });
    return NextResponse.json({ error: "forbidden", code: reason }, { status: 403, headers });
  }

  const allCandidates = await listAllFoodCandidates({ includeDeletedManualFoods: true });
  const initialCatalog = await buildPublicCatalog();
  const publicIds = new Set(initialCatalog.foods.map((food) => food.id));
  const privateFoods = allCandidates.filter((food) => !publicIds.has(food.id) && isStaffManageableUnpublishedFood(food)).map(mapStaffFood);
  const catalog = {
    ...initialCatalog,
    dashboard: {
      ...initialCatalog.dashboard,
      unpublishedFoodCount: privateFoods.filter((food) => !food.deletedAt).length
    }
  };

  const responseFoods = [...catalog.foods.map(mapPublicFood), ...privateFoods];
  const responseShops = catalog.shops.map(mapPublicShop);
  const responseAreas = catalog.areas.map((area) => ({ id: area.id, name: area.name, sortOrder: area.sortOrder }));
  const responseDashboard = {
    ...catalog.dashboard,
    schemaVersion: 2,
    calculatedAt: new Date().toISOString()
  };
  logStaffCatalogTrace({
    event: "response",
    ...traceBase,
    status: 200,
    hasAuthorization: true,
    ...tokenTrace,
    userVerified: true,
    staffLookupOk: staffLookup.ok,
    staffRole: staffLookup.role,
    staffActive: staffLookup.active,
    rpcAllowed: allowed === true,
    schemaVersion: responseDashboard.schemaVersion,
    hasDashboard: true,
    onSaleFoodCount: responseDashboard.onSaleFoodCount,
    unpublishedFoodCount: responseDashboard.unpublishedFoodCount,
    areaCount: responseDashboard.areaCount,
    shopCount: responseDashboard.shopCount,
    activeSeasonalCollectionCount: responseDashboard.activeSeasonalCollectionCount,
    foodsLength: responseFoods.length,
    areasLength: responseAreas.length,
    shopsLength: responseShops.length,
    collectionsLength: catalog.collections.length
  });

  return NextResponse.json({
    generatedAt: catalog.generatedAt,
    foods: responseFoods,
    shops: responseShops,
    areas: responseAreas,
    collections: catalog.collections,
    dashboard: responseDashboard
  }, {
    headers
  });
}

function inspectStaffJwt(token: string) {
  if (!token) return { jwtParsed: false, tokenExpired: undefined, aal2: undefined };
  try {
    const [, payload] = token.split(".");
    if (!payload) return { jwtParsed: false, tokenExpired: undefined, aal2: undefined };
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(Buffer.from(normalized, "base64").toString("utf8")) as { aal?: unknown; exp?: unknown };
    const exp = typeof decoded.exp === "number" ? decoded.exp : null;
    return {
      jwtParsed: true,
      tokenExpired: exp == null ? undefined : exp * 1000 <= Date.now(),
      aal2: decoded.aal === "aal2"
    };
  } catch {
    return { jwtParsed: false, tokenExpired: undefined, aal2: undefined };
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

function isStaffManageableUnpublishedFood(food: FoodWithRelations) {
  if (food.canonicalFood === false) return false;
  if (food.compositeMenu) return false;
  if (food.deletedAt) return true;
  if (food.hidden) return true;
  if (food.manualOverride) return true;
  if (food.reviewStatus !== "approved") return true;
  return false;
}

function mapPublicFood(food: PublicCatalogFood) {
  const saleStatus = normalizeSaleStatus(food.saleStatus as SaleStatus);
  return {
    id: food.id,
    name: food.name,
    nameEn: food.englishName,
    price: food.price ?? null,
    areaId: food.areaId,
    areaName: food.areaName ?? "エリア確認中",
    shopId: food.shopId,
    shopName: food.shopName ?? food.locations[0]?.shopName ?? "販売場所確認中",
    category: food.category ?? "unknown",
    saleStatus,
    status: food.saleStatus,
    publicState: "published",
    reviewStatus: "approved",
    hidden: false,
    deletedAt: null,
    imageUrl: food.imageUrl,
    sourceUrl: food.sourceUrl,
    startDate: null,
    endDate: null,
    updatedAt: null,
    manualOverride: false
  };
}

function mapPublicShop(shop: PublicCatalogShop) {
  return {
    id: shop.id,
    name: shop.name,
    areaId: shop.areaId,
    areaName: shop.areaName ?? "エリア確認中",
    shopType: normalizeShopType(shop.type),
    isActive: true,
    officialUrl: null
  };
}

function mapStaffFood(food: FoodWithRelations) {
  const saleStatus = normalizeSaleStatus(food.saleStatus);
  const hidden = Boolean(food.hidden);
  const deletedAt = food.deletedAt ?? null;
  return {
    id: food.id,
    name: food.name,
    nameEn: null,
    price: food.price ?? null,
    areaId: food.areaId ?? food.area.id,
    areaName: food.area.name,
    shopId: food.shopId ?? food.shop.id,
    shopName: food.shop.name,
    category: food.category,
    saleStatus,
    status: food.status,
    publicState: hidden || deletedAt ? "draft" : food.reviewStatus === "approved" ? "published" : "draft",
    reviewStatus: food.reviewStatus,
    hidden,
    deletedAt,
    imageUrl: getFoodImage(food) ?? food.imageUrl ?? null,
    sourceUrl: food.sourceUrl,
    startDate: food.saleStartDate ?? food.startDate ?? null,
    endDate: food.saleEndDate ?? food.endDate ?? null,
    updatedAt: food.updatedAt ?? food.lastCheckedAt ?? null,
    manualOverride: Boolean(food.manualOverride)
  };
}

function normalizeSaleStatus(value?: SaleStatus) {
  if (value === "active" || value === "paused" || value === "ended") return value;
  return "unknown";
}

function normalizeShopType(value: string | null | undefined) {
  if (value === "restaurant" || value === "cart" || value === "wagon" || value === "unknown") return value;
  if (value === "stand") return "wagon";
  return "unknown";
}
