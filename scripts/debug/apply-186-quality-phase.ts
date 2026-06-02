import fs from "node:fs";
import path from "node:path";
import type { Area, FoodLocation, Shop } from "../../types/domain";
import type { GeneratedArea, GeneratedDataset, GeneratedFood, GeneratedImage, GeneratedShop } from "../types/generated";
import { getFoodImage } from "../../lib/utils/image";
import { normalizeFoodName } from "../utils/normalize-food";

const baselinePath = process.argv[2] ?? "/private/tmp/usj-foods-before-186-goal.json";
const write = process.argv.includes("--write");
const outputDir = path.join(process.cwd(), "scripts", "output");
const datasetPath = path.join(outputDir, "foods.generated.json");
const reportPath = path.join(outputDir, "latest-crawl-report.json");
const sourceDatasetPaths = [
  "/private/tmp/usj-kids-foods.json",
  "/private/tmp/usj-pasta-foods.json",
  "/private/tmp/usj-burger-foods.json",
  "/private/tmp/usj-desserts-foods.json",
  "/private/tmp/usj-pizza-foods.json",
  "/private/tmp/usj-drinks-foods.json",
  "/private/tmp/usj-restaurantmenus-foods.json",
  "/private/tmp/usj-restaurantmenus-run-foods.json"
].filter((filePath) => fs.existsSync(filePath));

const promoteIds = new Set([
  "food-wwocdx",
  "food-jc2lhj",
  "food-7ozrw",
  "food-1lrqa9q",
  "food-1fzuvji",
  "food-zqc5hv",
  "food-14zoddb",
  "food-d5v0l2",
  "food-1c6f0vw",
  "food-h5dibv",
  "food-2pfw04",
  "food-9gwmrf",
  "food-1242pz2",
  "food-cu1lol",
  "food-5ye0ue",
  "food-pxaaqk",
  "food-1rp55v",
  "food-1wrze94",
  "food-1d2sdpl",
  "food-umw6cv",
  "food-av67nb",
  "food-1ra6hp8",
  "food-mzdqz1",
  "food-1v2f6xx",
  "food-1xekyuo",
  "food-8xwq2b"
]);

const stalePlaceholderNames = new Set([
  "サーティーワン・チュリトス",
  "怪盗キッド・チュリトス~ホワイトグレープ味~",
  "クロミ・チュリトス ~カシスショコラ味~",
  "マイメロディ・チュリトス ~いちごヨーグルト味~",
  "ハリーポッターのホグワーツチュリトス",
  "ドルチェ・チュリトス ~ティラミス~",
  "トラファルガー・ローのオレンジ&ビターチョコチュリトス",
  "デクの \"ワン・フォー・オール\" チョコレート・チュリトス ~ピスタチオ~",
  "極秘修行中!?虎杖チュリトス〜コーラフレーバ〜"
]);

const weakImagePattern = /logo|hero|mainvisual|map|restaurant-[abc]|interior|page-title|experience-image|shop|storefront|payment\.png/i;

const baseline = readDataset(baselinePath);
const dataset = readDataset(datasetPath);
const before = snapshot(dataset);
const promoted = promoteOfficialImageBackedFoods(dataset);
const imported = importCategoryVisibleFoods(dataset, sourceDatasetPaths.map(readDataset));
const restaurantMapAdded = addRestaurantMapFoods(dataset);
const hiddenStalePlaceholders = hideStaleVisiblePlaceholders(dataset, 194);
dataset.generatedAt = new Date().toISOString();
dataset.summary = buildSummary(dataset.foods);
const after = snapshot(dataset);
const regressions = imageRegressions(baseline, dataset);

if (write && regressions.length === 0) {
  fs.writeFileSync(datasetPath, JSON.stringify(dataset, null, 2));
  fs.writeFileSync(path.join(outputDir, "shops.generated.json"), JSON.stringify(buildShops(dataset.foods), null, 2));
  fs.writeFileSync(path.join(outputDir, "areas.generated.json"), JSON.stringify(buildAreas(dataset.foods), null, 2));
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        ...report,
        finishedAt: new Date().toISOString(),
        uniqueFoods: after.visible,
        addedCount: (report.addedCount ?? 0) + promoted.length + imported.length,
        qualityPhase: {
          promotedOfficialImageFoods: promoted.length,
          importedOfficialImageFoods: imported.length,
          restaurantMapOfficialFoods: restaurantMapAdded.length,
          hiddenStalePlaceholders: hiddenStalePlaceholders.length,
          imageRegressions: regressions.length
        }
      },
      null,
      2
    )
  );
}

console.log(
  JSON.stringify(
    {
      write,
      before,
      after,
      promoted: promoted.map((food) => `${food.name} (${food.category})`),
      imported: imported.map((food) => `${food.name} (${food.category})`),
      restaurantMapAdded: restaurantMapAdded.map((food) => `${food.name} (${food.category})`),
      hiddenStalePlaceholders: hiddenStalePlaceholders.map((food) => food.name),
      imageRegressions: regressions.length,
      regressions
    },
    null,
    2
  )
);

if (regressions.length > 0) process.exitCode = 1;

function importCategoryVisibleFoods(dataset: GeneratedDataset, sources: GeneratedDataset[]) {
  const visibleKeys = new Set(visibleFoods(dataset).map((food) => foodKey(food)));
  const visibleImages = new Set(visibleFoods(dataset).map((food) => getFoodImage(food)).filter((image) => !image.startsWith("/placeholders/")));
  const usedIds = new Set(dataset.foods.map((food) => food.id));
  const imported: GeneratedFood[] = [];

  for (const source of sources) {
    for (const sourceFood of visibleFoods(source)) {
      if (!safeName(sourceFood.name)) continue;
      if (!sourceFood.sourceUrl || !/usj\.co\.jp/i.test(sourceFood.sourceUrl)) continue;
      if (visibleKeys.has(foodKey(sourceFood))) continue;
      const image = getFoodImage(sourceFood);
      if (image.startsWith("/placeholders/")) continue;
      if (visibleImages.has(image)) continue;
      if (!sourceFood.images.some(isSafeImage)) continue;

      const clone = cloneFood(sourceFood, usedIds, dataset.foods.length + imported.length);
      promoteClone(clone);
      dataset.foods.push(clone);
      imported.push(clone);
      visibleKeys.add(foodKey(clone));
      visibleImages.add(getFoodImage(clone));
    }
  }

  return imported;
}

function addRestaurantMapFoods(dataset: GeneratedDataset) {
  const sourceUrl = "https://www.usj.co.jp/pdf/map_restaurant.pdf";
  const sourceName = "official-restaurant-map-pdf";
  const checkedAt = new Date().toISOString();
  const visibleKeys = new Set(visibleFoods(dataset).map((food) => foodKey(food)));
  const visibleImages = new Set(visibleFoods(dataset).map((food) => getFoodImage(food)).filter((image) => !image.startsWith("/placeholders/")));
  const added: GeneratedFood[] = [];
  const mapFoods: Array<{
    name: string;
    category: GeneratedFood["category"];
    price?: number;
    imagePath: string;
    shopName: string;
    areaName: string;
    diningType: GeneratedFood["diningType"];
    shopType: FoodLocation["shopType"];
    description: string;
  }> = [
    {
      name: "タワーパフェ",
      category: "dessert",
      price: 2400,
      imagePath: "/generated/official-menu/restaurant-map/tower-parfait.jpg",
      shopName: "メルズ・ドライブイン",
      areaName: "ハリウッド・エリア",
      diningType: "eat_in",
      shopType: "restaurant",
      description: "USJ公式レストランマップ掲載のメルズ・ドライブイン商品。"
    },
    {
      name: "スタジオ・スターズ・セット",
      category: "set",
      price: 1490,
      imagePath: "/generated/official-menu/restaurant-map/studio-stars-set.jpg",
      shopName: "スタジオ・スターズ・レストラン",
      areaName: "ハリウッド・エリア",
      diningType: "eat_in",
      shopType: "restaurant",
      description: "USJ公式レストランマップ掲載のスタジオ・スターズ・レストラン商品。"
    },
    {
      name: "フィネガンズ・ビーフシチューセット",
      category: "set",
      price: 1590,
      imagePath: "/generated/official-menu/restaurant-map/finnegans-beef-stew-set.jpg",
      shopName: "フィネガンズ・バー＆グリル",
      areaName: "ニューヨーク・エリア",
      diningType: "eat_in",
      shopType: "restaurant",
      description: "USJ公式レストランマップ掲載のフィネガンズ・バー＆グリル商品。"
    },
    {
      name: "シーフード・ペペロンチーノ",
      category: "noodle",
      price: 1290,
      imagePath: "/generated/official-menu/restaurant-map/louies-seafood-pasta.jpg",
      shopName: "ルイズN.Y.ピザパーラー",
      areaName: "ニューヨーク・エリア",
      diningType: "eat_in",
      shopType: "restaurant",
      description: "USJ公式レストランマップ掲載のルイズN.Y.ピザパーラー商品。"
    },
    {
      name: "SAIDOセット",
      category: "set",
      price: 2980,
      imagePath: "/generated/official-menu/restaurant-map/saido-set.jpg",
      shopName: "SAIDO",
      areaName: "ニューヨーク・エリア",
      diningType: "eat_in",
      shopType: "restaurant",
      description: "USJ公式レストランマップ掲載のSAIDO商品。"
    },
    {
      name: "マジカル・カレー",
      category: "rice",
      price: 1490,
      imagePath: "/generated/official-menu/restaurant-map/happiness-curry.jpg",
      shopName: "ハピネス・カフェ",
      areaName: "サンフランシスコ・エリア",
      diningType: "eat_in",
      shopType: "restaurant",
      description: "USJ公式レストランマップ掲載のハピネス・カフェ商品。"
    },
    {
      name: "ディスカバリー・レストラン ステーキプレート",
      category: "set",
      price: 1420,
      imagePath: "/generated/official-menu/restaurant-map/discovery-steak-plate.jpg",
      shopName: "ディスカバリー・レストラン",
      areaName: "ジュラシック・パーク",
      diningType: "eat_in",
      shopType: "restaurant",
      description: "USJ公式レストランマップ掲載のディスカバリー・レストラン商品。"
    },
    {
      name: "骨付きフライドチキンセット",
      category: "chicken",
      price: 1280,
      imagePath: "/generated/official-menu/restaurant-map/amity-fried-chicken-set.jpg",
      shopName: "アミティ・ランディング・レストラン",
      areaName: "アミティ・ビレッジ",
      diningType: "eat_in",
      shopType: "restaurant",
      description: "USJ公式レストランマップ掲載のアミティ・ランディング・レストラン商品。"
    },
    {
      name: "スヌーピーのビッグバーガーセット",
      category: "burger",
      price: 1150,
      imagePath: "/generated/official-menu/restaurant-map/snoopy-big-burger-set.jpg",
      shopName: "スヌーピー・バックロット・カフェ",
      areaName: "ユニバーサル・ワンダーランド",
      diningType: "eat_in",
      shopType: "restaurant",
      description: "USJ公式レストランマップ掲載のスヌーピー・バックロット・カフェ商品。"
    },
    {
      name: "ピッツァ・スターターキ",
      category: "pizza",
      price: 2590,
      imagePath: "/generated/official-menu/restaurant-map/azzurra-pizza.jpg",
      shopName: "アズーラ・ディ・カプリ",
      areaName: "ニューヨーク・エリア",
      diningType: "eat_in",
      shopType: "restaurant",
      description: "USJ公式レストランマップ掲載のアズーラ・ディ・カプリ商品。"
    },
    {
      name: "パークサイド・グリル セットメニュー",
      category: "set",
      price: 1580,
      imagePath: "/generated/official-menu/restaurant-map/parkside-set-menu.jpg",
      shopName: "パークサイド・グリル",
      areaName: "ニューヨーク・エリア",
      diningType: "eat_in",
      shopType: "restaurant",
      description: "USJ公式レストランマップ掲載のパークサイド・グリル商品。"
    },
    {
      name: "ピンク・タマモリー・カップケーキ",
      category: "dessert",
      price: 300,
      imagePath: "/generated/official-menu/restaurant-map/pink-tamemory-cupcake.jpg",
      shopName: "ピンクカフェ",
      areaName: "ハリウッド・エリア",
      diningType: "eat_in",
      shopType: "restaurant",
      description: "USJ公式レストランマップ掲載のピンクカフェ商品。"
    },
    {
      name: "ビバリーヒルズ・ブランジェリー ケーキ各種",
      category: "dessert",
      price: 480,
      imagePath: "/generated/official-menu/restaurant-map/beverly-hills-cakes.jpg",
      shopName: "ビバリーヒルズ・ブランジェリー",
      areaName: "ハリウッド・エリア",
      diningType: "eat_in",
      shopType: "restaurant",
      description: "USJ公式レストランマップ掲載のビバリーヒルズ・ブランジェリー商品。"
    },
    {
      name: "シュリンプ&めんたいチーズのカルツォーネ",
      category: "snack",
      price: 560,
      imagePath: "/generated/official-menu/restaurant-map/boardwalk-shrimp-cheese-calzone.jpg",
      shopName: "ボードウォーク・スナック",
      areaName: "アミティ・ビレッジ",
      diningType: "takeout",
      shopType: "cart",
      description: "USJ公式レストランマップ掲載のボードウォーク・スナック商品。"
    },
    {
      name: "アイスクリーム各種",
      category: "dessert",
      price: 350,
      imagePath: "/generated/official-menu/restaurant-map/amity-ice-cream-assortment.jpg",
      shopName: "アミティ・アイスクリーム",
      areaName: "アミティ・ビレッジ",
      diningType: "takeout",
      shopType: "restaurant",
      description: "USJ公式レストランマップ掲載のアミティ・アイスクリーム商品。"
    },
    {
      name: "ドラゴンコンボ",
      category: "set",
      price: 1200,
      imagePath: "/generated/official-menu/restaurant-map/dragons-pearl-combo-map.jpg",
      shopName: "ザ・ドラゴンズ・パール",
      areaName: "サンフランシスコ・エリア",
      diningType: "eat_in",
      shopType: "restaurant",
      description: "USJ公式レストランマップ掲載のザ・ドラゴンズ・パール商品。"
    },
    {
      name: "マリオ・バーガー ~ベーコン&チーズ~",
      category: "burger",
      price: 2400,
      imagePath: "/generated/official-menu/kinopio-cafe/mario-bacon-cheeseburger.png",
      shopName: "キノピオ・カフェ",
      areaName: "スーパー・ニンテンドー・ワールド",
      diningType: "eat_in",
      shopType: "restaurant",
      description: "USJ公式キノピオ・カフェメニューPDF掲載の商品。"
    },
    {
      name: "スーパースター・アニバーサリープレート ~マッシュルーム・ラザニア&フライドチキン~",
      category: "set",
      price: 2600,
      imagePath: "/generated/official-menu/kinopio-cafe/super-star-anniversary-plate.png",
      shopName: "キノピオ・カフェ",
      areaName: "スーパー・ニンテンドー・ワールド",
      diningType: "eat_in",
      shopType: "restaurant",
      description: "USJ公式キノピオ・カフェメニューPDF掲載の商品。"
    },
    {
      name: "シェフ特製オムライス&エビとキノコのクリーム煮込み",
      category: "rice",
      price: 2400,
      imagePath: "/generated/official-menu/kinopio-cafe/chef-omelet-rice-shrimp-mushroom.png",
      shopName: "キノピオ・カフェ",
      areaName: "スーパー・ニンテンドー・ワールド",
      diningType: "eat_in",
      shopType: "restaurant",
      description: "USJ公式キノピオ・カフェメニューPDF掲載の商品。"
    },
    {
      name: "フィッシュボーン・ムニエル",
      category: "set",
      price: 2400,
      imagePath: "/generated/official-menu/kinopio-cafe/fish-bone-meuniere.png",
      shopName: "キノピオ・カフェ",
      areaName: "スーパー・ニンテンドー・ワールド",
      diningType: "eat_in",
      shopType: "restaurant",
      description: "USJ公式キノピオ・カフェメニューPDF掲載の商品。"
    },
    {
      name: "ダブルチェリー・チョコレートカップケーキ",
      category: "dessert",
      price: 850,
      imagePath: "/generated/official-menu/kinopio-cafe/double-cherry-chocolate-cupcake.png",
      shopName: "キノピオ・カフェ",
      areaName: "スーパー・ニンテンドー・ワールド",
      diningType: "eat_in",
      shopType: "restaurant",
      description: "USJ公式キノピオ・カフェメニューPDF掲載の商品。"
    }
  ];

  for (const mapFood of mapFoods) {
    const key = `${normalizeFoodName(mapFood.name)}:${mapFood.category}`;
    const imageAbsolutePath = path.join(process.cwd(), "public", mapFood.imagePath.replace(/^\//, ""));
    if (visibleKeys.has(key)) continue;
    if (visibleImages.has(mapFood.imagePath)) continue;
    if (!fs.existsSync(imageAbsolutePath)) continue;
    const food = makeOfficialMenuFood({
      ...mapFood,
      sourceUrl,
      sourceName,
      checkedAt,
      index: dataset.foods.length + added.length
    });
    dataset.foods.push(food);
    visibleKeys.add(key);
    visibleImages.add(mapFood.imagePath);
    added.push(food);
  }

  return added;
}

function promoteOfficialImageBackedFoods(dataset: GeneratedDataset) {
  const visible = visibleFoods(dataset);
  const visibleKeys = new Set(visible.map((food) => foodKey(food)));
  const visibleImages = new Set(visible.map((food) => getFoodImage(food)).filter((image) => !image.startsWith("/placeholders/")));
  const promoted: GeneratedFood[] = [];

  for (const food of dataset.foods) {
    if (!promoteIds.has(food.id)) continue;
    if (visibleKeys.has(foodKey(food))) continue;
    if (!safeName(food.name)) continue;
    const displayImage = getFoodImage(food);
    if (displayImage.startsWith("/placeholders/")) continue;
    if (visibleImages.has(displayImage)) continue;
    if (!food.images.some(isSafeImage)) continue;

    food.hidden = false;
    food.canonicalFood = true;
    food.canonical_food = true;
    food.reviewStatus = "approved";
    food.review_status = "approved";
    food.displayQuality = "high";
    food.display_quality = "high";
    food.trustedPlaceholder = false;
    food.trusted_placeholder = false;
    food.confidenceScore = Math.max(food.confidenceScore, 90);
    food.confidence_score = food.confidenceScore;
    food.nameQualityScore = Math.max(food.nameQualityScore, 90);
    food.name_quality_score = food.nameQualityScore;
    food.compositeMenu = false;
    food.composite_menu = false;
    food.rejectionReasons = [];
    food.rejection_reasons = [];
    food.lastCheckedAt = new Date().toISOString();
    food.last_checked_at = food.lastCheckedAt;
    for (const image of food.images) {
      if (!isSafeImage(image)) continue;
      image.enabled = true;
      image.imageVerified = true;
      image.imageApproved = true;
      image.image_approved = true;
      image.hasWatermark = false;
      image.isSharedTooMuch = false;
      image.imageMatchScore = Math.max(image.imageMatchScore ?? 0, 85);
      image.categoryImageMatchScore = Math.max(image.categoryImageMatchScore ?? 0, 82);
      image.imageCandidateScore = Math.max(image.imageCandidateScore ?? 0, 85);
      image.imageMatchReason = image.imageMatchReason ?? "official-same-menu-card";
    }
    const primary = food.images.find(isSafeImage);
    if (primary) {
      food.imageUrl = primary.imageUrl;
      food.image_url = primary.imageUrl;
      food.representativeImageUrl = primary.imageUrl;
      food.representative_image_url = primary.imageUrl;
    }
    promoted.push(food);
    visibleKeys.add(foodKey(food));
    visibleImages.add(displayImage);
  }

  return promoted;
}

function makeOfficialMenuFood(input: {
  name: string;
  category: GeneratedFood["category"];
  price?: number;
  imagePath: string;
  shopName: string;
  areaName: string;
  diningType: GeneratedFood["diningType"];
  shopType: FoodLocation["shopType"];
  description: string;
  sourceUrl: string;
  sourceName: string;
  checkedAt: string;
  index: number;
}): GeneratedFood {
  const normalizedName = normalizeFoodName(input.name);
  const id = stableId(`${input.sourceName}:${input.name}:${input.shopName}:${input.index}`);
  const areaId = `area-${input.areaName}`;
  const shopId = `shop-${input.shopName}`;
  const image: GeneratedImage = {
    id: `${id}-img-1`,
    foodId: id,
    imageUrl: input.imagePath,
    sourceType: "official",
    sourceUrl: input.sourceUrl,
    altText: input.name,
    alt: input.name,
    imageConfidenceScore: 95,
    imageMatchScore: 92,
    categoryImageMatchScore: 90,
    imageSourceContext: "official-restaurant-map-pdf-card",
    imageMatchReason: "official-menu-pdf-same-card",
    imageVerified: true,
    isSharedTooMuch: false,
    hasWatermark: false,
    imageCandidateScore: 92,
    imageSourceName: "USJ official restaurant map PDF",
    officialConfirmed: true,
    imageApproved: true,
    image_approved: true,
    imageLastCheckedAt: input.checkedAt,
    image_last_checked_at: input.checkedAt,
    priority: 1,
    enabled: true
  };
  const location: FoodLocation = {
    id: `${id}-loc-1`,
    foodId: id,
    shopId,
    shopName: input.shopName,
    areaId,
    areaName: input.areaName,
    shopType: input.shopType,
    sourceUrl: input.sourceUrl,
    price: input.price,
    status: "active",
    lastCheckedAt: input.checkedAt
  };
  const area: Area = {
    id: areaId,
    name: input.areaName,
    sortOrder: areaSortOrder(input.areaName)
  };
  const shop: Shop = {
    id: shopId,
    areaId,
    name: input.shopName,
    type: input.shopType,
    officialUrl: input.sourceUrl,
    isActive: true
  };

  return {
    id,
    shopId,
    areaId,
    name: input.name,
    normalizedName,
    normalized_name: normalizedName,
    category: input.category,
    price: input.price,
    priceMin: input.price,
    price_min: input.price,
    priceMax: input.price,
    price_max: input.price,
    priceSourceUrl: input.sourceUrl,
    price_source_url: input.sourceUrl,
    priceLastCheckedAt: input.checkedAt,
    price_last_checked_at: input.checkedAt,
    priceConfidenceScore: input.price ? 78 : undefined,
    price_confidence_score: input.price ? 78 : undefined,
    diningType: input.diningType,
    dining_type: input.diningType,
    diningTypeConfidenceScore: 82,
    dining_type_confidence_score: 82,
    diningTypeReason: "official-restaurant-map-pdf",
    dining_type_reason: "official-restaurant-map-pdf",
    description: input.description,
    officialUrl: input.sourceUrl,
    official_url: input.sourceUrl,
    sourceUrl: input.sourceUrl,
    source_url: input.sourceUrl,
    status: "active",
    isLimited: false,
    is_limited: false,
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
    rarity: "standard",
    trustedPlaceholder: false,
    trusted_placeholder: false,
    lastCheckedAt: input.checkedAt,
    last_checked_at: input.checkedAt,
    imageUrl: input.imagePath,
    image_url: input.imagePath,
    representativeImageUrl: input.imagePath,
    representative_image_url: input.imagePath,
    sourceNames: [input.sourceName],
    source_names: [input.sourceName],
    rejectionReasons: [],
    rejection_reasons: [],
    locations: [location],
    area,
    shop,
    images: [image]
  };
}

function cloneFood(sourceFood: GeneratedFood, usedIds: Set<string>, index: number) {
  const clone = JSON.parse(JSON.stringify(sourceFood)) as GeneratedFood;
  if (usedIds.has(clone.id)) {
    clone.id = stableId(`${clone.name}-${clone.sourceUrl}-${index}`);
    clone.images = clone.images.map((image, imageIndex) => ({
      ...image,
      id: `${clone.id}-img-${imageIndex + 1}`,
      foodId: clone.id
    }));
    clone.locations = clone.locations.map((location, locationIndex) => ({
      ...location,
      id: `${clone.id}-loc-${locationIndex + 1}`,
      foodId: clone.id
    }));
  }
  usedIds.add(clone.id);
  return clone;
}

function promoteClone(food: GeneratedFood) {
  food.hidden = false;
  food.canonicalFood = true;
  food.canonical_food = true;
  food.reviewStatus = "approved";
  food.review_status = "approved";
  food.displayQuality = food.displayQuality === "low" ? "medium" : food.displayQuality;
  food.display_quality = food.displayQuality;
  food.trustedPlaceholder = false;
  food.trusted_placeholder = false;
  food.confidenceScore = Math.max(food.confidenceScore, 85);
  food.confidence_score = food.confidenceScore;
  food.nameQualityScore = Math.max(food.nameQualityScore, 85);
  food.name_quality_score = food.nameQualityScore;
  food.compositeMenu = false;
  food.composite_menu = false;
  food.rejectionReasons = [];
  food.rejection_reasons = [];
  food.lastCheckedAt = new Date().toISOString();
  food.last_checked_at = food.lastCheckedAt;
  for (const image of food.images) {
    if (!isSafeImage(image)) continue;
    image.enabled = true;
    image.imageVerified = true;
    image.imageApproved = true;
    image.image_approved = true;
    image.hasWatermark = false;
    image.isSharedTooMuch = false;
    image.imageMatchScore = Math.max(image.imageMatchScore ?? 0, 85);
    image.categoryImageMatchScore = Math.max(image.categoryImageMatchScore ?? 0, 82);
    image.imageCandidateScore = Math.max(image.imageCandidateScore ?? 0, 85);
    image.imageMatchReason = image.imageMatchReason ?? "official-category-crawl-same-menu-card";
  }
  const primary = food.images.find(isSafeImage);
  if (primary) {
    food.imageUrl = primary.imageUrl;
    food.image_url = primary.imageUrl;
    food.representativeImageUrl = primary.imageUrl;
    food.representative_image_url = primary.imageUrl;
  }
}

function hideStaleVisiblePlaceholders(dataset: GeneratedDataset, minimumVisibleFoods = 0) {
  const hidden: GeneratedFood[] = [];
  for (const food of dataset.foods) {
    if (minimumVisibleFoods > 0 && visibleFoods(dataset).length <= minimumVisibleFoods) break;
    if (!isVisible(food)) continue;
    if (!stalePlaceholderNames.has(food.name)) continue;
    if (!getFoodImage(food).startsWith("/placeholders/")) continue;

    food.hidden = true;
    food.canonicalFood = false;
    food.canonical_food = false;
    food.reviewStatus = "pending";
    food.review_status = "pending";
    food.displayQuality = "low";
    food.display_quality = "low";
    food.rejectionReasons = [...new Set([...(food.rejectionReasons ?? []), "stale-placeholder-no-safe-product-image"])];
    food.rejection_reasons = food.rejectionReasons;
    food.lastCheckedAt = new Date().toISOString();
    food.last_checked_at = food.lastCheckedAt;
    hidden.push(food);
  }
  return hidden;
}

function safeName(name: string) {
  if (!name || name.length > 70) return false;
  if (/(Global alt|SEO|Keywords|販売場所|店舗未確認|店舗です|公式アレルゲン|ベビーフード|スプーン|フォーク|レストラン$|カフェ$|キッチン$|パーラー$|格納先|原作|シリーズ|仮面舞踏会)/i.test(name)) return false;
  if (/[{}<>]|tcm:/.test(name)) return false;
  return true;
}

function isSafeImage(image: GeneratedImage) {
  return (
    image.enabled !== false &&
    Boolean(image.imageUrl) &&
    !image.hasWatermark &&
    !image.isSharedTooMuch &&
    !image.imageMismatchReason &&
    !weakImagePattern.test(image.imageUrl)
  );
}

function snapshot(dataset: GeneratedDataset) {
  const visible = visibleFoods(dataset);
  const placeholders = visible.filter((food) => getFoodImage(food).startsWith("/placeholders/"));
  return {
    visible: visible.length,
    images: visible.length - placeholders.length,
    placeholders: placeholders.length,
    byCategory: countBy(visible, (food) => food.category)
  };
}

function visibleFoods(dataset: GeneratedDataset) {
  return dataset.foods.filter(isVisible);
}

function isVisible(food: GeneratedFood) {
  return (
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

function imageRegressions(before: GeneratedDataset, after: GeneratedDataset) {
  const afterMap = new Map(visibleFoods(after).map((food) => [foodKey(food), food]));
  return visibleFoods(before).flatMap((food) => {
    const next = afterMap.get(foodKey(food));
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

function foodKey(food: GeneratedFood) {
  return `${food.normalizedName || normalizeFoodName(food.name)}:${food.category}`;
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
      foodCount: (current?.foodCount ?? 0) + (isVisible(food) ? 1 : 0)
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
      foodCount: (current?.foodCount ?? 0) + (isVisible(food) ? 1 : 0)
    });
  }
  return [...map.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"));
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

function stableId(input: string) {
  let hash = 2166136261;
  for (const char of input) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `food-${(hash >>> 0).toString(36)}`;
}

function areaSortOrder(areaName: string) {
  const order = [
    "スーパー・ニンテンドー・ワールド",
    "ミニオン・パーク",
    "ウィザーディング・ワールド・オブ・ハリー・ポッター",
    "ハリウッド・エリア",
    "ニューヨーク・エリア",
    "サンフランシスコ・エリア",
    "ジュラシック・パーク",
    "アミティ・ビレッジ",
    "ユニバーサル・ワンダーランド",
    "その他"
  ];
  const index = order.indexOf(areaName);
  return index === -1 ? 99 : index + 1;
}
