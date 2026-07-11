import { categoryLabels } from "@/lib/constants";
import { getDefaultFoodVariant } from "@/lib/food-variants";
import type { FoodCategory, FoodCollection, FoodWithRelations } from "@/types/domain";

export const adminAreaOptions = [
  "スーパー・ニンテンドー・ワールド",
  "ウィザーディング・ワールド・オブ・ハリー・ポッター",
  "ミニオン・パーク",
  "ジュラシック・パーク",
  "ハリウッド・エリア",
  "ニューヨーク・エリア",
  "サンフランシスコ・エリア",
  "アミティ・ビレッジ",
  "ユニバーサル・ワンダーランド",
  "パーク全体",
  "不明"
] as const;

export const adminSaleStatusOptions = [
  { value: "active", label: "販売中" },
  { value: "paused", label: "一時停止" },
  { value: "ended", label: "販売終了" },
  { value: "unknown", label: "不明" }
] as const;

export const adminPublicStateOptions = [
  { value: "draft", label: "下書き" },
  { value: "published", label: "公開" }
] as const;

export const adminReviewStatusOptions = [
  { value: "draft", label: "下書き" },
  { value: "pending", label: "確認中" },
  { value: "approved", label: "承認済み" },
  { value: "rejected", label: "差し戻し" }
] as const;

export const adminFoodCategoryOptions = [
  { value: "churro", label: "🌯 チュリトス" },
  { value: "popcorn", label: "🍿 ポップコーン" },
  { value: "drink", label: "🥤 ドリンク" },
  { value: "pizza", label: "🍕 ピザ" },
  { value: "burger", label: "🍔 バーガー" },
  { value: "noodle", label: "🍜 麺・パスタ" },
  { value: "set", label: "🍱 セットメニュー" },
  { value: "rice", label: "🍛 ライス・カレー" },
  { value: "kids", label: "👦 キッズ" },
  { value: "dessert", label: "🍰 スイーツ" }
] as const satisfies ReadonlyArray<{ value: FoodCategory; label: string }>;

export const adminCategoryTagOptions = adminFoodCategoryOptions;

export const adminLegacyCategoryTagOptions = [
  { value: "chicken", label: "チキン・肉系" },
  { value: "snack", label: "スナック" },
  { value: "seasonal", label: "季節限定" },
  { value: "unknown", label: "カテゴリ確認中" },
  { value: "walk-around", label: "食べ歩き" },
  { value: "cart", label: "フードカート" },
  { value: "nintendo", label: "ニンテンドー" },
  { value: "harry-potter", label: "ハリーポッター" },
  { value: "minion", label: "ミニオン" },
  { value: "jurassic", label: "ジュラシック" },
  { value: "sanrio", label: "サンリオ" }
] as const;

export type AdminSaleStatusValue = (typeof adminSaleStatusOptions)[number]["value"] | "upcoming";
export type AdminPublicStateValue = (typeof adminPublicStateOptions)[number]["value"];

export function getAdminSaleState(food: FoodWithRelations): AdminSaleStatusValue {
  if (food.saleStatus === "active" || food.saleStatus === "paused" || food.saleStatus === "ended" || food.saleStatus === "unknown" || food.saleStatus === "upcoming") {
    return food.saleStatus;
  }
  if (food.status === "active") return "active";
  if (food.status === "ended") return "ended";
  if (food.status === "inactive") return "paused";
  return "unknown";
}

export function getAdminPublicState(food: FoodWithRelations): AdminPublicStateValue {
  return food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden ? "published" : "draft";
}

export function formatAdminSaleStatus(value: string) {
  if (value === "active") return "販売中";
  if (value === "paused") return "一時停止";
  if (value === "ended") return "販売終了";
  if (value === "upcoming") return "販売前";
  return "不明";
}

export function formatAdminPublicState(value: string) {
  if (value === "published") return "公開中";
  if (value === "draft") return "下書き";
  return value;
}

export function formatAdminVisibility(hidden: boolean) {
  return hidden ? "非表示" : "表示中";
}

export function formatAdminReviewStatus(value: string) {
  if (value === "draft") return "下書き";
  if (value === "approved") return "公開中";
  if (value === "pending") return "下書き確認中";
  if (value === "rejected") return "差し戻し";
  return value;
}

export function formatAdminCanonicalState(canonicalFood?: boolean) {
  return canonicalFood === false ? "重複候補" : "正規データ";
}

export function formatAdminCategory(category: string) {
  return (
    adminCategoryTagOptions.find((option) => option.value === category)?.label ??
    adminLegacyCategoryTagOptions.find((option) => option.value === category)?.label ??
    categoryLabels[category as FoodCategory] ??
    category
  );
}

export function formatAdminPrice(food: FoodWithRelations) {
  if (typeof food.price === "number") return `¥${food.price.toLocaleString("ja-JP")}`;
  if (typeof food.priceMin === "number" && typeof food.priceMax === "number") return `¥${food.priceMin.toLocaleString("ja-JP")}〜¥${food.priceMax.toLocaleString("ja-JP")}`;
  if (typeof food.priceMin === "number") return `¥${food.priceMin.toLocaleString("ja-JP")}〜`;
  return "未確認";
}

export function formatAdminCollection(food: Pick<FoodWithRelations, "collectionId" | "collectionIds">, collections: FoodCollection[] = []) {
  const collectionIds = food.collectionIds && food.collectionIds.length > 0 ? food.collectionIds : food.collectionId ? [food.collectionId] : [];
  if (collectionIds.length === 0) return "未設定";
  return collectionIds.map((collectionId) => collections.find((collection) => collection.id === collectionId)?.name ?? collectionId).join("、");
}

export function formatAdminDateTime(value?: string | null) {
  if (!value) return "未設定";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function getAdminFoodInfoIssues(food: FoodWithRelations) {
  const issues: Array<{ id: string; label: string }> = [];
  const hasEnabledImage = food.images.some((image) => image.enabled && Boolean(image.imageUrl));
  if (!hasEnabledImage) issues.push({ id: "image", label: "画像未確認" });

  const defaultVariant = getDefaultFoodVariant(food);
  const hasPrice = typeof defaultVariant?.price === "number" || typeof food.price === "number";
  if (!hasPrice) issues.push({ id: "price", label: "価格未確認" });

  if (food.shop.name.includes("未確認") || food.shop.name === "不明") issues.push({ id: "shop", label: "店舗未確認" });
  if (food.area.name.includes("未確認") || food.area.name === "不明") issues.push({ id: "area", label: "エリア未確認" });
  if (!food.sourceUrl || food.sourceUrl === "manual-admin") issues.push({ id: "source-url", label: "公式URL未登録" });
  if (food.canonicalFood === false || Boolean(food.duplicateGroupId)) issues.push({ id: "duplicate", label: "重複候補" });
  if (isOlderThanDays(food.lastCheckedAt, 30)) issues.push({ id: "stale", label: "30日以上未確認" });
  return issues;
}

function isOlderThanDays(value: string | undefined, days: number) {
  if (!value) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  return Date.now() - date.getTime() > days * 24 * 60 * 60 * 1000;
}
