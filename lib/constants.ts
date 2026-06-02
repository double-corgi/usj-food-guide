import type { DiningType, FoodCategory, FoodStatus, ShopType } from "@/types/domain";

export const unofficialNotice =
  "このアプリはUSJ公式アプリではありません。公開情報をもとにした非公式ファン向けフード記録アプリです。最新情報は必ず公式サイトをご確認ください。";

export const categoryLabels: Record<FoodCategory, string> = {
  churro: "チュリトス",
  popcorn: "ポップコーン",
  drink: "ドリンク",
  dessert: "スイーツ",
  burger: "バーガー",
  pizza: "ピザ",
  chicken: "チキン・肉系",
  rice: "ライス・カレー",
  noodle: "麺・パスタ",
  snack: "スナック",
  kids: "キッズ",
  seasonal: "季節限定",
  set: "セットメニュー",
  unknown: "その他"
};

export const shopTypeLabels: Record<ShopType, string> = {
  restaurant: "レストラン",
  cart: "フードカート",
  wagon: "ワゴン",
  unknown: "未分類"
};

export const diningTypeLabels: Record<DiningType, string> = {
  takeout: "テイクアウト",
  eat_in: "店内飲食",
  both: "店内・持ち歩き",
  food_cart: "カート販売",
  unknown: "不明"
};

export const statusLabels: Record<FoodStatus, string> = {
  active: "公開情報確認中",
  scheduled: "復刻待ち",
  ended: "終了",
  inactive: "非表示",
  unknown: "公式情報要確認"
};

export const statusTone: Record<FoodStatus, string> = {
  active: "bg-slate-100 text-slate-700",
  scheduled: "bg-sun text-ink",
  ended: "bg-slate-700 text-white",
  inactive: "bg-slate-200 text-slate-700",
  unknown: "bg-slate-100 text-slate-700"
};
