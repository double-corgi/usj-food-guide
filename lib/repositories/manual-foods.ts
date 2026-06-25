import { createHash } from "node:crypto";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import type { Database } from "@/types/database";
import type { FoodCategory, FoodStatus, FoodWithRelations, SaleStatus } from "@/types/domain";

export type ManualFoodRow = Database["public"]["Tables"]["manual_foods"]["Row"];

type ListManualFoodsOptions = {
  publicOnly?: boolean;
  includeDeleted?: boolean;
  deletedOnly?: boolean;
};

export async function listManualFoods(options: ListManualFoodsOptions = {}): Promise<FoodWithRelations[]> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return [];

  let query = supabase.from("manual_foods").select("*").order("updated_at", { ascending: false });
  if (options.publicOnly) {
    query = query.eq("public_state", "published").eq("hidden", false).eq("sale_status", "active").is("deleted_at", null);
  } else if (options.deletedOnly) {
    query = query.not("deleted_at", "is", null);
  } else if (!options.includeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error("Failed to fetch manual foods", error);
    return [];
  }

  return data.map(mapManualFood);
}

export async function getManualFoodById(id: string, options: ListManualFoodsOptions = {}): Promise<FoodWithRelations | null> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return null;

  let query = supabase.from("manual_foods").select("*").eq("id", id);
  if (options.publicOnly) {
    query = query.eq("public_state", "published").eq("hidden", false).eq("sale_status", "active").is("deleted_at", null);
  } else if (!options.includeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) {
    if (error) console.error("Failed to fetch manual food", error);
    return null;
  }

  return mapManualFood(data);
}

export function buildManualFoodId(areaName: string, shopName: string, foodName: string) {
  return `food-manual-${stableHash(`${areaName}:${shopName}:${foodName}`)}`;
}

function mapManualFood(row: ManualFoodRow): FoodWithRelations {
  const areaId = `manual-area-${stableHash(row.area_name)}`;
  const shopId = `manual-shop-${stableHash(`${row.area_name}:${row.shop_name}`)}`;
  const saleStatus = row.sale_status as SaleStatus;
  const status = saleStatusToFoodStatus(saleStatus);
  const image = row.image_url
    ? [
        {
          id: `${row.id}-image-main`,
          foodId: row.id,
          imageUrl: row.image_url,
          sourceType: "own" as const,
          sourceUrl: row.source_url,
          priority: 10,
          altText: row.name,
          alt: row.name,
          imageConfidenceScore: 100,
          imageMatchScore: 100,
          categoryImageMatchScore: 100,
          imageVerified: true,
          isSharedTooMuch: false,
          hasWatermark: false,
          enabled: true
        }
      ]
    : [];

  return {
    id: row.id,
    shopId,
    areaId,
    name: row.name,
    normalizedName: row.normalized_name,
    category: row.category as FoodCategory,
    price: row.price ?? undefined,
    sourceUrl: row.source_url,
    imageUrl: row.image_url ?? undefined,
    saleStatus,
    saleStartDate: row.start_date,
    saleEndDate: row.end_date,
    salePeriodLabel: buildSalePeriodLabel(saleStatus, row.start_date, row.end_date),
    isCompletable: row.public_state === "published" && !row.hidden && !row.deleted_at && saleStatus === "active",
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    status,
    isLimited: Boolean(row.start_date || row.end_date || row.category_tags.includes("seasonal")),
    confidenceScore: 100,
    nameQualityScore: 100,
    displayQuality: "medium",
    extractionSourceCount: 1,
    reviewStatus: row.public_state === "published" ? "approved" : "pending",
    hidden: row.hidden,
    manualOverride: true,
    compositeMenu: false,
    canonicalFood: true,
    trustedPlaceholder: false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    lastCheckedAt: row.updated_at,
    sourceNames: ["manual_foods"],
    rejectionReasons: [],
    area: {
      id: areaId,
      name: row.area_name,
      sortOrder: 999
    },
    shop: {
      id: shopId,
      areaId,
      name: row.shop_name,
      type: "unknown",
      isActive: true
    },
    images: image,
    locations: [
      {
        id: `${row.id}-location-main`,
        foodId: row.id,
        shopId,
        shopName: row.shop_name,
        areaId,
        areaName: row.area_name,
        shopType: "unknown",
        sourceUrl: row.source_url,
        price: row.price ?? undefined,
        status,
        startDate: row.start_date ?? undefined,
        endDate: row.end_date ?? undefined,
        lastCheckedAt: row.updated_at
      }
    ]
  };
}

function saleStatusToFoodStatus(value: SaleStatus): FoodStatus {
  if (value === "active") return "active";
  if (value === "paused") return "inactive";
  if (value === "ended") return "ended";
  return "unknown";
}

function buildSalePeriodLabel(status: SaleStatus, startDate?: string | null, endDate?: string | null) {
  if (status === "active") {
    if (startDate && endDate) return `${formatDateJa(startDate)}〜${formatDateJa(endDate)}`;
    if (startDate) return `${formatDateJa(startDate)}〜販売終了日未定`;
    return "販売中";
  }
  if (status === "ended") {
    if (startDate && endDate) return `${formatDateJa(startDate)}〜${formatDateJa(endDate)}`;
    return "販売終了";
  }
  if (status === "paused") return "一時停止";
  return "販売期間確認中";
}

function formatDateJa(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "numeric", day: "numeric" }).format(date);
}

function stableHash(value: string) {
  return createHash("sha1").update(value).digest("hex").slice(0, 10);
}
