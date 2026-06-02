import fs from "node:fs";
import { fetchText } from "../utils/http";
import { normalizeFoodName } from "../utils/normalize-food";
import { parseFoodsFromTcmJson, webUrlToTridionUrl } from "../utils/tcm-parser";
import type { GeneratedDataset } from "../types/generated";

const baselinePath = process.argv[2] ?? "/private/tmp/usj-foods-before-157-goal.json";
const maxPages = Number(process.argv[3] ?? 420);

const seeds = [
  "https://www.usj.co.jp/web/ja/jp/restaurants",
  "https://www.usj.co.jp/web/ja/jp/restaurants/food-cart",
  "https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food",
  "https://www.usj.co.jp/web/ja/jp/restaurants/super-nintendo-world-food",
  "https://www.usj.co.jp/web/ja/jp/restaurants/the-wizarding-world-of-harry-potter-food",
  "https://www.usj.co.jp/web/ja/jp/restaurants/minion-food"
];

const targetPattern =
  /(ピッツァ|ピザ|スパゲティ|パスタ|ラザニア|ヌードル|ラーメン|ライス|カレー|丼|御膳|チャーハン|バーガー|サンド|サンドウィッチ|キッズ|プレート|セット|コンボ|ブリトー|ステーキ|グリル|ローストビーフ|スペアリブ|ドリンク|ソーダ|シェイク|フロート|ビール|レモネード|カクテル|ジュース|ラテ|ティー|コーヒー|ケーキ|パイ|プリン|サンデー|アイス|クッキー|ワッフル|パンケーキ|シュークリーム|パフェ|ティラミス|ブラウニー|ムース|フラッペ|ラッシー|ホットドッグ|スープ|ポテト|チキン|ハンバーグ|フィッシュ|チップス|ショコラ|サングリア)/i;
const rejectPattern =
  /(ベビーフード|スプーン&フォーク|公式アレルゲン|店舗です|店舗未確認|レストラン$|カフェ$|キッチン$|パーラー$|SWEETS\s*&\s*CAFE|ペシャルドリンク|ソフトドリンク\s*\(|グリルチキン$|原作|シリーズ|仮面舞踏会|高級レストラン|ロゴ|ドリンクステーション|格納先|レストルーム|エントランス|フォト|グッズ|チケット)/i;
const weakImagePattern = /logo|hero|mainvisual|map|restaurant-[abc]|interior|page-title|experience-image|kv|banner|store|shop|facade/i;

async function main() {
  const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8")) as GeneratedDataset;
  const existing = new Set(baseline.foods.map((food) => key(food.name)));
  const queue = [...seeds];
  const seen = new Set<string>();
  const candidates = new Map<string, Record<string, unknown>>();
  const pages: Array<{ url: string; foods: number; candidateFoods: number }> = [];

  while (queue.length > 0 && seen.size < maxPages) {
    const webUrl = queue.shift();
    if (!webUrl || seen.has(webUrl)) continue;
    seen.add(webUrl);
    const tcmUrl = webUrlToTridionUrl(webUrl);
    if (!tcmUrl) continue;

    try {
      const raw = await fetchText(tcmUrl, { retries: 1, timeoutMs: 15000 });
      const parsed = parseFoodsFromTcmJson(raw, tcmUrl);
      let candidateFoods = 0;
      for (const food of parsed.foods) {
        const reasons = rejectReasons(food.name, food.images.map((image) => image.imageUrl));
        if (reasons.length > 0 || existing.has(key(food.name))) continue;
        candidateFoods += 1;
        const current = candidates.get(key(food.name));
        const row = {
          name: food.name,
          normalizedName: normalizeFoodName(food.name),
          category: food.category,
          price: food.price ?? "",
          shopName: food.shopName,
          areaName: food.areaName,
          sourceUrl: tcmUrl,
          images: food.images.length,
          imageUrl: food.images.find((image) => !weakImagePattern.test(image.imageUrl))?.imageUrl ?? food.images[0]?.imageUrl ?? "",
          confidence: food.confidence
        };
        if (!current || Number(row.images) > Number(current.images ?? 0)) candidates.set(key(food.name), row);
      }
      pages.push({ url: tcmUrl, foods: parsed.foods.length, candidateFoods });
      for (const link of parsed.links) {
        if (/\/web\/ja\/jp\/(?:restaurants|events|areas)|\/company\/news\//.test(link) && !seen.has(link) && !queue.includes(link)) {
          queue.push(link);
        }
      }
    } catch {
      pages.push({ url: tcmUrl, foods: 0, candidateFoods: 0 });
    }
  }

  const rows = [...candidates.values()].sort((a, b) => String(a.name).localeCompare(String(b.name), "ja"));
  console.log(JSON.stringify({ scanned: seen.size, candidates: rows.length, rows, pages: pages.filter((page) => page.candidateFoods > 0) }, null, 2));
}

function rejectReasons(name: string, images: string[]) {
  const reasons: string[] = [];
  if (!targetPattern.test(name)) reasons.push("not-target");
  if (rejectPattern.test(name)) reasons.push("reject-pattern");
  if (/[{}<>]|tcm:|Global alt|SEO|Keywords/.test(name)) reasons.push("fragment");
  if (name.length > 64 && !/(プレート|セット|サンド|バーガー|チュリトス|ローストビーフ|ハンバーグ)/.test(name)) reasons.push("too-long");
  if (images.length === 0) reasons.push("no-image");
  if (!images.some((image) => !weakImagePattern.test(image))) reasons.push("weak-image");
  return reasons;
}

function key(name: string) {
  return normalizeFoodName(name).replace(/[〜～]/g, "~");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
