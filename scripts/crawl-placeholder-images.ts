import fs from "node:fs";
import path from "node:path";
import type { FoodCategory } from "../types/domain";
import type { CrawlRunResult, CrawledFood, CrawledImage } from "./types/crawler";
import type { GeneratedDataset, GeneratedFood, GeneratedImage } from "./types/generated";
import { getCategoryPlaceholder, getFoodImage } from "../lib/utils/image";
import { normalizeFoodName, similarity } from "./utils/normalize-food";

const outputDir = path.join(process.cwd(), "scripts", "output");
const datasetPath = path.join(outputDir, "foods.generated.json");
const crawlReportPath = path.join(outputDir, "latest-crawl-report.json");
const placeholderReportPath = path.join(outputDir, "placeholder-foods.json");
const imageCandidateReportPath = path.join(outputDir, "placeholder-image-candidates.json");
const PUBLIC_IMAGE_SCORE_THRESHOLD = 85;

type ImageCandidate = {
  foodId: string;
  foodName: string;
  category: FoodCategory;
  imageUrl: string;
  sourceUrl?: string;
  sourceName: string;
  officialConfirmed: boolean;
  score: number;
  hasWatermark: boolean;
  watermarkReason?: string;
  reasons: string[];
  sourceFoodName?: string;
};

function main() {
  const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8")) as GeneratedDataset;
  const crawlReport = JSON.parse(fs.readFileSync(crawlReportPath, "utf8")) as CrawlRunResult;
  const visible = visibleFoods(dataset.foods);
  const beforePlaceholders = visible.filter((food) => isPlaceholder(food)).length;
  const placeholderFoods = visible.filter((food) => isPlaceholder(food));
  const candidateCatalog = buildCandidateCatalog(crawlReport);
  const now = new Date().toISOString();
  const adopted: ImageCandidate[] = [];
  const held: ImageCandidate[] = [];
  const rejected: ImageCandidate[] = [];
  const qualityRejected: ImageCandidate[] = [];

  for (const food of placeholderFoods) {
    qualityRejected.push(...candidateCatalog.map((candidate) => scoreRejectedQualityCandidate(food, candidate)).filter((candidate): candidate is ImageCandidate => Boolean(candidate)));
    const candidates = candidateCatalog
      .map((candidate) => scoreCandidate(food, candidate))
      .filter((candidate): candidate is ImageCandidate => Boolean(candidate))
      .sort((a, b) => b.score - a.score);
    const best = candidates[0];
    if (best && best.score >= PUBLIC_IMAGE_SCORE_THRESHOLD && !best.hasWatermark) {
      attachCandidateImage(food, best, now);
      adopted.push(best);
    }
    held.push(...candidates.filter((candidate) => candidate.score < PUBLIC_IMAGE_SCORE_THRESHOLD || candidate.hasWatermark).slice(0, 3));
    rejected.push(...candidates.filter((candidate) => candidate.hasWatermark));
  }

  dataset.generatedAt = now;
  dataset.summary = {
    ...dataset.summary,
    withImages: dataset.foods.filter((food) => food.images.some((image) => image.enabled)).length,
    officialImages: dataset.foods.filter((food) => food.images.some((image) => image.enabled && image.sourceType === "official")).length,
    verifiedOfficialImages: dataset.foods.filter((food) => food.images.some((image) => image.enabled && image.sourceType === "official" && image.imageVerified)).length,
    placeholderImages: visibleFoods(dataset.foods).filter((food) => isPlaceholder(food)).length,
    imageMismatchExcluded: dataset.foods.filter((food) => food.images.some((image) => !image.enabled && image.imageMismatchReason)).length
  };

  const afterVisible = visibleFoods(dataset.foods);
  const afterPlaceholders = afterVisible.filter((food) => isPlaceholder(food)).length;
  const unresolved = afterVisible.filter((food) => isPlaceholder(food));

  fs.writeFileSync(datasetPath, JSON.stringify(dataset, null, 2));
  fs.writeFileSync(placeholderReportPath, JSON.stringify(placeholderFoods.map(toPlaceholderRow), null, 2));
  const report = {
    generatedAt: now,
    beforePlaceholders,
    afterPlaceholders,
    adoptedCount: adopted.length,
    failedCount: unresolved.length,
    officialAdopted: adopted.filter((candidate) => candidate.officialConfirmed).length,
    supplementalAdopted: adopted.filter((candidate) => !candidate.officialConfirmed).length,
    watermarkRejected: rejected.length,
    qualityRejected: qualityRejected.length,
    qualityRejectedByReason: countBy(qualityRejected, (candidate) => candidate.watermarkReason ?? candidate.reasons[0] ?? "quality-rejected"),
    publicImageScoreThreshold: PUBLIC_IMAGE_SCORE_THRESHOLD,
    heldForLowScore: held.filter((candidate) => !candidate.hasWatermark).length,
    adopted,
    qualityRejectedRows: qualityRejected.slice(0, 120),
    held: held.slice(0, 120),
    unresolved: unresolved.map(toPlaceholderRow)
  };
  fs.writeFileSync(imageCandidateReportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

function visibleFoods(foods: GeneratedFood[]) {
  return foods.filter(
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

function isPlaceholder(food: GeneratedFood) {
  return getFoodImage(food).startsWith("/placeholders/");
}

function toPlaceholderRow(food: GeneratedFood) {
  return {
    foodId: food.id,
    name: food.name,
    category: food.category,
    price: food.price ?? food.priceMin ?? food.locations.find((location) => location.price)?.price ?? null,
    locations: food.locations.map((location) => ({
      shopName: location.shopName,
      areaName: location.areaName,
      price: location.price,
      sourceUrl: location.sourceUrl
    })),
    area: food.area.name,
    sourceUrl: food.sourceUrl,
    reason: food.images.length === 0 ? "no-image-candidate" : food.images.find((image) => !image.enabled)?.imageMismatchReason ?? "no-public-safe-image"
  };
}

function buildCandidateCatalog(report: CrawlRunResult) {
  const candidates: Array<{ sourceName: string; food: CrawledFood; image: CrawledImage }> = [];
  for (const source of report.sources) {
    for (const food of source.foods) {
      for (const image of food.images ?? []) {
        if (!image.imageUrl) continue;
        candidates.push({ sourceName: source.sourceName, food, image });
      }
    }
  }
  return candidates;
}

function scoreCandidate(food: GeneratedFood, candidate: { sourceName: string; food: CrawledFood; image: CrawledImage }): ImageCandidate | undefined {
  const normalizedFood = normalizeFoodName(food.name);
  const normalizedCandidate = normalizeFoodName(candidate.food.name);
  const sim = similarity(food.name, candidate.food.name);
  const sourceText = `${candidate.image.imageUrl} ${candidate.image.sourceUrl ?? ""} ${candidate.image.altText ?? ""} ${candidate.image.caption ?? ""} ${candidate.image.imageSourceContext ?? ""}`;
  if (!/\.(jpe?g|png|webp)(?:[?#].*)?$/i.test(candidate.image.imageUrl)) return undefined;
  if (/(logo|icon|map|hero|mainvisual|kv|restaurant-[abc]|area|attraction|sns|avatar|profile|banner|sprite|app-store|google-play)/i.test(sourceText)) return undefined;
  const officialConfirmed = /^https:\/\/(?:www\.)?usj\.co\.jp\//i.test(candidate.image.imageUrl) || /^https:\/\/(?:www\.)?usj\.co\.jp\//i.test(candidate.image.sourceUrl ?? "");
  const watermarkReason = detectCandidateWatermark(candidate.image);
  const qualityIssue = detectLowQualityProductImage(candidate.image, officialConfirmed);
  const genericFoodName = isGenericImageTargetName(food.name);
  const exactName = normalizedFood === normalizedCandidate;
  const strongName =
    !genericFoodName &&
    (sim >= 0.82 ||
      normalizedFood.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedFood));
  const sameBlock = /Castel article section|same-html-block|same-tcm-product|same-menu-block|near-text-block/i.test(candidate.image.imageMatchReason ?? "");
  const contextName = Boolean(candidate.image.imageSourceContext?.includes(food.name) || candidate.image.altText?.includes(food.name));
  const hasBlockingMismatch =
    Boolean(candidate.image.imageMismatchReason) && candidate.image.imageMismatchReason !== "supplemental-watermark-risk";
  if (!exactName && !strongName && !sameBlock && !contextName) return undefined;
  if (genericFoodName && !exactName) return undefined;
  if (qualityIssue) return undefined;
  if (hasBlockingMismatch) return undefined;
  if (officialConfirmed && !exactName && !strongName && !contextName) return undefined;
  if (!officialConfirmed && (!exactName || !sameBlock)) return undefined;
  const reasons: string[] = [];
  let score = 0;

  if (officialConfirmed) {
    score += 50;
    reasons.push("official +50");
  } else {
    score -= 10;
    reasons.push("supplemental -10");
  }

  if (exactName) {
    score += 40;
    reasons.push("exact name +40");
  } else if (strongName) {
    score += 18;
    reasons.push("strong name match +18");
  } else if (hasImportantTokenOverlap(food.name, candidate.food.name)) {
    score += 10;
    reasons.push("token match +10");
  } else {
    score -= 15;
    reasons.push("partial only -15");
  }

  if (sameShop(food, candidate.food)) {
    score += 15;
    reasons.push("same shop +15");
  }
  if (food.category === candidate.food.category) {
    score += 10;
    reasons.push("same category +10");
  }
  if (isHighResolution(candidate.image)) {
    score += 20;
    reasons.push("high resolution +20");
  }
  if (!watermarkReason) {
    score += 30;
    reasons.push("no watermark signal +30");
  } else {
    score -= 100;
    reasons.push(`watermark ${watermarkReason} -100`);
  }
  if (sameBlock) {
    score += 30;
    reasons.push("same block +30");
  }
  if (contextName) {
    score += 12;
    reasons.push("context name +12");
  }
  if (!officialConfirmed) {
    score -= 10;
    reasons.push("supplemental product-quality caution -10");
  }
  return {
    foodId: food.id,
    foodName: food.name,
    category: food.category,
    imageUrl: candidate.image.imageUrl,
    sourceUrl: candidate.image.sourceUrl ?? candidate.food.sourceUrl,
    sourceName: candidate.sourceName,
    officialConfirmed,
    score: Math.max(0, Math.min(100, score)),
    hasWatermark: Boolean(watermarkReason),
    watermarkReason,
    reasons,
    sourceFoodName: candidate.food.name
  };
}

function scoreRejectedQualityCandidate(food: GeneratedFood, candidate: { sourceName: string; food: CrawledFood; image: CrawledImage }): ImageCandidate | undefined {
  if (!/\.(jpe?g|png|webp)(?:[?#].*)?$/i.test(candidate.image.imageUrl)) return undefined;
  const normalizedFood = normalizeFoodName(food.name);
  const normalizedCandidate = normalizeFoodName(candidate.food.name);
  const sim = similarity(food.name, candidate.food.name);
  const genericFoodName = isGenericImageTargetName(food.name);
  const exactName = normalizedFood === normalizedCandidate;
  const strongName =
    !genericFoodName &&
    (sim >= 0.82 ||
      normalizedFood.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedFood));
  const sameBlock = /Castel article section|same-html-block|same-tcm-product|same-menu-block|near-text-block/i.test(candidate.image.imageMatchReason ?? "");
  const contextName = Boolean(candidate.image.imageSourceContext?.includes(food.name) || candidate.image.altText?.includes(food.name));
  const officialConfirmed = /^https:\/\/(?:www\.)?usj\.co\.jp\//i.test(candidate.image.imageUrl) || /^https:\/\/(?:www\.)?usj\.co\.jp\//i.test(candidate.image.sourceUrl ?? "");
  if (!exactName && !strongName && !sameBlock && !contextName) return undefined;
  if (genericFoodName && !exactName) return undefined;
  if (officialConfirmed && !exactName && !strongName && !contextName) return undefined;
  if (!officialConfirmed && (!exactName || !sameBlock)) return undefined;
  const watermarkReason = detectCandidateWatermark(candidate.image);
  const qualityIssue = detectLowQualityProductImage(candidate.image, officialConfirmed);
  const hasBlockingMismatch =
    Boolean(candidate.image.imageMismatchReason) && candidate.image.imageMismatchReason !== "supplemental-watermark-risk";
  const reason = watermarkReason ?? qualityIssue ?? (hasBlockingMismatch ? candidate.image.imageMismatchReason : undefined);
  if (!reason) return undefined;
  return {
    foodId: food.id,
    foodName: food.name,
    category: food.category,
    imageUrl: candidate.image.imageUrl,
    sourceUrl: candidate.image.sourceUrl ?? candidate.food.sourceUrl,
    sourceName: candidate.sourceName,
    officialConfirmed,
    score: 0,
    hasWatermark: Boolean(watermarkReason),
    watermarkReason: reason,
    reasons: [reason],
    sourceFoodName: candidate.food.name
  };
}

function attachCandidateImage(food: GeneratedFood, candidate: ImageCandidate, now: string) {
  const image: GeneratedImage = {
    id: stableId("image", `${food.id}:${candidate.imageUrl}`),
    foodId: food.id,
    imageUrl: candidate.imageUrl,
    sourceType: candidate.officialConfirmed ? "official" : "placeholder",
    sourceUrl: candidate.sourceUrl,
    altText: food.name,
    alt: food.name,
    imageConfidenceScore: candidate.score,
    imageMatchScore: candidate.score,
    categoryImageMatchScore: 90,
    imageSourceContext: candidate.reasons.join(", "),
    imageMatchReason: `placeholder-replacement:${candidate.sourceName}`,
    imageCandidateScore: candidate.score,
    imageSourceName: candidate.sourceName,
    officialConfirmed: candidate.officialConfirmed,
    imageLastCheckedAt: now,
    hasWatermark: false,
    imageVerified: true,
    isSharedTooMuch: false,
    priority: 1,
    enabled: true
  };
  food.images = [image, ...food.images.filter((current) => current.imageUrl !== candidate.imageUrl)].map((current, index) => ({
    ...current,
    priority: index + 1
  }));
  food.imageUrl = image.imageUrl;
  food.image_url = image.imageUrl;
  food.representativeImageUrl = image.imageUrl;
  food.representative_image_url = image.imageUrl;
  food.trustedPlaceholder = false;
  food.trusted_placeholder = false;
}

function detectCandidateWatermark(image: CrawledImage) {
  const haystack = `${image.imageUrl} ${image.sourceUrl ?? ""} ${image.altText ?? ""} ${image.title ?? ""} ${image.caption ?? ""} ${image.imageSourceContext ?? ""}`.normalize("NFKC");
  if (/instagram|twitter\.com|x\.com|pinterest|cdninstagram|twimg|sns/i.test(haystack)) return "sns-source";
  if (/(?:^|[\s/_-])@[A-Za-z0-9_]{3,}|＠[A-Za-z0-9_]{3,}/.test(haystack)) return "at-user-watermark";
  if (/ウォーターマーク|透かし|転載|photo\s*by|画像提供|撮影|copyright|©|all rights reserved/i.test(haystack)) return "watermark-text-signal";
  if (/watermark|credit|author|avatar|profile/i.test(haystack)) return "watermark-url-signal";
  return undefined;
}

function detectLowQualityProductImage(image: CrawledImage, officialConfirmed: boolean) {
  const haystack = `${image.imageUrl} ${image.altText ?? ""} ${image.title ?? ""} ${image.caption ?? ""} ${image.imageSourceContext ?? ""}`.normalize("NFKC");
  if (/storefront|shopfront|interior|exterior|entrance|food-cart-in-front|cart-in-front|restaurant|display|shelf|showcase|booth|stand|wagon|signboard|menu-board|menu_sign|queue|crowd|people|person|staff|parade|event-visual|mainvisual|hero|kv/i.test(haystack)) {
    return "non-product-scene";
  }
  if (/(集合|外観|店内|陳列|棚|売り場|販売場所|看板|メニュー表|遠景|人物|店頭|ワゴン|カート前|イベント会場)/.test(haystack)) {
    return "non-product-text";
  }
  if (!officialConfirmed && /(?:^|[/-])(left|right|center|centre|middle)(?:[/-]|$)/i.test(image.imageUrl)) {
    return "supplemental-composite-position-image";
  }
  if (!officialConfirmed && /(?:usj-x|collaboration|restaurant-food|experience|gallery|article|castel)/i.test(image.imageUrl) && !/(churro|churitos|churritos|popcorn|drink|soda|latte|cake|burger|pizza|plate|set|meal|turitos|turritos)/i.test(image.imageUrl)) {
    return "supplemental-generic-article-image";
  }
  return undefined;
}

function sameShop(food: GeneratedFood, candidate: CrawledFood) {
  return [food.shop.name, ...food.locations.map((location) => location.shopName)].some((shopName) => shopName !== "店舗未確認" && shopName === candidate.shopName);
}

function isHighResolution(image: CrawledImage) {
  if ((image.width ?? 0) >= 600 || (image.height ?? 0) >= 600) return true;
  return /(?:800x|1200x|original|large|_l\.|-[hl]\.)/i.test(image.imageUrl);
}

function hasImportantTokenOverlap(foodName: string, candidateName: string) {
  const candidate = normalizeFoodName(candidateName);
  const tokens = foodName
    .normalize("NFKC")
    .split(/[・\s~〜、。&/／()（）【】「」!'".-]+/)
    .filter((token) => token.length >= 3 && !/チュリトス|チュロス|ドリンク|セット|フード|メニュー/.test(token));
  return tokens.some((token) => candidate.includes(normalizeFoodName(token)));
}

function isGenericImageTargetName(name: string) {
  const normalized = normalizeFoodName(name);
  return normalized.length <= 4 || /^(ドリンク|フード|セット|ケーキ|スイーツ|チュリトス|ポップコーン)$/.test(normalized);
}

function stableId(prefix: string, value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return `${prefix}-${hash.toString(36)}`;
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

main();
