const officialImageBase = "https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images";

export const areaImageDefinitions = [
  {
    name: "スーパー・ニンテンドー・ワールド",
    image: `${officialImageBase}/usj-gds-super-nintendo-world-5th-cf6-a.jpg`,
  },
  {
    name: "ウィザーディング・ワールド・オブ・ハリー・ポッター",
    image: `${officialImageBase}/usj-gds-the-wizarding-world-of-harry-potter-cf6-a.jpg`,
  },
  {
    name: "ミニオン・パーク",
    image: `${officialImageBase}/usj-gds-minion-park-cf6-a.jpg`,
  },
  {
    name: "ユニバーサル・ワンダーランド",
    image: `${officialImageBase}/usj-gds-universal-wonderland-cf6-a.jpg`,
  },
  {
    name: "ハリウッド・エリア",
    image: `${officialImageBase}/usj-gds-hollywood-cf6-a.jpg`,
  },
  {
    name: "ニューヨーク・エリア",
    image: `${officialImageBase}/usj-gds-new-york-cf6-a.jpg`,
  },
  {
    name: "サンフランシスコ・エリア",
    image: `${officialImageBase}/usj-gds-san-francisco-cf6-a.jpg`,
  },
  {
    name: "ジュラシック・パーク",
    image: `${officialImageBase}/usj-gds-jurassic-park-the-ride-cf6-a.jpg`,
  },
  {
    name: "アミティ・ビレッジ",
    image: `${officialImageBase}/usj-gds-amity-village-cf6-a.jpg`,
  },
  {
    name: "ウォーターワールド",
    image: `${officialImageBase}/usj-gds-waterworld-cf6-a.jpg`,
  },
] as const;

export function normalizeAreaImageName(name?: string | null) {
  const normalized = (name ?? "")
    .replace(/[™®]/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (!normalized) return "";
  if (normalized.includes("ニンテンドー")) return "スーパー・ニンテンドー・ワールド";
  if (normalized.includes("ハリー") || normalized.includes("ウィザーディング")) return "ウィザーディング・ワールド・オブ・ハリー・ポッター";
  if (normalized.includes("ミニオン")) return "ミニオン・パーク";
  if (normalized.includes("ワンダーランド")) return "ユニバーサル・ワンダーランド";
  if (normalized.includes("ハリウッド")) return "ハリウッド・エリア";
  if (normalized.includes("ニューヨーク")) return "ニューヨーク・エリア";
  if (normalized.includes("サンフランシスコ")) return "サンフランシスコ・エリア";
  if (normalized.includes("ジュラシック")) return "ジュラシック・パーク";
  if (normalized.includes("アミティ")) return "アミティ・ビレッジ";
  if (normalized.includes("ウォーターワールド")) return "ウォーターワールド";
  return "";
}

export function getAreaImageByName(name?: string | null) {
  const normalizedName = normalizeAreaImageName(name);
  return areaImageDefinitions.find((area) => area.name === normalizedName);
}
