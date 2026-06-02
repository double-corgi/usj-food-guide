import type { CrawledImage } from "../types/crawler";
import type { FoodCategory } from "../../types/domain";
import { normalizeOfficialImageUrl, scoreImageForFood } from "./extract-images";
import { inferCategory, similarity } from "./normalize-food";

const badImagePattern =
  /(logo|icon|favicon|banner|bg-|background|sprite|map|sns|facebook|twitter|instagram|youtube|app-store|google-play|app-banner|loading|placeholder|arrow|button|modal|qr|guide|calendar|footer|header|castel\.jp|watermark|透かし|©|copyright|photo[_-]?by|user[_-]?name|author|avatar)/i;
const goodImagePattern = /(food|menu|restaurant|cafe|churro|popcorn|drink|burger|pizza|plate|meal|set|dessert|sweets|ice|chicken|turkey|rice|curry|noodle|gourmet)/i;

export function filterAndRankImages(images: CrawledImage[], foodName: string, category: FoodCategory = "unknown") {
  const seen = new Set<string>();
  return images
    .filter((image) => {
      if (!image.imageUrl || seen.has(image.imageUrl)) return false;
      seen.add(image.imageUrl);
      if (/\.svg($|\?)/i.test(image.imageUrl)) return false;
      if (badImagePattern.test(`${image.imageUrl} ${image.altText ?? ""} ${image.caption ?? ""}`)) return false;
      if (detectWatermarkImage(image)) return false;
      return /\.(jpe?g|png|webp)($|\?)/i.test(image.imageUrl);
    })
    .map((image) => ({ ...image, imageUrl: normalizeOfficialImageUrl(image.imageUrl, image.sourceUrl ?? "https://www.usj.co.jp/") ?? image.imageUrl }))
    .map((image, index) => {
      const haystack = `${image.imageUrl} ${image.altText ?? ""}`.toLowerCase();
      let priority = image.priority ?? 50;
      const imageConfidenceScore = scoreImageForFood(image, { name: foodName, sourceUrl: image.sourceUrl });
      const match = scoreVerifiedImageMatch(image, foodName, category);
      if (goodImagePattern.test(haystack)) priority -= 25;
      if (image.altText && hasNameOverlap(foodName, image.altText)) priority -= 20;
      if (/offercard|menu|food|gds-images/i.test(image.imageUrl)) priority -= 15;
      if (/logo|banner|map|icon|sns/i.test(haystack)) priority += 80;
      if (imageConfidenceScore < 30) priority += 50;
      if (!match.imageVerified) priority += 80;
      return {
        ...image,
        imageConfidenceScore,
        imageMatchScore: match.imageMatchScore,
        categoryImageMatchScore: match.categoryImageMatchScore,
        imageVerified: match.imageVerified,
        imageMatchReason: match.imageMatchReason,
        imageMismatchReason: match.imageMismatchReason,
        priority: Math.max(1, priority + index)
      };
    })
    .filter((image) => (image.priority ?? 100) < 180 && (image.imageConfidenceScore ?? 0) >= 28)
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))
    .slice(0, 6);
}

export function scoreVerifiedImageMatch(image: CrawledImage, foodName: string, category: FoodCategory) {
  const imageUrl = image.imageUrl.toLowerCase();
  const text = `${image.altText ?? ""} ${image.title ?? ""} ${image.caption ?? ""} ${image.imageSourceContext ?? ""}`.normalize("NFKC");
  const haystack = `${imageUrl} ${text}`.toLowerCase();
  const categoryImageMatchScore = scoreCategoryImageMatch(haystack, category);
  const nameSimilarity = Math.max(
    image.altText ? similarity(foodName, image.altText) : 0,
    image.title ? similarity(foodName, image.title) : 0,
    image.caption ? similarity(foodName, image.caption) : 0
  );
  const contextHasName = containsFoodNameSignal(text, foodName);
  const sameBlock = /same-tcm-component|menu-block|near-text-block/i.test(`${image.imageMatchReason ?? ""} ${image.domPath ?? ""}`);
  const generic = detectGenericEventImage(image);
  const mismatch = detectCategoryMismatch(category, haystack);
  let score = 0;
  if (sameBlock) score += 34;
  if (contextHasName) score += 24;
  if (nameSimilarity >= 0.5) score += 36;
  else if (nameSimilarity >= 0.34) score += 22;
  if (/offercard|gallery|food|menu|gds-images/i.test(imageUrl)) score += 16;
  if (categoryImageMatchScore >= 70) score += 22;
  else if (categoryImageMatchScore >= 45) score += 12;
  if (generic) score -= 45;
  if (mismatch) score -= 55;
  if (image.imageMismatchReason) score -= /ambiguous-tcm-component/.test(image.imageMismatchReason) ? 24 : 12;
  if (image.isSharedTooMuch) score -= 60;
  if (!sameBlock && !contextHasName && nameSimilarity < 0.34) score -= 34;
  const imageMatchScore = Math.max(0, Math.min(100, score));
  const trustedSameBlockImage =
    sameBlock &&
    categoryImageMatchScore >= 70 &&
    /offercard|gallery|food|menu|gds-images/i.test(imageUrl) &&
    !/ambiguous/i.test(`${image.domPath ?? ""} ${image.imageMismatchReason ?? ""}`);
  const imageVerified =
    ((imageMatchScore >= 75 && categoryImageMatchScore >= 38) || (trustedSameBlockImage && imageMatchScore >= 70)) &&
    !generic &&
    !mismatch;
  return {
    imageMatchScore,
    categoryImageMatchScore,
    imageVerified,
    imageMatchReason: imageVerified
      ? [sameBlock ? "same-menu-block" : "", contextHasName ? "context-name-match" : "", categoryImageMatchScore >= 45 ? "category-url-match" : ""].filter(Boolean).join(",")
      : image.imageMatchReason,
    imageMismatchReason: imageVerified ? undefined : mismatch || image.imageMismatchReason || (generic ? "generic-event-or-restaurant-image" : imageMatchScore < 75 ? "low-image-product-match" : undefined)
  };
}

export function detectWatermarkImage(image: CrawledImage) {
  const haystack = `${image.imageUrl} ${image.sourceUrl ?? ""} ${image.altText ?? ""} ${image.title ?? ""} ${image.caption ?? ""} ${image.imageSourceContext ?? ""}`.normalize("NFKC");
  if (/castel\.jp|instagram|twitter\.com|x\.com|pinterest|cdninstagram|twimg|sns/i.test(haystack)) return "supplemental-or-sns-source";
  if (/(?:^|[\s/_-])@[A-Za-z0-9_]{3,}|＠[A-Za-z0-9_]{3,}/.test(haystack)) return "at-user-watermark";
  if (/CASTEL|ウォーターマーク|透かし|転載|photo\s*by|画像提供|撮影|copyright|©|all rights reserved/i.test(haystack)) return "watermark-text-signal";
  if (/watermark|credit|author|avatar|profile/i.test(haystack)) return "watermark-url-signal";
  return undefined;
}

export function scoreCategoryImageMatch(haystack: string, category: FoodCategory) {
  const inferred = inferCategory(haystack);
  if (category !== "unknown" && inferred === category) return 92;
  if (category === "set" && /(plate|meal|set|combo|kids|burger|pizza|chicken|rice|curry)/i.test(haystack)) return 72;
  if (category === "dessert" && /(cake|sweets|dessert|ice|sundae|parfait|cookie|chocolate|pie|waffle|cream)/i.test(haystack)) return 84;
  if (category === "drink" && /(drink|beverage|soda|latte|coffee|juice|cocktail|shake|frappe|beer|cup|bottle)/i.test(haystack)) return 84;
  if (category === "churro" && /(churro|churritos|churitos|チュリ|チュロ)/i.test(haystack)) return 94;
  if (category === "popcorn" && /(popcorn|bucket|ポップコーン)/i.test(haystack)) return 94;
  if (category === "burger" && /(burger|hamburger|sandwich|バーガー|サンド)/i.test(haystack)) return 92;
  if (category === "pizza" && /(pizza|pizz|ピザ|ピッツァ)/i.test(haystack)) return 92;
  if (category === "chicken" && /(chicken|turkey|beef|pork|rib|ribs|steak|sausage|meat|チキン|ターキー|ビーフ|ポーク|リブ|ステーキ)/i.test(haystack)) return 92;
  if (category === "rice" && /(rice|curry|bowl|ライス|カレー|丼)/i.test(haystack)) return 92;
  if (category === "noodle" && /(noodle|pasta|spaghetti|ramen|ヌードル|パスタ|スパゲ|ラーメン)/i.test(haystack)) return 92;
  if (category === "snack" && /(snack|fries|potato|hot-?dog|スナック|ポテト|ホットドッグ)/i.test(haystack)) return 84;
  if (category === "kids" && /(kids|kid|children|キッズ|お子さま|hamburger|curry|sandwich)/i.test(haystack)) return 92;
  if (category === "unknown" && /(food|menu|meal|gds-images)/i.test(haystack)) return 45;
  return /(restaurant|interior|hero|area|attraction|staff|teaser|ogp|mainvisual|kv)/i.test(haystack) ? 8 : 30;
}

export function detectGenericEventImage(image: CrawledImage) {
  const haystack = `${image.imageUrl} ${image.altText ?? ""} ${image.title ?? ""} ${image.caption ?? ""}`.toLowerCase();
  return /(castel\.jp|watermark|透かし|hero|teaser|ogp|mainvisual|main-visual|kv|interior|staff|restaurant-[abc]\.|area|attraction|event|campaign|matsuri-nights|related-[abc]\.)/i.test(haystack) && !/(food|offercard|gallery|churro|popcorn|burger|pizza|drink|cake|meal|plate|set)/i.test(haystack);
}

export function detectCategoryMismatch(category: FoodCategory, haystack: string) {
  const inferred = inferCategory(haystack);
  if (scoreCategoryImageMatch(haystack, category) >= 70) return undefined;
  if (category === "unknown" || inferred === "unknown" || inferred === category) return undefined;
  if (category === "set" && ["burger", "pizza", "chicken", "rice", "kids"].includes(inferred)) return undefined;
  if (category === "dessert" && inferred === "drink" && /cream|shake|float|sundae/.test(haystack)) return undefined;
  if (category === "drink" && inferred === "dessert" && /drink|soda|latte|shake|frappe|cocktail/.test(haystack)) return undefined;
  return `category-mismatch:${category}-vs-${inferred}`;
}

function hasNameOverlap(foodName: string, altText: string) {
  const nameTokens = foodName
    .normalize("NFKC")
    .split(/[・\s~〜、。&/／()（）【】「」-]+/)
    .filter((token) => token.length >= 2);
  if (nameTokens.length === 0) return false;
  return nameTokens.some((token) => altText.includes(token));
}

function containsFoodNameSignal(context: string, foodName: string) {
  const cleaned = foodName.normalize("NFKC");
  if (context.includes(cleaned)) return true;
  const tokens = cleaned
    .split(/[・\s~〜、。&/／()（）【】「」!'".-]+/)
    .filter((token) => token.length >= 3 && !/セット|プレート|ドリンク|フード|メニュー/.test(token));
  return tokens.length > 0 && tokens.some((token) => context.includes(token));
}
