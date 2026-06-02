import fs from "node:fs";
import type { GeneratedDataset } from "../types/generated";
import { getFoodImage } from "../../lib/utils/image";
import { parseFoodsFromTcmJson } from "../utils/tcm-parser";
import { normalizeFoodName } from "../utils/normalize-food";

const slugs = [
  "kinopios-cafe",
  "pit-stop-popcorn",
  "yoshis-snack-island",
  "donkey-kong-cart",
  "three-broomsticks",
  "hoggs-head-pub",
  "delicious-me-the-cookie-kitchen",
  "evil-eats",
  "snoopys-backlot-cafe",
  "hello-kittys-corner-cafe",
  "beverly-hills-boulangerie",
  "mels-drive-in",
  "studio-stars-restaurant",
  "mario-cafe-and-store",
  "louies-ny-pizza-parlor",
  "saido",
  "park-side-grille",
  "happiness-cafe",
  "wharf-cafe",
  "the-dragons-pearl",
  "lombards-landing",
  "fossil-fuels",
  "lost-world-restaurant",
  "discovery-restaurant",
  "amity-landing-restaurant",
  "boardwalk-snacks",
  "amity-ice-cream",
  "food-cart",
  "kids-menu",
  "seasonal-food",
  "super-nintendo-world-food",
  "the-wizarding-world-of-harry-potter-food",
  "minion-food"
];

async function main() {
  const dataset = JSON.parse(fs.readFileSync("scripts/output/foods.generated.json", "utf8")) as GeneratedDataset;
  const visible = dataset.foods.filter(
    (food) =>
      food.reviewStatus === "approved" &&
      food.canonicalFood !== false &&
      !food.hidden &&
      food.displayQuality !== "low" &&
      food.nameQualityScore >= 60 &&
      food.confidenceScore >= 45 &&
      !food.compositeMenu &&
      Boolean(food.sourceUrl)
  );
  const keys = new Set(visible.map((food) => `${food.normalizedName || normalizeFoodName(food.name)}:${food.category}`));
  const images = new Set(visible.map((food) => getFoodImage(food)).filter((image) => !image.startsWith("/placeholders/")));
  const results = [];

  for (const slug of slugs) {
    const url = `https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/${slug}/index.html`;
    try {
      const response = await fetch(url, { headers: { accept: "application/json,text/plain,*/*" } });
      if (!response.ok) {
        results.push({ slug, status: response.status, foods: 0, newSafe: [] });
        continue;
      }
      const raw = await response.text();
      const parsed = parseFoodsFromTcmJson(raw, url);
      const newSafe = parsed.foods
        .filter((food) => {
          const key = `${food.normalizedName || normalizeFoodName(food.name)}:${food.category}`;
          const image = food.images[0]?.imageUrl;
          return (
            image &&
            !keys.has(key) &&
            !images.has(image) &&
            /(?:ピッツァ|ピザ|パスタ|スパゲティ|ライス|カレー|プレート|バーガー|キッズ|ドリンク|ケーキ|パイ|サンデー|アイス|デザート|セット|ヌードル|丼|御膳|ステーキ|グリル|サンド)/.test(food.name) &&
            !/(ベビーフード|店舗未確認|Global alt|SEO|Keywords|レストラン$|カフェ$|パーラー$|キッチン$)/i.test(food.name)
          );
        })
        .map((food) => ({
          name: food.name,
          category: food.category,
          shop: food.shopName,
          image: food.images[0]?.imageUrl
        }));
      results.push({ slug, status: response.status, foods: parsed.foods.length, newSafe });
    } catch (error) {
      results.push({ slug, error: error instanceof Error ? error.message : String(error), foods: 0, newSafe: [] });
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
