import type { Area, CrawlLog, FoodImage, FoodLocation, FoodWithRelations, Shop } from "@/types/domain";
import type { Database } from "@/types/database";

type AreaRow = Database["public"]["Tables"]["areas"]["Row"];
type ShopRow = Database["public"]["Tables"]["shops"]["Row"];
type FoodRow = Database["public"]["Tables"]["foods"]["Row"];
type ImageRow = Database["public"]["Tables"]["food_images"]["Row"];
type CrawlLogRow = Database["public"]["Tables"]["crawl_logs"]["Row"];
type LocationRow = {
  id: string;
  food_id: string;
  shop_id: string | null;
  shop_name: string;
  area_id: string | null;
  area_name: string;
  shop_type: "restaurant" | "cart" | "wagon" | "unknown";
  source_url: string | null;
  price: number | null;
  status: "active" | "scheduled" | "ended" | "inactive" | "unknown";
  start_date: string | null;
  end_date: string | null;
  last_checked_at: string;
};

export function mapArea(row: AreaRow): Area {
  return { id: row.id, name: row.name, sortOrder: row.sort_order };
}

export function mapShop(row: ShopRow): Shop {
  return {
    id: row.id,
    areaId: row.area_id ?? "",
    name: row.name,
    type: row.type,
    officialUrl: row.official_url ?? undefined,
    isActive: row.is_active
  };
}

export function mapImage(row: ImageRow): FoodImage {
  const imageRow = row as ImageRow & {
    image_match_score?: number | null;
    category_image_match_score?: number | null;
    image_source_context?: string | null;
    image_match_reason?: string | null;
    image_mismatch_reason?: string | null;
    image_verified?: boolean | null;
    has_watermark?: boolean | null;
    watermark_reason?: string | null;
    image_candidate_score?: number | null;
    image_source_name?: string | null;
    official_confirmed?: boolean | null;
    image_last_checked_at?: string | null;
  };
  return {
    id: row.id,
    foodId: row.food_id,
    imageUrl: row.image_url,
    sourceType: row.source_type,
    sourceUrl: row.source_url ?? undefined,
    priority: row.priority,
    altText: row.alt_text ?? undefined,
    alt: row.alt ?? row.alt_text ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    imageConfidenceScore: row.image_confidence_score ?? undefined,
    imageMatchScore: imageRow.image_match_score ?? undefined,
    categoryImageMatchScore: imageRow.category_image_match_score ?? undefined,
    imageSourceContext: imageRow.image_source_context ?? undefined,
    imageMatchReason: imageRow.image_match_reason ?? undefined,
    imageMismatchReason: imageRow.image_mismatch_reason ?? undefined,
    imageVerified: imageRow.image_verified ?? false,
    isSharedTooMuch: row.is_shared_too_much ?? false,
    hasWatermark: imageRow.has_watermark ?? false,
    watermarkReason: imageRow.watermark_reason ?? undefined,
    imageCandidateScore: imageRow.image_candidate_score ?? undefined,
    imageSourceName: imageRow.image_source_name ?? undefined,
    officialConfirmed: imageRow.official_confirmed ?? undefined,
    imageLastCheckedAt: imageRow.image_last_checked_at ?? undefined,
    enabled: row.enabled
  };
}

export function mapLocation(row: LocationRow): FoodLocation {
  return {
    id: row.id,
    foodId: row.food_id,
    shopId: row.shop_id ?? undefined,
    shopName: row.shop_name,
    areaId: row.area_id ?? undefined,
    areaName: row.area_name,
    shopType: row.shop_type,
    sourceUrl: row.source_url ?? undefined,
    price: row.price ?? undefined,
    status: row.status,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    lastCheckedAt: row.last_checked_at
  };
}

export function mapFood(row: FoodRow & { areas: AreaRow | null; shops: ShopRow | null; food_images: ImageRow[] | null; food_locations?: LocationRow[] | null }): FoodWithRelations {
  const foodRow = row as FoodRow & {
    price_min?: number | null;
    price_max?: number | null;
    price_note?: string | null;
    price_source_url?: string | null;
    price_last_checked_at?: string | null;
    price_confidence_score?: number | null;
    dining_type?: FoodWithRelations["diningType"] | null;
    dining_type_confidence_score?: number | null;
    dining_type_reason?: string | null;
    canonical_food?: boolean | null;
    canonical_group_id?: string | null;
    flavor?: string | null;
    event_name?: string | null;
    collaboration_name?: string | null;
    release_period?: string | null;
    seasonal_version?: string | null;
    rarity?: "standard" | "limited" | "event" | "rare" | null;
    zukan_number?: number | null;
    trusted_placeholder?: boolean | null;
    sale_status?: FoodWithRelations["saleStatus"] | null;
    sale_start_date?: string | null;
    sale_end_date?: string | null;
    sale_period_label?: string | null;
    is_completable?: boolean | null;
  };
  const area = row.areas ? mapArea(row.areas) : { id: row.area_id ?? "unknown", name: "エリア未確認", sortOrder: 999 };
  const shop = row.shops ? mapShop(row.shops) : { id: row.shop_id ?? "unknown", areaId: area.id, name: "店舗未確認", type: "unknown" as const, isActive: true };
  return {
    id: row.id,
    shopId: row.shop_id ?? shop.id,
    areaId: row.area_id ?? area.id,
    name: row.name,
    normalizedName: row.normalized_name,
    category: row.category,
    price: row.price ?? undefined,
    priceMin: foodRow.price_min ?? undefined,
    priceMax: foodRow.price_max ?? undefined,
    priceNote: foodRow.price_note ?? undefined,
    priceSource: foodRow.price || foodRow.price_min ? inferPriceSource(foodRow.price_source_url) : "unknown",
    priceSourceUrl: foodRow.price_source_url ?? undefined,
    priceLastCheckedAt: foodRow.price_last_checked_at ?? undefined,
    priceConfidenceScore: foodRow.price_confidence_score ?? undefined,
    diningType: foodRow.dining_type ?? undefined,
    diningTypeConfidenceScore: foodRow.dining_type_confidence_score ?? undefined,
    diningTypeReason: foodRow.dining_type_reason ?? undefined,
    description: row.description ?? undefined,
    officialUrl: row.official_url ?? undefined,
    sourceUrl: row.source_url,
    imageUrl: row.image_url ?? undefined,
    saleStatus: foodRow.sale_status ?? mapStatusToSaleStatus(row.status, row.start_date ?? undefined, row.end_date ?? undefined),
    saleStartDate: foodRow.sale_start_date ?? row.start_date ?? null,
    saleEndDate: foodRow.sale_end_date ?? row.end_date ?? null,
    salePeriodLabel: foodRow.sale_period_label ?? buildSalePeriodLabel(foodRow.sale_status ?? mapStatusToSaleStatus(row.status, row.start_date ?? undefined, row.end_date ?? undefined), foodRow.sale_start_date ?? row.start_date ?? null, foodRow.sale_end_date ?? row.end_date ?? null),
    isCompletable: foodRow.is_completable ?? mapStatusToSaleStatus(row.status, row.start_date ?? undefined, row.end_date ?? undefined) === "active",
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    status: row.status,
    isLimited: row.is_limited,
    confidenceScore: row.confidence_score ?? 0,
    nameQualityScore: row.name_quality_score ?? 0,
    displayQuality: row.display_quality ?? "medium",
    extractionSourceCount: row.extraction_source_count ?? 1,
    reviewStatus: row.review_status ?? "approved",
    hidden: row.hidden ?? false,
    duplicateGroupId: row.duplicate_group_id ?? undefined,
    manualOverride: row.manual_override ?? false,
    compositeMenu: row.composite_menu ?? false,
    canonicalFood: foodRow.canonical_food ?? undefined,
    canonicalGroupId: foodRow.canonical_group_id ?? undefined,
    flavor: foodRow.flavor ?? undefined,
    eventName: foodRow.event_name ?? undefined,
    collaborationName: foodRow.collaboration_name ?? undefined,
    releasePeriod: foodRow.release_period ?? undefined,
    seasonalVersion: foodRow.seasonal_version ?? undefined,
    rarity: foodRow.rarity ?? undefined,
    zukanNumber: foodRow.zukan_number ?? undefined,
    trustedPlaceholder: foodRow.trusted_placeholder ?? undefined,
    lastCheckedAt: row.last_checked_at,
    sourceNames: [],
    rejectionReasons: [],
    area,
    shop,
    images: (row.food_images ?? []).map(mapImage),
    locations: (row.food_locations ?? []).map(mapLocation)
  };
}

function mapStatusToSaleStatus(status: FoodWithRelations["status"], startDate?: string, endDate?: string): NonNullable<FoodWithRelations["saleStatus"]> {
  const todayKey = new Date().toISOString().slice(0, 10);
  if (startDate && startDate > todayKey) return "upcoming";
  if (endDate && todayKey > endDate) return "ended";
  if (status === "scheduled") return "upcoming";
  if (status === "ended" || status === "inactive") return "ended";
  if (status === "active") return "active";
  return "unknown";
}

function buildSalePeriodLabel(status: NonNullable<FoodWithRelations["saleStatus"]>, startDate?: string | null, endDate?: string | null) {
  if (status === "active") {
    if (startDate && endDate) return `${formatDateJa(startDate)}〜${formatDateJa(endDate)}`;
    if (startDate) return `${formatDateJa(startDate)}〜販売終了日未定`;
    return "販売中";
  }
  if (status === "ended") {
    if (startDate && endDate) return `${formatDateJa(startDate)}〜${formatDateJa(endDate)}`;
    return "販売終了";
  }
  if (status === "upcoming") return startDate ? `${formatDateJa(startDate)}開始予定` : "近日販売";
  if (status === "paused") return "一時停止";
  return "販売期間確認中";
}

function formatDateJa(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "numeric", day: "numeric" }).format(date);
}

function inferPriceSource(sourceUrl?: string | null) {
  if (!sourceUrl) return "unknown" as const;
  if (/usj\.co\.jp/i.test(sourceUrl)) return "official" as const;
  if (/official[_-]?app/i.test(sourceUrl)) return "official_app" as const;
  if (/menu[_-]?photo|menus?|photo/i.test(sourceUrl)) return "menu_photo" as const;
  if (/x\.com|twitter\.com|instagram\.com|threads\.net/i.test(sourceUrl)) return "social_report" as const;
  return "trusted_report" as const;
}

export function mapCrawlLog(row: CrawlLogRow): CrawlLog {
  return {
    id: row.id,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    status: row.status,
    message: row.message ?? undefined,
    addedCount: row.added_count,
    updatedCount: row.updated_count,
    inactiveCount: row.inactive_count,
    pagesCrawled: row.pages_crawled,
    foodsFound: row.foods_found,
    createdAt: row.created_at
  };
}
