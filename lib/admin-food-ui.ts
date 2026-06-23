import { categoryLabels } from "@/lib/constants";
import type { FoodCategory, FoodWithRelations } from "@/types/domain";

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

export const adminFoodCategoryOptions = [
  { value: "churro", label: "🍩 チュリトス" },
  { value: "popcorn", label: "🍿 ポップコーン" },
  { value: "drink", label: "🥤 ドリンク" },
  { value: "dessert", label: "🍰 スイーツ" },
  { value: "burger", label: "🍔 バーガー" },
  { value: "pizza", label: "🍕 ピザ" },
  { value: "chicken", label: "🍗 チキン・肉系" },
  { value: "rice", label: "🍛 ライス・カレー" },
  { value: "noodle", label: "🍜 麺・パスタ" },
  { value: "snack", label: "🍟 スナック" },
  { value: "kids", label: "👶 キッズ" },
  { value: "seasonal", label: "🌸 季節限定" },
  { value: "set", label: "🍱 セットメニュー" },
  { value: "unknown", label: "🔎 カテゴリ確認中" }
] as const satisfies ReadonlyArray<{ value: FoodCategory; label: string }>;

export const adminCategoryTagOptions = [
  ...adminFoodCategoryOptions,
  { value: "walk-around", label: "🚶 食べ歩き" },
  { value: "cart", label: "🛒 フードカート" },
  { value: "nintendo", label: "🎮 ニンテンドー" },
  { value: "harry-potter", label: "🧙 ハリーポッター" },
  { value: "minion", label: "💛 ミニオン" },
  { value: "jurassic", label: "🦖 ジュラシック" },
  { value: "sanrio", label: "🎀 サンリオ" }
] as const;

export type AdminSaleStatusValue = (typeof adminSaleStatusOptions)[number]["value"] | "upcoming";
export type AdminPublicStateValue = (typeof adminPublicStateOptions)[number]["value"];

export function getAdminSaleState(food: FoodWithRelations): AdminSaleStatusValue {
  if (food.saleStatus === "active" || food.saleStatus === "ended" || food.saleStatus === "unknown" || food.saleStatus === "upcoming") {
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
  if (value === "published") return "公開";
  if (value === "draft") return "下書き";
  return value;
}

export function formatAdminVisibility(hidden: boolean) {
  return hidden ? "非表示" : "表示中";
}

export function formatAdminReviewStatus(value: string) {
  if (value === "approved") return "承認済み";
  if (value === "pending") return "確認中";
  if (value === "rejected") return "差し戻し";
  return value;
}

export function formatAdminCanonicalState(canonicalFood?: boolean) {
  return canonicalFood === false ? "重複候補" : "正規データ";
}

export function formatAdminCategory(category: string) {
  return adminCategoryTagOptions.find((option) => option.value === category)?.label ?? categoryLabels[category as FoodCategory] ?? category;
}

export function formatAdminPrice(food: FoodWithRelations) {
  if (typeof food.price === "number") return `¥${food.price.toLocaleString("ja-JP")}`;
  if (typeof food.priceMin === "number" && typeof food.priceMax === "number") return `¥${food.priceMin.toLocaleString("ja-JP")}〜¥${food.priceMax.toLocaleString("ja-JP")}`;
  if (typeof food.priceMin === "number") return `¥${food.priceMin.toLocaleString("ja-JP")}〜`;
  return "未確認";
}
