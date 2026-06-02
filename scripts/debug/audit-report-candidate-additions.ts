import fs from "node:fs";
import type { CrawlRunResult, CrawledFood } from "../types/crawler";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";
import { inferCategory, normalizeFoodName } from "../utils/normalize-food";

const [basePath = "scripts/output/foods.generated.json", reportPath = "scripts/output/latest-crawl-report.json"] = process.argv.slice(2);

const base = JSON.parse(fs.readFileSync(basePath, "utf8")) as GeneratedDataset;
const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as CrawlRunResult;
const visible = base.foods.filter(isVisible);
const visibleKeys = new Set(visible.map((food) => keyFor(food.name, food.category)));
const visibleNames = new Set(visible.map((food) => normalizeFoodName(food.name)));
const candidates: Array<{
  name: string;
  category: string;
  price?: number;
  shop?: string;
  area?: string;
  sourceUrl?: string;
  imageUrl?: string;
  score: number;
}> = [];

for (const source of report.sources ?? []) {
  for (const raw of source.foods ?? []) {
    const normalizedName = normalizeFoodName(raw.name ?? "");
    const category = raw.category ?? inferCategory(raw.name ?? "");
    if (!normalizedName || visibleKeys.has(keyFor(raw.name, category)) || visibleNames.has(normalizedName)) continue;
    if (!isSafeCandidate(raw)) continue;
    candidates.push({
      name: raw.name,
      category,
      price: raw.price ?? raw.priceMin,
      shop: raw.shopName,
      area: raw.areaName,
      sourceUrl: raw.sourceUrl,
      imageUrl: raw.images?.[0]?.imageUrl,
      score: scoreCandidate(raw)
    });
  }
}

const unique = new Map<string, (typeof candidates)[number]>();
for (const candidate of candidates.sort((a, b) => b.score - a.score)) {
  const key = keyFor(candidate.name, candidate.category);
  if (!unique.has(key)) unique.set(key, candidate);
}

console.log(JSON.stringify([...unique.values()].slice(0, 120), null, 2));

function isVisible(food: GeneratedFood) {
  return (
    food.reviewStatus === "approved" &&
    food.canonicalFood !== false &&
    !food.hidden &&
    food.displayQuality !== "low" &&
    food.nameQualityScore >= 60 &&
    food.confidenceScore >= 45 &&
    !food.compositeMenu
  );
}

function keyFor(name: string, category: string) {
  return `${normalizeFoodName(name)}:${category}`;
}

function isSafeCandidate(food: CrawledFood) {
  const name = (food.name ?? "").trim();
  if (!name || name.length > 45) return false;
  if (/(Global alt|SEO|Keywords|販売場所|店舗未確認|レストラン$|カフェ$|メニュー|公式アレルゲン|お持ち帰りいただけません|ベビーフード|スプーン|フォーク)/i.test(name)) return false;
  if (/[、,].*[、,].*[、,]/.test(name)) return false;
  if (/(ピッツァ|ピザ|パスタ|スパゲティ|ヌードル|ライス|カレー|バーガー|サンド|キッズ|プレート|セット|ドリンク|ソーダ|シェイク|フロート|ラテ|コーヒー|ティー|ジュース|ケーキ|パイ|プリン|サンデー|アイス|デザート|スープ|チキン|ビーフ|ポーク|ハンバーグ|サラダ|ワッフル|クッキー|ブラウニー|ムース|ティラミス)/i.test(name) === false) return false;
  return Boolean(food.sourceUrl && /usj\.co\.jp|castel\.jp/i.test(food.sourceUrl));
}

function scoreCandidate(food: CrawledFood) {
  let score = 0;
  if (food.images?.some((image) => image.imageUrl && /usj\.co\.jp|tridiondata/i.test(image.imageUrl))) score += 35;
  if (food.price || food.priceMin) score += 12;
  if (food.shopName && food.shopName !== "店舗未確認") score += 12;
  if (food.areaName && food.areaName !== "その他") score += 8;
  if (/キッズ|プレート|セット|パスタ|スパゲティ|ライス|カレー|バーガー|ドリンク|デザート|ケーキ|ピッツァ|ピザ/i.test(food.name)) score += 18;
  if (/usj\.co\.jp/i.test(food.sourceUrl ?? "")) score += 20;
  return score;
}
