"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminAreaOptions, adminCategoryTagOptions, adminLegacyCategoryTagOptions, adminPublicStateOptions, adminSaleStatusOptions } from "@/lib/admin-food-ui";
import { requireAdmin } from "@/lib/admin-auth";
import { normalizeFoodName } from "@/lib/food-utils";
import { buildManualFoodId } from "@/lib/repositories/manual-foods";
import { readGeneratedFoods } from "@/lib/repositories/generated-data";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import type { Database } from "@/types/database";
import type { FoodCategory, FoodWithRelations } from "@/types/domain";

export type AdminFoodSaveState = {
  ok: boolean;
  message: string;
};

type ManualFoodInsert = Database["public"]["Tables"]["manual_foods"]["Insert"];
type ManualFoodUpdate = Database["public"]["Tables"]["manual_foods"]["Update"];
type FoodOverrideUpsert = Database["public"]["Tables"]["food_overrides"]["Insert"];
type ServiceSupabaseClient = NonNullable<ReturnType<typeof createServiceSupabaseClient>>;
type ImageUploadResult = {
  publicUrl: string;
  objectPath: string;
};
type GeneratedOverrideFormValue = {
  name: string | null;
  nameEn: string | null;
  price: number | null;
  areaName: string | null;
  shopName: string | null;
  saleStatus: "active" | "paused" | "ended" | "unknown" | null;
  saleStart: string | null;
  saleEnd: string | null;
  category: FoodCategory | null;
  categoryTags: string[] | null;
  adminNotes: string | null;
};

const emptyState: AdminFoodSaveState = { ok: false, message: "" };
const allowedCategoryTags: Set<string> = new Set([...adminCategoryTagOptions.map((option) => option.value), ...adminLegacyCategoryTagOptions.map((option) => option.value)]);
const allowedFoodCategories: Set<string> = new Set(Array.from(allowedCategoryTags).filter(isFoodCategory));
const allowedSaleStatuses: Set<string> = new Set(adminSaleStatusOptions.map((option) => option.value));
const allowedPublicStates: Set<string> = new Set(adminPublicStateOptions.map((option) => option.value));
const allowedHiddenStates = new Set(["visible", "hidden"]);
const manualFoodImageBucket = "food-images";
const manualFoodImageMaxInputBytes = 5 * 1024 * 1024;
const manualFoodImageMaxOutputBytes = 5 * 1024 * 1024;
const manualFoodImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function createAdminFood(_previousState: AdminFoodSaveState = emptyState, formData: FormData): Promise<AdminFoodSaveState> {
  const admin = await requireAdmin("editor");
  const supabase = createServiceSupabaseClient();
  if (!supabase) return { ok: false, message: "保存設定がまだ完了していないため保存できません。" };

  const parsed = parseFoodForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const id = buildManualFoodId(parsed.value.areaName, parsed.value.shopName, parsed.value.name);
  if (readGeneratedFoods({ includeHidden: true }).some((food) => food.id === id)) {
    return { ok: false, message: "既存商品のIDと重なったため保存を停止しました。" };
  }

  const existing = await supabase.from("manual_foods").select("id").eq("id", id).maybeSingle();
  if (existing.error) return { ok: false, message: `保存前確認に失敗しました: ${existing.error.message}` };
  if (existing.data) return { ok: false, message: "同じ商品がすでに手動追加されています。" };

  const imageFile = readImageFile(formData);
  if (!imageFile.ok) return { ok: false, message: imageFile.message };
  const uploadedImage = imageFile.file ? await uploadManualFoodImage(supabase, id, parsed.value.name, imageFile.file) : null;
  if (uploadedImage && !uploadedImage.ok) return { ok: false, message: uploadedImage.message };

  const now = new Date().toISOString();
  const adminEmail = admin.email ?? "unknown-admin";
  const payload: ManualFoodInsert = {
    id,
    name: parsed.value.name,
    normalized_name: normalizeFoodName(parsed.value.name),
    name_en: parsed.value.nameEn,
    category: parsed.value.category,
    category_tags: parsed.value.categoryTags,
    price: parsed.value.price,
    area_name: parsed.value.areaName,
    shop_name: parsed.value.shopName,
    sale_status: parsed.value.saleStatus,
    public_state: parsed.value.publicState,
    hidden: parsed.value.hidden,
    start_date: parsed.value.saleStart,
    end_date: parsed.value.saleEnd,
    image_url: uploadedImage?.value.publicUrl ?? null,
    source_url: "manual-admin",
    admin_notes: parsed.value.adminNotes,
    created_by: adminEmail,
    updated_by: adminEmail,
    created_at: now,
    updated_at: now
  };

  const { error } = await supabase.from("manual_foods").insert(payload);
  if (error) {
    if (uploadedImage) await removeUploadedManualFoodImage(supabase, uploadedImage.value.objectPath);
    return { ok: false, message: `保存に失敗しました: ${error.message}` };
  }

  revalidateAdminFoods();
  redirect(`/admin/foods/${id}?saved=created${uploadedImage ? "&image=updated" : ""}`);
}

export async function updateManualFood(_previousState: AdminFoodSaveState = emptyState, formData: FormData): Promise<AdminFoodSaveState> {
  const admin = await requireAdmin("editor");
  const supabase = createServiceSupabaseClient();
  if (!supabase) return { ok: false, message: "保存設定がまだ完了していないため保存できません。" };

  const foodId = readCleanText(formData, "foodId", 120);
  if (!foodId) return { ok: false, message: "対象商品IDが不正です。" };

  const existing = await supabase.from("manual_foods").select("id,image_url").eq("id", foodId).maybeSingle();
  if (existing.error) return { ok: false, message: `保存前確認に失敗しました: ${existing.error.message}` };
  if (!existing.data) return { ok: false, message: "自分で追加した商品だけ保存できます。自動取得の商品はまだ編集保存できません。" };

  const parsed = parseFoodForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const imageFile = readImageFile(formData);
  if (!imageFile.ok) return { ok: false, message: imageFile.message };
  const uploadedImage = imageFile.file ? await uploadManualFoodImage(supabase, foodId, parsed.value.name, imageFile.file) : null;
  if (uploadedImage && !uploadedImage.ok) return { ok: false, message: uploadedImage.message };

  const payload: ManualFoodUpdate = {
    name: parsed.value.name,
    normalized_name: normalizeFoodName(parsed.value.name),
    name_en: parsed.value.nameEn,
    category: parsed.value.category,
    category_tags: parsed.value.categoryTags,
    price: parsed.value.price,
    area_name: parsed.value.areaName,
    shop_name: parsed.value.shopName,
    sale_status: parsed.value.saleStatus,
    public_state: parsed.value.publicState,
    hidden: parsed.value.hidden,
    start_date: parsed.value.saleStart,
    end_date: parsed.value.saleEnd,
    image_url: uploadedImage?.value.publicUrl ?? existing.data.image_url,
    admin_notes: parsed.value.adminNotes,
    updated_by: admin.email ?? "unknown-admin",
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("manual_foods").update(payload).eq("id", foodId);
  if (error) return { ok: false, message: `保存に失敗しました: ${error.message}` };

  revalidateAdminFoods(foodId);
  redirect(`/admin/foods/${foodId}?saved=updated${uploadedImage ? "&image=updated" : ""}`);
}

export async function updateGeneratedFoodOverride(_previousState: AdminFoodSaveState = emptyState, formData: FormData): Promise<AdminFoodSaveState> {
  const admin = await requireAdmin("editor");
  const supabase = createServiceSupabaseClient();
  if (!supabase) return { ok: false, message: "保存設定がまだ完了していないため保存できません。" };

  const foodId = readCleanText(formData, "foodId", 120);
  if (!foodId) return { ok: false, message: "対象商品IDが不正です。" };

  const generatedFood = readGeneratedFoods({ includeHidden: true }).find((food) => food.id === foodId);
  if (!generatedFood) return { ok: false, message: "自動取得の商品が見つかりません。" };

  const manualFood = await supabase.from("manual_foods").select("id").eq("id", foodId).maybeSingle();
  if (manualFood.error) return { ok: false, message: `保存前確認に失敗しました: ${manualFood.error.message}` };
  if (manualFood.data) return { ok: false, message: "自分で追加した商品は通常の編集保存を使ってください。" };

  const parsed = parseGeneratedOverrideForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const existingOverride = await supabase.from("food_overrides").select("food_id,image_path,hidden").eq("food_id", foodId).maybeSingle();
  if (existingOverride.error) return { ok: false, message: `修正内容の保存前確認に失敗しました: ${existingOverride.error.message}` };

  const imageFile = readImageFile(formData);
  if (!imageFile.ok) return { ok: false, message: imageFile.message };
  const uploadedImage = imageFile.file ? await uploadGeneratedFoodOverrideImage(supabase, foodId, generatedFood.name, imageFile.file) : null;
  if (uploadedImage && !uploadedImage.ok) return { ok: false, message: uploadedImage.message };

  const resolvedIds = resolveGeneratedAreaShopIds(generatedFood, parsed.value.areaName, parsed.value.shopName);
  const payload = buildGeneratedOverridePayload({
    food: generatedFood,
    values: parsed.value,
    resolvedIds,
    adminEmail: admin.email ?? "unknown-admin",
    imagePath: uploadedImage?.value.objectPath ?? existingOverride.data?.image_path ?? null,
    hidden: existingOverride.data?.hidden ?? null
  });

  const { error } = await supabase.from("food_overrides").upsert(payload, { onConflict: "food_id" });
  if (error) {
    if (uploadedImage) await removeUploadedManualFoodImage(supabase, uploadedImage.value.objectPath);
    return { ok: false, message: `修正内容の保存に失敗しました: ${error.message}` };
  }

  revalidateAdminFoods(foodId);
  redirect(`/admin/foods/${foodId}?saved=override${uploadedImage ? "&image=updated" : ""}`);
}

export async function setManualFoodVisibility(formData: FormData): Promise<void> {
  const admin = await requireAdmin("editor");
  const supabase = createServiceSupabaseClient();
  if (!supabase) redirect("/admin/foods?error=supabase");

  const foodId = readCleanText(formData, "foodId", 120);
  const intent = readCleanText(formData, "intent", 20);
  if (!foodId) redirect("/admin/foods?error=missing-food");
  if (intent !== "hide" && intent !== "show") redirect(`/admin/foods/${foodId}?error=invalid-intent`);

  const existing = await supabase.from("manual_foods").select("id").eq("id", foodId).maybeSingle();
  if (existing.error || !existing.data) redirect(`/admin/foods/${foodId}?error=manual-only`);

  const hidden = intent === "hide";
  const { error } = await supabase
    .from("manual_foods")
    .update({
      hidden,
      updated_by: admin.email ?? "unknown-admin",
      updated_at: new Date().toISOString()
    })
    .eq("id", foodId);

  if (error) {
    console.error("manual food visibility update failed", {
      name: error.name,
      code: error.code,
      message: error.message,
      foodId
    });
    redirect(`/admin/foods/${foodId}?error=visibility-failed`);
  }

  revalidateAdminFoods(foodId);
  redirect(`/admin/foods?saved=${hidden ? "hidden" : "shown"}`);
}

export async function setGeneratedFoodVisibility(formData: FormData): Promise<void> {
  const admin = await requireAdmin("editor");
  const supabase = createServiceSupabaseClient();
  if (!supabase) redirect("/admin/foods?error=supabase");

  const foodId = readCleanText(formData, "foodId", 120);
  const intent = readCleanText(formData, "intent", 20);
  if (!foodId) redirect("/admin/foods?error=missing-food");
  if (intent !== "hide" && intent !== "show") redirect(`/admin/foods/${foodId}?error=invalid-intent`);

  const generatedFood = readGeneratedFoods({ includeHidden: true }).find((food) => food.id === foodId);
  if (!generatedFood) redirect(`/admin/foods/${foodId}?error=generated-only`);

  const manualFood = await supabase.from("manual_foods").select("id").eq("id", foodId).maybeSingle();
  if (manualFood.error) redirect(`/admin/foods/${foodId}?error=visibility-failed`);
  if (manualFood.data) redirect(`/admin/foods/${foodId}?error=generated-only`);

  const hidden = intent === "hide";
  const now = new Date().toISOString();
  const adminEmail = admin.email ?? "unknown-admin";
  const existingOverride = await supabase.from("food_overrides").select("food_id").eq("food_id", foodId).maybeSingle();
  if (existingOverride.error) redirect(`/admin/foods/${foodId}?error=visibility-failed`);

  const result = existingOverride.data
    ? await supabase
        .from("food_overrides")
        .update({
          hidden: hidden ? true : null,
          updated_by: adminEmail,
          updated_at: now
        })
        .eq("food_id", foodId)
    : await supabase.from("food_overrides").insert({
        food_id: foodId,
        hidden: hidden ? true : null,
        is_deleted: false,
        created_by: adminEmail,
        updated_by: adminEmail,
        created_at: now,
        updated_at: now
      });

  if (result.error) {
    console.error("generated food visibility update failed", {
      name: result.error.name,
      code: result.error.code,
      message: result.error.message,
      foodId
    });
    redirect(`/admin/foods/${foodId}?error=visibility-failed`);
  }

  revalidateAdminFoods(foodId);
  redirect(`/admin/foods?saved=${hidden ? "hidden" : "shown"}`);
}

function parseFoodForm(formData: FormData) {
  const name = readCleanText(formData, "nameJa", 120);
  if (!name) return failure("商品名を入力してください。");

  const nameEn = readOptionalCleanText(formData, "nameEn", 160);
  if (nameEn === false) return failure("英語名に使用できない文字が含まれています。");

  const price = parseGeneratedPrice(formData.get("price"));
  if (price === false) return failure("価格は数字で入力してください。");
  if (price === null) return failure("価格を入力してください。");

  const areaName = readCleanText(formData, "area", 80);
  if (!areaName || !adminAreaOptions.some((area) => area === areaName)) return failure("エリアを選択してください。");

  const shopName = readShopName(formData);
  if (!shopName) return failure("店舗を選択、または入力してください。");

  const saleStatus = readCleanText(formData, "saleStatus", 20);
  if (!saleStatus || !allowedSaleStatuses.has(saleStatus)) return failure("販売状態が不正です。");

  const publicState = readCleanText(formData, "publicState", 20);
  if (!publicState || !allowedPublicStates.has(publicState)) return failure("公開状態が不正です。");

  const hiddenState = readCleanText(formData, "hiddenState", 20);
  if (!hiddenState || !allowedHiddenStates.has(hiddenState)) return failure("表示状態が不正です。");

  const saleStart = readOptionalDate(formData, "saleStart");
  if (saleStart === false) return failure("販売開始日の形式が不正です。");
  const saleEnd = readOptionalDate(formData, "saleEnd");
  if (saleEnd === false) return failure("販売終了日の形式が不正です。");

  const categoryTags = readCategoryTags(formData);
  if (!categoryTags.ok) return failure(categoryTags.message);
  const category = primaryFoodCategory(categoryTags.values);
  const adminNotes = readOptionalCleanText(formData, "memo", 2000);
  if (adminNotes === false) return failure("管理メモに使用できない文字が含まれています。");

  return {
    ok: true as const,
    value: {
      name,
      nameEn,
      price,
      areaName,
      shopName,
      saleStatus: saleStatus as "active" | "paused" | "ended" | "unknown",
      publicState: publicState as "published" | "draft",
      saleStart,
      saleEnd,
      category,
      categoryTags: categoryTags.values,
      adminNotes,
      hidden: hiddenState === "hidden"
    }
  };
}

function parseGeneratedOverrideForm(formData: FormData) {
  const name = readOptionalCleanText(formData, "nameJa", 120);
  if (name === false) return failure("商品名に使用できない文字が含まれています。");

  const nameEn = readOptionalCleanText(formData, "nameEn", 160);
  if (nameEn === false) return failure("英語名に使用できない文字が含まれています。");

  const price = parsePrice(formData.get("price"));
  if (price === false) return failure("価格は数字で入力してください。");

  const areaNameValue = readOptionalCleanText(formData, "area", 80);
  if (areaNameValue === false) return failure("エリアに使用できない文字が含まれています。");
  const areaName = areaNameValue && areaNameValue !== "不明" ? areaNameValue : null;

  const shopNameValue = readOptionalCleanText(formData, "shopName", 120);
  if (shopNameValue === false) return failure("店舗名に使用できない文字が含まれています。");

  const saleStatusValue = readOptionalCleanText(formData, "saleStatus", 20);
  if (saleStatusValue === false || (saleStatusValue && !allowedSaleStatuses.has(saleStatusValue))) {
    return failure("販売状態が不正です。");
  }

  const saleStart = readOptionalDate(formData, "saleStart");
  if (saleStart === false) return failure("販売開始日の形式が不正です。");
  const saleEnd = readOptionalDate(formData, "saleEnd");
  if (saleEnd === false) return failure("販売終了日の形式が不正です。");

  const categoryTags = readOptionalCategoryTags(formData);
  if (!categoryTags.ok) return failure(categoryTags.message);

  const adminNotes = readOptionalCleanText(formData, "memo", 2000);
  if (adminNotes === false) return failure("管理メモに使用できない文字が含まれています。");

  return {
    ok: true as const,
    value: {
      name,
      nameEn,
      price,
      areaName,
      shopName: shopNameValue,
      saleStatus: saleStatusValue as "active" | "paused" | "ended" | "unknown" | null,
      saleStart,
      saleEnd,
      category: categoryTags.values.length > 0 ? primaryFoodCategory(categoryTags.values) : null,
      categoryTags: categoryTags.values.length > 0 ? categoryTags.values : null,
      adminNotes
    }
  };
}

function readCleanText(formData: FormData, key: string, maxLength: number) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value || value.length > maxLength || hasUnsafeText(value)) return null;
  return value;
}

function readOptionalCleanText(formData: FormData, key: string, maxLength: number) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) return null;
  if (value.length > maxLength || hasUnsafeText(value)) return false;
  return value;
}

function readShopName(formData: FormData) {
  const shopName = readCleanText(formData, "shopName", 120);
  if (shopName) return shopName;
  return null;
}

function readCategoryTags(formData: FormData) {
  const values = formData.getAll("categoryTags").map((value) => String(value).trim()).filter(Boolean);
  const uniqueValues = Array.from(new Set(values));
  if (uniqueValues.some((value) => hasUnsafeText(value) || !allowedCategoryTags.has(value))) {
    return { ok: false as const, message: "カテゴリタグが不正です。" };
  }
  if (uniqueValues.length === 0) {
    return { ok: false as const, message: "カテゴリを1つ以上選択してください。" };
  }
  return { ok: true as const, values: uniqueValues };
}

function readOptionalCategoryTags(formData: FormData) {
  const values = formData.getAll("categoryTags").map((value) => String(value).trim()).filter(Boolean);
  const uniqueValues = Array.from(new Set(values));
  if (uniqueValues.some((value) => hasUnsafeText(value) || !allowedCategoryTags.has(value))) {
    return { ok: false as const, message: "カテゴリタグが不正です。" };
  }
  return { ok: true as const, values: uniqueValues };
}

function primaryFoodCategory(categoryTags: string[]): FoodCategory {
  return (categoryTags.find((tag): tag is FoodCategory => allowedFoodCategories.has(tag)) ?? "unknown") as FoodCategory;
}

function parsePrice(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (!/^\d{1,6}$/.test(text)) return false;
  return Number(text);
}

function readOptionalDate(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return value;
}

function hasUnsafeText(value: string) {
  return /[<>]/.test(value) || /script:/i.test(value);
}

function readImageFile(formData: FormData): { ok: true; file: File | null } | { ok: false; message: string } {
  const value = formData.get("imageFile");
  if (!value || typeof value === "string") return { ok: true, file: null };
  if (value.size === 0) return { ok: true, file: null };
  if (!manualFoodImageMimeTypes.has(value.type)) {
    return { ok: false, message: "画像はJPEG、PNG、WebPのいずれかを選択してください。" };
  }
  if (value.size > manualFoodImageMaxInputBytes) {
    return { ok: false, message: "画像ファイルは5MB以下にしてください。" };
  }
  return { ok: true, file: value };
}

async function uploadManualFoodImage(supabase: ServiceSupabaseClient, foodId: string, foodName: string, imageFile: File) {
  return uploadFoodImage(supabase, `manual/${foodId}/main.webp`, foodId, foodName, imageFile);
}

async function uploadGeneratedFoodOverrideImage(supabase: ServiceSupabaseClient, foodId: string, foodName: string, imageFile: File) {
  return uploadFoodImage(supabase, `overrides/${foodId}/main.webp`, foodId, foodName, imageFile);
}

async function uploadFoodImage(supabase: ServiceSupabaseClient, objectPath: string, foodId: string, foodName: string, imageFile: File) {
  try {
    const optimizedImage = await optimizeManualFoodImage(imageFile);
    if (optimizedImage.byteLength > manualFoodImageMaxOutputBytes) {
      return { ok: false as const, message: "変換後の画像が5MBを超えたため保存できません。" };
    }

    const { error } = await supabase.storage.from(manualFoodImageBucket).upload(objectPath, optimizedImage, {
      cacheControl: "31536000",
      contentType: "image/webp",
      upsert: true
    });
    if (error) return { ok: false as const, message: `画像アップロードに失敗しました: ${error.message}` };

    const { data } = supabase.storage.from(manualFoodImageBucket).getPublicUrl(objectPath);
    if (!data.publicUrl) return { ok: false as const, message: "画像の公開URLを取得できませんでした。" };
    return { ok: true as const, value: { publicUrl: appendImageVersion(data.publicUrl), objectPath, altText: foodName } satisfies ImageUploadResult & { altText: string } };
  } catch (error) {
    console.error("Failed to optimize admin food image", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      foodId,
      fileType: imageFile.type,
      fileSize: imageFile.size
    });
    return { ok: false as const, message: "画像の変換に失敗しました。別のJPEG、PNG、WebP画像を選択してください。" };
  }
}

async function optimizeManualFoodImage(imageFile: File) {
  const sharp = (await import("sharp")).default;
  const input = Buffer.from(await imageFile.arrayBuffer());
  return sharp(input, { failOn: "error" })
    .rotate()
    .resize({ width: 960, height: 720, fit: "cover", position: "centre", withoutEnlargement: false })
    .webp({ quality: 82 })
    .toBuffer();
}

async function removeUploadedManualFoodImage(supabase: ServiceSupabaseClient, objectPath: string) {
  const { error } = await supabase.storage.from(manualFoodImageBucket).remove([objectPath]);
  if (error) console.error("Failed to clean up uploaded manual food image", { objectPath, message: error.message });
}

function appendImageVersion(publicUrl: string) {
  const version = Date.now().toString();
  try {
    const url = new URL(publicUrl);
    url.searchParams.set("v", version);
    return url.toString();
  } catch {
    const separator = publicUrl.includes("?") ? "&" : "?";
    return `${publicUrl}${separator}v=${version}`;
  }
}

function buildGeneratedOverridePayload({
  food,
  values,
  resolvedIds,
  adminEmail,
  imagePath,
  hidden
}: {
  food: FoodWithRelations;
  values: GeneratedOverrideFormValue;
  resolvedIds: { areaId: string | null; shopId: string | null };
  adminEmail: string;
  imagePath: string | null;
  hidden: boolean | null;
}): FoodOverrideUpsert {
  const now = new Date().toISOString();
  const categoryTags = values.categoryTags && !sameStringArray(values.categoryTags, [food.category]) ? values.categoryTags : null;
  const category = values.category && values.category !== food.category ? values.category : null;
  const saleStatus = values.saleStatus && values.saleStatus !== normalizeGeneratedSaleStatus(food) ? values.saleStatus : null;
  const areaName = values.areaName && values.areaName !== food.area.name ? values.areaName : null;
  const shopName = values.shopName && values.shopName !== food.shop.name ? values.shopName : null;

  return {
    food_id: food.id,
    name: values.name && values.name !== food.name ? values.name : null,
    name_en: values.nameEn,
    price: values.price !== null && values.price !== (food.price ?? null) ? values.price : null,
    price_min: null,
    price_max: null,
    price_note: null,
    area_name: areaName,
    area_id: areaName ? resolvedIds.areaId : null,
    shop_name: shopName,
    shop_id: shopName ? resolvedIds.shopId : null,
    category,
    category_tags: categoryTags,
    image_path: imagePath,
    image_source_url: null,
    info_source_url: null,
    sale_status: saleStatus,
    status: null,
    hidden,
    admin_source_type: "manual-confirmed",
    admin_confidence: "medium",
    admin_notes: values.adminNotes,
    is_deleted: false,
    updated_by: adminEmail,
    updated_at: now
  };
}

function resolveGeneratedAreaShopIds(food: FoodWithRelations, areaName: string | null, shopName: string | null) {
  const generatedFoods = readGeneratedFoods({ includeHidden: true });
  const areaId = areaName
    ? generatedFoods.find((candidate) => candidate.area.name === areaName)?.area.id ?? null
    : food.areaId;
  const shopId = shopName
    ? generatedFoods.find((candidate) => candidate.shop.name === shopName && (!areaName || candidate.area.name === areaName))?.shop.id ?? null
    : food.shopId;
  return { areaId, shopId };
}

function normalizeGeneratedSaleStatus(food: FoodWithRelations) {
  return food.saleStatus === "upcoming" ? "unknown" : (food.saleStatus ?? "unknown");
}

function parseGeneratedPrice(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (/^\d{1,6}$/.test(text)) return Number(text);
  if (/^\d{1,6}-\d{1,6}$/.test(text)) return null;
  return false;
}

function sameStringArray(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function isFoodCategory(value: string): value is FoodCategory {
  return (
    value === "churro" ||
    value === "popcorn" ||
    value === "drink" ||
    value === "dessert" ||
    value === "burger" ||
    value === "pizza" ||
    value === "chicken" ||
    value === "rice" ||
    value === "noodle" ||
    value === "snack" ||
    value === "kids" ||
    value === "seasonal" ||
    value === "set" ||
    value === "unknown"
  );
}

function revalidateAdminFoods(foodId?: string) {
  revalidatePath("/admin/foods");
  if (foodId) revalidatePath(`/admin/foods/${foodId}`);
  revalidatePath("/foods");
  if (foodId) revalidatePath(`/foods/${foodId}`);
  revalidatePath("/areas");
  revalidatePath("/stores");
}

function failure(message: string) {
  return { ok: false as const, message };
}
