import * as fs from "node:fs";
import * as path from "node:path";
import type { Area, DisplayQuality, FoodCategory, FoodLocation, FoodStatus, ReviewStatus, Shop, ShopType } from "../../types/domain";
import type { CrawledFood, CrawledImage, CrawlSourceResult } from "../types/crawler";
import type { GeneratedArea, GeneratedDataset, GeneratedFood, GeneratedImage, GeneratedShop } from "../types/generated";
import { categoryLabels } from "../../lib/constants";
import {
  cleanFoodName,
  extractProductNameFromContext,
  inferCategory,
  isBadFoodName,
  isGenericFoodName,
  looksLikeFoodName,
  normalizeFoodName,
  scoreFoodNameQuality,
  similarity,
  splitCompositeMenuName
} from "./normalize-food";
import { inferArea, inferShopType, normalizeShopName } from "./normalize-shop";
import { filterAndRankImages, scoreCategoryImageMatch } from "./image-quality";

type Candidate = {
  food: CrawledFood;
  sourceNames: Set<string>;
  sourceUrls: Set<string>;
  sourceCount: number;
};

type ScoredCandidate = ReturnType<typeof scoreCandidate> & {
  mergedLocations?: Omit<FoodLocation, "id" | "foodId">[];
};

const areaOrder = [
  "スーパー・ニンテンドー・ワールド",
  "ミニオン・パーク",
  "ウィザーディング・ワールド・オブ・ハリー・ポッター",
  "ハリウッド・エリア",
  "ニューヨーク・エリア",
  "ジュラシック・パーク",
  "アミティ・ビレッジ",
  "サンフランシスコ・エリア",
  "ウォーターワールド",
  "ユニバーサル・ワンダーランド",
  "その他"
];

const hardRejectPattern =
  /(詳しくはこちら|閉じる|購入はこちら|チケット|営業時間|アトラクション|キャンペーン|プライバシー|サイトマップ|COOKIE|javascript|function|webpack|chunk-|polyfills|stylesheet|canonical|description|breadcrumb|GDS|SHARED|TCM|コンテンツへ移動|メニュー確認中|クッキーに関する通知)/i;
const foodKeywordPattern =
  /(￥|¥|円|チュリ|チュロ|ポップコーン|ドリンク|ソーダ|ジュース|コーヒー|ラテ|ビール|ケーキ|パフェ|アイス|クッキー|バーガー|サンド|ピザ|チキン|ターキー|ビーフ|ポーク|カレー|ライス|丼|ラーメン|ヌードル|パスタ|セット|プレート|コンボ|スナック|ポテト|フード|メニュー|デザート|スイーツ|フラッペ|シェイク|プリン|ワッフル|burger|pizza|drink|cake|popcorn|churro|menu|food)/i;
const navPattern = /^(メニュー|フード|レストラン|イベント|ニュース|エリア|チケット|詳細|価格|画像|公式|おすすめ|一覧|MAP|マップ)$/i;

export function buildGeneratedDataset(sourceResults: CrawlSourceResult[], now = new Date()): {
  dataset: GeneratedDataset;
  shops: GeneratedShop[];
  areas: GeneratedArea[];
} {
  const checkedAt = getCrawlCheckedAt(now);
  const candidates = mergeCandidates(sourceResults);
  const scored = candidates.map((candidate) => scoreCandidate(candidate, now));
  const deduped = applyDuplicateOverrides(assignDuplicateGroups(scored), buildDuplicateOverridesById());
  const grouped = markSharedImages(backfillVerifiedOfficialImages(backfillVerifiedImagesFromRawSources(deduped, sourceResults)));
  const areas = buildAreas(grouped);
  const shops = buildShops(grouped, areas);
  const foods = grouped.map((item, index) => toGeneratedFood(item, shops, areas, index, checkedAt));

  const summary = {
    totalCandidates: sourceResults.reduce((sum, result) => sum + result.foods.length, 0),
    generatedFoods: foods.length,
    approved: foods.filter((food) => food.reviewStatus === "approved").length,
    pending: foods.filter((food) => food.reviewStatus === "pending").length,
    rejected: foods.filter((food) => food.reviewStatus === "rejected").length,
    hidden: foods.filter((food) => food.hidden).length,
    duplicateHidden: foods.filter((food) => food.hidden && food.duplicateGroupId).length,
    withImages: foods.filter((food) => food.images.some((image) => image.enabled)).length,
    highQuality: foods.filter((food) => food.displayQuality === "high" && food.reviewStatus === "approved" && !food.hidden).length,
    officialImages: foods.filter((food) => food.images.some((image) => image.sourceType === "official" && !image.isSharedTooMuch)).length,
    verifiedOfficialImages: foods.filter((food) => food.images.some((image) => image.enabled && image.sourceType === "official" && image.imageVerified && !image.isSharedTooMuch)).length,
    placeholderImages: foods.filter((food) => food.canonicalFood && !food.images.some((image) => image.enabled && image.sourceType === "official" && !image.isSharedTooMuch)).length,
    imageMismatchExcluded: foods.filter((food) => food.images.some((image) => image.sourceType === "official" && !image.enabled && image.imageMismatchReason)).length,
    nameFiltered: foods.filter((food) => food.rejectionReasons.includes("bad-food-name") || food.rejectionReasons.includes("low-name-quality")).length,
    compositeCandidates: foods.filter((food) => food.compositeMenu).length,
    sharedImages: foods.filter((food) => food.images.some((image) => image.isSharedTooMuch)).length
  };

  return {
    dataset: {
      generatedAt: checkedAt,
      summary,
      foods
    },
    shops,
    areas
  };
}

function getCrawlCheckedAt(now: Date) {
  const asOfDate = process.env.CRAWL_AS_OF_DATE;
  if (asOfDate && /^\d{4}-\d{2}-\d{2}$/.test(asOfDate)) {
    return `${asOfDate}T12:00:00+09:00`;
  }
  return now.toISOString();
}

function mergeCandidates(sourceResults: CrawlSourceResult[]) {
  const map = new Map<string, Candidate>();
  for (const result of sourceResults) {
    for (const food of result.foods) {
      const name = extractProductNameFromContext(food.name, `${food.description ?? ""} ${food.shopName} ${food.areaName}`);
      if (!name) continue;
      const normalizedName = normalizeFoodName(name);
      const shopName = normalizeShopName(food.shopName);
      const key = `${normalizedName}:${shopName}`;
      const current = map.get(key);
      if (current) {
        current.sourceNames.add(result.sourceName);
        current.sourceUrls.add(food.sourceUrl);
        current.sourceCount += 1;
        const mergedImages = mergeRawImages(current.food.images, food.images);
        if (rankRawFood(food) > rankRawFood(current.food)) {
          current.food = {
            ...food,
            images: mergedImages,
            price: food.price ?? current.food.price,
            description: food.description ?? current.food.description,
            officialUrl: food.officialUrl ?? current.food.officialUrl
          };
        } else {
          current.food = {
            ...current.food,
            images: mergedImages,
            price: current.food.price ?? food.price,
            description: current.food.description ?? food.description,
            officialUrl: current.food.officialUrl ?? food.officialUrl
          };
        }
      } else {
        map.set(key, {
          food: { ...food, name, normalizedName },
          sourceNames: new Set([result.sourceName]),
          sourceUrls: new Set([food.sourceUrl]),
          sourceCount: 1
        });
      }
    }
  }
  return [...map.values()];
}

function mergeRawImages(left: CrawledImage[], right: CrawledImage[]) {
  const map = new Map<string, CrawledImage>();
  for (const image of [...left, ...right]) {
    const current = map.get(image.imageUrl);
    if (!current || imageRank(image) > imageRank(current)) map.set(image.imageUrl, image);
  }
  return [...map.values()].sort((a, b) => imageRank(b) - imageRank(a)).slice(0, 10);
}

function rankRawFood(food: CrawledFood) {
  return food.confidence * 100 + food.images.length * 10 + (food.price ? 20 : 0) + (food.shopName !== "店舗未確認" ? 10 : 0);
}

function scoreCandidate(candidate: Candidate, now: Date) {
  const food = { ...candidate.food, shopName: inferShopFromSourceUrl(candidate.food.sourceUrl, candidate.food.shopName) };
  const text = `${food.name} ${food.description ?? ""} ${food.shopName} ${food.areaName} ${food.sourceUrl} ${food.officialUrl ?? ""}`;
  const reasons: string[] = [];
  const nameQualityScore = scoreFoodNameQuality(food.name);
  const composite = splitCompositeMenuName(food.name);
  const normalizedName = normalizeFoodName(food.name);
  const categoryFromName = inferCategory(food.name);
  const category = categoryFromName === "unknown" ? inferCategory(text) : categoryFromName;
  const sanitizedPrice = sanitizeCandidatePrice(food.price, category, text);
  if (food.price && !sanitizedPrice) reasons.push("price-out-of-category-range");
  food.price = sanitizedPrice;
  let score = Math.round(food.confidence * 35);
  const sourceUrls = [...candidate.sourceUrls];
  const hasSupplementalSource = sourceUrls.some((url) => /castel\.jp/i.test(url));
  const hasOfficialSource = sourceUrls.some((url) => /(?:^|\/\/)(?:www\.)?usj\.co\.jp|usjfoodallergy/i.test(url));

  if (food.price) score += 16;
  if (/￥|¥|円/.test(text)) score += 10;
  if (foodKeywordPattern.test(text)) score += 18;
  if (food.images.length > 0) score += 14;
  if (food.shopName && food.shopName !== "店舗未確認") score += 10;
  if (/restaurants|restaurant|レストラン|カフェ/i.test(text)) score += 10;
  if (/menu|メニュー/i.test(text)) score += 8;
  if (candidate.sourceNames.has("official-allergy")) score += 12;
  if (candidate.sourceNames.has("official-restaurants")) score += 14;
  if (candidate.sourceNames.size > 1 || candidate.sourceCount > 1) score += Math.min(16, candidate.sourceNames.size * 6 + candidate.sourceCount);
  if (/\/restaurants\/[^/]+/.test(food.sourceUrl) || /menu/i.test(food.sourceUrl)) score += 8;
  if (food.images.some((image) => image.altText && similarity(food.name, image.altText) >= 0.45)) score += 8;
  if (/メニュー|フード|ドリンク|価格|販売場所/.test(food.description ?? "")) score += 6;

  if (nameQualityScore >= 82) score += 18;
  else if (nameQualityScore >= 60) score += 8;
  else {
    score -= 28;
    reasons.push("low-name-quality");
  }

  if (isBadFoodName(food.name)) {
    score -= 45;
    reasons.push("bad-food-name");
  }
  if (isGenericFoodName(food.name)) {
    score -= 40;
    reasons.push("generic-name");
  }
  if (composite.isComposite) {
    score -= 34;
    reasons.push("composite-menu");
  }

  if (!looksLikeFoodName(food.name)) {
    score -= 30;
    reasons.push("food-name-rule");
  }
  if (/https?:\/\/|www\.|\.js|\.css|\.html|\.json/i.test(food.name)) {
    score -= 35;
    reasons.push("url-or-file");
  }
  if (/[{}[\]<>]|tcm:|href=|src=|class=|ng-|type secondary|shortDescription|description|SEO|heading|pagination|\b(?:true|false)\b/i.test(food.name)) {
    score -= 34;
    reasons.push("html-json-js-fragment");
  }
  if (symbolRatio(food.name) > 0.28) {
    score -= 18;
    reasons.push("too-many-symbols");
  }
  if (hardRejectPattern.test(food.name)) {
    score -= 38;
    reasons.push("navigation-or-system-text");
  }
  if (looksLikeShopNameOnly(food.name, food.shopName)) {
    score -= 42;
    reasons.push("shop-name-only");
  }
  if (/^※/.test(food.name) || /場合があります|ご確認ください|くださいませ/.test(food.name)) {
    score -= 30;
    reasons.push("notice-text");
  }
  if (navPattern.test(food.name.trim())) {
    score -= 35;
    reasons.push("navigation-label");
  }
  if (/^\d{3}\s/.test(food.name) || /^(低アレルゲンメニュー|キッズメニュー|洋食|麺類|ご飯類|パスタ・ピザ|サンドウィッチ・ハンバーガー|プラントベースメニュー|プレミアム\s*アレルギー)/.test(food.name)) {
    score -= 42;
    reasons.push("category-label");
  }
  if (/レストラン\s*フード$/.test(food.name) || /^スーパー・ニンテンドー・ワールド.*(ピットストップ・ポップコーン|ヨッシー・スナック・アイランド).*フード$/.test(food.name)) {
    score -= 42;
    reasons.push("shop-navigation");
  }
  if (/^(ヨッシー・スナック・アイランド|ピットストップ・ポップコーン)TM?$/.test(food.name)) {
    score -= 42;
    reasons.push("shop-name-only");
  }
  if (food.name.length < 4) {
    score -= 20;
    reasons.push("too-short");
  }
  if (food.name.length > 45) {
    score -= 16;
    reasons.push("too-long");
  }
  if (/^(フライドポテト|ソフトドリンク|サラダ|デザート|オレンジドリンク|チキンナゲット)[、(（\s]/.test(food.name) || /付き\s*※/.test(food.name)) {
    score -= 28;
    reasons.push("side-detail");
  }
  if (/^(ソフトドリンク|カップサラダ|サラダ|デザート|フライドポテト|チキンナゲット)$/.test(food.name)) {
    score -= 45;
    reasons.push("accessory-only");
  }
  if (/食べ歩き\s*ポップコーン\s*フード|レストラン。|専門店。|紹介!/.test(food.name)) {
    score -= 32;
    reasons.push("generic-description");
  }
  if ((food.description ?? "").length > 500) {
    score -= 14;
    reasons.push("description-too-noisy");
  }
  if (/イベント|アトラクション|ショー|パレード/.test(food.name) && !foodKeywordPattern.test(food.name)) {
    score -= 24;
    reasons.push("event-not-food");
  }
  if (hasSupplementalSource && !hasOfficialSource) {
    score += 4;
    reasons.push("supplemental-unconfirmed");
  }

  const images = filterAndRankImages(food.images, food.name, category);
  if (food.images.length > 0 && images.filter((image) => image.imageVerified).length === 0) {
    score -= 6;
    reasons.push("images-unverified");
  }

  const areaName = normalizeAreaName(inferArea(food.shopName, text));
  const shopType = inferShopType(food.shopName, text);
  const safeEndDate = getReliableEndDate(food, now);
  const status = normalizeStatus(food.status, food.startDate, safeEndDate, now);
  if (status === "ended") {
    score -= 24;
    reasons.push("ended-before-current-date");
  }
  const clampedScore = Math.max(0, Math.min(100, score));
  const displayQuality = getDisplayQuality(clampedScore, nameQualityScore, reasons, { ...food, images, areaName });
  const reviewStatus = getReviewStatus(clampedScore, reasons, displayQuality);

  return {
    food: {
      ...food,
      normalizedName,
      category,
      areaName,
      shopType,
      endDate: safeEndDate,
      status,
      images,
      isLimited: food.isLimited || category === "seasonal"
    },
    score: clampedScore,
    nameQualityScore,
    displayQuality,
    reviewStatus,
    hidden: reviewStatus === "rejected",
    compositeMenu: composite.isComposite,
    reasons,
    sourceNames: [...candidate.sourceNames].sort(),
    sourceUrls: [...candidate.sourceUrls],
    sourceCount: candidate.sourceCount,
    duplicateGroupId: undefined as string | undefined
  };
}

function getReliableEndDate(food: CrawledFood, now: Date) {
  if (!food.endDate) return undefined;
  if (food.startDate && food.endDate < food.startDate) return undefined;
  const today = now.toISOString().slice(0, 10);
  const sourceUrl = food.sourceUrl ?? "";
  const isCurrentRestaurantSource = /\/(?:web|tridiondata\/usj)\/ja\/jp\/restaurants\//.test(sourceUrl);
  const isCompanyNewsOrArchivedFood = /\/company\/news\/20|\/food\/winter20/i.test(sourceUrl);
  if (food.endDate < today && isCurrentRestaurantSource && !isCompanyNewsOrArchivedFood) return undefined;
  return food.endDate;
}

function inferShopFromSourceUrl(sourceUrl: string, fallback: string) {
  const slugMap: Record<string, string> = {
    "kinopios-cafe": "キノピオ・カフェ",
    "yoshis-snack-island": "ヨッシー・スナック・アイランド",
    "pit-stop-popcorn": "ピットストップ・ポップコーン",
    "three-broomsticks": "三本の箒",
    "studio-stars-restaurant": "スタジオ・スターズ・レストラン",
    "mels-drive-in": "メルズ・ドライブイン",
    "discovery-restaurant": "ディスカバリー・レストラン",
    "amity-landing-restaurant": "アミティ・ランディング・レストラン",
    "louies-ny-pizza-parlor": "ルイズN.Y.ピザパーラー",
    "happiness-cafe": "ハピネス・カフェ",
    "snoopy-backlot-cafe": "スヌーピー・バックロット・カフェ",
    "hello-kitty-corner-cafe": "ハローキティのコーナーカフェ",
    "beverly-hills-boulangerie": "ビバリーヒルズ・ブランジェリー",
    "park-side-grille": "パークサイド・グリル",
    "saido": "SAIDO",
    "the-dragons-pearl": "ザ・ドラゴンズ・パール",
    "fossil-fuels": "フォッシル・フュエルズ",
    "boardwalk-snack": "ボードウォーク・スナック",
    "amity-ice-cream": "アミティ・アイスクリーム",
    "delicious-me-the-cookie-kitchen": "デリシャス・ミー！ザ・クッキー・キッチン",
    "mario-cafe-and-store": "マリオ・カフェ&ストア"
  };
  const matched = Object.entries(slugMap).find(([slug]) => sourceUrl.includes(`/restaurants/${slug}/`) || sourceUrl.includes(`/restaurants/${slug}/index`));
  if (matched) return matched[1];
  return fallback && fallback !== "店舗未確認" ? normalizeShopName(fallback) : fallback;
}

function getDisplayQuality(score: number, nameQualityScore: number, reasons: string[], food: CrawledFood): DisplayQuality {
  const hardVisibleBlockers = [
    "bad-food-name",
    "low-name-quality",
    "generic-name",
    "composite-menu",
    "html-json-js-fragment",
    "navigation-or-system-text",
    "shop-name-only",
    "side-detail",
    "generic-description",
    "category-label",
    "shop-navigation",
    "accessory-only",
    "ended-before-current-date"
  ];
  const hasUsefulSource = Boolean(food.sourceUrl);
  const hasGoodImage = food.images.some((image) => !image.imageMismatchReason && (image.imageVerified || (image.sourceType !== "official" && (image.imageConfidenceScore ?? 0) >= 38)));
  const hasPlace =
    food.shopName !== "店舗未確認" ||
    (food.areaName !== "エリア未確認" && food.areaName !== "その他") ||
    hasGoodImage ||
    /castel\.jp/i.test(food.sourceUrl);
  if (hardVisibleBlockers.some((reason) => reasons.includes(reason))) return "low";
  if (score >= 82 && nameQualityScore >= 78 && hasUsefulSource && hasPlace) {
    return hasGoodImage || food.images.length === 0 ? "high" : "medium";
  }
  if (score >= 45 && nameQualityScore >= 60 && hasUsefulSource && hasPlace) return "medium";
  return "low";
}

function getReviewStatus(score: number, reasons: string[], displayQuality: DisplayQuality): ReviewStatus {
  const hardReasons = [
    "html-json-js-fragment",
    "navigation-or-system-text",
    "shop-name-only",
    "notice-text",
    "url-or-file",
    "accessory-only",
    "category-label",
    "shop-navigation"
  ];
  if ((displayQuality === "high" || displayQuality === "medium") && score >= 45 && !hardReasons.some((reason) => reasons.includes(reason))) return "approved";
  if (score >= 25) return "pending";
  return "rejected";
}

function sanitizeCandidatePrice(price: number | undefined, category: FoodCategory, text: string) {
  if (!price) return undefined;
  if (!Number.isFinite(price) || price < 50) return undefined;
  const normalized = text.normalize("NFKC");
  if (/(チュリトス|チュロス|churro)/i.test(normalized) && price > 1600) return undefined;
  if (/(ポップコーン|popcorn)/i.test(normalized) && !/(バケツ|バケット|ケース|コレクタブル)/.test(normalized) && price > 1800) return undefined;
  if (/(ドリンク|ソーダ|ラテ|ジュース|コーヒー|スムージー|フローズン|シェイク|ビール)/i.test(normalized) && price > 2500) return undefined;
  if (category === "churro" && price > 1600) return undefined;
  if (category === "popcorn" && !/(バケツ|バケット|ケース|コレクタブル)/.test(normalized) && price > 1800) return undefined;
  if (category === "drink" && price > 2500) return undefined;
  if (["dessert", "snack", "chicken", "burger", "pizza", "rice", "noodle", "kids"].includes(category) && price > 6000) return undefined;
  if (price > 12000 && !/(コース|シェア|ボトル|バケット|バケツ)/.test(normalized)) return undefined;
  return price;
}

function looksLikeShopNameOnly(name: string, shopName: string) {
  const normalizedName = normalizeFoodName(name);
  const normalizedShop = normalizeFoodName(shopName);
  if (normalizedShop && normalizedName === normalizedShop) return true;
  if (
    /^(?:アミティ・アイスクリーム|ルイズ\s*N\.?Y\.?\s*ピザパーラー|ビバリーヒルズ・ブランジェリー|スタジオ・スターズ・レストラン|スヌーピー・バックロット・カフェ|ハローキティのコーナーカフェ|メルズ・ドライブイン|ディスカバリー・レストラン|アミティ・ランディング・レストラン|ハピネス・カフェ|フォッシル・フュエルズ|ボードウォーク・スナック|デリシャス・ミー！ザ・クッキー・キッチン|キノピオ・カフェ|ヨッシー・スナック・アイランド|ピットストップ・ポップコーン|三本の箒|マリオ・カフェ&ストア)$/.test(name)
  ) {
    return true;
  }
  if (/^(?:\d+\s+)?[ァ-ヶー一-龠A-Za-z0-9 .&！!・･-]{2,34}(?:レストラン|カフェ|キッチン|パーラー|グリル|ストア|ショップ|ワーフ|ランディング|アイスクリーム|ポップコーン|スナック|ダイナー|テラス|ラグーン)\s+(?:スーパー・ニンテンドー・ワールド|ミニオン・パーク|ウィザーディング・ワールド・オブ・ハリー・ポッター|ハリウッド・エリア|ニューヨーク・エリア|ジュラシック・パーク|アミティ・ビレッジ|サンフランシスコ・エリア|ウォーターワールド|ユニバーサル・ワンダーランド)$/.test(name)) {
    return true;
  }
  if (/(レストラン|カフェ|キッチン|パーラー|グリル|ストア|ワーフ|ランディング|アイスクリーム|ポップコーン|スナック|カート|ワゴン)$/.test(name)) {
    return !/(セット|プレート|バーガー|ピザ|チキン|ターキー|ドリンク|ケーキ|チュリ|ポップコーンバケツ|ライス|カレー|パフェ|アイス|サンド|¥|￥|円)/.test(name);
  }
  return false;
}

function assignDuplicateGroups<T extends ScoredCandidate>(items: T[]) {
  const sorted = [...items].sort((a, b) => b.score - a.score);
  const groups: T[][] = [];
  const bucketMap = new Map<string, T[][]>();
  for (const item of sorted) {
    const bucketKey = duplicateBucketKey(item);
    const bucket = bucketMap.get(bucketKey) ?? [];
    const existingGroup = bucket.find((group) => {
      const rep = group[0].food;
      const sameCategory = rep.category === item.food.category || rep.category === "unknown" || item.food.category === "unknown";
      const nameClose = rep.normalizedName === item.food.normalizedName || maybeSimilar(rep.normalizedName, item.food.normalizedName, rep.name, item.food.name);
      const imageOverlap = rep.images.some((image) => item.food.images.some((other) => other.imageUrl === image.imageUrl));
      const sameVariant = variantKey(rep.name, rep.description, rep.sourceUrl, rep.category, rep.isLimited) === variantKey(item.food.name, item.food.description, item.food.sourceUrl, item.food.category, item.food.isLimited);
      return nameClose && sameCategory && sameVariant && (mergeablePrice(rep.price, item.food.price) || imageOverlap);
    });
    if (existingGroup) existingGroup.push(item);
    else {
      const group = [item];
      groups.push(group);
      bucket.push(group);
      bucketMap.set(bucketKey, bucket);
    }
  }

  groups.forEach((group, groupIndex) => {
    group.sort((a, b) => representativeRank(b) - representativeRank(a));
    const locations = buildMergedLocations(group);
    const images = mergeRepresentativeImages(group);
    const groupId = group.length > 1 ? `dup-${String(groupIndex + 1).padStart(5, "0")}` : undefined;
    group.forEach((item, index) => {
      item.duplicateGroupId = groupId;
      item.mergedLocations = locations;
      if (index > 0) item.hidden = true;
    });
    group[0].food.images = images;
    group[0].sourceNames = Array.from(new Set(group.flatMap((item) => item.sourceNames))).sort();
    group[0].sourceUrls = Array.from(new Set(group.flatMap((item) => item.sourceUrls)));
    group[0].sourceCount = group.reduce((sum, item) => sum + item.sourceCount, 0);
  });

  return sorted;
}

type DuplicateOverride = {
  canonicalId: string;
  duplicateIds: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildDuplicateOverridesById() {
  const overrides = readDuplicateOverrides();
  const map = new Map<string, { override: DuplicateOverride; role: "canonical" | "duplicate" }>();
  for (const override of overrides) {
    map.set(override.canonicalId, { override, role: "canonical" });
    for (const duplicateId of override.duplicateIds) {
      map.set(duplicateId, { override, role: "duplicate" });
    }
  }
  return map;
}

function readDuplicateOverrides(): DuplicateOverride[] {
  const filePath = path.resolve(process.cwd(), "data/duplicate-overrides.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown;
  if (!Array.isArray(raw)) throw new Error("data/duplicate-overrides.json must contain an array");
  return raw.map((entry) => {
    if (!isRecord(entry)) throw new Error("duplicate override entries must be objects");
    const canonicalId = typeof entry.canonicalId === "string" ? entry.canonicalId : "";
    const duplicateIds = Array.isArray(entry.duplicateIds) ? entry.duplicateIds.filter((id): id is string => typeof id === "string") : [];
    if (!canonicalId || duplicateIds.length === 0) throw new Error("duplicate override entries require canonicalId and duplicateIds");
    return { canonicalId, duplicateIds };
  });
}

function applyDuplicateOverrides<T extends ScoredCandidate>(
  items: T[],
  overridesById: Map<string, { override: DuplicateOverride; role: "canonical" | "duplicate" }>
) {
  if (overridesById.size === 0) return items;

  const itemsById = new Map<string, T>();
  for (const item of items) {
    const id = generatedFoodIdForItem(item);
    if (overridesById.has(id)) itemsById.set(id, item);
  }

  const overrides = new Set(Array.from(overridesById.values()).map((entry) => entry.override));
  for (const override of overrides) {
    const canonical = itemsById.get(override.canonicalId);
    if (!canonical) {
      warnMissingDuplicateOverride("canonicalId", override.canonicalId);
      continue;
    }
    const groupId = `override-${override.canonicalId}`;
    canonical.hidden = false;
    canonical.duplicateGroupId = groupId;
    for (const duplicateId of override.duplicateIds) {
      const duplicate = itemsById.get(duplicateId);
      if (!duplicate) {
        warnMissingDuplicateOverride("duplicateId", duplicateId);
        continue;
      }
      duplicate.hidden = true;
      duplicate.duplicateGroupId = groupId;
    }
  }

  return items;
}

function warnMissingDuplicateOverride(role: "canonicalId" | "duplicateId", id: string) {
  console.warn(`[duplicate-overrides] ${role} not found in current dataset; skipping: ${id}`);
}

function generatedFoodIdForItem(item: ScoredCandidate) {
  const areaId = stableId("area", item.food.areaName || "その他");
  const shopId = stableId("shop", `${areaId}:${normalizeShopName(item.food.shopName)}`);
  return stableId("food", `${shopId}:${item.food.normalizedName}:${item.food.sourceUrl}`);
}

function markSharedImages<T extends ReturnType<typeof scoreCandidate>>(items: T[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.hidden) continue;
    for (const image of item.food.images) counts.set(image.imageUrl, (counts.get(image.imageUrl) ?? 0) + 1);
  }
  for (const item of items) {
    item.food.images = item.food.images
      .map((image) => {
        const isSharedTooMuch = (counts.get(image.imageUrl) ?? 0) >= 5;
        const imageConfidenceScore = Math.max(0, (image.imageConfidenceScore ?? 40) - (isSharedTooMuch ? 45 : 0));
        return {
          ...image,
          imageConfidenceScore,
          imageVerified: image.imageVerified && !isSharedTooMuch && !image.imageMismatchReason,
          imageMismatchReason: isSharedTooMuch ? "shared-image-used-by-5-or-more-foods" : image.imageMismatchReason,
          isSharedTooMuch,
          priority: (image.priority ?? 50) + (isSharedTooMuch ? 80 : 0)
        };
      })
      .filter((image) => !image.isSharedTooMuch && (image.imageConfidenceScore ?? 0) >= 30)
      .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))
      .slice(0, 4);
    if (item.displayQuality === "high" && item.food.images.some((image) => image.isSharedTooMuch)) item.displayQuality = "medium";
  }
  return items;
}

function backfillVerifiedOfficialImages<T extends ReturnType<typeof scoreCandidate>>(items: T[]) {
  const catalog = buildOfficialImageCatalog(items);
  for (const item of items) {
    if (item.food.images.some((image) => image.imageVerified && !image.imageMismatchReason)) continue;
    if (item.reviewStatus !== "approved" || item.displayQuality === "low" || item.hidden || item.nameQualityScore < 60) continue;
    const match = findOfficialImageBackfill(item, catalog);
    if (!match) continue;
    item.food.images = [
      {
        ...match.image,
        sourceType: "official",
        imageConfidenceScore: Math.max(match.image.imageConfidenceScore ?? 0, match.score),
        imageMatchScore: match.score,
        categoryImageMatchScore: match.categoryScore,
        imageVerified: true,
        imageMatchReason: `official-filename-product-match:${match.reasons.join(",")}`,
        imageMismatchReason: undefined,
        isSharedTooMuch: false,
        priority: 1
      },
      ...item.food.images.filter((image) => image.imageUrl !== match.image.imageUrl)
    ].slice(0, 4);
    item.reasons = item.reasons.filter((reason) => reason !== "images-unverified");
  }
  return items;
}

function backfillVerifiedImagesFromRawSources<T extends ReturnType<typeof scoreCandidate>>(items: T[], sourceResults: CrawlSourceResult[]) {
  const rawImageMap = buildRawImageMap(sourceResults);
  for (const item of items) {
    if (item.food.images.some((image) => image.imageVerified && !image.imageMismatchReason)) continue;
    if (item.reviewStatus !== "approved" || item.displayQuality === "low" || item.hidden || item.nameQualityScore < 60) continue;
    const rawImages = rawImageMap.get(item.food.normalizedName) ?? [];
    if (rawImages.length === 0) continue;
    const verified = filterAndRankImages(rawImages, item.food.name, item.food.category)
      .filter((image) => image.imageVerified && !image.imageMismatchReason && /^https:\/\/www\.usj\.co\.jp\/tridiondata\//i.test(image.imageUrl))
      .sort((a, b) => imageRank(b) - imageRank(a));
    const match = verified[0];
    if (!match) continue;
    item.food.images = [
      {
        ...match,
        sourceType: "official",
        imageVerified: true,
        imageMatchReason: `raw-source-name-match:${match.imageMatchReason ?? "verified"}`,
        imageMismatchReason: undefined,
        isSharedTooMuch: false,
        priority: 1
      },
      ...item.food.images.filter((image) => image.imageUrl !== match.imageUrl)
    ].slice(0, 4);
    item.reasons = item.reasons.filter((reason) => reason !== "images-unverified");
  }
  return items;
}

function buildRawImageMap(sourceResults: CrawlSourceResult[]) {
  const map = new Map<string, CrawledImage[]>();
  for (const result of sourceResults) {
    for (const food of result.foods) {
      if (food.images.length === 0) continue;
      if (/castel\.jp/i.test(food.sourceUrl)) continue;
      const productName = extractProductNameFromContext(food.name, `${food.description ?? ""} ${food.shopName} ${food.areaName}`);
      if (!productName || isBadFoodName(productName)) continue;
      const key = normalizeFoodName(productName);
      const officialImages = food.images.filter((image) => /^https:\/\/www\.usj\.co\.jp\/tridiondata\//i.test(image.imageUrl) && !/(castel|watermark|透かし|sns|hero|mainvisual|restaurant-[abc]|area|attraction)/i.test(`${image.imageUrl} ${image.altText ?? ""} ${image.caption ?? ""}`));
      if (officialImages.length === 0) continue;
      map.set(key, mergeRawImages(map.get(key) ?? [], officialImages));
    }
  }
  return map;
}

function buildOfficialImageCatalog<T extends ReturnType<typeof scoreCandidate>>(items: T[]) {
  const map = new Map<string, CrawledImage>();
  for (const item of items) {
    for (const image of item.food.images) {
      if (!image.imageUrl || image.sourceType === "placeholder") continue;
      if (!/^https:\/\/www\.usj\.co\.jp\/tridiondata\//i.test(image.imageUrl)) continue;
      if (image.isSharedTooMuch) continue;
      if (/(logo|icon|map|hero|mainvisual|kv|restaurant-[abc]|area|attraction|sns|castel|watermark|透かし)/i.test(`${image.imageUrl} ${image.altText ?? ""} ${image.caption ?? ""}`)) continue;
      const current = map.get(image.imageUrl);
      if (!current || imageRank(image) > imageRank(current)) map.set(image.imageUrl, image);
    }
  }
  return [...map.values()];
}

function findOfficialImageBackfill<T extends ReturnType<typeof scoreCandidate>>(item: T, catalog: CrawledImage[]) {
  const matches = catalog
    .map((image) => scoreOfficialImageBackfill(item, image))
    .filter((match): match is NonNullable<typeof match> => Boolean(match))
    .sort((a, b) => b.score - a.score);
  return matches[0];
}

function scoreOfficialImageBackfill<T extends ReturnType<typeof scoreCandidate>>(item: T, image: CrawledImage) {
  const urlText = image.imageUrl.toLowerCase();
  const contextText = `${image.altText ?? ""} ${image.title ?? ""} ${image.caption ?? ""} ${image.imageSourceContext ?? ""}`.normalize("NFKC");
  const categoryScore = scoreCategoryImageMatch(`${urlText} ${contextText.toLowerCase()}`, item.food.category);
  if (categoryScore < 70) return undefined;
  const productSignals = productImageSignals(item.food.name, item.food.category);
  const matchedUrlSignals = productSignals.filter((signal) => signal.test(urlText));
  const matchedContextSignals = productSignals.filter((signal) => signal.test(contextText.toLowerCase()));
  const exactContext = contextText.includes(item.food.name) || normalizeFoodName(contextText).includes(item.food.normalizedName);
  const sameOfficialSection = image.sourceUrl === item.food.sourceUrl || sameRestaurantFamily(image.sourceUrl, item.food.sourceUrl);
  if (matchedUrlSignals.length === 0 && !exactContext) return undefined;
  let score = 0;
  const reasons: string[] = [];
  if (sameOfficialSection) {
    score += 20;
    reasons.push("same-source");
  }
  if (exactContext) {
    score += 24;
    reasons.push("context-name");
  }
  if (matchedUrlSignals.length > 0) {
    score += Math.min(46, matchedUrlSignals.length * 18 + 10);
    reasons.push(`filename-signals:${matchedUrlSignals.length}`);
  } else if (matchedContextSignals.length > 0 && exactContext) {
    score += 18;
    reasons.push(`exact-context-signals:${matchedContextSignals.length}`);
  }
  if (/offercard|gallery|food|menu|gds-images/i.test(urlText)) {
    score += 14;
    reasons.push("official-food-url");
  }
  if (categoryScore >= 90) score += 16;
  else score += 8;
  if (/gallery-[ab]\.jpg|offercard-[a-z]\.jpg/i.test(urlText)) score += 8;
  if (/recommended|hero|mainvisual|restaurant|logo|page-title|path-|utility|map|experience-image/i.test(urlText) && matchedUrlSignals.length === 0) score -= 55;
  if (image.imageMismatchReason && !/ambiguous-tcm-component/.test(image.imageMismatchReason)) score -= 28;
  if (score < 82) return undefined;
  return { image, score: Math.min(100, score), categoryScore, reasons };
}

function sameRestaurantFamily(left?: string, right?: string) {
  if (!left || !right) return false;
  const normalize = (value: string) => value.replace(/^https:\/\/www\.usj\.co\.jp\/(?:web\/ja\/jp|tridiondata\/usj\/ja\/jp)\//, "").replace(/\/index\.html$/, "");
  const leftPath = normalize(left);
  const rightPath = normalize(right);
  return leftPath.split("/").slice(0, 3).join("/") === rightPath.split("/").slice(0, 3).join("/");
}

function productImageSignals(name: string, category: FoodCategory) {
  const normalized = name.normalize("NFKC").toLowerCase();
  const signals: RegExp[] = [];
  const add = (pattern: RegExp) => signals.push(pattern);
  const dictionary: Array<[RegExp, RegExp[]]> = [
    [/サーティーワン|31/, [/baskin-robbins|popping-shower|love-potion31/]],
    [/怪盗キッド|キッド/, [/kid-the-phantom-thief|phantom-thief|detective-conan/]],
    [/ホワイトグレープ/, [/white-grape/]],
    [/ウィキッド/, [/wicked/]],
    [/ピーナッツバター/, [/peanut-butter/]],
    [/キャラメル/, [/caramel/]],
    [/ミニオン/, [/minion/]],
    [/チョコバナナ|バナナ/, [/choco-banana|banana/]],
    [/ハローキティ|キティ/, [/hello-kitty|kitty/]],
    [/アップル|りんご|リンゴ/, [/apple/]],
    [/マリオ/, [/mario/]],
    [/スーパー.?スター|スーパースター/, [/super-star|superstar/]],
    [/ヨッシー/, [/yoshi/]],
    [/ピーチ/, [/peach/]],
    [/ケーキ/, [/cake/]],
    [/パイ/, [/pie/]],
    [/ティラミス/, [/tiramisu/]],
    [/マンゴー/, [/mango/]],
    [/ターキー/, [/turkey/]],
    [/バーガー/, [/burger/]],
    [/ピザ/, [/pizza/]],
    [/カレー/, [/curry/]],
    [/チキン/, [/chicken/]],
    [/ホットドッグ|ドッグ/, [/hot-?dog|dog/]],
    [/バタービール/, [/butterbeer|butter-beer/]],
    [/パンプキン/, [/pumpkin/]]
  ];
  for (const [namePattern, urlPatterns] of dictionary) {
    if (namePattern.test(normalized)) urlPatterns.forEach(add);
  }
  return signals;
}

function duplicateBucketKey(item: ReturnType<typeof scoreCandidate>) {
  return `${item.food.category}:${item.food.normalizedName.slice(0, 4)}`;
}

function maybeSimilar(leftNormalized: string, rightNormalized: string, leftName: string, rightName: string) {
  const lengthDiff = Math.abs(leftNormalized.length - rightNormalized.length);
  if (lengthDiff > Math.max(3, Math.floor(Math.max(leftNormalized.length, rightNormalized.length) * 0.2))) return false;
  if (leftNormalized[0] !== rightNormalized[0]) return false;
  return similarity(leftName, rightName) >= 0.9;
}

function variantKey(name: string, description = "", sourceUrl = "", category: FoodCategory, isLimited = false) {
  const attributes = extractVariantAttributes(name, description, sourceUrl, category, isLimited);
  return [
    normalizeFoodName(attributes.baseName),
    normalizeFoodName(attributes.flavor ?? ""),
    normalizeFoodName(attributes.eventName ?? ""),
    normalizeFoodName(attributes.collaborationName ?? ""),
    normalizeFoodName(attributes.seasonalVersion ?? "")
  ].join(":");
}

function mergeablePrice(left?: number, right?: number) {
  if (!left || !right) return true;
  return left === right;
}

function representativeRank(item: ScoredCandidate) {
  const imageScore = Math.max(0, ...item.food.images.map((image) => (image.imageVerified ? image.imageMatchScore ?? 0 : 0)));
  return item.score * 2 + item.nameQualityScore + imageScore + (item.food.price ? 8 : 0);
}

function buildMergedLocations(group: ScoredCandidate[]): Omit<FoodLocation, "id" | "foodId">[] {
  const map = new Map<string, Omit<FoodLocation, "id" | "foodId">>();
  for (const item of group) {
    const shopName = normalizeShopName(item.food.shopName);
    const areaName = normalizeAreaName(item.food.areaName);
    const key = `${normalizeFoodName(shopName)}:${areaName}`;
    const existing = map.get(key);
    const location = {
      shopName,
      areaName,
      shopType: item.food.shopType as ShopType,
      sourceUrl: item.food.sourceUrl,
      price: item.food.price,
      status: item.food.status,
      startDate: item.food.startDate,
      endDate: item.food.endDate,
      lastCheckedAt: new Date().toISOString()
    };
    if (!existing || existing.shopName === "店舗未確認") map.set(key, location);
  }
  const locations = [...map.values()];
  const hasKnownLocation = locations.some((location) => location.shopName !== "店舗未確認");
  return locations.filter((location) => !hasKnownLocation || location.shopName !== "店舗未確認").sort((a, b) => {
    const aKnown = Number(a.shopName !== "店舗未確認");
    const bKnown = Number(b.shopName !== "店舗未確認");
    return bKnown - aKnown || a.areaName.localeCompare(b.areaName, "ja") || a.shopName.localeCompare(b.shopName, "ja");
  });
}

function summarizePrice(primaryPrice: number | undefined, locations: FoodLocation[]) {
  const pricedLocations = locations.filter((location) => typeof location.price === "number" && location.price > 0);
  const values = [...new Set([primaryPrice, ...pricedLocations.map((location) => location.price)].filter((value): value is number => typeof value === "number" && value > 0))].sort((a, b) => a - b);
  const priceMin = values[0];
  const priceMax = values.at(-1);
  const sourceLocation = pricedLocations.find((location) => location.price === priceMin) ?? pricedLocations[0];
  return {
    price: priceMin,
    priceMin,
    priceMax,
    priceNote: priceMin && priceMax && priceMin !== priceMax ? "販売場所により価格が異なる可能性があります" : undefined,
    priceSourceUrl: sourceLocation?.sourceUrl,
    priceLastCheckedAt: sourceLocation?.lastCheckedAt,
    priceConfidenceScore: priceMin ? (sourceLocation ? 82 : 72) : undefined
  };
}

function inferDiningType(food: CrawledFood, locations: FoodLocation[]) {
  const text = `${food.name} ${food.description ?? ""} ${food.shopName} ${food.areaName} ${food.sourceUrl}`.normalize("NFKC");
  const hasCart = locations.some((location) => location.shopType === "cart" || location.shopType === "wagon") || /フードカート|ワゴン|カート|スナックカート|ポップコーンカート|チュリトス.?カート/i.test(text);
  if (hasCart) {
    return { diningType: "food_cart" as const, diningTypeConfidenceScore: 92, diningTypeReason: "販売場所がカート/ワゴン系" };
  }
  if (/チュリトス|チュロス|ポップコーン|ターキーレッグ|ホットドッグ|まん|ドリンク|ソーダ|ラテ|ジュース|スムージー|フローズン|食べ歩き|テイクアウト|to go|持ち歩き/i.test(text)) {
    return { diningType: "takeout" as const, diningTypeConfidenceScore: 82, diningTypeReason: "食べ歩きしやすい商品カテゴリ" };
  }
  if (/レストラン|カフェ|グリル|プレート|セット|コース|店内|席|イートイン/i.test(text) || food.shopType === "restaurant") {
    return { diningType: "eat_in" as const, diningTypeConfidenceScore: 76, diningTypeReason: "レストラン/店内飲食系" };
  }
  return { diningType: "unknown" as const, diningTypeConfidenceScore: 35, diningTypeReason: "判定材料不足" };
}

function mergeRepresentativeImages(group: ScoredCandidate[]): CrawledImage[] {
  const map = new Map<string, CrawledImage>();
  for (const item of group) {
    for (const image of item.food.images) {
      const current = map.get(image.imageUrl);
      if (!current || imageRank(image) > imageRank(current)) map.set(image.imageUrl, image);
    }
  }
  return [...map.values()].sort((a, b) => imageRank(b) - imageRank(a)).slice(0, 4);
}

function imageRank(image: CrawledImage & { enabled?: boolean }) {
  return (
    Number(image.enabled) * 1000 +
    Number(image.imageVerified && !image.imageMismatchReason) * 500 +
    (image.imageMatchScore ?? 0) * 4 +
    (image.categoryImageMatchScore ?? 0) +
    (image.imageConfidenceScore ?? 0) -
    (image.isSharedTooMuch ? 500 : 0)
  );
}

function buildAreas(items: ReturnType<typeof assignDuplicateGroups>) {
  const map = new Map<string, GeneratedArea>();
  for (const name of areaOrder) {
    const id = stableId("area", name);
    map.set(name, { id, name, sortOrder: areaOrder.indexOf(name) + 1, foodCount: 0 });
  }
  for (const item of items) {
    const name = item.food.areaName || "その他";
    const current = map.get(name) ?? { id: stableId("area", name), name, sortOrder: 999, foodCount: 0 };
    if (item.reviewStatus === "approved" && item.displayQuality !== "low" && !item.hidden && item.nameQualityScore >= 60) current.foodCount += 1;
    map.set(name, current);
  }
  return [...map.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"));
}

function buildShops(items: ReturnType<typeof assignDuplicateGroups>, areas: GeneratedArea[]) {
  const areaMap = new Map(areas.map((area) => [area.name, area]));
  const map = new Map<string, GeneratedShop>();
  for (const item of items) {
    const shopName = normalizeShopName(item.food.shopName);
    const area = areaMap.get(item.food.areaName) ?? areaMap.get("その他") ?? areas[0];
    const id = stableId("shop", `${area.id}:${shopName}`);
    const current = map.get(id) ?? {
      id,
      areaId: area.id,
      name: shopName,
      type: item.food.shopType as ShopType,
      officialUrl: item.food.officialUrl,
      isActive: true,
      foodCount: 0
    };
    if (current.type === "unknown" && item.food.shopType !== "unknown") current.type = item.food.shopType;
    if (!current.officialUrl && item.food.officialUrl) current.officialUrl = item.food.officialUrl;
    if (item.reviewStatus === "approved" && item.displayQuality !== "low" && !item.hidden && item.nameQualityScore >= 60) current.foodCount += 1;
    map.set(id, current);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

function toGeneratedFood(
  item: ScoredCandidate,
  shops: GeneratedShop[],
  areas: GeneratedArea[],
  index: number,
  lastCheckedAt: string
): GeneratedFood {
  const area = areas.find((candidate) => candidate.name === item.food.areaName) ?? areas.find((candidate) => candidate.name === "その他") ?? areas[0];
  const shop = shops.find((candidate) => candidate.name === normalizeShopName(item.food.shopName) && candidate.areaId === area.id) ?? shops[0];
  const id = stableId("food", `${shop?.id}:${item.food.normalizedName}:${item.food.sourceUrl}`);
  const images: GeneratedImage[] = item.food.images.map((image, imageIndex) => ({
    id: stableId("image", `${id}:${image.imageUrl}`),
    foodId: id,
    imageUrl: image.imageUrl,
    sourceType: image.sourceType ?? "official",
    sourceUrl: image.sourceUrl ?? item.food.sourceUrl,
    altText: image.altText,
    alt: image.altText,
    width: image.width,
    height: image.height,
    imageConfidenceScore: image.imageConfidenceScore,
    imageMatchScore: image.imageMatchScore,
    categoryImageMatchScore: image.categoryImageMatchScore,
    imageSourceContext: image.imageSourceContext,
    imageMatchReason: image.imageMatchReason,
    imageMismatchReason: image.imageMismatchReason,
    imageVerified: Boolean(image.imageVerified && !image.imageMismatchReason && !image.isSharedTooMuch),
    isSharedTooMuch: image.isSharedTooMuch ?? false,
    priority: image.priority ?? imageIndex + 20,
    enabled: !image.isSharedTooMuch && !image.imageMismatchReason && (image.sourceType !== "official" || image.imageVerified === true) && (image.imageMatchScore ?? 0) >= 70
  }));
  const imageUrl = images.find((image) => image.enabled)?.imageUrl;
  const attributes = extractVariantAttributes(item.food.name, item.food.description, item.food.sourceUrl, item.food.category, item.food.isLimited);
  const canonicalGroupId = stableId("group", `${item.food.category}:${normalizeFoodName(attributes.baseName)}`);
  const canonicalFood =
    item.reviewStatus === "approved" &&
    item.displayQuality !== "low" &&
    !item.hidden &&
    item.nameQualityScore >= 60 &&
    !item.compositeMenu &&
    Boolean(item.food.sourceUrl);
  const generatedArea: Area = { id: area.id, name: area.name, sortOrder: area.sortOrder };
  const generatedShop: Shop = {
    id: shop?.id ?? stableId("shop", "unknown"),
    areaId: area.id,
    name: shop?.name ?? "店舗未確認",
    type: shop?.type ?? "unknown",
    officialUrl: shop?.officialUrl,
    isActive: true
  };
  const locations: FoodLocation[] = (item.mergedLocations ?? [
    {
      shopName: generatedShop.name,
      areaName: generatedArea.name,
      shopType: generatedShop.type,
      sourceUrl: item.food.sourceUrl,
      price: item.food.price,
      status: item.food.status,
      startDate: item.food.startDate,
      endDate: item.food.endDate,
      lastCheckedAt
    }
  ]).map((location, locationIndex) => ({
    id: stableId("location", `${id}:${location.shopName}:${location.areaName}:${location.sourceUrl ?? ""}:${location.price ?? ""}`),
    foodId: id,
    shopId: stableId("shop", `${area.id}:${location.shopName}`),
    shopName: location.shopName,
    areaId: stableId("area", location.areaName),
    areaName: location.areaName,
    shopType: location.shopType,
    sourceUrl: location.sourceUrl,
    price: location.price,
    status: location.status,
    startDate: location.startDate,
    endDate: location.endDate,
    lastCheckedAt: location.lastCheckedAt || lastCheckedAt
  })).filter((location, index, all) => all.findIndex((candidate) => candidate.id === location.id) === index);
  const priceSummary = summarizePrice(item.food.price, locations);
  const dining = inferDiningType(item.food, locations);
  return {
    id,
    shopId: generatedShop.id,
    areaId: generatedArea.id,
    name: item.food.name,
    normalizedName: item.food.normalizedName,
    normalized_name: item.food.normalizedName,
    category: item.food.category,
    price: priceSummary.price,
    priceMin: priceSummary.priceMin,
    price_min: priceSummary.priceMin,
    priceMax: priceSummary.priceMax,
    price_max: priceSummary.priceMax,
    priceNote: priceSummary.priceNote,
    price_note: priceSummary.priceNote,
    priceSourceUrl: priceSummary.priceSourceUrl,
    price_source_url: priceSummary.priceSourceUrl,
    priceLastCheckedAt: priceSummary.priceLastCheckedAt,
    price_last_checked_at: priceSummary.priceLastCheckedAt,
    priceConfidenceScore: priceSummary.priceConfidenceScore,
    price_confidence_score: priceSummary.priceConfidenceScore,
    diningType: dining.diningType,
    dining_type: dining.diningType,
    diningTypeConfidenceScore: dining.diningTypeConfidenceScore,
    dining_type_confidence_score: dining.diningTypeConfidenceScore,
    diningTypeReason: dining.diningTypeReason,
    dining_type_reason: dining.diningTypeReason,
    description: cleanDescription(item.food.description),
    officialUrl: item.food.officialUrl,
    official_url: item.food.officialUrl,
    sourceUrl: item.food.sourceUrl,
    source_url: item.food.sourceUrl,
    startDate: item.food.startDate,
    start_date: item.food.startDate,
    endDate: item.food.endDate,
    end_date: item.food.endDate,
    status: item.food.status,
    isLimited: item.food.isLimited,
    is_limited: item.food.isLimited,
    confidenceScore: item.score,
    confidence_score: item.score,
    nameQualityScore: item.nameQualityScore,
    name_quality_score: item.nameQualityScore,
    displayQuality: item.displayQuality,
    display_quality: item.displayQuality,
    extractionSourceCount: item.sourceNames.length,
    extraction_source_count: item.sourceNames.length,
    reviewStatus: item.reviewStatus,
    review_status: item.reviewStatus,
    hidden: item.hidden,
    duplicateGroupId: item.duplicateGroupId,
    duplicate_group_id: item.duplicateGroupId,
    manualOverride: false,
    manual_override: false,
    compositeMenu: item.compositeMenu,
    composite_menu: item.compositeMenu,
    canonicalFood,
    canonical_food: canonicalFood,
    canonicalGroupId,
    canonical_group_id: canonicalGroupId,
    flavor: attributes.flavor,
    eventName: attributes.eventName,
    event_name: attributes.eventName,
    collaborationName: attributes.collaborationName,
    collaboration_name: attributes.collaborationName,
    releasePeriod: attributes.releasePeriod,
    release_period: attributes.releasePeriod,
    seasonalVersion: attributes.seasonalVersion,
    seasonal_version: attributes.seasonalVersion,
    rarity: attributes.rarity,
    zukanNumber: index + 1,
    zukan_number: index + 1,
    trustedPlaceholder: canonicalFood && !imageUrl,
    trusted_placeholder: canonicalFood && !imageUrl,
    lastCheckedAt,
    last_checked_at: lastCheckedAt,
    imageUrl,
    image_url: imageUrl,
    representativeImageUrl: imageUrl,
    representative_image_url: imageUrl,
    sourceNames: item.sourceNames,
    source_names: item.sourceNames,
    rejectionReasons: item.reasons,
    rejection_reasons: item.reasons,
    locations,
    area: generatedArea,
    shop: generatedShop,
    images
  };
}

function cleanDescription(description?: string) {
  if (!description) return undefined;
  const cleaned = cleanFoodName(description);
  if (cleaned.length < 8 || cleaned.length > 260) return undefined;
  if (hardRejectPattern.test(cleaned) || /tcm:|GDS|SHARED/i.test(cleaned)) return undefined;
  return cleaned;
}

function extractVariantAttributes(name: string, description = "", sourceUrl = "", category: FoodCategory, isLimited = false) {
  const text = `${name} ${description} ${sourceUrl}`;
  const flavor =
    name.match(/[~〜～]([^~〜～]{2,28})[~〜～]?/)?.[1]?.trim() ??
    name.match(/(?:フレーバー|味)[:： ]?([ァ-ヶー一-龠A-Za-z0-9&・･\s]{2,24})/)?.[1]?.trim();
  const collaborationName =
    text.match(/(ウィキッド|ミニオン|ハローキティ|マリオ|ルイージ|ピーチ|ヨッシー|ドンキーコング|ジョーズ|ジュラシック・パーク|ハリー・ポッター|ワンピース|クールジャパン|イースター|ハロウィーン|クリスマス|25周年|アニバーサリー)/)?.[1];
  const eventName =
    text.match(/(ユニバーサル・クールジャパン|ユニバーサル・イースター|ハロウィーン|クリスマス|NO LIMIT! サマー|シネマナイト・ピクニック|25周年|5周年|アニバーサリー)/)?.[1] ??
    collaborationName;
  const releasePeriod = description.match(/20\d{2}年[^。]{0,28}(?:販売|開催|登場|予定)/)?.[0] ?? sourceUrl.match(/\/(20\d{2})\//)?.[1];
  const seasonalVersion = text.match(/(春|夏|秋|冬|ハロウィーン|クリスマス|イースター|サマー|ウィンター|周年|限定)/)?.[1];
  const baseName = name
    .replace(/[~〜～][^~〜～]{2,28}[~〜～]?/g, "")
    .replace(/(?:ウィキッド|ミニオン|ハローキティ|マリオ|ルイージ|ピーチ|ヨッシー|ドンキーコング|ジョーズ|ジュラシック・パーク|ハリー・ポッター|25周年|アニバーサリー)[・\s]?/g, "")
    .replace(/\s+/g, " ")
    .trim() || name;
  const rarity = isLimited || category === "seasonal" || eventName ? (eventName ? "event" : "limited") : category === "popcorn" || category === "churro" ? "rare" : "standard";
  return { baseName, flavor, eventName, collaborationName, releasePeriod, seasonalVersion, rarity } as const;
}

function normalizeStatus(status: FoodStatus, startDate?: string, endDate?: string, now = new Date()): FoodStatus {
  const today = now.toISOString().slice(0, 10);
  if (startDate && startDate > today) return "scheduled";
  if (endDate && today > endDate && (!startDate || startDate <= endDate)) return "ended";
  if (status === "scheduled" || status === "active") return status;
  if (status === "ended" || status === "inactive") {
    if (endDate && (!startDate || startDate <= endDate)) return today > endDate ? "ended" : "active";
    return "active";
  }
  return "active";
}

function normalizeAreaName(areaName: string) {
  if (/^(カート|ワゴン|店舗未確認|エリア未確認)$/.test(areaName)) return "その他";
  if (/Nintendo|ニンテンドー|マリオ|キノピオ|ヨッシー|ドンキー/i.test(areaName)) return "スーパー・ニンテンドー・ワールド";
  if (/Minion|ミニオン/i.test(areaName)) return "ミニオン・パーク";
  if (/Harry|ハリー|ホグ|三本の箒|ホッグズ/i.test(areaName)) return "ウィザーディング・ワールド・オブ・ハリー・ポッター";
  if (/Hollywood|ハリウッド/i.test(areaName)) return "ハリウッド・エリア";
  if (/New York|ニューヨーク|N\.Y\./i.test(areaName)) return "ニューヨーク・エリア";
  if (/Jurassic|ジュラシック|ダイナソー/i.test(areaName)) return "ジュラシック・パーク";
  if (/Amity|アミティ/i.test(areaName)) return "アミティ・ビレッジ";
  if (/San Francisco|サンフランシスコ/i.test(areaName)) return "サンフランシスコ・エリア";
  if (/WaterWorld|ウォーターワールド/i.test(areaName)) return "ウォーターワールド";
  if (/Wonderland|ワンダーランド|スヌーピー|キティ/i.test(areaName)) return "ユニバーサル・ワンダーランド";
  return areaName && areaName !== "エリア未確認" ? areaName : "その他";
}

function symbolRatio(text: string) {
  if (text.length === 0) return 1;
  const symbols = text.replace(/[ァ-ヶー一-龠a-zA-Z0-9ぁ-ん\s]/g, "").length;
  return symbols / text.length;
}

function stableId(prefix: string, value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return `${prefix}-${hash.toString(36)}`;
}

export function countByCategory(foods: GeneratedFood[]) {
  const entries = Object.keys(categoryLabels).map((category) => [category, 0] as [FoodCategory, number]);
  const counts = Object.fromEntries(entries) as Record<FoodCategory, number>;
  for (const food of foods) counts[food.category] += 1;
  return counts;
}
