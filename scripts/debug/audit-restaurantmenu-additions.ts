import fs from "node:fs";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";
import { cleanFoodName, normalizeFoodName } from "../utils/normalize-food";
import { getFoodImage } from "../../lib/utils/image";

const [basePath = "scripts/output/foods.generated.json", sourcePath = "/private/tmp/usj-restaurantmenus-foods.json"] = process.argv.slice(2);

const base = readDataset(basePath);
const source = readDataset(sourcePath);
const baseVisible = visibleFoods(base);
const baseKeys = new Set(baseVisible.map((food) => keyFor(food)));
const baseNames = new Set(baseVisible.map((food) => normalizeFoodName(food.name)));

const rows = source.foods
  .filter((food) => food.reviewStatus === "approved" && food.displayQuality !== "low")
  .filter((food) => isSafeFood(food))
  .map((food) => ({
    food,
    key: keyFor(food),
    normalizedName: normalizeFoodName(food.name),
    image: getFoodImage(food)
  }))
  .filter((row) => !baseKeys.has(row.key))
  .filter((row) => !baseNames.has(row.normalizedName) || isUsefulVariant(row.food.name))
  .filter((row) => !row.image.startsWith("/placeholders/"))
  .filter((row, index, all) => all.findIndex((candidate) => candidate.key === row.key) === index)
  .sort((a, b) => categoryRank(a.food.category) - categoryRank(b.food.category) || a.food.name.localeCompare(b.food.name, "ja"));

console.log(
  JSON.stringify(
    {
      baseVisible: baseVisible.length,
      sourceFoods: source.foods.length,
      candidates: rows.length,
      byCategory: countBy(rows, (row) => row.food.category),
      items: rows.map((row) => ({
        name: row.food.name,
        category: row.food.category,
        shop: row.food.shop?.name,
        area: row.food.area?.name,
        image: row.image,
        sourceUrl: row.food.sourceUrl,
        hidden: row.food.hidden,
        canonicalFood: row.food.canonicalFood,
        imageVerified: row.food.images.some((image) => image.enabled && image.imageVerified)
      }))
    },
    null,
    2
  )
);

function isSafeFood(food: GeneratedFood) {
  const name = cleanFoodName(food.name);
  if (!name || name.length > 72) return false;
  if (/(Global alt|SEO|Keywords|店舗です|店舗未確認|レストラン$|カフェ$|キッチン$|パーラー$|ペシャルドリンク|原作|シリーズ|仮面舞踏会|格納先|スプーン&フォーク|ベビーフード|ソフトドリンク\s*\()/i.test(name)) return false;
  if (!/(ピッツァ|ピザ|スパゲティ|パスタ|ラザニア|ヌードル|ライス|カレー|丼|御膳|バーガー|サンド|サンドウィッチ|キッズ|プレート|セット|コンボ|ブリトー|ステーキ|グリル|ドリンク|ソーダ|シェイク|フロート|ビール|レモネード|カクテル|ケーキ|パイ|プリン|サンデー|アイス|クッキー|ワッフル|パンケーキ|シュークリーム|ホットドッグ|スープ|チキン|パフェ|ティラミス|ブラウニー|ムース|ショコラ)/i.test(name)) return false;
  const image = getFoodImage(food);
  if (!image || /(logo|hero|mainvisual|map|restaurant-[abc]|interior|page-title|experience-image|shop|storefront|castel|sns|instagram|twitter)/i.test(image)) return false;
  return true;
}

function isUsefulVariant(name: string) {
  return /(セット|プレート|マグカップ付き|コースターセット|ボトル|キッズ|スペシャル|アニバーサリー|25周年)/.test(name);
}

function categoryRank(category: string) {
  const order = ["noodle", "rice", "set", "kids", "burger", "pizza", "drink", "dessert", "snack", "chicken"];
  const index = order.indexOf(category);
  return index >= 0 ? index : order.length;
}

function visibleFoods(dataset: GeneratedDataset) {
  return dataset.foods.filter(
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
}

function keyFor(food: GeneratedFood) {
  return `${normalizeFoodName(food.name)}:${food.category}`;
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function readDataset(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as GeneratedDataset;
}
