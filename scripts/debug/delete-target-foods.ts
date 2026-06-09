import fs from "node:fs";
import path from "node:path";

type FoodRecord = {
  id: string;
  name: string;
  normalizedName?: string;
  normalized_name?: string;
  hidden?: boolean;
  reviewStatus?: string;
  review_status?: string;
  canonicalFood?: boolean;
  canonical_food?: boolean;
  compositeMenu?: boolean;
  composite_menu?: boolean;
  displayQuality?: string;
  display_quality?: string;
  status?: string;
  nameQualityScore?: number;
  name_quality_score?: number;
  confidenceScore?: number;
  confidence_score?: number;
  sourceUrl?: string;
  source_url?: string;
  shop?: {
    name?: string;
  };
  locations?: Array<{
    shopName?: string;
  }>;
  images?: Array<{
    enabled?: boolean;
    sourceType?: string;
    isSharedTooMuch?: boolean;
  }>;
};

type Dataset = {
  generatedAt?: string;
  summary?: Record<string, number>;
  foods?: FoodRecord[];
};

const outputDir = path.join(process.cwd(), "scripts", "output");
const datasetPath = path.join(outputDir, "foods.generated.json");
const reportPath = path.join(outputDir, "deleted-foods.generated.json");

const exactNames = [
  "アイゼン&ハイターのハンバーグとフィッシュ&チップスプレート",
  "アイゼン＆ハイターのハンバーグとフィッシュ＆チップスプレート",
  "ヤクルト・ソフトクリームサンデー ~マンゴー~",
  "ヤクルト・ソフトクリームサンデー ～マンゴー～",
  "モンスターハンター・ワイルズ×USJ限定コースターセット",
  "モンスターハンターワイルズ×USJ限定コースターセット",
  "プーギーチュリトス〜ピーチ〜",
  "プーギーチュリトス～ピーチ～",
  "スプラッシュ! ゼニガメ・チュリトス ~バニラフレーバー~",
  "スプラッシュ！ゼニガメ・チュリトス ～バニラフレーバー～",
  "スパイダーマン・チュリトス~ラズベリー~",
  "スパイダーマン・チュリトス〜ラズベリー〜",
  "ストロベリーチュリトス",
  "サポート部隊アイルー・キッズセット",
  "クリスマス・チョコ・チュリトス",
  "オトモアイルーのチョコレートプリン マグカップ付"
];

function normalizeName(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ \t\n\r"'“”‘’・〜～‐‑‒–—―_()（）［\]\[\]【】!！.,，、。:：]/g, "")
    .replace(/＆/g, "&");
}

const exactKeys = new Set(exactNames.map(normalizeName));

function shouldDelete(food: FoodRecord) {
  const keys = [food.name, food.normalizedName, food.normalized_name].filter((value): value is string => Boolean(value)).map(normalizeName);
  if (keys.some((key) => exactKeys.has(key))) return true;
  return keys.some((key) => key.includes(normalizeName("チョコ&クッキー・チュリトス")));
}

function main() {
  const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8")) as Dataset;
  const foods = Array.isArray(dataset.foods) ? dataset.foods : [];
  const removed = foods.filter(shouldDelete);
  const remaining = foods.filter((food) => !shouldDelete(food));

  dataset.foods = remaining;
  dataset.generatedAt = new Date().toISOString();
  const visibleFoods = remaining.filter(isVisiblePublicFood);
  dataset.summary = {
    ...(dataset.summary ?? {}),
    totalCandidates: remaining.length,
    generatedFoods: visibleFoods.length,
    approved: remaining.filter((food) => (food.reviewStatus ?? food.review_status) === "approved").length,
    hidden: remaining.filter((food) => food.hidden).length,
    withImages: visibleFoods.filter((food) => hasAnyImage(food)).length,
    placeholderImages: 0
  };

  fs.writeFileSync(datasetPath, `${JSON.stringify(dataset, null, 2)}\n`);
  fs.writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        removedCount: removed.length,
        removedFoods: removed.map((food) => ({ id: food.id, name: food.name }))
      },
      null,
      2
    )}\n`
  );

  console.log(JSON.stringify({ before: foods.length, after: remaining.length, removedCount: removed.length, removedFoods: removed.map((food) => ({ id: food.id, name: food.name })) }, null, 2));
}

function hasAnyImage(food: Record<string, unknown>) {
  if (typeof food.imageUrl === "string" || typeof food.image_url === "string") return true;
  if (typeof food.representativeImageUrl === "string" || typeof food.representative_image_url === "string") return true;
  return Array.isArray(food.images) && food.images.length > 0;
}

function isVisiblePublicFood(food: FoodRecord) {
  const reviewStatus = food.reviewStatus ?? food.review_status;
  const canonicalFood = food.canonicalFood ?? food.canonical_food;
  const displayQuality = food.displayQuality ?? food.display_quality;
  const nameQualityScore = food.nameQualityScore ?? food.name_quality_score ?? 0;
  const confidenceScore = food.confidenceScore ?? food.confidence_score ?? 0;
  const compositeMenu = food.compositeMenu ?? food.composite_menu;
  const sourceUrl = food.sourceUrl ?? food.source_url;
  const shopName = food.shop?.name;
  return (
    reviewStatus === "approved" &&
    canonicalFood !== false &&
    !food.hidden &&
    displayQuality !== "low" &&
    food.status !== "inactive" &&
    nameQualityScore >= 60 &&
    confidenceScore >= 45 &&
    !compositeMenu &&
    Boolean(sourceUrl) &&
    (
      shopName !== "店舗未確認" ||
      food.locations?.some((location) => location.shopName !== "店舗未確認") ||
      food.images?.some((image) => image.enabled && image.sourceType === "official" && !image.isSharedTooMuch) ||
      /castel\.jp/i.test(sourceUrl ?? "")
    )
  );
}

main();
