import { getSaleStatus } from "@/lib/food-utils";
import { listAreas } from "@/lib/repositories/areas";
import { listFoodCollections } from "@/lib/repositories/collections";
import { listFoods } from "@/lib/repositories/foods";

export type PublicCatalogFood = {
  id: string;
  name: string;
  englishName: string | null;
  category: string | null;
  price: number | null;
  priceText: string;
  imageUrl: string | null;
  areaId: string | null;
  areaName: string | null;
  shopId: string | null;
  shopName: string | null;
  shopType: string | null;
  saleStatus: string;
  isLimited: boolean;
  description: string | null;
  sourceUrl: string | null;
  collectionIds: string[];
  locations: Array<{
    shopId: string;
    shopName: string;
    areaId: string | null;
    areaName: string | null;
    type: string | null;
  }>;
};

export type PublicCatalogArea = {
  id: string;
  name: string;
  imageUrl: string | null;
  sortOrder: number;
};

export type PublicCatalogShop = {
  id: string;
  name: string;
  areaId: string | null;
  areaName: string | null;
  type: string | null;
  imageUrl: string | null;
};

export type PublicCatalogCollection = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  startsOn: string | null;
  endsOn: string | null;
  isFeatured: boolean;
  sortOrder: number;
};

export type PublicCatalogDashboard = {
  publicFoodCount: number;
  onSaleFoodCount: number;
  unpublishedFoodCount: number;
  areaCount: number;
  shopCount: number;
  activeSeasonalCollectionCount: number;
  updatedAt: string;
};

export type PublicCatalog = {
  generatedAt: string;
  foods: PublicCatalogFood[];
  areas: PublicCatalogArea[];
  shops: PublicCatalogShop[];
  collections: PublicCatalogCollection[];
  dashboard: PublicCatalogDashboard;
};

export async function buildPublicCatalog(unpublishedFoodCount = 0): Promise<PublicCatalog> {
  const [foods, areas, collections] = await Promise.all([listFoods(), listAreas(), listFoodCollections()]);
  const shopMap = new Map<string, PublicCatalogShop>();

  const nativeFoods = foods.map((food) => {
    const image = food.images.find((candidate) => candidate.enabled)?.imageUrl ?? food.imageUrl ?? null;
    const locations = (food.locations ?? []).map((location) => {
      const id = location.shopId ?? [location.shopName, location.areaId ?? food.areaId ?? "area"].join("-");
      if (!shopMap.has(id)) {
        shopMap.set(id, {
          id,
          name: location.shopName,
          areaId: location.areaId ?? food.areaId ?? null,
          areaName: location.areaName ?? food.area?.name ?? null,
          type: location.shopType ?? food.shop?.type ?? null,
          imageUrl: null
        });
      }
      return {
        shopId: id,
        shopName: location.shopName,
        areaId: location.areaId ?? food.areaId ?? null,
        areaName: location.areaName ?? food.area?.name ?? null,
        type: location.shopType ?? food.shop?.type ?? null
      };
    });

    if (food.shop?.name) {
      const id = food.shop.id ?? [food.shop.name, food.areaId ?? "area"].join("-");
      if (!shopMap.has(id)) {
        shopMap.set(id, {
          id,
          name: food.shop.name,
          areaId: food.areaId ?? null,
          areaName: food.area?.name ?? null,
          type: food.shop.type ?? null,
          imageUrl: null
        });
      }
    }

    return {
      id: food.id,
      name: food.name,
      englishName: (food as { englishName?: string | null }).englishName ?? null,
      category: food.category ?? null,
      price: food.price ?? null,
      priceText: food.price == null ? "価格未確認" : "¥" + food.price.toLocaleString("ja-JP"),
      imageUrl: image,
      areaId: food.areaId ?? null,
      areaName: food.area?.name ?? null,
      shopId: food.shop?.id ?? null,
      shopName: food.shop?.name ?? null,
      shopType: food.shop?.type ?? null,
      saleStatus: food.status ?? "active",
      isLimited: Boolean(food.isLimited),
      description: food.description ?? null,
      sourceUrl: food.sourceUrl ?? null,
      collectionIds: food.collectionIds ?? [],
      locations
    };
  });

  const nativeAreas = areas.map((area) => ({
    id: area.id,
    name: area.name,
    imageUrl: (area as { imageUrl?: string | null }).imageUrl ?? null,
    sortOrder: area.sortOrder ?? 1000
  }));

  const nativeCollections = collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    description: collection.description ?? null,
    imageUrl: collection.imageUrl ?? null,
    startsOn: collection.startsOn ?? null,
    endsOn: collection.endsOn ?? null,
    isFeatured: Boolean(collection.isFeatured),
    sortOrder: collection.sortOrder ?? 1000
  }));

  const generatedAt = new Date().toISOString();
  return {
    generatedAt,
    foods: nativeFoods,
    areas: nativeAreas,
    shops: Array.from(shopMap.values()).sort((a, b) => a.name.localeCompare(b.name, "ja")),
    collections: nativeCollections,
    dashboard: {
      publicFoodCount: nativeFoods.length,
      onSaleFoodCount: foods.filter((food) => getSaleStatus(food) === "active").length,
      unpublishedFoodCount,
      areaCount: nativeAreas.length,
      shopCount: shopMap.size,
      activeSeasonalCollectionCount: countActiveHomeCollections(nativeCollections, nativeFoods),
      updatedAt: generatedAt
    }
  };
}

export function countActiveHomeCollections(collections: PublicCatalogCollection[], foods: PublicCatalogFood[], now = new Date()) {
  const today = toDateKey(now);
  return collections.filter((collection) => {
    if (!collection.isFeatured) return false;
    if (!collection.imageUrl) return false;
    if (collection.startsOn && collection.startsOn > today) return false;
    if (collection.endsOn && collection.endsOn < today) return false;
    return foods.some((food) => food.collectionIds.includes(collection.id));
  }).length;
}

function toDateKey(date: Date) {
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}
