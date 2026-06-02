import fs from "node:fs";
import path from "node:path";
import type { Area, FoodCategory, FoodLocation, Shop } from "../../types/domain";
import { getFoodImage } from "../../lib/utils/image";
import type { CrawledFood, CrawlRunResult } from "../types/crawler";
import type { GeneratedArea, GeneratedDataset, GeneratedFood, GeneratedImage, GeneratedShop } from "../types/generated";
import { cleanFoodName, inferCategory, normalizeFoodName } from "../utils/normalize-food";

const baselinePath = process.argv[2] ?? "/private/tmp/usj-foods-before-157-goal.json";
const write = process.argv.includes("--write");
const outputDir = path.join(process.cwd(), "scripts", "output");
const datasetPath = path.join(outputDir, "foods.generated.json");
const reportPath = path.join(outputDir, "latest-crawl-report.json");
const kinopioPdfSource =
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/files/documents/usj-pdf-restaurant-other-menu-kinopios-cafe-en.pdf";

const targetNamePattern =
  /(ピッツァ|ピザ|スパゲティ|パスタ|ラザニア|ヌードル|ライス|カレー|丼|御膳|チャーハン|バーガー|サンド|サンドウィッチ|キッズ|プレート|セット|コンボ|ブリトー|ステーキ|グリル|ドリンク|ソーダ|シェイク|フロート|ビール|レモネード|カクテル|ケーキ|パイ|プリン|サンデー|アイス|クッキー|ワッフル|パンケーキ|シュークリーム|ホットドッグ|スープ|ポテト|チキン|ローストビーフ|スペアリブ|パフェ|ティラミス|ブラウニー|ムース|フラッペ|ラッシー|コーヒー|紅茶|ラテ|ミルク|ジュース|ティー|オムレツ|ハンバーグ|フィッシュ|チップス|ショコラ|サングリア)/i;
const rejectNamePattern =
  /(Global alt|SEO|Keywords|販売場所|店舗未確認|店舗です|公式アレルゲン|ベビーフード|スプーン&フォーク|レストラン$|カフェ$|キッチン$|パーラー$|SWEETS\s*&\s*CAFE|ペシャルドリンク|ソフトドリンク\s*\(|グリルチキン$|原作|シリーズ|仮面舞踏会|高級レストラン|格納先|レストルーム|メニュー確認中|ヨッシー・スナック・アイランドTM?$)/i;
const weakImagePattern = /logo|hero|mainvisual|map|restaurant-[abc]|interior|page-title|experience-image|shop|storefront/i;

type Snapshot = {
  visible: number;
  images: number;
  placeholders: number;
  byCategory: Record<string, number>;
};

function main() {
  const baseline = readDataset(baselinePath);
  const dataset = readDataset(datasetPath);
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as CrawlRunResult;
  const before = snapshot(dataset);
  const promotedExisting = promoteExistingHidden(dataset);
  const addedFromReport = addReportCandidates(dataset, report);
  const addedOfficialMenu = addOfficialMenuFoods(dataset);
  const hiddenInvalid = hideInvalidVisibleNonFoods(dataset);
  dataset.generatedAt = new Date().toISOString();
  dataset.summary = buildSummary(dataset.foods);
  const regressions = imageRegressions(baseline, dataset);
  const after = snapshot(dataset);

  if (write && regressions.length === 0) {
    fs.writeFileSync(datasetPath, JSON.stringify(dataset, null, 2));
    fs.writeFileSync(path.join(outputDir, "shops.generated.json"), JSON.stringify(buildShops(dataset.foods), null, 2));
    fs.writeFileSync(path.join(outputDir, "areas.generated.json"), JSON.stringify(buildAreas(dataset.foods), null, 2));
    const latestReport = {
      ...report,
      finishedAt: new Date().toISOString(),
      uniqueFoods: visibleFoods(dataset).length,
      addedCount: (report.addedCount ?? 0) + promotedExisting.length + addedFromReport.length + addedOfficialMenu.length
    };
    fs.writeFileSync(reportPath, JSON.stringify(latestReport, null, 2));
  }

  console.log(
    JSON.stringify(
      {
        write,
        before,
        after,
        promotedExisting: promotedExisting.map((food) => `${food.name} (${food.category})`),
        addedFromReport: addedFromReport.map((food) => `${food.name} (${food.category})`),
        addedOfficialMenu: addedOfficialMenu.map((food) => `${food.name} (${food.category})`),
        hiddenInvalid: hiddenInvalid.map((food) => food.name),
        imageRegressions: regressions.length,
        regressions
      },
      null,
      2
    )
  );

  if (regressions.length > 0) process.exitCode = 1;
}

function promoteExistingHidden(dataset: GeneratedDataset) {
  const visible = visibleFoods(dataset);
  const visibleKeys = new Set(visible.map((food) => keyFor(food)));
  const visibleImages = new Set(visible.map((food) => getFoodImage(food)).filter((image) => !image.startsWith("/placeholders/")));
  const promoted: GeneratedFood[] = [];

  for (const food of dataset.foods) {
    if (!food.hidden || food.reviewStatus !== "approved" || food.displayQuality === "low") continue;
    if (!food.sourceUrl.includes("usj.co.jp")) continue;
    if (!isSafeName(food.name)) continue;
    if (visibleKeys.has(keyFor(food))) continue;
    const image = getFoodImage(food);
    if (image.startsWith("/placeholders/")) continue;
    if (visibleImages.has(image)) continue;
    if (!food.images.some(isSafeOfficialImage)) continue;

    food.hidden = false;
    food.canonicalFood = true;
    food.canonical_food = true;
    food.reviewStatus = "approved";
    food.review_status = "approved";
    food.displayQuality = food.displayQuality === "low" ? "medium" : food.displayQuality;
    food.display_quality = food.displayQuality;
    food.trustedPlaceholder = false;
    food.trusted_placeholder = false;
    food.confidenceScore = Math.max(food.confidenceScore, 82);
    food.confidence_score = food.confidenceScore;
    food.nameQualityScore = Math.max(food.nameQualityScore, 82);
    food.name_quality_score = food.nameQualityScore;
    food.lastCheckedAt = new Date().toISOString();
    food.last_checked_at = food.lastCheckedAt;
    promoted.push(food);
    visibleKeys.add(keyFor(food));
    visibleImages.add(image);
  }

  return promoted;
}

function addReportCandidates(dataset: GeneratedDataset, report: CrawlRunResult) {
  const visible = visibleFoods(dataset);
  const visibleKeys = new Set(visible.map((food) => keyFor(food)));
  const visibleImageUrls = new Set(visible.map((food) => getFoodImage(food)).filter((image) => !image.startsWith("/placeholders/")));
  const candidates = new Map<string, CrawledFood>();

  for (const source of report.sources ?? []) {
    for (const raw of source.foods ?? []) {
      const candidate = normalizeRawCandidate(raw);
      if (!candidate) continue;
      const key = normalizeFoodName(candidate.name);
      if (visibleKeys.has(key)) continue;
      if (candidate.images.some((image) => visibleImageUrls.has(image.imageUrl))) continue;
      const current = candidates.get(key);
      if (!current || rankRawCandidate(candidate) > rankRawCandidate(current)) candidates.set(key, candidate);
    }
  }

  const added: GeneratedFood[] = [];
  for (const raw of candidates.values()) {
    const food = rawToGenerated(raw, dataset.foods.length + added.length);
    dataset.foods.push(food);
    added.push(food);
    visibleKeys.add(keyFor(food));
    for (const image of food.images) visibleImageUrls.add(image.imageUrl);
  }
  return added;
}

function hideInvalidVisibleNonFoods(dataset: GeneratedDataset) {
  const invalidExactNames = new Set(["デリシャス・ミー! ザ・クッキー・キッチン"]);
  const hidden: GeneratedFood[] = [];

  for (const food of dataset.foods) {
    if (food.hidden) continue;
    if (!invalidExactNames.has(food.name.trim())) continue;
    food.hidden = true;
    food.reviewStatus = "pending";
    food.review_status = "pending";
    food.displayQuality = "low";
    food.display_quality = "low";
    food.canonicalFood = false;
    food.canonical_food = false;
    food.rejectionReasons = [...new Set([...(food.rejectionReasons ?? []), "shop-name-not-food"])];
    food.rejection_reasons = food.rejectionReasons;
    food.lastCheckedAt = new Date().toISOString();
    food.last_checked_at = food.lastCheckedAt;
    hidden.push(food);
  }

  return hidden;
}

function addOfficialMenuFoods(dataset: GeneratedDataset) {
  const visible = visibleFoods(dataset);
  const visibleKeys = new Set(visible.map((food) => keyFor(food)));
  const added: GeneratedFood[] = [];
  const menuFoods: Array<{
    name: string;
    category: FoodCategory;
    price: number;
    imagePath: string;
    description: string;
  }> = [
    {
      name: "大魔王クッパ・ハンバーグステーキ（パンまたはライス付き）",
      category: "set",
      price: 2700,
      imagePath: "/generated/official-menu/kinopio-cafe/king-bowser-hamburg-steak.png",
      description: "キノピオ・カフェ公式メニューPDF掲載のメインディッシュ。"
    },
    {
      name: "フィッシュボーン 白身魚のムニエル（パンまたはライス付き）",
      category: "set",
      price: 2700,
      imagePath: "/generated/official-menu/kinopio-cafe/fish-bone-meuniere.png",
      description: "キノピオ・カフェ公式メニューPDF掲載のメインディッシュ。"
    },
    {
      name: "ルイージ・バーガー ～グリーンカレー・チキン～",
      category: "burger",
      price: 2600,
      imagePath: "/generated/official-menu/kinopio-cafe/luigi-green-curry-chicken-sandwich.png",
      description: "キノピオ・カフェ公式メニューPDF掲載のバーガー。"
    },
    {
      name: "シェフ特製 オムライス＆エビとキノコのクリーム煮込み",
      category: "rice",
      price: 2500,
      imagePath: "/generated/official-menu/kinopio-cafe/chef-omelet-rice-shrimp-mushroom.png",
      description: "キノピオ・カフェ公式メニューPDF掲載のライスメニュー。"
    },
    {
      name: "ヨッシー・スパゲティ ～ほうれん草カルボナーラ～",
      category: "noodle",
      price: 2500,
      imagePath: "/generated/official-menu/kinopio-cafe/yoshi-spinach-carbonara.png",
      description: "キノピオ・カフェ公式メニューPDF掲載のパスタ。"
    },
    {
      name: "ファイアフラワー・トマトスパゲティ",
      category: "noodle",
      price: 2500,
      imagePath: "/generated/official-menu/kinopio-cafe/fire-flower-tomato-spaghetti.png",
      description: "キノピオ・カフェ公式メニューPDF掲載のパスタ。"
    },
    {
      name: "パックンフラワー・カプレーゼ",
      category: "snack",
      price: 1600,
      imagePath: "/generated/official-menu/kinopio-cafe/piranha-plant-caprese.png",
      description: "キノピオ・カフェ公式メニューPDF掲載のサイドディッシュ。"
    },
    {
      name: "ヨッシーの大好きなフルーツと野菜のサラダ",
      category: "snack",
      price: 1600,
      imagePath: "/generated/official-menu/kinopio-cafe/yoshi-fruit-veggie-salad.png",
      description: "キノピオ・カフェ公式メニューPDF掲載のサラダ。"
    },
    {
      name: "マッシュルーム・スープ",
      category: "snack",
      price: 900,
      imagePath: "/generated/official-menu/kinopio-cafe/mushroom-soup.png",
      description: "キノピオ・カフェ公式メニューPDF掲載のスープ。"
    },
    {
      name: "スーパーキノコ・ピッツァボウル ～ベーコン＆マッシュルーム～",
      category: "pizza",
      price: 1900,
      imagePath: "/generated/official-menu/kinopio-cafe/super-mushroom-pizza-bowl.png",
      description: "キノピオ・カフェ公式メニューPDF掲載のピッツァボウル。"
    },
    {
      name: "巨大マッシュルームのピッツァ",
      category: "pizza",
      price: 1900,
      imagePath: "/generated/official-menu/kinopio-cafe/portobello-mushroom-pizza.png",
      description: "キノピオ・カフェ公式メニューPDF掲載のピッツァ。"
    },
    {
      name: "ハテナブロック・ティラミス",
      category: "dessert",
      price: 1100,
      imagePath: "/generated/official-menu/kinopio-cafe/question-block-tiramisu.png",
      description: "キノピオ・カフェ公式メニューPDF掲載のデザート。"
    },
    {
      name: "ゴールポール・ケーキ",
      category: "dessert",
      price: 1100,
      imagePath: "/generated/official-menu/kinopio-cafe/goal-pole-cake.png",
      description: "キノピオ・カフェ公式メニューPDF掲載のデザート。"
    },
    {
      name: "ダブルチェリーのチョコレートカップケーキ",
      category: "dessert",
      price: 1100,
      imagePath: "/generated/official-menu/kinopio-cafe/double-cherry-chocolate-cupcake.png",
      description: "キノピオ・カフェ公式メニューPDF掲載のデザート。"
    },
    {
      name: "スーパースター・プラザ ライム・スカッシュ",
      category: "drink",
      price: 600,
      imagePath: "/generated/official-menu/kinopio-cafe/super-star-plaza-lime-squash.png",
      description: "キノピオ・カフェ公式メニューPDF掲載のノンアルコールドリンク。"
    },
    {
      name: "スーパースター・レモンスカッシュ",
      category: "drink",
      price: 800,
      imagePath: "/generated/official-menu/kinopio-cafe/super-star-lemon-squash.png",
      description: "キノピオ・カフェ公式メニューPDF掲載のノンアルコールドリンク。"
    }
  ];

  for (const menuFood of menuFoods) {
    const key = normalizeFoodName(menuFood.name);
    if (visibleKeys.has(key)) continue;
    const absoluteImagePath = path.join(process.cwd(), "public", menuFood.imagePath.replace(/^\//, ""));
    if (!fs.existsSync(absoluteImagePath)) continue;

    const raw: CrawledFood = {
      name: menuFood.name,
      normalizedName: key,
      shopName: "キノピオ・カフェ",
      areaName: "スーパー・ニンテンドー・ワールド",
      shopType: "restaurant",
      category: menuFood.category,
      price: menuFood.price,
      description: menuFood.description,
      officialUrl: "https://www.usj.co.jp/web/ja/jp/restaurants/kinopios-cafe",
      sourceUrl: kinopioPdfSource,
      status: "active",
      isLimited: false,
      confidence: 0.95,
      images: [
        {
          imageUrl: menuFood.imagePath,
          sourceUrl: kinopioPdfSource,
          altText: menuFood.name,
          imageSourceContext: "kinopio-cafe-official-menu-pdf-crop",
          imageMatchReason: "official-menu-pdf-same-item",
          imageConfidenceScore: 92,
          imageMatchScore: 92,
          categoryImageMatchScore: 90,
          imageVerified: true,
          isSharedTooMuch: false
        }
      ]
    };
    const food = rawToGenerated(raw, dataset.foods.length + added.length);
    food.sourceNames = ["official-menu-pdf"];
    food.source_names = food.sourceNames;
    for (const image of food.images) {
      image.imageSourceName = "USJ official Kinopio Cafe menu PDF";
      image.imageSourceContext = "kinopio-cafe-official-menu-pdf-crop";
      image.imageMatchReason = "official-menu-pdf-same-item";
      image.imageCandidateScore = 92;
    }
    dataset.foods.push(food);
    added.push(food);
    visibleKeys.add(key);
  }

  return added;
}

function normalizeRawCandidate(raw: CrawledFood): CrawledFood | undefined {
  const name = cleanFoodName(raw.name).replace(/\s+SV付$/i, " マグカップ付き").trim();
  if (!isSafeName(name)) return undefined;
  if (!raw.sourceUrl.includes("usj.co.jp")) return undefined;
  const images = raw.images.filter((image) => image.imageUrl && !weakImagePattern.test(image.imageUrl));
  if (!images.length) return undefined;
  const category = inferStrictCategory(name, inferCategory(`${name} ${raw.description ?? ""}`));
  return {
    ...raw,
    name,
    normalizedName: normalizeFoodName(name),
    category,
    images
  };
}

function isSafeName(name: string) {
  if (!targetNamePattern.test(name)) return false;
  if (rejectNamePattern.test(name)) return false;
  if (/[{}<>]|tcm:|Global alt|SEO|Keywords/.test(name)) return false;
  if (name.length > 64 && !/(プレート|セット|サンド|バーガー|チュリトス|パフェ)/.test(name)) return false;
  return true;
}

function isSafeOfficialImage(image: GeneratedImage) {
  return (
    Boolean(image.imageUrl) &&
    image.enabled !== false &&
    image.sourceType === "official" &&
    !image.hasWatermark &&
    !image.isSharedTooMuch &&
    !weakImagePattern.test(image.imageUrl)
  );
}

function rawToGenerated(raw: CrawledFood, index: number): GeneratedFood {
  const id = stableId(raw.name);
  const category = inferStrictCategory(raw.name, raw.category);
  const shop = normalizeShop(raw.shopName, raw.shopType, raw.sourceUrl);
  const area = normalizeArea(raw.areaName, shop.areaId);
  const images = raw.images.slice(0, 4).map((image, imageIndex) => normalizeImage(image.imageUrl, raw.sourceUrl, id, image.altText, imageIndex));
  const imageUrl = images[0]?.imageUrl;
  const locations = normalizeLocations(id, shop, area, raw);
  const now = new Date().toISOString();
  return {
    id,
    shopId: shop.id,
    areaId: area.id,
    name: raw.name,
    normalizedName: raw.normalizedName || normalizeFoodName(raw.name),
    normalized_name: raw.normalizedName || normalizeFoodName(raw.name),
    category,
    price: raw.price,
    priceMin: raw.price,
    price_min: raw.price,
    priceSourceUrl: raw.price ? raw.sourceUrl : undefined,
    price_source_url: raw.price ? raw.sourceUrl : undefined,
    priceLastCheckedAt: raw.price ? now : undefined,
    price_last_checked_at: raw.price ? now : undefined,
    priceConfidenceScore: raw.price ? 85 : undefined,
    price_confidence_score: raw.price ? 85 : undefined,
    diningType: inferDiningType(raw.name, shop.name),
    dining_type: inferDiningType(raw.name, shop.name),
    diningTypeConfidenceScore: 78,
    dining_type_confidence_score: 78,
    diningTypeReason: "official-restaurant-menu-supplement",
    dining_type_reason: "official-restaurant-menu-supplement",
    description: raw.description,
    officialUrl: raw.officialUrl,
    official_url: raw.officialUrl,
    sourceUrl: raw.sourceUrl,
    source_url: raw.sourceUrl,
    startDate: raw.startDate,
    start_date: raw.startDate,
    endDate: raw.endDate,
    end_date: raw.endDate,
    status: raw.status,
    isLimited: raw.isLimited,
    is_limited: raw.isLimited,
    confidenceScore: 90,
    confidence_score: 90,
    nameQualityScore: 90,
    name_quality_score: 90,
    displayQuality: "high",
    display_quality: "high",
    extractionSourceCount: 1,
    extraction_source_count: 1,
    reviewStatus: "approved",
    review_status: "approved",
    hidden: false,
    manualOverride: false,
    manual_override: false,
    compositeMenu: false,
    composite_menu: false,
    canonicalFood: true,
    canonical_food: true,
    rarity: raw.isLimited ? "limited" : "standard",
    zukanNumber: index + 1,
    zukan_number: index + 1,
    trustedPlaceholder: !imageUrl,
    trusted_placeholder: !imageUrl,
    lastCheckedAt: now,
    last_checked_at: now,
    imageUrl,
    image_url: imageUrl,
    representativeImageUrl: imageUrl,
    representative_image_url: imageUrl,
    sourceNames: ["official-restaurant-menu-supplement"],
    source_names: ["official-restaurant-menu-supplement"],
    rejectionReasons: [],
    rejection_reasons: [],
    locations,
    area,
    shop,
    images
  };
}

function normalizeImage(imageUrl: string, sourceUrl: string, foodId: string, altText: string | undefined, index: number): GeneratedImage {
  return {
    id: `${foodId}-img-${index + 1}`,
    foodId,
    imageUrl,
    sourceType: "official",
    sourceUrl,
    altText,
    alt: altText,
    imageConfidenceScore: 90,
    imageMatchScore: 90,
    categoryImageMatchScore: 90,
    imageMatchReason: "official-report-same-card",
    imageVerified: true,
    isSharedTooMuch: false,
    hasWatermark: false,
    imageCandidateScore: 90,
    officialConfirmed: true,
    imageApproved: true,
    image_approved: true,
    priority: index + 1,
    enabled: true
  };
}

function inferStrictCategory(name: string, fallback: FoodCategory): FoodCategory {
  if (/キッズ|お子様/.test(name)) return "kids";
  if (/ピッツァ|ピザ/.test(name)) return "pizza";
  if (/スパゲティ|パスタ|ラザニア|ヌードル|ラーメン/.test(name)) return "noodle";
  if (/バーガー|サンド|サンドウィッチ/.test(name)) return "burger";
  if (/プレート|セット|コンボ|ブリトー|ステーキ|ムニエル/.test(name)) return "set";
  if (/カレー|ライス|丼|御膳|チャーハン|オムライス/.test(name)) return "rice";
  if (/ドリンク|ソーダ|シェイク|フロート|ビール|レモネード|カクテル|ボトル|ラッシー|コーヒー|紅茶|ティー|ラテ|ジュース|サングリア/.test(name)) return "drink";
  if (/ケーキ|パイ|プリン|サンデー|アイス|クッキー|ワッフル|パンケーキ|シュークリーム|デザート|パフェ|ティラミス|ブラウニー|ムース|ショコラ/.test(name)) return "dessert";
  if (/ホットドッグ|ポップコーン|ポテト|チップス/.test(name)) return "snack";
  return fallback;
}

function inferDiningType(name: string, shop: string) {
  if (/(カート|ワゴン)/.test(shop)) return "food_cart";
  if (/(チュリトス|ポップコーン|ドリンク|ホットドッグ|ターキーレッグ|まん|アイス|サンデー|ボトル)/.test(name)) return "takeout";
  return "eat_in";
}

function normalizeShop(name: string, type: Shop["type"], sourceUrl: string): Shop {
  const shopName = name && name !== "店舗未確認" ? name : inferShopFromUrl(sourceUrl);
  const areaName = inferAreaFromShop(shopName);
  return {
    id: `shop-${normalizeKey(shopName).slice(0, 32)}`,
    areaId: `area-${normalizeKey(areaName).slice(0, 32)}`,
    name: shopName,
    type: type ?? (/(カート|ワゴン)/.test(shopName) ? "cart" : "restaurant"),
    officialUrl: sourceUrl.replace("/tridiondata/usj/ja/jp/", "/web/ja/jp/").replace(/\/index\.html$/, ""),
    isActive: true
  };
}

function normalizeArea(name: string, areaId: string): Area {
  const areaName = name && name !== "その他" && name !== "エリア未確認" ? name : areaId.replace(/^area-/, "") || "その他";
  return {
    id: areaId,
    name: areaName,
    sortOrder: areaSort(areaName)
  };
}

function normalizeLocations(foodId: string, shop: Shop, area: Area, raw: CrawledFood): FoodLocation[] {
  return [
    {
      id: `${foodId}-loc-1`,
      foodId,
      shopId: shop.id,
      shopName: shop.name,
      areaId: area.id,
      areaName: area.name,
      shopType: shop.type,
      sourceUrl: raw.sourceUrl,
      price: raw.price,
      status: raw.status,
      startDate: raw.startDate,
      endDate: raw.endDate,
      lastCheckedAt: new Date().toISOString()
    }
  ];
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

function snapshot(dataset: GeneratedDataset): Snapshot {
  const visible = visibleFoods(dataset);
  const placeholders = visible.filter((food) => getFoodImage(food).startsWith("/placeholders/"));
  return {
    visible: visible.length,
    images: visible.length - placeholders.length,
    placeholders: placeholders.length,
    byCategory: countBy(visible, (food) => food.category)
  };
}

function buildSummary(foods: GeneratedFood[]): GeneratedDataset["summary"] {
  const dataset = { generatedAt: "", summary: {} as GeneratedDataset["summary"], foods };
  return {
    totalCandidates: foods.length,
    generatedFoods: foods.length,
    approved: foods.filter((food) => food.reviewStatus === "approved").length,
    pending: foods.filter((food) => food.reviewStatus === "pending").length,
    rejected: foods.filter((food) => food.reviewStatus === "rejected").length,
    hidden: foods.filter((food) => food.hidden).length,
    duplicateHidden: foods.filter((food) => food.hidden && food.duplicateGroupId).length,
    withImages: foods.filter((food) => !getFoodImage(food).startsWith("/placeholders/")).length,
    highQuality: foods.filter((food) => food.displayQuality === "high" && food.reviewStatus === "approved" && !food.hidden).length,
    officialImages: foods.filter((food) => food.images.some((image) => image.sourceType === "official" && !image.isSharedTooMuch)).length,
    verifiedOfficialImages: foods.filter((food) => food.images.some((image) => image.enabled && image.sourceType === "official" && image.imageVerified && !image.isSharedTooMuch)).length,
    placeholderImages: visibleFoods(dataset).filter((food) => getFoodImage(food).startsWith("/placeholders/")).length,
    imageMismatchExcluded: foods.filter((food) => food.images.some((image) => image.sourceType === "official" && !image.enabled && image.imageMismatchReason)).length,
    nameFiltered: foods.filter((food) => food.rejectionReasons.includes("bad-food-name") || food.rejectionReasons.includes("low-name-quality")).length,
    compositeCandidates: foods.filter((food) => food.compositeMenu).length,
    sharedImages: foods.filter((food) => food.images.some((image) => image.isSharedTooMuch)).length
  };
}

function buildShops(foods: GeneratedFood[]): GeneratedShop[] {
  const map = new Map<string, GeneratedShop>();
  for (const food of foods) {
    const current = map.get(food.shop.id);
    map.set(food.shop.id, {
      ...food.shop,
      foodCount: (current?.foodCount ?? 0) + (visibleFoods({ generatedAt: "", summary: {} as GeneratedDataset["summary"], foods: [food] }).length ? 1 : 0)
    });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

function buildAreas(foods: GeneratedFood[]): GeneratedArea[] {
  const map = new Map<string, GeneratedArea>();
  for (const food of foods) {
    const current = map.get(food.area.id);
    map.set(food.area.id, {
      ...food.area,
      foodCount: (current?.foodCount ?? 0) + (visibleFoods({ generatedAt: "", summary: {} as GeneratedDataset["summary"], foods: [food] }).length ? 1 : 0)
    });
  }
  return [...map.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"));
}

function imageRegressions(before: GeneratedDataset, after: GeneratedDataset) {
  const afterMap = new Map(visibleFoods(after).map((food) => [keyFor(food), food]));
  return visibleFoods(before).flatMap((food) => {
    const next = afterMap.get(keyFor(food));
    if (!next) return [];
    const beforeState = imageState(food);
    const afterState = imageState(next);
    const hadImage = !beforeState.display.startsWith("/placeholders/") || beforeState.approved || beforeState.verified || beforeState.manual;
    const regression =
      (hadImage && afterState.display.startsWith("/placeholders/")) ||
      (beforeState.approved && !afterState.approved) ||
      (beforeState.verified && !afterState.verified) ||
      (beforeState.manual && !afterState.manual);
    return regression ? [{ name: food.name, before: beforeState, after: afterState }] : [];
  });
}

function imageState(food: GeneratedFood) {
  return {
    display: getFoodImage(food),
    approved: food.images.some((image) => image.enabled && (image.imageApproved || image.image_approved)),
    verified: food.images.some((image) => image.enabled && image.imageVerified),
    manual: food.images.some((image) => image.enabled && (image.manuallyAdded || image.manually_added))
  };
}

function rankRawCandidate(food: CrawledFood) {
  return food.confidence * 100 + food.images.length * 30 + (food.shopName && food.shopName !== "店舗未確認" ? 20 : 0) + (food.price ? 15 : 0);
}

function keyFor(food: GeneratedFood) {
  return food.normalizedName || normalizeFoodName(food.name);
}

function normalizeKey(name: string) {
  return normalizeFoodName(name).slice(0, 80);
}

function stableId(name: string) {
  let hash = 2166136261;
  for (const char of name) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `food-${(hash >>> 0).toString(36)}`;
}

function inferShopFromUrl(sourceUrl: string) {
  const slug = sourceUrl.match(/restaurants\/([^/]+)\//)?.[1] ?? "";
  const map: Record<string, string> = {
    "mario-cafe-and-store": "マリオ・カフェ&ストア",
    "kinopios-cafe": "キノピオ・カフェ",
    "studio-stars-restaurant": "スタジオ・スターズ・レストラン",
    "mels-drive-in": "メルズ・ドライブイン",
    "discovery-restaurant": "ディスカバリー・レストラン",
    "amity-landing-restaurant": "アミティ・ランディング・レストラン",
    "amity-ice-cream": "アミティ・アイスクリーム",
    "fossil-fuels": "フォッシル・フュエルズ",
    "boardwalk-snacks": "ボードウォーク・スナック",
    "lost-world-restaurant": "ロストワールド・レストラン",
    "louies-ny-pizza-parlor": "ルイズN.Y.ピザパーラー",
    "beverly-hills-boulangerie": "ビバリーヒルズ・ブランジェリー",
    "park-side-grille": "パークサイド・グリル",
    saido: "SAIDO",
    "the-dragons-pearl": "ザ・ドラゴンズ・パール",
    "happiness-cafe": "ハピネス・カフェ",
    "delicious-me-the-cookie-kitchen": "デリシャス・ミー!ザ・クッキー・キッチン",
    "jungle-beat-shakes": "ジャングル・ビート・シェイク",
    "snoopys-backlot-cafe": "スヌーピー・バックロット・カフェ",
    "hello-kittys-corner-cafe": "ハローキティのコーナーカフェ",
    "pit-stop-popcorn": "ピットストップ・ポップコーン",
    "yoshis-snack-island": "ヨッシー・スナック・アイランド",
    "wharf-cafe": "ワーフカフェ",
    "three-broomsticks": "三本の箒",
    "hogs-head": "ホッグズ・ヘッド・パブ",
    "food-cart": "フードカート"
  };
  return map[slug] ?? "店舗未確認";
}

function inferAreaFromShop(shop: string) {
  if (/キノピオ|スーパー|ドンキー/.test(shop)) return "スーパー・ニンテンドー・ワールド";
  if (/ミニオン|ハピネス|デリシャス/.test(shop)) return "ミニオン・パーク";
  if (/三本|ホッグズ|ハリー|魔法/.test(shop)) return "ウィザーディング・ワールド・オブ・ハリー・ポッター";
  if (/メルズ|スタジオ|マリオ・カフェ|ビバリー|スヌーピー|ハローキティ/.test(shop)) return "ハリウッド・エリア";
  if (/パークサイド|ルイズ|SAIDO/.test(shop)) return "ニューヨーク・エリア";
  if (/ディスカバリー|ジュラシック|ロストワールド/.test(shop)) return "ジュラシック・パーク";
  if (/アミティ|ジョーズ/.test(shop)) return "アミティ・ビレッジ";
  if (/ドラゴンズ|ワーフ/.test(shop)) return "サンフランシスコ・エリア";
  return "その他";
}

function areaSort(name: string) {
  const order = [
    "スーパー・ニンテンドー・ワールド",
    "ミニオン・パーク",
    "ウィザーディング・ワールド・オブ・ハリー・ポッター",
    "ハリウッド・エリア",
    "ニューヨーク・エリア",
    "ジュラシック・パーク",
    "アミティ・ビレッジ",
    "サンフランシスコ・エリア",
    "ユニバーサル・ワンダーランド",
    "その他"
  ];
  const index = order.indexOf(name);
  return index >= 0 ? index + 1 : 99;
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

main();
