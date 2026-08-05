import { revalidatePath } from "next/cache";
import { requireStaffApi, sanitizeStaffError, staffApiHeaders, staffJson } from "../_shared";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type WriteBody = {
  operation?: string;
  payload?: any;
};

const OWNER_ONLY = new Set([
  "food.hardDelete",
  "store.hardDelete",
  "area.hardDelete",
  "collection.hardDelete",
  "staff.role",
  "staff.active"
]);

const PRODUCT_KIND_VALUES = new Set(["churro", "popcorn", "drink", "snack", "cart", "seasonal", "nintendo", "minion", "harry_potter", "unknown"]);
const FOOD_CATEGORY_VALUES = new Set(["churro", "popcorn", "drink", "dessert", "burger", "pizza", "chicken", "rice", "curry", "noodle", "snack", "kids", "seasonal", "set", "unknown"]);
const SALE_STATUS_VALUES = new Set(["active", "paused", "ended", "unknown"]);

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: staffApiHeaders(request, "POST, OPTIONS") });
}

export async function POST(request: Request) {
  const context = await requireStaffApi(request, "editor", "POST, OPTIONS");
  if ("response" in context) return context.response;

  const body = (await request.json().catch(() => ({}))) as WriteBody;
  const operation = typeof body.operation === "string" ? body.operation : "";
  if (!operation) return staffJson({ ok: false, error: "invalid_request" }, 400, context.headers);
  if (OWNER_ONLY.has(operation) && context.staff.role !== "owner") {
    return staffJson({ ok: false, error: "forbidden", code: "owner_required" }, 403, context.headers);
  }

  try {
    const result = await runOperation(context.supabase as any, context.user.id, context.user.email ?? context.user.id, operation, body.payload ?? {});
    revalidateManagedPaths(result.kind, result.id);
    return staffJson({ ok: true, verified: true, operation, ...result }, 200, context.headers);
  } catch (error) {
    const code = sanitizeStaffError(error);
    return staffJson({ ok: false, error: code, code }, code === "permission_denied" ? 403 : 400, context.headers);
  }
}

async function runOperation(db: any, userId: string, actorText: string, operation: string, payload: any): Promise<{ kind: string; id: string | null; data?: unknown }> {
  switch (operation) {
    case "food.save":
      return saveFood(db, actorText, payload);
    case "food.seasonal":
      return saveFoodSeasonal(db, payload);
    case "food.storeLinks":
      return saveFoodStoreLinks(db, userId, payload);
    case "food.softDelete":
      return softDeleteFood(db, userId, actorText, payload);
    case "food.hardDelete":
      return hardDeleteFood(db, payload);
    case "store.save":
      return saveStore(db, userId, payload);
    case "store.softDelete":
      return softDeleteStore(db, userId, payload);
    case "store.hardDelete":
      return hardDeleteStore(db, payload);
    case "area.save":
      return saveArea(db, userId, payload);
    case "area.softDelete":
      return softDeleteArea(db, userId, payload);
    case "area.hardDelete":
      return hardDeleteArea(db, payload);
    case "collection.save":
      return saveCollection(db, userId, payload);
    case "collection.softDelete":
      return softDeleteCollection(db, userId, payload);
    case "collection.hardDelete":
      return hardDeleteCollection(db, payload);
    case "staff.role":
      return updateStaffRole(db, payload);
    case "staff.active":
      return updateStaffActive(db, userId, payload);
    default:
      throw new Error("unsupported_operation");
  }
}

async function saveFood(db: any, actorText: string, payload: any) {
  const id = safeId(payload.id);
  const values = normalizeFoodValues(safeObject(payload.values), safeString(payload.salePeriodKind));
  const isGenerated = payload.isGenerated === true;
  const now = new Date().toISOString();
  if (isGenerated) {
    const row = { ...values, food_id: id, updated_by: actorText, updated_at: now };
    const { data, error } = await db.from("food_overrides").upsert(row, { onConflict: "food_id" }).select("food_id,name,price").maybeSingle();
    if (error || !data) throw error ?? new Error("verify_failed");
    return { kind: "food", id, data };
  }

  const existing = await db.from("manual_foods").select("id,version").eq("id", id).maybeSingle();
  if (existing.error) throw existing.error;
  const row = { ...values, id, updated_by: actorText, updated_at: now };
  if (existing.data) {
    let query = db.from("manual_foods").update(row).eq("id", id);
    if (payload.version != null) query = query.eq("version", Number(payload.version));
    const { data, error } = await query.select("id,name,price,public_state").maybeSingle();
    if (error || !data) throw error ?? new Error("verify_failed");
    return { kind: "food", id, data };
  }
  const { data, error } = await db.from("manual_foods").insert({ ...row, created_by: actorText, created_at: now }).select("id,name,price,public_state").maybeSingle();
  if (error || !data) throw error ?? new Error("verify_failed");
  return { kind: "food", id, data };
}

async function saveFoodSeasonal(db: any, payload: any) {
  const foodId = safeId(payload.foodId);
  const editableCollectionIds = safeStringArray(payload.editableCollectionIds);
  const selected = new Set(safeStringArray(payload.selectedCollectionIds));
  for (const collectionId of editableCollectionIds) {
    if (selected.has(collectionId)) {
      const { error } = await db.from("food_collection_memberships").upsert({ food_id: foodId, collection_id: collectionId }, { onConflict: "food_id,collection_id" });
      if (error) throw error;
    } else {
      const { error } = await db.from("food_collection_memberships").delete().eq("food_id", foodId).eq("collection_id", collectionId);
      if (error) throw error;
    }
  }
  const reviewStatus = payload.publicState === "published" ? "approved" : safeString(payload.reviewStatus) || "needs_review";
  const { data, error } = await db.from("food_publication_metadata").upsert({ food_id: foodId, review_status: reviewStatus, updated_at: new Date().toISOString() }, { onConflict: "food_id" }).select("food_id,review_status").maybeSingle();
  if (error || !data) throw error ?? new Error("verify_failed");
  return { kind: "food", id: foodId, data };
}

async function saveFoodStoreLinks(db: any, userId: string, payload: any) {
  const foodId = safeId(payload.foodId);
  const selected = safeStringArray(payload.selectedStoreIds);
  const currentRows = Array.isArray(payload.currentRows) ? payload.currentRows : [];
  const primaryStoreId = safeString(payload.primaryStoreId);
  const now = new Date().toISOString();
  for (const shopId of selected) {
    const { error } = await db.from("staff_food_store_links").upsert({
      food_id: foodId,
      shop_id: shopId,
      is_primary: primaryStoreId ? primaryStoreId === shopId : selected[0] === shopId,
      sale_status: safeString(payload.saleStatus) || "unknown",
      price: payload.price == null || payload.price === "" ? null : Number(payload.price),
      start_date: emptyToNull(payload.startDate),
      end_date: emptyToNull(payload.endDate),
      deleted_at: null,
      updated_by: userId,
      created_by: userId
    }, { onConflict: "food_id,shop_id" });
    if (error) throw error;
  }
  for (const row of currentRows) {
    const shopId = safeString(row?.shop_id);
    const rowId = safeString(row?.id);
    if (rowId && shopId && !selected.includes(shopId) && !row?.deleted_at) {
      const { error } = await db.from("staff_food_store_links").update({ deleted_at: now, deleted_by: userId }).eq("id", rowId);
      if (error) throw error;
    }
  }
  return { kind: "food", id: foodId };
}

async function softDeleteFood(db: any, userId: string, actorText: string, payload: any) {
  const id = safeId(payload.id);
  const restore = payload.restore === true;
  if (payload.sourceKind === "generated") {
    const { data, error } = await db.from("food_overrides").upsert({
      food_id: id,
      is_deleted: !restore,
      hidden: restore ? false : true,
      deleted_at: restore ? null : new Date().toISOString(),
      deleted_by: restore ? null : userId,
      updated_by: actorText
    }, { onConflict: "food_id" }).select("food_id,is_deleted,hidden").maybeSingle();
    if (error || !data) throw error ?? new Error("verify_failed");
    return { kind: "food", id, data };
  }
  const { data, error } = await db.from("manual_foods").update({ deleted_at: restore ? null : new Date().toISOString(), deleted_by: restore ? null : userId }).eq("id", id).select("id,deleted_at").maybeSingle();
  if (error || !data) throw error ?? new Error("verify_failed");
  return { kind: "food", id, data };
}

async function hardDeleteFood(db: any, payload: any) {
  const id = safeId(payload.id);
  const sourceKind = safeString(payload.sourceKind);
  const result = sourceKind === "generated"
    ? await db.from("food_overrides").delete().eq("food_id", id)
    : await db.from("manual_foods").delete().eq("id", id).not("deleted_at", "is", null);
  if (result.error) throw result.error;
  return { kind: "food", id };
}

async function saveStore(db: any, userId: string, payload: any) {
  const id = safeId(payload.id);
  const values = { ...safeObject(payload.values), id, updated_by: userId, created_by: userId, updated_at: new Date().toISOString() };
  const { data, error } = await db.from("staff_shops").upsert(values, { onConflict: "id" }).select("id,name,public_state").maybeSingle();
  if (error || !data) throw error ?? new Error("verify_failed");
  return { kind: "store", id, data };
}

async function softDeleteStore(db: any, userId: string, payload: any) {
  const id = safeId(payload.id);
  const restore = payload.restore === true;
  const values = { ...safeObject(payload.values), id, deleted_at: restore ? null : new Date().toISOString(), deleted_by: restore ? null : userId, updated_by: userId };
  const { data, error } = await db.from("staff_shops").upsert(values, { onConflict: "id" }).select("id,deleted_at").maybeSingle();
  if (error || !data) throw error ?? new Error("verify_failed");
  return { kind: "store", id, data };
}

async function hardDeleteStore(db: any, payload: any) {
  const id = safeId(payload.id);
  const { error } = await db.from("staff_shops").delete().eq("id", id).not("deleted_at", "is", null);
  if (error) throw error;
  return { kind: "store", id };
}

async function saveArea(db: any, userId: string, payload: any) {
  const id = safeId(payload.id);
  const values = { ...safeObject(payload.values), id, updated_by: userId, created_by: userId, updated_at: new Date().toISOString() };
  const { data, error } = await db.from("staff_areas").upsert(values, { onConflict: "id" }).select("id,name,public_state").maybeSingle();
  if (error || !data) throw error ?? new Error("verify_failed");
  return { kind: "area", id, data };
}

async function softDeleteArea(db: any, userId: string, payload: any) {
  const id = safeId(payload.id);
  const restore = payload.restore === true;
  const values = { ...safeObject(payload.values), id, hidden: restore ? false : true, deleted_at: restore ? null : new Date().toISOString(), deleted_by: restore ? null : userId, updated_by: userId };
  const { data, error } = await db.from("staff_areas").upsert(values, { onConflict: "id" }).select("id,deleted_at,hidden").maybeSingle();
  if (error || !data) throw error ?? new Error("verify_failed");
  return { kind: "area", id, data };
}

async function hardDeleteArea(db: any, payload: any) {
  const id = safeId(payload.id);
  const { error } = await db.from("staff_areas").delete().eq("id", id).not("deleted_at", "is", null);
  if (error) throw error;
  return { kind: "area", id };
}

async function saveCollection(db: any, userId: string, payload: any) {
  const id = safeId(payload.id);
  const values = { ...safeObject(payload.values), id, updated_by: userId, created_by: userId, updated_at: new Date().toISOString() };
  const { data, error } = await db.from("collections").upsert(values, { onConflict: "id" }).select("id,name,public_state,is_featured").maybeSingle();
  if (error || !data) throw error ?? new Error("verify_failed");
  const selectedFoodIds = new Set(safeStringArray(payload.selectedFoodIds));
  const existingLinks = Array.isArray(payload.existingLinks) ? payload.existingLinks : [];
  for (const foodId of selectedFoodIds) {
    const { error: linkError } = await db.from("food_collection_memberships").upsert({ food_id: foodId, collection_id: id }, { onConflict: "food_id,collection_id" });
    if (linkError) throw linkError;
  }
  for (const link of existingLinks) {
    const foodId = safeString(link?.food_id);
    if (foodId && !selectedFoodIds.has(foodId)) {
      const { error: unlinkError } = await db.from("food_collection_memberships").delete().eq("food_id", foodId).eq("collection_id", id);
      if (unlinkError) throw unlinkError;
    }
  }
  return { kind: "collection", id, data };
}

async function softDeleteCollection(db: any, userId: string, payload: any) {
  const id = safeId(payload.id);
  const restore = payload.restore === true;
  const values = { ...safeObject(payload.values), id, hidden: restore ? false : true, deleted_at: restore ? null : new Date().toISOString(), deleted_by: restore ? null : userId, updated_by: userId };
  const { data, error } = await db.from("collections").upsert(values, { onConflict: "id" }).select("id,deleted_at,hidden").maybeSingle();
  if (error || !data) throw error ?? new Error("verify_failed");
  return { kind: "collection", id, data };
}

async function hardDeleteCollection(db: any, payload: any) {
  const id = safeId(payload.id);
  const { error } = await db.from("collections").delete().eq("id", id).not("deleted_at", "is", null);
  if (error) throw error;
  return { kind: "collection", id };
}

async function updateStaffRole(db: any, payload: any) {
  const userId = safeId(payload.userId);
  const role = payload.role === "owner" || payload.role === "editor" ? payload.role : null;
  if (!role) throw new Error("invalid_role");
  const { data, error } = await db.from("staff_members").update({ role, updated_at: new Date().toISOString() }).eq("user_id", userId).select("user_id,role").maybeSingle();
  if (error || !data) throw error ?? new Error("verify_failed");
  return { kind: "staff", id: null, data };
}

async function updateStaffActive(db: any, actorUserId: string, payload: any) {
  const userId = safeId(payload.userId);
  const isActive = payload.isActive === true;
  const { data, error } = await db.from("staff_members").update({ is_active: isActive, disabled_at: isActive ? null : new Date().toISOString(), disabled_by: isActive ? null : actorUserId, updated_at: new Date().toISOString() }).eq("user_id", userId).select("user_id,is_active").maybeSingle();
  if (error || !data) throw error ?? new Error("verify_failed");
  return { kind: "staff", id: null, data };
}

function normalizeFoodValues(values: Record<string, unknown>, salePeriodKind: string) {
  const categoryTags = safeStringArray(values.category_tags);
  if (categoryTags.length !== 1 || !PRODUCT_KIND_VALUES.has(categoryTags[0])) throw staffInputError("invalid_product_kind");
  const category = safeString(values.category);
  if (!FOOD_CATEGORY_VALUES.has(category)) throw staffInputError("invalid_category");
  const saleStatus = safeString(values.sale_status);
  if (!SALE_STATUS_VALUES.has(saleStatus)) throw staffInputError("invalid_sale_status");
  const startDate = emptyToNull(values.start_date);
  const endDate = emptyToNull(values.end_date);
  if (startDate && endDate && startDate > endDate) throw staffInputError("invalid_sale_period");
  const hasPartialPeriod = Boolean(startDate) !== Boolean(endDate);
  const publishRequested = values.public_state === "published" || (values.public_state == null && values.hidden !== true);
  if (publishRequested && saleStatus === "active" && (hasPartialPeriod || (salePeriodKind === "limited" && (!startDate || !endDate)))) throw staffInputError("missing_sale_period");
  return { ...values, category, category_tags: categoryTags, sale_status: saleStatus, start_date: startDate, end_date: endDate };
}

function staffInputError(code: string) {
  const error = new Error(code) as Error & { code?: string };
  error.code = code;
  return error;
}

function revalidateManagedPaths(kind: string, id: string | null) {
  revalidatePath("/");
  revalidatePath("/foods");
  revalidatePath("/stores");
  revalidatePath("/areas");
  revalidatePath("/staff");
  if (kind === "food" && id) revalidatePath(`/foods/${id}`);
  if (kind === "store" && id) revalidatePath(`/stores/${id}`);
  if (kind === "area" && id) revalidatePath(`/areas/${id}`);
  if (kind === "collection" && id) revalidatePath(`/collections/${id}`);
}

function safeObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_payload");
  return value as Record<string, unknown>;
}

function safeId(value: unknown) {
  const id = safeString(value);
  if (!id) throw new Error("invalid_id");
  return id;
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => safeString(item)).filter(Boolean)));
}

function emptyToNull(value: unknown) {
  const text = safeString(value);
  return text ? text : null;
}
