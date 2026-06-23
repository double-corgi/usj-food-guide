"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminAreaOptions, adminCategoryTagOptions, adminPublicStateOptions, adminSaleStatusOptions } from "@/lib/admin-food-ui";
import { requireAdmin } from "@/lib/admin-auth";
import { normalizeFoodName } from "@/lib/food-utils";
import { buildManualFoodId } from "@/lib/repositories/manual-foods";
import { readGeneratedFoods } from "@/lib/repositories/generated-data";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import type { Database } from "@/types/database";
import type { FoodCategory } from "@/types/domain";

export type AdminFoodSaveState = {
  ok: boolean;
  message: string;
};

type ManualFoodInsert = Database["public"]["Tables"]["manual_foods"]["Insert"];
type ServiceSupabaseClient = NonNullable<ReturnType<typeof createServiceSupabaseClient>>;
type ImageUploadResult = {
  publicUrl: string;
  objectPath: string;
};

const emptyState: AdminFoodSaveState = { ok: false, message: "" };
const allowedCategoryTags: Set<string> = new Set(adminCategoryTagOptions.map((option) => option.value));
const allowedFoodCategories: Set<string> = new Set(adminCategoryTagOptions.map((option) => option.value).filter(isFoodCategory));
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
  if (!supabase) return { ok: false, message: "Supabase service role が未設定のため保存できません。" };

  const parsed = parseFoodForm(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const id = buildManualFoodId(parsed.value.areaName, parsed.value.shopName, parsed.value.name);
  if (readGeneratedFoods({ includeHidden: true }).some((food) => food.id === id)) {
    return { ok: false, message: "既存generated商品IDと衝突したため保存を停止しました。" };
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
  redirect("/admin/foods?saved=created");
}

function parseFoodForm(formData: FormData) {
  const name = readCleanText(formData, "nameJa", 120);
  if (!name) return failure("商品名を入力してください。");

  const nameEn = readOptionalCleanText(formData, "nameEn", 160);
  if (nameEn === false) return failure("英語名に使用できない文字が含まれています。");

  const price = parsePrice(formData.get("price"));
  if (price === false) return failure("価格は数字で入力してください。");

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
  const selection = readCleanText(formData, "shopSelection", 120);
  if (!selection) return null;
  if (selection === "__other") return readCleanText(formData, "shopOther", 120);
  return selection;
}

function readCategoryTags(formData: FormData) {
  const values = formData.getAll("categoryTags").map((value) => String(value).trim()).filter(Boolean);
  const uniqueValues = Array.from(new Set(values));
  if (uniqueValues.some((value) => hasUnsafeText(value) || !allowedCategoryTags.has(value))) {
    return { ok: false as const, message: "カテゴリタグが不正です。" };
  }
  return { ok: true as const, values: uniqueValues.length > 0 ? uniqueValues : ["unknown"] };
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
  const objectPath = `manual/${foodId}/main.webp`;
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
    return { ok: true as const, value: { publicUrl: data.publicUrl, objectPath, altText: foodName } satisfies ImageUploadResult & { altText: string } };
  } catch (error) {
    console.error("Failed to optimize manual food image", {
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

function revalidateAdminFoods() {
  revalidatePath("/admin/foods");
  revalidatePath("/foods");
  revalidatePath("/areas");
  revalidatePath("/stores");
}

function failure(message: string) {
  return { ok: false as const, message };
}
