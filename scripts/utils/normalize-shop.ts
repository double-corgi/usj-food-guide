import type { ShopType } from "../../types/domain";

export const knownAreas = [
  "スーパー・ニンテンドー・ワールド",
  "ウィザーディング・ワールド・オブ・ハリー・ポッター",
  "ミニオン・パーク",
  "ユニバーサル・ワンダーランド",
  "ハリウッド・エリア",
  "ニューヨーク・エリア",
  "サンフランシスコ・エリア",
  "ジュラシック・パーク",
  "アミティ・ビレッジ"
];

export const knownRestaurantAreas: Record<string, string> = {
  "キノピオ・カフェ": "スーパー・ニンテンドー・ワールド",
  "ピットストップ・ポップコーン": "スーパー・ニンテンドー・ワールド",
  "ヨッシー・スナック・アイランド": "スーパー・ニンテンドー・ワールド",
  "ドンキーコングカート": "スーパー・ニンテンドー・ワールド",
  "三本の箒": "ウィザーディング・ワールド・オブ・ハリー・ポッター",
  "ホッグズ・ヘッド・パブ": "ウィザーディング・ワールド・オブ・ハリー・ポッター",
  "デリシャス・ミー！ザ・クッキー・キッチン": "ミニオン・パーク",
  "イーブル・イーツ": "ミニオン・パーク",
  "スヌーピー・バックロット・カフェ": "ユニバーサル・ワンダーランド",
  "ハローキティのコーナーカフェ": "ユニバーサル・ワンダーランド",
  "ビバリーヒルズ・ブランジェリー": "ハリウッド・エリア",
  "メルズ・ドライブイン": "ハリウッド・エリア",
  "スタジオ・スターズ・レストラン": "ハリウッド・エリア",
  "マリオ・カフェ&ストア": "ハリウッド・エリア",
  "ルイズN.Y.ピザパーラー": "ニューヨーク・エリア",
  SAIDO: "ニューヨーク・エリア",
  "パークサイド・グリル": "ニューヨーク・エリア",
  "ハピネス・カフェ": "サンフランシスコ・エリア",
  "ワーフカフェ": "サンフランシスコ・エリア",
  "ザ・ドラゴンズ・パール": "サンフランシスコ・エリア",
  "ロンバーズ・ランディング": "サンフランシスコ・エリア",
  "フォッシル・フュエルズ": "ジュラシック・パーク",
  "ロストワールド・レストラン": "ジュラシック・パーク",
  "ディスカバリー・レストラン": "ジュラシック・パーク",
  "アミティ・ランディング・レストラン": "アミティ・ビレッジ",
  "ボードウォーク・スナック": "アミティ・ビレッジ",
  "アミティ・アイスクリーム": "アミティ・ビレッジ"
};

export function normalizeShopName(name?: string) {
  return (name || "店舗未確認")
    .normalize("NFKC")
    .replace(/^\s*(?:Global alt|SEOKeywords|Keywords|Url Title|Site Title|画像|写真)\s*[:：-]?\s*/i, "")
    .replace(/[™®©]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function inferArea(shopName?: string, text = "") {
  const shop = normalizeShopName(shopName);
  const matchedKnown = Object.entries(knownRestaurantAreas).find(([name]) => shop.includes(name) || name.includes(shop));
  if (matchedKnown) return matchedKnown[1];
  const matchedArea = knownAreas.find((area) => text.includes(area));
  return matchedArea ?? "エリア未確認";
}

export function inferShopType(shopName = "", text = ""): ShopType {
  const value = `${shopName} ${text}`;
  if (/カート|cart/i.test(value)) return "cart";
  if (/ワゴン|wagon/i.test(value)) return "wagon";
  if (/レストラン|カフェ|グリル|パーラー|キッチン|パブ|restaurant|cafe|grill/i.test(value)) return "restaurant";
  return "unknown";
}
