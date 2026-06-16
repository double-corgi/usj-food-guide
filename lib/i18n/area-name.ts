import type { TranslationKey } from "@/lib/i18n/dictionaries";

const areaNameKeyMap: Record<string, TranslationKey> = {
  "スーパー・ニンテンドー・ワールド": "area.name.super-nintendo-world",
  "ウィザーディング・ワールド・オブ・ハリー・ポッター": "area.name.wizarding-world",
  "ミニオン・パーク": "area.name.minion-park",
  "ユニバーサル・ワンダーランド": "area.name.universal-wonderland",
  "ハリウッド・エリア": "area.name.hollywood",
  "ニューヨーク・エリア": "area.name.new-york",
  "サンフランシスコ・エリア": "area.name.san-francisco",
  "ジュラシック・パーク": "area.name.jurassic-park",
  "アミティ・ビレッジ": "area.name.amity-village",
  "ウォーターワールド": "area.name.waterworld"
};

function normalizeAreaName(name: string): string {
  return (name ?? "")
    .replace(/[™®]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function tAreaName(name: string, t: (key: TranslationKey) => string): string {
  const key = areaNameKeyMap[normalizeAreaName(name)];
  return key ? t(key) : name;
}
