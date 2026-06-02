import fs from "node:fs";
import path from "node:path";
import { getFoodImage } from "../../lib/utils/image";
import type { CrawlRunResult } from "../types/crawler";
import type { GeneratedDataset } from "../types/generated";
import { cleanFoodName, inferCategory, normalizeFoodName } from "../utils/normalize-food";

const outputDir = path.join(process.cwd(), "scripts", "output");
const dataset = JSON.parse(fs.readFileSync(path.join(outputDir, "foods.generated.json"), "utf8")) as GeneratedDataset;
const report = JSON.parse(fs.readFileSync(path.join(outputDir, "latest-crawl-report.json"), "utf8")) as CrawlRunResult;

const visible = dataset.foods.filter(
  (food) =>
    food.reviewStatus === "approved" &&
    food.canonicalFood !== false &&
    !food.hidden &&
    food.displayQuality !== "low" &&
    food.nameQualityScore >= 60 &&
    food.confidenceScore >= 45 &&
    !food.compositeMenu
);

const visibleNames = new Set(visible.map((food) => normalizeFoodName(food.name)));
const visibleNameCategory = new Set(visible.map((food) => `${normalizeFoodName(food.name)}:${food.category}`));
const visibleImages = new Set(visible.map((food) => getFoodImage(food)).filter((image) => !image.startsWith("/placeholders/")));
const seen = new Set<string>();

const reject = /(格納先|原作|シリーズ|仮面舞踏会|店舗です|店舗未確認|レストラン$|カフェ$|キッチン$|パーラー$|スプーン$|スプーン&フォーク|ベビーフード|ペシャルドリンク|ソフトドリンク\s*\(|メニュー確認中|ヨッシー・スナック・アイランドTM?$)/;
const target = /(ピッツァ|ピザ|スパゲティ|パスタ|ラザニア|ヌードル|ライス|カレー|丼|御膳|チャーハン|バーガー|サンド|サンドウィッチ|キッズ|プレート|セット|コンボ|ステーキ|グリル|ドリンク|ソーダ|シェイク|フロート|ビール|レモネード|カクテル|ケーキ|パイ|プリン|サンデー|アイス|クッキー|ワッフル|パンケーキ|シュークリーム|ホットドッグ|スープ|ポテト|チキン|ローストビーフ|スペアリブ|パフェ|ティラミス|ブラウニー|ムース|フラッペ|ラッシー|コーヒー|紅茶|ラテ|ミルク|ジュース|ティー|オムレツ|ハンバーグ|フィッシュ|チップス|ショコラ|サングリア)/i;

const rows = report.sources.flatMap((source) =>
  source.foods.map((food) => {
    const name = cleanFoodName(food.name).replace(/\s+SV付$/i, " マグカップ付き").trim();
    const category = inferCategory(`${name} ${food.description ?? ""}`);
    const normalizedName = normalizeFoodName(name);
    const images = food.images.map((image) => image.imageUrl).filter(Boolean);
    const key = `${normalizedName}:${category}:${food.sourceUrl}`;
    return {
      name,
      normalizedName,
      category,
      shop: food.shopName,
      area: food.areaName,
      price: food.price,
      images: images.length,
      imageUrl: images[0],
      sourceUrl: food.sourceUrl,
      sourceName: source.sourceName,
      representedByName: visibleNames.has(normalizedName),
      representedByCategory: visibleNameCategory.has(`${normalizedName}:${category}`),
      imageAlreadyVisible: images.some((image) => visibleImages.has(image)),
      key
    };
  })
);

const candidates = rows
  .filter((row) => {
    if (seen.has(row.key)) return false;
    seen.add(row.key);
    return true;
  })
  .filter((row) => target.test(row.name))
  .filter((row) => !reject.test(row.name))
  .filter((row) => row.images > 0)
  .filter((row) => !row.representedByCategory)
  .sort((a, b) => Number(a.representedByName) - Number(b.representedByName) || a.name.localeCompare(b.name, "ja"));

const byCategory = candidates.reduce<Record<string, number>>((acc, row) => {
  acc[row.category] = (acc[row.category] ?? 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({ visible: visible.length, candidates: candidates.length, byCategory, items: candidates }, null, 2));
