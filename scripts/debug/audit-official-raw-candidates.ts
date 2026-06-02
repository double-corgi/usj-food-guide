import { fetchText } from "../utils/http";
import { parseFoodsFromTcmJson } from "../utils/tcm-parser";
import fs from "node:fs";
import type { GeneratedDataset } from "../types/generated";

const baselinePath = process.argv[2];
const pages = [
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/mario-cafe-and-store/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/kinopios-cafe/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/studio-stars-restaurant/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/mels-drive-in/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/discovery-restaurant/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/amity-landing-restaurant/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/amity-ice-cream/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/fossil-fuels/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/boardwalk-snacks/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/lost-world-restaurant/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/louies-ny-pizza-parlor/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/beverly-hills-boulangerie/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/park-side-grille/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/saido/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/the-dragons-pearl/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/happiness-cafe/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/delicious-me-the-cookie-kitchen/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/jungle-beat-shakes/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/snoopys-backlot-cafe/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/hello-kittys-corner-cafe/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/pit-stop-popcorn/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/yoshis-snack-island/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/wharf-cafe/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/three-broomsticks/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/hogs-head/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/kids-menu/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/food-cart/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/seasonal-food/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/events/universal-cool-japan-2026/jujutsukaisen/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/events/universal-cool-japan-2026/conan/more-enjoy/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/events/universal-cool-japan-2026/conan/restaurant/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/events/universal-cool-japan-2026/monster-hunter-restaurant/index.html",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/events/universal-cool-japan-2026/frieren/restaurant/index.html"
];

const namePattern =
  /(ピッツァ|ピザ|スパゲティ|パスタ|ラザニア|ヌードル|ライス|カレー|丼|御膳|チャーハン|バーガー|サンド|サンドウィッチ|キッズ|プレート|セット|コンボ|ブリトー|ステーキ|グリル|ドリンク|ソーダ|シェイク|フロート|ビール|レモネード|カクテル|ケーキ|パイ|プリン|サンデー|アイス|クッキー|ワッフル|パンケーキ|シュークリーム|ホットドッグ|スープ|ポテト|チキン|ローストビーフ|スペアリブ|パフェ|ティラミス|ブラウニー|ムース|フラッペ|ラッシー|コーヒー|紅茶|ラテ|ミルク|ジュース|ティー|オムレツ|ハンバーグ|フィッシュ|チップス|ショコラ|サングリア)/i;
const rejectPattern =
  /(ベビーフード|スプーン&フォーク|公式アレルゲン|店舗です|店舗未確認|レストラン$|SWEETS\s*&\s*CAFE|ペシャルドリンク|ソフトドリンク\s*\(|グリルチキン$|原作|シリーズ|仮面舞踏会|高級レストラン|ロゴ|ドリンクステーション|格納先|レストルーム)/i;

function reason(name: string, images: string[]) {
  const reasons: string[] = [];
  if (!namePattern.test(name)) reasons.push("not-target");
  if (rejectPattern.test(name)) reasons.push("reject-pattern");
  if (name.length > 70) reasons.push("too-long");
  if (/[{}<>]|tcm:|Global alt|SEO|Keywords/.test(name)) reasons.push("fragment");
  if (images.length === 0) reasons.push("no-image");
  if (!images.some((image) => !/logo|hero|mainvisual|map|restaurant-[abc]|interior|page-title|experience-image/i.test(image))) {
    reasons.push("weak-image");
  }
  return reasons;
}

async function main() {
  const existing = baselinePath
    ? new Set(
        (JSON.parse(fs.readFileSync(baselinePath, "utf8")) as GeneratedDataset).foods.map((food) =>
          (food.normalizedName || food.name.normalize("NFKC").replace(/\s+/g, "").toLowerCase()).replace(/[〜～]/g, "~")
        )
      )
    : new Set<string>();
  const rows: Array<Record<string, unknown>> = [];
  for (const page of pages) {
    const raw = await fetchText(page);
    const parsed = parseFoodsFromTcmJson(raw, page);
    for (const food of parsed.foods) {
      const images = food.images.map((image) => image.imageUrl);
      rows.push({
        ok: reason(food.name, images).length === 0,
        reasons: reason(food.name, images).join(","),
        exists: existing.has((food.normalizedName || food.name.normalize("NFKC").replace(/\s+/g, "").toLowerCase()).replace(/[〜～]/g, "~")),
        normalizedName: food.normalizedName,
        name: food.name,
        category: food.category,
        price: food.price ?? "",
        images: images.length,
        page
      });
    }
  }
  const targets = rows.filter((row) => String(row.reasons).includes("no-image") === false && namePattern.test(String(row.name)));
  console.log(
    JSON.stringify(
      {
        total: rows.length,
        targetish: targets.length,
        notExistingOk: targets.filter((row) => row.ok && !row.exists).length,
        rows: targets.filter((row) => !baselinePath || !row.exists)
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
