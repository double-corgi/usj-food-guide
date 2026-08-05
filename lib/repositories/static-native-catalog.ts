import type { Area, FoodCategory, FoodCollection, FoodStatus, FoodWithRelations, SaleStatus, SeasonType, ShopType } from "@/types/domain";

type StaticNativeCatalog = {
  foods?: StaticFood[];
  areas?: StaticArea[];
  collections?: StaticCollection[];
};

type StaticFood = {
  id: string;
  name: string;
  englishName?: string | null;
  category?: string | null;
  price?: number | null;
  imageUrl?: string | null;
  areaId?: string | null;
  areaName?: string | null;
  shopId?: string | null;
  shopName?: string | null;
  shopType?: string | null;
  saleStatus?: string | null;
  isLimited?: boolean | null;
  description?: string | null;
  sourceUrl?: string | null;
  collectionIds?: string[];
  locations?: StaticLocation[];
};

type StaticLocation = {
  shopId?: string | null;
  shopName?: string | null;
  areaId?: string | null;
  areaName?: string | null;
  type?: string | null;
  shopType?: string | null;
};

type StaticArea = { id: string; name: string; sortOrder?: number | null; imageUrl?: string | null };
type StaticCollection = { id: string; name: string; description?: string | null; imageUrl?: string | null; startsOn?: string | null; endsOn?: string | null; isFeatured?: boolean | null; sortOrder?: number | null };

let cachedCatalog: StaticNativeCatalog | null | undefined;

export function readStaticNativeCatalog(): StaticNativeCatalog | null {
  if (process.env.CAPACITOR_STATIC_EXPORT !== "1") return null;
  if (cachedCatalog !== undefined) return cachedCatalog;
  const filePath = process.env.UNICOLLE_STATIC_NATIVE_CATALOG_PATH;
  if (!filePath) {
    cachedCatalog = null;
    return cachedCatalog;
  }
  try {
    const fs = require("node:fs") as typeof import("node:fs");
    cachedCatalog = JSON.parse(fs.readFileSync(filePath, "utf8")) as StaticNativeCatalog;
  } catch {
    cachedCatalog = null;
  }
  return cachedCatalog;
}

export function listStaticNativeFoods(): FoodWithRelations[] | null {
  const catalog = readStaticNativeCatalog();
  if (!catalog?.foods?.length) return null;
  return catalog.foods.map(mapStaticFood);
}

export function listStaticNativeAreas(): Area[] | null {
  const catalog = readStaticNativeCatalog();
  if (!catalog?.areas?.length) return null;
  return catalog.areas.map((area) => ({ id: area.id, name: area.name, sortOrder: Number(area.sortOrder ?? 1000) })).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"));
}

export function listStaticNativeCollections(): FoodCollection[] | null {
  const catalog = readStaticNativeCatalog();
  if (!catalog?.collections?.length) return null;
  const now = new Date().toISOString();
  return catalog.collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    description: collection.description ?? null,
    imageUrl: collection.imageUrl ?? null,
    seasonType: "event" as SeasonType,
    startsOn: collection.startsOn ?? null,
    endsOn: collection.endsOn ?? null,
    accentColor: null,
    isFeatured: collection.isFeatured === true,
    sortOrder: Number(collection.sortOrder ?? 1000),
    createdAt: now,
    updatedAt: now
  })).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"));
}

function mapStaticFood(food: StaticFood): FoodWithRelations {
  const areaId = food.areaId ?? "area-unknown";
  const areaName = food.areaName ?? "エリア確認中";
  const shopId = food.shopId ?? food.locations?.[0]?.shopId ?? "shop-unknown";
  const shopName = food.shopName ?? food.locations?.[0]?.shopName ?? "店舗未確認";
  const shopType = normalizeShopType(food.shopType ?? food.locations?.[0]?.type ?? food.locations?.[0]?.shopType);
  const status = normalizeFoodStatus(food.saleStatus);
  const saleStatus: SaleStatus = status === "scheduled" ? "upcoming" : status === "inactive" ? "paused" : status === "ended" ? "ended" : status === "active" ? "active" : "unknown";
  const sourceUrl = food.sourceUrl ?? "https://unicolle.vercel.app";
  const updatedAt = new Date().toISOString();
  const locations = (food.locations?.length ? food.locations : [{ shopId, shopName, areaId, areaName, type: shopType }]).map((location, index) => ({
    id: `${food.id}-static-location-${index}`,
    foodId: food.id,
    shopId: location.shopId ?? shopId,
    shopName: location.shopName ?? shopName,
    areaId: location.areaId ?? areaId,
    areaName: location.areaName ?? areaName,
    shopType: normalizeShopType(location.type ?? location.shopType ?? shopType),
    sourceUrl,
    price: food.price ?? undefined,
    status,
    lastCheckedAt: updatedAt
  }));
  const images = food.imageUrl ? [{
    id: `${food.id}-static-image-main`,
    foodId: food.id,
    imageUrl: food.imageUrl,
    sourceType: "official" as const,
    sourceUrl,
    priority: 10,
    altText: food.name,
    alt: food.name,
    imageConfidenceScore: 100,
    imageMatchScore: 100,
    categoryImageMatchScore: 100,
    imageVerified: true,
    isSharedTooMuch: false,
    enabled: true
  }] : [];
  return {
    id: food.id,
    shopId,
    areaId,
    name: food.name,
    normalizedName: food.name.normalize("NFKC").toLowerCase(),
    category: normalizeCategory(food.category),
    price: food.price ?? undefined,
    description: food.description ?? undefined,
    sourceUrl,
    imageUrl: food.imageUrl ?? undefined,
    saleStatus,
    status,
    isLimited: food.isLimited === true,
    confidenceScore: 100,
    nameQualityScore: 100,
    displayQuality: "medium",
    extractionSourceCount: 1,
    reviewStatus: "approved",
    hidden: false,
    collectionId: food.collectionIds?.[0] ?? null,
    collectionIds: food.collectionIds ?? [],
    variants: [],
    manualOverride: food.id.startsWith("food-manual-"),
    compositeMenu: false,
    canonicalFood: true,
    trustedPlaceholder: false,
    createdAt: updatedAt,
    updatedAt,
    deletedAt: null,
    lastCheckedAt: updatedAt,
    sourceNames: ["static-native-catalog"],
    rejectionReasons: [],
    area: { id: areaId, name: areaName, sortOrder: 1000 },
    shop: { id: shopId, areaId, name: shopName, type: shopType, isActive: true },
    images,
    locations
  };
}

function normalizeCategory(value?: string | null): FoodCategory {
  const allowed = new Set(["churro", "popcorn", "drink", "dessert", "burger", "pizza", "chicken", "rice", "noodle", "snack", "kids", "seasonal", "set", "unknown"]);
  return allowed.has(String(value)) ? (value as FoodCategory) : "unknown";
}

function normalizeFoodStatus(value?: string | null): FoodStatus {
  if (value === "active") return "active";
  if (value === "scheduled" || value === "upcoming") return "scheduled";
  if (value === "ended") return "ended";
  if (value === "paused" || value === "inactive") return "inactive";
  return "unknown";
}

function normalizeShopType(value?: string | null): ShopType {
  if (value === "restaurant" || value === "cart" || value === "wagon") return value;
  return "unknown";
}
