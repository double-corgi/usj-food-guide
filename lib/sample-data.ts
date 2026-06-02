import { normalizeFoodName } from "@/lib/food-utils";
import type { Area, Food, FoodImage, FoodWithRelations, Shop } from "@/types/domain";

export const areas: Area[] = [
  { id: "hollywood", name: "ハリウッド・エリア", sortOrder: 1 },
  { id: "new-york", name: "ニューヨーク・エリア", sortOrder: 2 },
  { id: "jurassic", name: "ジュラシック・パーク", sortOrder: 3 },
  { id: "minion", name: "ミニオン・パーク", sortOrder: 4 },
  { id: "wizarding", name: "ウィザーディング・ワールド", sortOrder: 5 }
];

export const shops: Shop[] = [
  {
    id: "studio-stars",
    areaId: "hollywood",
    name: "スタジオ・スターズ・レストラン",
    type: "restaurant",
    officialUrl: "https://www.usj.co.jp/",
    isActive: true
  },
  {
    id: "ny-cart",
    areaId: "new-york",
    name: "ニューヨーク・フードカート",
    type: "cart",
    officialUrl: "https://www.usj.co.jp/",
    isActive: true
  },
  {
    id: "jurassic-wagon",
    areaId: "jurassic",
    name: "ジュラシック・スナックワゴン",
    type: "wagon",
    officialUrl: "https://www.usj.co.jp/",
    isActive: true
  },
  {
    id: "minion-snack",
    areaId: "minion",
    name: "ミニオン・ハッピー・キッチン",
    type: "cart",
    officialUrl: "https://www.usj.co.jp/",
    isActive: true
  },
  {
    id: "three-broomsticks",
    areaId: "wizarding",
    name: "三本の箒",
    type: "restaurant",
    officialUrl: "https://www.usj.co.jp/",
    isActive: true
  }
];

const checkedAt = "2026-05-26T00:00:00.000Z";

export const foods: Food[] = [
  {
    id: "burger-set",
    shopId: "studio-stars",
    areaId: "hollywood",
    name: "スターズ・バーガーセット",
    normalizedName: normalizeFoodName("スターズ・バーガーセット"),
    category: "set",
    price: 1850,
    description: "パーク散策前の腹ごしらえ向けのサンプルセットメニューです。",
    officialUrl: "https://www.usj.co.jp/",
    sourceUrl: "https://www.usj.co.jp/",
    status: "active",
    isLimited: false,
    confidenceScore: 100,
    nameQualityScore: 100,
    displayQuality: "high",
    extractionSourceCount: 1,
    reviewStatus: "approved",
    hidden: false,
    manualOverride: false,
    compositeMenu: false,
    lastCheckedAt: checkedAt
  },
  {
    id: "berry-churros",
    shopId: "ny-cart",
    areaId: "new-york",
    name: "ベリークリーム・チュリトス",
    normalizedName: normalizeFoodName("ベリークリーム・チュリトス"),
    category: "churro",
    price: 700,
    description: "片手で食べやすい甘酸っぱいチュリトスのサンプルです。",
    officialUrl: "https://www.usj.co.jp/",
    sourceUrl: "https://www.usj.co.jp/",
    startDate: "2026-05-01",
    endDate: "2026-08-31",
    status: "active",
    isLimited: true,
    confidenceScore: 100,
    nameQualityScore: 100,
    displayQuality: "high",
    extractionSourceCount: 1,
    reviewStatus: "approved",
    hidden: false,
    manualOverride: false,
    compositeMenu: false,
    lastCheckedAt: checkedAt
  },
  {
    id: "dino-meat",
    shopId: "jurassic-wagon",
    areaId: "jurassic",
    name: "ダイナソー・ターキーレッグ",
    normalizedName: normalizeFoodName("ダイナソー・ターキーレッグ"),
    category: "chicken",
    price: 1250,
    description: "食べ歩きしやすい骨付き肉のサンプルメニューです。",
    officialUrl: "https://www.usj.co.jp/",
    sourceUrl: "https://www.usj.co.jp/",
    status: "active",
    isLimited: false,
    confidenceScore: 100,
    nameQualityScore: 100,
    displayQuality: "high",
    extractionSourceCount: 1,
    reviewStatus: "approved",
    hidden: false,
    manualOverride: false,
    compositeMenu: false,
    lastCheckedAt: checkedAt
  },
  {
    id: "minion-popcorn",
    shopId: "minion-snack",
    areaId: "minion",
    name: "バナナキャラメル・ポップコーン",
    normalizedName: normalizeFoodName("バナナキャラメル・ポップコーン"),
    category: "popcorn",
    price: 600,
    description: "甘い香りのポップコーンを想定したサンプルです。",
    officialUrl: "https://www.usj.co.jp/",
    sourceUrl: "https://www.usj.co.jp/",
    status: "active",
    isLimited: false,
    confidenceScore: 100,
    nameQualityScore: 100,
    displayQuality: "high",
    extractionSourceCount: 1,
    reviewStatus: "approved",
    hidden: false,
    manualOverride: false,
    compositeMenu: false,
    lastCheckedAt: checkedAt
  },
  {
    id: "butter-drink",
    shopId: "three-broomsticks",
    areaId: "wizarding",
    name: "魔法界のクリーミードリンク",
    normalizedName: normalizeFoodName("魔法界のクリーミードリンク"),
    category: "drink",
    price: 850,
    description: "泡の口当たりが楽しいドリンクのサンプルです。公式名称ではありません。",
    officialUrl: "https://www.usj.co.jp/",
    sourceUrl: "https://www.usj.co.jp/",
    status: "active",
    isLimited: false,
    confidenceScore: 100,
    nameQualityScore: 100,
    displayQuality: "high",
    extractionSourceCount: 1,
    reviewStatus: "approved",
    hidden: false,
    manualOverride: false,
    compositeMenu: false,
    lastCheckedAt: checkedAt
  },
  {
    id: "summer-parfait",
    shopId: "studio-stars",
    areaId: "hollywood",
    name: "サマー・トロピカルパフェ",
    normalizedName: normalizeFoodName("サマー・トロピカルパフェ"),
    category: "seasonal",
    price: 980,
    description: "近日登場メニューの表示確認用サンプルです。",
    officialUrl: "https://www.usj.co.jp/",
    sourceUrl: "https://www.usj.co.jp/",
    startDate: "2026-07-01",
    endDate: "2026-09-15",
    status: "scheduled",
    isLimited: true,
    confidenceScore: 100,
    nameQualityScore: 100,
    displayQuality: "high",
    extractionSourceCount: 1,
    reviewStatus: "approved",
    hidden: false,
    manualOverride: false,
    compositeMenu: false,
    lastCheckedAt: checkedAt
  },
  {
    id: "winter-cocoa",
    shopId: "three-broomsticks",
    areaId: "wizarding",
    name: "ウィンター・ココア",
    normalizedName: normalizeFoodName("ウィンター・ココア"),
    category: "dessert",
    price: 780,
    description: "終了メニューの表示確認用サンプルです。",
    officialUrl: "https://www.usj.co.jp/",
    sourceUrl: "https://www.usj.co.jp/",
    startDate: "2025-11-01",
    endDate: "2026-02-28",
    status: "ended",
    isLimited: true,
    confidenceScore: 100,
    nameQualityScore: 100,
    displayQuality: "high",
    extractionSourceCount: 1,
    reviewStatus: "approved",
    hidden: false,
    manualOverride: false,
    compositeMenu: false,
    lastCheckedAt: checkedAt
  }
];

export const foodImages: FoodImage[] = [
  {
    id: "img-burger-set",
    foodId: "burger-set",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
    sourceType: "placeholder",
    sourceUrl: "https://unsplash.com/",
    enabled: true
  },
  {
    id: "img-berry-churros",
    foodId: "berry-churros",
    imageUrl: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=1200&q=80",
    sourceType: "placeholder",
    sourceUrl: "https://unsplash.com/",
    enabled: true
  },
  {
    id: "img-dino-meat",
    foodId: "dino-meat",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
    sourceType: "placeholder",
    sourceUrl: "https://unsplash.com/",
    enabled: true
  },
  {
    id: "img-minion-popcorn",
    foodId: "minion-popcorn",
    imageUrl: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=1200&q=80",
    sourceType: "placeholder",
    sourceUrl: "https://unsplash.com/",
    enabled: true
  },
  {
    id: "img-butter-drink",
    foodId: "butter-drink",
    imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80",
    sourceType: "placeholder",
    sourceUrl: "https://unsplash.com/",
    enabled: true
  },
  {
    id: "img-summer-parfait",
    foodId: "summer-parfait",
    imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80",
    sourceType: "placeholder",
    sourceUrl: "https://unsplash.com/",
    enabled: true
  },
  {
    id: "img-winter-cocoa",
    foodId: "winter-cocoa",
    imageUrl: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=1200&q=80",
    sourceType: "placeholder",
    sourceUrl: "https://unsplash.com/",
    enabled: true
  }
];

export const foodsWithRelations: FoodWithRelations[] = foods.map((food) => {
  const area = areas.find((item) => item.id === food.areaId);
  const shop = shops.find((item) => item.id === food.shopId);
  if (!area || !shop) {
    throw new Error(`Missing relation for food: ${food.id}`);
  }
  return {
    ...food,
    area,
    shop,
    images: foodImages.filter((image) => image.foodId === food.id)
  };
});
