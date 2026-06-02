import fs from "node:fs";
import path from "node:path";
import { loadEnvFiles } from "./utils/load-env";
import type { ImageCandidate } from "../types/domain";
import type { CrawlRunResult, CrawledFood, CrawledImage } from "./types/crawler";
import type { GeneratedDataset, GeneratedFood } from "./types/generated";
import { getFoodImage } from "../lib/utils/image";
import { normalizeFoodName, similarity } from "./utils/normalize-food";

const outputDir = path.join(process.cwd(), "scripts", "output");
const datasetPath = path.join(outputDir, "foods.generated.json");
const crawlReportPath = path.join(outputDir, "latest-crawl-report.json");
const candidatesPath = path.join(outputDir, "image-candidates.generated.json");
const placeholdersPath = path.join(outputDir, "image-candidate-placeholders.json");
const reportPath = path.join(outputDir, "image-candidates.crawl-report.json");
const PUBLIC_IMAGE_SCORE_THRESHOLD = 90;
const REPORT_CATEGORIES = ["churro", "popcorn", "drink", "dessert", "snack"] as const;

type RawCandidate = {
  food: GeneratedFood;
  candidateUrl: string;
  thumbnailUrl?: string;
  sourcePage?: string;
  sourceName?: string;
  query?: string;
  imageWidth?: number;
  imageHeight?: number;
  sourceFoodName?: string;
  sourceImage?: CrawledImage;
};

async function main() {
  loadEnvFiles();
  const mode = process.argv[2] ?? "all";
  const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8")) as GeneratedDataset;
  const crawlReport = JSON.parse(fs.readFileSync(crawlReportPath, "utf8")) as CrawlRunResult;
  const existing = readExistingCandidates();
  const now = new Date().toISOString();
  const placeholderFoods = visibleFoods(dataset.foods).filter((food) => getFoodImage(food).startsWith("/placeholders/") && modeMatches(food, mode));
  const queryCountByFood = Object.fromEntries(placeholderFoods.map((food) => [food.id, buildImageSearchQueries(food).length]));
  const rawCandidates = collectFromCrawlReport(placeholderFoods, crawlReport);

  const deduped = new Map<string, ImageCandidate>();
  for (const candidate of rawCandidates) {
    const scored = scoreImageCandidate(candidate, now);
    if (!scored) continue;
    const key = `${scored.foodId}:${scored.candidateUrl}`;
    const previous = existing.find((item) => item.id === scored.id || `${item.foodId}:${item.candidateUrl}` === key);
    deduped.set(key, {
      ...scored,
      isApproved: previous?.isApproved ?? scored.isApproved,
      isRejected: previous?.isRejected ?? scored.isRejected,
      createdAt: previous?.createdAt ?? scored.createdAt,
      updatedAt: previous ? now : scored.updatedAt
    });
  }

  const scoredCandidates = applySharedImagePenalty(Array.from(deduped.values()));
  const scopedFoodIds = new Set(placeholderFoods.map((food) => food.id));
  const preserved = mode === "all" ? [] : existing.filter((candidate) => !scopedFoodIds.has(candidate.foodId));
  const candidates = [...preserved, ...scoredCandidates].sort((a, b) => b.imageMatchScore - a.imageMatchScore || a.foodName.localeCompare(b.foodName, "ja"));
  fs.writeFileSync(candidatesPath, JSON.stringify(candidates, null, 2));
  const scopedCandidates = candidates.filter((candidate) => scopedFoodIds.has(candidate.foodId));
  const placeholderRows = placeholderFoods.map((food) => toPlaceholderRow(food, scopedCandidates, queryCountByFood[food.id] ?? 0));
  fs.writeFileSync(placeholdersPath, JSON.stringify(placeholderRows, null, 2));
  const report = {
    generatedAt: now,
    placeholderFoods: placeholderFoods.length,
    candidates: candidates.length,
    approved: candidates.filter((candidate) => candidate.isApproved).length,
    rejected: candidates.filter((candidate) => candidate.isRejected).length,
    watermark: candidates.filter((candidate) => candidate.hasWatermark).length,
    publicEligible: candidates.filter(isPublicEligible).length,
    sharedImageCandidates: candidates.filter((candidate) => candidate.reasons.some((reason) => reason.startsWith("shared image"))).length,
    bySource: countBy(candidates, (candidate) => candidate.sourceDomain ?? "unknown"),
    byFood: countBy(candidates, (candidate) => candidate.foodName),
    queryCountByFood,
    searchQueriesPlanned: Object.values(queryCountByFood).reduce((sum, count) => sum + count, 0),
    categoryImageAcquisition: buildCategoryImageAcquisitionReport(visibleFoods(dataset.foods)),
    remainingPlaceholders: placeholderRows,
    remainingReasonCounts: countBy(placeholderRows, (row) => row.placeholderReason),
    paidImageSearchApi: "disabled",
    paidImageSearchReason: "manual URL registration only; Google Custom Search API is not used",
    mode,
    noCandidateFoods: placeholderRows.filter((food) => food.candidateCount === 0).map((food) => food.name)
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

function applySharedImagePenalty(candidates: ImageCandidate[]) {
  const usedByFood = new Map<string, Set<string>>();
  for (const candidate of candidates) {
    const key = normalizeImageKey(candidate.candidateUrl);
    const used = usedByFood.get(key) ?? new Set<string>();
    used.add(candidate.foodId);
    usedByFood.set(key, used);
  }
  return candidates.map((candidate) => {
    const usedCount = usedByFood.get(normalizeImageKey(candidate.candidateUrl))?.size ?? 1;
    if (usedCount < 3) return candidate;
    const penalty = usedCount >= 5 ? 80 : 45;
    return {
      ...candidate,
      imageMatchScore: Math.max(0, candidate.imageMatchScore - penalty),
      isProductPhoto: false,
      reasons: [...candidate.reasons, `shared image used by ${usedCount} foods -${penalty}`]
    };
  });
}

function normalizeImageKey(url: string) {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/(?:400x|800x|1200x)\//, "/");
  } catch {
    return url.split("?")[0];
  }
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

function collectFromCrawlReport(placeholderFoods: GeneratedFood[], report: CrawlRunResult): RawCandidate[] {
  const raw: RawCandidate[] = [];
  const sourceFoods = report.sources.flatMap((source) => source.foods.map((food) => ({ sourceName: source.sourceName, food })));
  for (const food of placeholderFoods) {
    const foodQueries = buildQueries(food);
    for (const { sourceName, food: sourceFood } of sourceFoods) {
      const relation = candidateRelation(food, sourceFood);
      if (relation < 0.45 && !foodQueries.some((query) => normalizeFoodName(sourceFood.name).includes(normalizeFoodName(query)))) continue;
      for (const image of sourceFood.images ?? []) {
        if (!image.imageUrl || !isImageUrl(image.imageUrl)) continue;
        raw.push({
          food,
          candidateUrl: image.imageUrl,
          thumbnailUrl: image.imageUrl,
          sourcePage: image.sourceUrl ?? sourceFood.sourceUrl,
          sourceName,
          imageWidth: image.width,
          imageHeight: image.height,
          sourceFoodName: sourceFood.name,
          sourceImage: image
        });
      }
    }
  }
  return raw;
}

function scoreImageCandidate(raw: RawCandidate, now: string): ImageCandidate | undefined {
  const sourceDomain = getDomain(raw.sourcePage ?? raw.candidateUrl);
  const officialConfirmed = /(^|\.)usj\.co\.jp$/i.test(sourceDomain);
  const sourceText = `${raw.candidateUrl} ${raw.thumbnailUrl ?? ""} ${raw.sourcePage ?? ""} ${raw.sourceName ?? ""} ${raw.sourceFoodName ?? ""} ${raw.sourceImage?.altText ?? ""} ${raw.sourceImage?.caption ?? ""} ${raw.sourceImage?.imageSourceContext ?? ""}`.normalize("NFKC");
  const watermarkReason = detectWatermark(sourceText);
  const isStorefront = detectStorefront(sourceText);
  const isMenuBoard = detectMenuBoard(sourceText);
  const isCollage = detectCollage(sourceText);
  const isCharacterOnly = detectCharacterOnly(sourceText);
  const sameName = normalizeFoodName(raw.food.name) === normalizeFoodName(raw.sourceFoodName ?? "");
  const nameScore = Math.max(
    raw.sourceFoodName ? similarity(raw.food.name, raw.sourceFoodName) : 0,
    raw.sourceImage?.altText ? similarity(raw.food.name, raw.sourceImage.altText) : 0,
    raw.sourceImage?.caption ? similarity(raw.food.name, raw.sourceImage.caption) : 0
  );
  const contextHasName = sourceText.includes(raw.food.name) || importantTokens(raw.food.name).some((token) => sourceText.includes(token));
  const sameCategory = categoryMatches(raw.food.category, sourceText);
  const sameBlock = /same-html-block|same-tcm-product|same-menu-block|near-text-block|Castel article section/i.test(raw.sourceImage?.imageMatchReason ?? "");
  const highResolution = (raw.imageWidth ?? 0) >= 600 || (raw.imageHeight ?? 0) >= 600 || /(?:800x|1200x|original|large|_l\.|-[hl]\.)/i.test(raw.candidateUrl);
  const isCloseupFood = detectCloseupFood(raw.food.category, sourceText, raw.imageWidth, raw.imageHeight);
  const flavorMatch = detectFlavorMatch(raw.food, sourceText);
  const collaborationMatch = detectCollaborationMatch(raw.food, sourceText);
  const needsCollaborationMatch = collaborationTokens(raw.food.name).length > 0;
  const collaborationConflict = detectCollaborationConflict(raw.food, sourceText);
  const identityMatch = sameName || nameScore >= 0.72 || contextHasName || collaborationMatch || (!needsCollaborationMatch && flavorMatch);
  const productMatchScore = Math.round(
    Math.min(
      100,
      (sameName ? 40 : 0) +
        (nameScore >= 0.72 ? 25 : 0) +
        (contextHasName ? 15 : 0) +
        (flavorMatch ? 15 : 0) +
        (collaborationMatch ? 15 : 0) +
        (sameCategory ? 10 : 0) +
        (sameBlock ? 10 : 0)
    )
  );
  const isProductPhoto = !isStorefront && !isMenuBoard && !isCollage && !isCharacterOnly && !watermarkReason && !collaborationConflict && identityMatch && sameCategory;
  let score = 0;
  const reasons: string[] = [];
  if (officialConfirmed) {
    score += 50;
    reasons.push("official +50");
  } else if (isTrustedSupplementalDomain(sourceDomain)) {
    score += 20;
    reasons.push("trusted supplemental +20");
  } else {
    score -= 10;
    reasons.push("untrusted/unknown supplemental -10");
  }
  if (sameName) {
    score += 40;
    reasons.push("exact product name +40");
  } else if (nameScore >= 0.72) {
    score += 20;
    reasons.push("strong product name match +20");
  } else if (contextHasName) {
    score += 15;
    reasons.push("context token match +15");
  }
  if (sameBlock) {
    score += 20;
    reasons.push("same block +20");
  }
  if (flavorMatch) {
    score += 30;
    reasons.push("flavor match +30");
  }
  if (collaborationMatch) {
    score += 30;
    reasons.push("collaboration match +30");
  }
  if (sameCategory) {
    score += 10;
    reasons.push("same category +10");
  }
  if (isCloseupFood) {
    score += 50;
    reasons.push("product main/closeup signal +50");
  }
  if (highResolution) {
    score += 15;
    reasons.push("high resolution +15");
  }
  if (!watermarkReason) {
    score += 30;
    reasons.push("no watermark signal +30");
  } else {
    score -= 100;
    reasons.push(`watermark ${watermarkReason} -100`);
  }
  if (isStorefront) {
    score -= 100;
    reasons.push("storefront/shelf/distant scene -100");
  }
  if (isMenuBoard) {
    score -= 90;
    reasons.push("menu board / POP only -90");
  }
  if (isCollage) {
    score -= 60;
    reasons.push("collage/group image -60");
  }
  if (isCharacterOnly) {
    score -= 70;
    reasons.push("character only -70");
  }
  if (collaborationConflict) {
    score -= 120;
    reasons.push(`different collaboration signal:${collaborationConflict} -120`);
  }
  if (!identityMatch) {
    score -= 90;
    reasons.push("missing product identity match -90");
  }
  if (!isProductPhoto) {
    score -= 30;
    reasons.push("not confirmed product photo -30");
  } else {
    score += 20;
    reasons.push("confirmed product photo +20");
  }

  const imageMatchScore = Math.max(0, Math.min(100, score));
  if (imageMatchScore < 20 && !watermarkReason && !isStorefront && !isCollage) return undefined;
  return {
    id: stableId("candidate", `${raw.food.id}:${raw.candidateUrl}`),
    foodId: raw.food.id,
    foodName: raw.food.name,
    category: raw.food.category,
    candidateUrl: raw.candidateUrl,
    thumbnailUrl: raw.thumbnailUrl,
    sourcePage: raw.sourcePage,
    sourceDomain,
    sourceName: raw.sourceName,
    imageWidth: raw.imageWidth,
    imageHeight: raw.imageHeight,
    imageMatchScore,
    hasWatermark: Boolean(watermarkReason),
    watermarkReason,
    isProductPhoto,
    isStorefront,
    isMenuBoard,
    isCollage,
    isCharacterOnly,
    isCloseupFood,
    productMatchScore,
    isApproved: false,
    isRejected: false,
    officialConfirmed,
    reasons,
    query: raw.query,
    createdAt: now,
    updatedAt: now
  };
}

function buildQueries(food: GeneratedFood) {
  return buildImageSearchQueries(food);
}

function toPlaceholderRow(food: GeneratedFood, candidates: ImageCandidate[], queryCount: number) {
  const foodCandidates = candidates.filter((candidate) => candidate.foodId === food.id);
  return {
    foodId: food.id,
    name: food.name,
    category: food.category,
    area: food.area.name,
    shop: food.shop.name,
    sourceUrl: food.sourceUrl,
    queryCount,
    candidateCount: foodCandidates.length,
    bestScore: Math.max(0, ...foodCandidates.map((candidate) => candidate.imageMatchScore)),
    placeholderReason: classifyPlaceholderReason(foodCandidates)
  };
}

function classifyPlaceholderReason(candidates: ImageCandidate[]) {
  if (candidates.length === 0) return "クロール候補0件 / 手動登録待ち";
  if (candidates.every((candidate) => candidate.hasWatermark)) return "watermarkのみ";
  if (candidates.every((candidate) => candidate.isStorefront)) return "店舗・棚・遠景のみ";
  if (candidates.every((candidate) => candidate.isMenuBoard)) return "看板・POPのみ";
  if (candidates.every((candidate) => candidate.isCollage)) return "集合画像のみ";
  if (candidates.every((candidate) => !candidate.isProductPhoto)) return "商品本体未確認";
  const best = Math.max(...candidates.map((candidate) => candidate.imageMatchScore));
  if (best < PUBLIC_IMAGE_SCORE_THRESHOLD) return `score不足(max:${best})`;
  return "承認待ち";
}

function buildCategoryImageAcquisitionReport(foods: GeneratedFood[]) {
  return Object.fromEntries(
    REPORT_CATEGORIES.map((category) => {
      const categoryFoods = foods.filter((food) => food.category === category);
      const placeholder = categoryFoods.filter((food) => getFoodImage(food).startsWith("/placeholders/")).length;
      const withImage = categoryFoods.length - placeholder;
      return [
        category,
        {
          total: categoryFoods.length,
          withImage,
          placeholder,
          acquisitionRate: categoryFoods.length === 0 ? 0 : Math.round((withImage / categoryFoods.length) * 1000) / 10
        }
      ];
    })
  );
}

function candidateRelation(food: GeneratedFood, candidate: CrawledFood) {
  const name = Math.max(similarity(food.name, candidate.name), normalizeFoodName(candidate.name).includes(normalizeFoodName(food.name)) ? 0.9 : 0);
  const category = food.category === candidate.category ? 0.25 : 0;
  return Math.min(1, name + category);
}

function isImageUrl(url: string) {
  return /\.(jpe?g|png|webp|gif)(?:[?#].*)?$/i.test(url) && !/\.(svg)(?:[?#].*)?$/i.test(url);
}

function buildImageSearchQueries(food: GeneratedFood) {
  const base = food.name.replace(/\s+/g, " ").trim();
  const queries = [
    `${base} USJ`,
    `${base} ユニバ`,
    `${base} フード`
  ];
  if (isChurroFood(food)) {
    queries.push(`${base} チュリトス USJ`, `${base} チュロス USJ`, `${base} ユニバ チュリトス`);
  }
  return Array.from(new Set(queries));
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function detectWatermark(text: string) {
  if (/instagram|twitter\.com|x\.com|pinterest|cdninstagram|twimg|sns/i.test(text)) return "sns-source";
  if (/(?:^|[\s/_-])@[A-Za-z0-9_]{3,}|＠[A-Za-z0-9_]{3,}/.test(text)) return "at-user-watermark";
  if (/ウォーターマーク|透かし|転載|photo\s*by|画像提供|撮影|copyright|©|all rights reserved/i.test(text)) return "watermark-text-signal";
  if (/watermark|credit|author|avatar|profile/i.test(text)) return "watermark-url-signal";
  return undefined;
}

function detectStorefront(text: string) {
  return /(storefront|shopfront|interior|exterior|entrance|food-cart-in-front|cart-in-front|display|shelf|showcase|booth|stand|wagon|queue|crowd|people|person|staff|店内|外観|陳列|棚|売り場|販売場所|遠景|人物|店頭|ワゴン|カート前)/i.test(text);
}

function detectMenuBoard(text: string) {
  return /(menu-board|menu board|signboard|poster|pop|board|メニュー表|メニュー看板|看板|POP|ポップ|商品ボード|販売ボード)/i.test(text);
}

function detectCollage(text: string) {
  return /(collage|group|set-of|assortment|all-items|集合|複数|全種|詰め合わせ|一覧)/i.test(text);
}

function detectCharacterOnly(text: string) {
  return /(character|mascot|costume|figure|plush|ぬいぐるみ|キャラクターのみ|キャラのみ|グリーティング|ミニオンたち|ピカチュウだけ|ジョージだけ)/i.test(text);
}

function detectCloseupFood(category: GeneratedFood["category"], text: string, width?: number, height?: number) {
  const hasFoodToken = categoryMatches(category, text) || /(food|dish|meal|snack|churro|churritos|drink|popcorn|フード|料理|商品|食べ歩き|チュリ|ポップコーン|ドリンク)/i.test(text);
  const enoughSize = (width ?? 0) >= 320 || (height ?? 0) >= 240 || !width || !height;
  const badContext = detectStorefront(text) || detectMenuBoard(text) || detectCollage(text);
  return hasFoodToken && enoughSize && !badContext;
}

function isTrustedSupplementalDomain(domain: string) {
  return /(castel\.jp|travel\.rakuten\.co\.jp|jalan\.net|rurubu\.jp|travel\.co\.jp|walkerplus\.com|prtimes\.jp|news\.yahoo\.co\.jp)$/i.test(domain);
}

function categoryMatches(category: GeneratedFood["category"], text: string) {
  const patterns: Record<GeneratedFood["category"], RegExp> = {
    churro: /churro|churros|churitos|churritos|turitos|turritos|チュリ|チュロ/i,
    popcorn: /popcorn|bucket|ポップコーン|バケツ/i,
    drink: /drink|soda|latte|coffee|juice|cocktail|shake|smoothie|beer|レモネード|ラテ|ソーダ|ドリンク/i,
    dessert: /cake|sweets|dessert|ice|sundae|parfait|cookie|chocolate|pie|waffle|ケーキ|スイーツ|アイス/i,
    burger: /burger|sandwich|バーガー|サンド/i,
    pizza: /pizza|ピザ|ピッツァ/i,
    chicken: /chicken|turkey|meat|チキン|ターキー|肉/i,
    rice: /rice|curry|bowl|ライス|カレー|丼/i,
    noodle: /noodle|pasta|ramen|ヌードル|パスタ|ラーメン/i,
    snack: /snack|fries|potato|hot-?dog|スナック|ポテト|ホットドッグ/i,
    kids: /kids|children|キッズ|お子さま/i,
    seasonal: /seasonal|limited|期間限定|イベント/i,
    set: /set|plate|combo|meal|セット|プレート|コンボ/i,
    unknown: /food|menu|meal|フード|メニュー/i
  };
  return patterns[category].test(text);
}

function importantTokens(name: string) {
  return name
    .normalize("NFKC")
    .split(/[・\s~〜、。&/／()（）【】「」!'".-]+/)
    .filter((token) => token.length >= 3 && !/チュリトス|チュロス|ドリンク|セット|フード|メニュー|スペシャル/.test(token));
}

function isPublicEligible(candidate: ImageCandidate) {
  return candidate.isApproved && !candidate.hasWatermark && candidate.imageMatchScore >= PUBLIC_IMAGE_SCORE_THRESHOLD && candidate.isProductPhoto && !candidate.isStorefront && !candidate.isMenuBoard && !candidate.isCollage && !candidate.isCharacterOnly;
}

function detectFlavorMatch(food: GeneratedFood, text: string) {
  const explicitFlavor = food.flavor?.normalize("NFKC");
  if (explicitFlavor && explicitFlavor.length >= 2 && text.includes(explicitFlavor)) return true;
  return flavorTokens(food.name).some((token) => text.includes(token));
}

function detectCollaborationMatch(food: GeneratedFood, text: string) {
  const explicitCollab = food.collaborationName?.normalize("NFKC");
  if (explicitCollab && explicitCollab.length >= 2 && text.includes(explicitCollab)) return true;
  return collaborationTokens(food.name).some((token) => text.includes(token));
}

function detectCollaborationConflict(food: GeneratedFood, text: string) {
  const ownAliases = new Set(collaborationTokens(food.name).map((token) => token.toLowerCase()));
  const normalized = text.normalize("NFKC").toLowerCase();
  const groups = [
    ["おさるのジョージ", "ジョージ", "curious george"],
    ["ゼニガメ", "squirtle"],
    ["ピカチュウ", "pikachu"],
    ["キティ", "ハローキティ", "hello kitty"],
    ["マリオ", "mario", "ルイージ", "luigi"],
    ["ミニオン", "minion"],
    ["スパイダーマン", "spider-man", "spiderman"],
    ["デク", "緑谷", "deku"],
    ["虎杖", "itadori", "呪術廻戦", "jujutsu"],
    ["プーギー", "poogie"],
    ["トラファルガー", "ロー", "law"],
    ["アーニャ", "anya"],
    ["wicked", "ウィキッド"],
    ["炭治郎", "tanjiro"],
    ["禰豆子", "nezuko"],
    ["ハミクマ", "hamikuma"]
  ];
  for (const group of groups) {
    const isOwn = group.some((token) => ownAliases.has(token.toLowerCase()) || food.name.toLowerCase().includes(token.toLowerCase()));
    if (isOwn) continue;
    const matched = group.find((token) => normalized.includes(token.toLowerCase()));
    if (matched) return matched;
  }
  return undefined;
}

function flavorTokens(name: string) {
  const normalized = name.normalize("NFKC");
  const tokens = ["バニラ", "チョコ", "チョコレート", "ストロベリー", "いちご", "メープル", "ティラミス", "ピーチ", "コーラ", "ピスタチオ", "キャラメル", "ココア", "クッキー", "ラズベリー", "バナナ", "レモン", "マンゴー", "ミルク", "抹茶"];
  return tokens.filter((token) => normalized.includes(token));
}

function collaborationTokens(name: string) {
  const normalized = name.normalize("NFKC");
  const tokens = ["ゼニガメ", "ピカチュウ", "ポケモン", "ジョージ", "キティ", "ハローキティ", "マリオ", "ルイージ", "ミニオン", "スヌーピー", "スパイダーマン", "デク", "虎杖", "プーギー", "ホグワーツ", "ハリー", "トラファルガー", "ワンピース", "鬼滅", "ドラえもん", "セーラームーン"];
  return tokens.filter((token) => normalized.includes(token));
}

function modeMatches(food: GeneratedFood, mode: string) {
  if (mode === "all") return true;
  if (mode === "churro" || mode === "churros") return isChurroFood(food);
  return food.category === mode;
}

function isChurroFood(food: GeneratedFood) {
  return food.category === "churro" || /チュリトス|チュロス|churro|churros/i.test(food.name);
}

function readExistingCandidates() {
  try {
    if (!fs.existsSync(candidatesPath)) return [];
    return JSON.parse(fs.readFileSync(candidatesPath, "utf8")) as ImageCandidate[];
  } catch {
    return [];
  }
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
