import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset, GeneratedFood, GeneratedImage } from "./types/generated";
import { getFoodImage } from "../lib/utils/image";

type SafeChurroImage = {
  key: string;
  url: string;
  sourceUrl: string;
  sourceName: string;
  score: number;
  alt: string;
  matchReason: string;
  officialConfirmed: boolean;
  width?: number;
  height?: number;
};

const outputDir = path.join(process.cwd(), "scripts", "output");
const foodsPath = path.join(outputDir, "foods.generated.json");
const reportPath = path.join(outputDir, "churro-image-backfill-report.json");

const now = new Date().toISOString();

const safeImages: SafeChurroImage[] = [
  {
    key: "ホグワーツ",
    url: "https://c02.castel.jp/400x/0/20250108100554/hogwarts-4-dormitory-turritos-j83569.jpg",
    sourceUrl: "https://castel.jp/p/3101",
    sourceName: "CASTEL",
    score: 92,
    alt: "ホグワーツ4寮チュリトス",
    matchReason: "visual-reviewed: clean churro product card, Hogwarts collaboration match, no visible watermark",
    officialConfirmed: false,
    width: 400
  },
  {
    key: "チョコレートチュリトス",
    url: "https://usj.opus21.net/usj-re/popcorn/26_01/chu-choco.jpg",
    sourceUrl: "https://usj.opus21.net/restaurant/popcorn-food-cart.html",
    sourceName: "USJ情報サイト",
    score: 88,
    alt: "チョコレートチュリトス",
    matchReason: "visual-reviewed: churro product is dominant and exact product name is shown, no visible watermark",
    officialConfirmed: false
  },
  {
    key: "メープル",
    url: "https://c01.castel.jp/400x/0/20240123102735/maple-churritos-p99175.jpg",
    sourceUrl: "https://castel.jp/p/3101",
    sourceName: "CASTEL",
    score: 86,
    alt: "メープルチュリトス",
    matchReason: "visual-reviewed: clean churro product image, flavor match, no visible watermark",
    officialConfirmed: false,
    width: 400
  },
  {
    key: "トラファルガー",
    url: "https://c03.castel.jp/400x/0/20250716135034/trafalgar-laws-orange-bitter-chocolate-churritos-j158275.jpg",
    sourceUrl: "https://castel.jp/p/3101",
    sourceName: "CASTEL",
    score: 94,
    alt: "トラファルガー・ローのオレンジ＆ビターチョコチュリトス",
    matchReason: "visual-reviewed: clean single-product image, collaboration and flavor match, no visible watermark",
    officialConfirmed: false,
    width: 400
  },
  {
    key: "ゼニガメ",
    url: "https://c02.castel.jp/400x/1/20240205161857/splash-squirtle-turitos-vanilla-flavor-center-j131974.jpg",
    sourceUrl: "https://castel.jp/p/3101",
    sourceName: "CASTEL",
    score: 94,
    alt: "スプラッシュ！ゼニガメ・チュリトス～バニラフレーバー～",
    matchReason: "visual-reviewed: hand-held churro product is clear, Squirtle collaboration and vanilla flavor match, no visible watermark",
    officialConfirmed: false,
    width: 400
  },
  {
    key: "超!! チョコバナナ",
    url: "https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-minion-choco-banana-churritos-gallery-a.jpg",
    sourceUrl: "https://www.usj.co.jp/web/ja/jp/restaurants/minion-food",
    sourceName: "USJ公式",
    score: 96,
    alt: "ミニオン・チョコバナナ・チュリトス",
    matchReason: "official-gds-image: Minion chocolate banana churro official image, collaboration and flavor match",
    officialConfirmed: true
  },
  {
    key: "プーギー",
    url: "https://usjhack.com/wp/wp-content/uploads/2024/07/usj_food_churritos_15.jpg",
    sourceUrl: "https://usjhack.com/churitos/",
    sourceName: "USJハック",
    score: 88,
    alt: "プーギーチュリトス〜ピーチ〜",
    matchReason:
      "visual-reviewed: churro product is large and central, collaboration and peach flavor match, no visible watermark, not storefront/shelf/menu-board-only",
    officialConfirmed: false,
    width: 620,
    height: 465
  },
  {
    key: "ストロベリー",
    url: "https://fabbie.co.jp/wp-content/uploads/2024/07/2023-04-18-152259-e1681805956594.webp",
    sourceUrl: "https://fabbie.co.jp/usj-churro/",
    sourceName: "Fabbie",
    score: 90,
    alt: "スウィート・ストロベリー・チュリトス / ココア＆クッキー・チュリトス",
    matchReason:
      "visual-reviewed: paired product photo with the strawberry churro body clearly visible, no visible watermark, not storefront/shelf/menu-board-only",
    officialConfirmed: false,
    width: 640,
    height: 426
  },
  {
    key: "チョコ&クッキー",
    url: "https://c02.castel.jp/1200x/0/20230216080517/chocolate-cookie-churritos-p86536.jpg",
    sourceUrl: "https://castel.jp/item/86536/",
    sourceName: "CASTEL",
    score: 91,
    alt: "チョコ＆クッキーチュリトス",
    matchReason:
      "visual-reviewed: exact chocolate and cookie churro item page, product body and topping are visible, no visible watermark, not storefront/shelf/menu-board-only",
    officialConfirmed: false,
    width: 1200
  },
  {
    key: "ココア&クッキー",
    url: "https://fabbie.co.jp/wp-content/uploads/2024/07/2023-04-18-152259-e1681805956594.webp",
    sourceUrl: "https://fabbie.co.jp/usj-churro/",
    sourceName: "Fabbie",
    score: 90,
    alt: "スウィート・ストロベリー・チュリトス / ココア＆クッキー・チュリトス",
    matchReason:
      "visual-reviewed: paired product photo with the cocoa and cookie churro body clearly visible, flavor match, no visible watermark, not storefront/shelf/menu-board-only",
    officialConfirmed: false,
    width: 640,
    height: 426
  },
  {
    key: "ドルチェ",
    url: "https://nonno.hpplus.jp/wp-content/uploads/IMG_2592-1024x1024.jpg",
    sourceUrl: "https://nonno.hpplus.jp/editors/gourmet/338077/",
    sourceName: "non-no web",
    score: 92,
    alt: "ドルチェ・チュリトス〜ティラミス〜",
    matchReason:
      "visual-reviewed: exact tiramisu churro product photo, product body is large and central, no visible watermark, not storefront/shelf/menu-board",
    officialConfirmed: false,
    width: 1024,
    height: 1024
  },
  {
    key: "虎杖",
    url: "https://stat.ameba.jp/user_images/20221031/11/yourpal-micey/9e/1f/j/o1080108015196063226.jpg",
    sourceUrl: "https://ameblo.jp/yourpal-micey/entry-12772093352.html",
    sourceName: "Ameba",
    score: 90,
    alt: "極秘修行中!?虎杖チュリトス〜コーラフレーバー〜",
    matchReason:
      "visual-reviewed: exact Itadori collaboration churro, product body is clear and dominant, no visible watermark, not storefront/shelf/menu-board",
    officialConfirmed: false,
    width: 1080,
    height: 1080
  },
  {
    key: "クリスマス・チョコ",
    url: "https://c03.castel.jp/1200x/0/christmas-chocolate-churritos-j66220.jpg",
    sourceUrl: "https://castel.jp/p/3101",
    sourceName: "CASTEL",
    score: 91,
    alt: "クリスマス・チョコ・チュリトス",
    matchReason:
      "visual-reviewed: exact Christmas chocolate churro product photo, product bodies are large and central, no visible watermark, not storefront/shelf/menu-board",
    officialConfirmed: false,
    width: 1200,
    height: 720
  }
];

const rejectedVisualFindings = [
  { name: "ソルティキャラメルチュリトス", reason: "Happyell候補はチュリトスカート店舗外観・看板写真で、商品本体が主役ではないため不採用" },
  { name: "チョコ&クッキーチュリトス", reason: "CASTEL itemページの単体商品画像を採用。陳列棚・透かし付き候補は不採用" },
  { name: "シナモン・チュリトス", reason: "商品本体候補はCASTEL透かしあり。Yota候補はメニュー看板のため不採用" },
  { name: "デクの \"ワン・フォー・オール\" チョコレート・チュリトス ~ピスタチオ~", reason: "USJハック/CASTEL候補はいずれも看板・POP寄り、または透かしあり" },
  { name: "スパイダーマン・チュリトス~ラズベリー~", reason: "USJ365候補は商品本体だがPhoto by USJ365透かしあり。CASTEL候補も透かしあり" },
  { name: "クリスマス・チョコ・チュリトス", reason: "USJハック候補は看板・商品グラフィック寄り。CASTELの1200px商品写真のみ採用対象" },
  { name: "おさるのジョージ・チュリトス", reason: "USJ365候補は商品本体だがPhoto by USJ365透かしあり。USJハック候補は看板・POP寄り" }
];

const dataset = JSON.parse(fs.readFileSync(foodsPath, "utf8")) as GeneratedDataset;
const visibleChurros = visibleFoods(dataset.foods).filter(isChurroFood);
const beforePlaceholders = visibleChurros.filter((food) => getFoodImage(food).startsWith("/placeholders/"));
const beforeVerified = visibleChurros.filter((food) => !getFoodImage(food).startsWith("/placeholders/"));
const beforePlaceholderNames = beforePlaceholders.map((food) => food.name);

const replacements: Array<{ foodId: string; name: string; imageUrl: string; score: number; sourceName: string }> = [];
const lowScoreOrRejected: Array<{ name: string; reason: string }> = [...rejectedVisualFindings];

for (const food of beforePlaceholders) {
  const image = selectSafeImage(food);
  if (!image) continue;
  attachImage(food, image);
  replacements.push({
    foodId: food.id,
    name: food.name,
    imageUrl: image.url,
    score: image.score,
    sourceName: image.sourceName
  });
}

dataset.summary.withImages = visibleFoods(dataset.foods).filter((food) => !getFoodImage(food).startsWith("/placeholders/")).length;
fs.writeFileSync(foodsPath, `${JSON.stringify(dataset, null, 2)}\n`);

const afterVisibleChurros = visibleFoods(dataset.foods).filter(isChurroFood);
const afterPlaceholders = afterVisibleChurros.filter((food) => getFoodImage(food).startsWith("/placeholders/"));
const afterVerified = afterVisibleChurros.filter((food) => !getFoodImage(food).startsWith("/placeholders/"));

const report = {
  generatedAt: now,
  target: "churro-placeholder-backfill",
  totalChurros: visibleChurros.length,
  beforePlaceholderCount: beforePlaceholders.length,
  afterPlaceholderCount: afterPlaceholders.length,
  beforeVerifiedCount: beforeVerified.length,
  afterVerifiedCount: afterVerified.length,
  replacedCount: replacements.length,
  imageCandidateCount: safeImages.length + rejectedVisualFindings.length,
  watermarkExcludedCount: rejectedVisualFindings.filter((item) => /透かし/.test(item.reason)).length,
  lowScoreOrRejectedCount: lowScoreOrRejected.length,
  replacements,
  beforePlaceholderNames,
  remainingPlaceholderNames: afterPlaceholders.map((food) => food.name),
  rejectedVisualFindings: lowScoreOrRejected
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

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

function isChurroFood(food: GeneratedFood) {
  return food.category === "churro" || /チュリトス|チュロス|churro|churros/i.test(food.name);
}

function selectSafeImage(food: GeneratedFood) {
  return safeImages.find((image) => food.name.includes(image.key));
}

function attachImage(food: GeneratedFood, candidate: SafeChurroImage) {
  const existing = food.images.find((image) => image.imageUrl === candidate.url);
  if (existing) {
    existing.enabled = true;
    existing.sourceType = candidate.officialConfirmed ? "official" : "own";
    existing.priority = 1;
    existing.imageVerified = true;
    existing.imageMatchScore = candidate.score;
    existing.categoryImageMatchScore = 95;
    existing.imageCandidateScore = candidate.score;
    existing.imageConfidenceScore = candidate.score;
    existing.hasWatermark = false;
    existing.watermarkReason = undefined;
    existing.isSharedTooMuch = false;
    existing.imageMismatchReason = undefined;
    existing.imageMatchReason = candidate.matchReason;
    existing.imageSourceContext = "churro visual backfill: product-dominant, no watermark, no storefront/shelf/menu-board-only issue";
    existing.sourceUrl = candidate.sourceUrl;
    existing.imageSourceName = candidate.sourceName;
    existing.officialConfirmed = candidate.officialConfirmed;
    existing.imageLastCheckedAt = now;
    existing.altText = candidate.alt;
    existing.alt = candidate.alt;
    existing.width = candidate.width;
    existing.height = candidate.height;
  } else {
    const image: GeneratedImage = {
      id: `img-${food.id}-churro-backfill-${slugify(candidate.key)}`,
      foodId: food.id,
      imageUrl: candidate.url,
      sourceType: candidate.officialConfirmed ? "official" : "own",
      sourceUrl: candidate.sourceUrl,
      altText: candidate.alt,
      alt: candidate.alt,
      width: candidate.width,
      height: candidate.height,
      imageConfidenceScore: candidate.score,
      imageMatchScore: candidate.score,
      categoryImageMatchScore: 95,
      imageSourceContext: "churro visual backfill: product-dominant, no watermark, no storefront/shelf/menu-board-only issue",
      imageMatchReason: candidate.matchReason,
      imageVerified: true,
      isSharedTooMuch: false,
      hasWatermark: false,
      watermarkReason: undefined,
      imageCandidateScore: candidate.score,
      imageSourceName: candidate.sourceName,
      officialConfirmed: candidate.officialConfirmed,
      imageLastCheckedAt: now,
      priority: 1,
      enabled: true
    };
    food.images.push(image);
  }

  food.imageUrl = candidate.url;
  food.image_url = candidate.url;
  food.representativeImageUrl = candidate.url;
  food.representative_image_url = candidate.url;
  food.trustedPlaceholder = false;
  food.trusted_placeholder = false;
  food.lastCheckedAt = now;
  food.last_checked_at = now;
}

function slugify(input: string) {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9一-龠ぁ-んァ-ヶー]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
