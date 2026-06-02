import fs from "node:fs";
import path from "node:path";
import type { FoodCategory } from "../types/domain";
import type { CrawlRunResult } from "./types/crawler";
import { crawlTargetedPages } from "./crawlers/crawl-targeted-pages";
import { buildRequiredSourceCoverage } from "./crawl-usj-foods";
import { buildGeneratedDataset } from "./utils/quality-foods";

const outputDir = path.join(process.cwd(), "scripts", "output");
const reportPath = path.join(outputDir, "latest-crawl-report.json");
const mode = process.argv[2] ?? "churro";
const category = toFoodCategory(mode);

const categoryKeywords: Record<string, RegExp> = {
  churro: /チュリトス|チュロス|churro|churros|食べ歩き|フードカート/i,
  popcorn: /ポップコーン|popcorn|バケツ|バケット|カート/i,
  drink: /ドリンク|ソーダ|ラテ|スムージー|フローズン|カクテル|ジュース|コーヒー|ビール|シェイク|drink|latte|soda/i,
  dessert: /ケーキ|サンデー|アイス|パフェ|スイーツ|クッキー|チョコ|プリン|ワッフル|dessert|cake|ice|sweets/i,
  snack: /スナック|食べ歩き|ホットドッグ|ポテト|ナゲット|ターキー|チキン|ポークリブ|まん|パイ|フードカート/i,
  walkfood: /食べ歩き|フードカート|ワゴン|スナック|ターキーレッグ|チュリトス|ポップコーン|ホットドッグ|まん|肉まん|ドリンク/i,
  foodcarts: /フードカート|ポップコーンカート|ドリンクワゴン|ワゴン|食べ歩き|チュリトス|ターキーレッグ|ポップコーン/i,
  nintendo: /マリオ|ルイージ|ピーチ|キノピオ|ヨッシー|ドンキー|Nintendo|ニンテンドー/i,
  minion: /ミニオン|ティム|ボブ|スチュアート|デイブ|Minion/i,
  harrypotter: /ハリー|ポッター|ホグワーツ|ホグズミード|三本の箒|ホッグズ|バタービール|パンプキン|ロースト/i,
  pizza: /ピザ|ピッツァ|pizza|マルゲリータ|ペパロニ|クアトロ|チーズ/i,
  burger: /バーガー|ハンバーガー|サンド|sandwich|burger|BLT|チーズバーガー|フィッシュ/i,
  pasta: /パスタ|スパゲ|ヌードル|ラーメン|麺|うどん|pasta|noodle|spaghetti/i,
  kids: /キッズ|お子さま|おこさま|kids|child|ジュニア|プレート|セット/i,
  restaurantmenus: /ピザ|ピッツァ|パスタ|バーガー|サンド|キッズ|お子さま|セット|プレート|カレー|ライス|チキン|ステーキ|ケーキ|ドリンク|デザート|メニュー|円|¥|￥/i,
  seasonal: /期間限定|季節|限定|イベント|コラボ|フェスティバル|ハロウィーン|クリスマス|イースター|summer|limited/i,
  prices: /(?:¥|￥|\d{2,3}(?:,\d{3})?円|価格|税込|単品|セット|チュリトス|ポップコーン|ドリンク|フード|メニュー)/i
};

async function main() {
  const baseReport = fs.existsSync(reportPath)
    ? (JSON.parse(fs.readFileSync(reportPath, "utf8")) as CrawlRunResult)
    : ({
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        pagesCrawled: 0,
        foodsFound: 0,
        uniqueFoods: 0,
        addedCount: 0,
        updatedCount: 0,
        inactiveCount: 0,
        errors: [],
        requiredSourceCoverage: [],
        sources: []
      } satisfies CrawlRunResult);

  const targeted = await crawlTargetedPages(mode as never);
  const sources = [...baseReport.sources.filter((source) => source.sourceName !== targeted.sourceName), targeted];
  const quality = buildGeneratedDataset(sources);
  const report: CrawlRunResult = {
    ...baseReport,
    finishedAt: new Date().toISOString(),
    pagesCrawled: sources.reduce((sum, source) => sum + source.pagesCrawled, 0),
    foodsFound: sources.reduce((sum, source) => sum + source.foods.length, 0),
    uniqueFoods: quality.dataset.foods.filter((food) => !food.hidden && food.reviewStatus !== "rejected").length,
    errors: sources.flatMap((source) => source.errors),
    requiredSourceCoverage: buildRequiredSourceCoverage(sources),
    sources
  };

  fs.writeFileSync(path.join(outputDir, "foods.generated.json"), JSON.stringify(quality.dataset, null, 2));
  fs.writeFileSync(path.join(outputDir, "shops.generated.json"), JSON.stringify(quality.shops, null, 2));
  fs.writeFileSync(path.join(outputDir, "areas.generated.json"), JSON.stringify(quality.areas, null, 2));
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  const keyword = categoryKeywords[mode] ?? categoryKeywords[category] ?? new RegExp(mode, "i");
  const allCandidates = quality.dataset.foods.filter((food) =>
    food.category === category ||
    keyword.test(`${food.name} ${food.description ?? ""} ${food.shop.name} ${food.area.name} ${food.sourceNames.join(" ")} ${food.sourceUrl}`)
  );
  const categoryCandidates = allCandidates.filter((food) => food.category === category || keyword.test(`${food.name} ${food.shop.name} ${food.area.name}`));
  const visible = categoryCandidates.filter(
    (food) =>
      food.canonicalFood &&
      food.reviewStatus === "approved" &&
      !food.hidden &&
      food.displayQuality !== "low" &&
      food.nameQualityScore >= 60
  );
  const pending = allCandidates.filter((food) => food.reviewStatus === "pending" || !food.canonicalFood);
  const verifiedImages = visible.filter((food) => food.images.some((image) => image.enabled && image.sourceType === "official" && image.imageVerified)).length;
  const categoryReport = {
    mode,
    category,
    generatedAt: new Date().toISOString(),
    targetedPagesCrawled: targeted.pagesCrawled,
    targetedFoodsFound: targeted.foods.length,
    targetedErrors: targeted.errors.length,
    requiredSourceCoverage: report.requiredSourceCoverage ?? [],
    totalCandidates: allCandidates.length,
    categoryCandidates: categoryCandidates.length,
    visible: visible.length,
    pending: pending.length,
    verifiedImages,
    placeholders: Math.max(visible.length - verifiedImages, 0),
    candidates: allCandidates.slice(0, 300).map((food) => ({
      id: food.id,
      name: food.name,
      category: food.category,
      reviewStatus: food.reviewStatus,
      displayQuality: food.displayQuality,
      canonicalFood: food.canonicalFood,
      hidden: food.hidden,
      confidenceScore: food.confidenceScore,
      nameQualityScore: food.nameQualityScore,
      sourceUrl: food.sourceUrl,
      shop: food.shop.name,
      area: food.area.name,
      imageVerified: food.images.some((image) => image.enabled && image.imageVerified),
      imageMatchScore: food.images.find((image) => image.enabled || image.imageMatchScore)?.imageMatchScore ?? 0,
      imageMismatchReason: food.images.find((image) => image.imageMismatchReason)?.imageMismatchReason,
      rejectionReasons: food.rejectionReasons
    }))
  };
  fs.writeFileSync(path.join(outputDir, `${mode}.crawl-report.json`), JSON.stringify(categoryReport, null, 2));
  console.log(JSON.stringify(categoryReport, null, 2));
}

function toFoodCategory(value: string): FoodCategory {
  if (value === "foodcarts" || value === "snack" || value === "walkfood") return "snack";
  if (value === "nintendo" || value === "minion" || value === "harrypotter" || value === "limited" || value === "seasonal") return "seasonal";
  if (value === "prices") return "unknown";
  if (value === "pasta") return "noodle";
  if (value === "restaurantmenus") return "set";
  if (value === "drinks") return "drink";
  if (value === "desserts") return "dessert";
  if (value === "churros") return "churro";
  return value as FoodCategory;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
