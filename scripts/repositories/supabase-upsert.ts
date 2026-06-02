import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database";
import type { CrawledFood, CrawlRunResult } from "../types/crawler";
import type { GeneratedFood } from "../types/generated";
import { loadEnvFiles } from "../utils/load-env";

export type PersistResult = {
  addedCount: number;
  updatedCount: number;
  inactiveCount: number;
  savedFoods: number;
  skipped: number;
};

export async function persistCrawlResult(result: CrawlRunResult, generatedFoods?: GeneratedFood[]): Promise<PersistResult> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return { addedCount: 0, updatedCount: 0, inactiveCount: 0, savedFoods: 0, skipped: generatedFoods?.length ?? result.uniqueFoods };
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  let addedCount = 0;
  let updatedCount = 0;
  let savedFoods = 0;

  const foodsToPersist = generatedFoods ?? result.sources.flatMap((source) => source.foods).map(toGeneratedFallback);
  for (const food of foodsToPersist) {
    if (food.reviewStatus === "rejected" && Number(process.env.CRAWL_SAVE_REJECTED ?? 1) !== 1) continue;

    const areaId = await upsertArea(supabase, food.area.name);
    const shopId = await upsertShop(supabase, food, areaId);
    const existing = await supabase.from("foods").select("id, manual_override").eq("shop_id", shopId).eq("normalized_name", food.normalizedName).maybeSingle();

    const payload = {
      shop_id: shopId,
      area_id: areaId,
      name: food.name,
      normalized_name: food.normalizedName,
      category: food.category,
      price: food.price ?? null,
      price_min: food.priceMin ?? food.price ?? null,
      price_max: food.priceMax ?? food.price ?? null,
      price_note: food.priceNote ?? null,
      price_source_url: food.priceSourceUrl ?? null,
      price_last_checked_at: food.priceLastCheckedAt ?? null,
      price_confidence_score: food.priceConfidenceScore ?? null,
      dining_type: food.diningType ?? null,
      dining_type_confidence_score: food.diningTypeConfidenceScore ?? null,
      dining_type_reason: food.diningTypeReason ?? null,
      description: food.description ?? null,
      official_url: food.officialUrl ?? null,
      source_url: food.sourceUrl,
      image_url: food.imageUrl ?? food.images.find((image) => image.enabled)?.imageUrl ?? null,
      start_date: food.startDate ?? null,
      end_date: food.endDate ?? null,
      status: food.status,
      is_limited: food.isLimited,
      confidence_score: food.confidenceScore,
      name_quality_score: food.nameQualityScore,
      display_quality: food.displayQuality,
      extraction_source_count: food.extractionSourceCount,
      review_status: food.reviewStatus,
      hidden: food.hidden,
      duplicate_group_id: food.duplicateGroupId ?? null,
      composite_menu: food.compositeMenu,
      canonical_food: food.canonicalFood ?? false,
      canonical_group_id: food.canonicalGroupId ?? null,
      flavor: food.flavor ?? null,
      event_name: food.eventName ?? null,
      collaboration_name: food.collaborationName ?? null,
      release_period: food.releasePeriod ?? null,
      seasonal_version: food.seasonalVersion ?? null,
      rarity: food.rarity ?? null,
      zukan_number: food.zukanNumber ?? null,
      trusted_placeholder: food.trustedPlaceholder ?? false,
      last_checked_at: new Date().toISOString()
    };

    const upsertPayload = existing.data?.manual_override ? { ...payload, id: existing.data.id } : payload;

    const { data: savedFood, error } = await supabase
      .from("foods")
      .upsert(upsertPayload, { onConflict: "shop_id,normalized_name" })
      .select("id")
      .single();

    if (error || !savedFood) {
      result.errors.push(`${food.name}: ${error?.message ?? "failed to save food"}`);
      continue;
    }

    if (existing.data) updatedCount += 1;
    else addedCount += 1;
    savedFoods += 1;

    for (const [index, image] of food.images.entries()) {
      await supabase.from("food_images").upsert(
        {
          food_id: savedFood.id,
          image_url: image.imageUrl,
          source_type: image.sourceType ?? "official",
          source_url: image.sourceUrl ?? food.sourceUrl,
          alt_text: image.altText ?? null,
          alt: image.altText ?? null,
          width: image.width ?? null,
          height: image.height ?? null,
          image_confidence_score: image.imageConfidenceScore ?? 0,
          image_match_score: image.imageMatchScore ?? 0,
          category_image_match_score: image.categoryImageMatchScore ?? 0,
          image_source_context: image.imageSourceContext ?? null,
          image_match_reason: image.imageMatchReason ?? null,
          image_mismatch_reason: image.imageMismatchReason ?? null,
          image_verified: image.imageVerified ?? false,
          is_shared_too_much: image.isSharedTooMuch ?? false,
          has_watermark: image.hasWatermark ?? false,
          watermark_reason: image.watermarkReason ?? null,
          image_candidate_score: image.imageCandidateScore ?? image.imageMatchScore ?? null,
          image_source_name: image.imageSourceName ?? null,
          official_confirmed: image.officialConfirmed ?? image.sourceType === "official",
          image_last_checked_at: image.imageLastCheckedAt ?? food.lastCheckedAt,
          priority: image.priority ?? index + 20,
          enabled: image.enabled
        },
        { onConflict: "food_id,image_url" }
      );
    }

    const locations = food.locations?.length
      ? food.locations
      : [
          {
            shopName: food.shop.name,
            areaName: food.area.name,
            shopType: food.shop.type,
            sourceUrl: food.sourceUrl,
            price: food.price,
            status: food.status,
            startDate: food.startDate,
            endDate: food.endDate,
            lastCheckedAt: food.lastCheckedAt
          }
        ];
    for (const location of locations) {
      await (supabase as any).from("food_locations").upsert(
        {
          food_id: savedFood.id,
          shop_id: location.shopId ?? null,
          shop_name: location.shopName,
          area_id: location.areaId ?? null,
          area_name: location.areaName,
          shop_type: location.shopType,
          source_url: location.sourceUrl ?? food.sourceUrl,
          price: location.price ?? null,
          status: location.status,
          start_date: location.startDate ?? null,
          end_date: location.endDate ?? null,
          last_checked_at: location.lastCheckedAt ?? food.lastCheckedAt
        },
        { onConflict: "food_id,shop_name,area_name,source_url,price" }
      );
    }
  }

  const inactiveCount = await markStaleFoods(supabase);

  await supabase.from("crawl_logs").insert({
    source_name: "combined",
    source_url: "https://www.usj.co.jp/",
    status: result.errors.length > 0 ? "failed" : "success",
    message: result.errors.slice(0, 20).join("\n") || null,
    added_count: addedCount,
    updated_count: updatedCount,
    inactive_count: inactiveCount,
    pages_crawled: result.pagesCrawled,
    foods_found: result.foodsFound
  });

  return { addedCount, updatedCount, inactiveCount, savedFoods, skipped: result.uniqueFoods - savedFoods };
}

async function upsertArea(supabase: ReturnType<typeof createClient<Database>>, name: string) {
  const { data, error } = await supabase.from("areas").upsert({ name, sort_order: 999 }, { onConflict: "name" }).select("id").single();
  if (error || !data) throw new Error(`Failed to upsert area ${name}: ${error?.message}`);
  return data.id;
}

async function upsertShop(supabase: ReturnType<typeof createClient<Database>>, food: Pick<GeneratedFood, "shop" | "officialUrl"> | CrawledFood, areaId: string) {
  const shopName = "shop" in food ? food.shop.name : food.shopName;
  const shopType = "shop" in food ? food.shop.type : food.shopType;
  const officialUrl = "shop" in food ? food.shop.officialUrl ?? food.officialUrl : food.officialUrl;
  const { data, error } = await supabase
    .from("shops")
    .upsert(
      {
        area_id: areaId,
        name: shopName,
        type: shopType,
        official_url: officialUrl ?? null,
        is_active: true
      },
      { onConflict: "area_id,name" }
    )
    .select("id")
    .single();
  if (error || !data) throw new Error(`Failed to upsert shop ${shopName}: ${error?.message}`);
  return data.id;
}

async function markStaleFoods(supabase: ReturnType<typeof createClient<Database>>) {
  const thresholdHours = Number(process.env.CRAWL_STALE_HOURS ?? 72);
  const threshold = new Date(Date.now() - thresholdHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("foods")
    .update({ status: "inactive" })
    .lt("last_checked_at", threshold)
    .eq("manual_override", false)
    .not("status", "in", "(ended,inactive)")
    .select("id");
  if (error) return 0;
  return data?.length ?? 0;
}

function toGeneratedFallback(food: CrawledFood): GeneratedFood {
  return {
    id: "",
    shopId: "",
    areaId: "",
    name: food.name,
    normalizedName: food.normalizedName,
    normalized_name: food.normalizedName,
    category: food.category,
    price: food.price,
    description: food.description,
    officialUrl: food.officialUrl,
    official_url: food.officialUrl,
    sourceUrl: food.sourceUrl,
    source_url: food.sourceUrl,
    startDate: food.startDate,
    start_date: food.startDate,
    endDate: food.endDate,
    end_date: food.endDate,
    status: food.status,
    isLimited: food.isLimited,
    is_limited: food.isLimited,
    confidenceScore: Math.round(food.confidence * 100),
    confidence_score: Math.round(food.confidence * 100),
    nameQualityScore: 0,
    name_quality_score: 0,
    displayQuality: food.confidence >= 0.8 ? "high" : "medium",
    display_quality: food.confidence >= 0.8 ? "high" : "medium",
    extractionSourceCount: 1,
    extraction_source_count: 1,
    reviewStatus: food.confidence >= 0.62 ? "approved" : "pending",
    review_status: food.confidence >= 0.62 ? "approved" : "pending",
    hidden: false,
    manualOverride: false,
    manual_override: false,
    compositeMenu: false,
    composite_menu: false,
    canonicalFood: false,
    canonical_food: false,
    trustedPlaceholder: false,
    trusted_placeholder: false,
    lastCheckedAt: new Date().toISOString(),
    last_checked_at: new Date().toISOString(),
    sourceNames: [],
    source_names: [],
    rejectionReasons: [],
    rejection_reasons: [],
    area: { id: "", name: food.areaName, sortOrder: 999 },
    shop: { id: "", areaId: "", name: food.shopName, type: food.shopType, officialUrl: food.officialUrl, isActive: true },
    images: food.images.map((image, index) => ({
      id: "",
      foodId: "",
      imageUrl: image.imageUrl,
      sourceType: image.sourceType ?? "official",
      sourceUrl: image.sourceUrl,
      altText: image.altText,
      width: image.width,
      height: image.height,
      imageConfidenceScore: image.imageConfidenceScore,
      isSharedTooMuch: image.isSharedTooMuch,
      priority: image.priority ?? index + 20,
      enabled: true
    }))
  };
}
