"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import type { GeneratedDataset, GeneratedFood } from "@/scripts/types/generated";
import type { FoodCategory, PriceSource } from "@/types/domain";

const outputDir = path.join(process.cwd(), "scripts", "output");
const datasetPath = path.join(outputDir, "foods.generated.json");
const manualReviewPath = path.join(outputDir, "manual-price-decisions.json");
const auditLogPath = path.join(outputDir, "data-review-audit-log.json");
const foodCategories: FoodCategory[] = ["churro", "popcorn", "drink", "dessert", "burger", "pizza", "chicken", "rice", "noodle", "snack", "kids", "seasonal", "set", "unknown"];
const priceSources: PriceSource[] = ["official", "official_app", "menu_photo", "trusted_report", "social_report"];

export type ManualPriceState = {
  ok: boolean;
  message: string;
  foodId?: string;
};

export async function saveManualPrice(_previousState: ManualPriceState, formData: FormData): Promise<ManualPriceState> {
  const foodId = String(formData.get("foodId") ?? "").trim();
  const rawPrice = String(formData.get("price") ?? "").replace(/[^\d]/g, "");
  const sourceUrlInput = String(formData.get("priceSourceUrl") ?? "").trim();
  const sourceName = String(formData.get("priceSourceName") ?? "").trim() || "USJ公式 手動確認";
  const sourceTypeInput = String(formData.get("priceSource") ?? "official").trim() as PriceSource;

  if (!foodId) return { ok: false, message: "food_idがありません。" };
  if (!rawPrice) return { ok: false, message: "価格を数字で入力してください。", foodId };

  const price = Number(rawPrice);
  if (!Number.isInteger(price) || price < 100 || price > 12000) {
    return { ok: false, message: "価格は100〜12000円の範囲で入力してください。", foodId };
  }

  const dataset = readJson<GeneratedDataset>(datasetPath, { generatedAt: new Date(0).toISOString(), summary: {}, foods: [] } as unknown as GeneratedDataset);
  const food = dataset.foods.find((item) => item.id === foodId);
  if (!food) return { ok: false, message: "対象商品が見つかりません。", foodId };

  const sourceUrl = normalizeHttpUrl(sourceUrlInput || food.priceSourceUrl || food.sourceUrl);
  if (!sourceUrl) return { ok: false, message: "価格取得元URLはhttp/httpsで入力してください。", foodId };
  if (!priceSources.includes(sourceTypeInput)) return { ok: false, message: "価格ソース種別が不正です。", foodId };
  if ((sourceTypeInput === "official" || sourceTypeInput === "official_app") && !isOfficialUsjUrl(sourceUrl)) {
    return { ok: false, message: "公式確認済として保存する場合はUSJ公式URLが必要です。", foodId };
  }

  const before = snapshotImages(dataset.foods);
  const now = new Date().toISOString();
  food.price = price;
  food.priceMin = price;
  food.price_min = price;
  food.priceMax = undefined;
  food.price_max = undefined;
  food.priceNote = `${sourceName}で手動確認`;
  food.price_note = food.priceNote;
  food.priceSource = sourceTypeInput;
  food.price_source = sourceTypeInput;
  food.priceSourceUrl = sourceUrl;
  food.price_source_url = sourceUrl;
  food.priceLastCheckedAt = now;
  food.price_last_checked_at = now;
  food.priceConfidenceScore = confidenceForPriceSource(sourceTypeInput);
  food.price_confidence_score = food.priceConfidenceScore;
  food.lastCheckedAt = now;
  food.last_checked_at = now;

  const regression = imageRegressionCount(before, snapshotImages(dataset.foods));
  if (regression > 0) return { ok: false, message: "画像退行を検出したため保存を中止しました。", foodId };

  dataset.generatedAt = now;
  writeJson(datasetPath, dataset);
  writeManualDecision(foodId, { status: "confirmed", price, sourceUrl, sourceName, sourceType: sourceTypeInput, updatedAt: now });
  revalidatePricePaths(foodId);
  return { ok: true, message: "価格を保存しました。", foodId };
}

export async function saveManualMetadata(_previousState: ManualPriceState, formData: FormData): Promise<ManualPriceState> {
  const foodId = String(formData.get("foodId") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() as FoodCategory;
  const shopName = String(formData.get("shopName") ?? "").trim();
  const areaName = String(formData.get("areaName") ?? "").trim();

  if (!foodId) return { ok: false, message: "food_idがありません。" };
  if (!foodCategories.includes(category)) return { ok: false, message: "カテゴリが不正です。", foodId };

  const dataset = readJson<GeneratedDataset>(datasetPath, { generatedAt: new Date(0).toISOString(), summary: {}, foods: [] } as unknown as GeneratedDataset);
  const food = dataset.foods.find((item) => item.id === foodId);
  if (!food) return { ok: false, message: "対象商品が見つかりません。", foodId };

  const before = snapshotImages(dataset.foods);
  const previous = {
    category: food.category,
    shopName: food.shop?.name,
    areaName: food.area?.name
  };
  const now = new Date().toISOString();

  food.category = category;
  if (shopName) {
    food.shop.name = shopName;
    if (food.locations?.[0]) food.locations[0].shopName = shopName;
  }
  if (areaName) {
    food.area.name = areaName;
    if (food.locations?.[0]) food.locations[0].areaName = areaName;
  }
  food.lastCheckedAt = now;
  food.last_checked_at = now;

  const regression = imageRegressionCount(before, snapshotImages(dataset.foods));
  if (regression > 0) return { ok: false, message: "画像退行を検出したため保存を中止しました。", foodId };

  dataset.generatedAt = now;
  writeJson(datasetPath, dataset);
  appendAuditLog({
    action: "metadata_update",
    foodId,
    foodName: food.name,
    previous,
    next: { category: food.category, shopName: food.shop?.name, areaName: food.area?.name },
    updatedAt: now
  });
  revalidatePricePaths(foodId);
  return { ok: true, message: "監査情報を保存しました。", foodId };
}

export async function holdManualPriceReview(_previousState: ManualPriceState, formData: FormData): Promise<ManualPriceState> {
  const foodId = String(formData.get("foodId") ?? "").trim();
  const reasonCode = String(formData.get("holdReasonCode") ?? "").trim() || "official_exact_price_not_found";
  const reasonMemo = String(formData.get("holdReason") ?? "").trim();
  const checkedSourceUrl = normalizeHttpUrl(String(formData.get("checkedSourceUrl") ?? "").trim());
  const reason = [labelForHoldReason(reasonCode), reasonMemo].filter(Boolean).join(" / ");
  if (!foodId) return { ok: false, message: "food_idがありません。" };
  const now = new Date().toISOString();
  writeManualDecision(foodId, { status: "unconfirmable", reason, reasonCode, checkedSourceUrl, updatedAt: now });
  revalidatePath("/admin/prices");
  return { ok: true, message: "確認不能理由を保存しました。", foodId };
}

export async function recordDuplicateDecision(formData: FormData): Promise<void> {
  const foodId = String(formData.get("foodId") ?? "").trim();
  const otherFoodId = String(formData.get("otherFoodId") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  if (!foodId || !otherFoodId) return;
  if (decision !== "same" && decision !== "different") return;

  appendAuditLog({
    action: "duplicate_decision",
    foodId,
    otherFoodId,
    decision,
    updatedAt: new Date().toISOString()
  });
  revalidatePath("/admin/prices");
  revalidatePath("/admin/review-center");
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeManualDecision(foodId: string, decision: Record<string, unknown>) {
  const decisions = readJson<Record<string, Record<string, unknown>>>(manualReviewPath, {});
  decisions[foodId] = { ...(decisions[foodId] ?? {}), ...decision };
  writeJson(manualReviewPath, decisions);
}

function appendAuditLog(entry: Record<string, unknown>) {
  const logs = readJson<Array<Record<string, unknown>>>(auditLogPath, []);
  logs.unshift(entry);
  writeJson(auditLogPath, logs.slice(0, 1000));
}

function normalizeHttpUrl(value: string) {
  try {
    const parsed = new URL(value.startsWith("//") ? `https:${value}` : value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function isOfficialUsjUrl(url: string) {
  try {
    return /(^|\.)usj\.co\.jp$/i.test(new URL(url).hostname.replace(/^www\./, ""));
  } catch {
    return false;
  }
}

function confidenceForPriceSource(source: PriceSource) {
  if (source === "official" || source === "official_app") return 95;
  if (source === "menu_photo") return 88;
  if (source === "trusted_report") return 82;
  if (source === "social_report") return 72;
  return 0;
}

function labelForHoldReason(reasonCode: string) {
  const labels: Record<string, string> = {
    source_url_missing: "source_url未設定",
    official_exact_price_not_found: "公式ページで同一商品価格なし",
    product_name_mismatch: "商品名一致なし",
    only_similar_product_found: "類似商品のみ",
    set_or_size_ambiguous: "セット/サイズ違いが曖昧",
    pdf_manual_check_required: "PDF手動確認待ち",
    shop_page_check_required: "店舗ページ確認待ち",
    trusted_report_needed: "高信頼レポート確認待ち"
  };
  return labels[reasonCode] ?? "確認不能";
}

function snapshotImages(foods: GeneratedFood[]) {
  return new Map(
    foods.map((food) => [
      food.id,
      {
        imageUrl: food.imageUrl,
        representativeImageUrl: food.representativeImageUrl,
        images: food.images?.map((image) => ({
          id: image.id,
          imageUrl: image.imageUrl,
          enabled: image.enabled,
          imageVerified: image.imageVerified,
          imageApproved: image.imageApproved,
          manuallyAdded: image.manuallyAdded
        }))
      }
    ])
  );
}

function imageRegressionCount(before: ReturnType<typeof snapshotImages>, after: ReturnType<typeof snapshotImages>) {
  let count = 0;
  for (const [foodId, beforeRow] of before.entries()) {
    const afterRow = after.get(foodId);
    if (!afterRow) {
      count += 1;
      continue;
    }
    if (beforeRow.imageUrl && beforeRow.imageUrl !== afterRow.imageUrl) count += 1;
    if (beforeRow.representativeImageUrl && beforeRow.representativeImageUrl !== afterRow.representativeImageUrl) count += 1;
    const beforeEnabled = beforeRow.images?.filter((image) => image.enabled).map((image) => image.imageUrl).join("|") ?? "";
    const afterEnabled = afterRow.images?.filter((image) => image.enabled).map((image) => image.imageUrl).join("|") ?? "";
    if (beforeEnabled && beforeEnabled !== afterEnabled) count += 1;
  }
  return count;
}

function revalidatePricePaths(foodId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/prices");
  revalidatePath("/admin/review-center");
  revalidatePath("/foods");
  revalidatePath(`/foods/${foodId}`);
}
