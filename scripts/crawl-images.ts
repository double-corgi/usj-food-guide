import fs from "node:fs";
import path from "node:path";
import type { FoodCategory } from "../types/domain";
import type { GeneratedDataset, GeneratedFood, GeneratedImage } from "./types/generated";
import type { CrawlRunResult } from "./types/crawler";
import { fetchText } from "./utils/http";
import { extractImagesNearText } from "./utils/extract-images";
import { filterAndRankImages } from "./utils/image-quality";
import { detectWatermarkImage, scoreCategoryImageMatch } from "./utils/image-quality";
import { normalizeFoodName, similarity } from "./utils/normalize-food";
import { parseFoodsFromTcmJson, webUrlToTridionUrl } from "./utils/tcm-parser";

const outputDir = path.join(process.cwd(), "scripts", "output");
const datasetPath = path.join(outputDir, "foods.generated.json");
const reportPath = path.join(outputDir, "latest-crawl-report.json");

type Mode = "all" | "churro" | "drink" | "popcorn" | "foodcart";

async function main() {
  const mode = normalizeMode(process.argv[2]);
  const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8")) as GeneratedDataset;
  const crawlReport = fs.existsSync(reportPath) ? (JSON.parse(fs.readFileSync(reportPath, "utf8")) as CrawlRunResult) : undefined;

  const rawSourceImages = buildSourceImageLookup(crawlReport);
  const officialCatalog = buildOfficialImageCatalog(crawlReport);
  const watermarkExcluded = markWatermarkImages(dataset);
  const pruned = pruneUnsafeCatalogImages(dataset, officialCatalog);
  const before = summarize(dataset);
  const targets = visibleFoods(dataset.foods).filter((food) => matchesMode(food, mode) && !hasPublicImage(food));
  let attached = 0;
  const checkedUrls = new Set<string>();
  const errors: string[] = [];

  for (const food of targets) {
    const rawImages = rawSourceImages.get(food.normalizedName) ?? [];
    const fromRaw = selectSafeImages(food, rawImages, "raw-source");
    if (attachImages(food, fromRaw)) {
      attached += 1;
      continue;
    }

    const fromCatalog = selectCatalogImages(food, officialCatalog);
    if (attachImages(food, fromCatalog)) {
      attached += 1;
      continue;
    }

    for (const url of candidateSourceUrls(food)) {
      if (checkedUrls.has(`${food.id}:${url}`)) continue;
      checkedUrls.add(`${food.id}:${url}`);
      try {
        const raw = await fetchText(url, { timeoutMs: 12000, retries: 1, delayMs: 250 });
        const parsedImages = parseSourceForFoodImages(raw, url, food);
        if (attachImages(food, parsedImages)) {
          attached += 1;
          break;
        }
      } catch (error) {
        errors.push(`${food.name}: ${url}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  const rebalancedSharedRepresentatives = rebalanceSharedRepresentativeImages(dataset);

  dataset.generatedAt = new Date().toISOString();
  dataset.summary = {
    ...dataset.summary,
    withImages: dataset.foods.filter((food) => food.images.some((image) => image.enabled)).length,
    officialImages: dataset.foods.filter((food) => food.images.some((image) => image.enabled && image.sourceType === "official")).length,
    verifiedOfficialImages: dataset.foods.filter((food) => food.images.some((image) => image.enabled && image.sourceType === "official" && image.imageVerified)).length,
    placeholderImages: visibleFoods(dataset.foods).filter((food) => !hasPublicImage(food)).length,
    imageMismatchExcluded: dataset.foods.filter((food) => food.images.some((image) => !image.enabled && image.imageMismatchReason)).length
  };
  fs.writeFileSync(datasetPath, JSON.stringify(dataset, null, 2));

  const after = summarize(dataset);
  const imageReport = {
    mode,
    generatedAt: dataset.generatedAt,
    targets: targets.length,
    attached,
    pruned,
    watermarkExcluded,
    rebalancedSharedRepresentatives,
    before,
    after,
    errors: errors.slice(0, 50)
  };
  fs.writeFileSync(path.join(outputDir, `${mode === "all" ? "images" : `${mode}-images`}.crawl-report.json`), JSON.stringify(imageReport, null, 2));
  console.log(JSON.stringify(imageReport, null, 2));
}

function normalizeMode(value?: string): Mode {
  if (value === "churro" || value === "drink" || value === "popcorn" || value === "foodcart") return value;
  return "all";
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

function matchesMode(food: GeneratedFood, mode: Mode) {
  if (mode === "all") return true;
  if (mode === "foodcart") return food.diningType === "food_cart" || food.locations.some((location) => location.shopType === "cart" || location.shopType === "wagon");
  return food.category === mode;
}

function hasPublicImage(food: GeneratedFood) {
  return food.images.some((image) => image.enabled && image.sourceType === "official" && image.imageVerified && !image.imageMismatchReason && !image.isSharedTooMuch && !image.hasWatermark);
}

function getPublicRepresentative(food: GeneratedFood) {
  return food.images.find((image) => image.enabled && image.sourceType === "official" && image.imageVerified && !image.imageMismatchReason && !image.isSharedTooMuch && !image.hasWatermark);
}

function candidateSourceUrls(food: GeneratedFood) {
  const urls = new Set<string>();
  for (const url of [food.sourceUrl, food.officialUrl, food.source_url, food.official_url, ...food.locations.map((location) => location.sourceUrl)]) {
    if (!url) continue;
    if (/^https:\/\/castel\.jp\//.test(url)) continue;
    urls.add(url);
    const tridionUrl = webUrlToTridionUrl(url);
    if (tridionUrl) urls.add(tridionUrl);
  }
  return [...urls].filter((url) => /^https:\/\/www\.usj\.co\.jp\//.test(url));
}

function parseSourceForFoodImages(raw: string, sourceUrl: string, food: GeneratedFood) {
  if (sourceUrl.includes("/tridiondata/")) {
    const parsed = parseFoodsFromTcmJson(raw, sourceUrl);
    const matched = parsed.foods.filter((candidate) => {
      if (candidate.normalizedName === food.normalizedName) return true;
      return similarity(candidate.name, food.name) >= 0.76;
    });
    return selectSafeImages(food, matched.flatMap((candidate) => candidate.images), "same-tcm-product");
  }
  return selectSafeImages(food, extractImagesNearText(raw, food.name, sourceUrl), "same-html-block");
}

function selectSafeImages(food: GeneratedFood, images: GeneratedImage[] | Array<GeneratedImage | any>, reason: string): GeneratedImage[] {
  return filterAndRankImages(images, food.name, food.category)
    .filter((image) => image.imageVerified && !image.imageMismatchReason && /^https:\/\/www\.usj\.co\.jp\/tridiondata\//i.test(image.imageUrl))
    .map((image, index) => ({
      id: stableId("image", `${food.id}:${image.imageUrl}`),
      foodId: food.id,
      imageUrl: image.imageUrl,
      sourceType: "official" as const,
      sourceUrl: image.sourceUrl,
      altText: image.altText,
      alt: image.altText,
      width: image.width,
      height: image.height,
      imageConfidenceScore: image.imageConfidenceScore,
      imageMatchScore: image.imageMatchScore,
      categoryImageMatchScore: image.categoryImageMatchScore,
      imageSourceContext: image.imageSourceContext,
      imageMatchReason: `${reason}:${image.imageMatchReason ?? "verified"}`,
      hasWatermark: false,
      imageVerified: true,
      isSharedTooMuch: false,
      priority: index + 1,
      enabled: true
    }))
    .slice(0, 4);
}

function selectCatalogImages(food: GeneratedFood, catalog: any[]): GeneratedImage[] {
  return findCatalogImages(food, catalog)
    .map((match, index) => ({
      id: stableId("image", `${food.id}:${match.image.imageUrl}`),
      foodId: food.id,
      imageUrl: match.image.imageUrl,
      sourceType: "official" as const,
      sourceUrl: match.image.sourceUrl,
      altText: match.image.altText,
      alt: match.image.altText,
      width: match.image.width,
      height: match.image.height,
      imageConfidenceScore: Math.min(100, match.score),
      imageMatchScore: Math.min(100, Math.max(82, match.score - 35)),
      categoryImageMatchScore: match.categoryScore,
      imageSourceContext: match.image.imageSourceContext,
      imageMatchReason: `official-filename-signal:${match.matchedLabels.join(",")}`,
      hasWatermark: false,
      imageVerified: true,
      isSharedTooMuch: false,
      priority: index + 1,
      enabled: true
    }))
    .slice(0, 2);
}

function markWatermarkImages(dataset: GeneratedDataset) {
  let excluded = 0;
  for (const food of dataset.foods) {
    let representativeChanged = false;
    food.images = food.images.map((image) => {
      const reason = detectWatermarkImage({
        imageUrl: image.imageUrl,
        sourceUrl: image.sourceUrl,
        altText: image.altText ?? image.alt,
        title: image.alt,
        caption: image.altText,
        imageSourceContext: image.imageSourceContext
      } as any);
      if (!reason) return image;
      if (image.enabled) {
        excluded += 1;
        representativeChanged = true;
      }
      return {
        ...image,
        enabled: false,
        imageVerified: false,
        hasWatermark: true,
        watermarkReason: reason,
        imageMismatchReason: image.imageMismatchReason ?? `watermark:${reason}`
      };
    });
    if (representativeChanged) {
      const representative = food.images.find((image) => image.enabled && image.imageVerified && !image.imageMismatchReason && !image.hasWatermark);
      if (representative) {
        food.imageUrl = representative.imageUrl;
        food.image_url = representative.imageUrl;
        food.representativeImageUrl = representative.imageUrl;
        food.representative_image_url = representative.imageUrl;
      } else {
        food.imageUrl = undefined;
        food.image_url = undefined;
        food.representativeImageUrl = undefined;
        food.representative_image_url = undefined;
        food.trustedPlaceholder = true;
        food.trusted_placeholder = true;
      }
    }
  }
  return excluded;
}

function attachImages(food: GeneratedFood, images: GeneratedImage[]) {
  const fresh = images.filter((image) => !food.images.some((current) => current.imageUrl === image.imageUrl));
  if (fresh.length === 0) return false;
  food.images = [...fresh, ...food.images].map((image, index) => ({
    ...image,
    enabled: image.enabled && !image.imageMismatchReason && image.imageVerified === true,
    priority: index + 1
  }));
  const representative = food.images.find((image) => image.enabled && image.imageVerified && !image.imageMismatchReason && !image.hasWatermark);
  if (representative) {
    food.imageUrl = representative.imageUrl;
    food.image_url = representative.imageUrl;
    food.representativeImageUrl = representative.imageUrl;
    food.representative_image_url = representative.imageUrl;
    food.trustedPlaceholder = false;
    food.trusted_placeholder = false;
  }
  return Boolean(representative);
}

function pruneUnsafeCatalogImages(dataset: GeneratedDataset, officialCatalog: any[]) {
  let pruned = 0;
  for (const food of dataset.foods) {
    const allowedCatalogUrls = new Set(findCatalogImages(food, officialCatalog).map((match) => match.image.imageUrl));
    const nextImages = food.images.filter((image) => {
      if (!/^official-filename-signal/.test(image.imageMatchReason ?? "")) return true;
      const keep = allowedCatalogUrls.has(image.imageUrl);
      if (!keep) pruned += 1;
      return keep;
    });
    if (nextImages.length !== food.images.length) {
      food.images = nextImages.map((image, index) => ({ ...image, priority: index + 1 }));
      const representative = food.images.find((image) => image.enabled && image.imageVerified && !image.imageMismatchReason && !image.hasWatermark);
      if (representative) {
        food.imageUrl = representative.imageUrl;
        food.image_url = representative.imageUrl;
        food.representativeImageUrl = representative.imageUrl;
        food.representative_image_url = representative.imageUrl;
      } else {
        food.imageUrl = undefined;
        food.image_url = undefined;
        food.representativeImageUrl = undefined;
        food.representative_image_url = undefined;
        food.trustedPlaceholder = true;
        food.trusted_placeholder = true;
      }
    }
  }
  return pruned;
}

function buildSourceImageLookup(report?: CrawlRunResult) {
  const map = new Map<string, any[]>();
  for (const source of report?.sources ?? []) {
    for (const food of source.foods ?? []) {
      const key = normalizeFoodName(food.name);
      if (!key) continue;
      const current = map.get(key) ?? [];
      current.push(...food.images);
      map.set(key, current);
    }
  }
  return map;
}

function buildOfficialImageCatalog(report?: CrawlRunResult) {
  const seen = new Set<string>();
  const images: any[] = [];
  for (const source of report?.sources ?? []) {
    for (const food of source.foods ?? []) {
      for (const image of food.images ?? []) {
        if (!image.imageUrl || seen.has(image.imageUrl)) continue;
        if (!/^https:\/\/www\.usj\.co\.jp\/tridiondata\//i.test(image.imageUrl)) continue;
        if (image.imageMismatchReason && !/ambiguous-tcm-component/.test(image.imageMismatchReason)) continue;
        if (/(logo|icon|map|hero|mainvisual|kv|restaurant-[abc]|area|attraction|sns|castel|watermark|透かし|experience-image)/i.test(image.imageUrl)) continue;
        seen.add(image.imageUrl);
        images.push({
          ...image,
          catalogFoodName: food.name,
          sourceUrl: image.sourceUrl ?? food.sourceUrl,
          imageSourceContext: `${food.name} ${image.imageSourceContext ?? ""}`.slice(0, 420)
        });
      }
    }
    for (const url of extractOfficialImageUrlsFromSource(source)) {
      if (seen.has(url)) continue;
      if (/(logo|icon|map|hero|mainvisual|kv|restaurant-[abc]|area|attraction|sns|castel|watermark|透かし|experience-image)/i.test(url)) continue;
      seen.add(url);
      images.push({
        imageUrl: url,
        sourceUrl: (source as any).url ?? (source as any).sourceUrl,
        sourceType: "official",
        imageSourceContext: `official-image-url ${url}`,
        imageMatchReason: "official-image-url-catalog",
        imageConfidenceScore: 72
      });
    }
  }
  return images;
}

function extractOfficialImageUrlsFromSource(source: any) {
  const values = [
    ...((source.fetchedUrls ?? []) as string[]),
    ...((source.errors ?? []) as string[]),
    ...((source.rawImageUrls ?? []) as string[])
  ];
  const urls = new Set<string>();
  for (const value of values) {
    for (const match of String(value).matchAll(/https:\/\/www\.usj\.co\.jp\/(?:web\/ja\/jp|tridiondata\/usj\/ja\/jp)\/files\/images\/[^\s":]+?\.(?:jpg|jpeg|png|webp)/gi)) {
      const normalized = match[0].replace("https://www.usj.co.jp/web/ja/jp/files/images/", "https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/");
      urls.add(normalized);
    }
  }
  return [...urls];
}

function findCatalogImages(food: GeneratedFood, catalog: any[]) {
  const signals = productSignals(food.name);
  if (signals.length === 0) return [];
  return catalog
    .map((image) => {
      const url = image.imageUrl.toLowerCase();
      const categoryScore = scoreCategoryImageMatch(url, food.category);
      const matchedSignals = signals.filter((signal) => signal.pattern.test(url));
      const specificSignals = matchedSignals.filter((signal) => signal.specific);
      const catalogName = image.catalogFoodName ? String(image.catalogFoodName) : "";
      const catalogSimilarity = catalogName ? similarity(food.name, catalogName) : 0;
      const nameCompatible = catalogSimilarity >= 0.72 || normalizeFoodName(catalogName) === food.normalizedName;
      const score =
        categoryScore +
        specificSignals.length * 34 +
        (matchedSignals.length - specificSignals.length) * 6 +
        (nameCompatible ? 34 : 0) +
        (/offercard|gallery|gds-images|food/i.test(url) ? 12 : 0);
      return {
        image,
        score,
        categoryScore,
        catalogName,
        catalogSimilarity,
        nameCompatible,
        strongSingleSignal: specificSignals.some((signal) =>
          ["kuromi", "my-melody", "hello-kitty", "wicked", "hogwarts", "minion-choco-banana", "black-flash", "hollow-purple"].includes(signal.label)
        ),
        specificSignals,
        matchedSignals,
        matchedLabels: matchedSignals.map((signal) => signal.label)
      };
    })
    .filter(
      (match) =>
        match.categoryScore >= 70 &&
        !hasIncompatibleBrandImage(food, match.image.imageUrl) &&
        match.specificSignals.length > 0 &&
        (match.nameCompatible || match.specificSignals.length >= 2 || match.strongSingleSignal) &&
        match.score >= 124
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function productSignals(name: string) {
  const normalized = name.normalize("NFKC").toLowerCase();
  const signals: Array<{ pattern: RegExp; specific: boolean; label: string }> = [];
  const add = (pattern: RegExp, label: string, specific = true) => signals.push({ pattern, specific, label });
  const dictionary: Array<[RegExp, Array<{ pattern: RegExp; label: string; specific?: boolean }>] > = [
    [
      /サーティーワン|31/,
      [
        { pattern: /baskin-robbins/, label: "baskin-robbins" },
        { pattern: /popping-shower/, label: "popping-shower" },
        { pattern: /love-potion31/, label: "love-potion31" }
      ]
    ],
    [/怪盗キッド|キッド/, [{ pattern: /kid-the-phantom-thief|phantom-thief|detective-conan/, label: "kid-the-phantom-thief" }]],
    [/ホワイトグレープ/, [{ pattern: /white-grape/, label: "white-grape" }]],
    [/クロミ/, [{ pattern: /kuromi/, label: "kuromi" }]],
    [/マイメロディ/, [{ pattern: /my-melody/, label: "my-melody" }]],
    [/カシスショコラ/, [{ pattern: /cassis-chocolate/, label: "cassis-chocolate" }]],
    [/いちごヨーグルト/, [{ pattern: /strawberry-yogurt/, label: "strawberry-yogurt" }]],
    [/ウィキッド/, [{ pattern: /wicked/, label: "wicked" }]],
    [/ミニオン/, [{ pattern: /minion/, label: "minion" }]],
    [/ピーナッツバター/, [{ pattern: /peanut-butter/, label: "peanut-butter" }]],
    [/キャラメル/, [{ pattern: /caramel/, label: "caramel", specific: false }]],
    [
      /ミニオン.*チョコバナナ|チョコバナナ.*ミニオン/,
      [
        { pattern: /choco-banana/, label: "choco-banana" },
        { pattern: /minion/, label: "minion-choco-banana" }
      ]
    ],
    [/チョコバナナ/, [{ pattern: /choco-banana/, label: "choco-banana", specific: false }]],
    [/ハローキティ|キティ/, [{ pattern: /hello-kitty|kitty/, label: "hello-kitty" }]],
    [/ハリーポッター|ホグワーツ/, [{ pattern: /harry-potter|hogwarts/, label: "hogwarts" }]],
    [/黒閃|決めろ/, [{ pattern: /black-flash/, label: "black-flash" }]],
    [/虎杖/, [{ pattern: /itadori/, label: "itadori" }]],
    [/虚式|茈|ホロウパープル/, [{ pattern: /hollow-purple/, label: "hollow-purple" }]],
    [/呪術/, [{ pattern: /jujutsukaisen|jujutsu/, label: "jujutsu", specific: false }]],
    [/アップル|りんご|リンゴ/, [{ pattern: /apple/, label: "apple", specific: false }]],
    [/スーパースター|スーパー.?スター/, [{ pattern: /super-star|superstar/, label: "super-star", specific: false }]],
    [/プラザ/, [{ pattern: /plaza/, label: "plaza", specific: false }]],
    [/ベリー|ストロベリー|いちご/, [{ pattern: /berry|strawberry/, label: "berry", specific: false }]],
    [/ケーキ/, [{ pattern: /cake/, label: "cake", specific: false }]],
    [/パイ/, [{ pattern: /pie/, label: "pie", specific: false }]],
    [/ポップコーン/, [{ pattern: /popcorn/, label: "popcorn", specific: false }]],
    [/チュリトス|チュロス/, [{ pattern: /churro|churritos|churitos/, label: "churro", specific: false }]],
    [/バタービール/, [{ pattern: /butterbeer|butter-beer/, label: "butterbeer" }]],
    [/ドリンク|ソーダ|レモネード/, [{ pattern: /drink|soda|lemonade/, label: "drink" }]]
  ];
  for (const [namePattern, urlPatterns] of dictionary) {
    if (namePattern.test(normalized)) {
      for (const signal of urlPatterns) add(signal.pattern, signal.label, signal.specific ?? true);
    }
  }
  return signals;
}

function hasIncompatibleBrandImage(food: GeneratedFood, imageUrl: string) {
  const normalized = food.name.normalize("NFKC").toLowerCase();
  const url = imageUrl.toLowerCase();
  const brandRules: Array<{ label: string; url: RegExp; name: RegExp }> = [
    { label: "minion", url: /minion/, name: /ミニオン|minion/ },
    { label: "hello-kitty", url: /hello-kitty|kitty/, name: /ハローキティ|キティ|hello.?kitty|kitty/ },
    { label: "kuromi", url: /kuromi/, name: /クロミ|kuromi/ },
    { label: "my-melody", url: /my-melody/, name: /マイメロディ|my.?melody/ },
    { label: "hogwarts", url: /hogwarts|harry-potter/, name: /ハリーポッター|ホグワーツ|harry.?potter|hogwarts/ },
    { label: "conan", url: /detective-conan|phantom-thief|kid-the-phantom-thief/, name: /名探偵コナン|怪盗キッド|キッド|conan|kid/ },
    { label: "black-flash", url: /black-flash/, name: /黒閃|black.?flash/ },
    { label: "hollow-purple", url: /hollow-purple/, name: /五条|虚式|茈|ホロウパープル|hollow.?purple/ },
    { label: "itadori", url: /itadori/, name: /虎杖|itadori/ },
    { label: "jujutsu", url: /jujutsukaisen|jujutsu/, name: /呪術|jujutsu/ }
  ];
  const urlLabels = brandRules.filter((rule) => rule.url.test(url)).map((rule) => rule.label);
  if (urlLabels.length === 0) return false;
  const nameLabels = brandRules.filter((rule) => rule.name.test(normalized)).map((rule) => rule.label);
  if (nameLabels.length === 0) return true;
  return !urlLabels.some((label) => nameLabels.includes(label));
}

function rebalanceSharedRepresentativeImages(dataset: GeneratedDataset) {
  const visible = visibleFoods(dataset.foods);
  const representatives = new Map<string, GeneratedFood[]>();
  for (const food of visible) {
    const representative = getPublicRepresentative(food);
    if (!representative) continue;
    const current = representatives.get(representative.imageUrl) ?? [];
    current.push(food);
    representatives.set(representative.imageUrl, current);
  }

  const usedRepresentatives = new Set<string>();
  for (const [imageUrl, foods] of representatives) {
    if (foods.length === 1) usedRepresentatives.add(imageUrl);
  }

  let rebalanced = 0;
  for (const [sharedUrl, foods] of representatives) {
    if (foods.length < 2) continue;
    usedRepresentatives.add(sharedUrl);
    const [, ...duplicates] = foods;
    for (const food of duplicates) {
      const alternative = chooseAlternativeRepresentative(food, usedRepresentatives, sharedUrl);
      if (!alternative) continue;
      promoteRepresentative(food, alternative.imageUrl);
      usedRepresentatives.add(alternative.imageUrl);
      rebalanced += 1;
    }
  }
  return rebalanced;
}

function chooseAlternativeRepresentative(food: GeneratedFood, usedRepresentatives: Set<string>, currentUrl: string) {
  return food.images
    .filter(
      (image) =>
        image.imageUrl !== currentUrl &&
        !usedRepresentatives.has(image.imageUrl) &&
        image.enabled &&
        image.sourceType === "official" &&
        image.imageVerified &&
        !image.imageMismatchReason &&
        !image.isSharedTooMuch &&
        !hasIncompatibleBrandImage(food, image.imageUrl)
    )
    .sort((a, b) => representativeScore(food, b) - representativeScore(food, a))[0];
}

function representativeScore(food: GeneratedFood, image: GeneratedImage) {
  const reason = image.imageMatchReason ?? "";
  return (
    (image.imageMatchScore ?? 0) +
    (image.categoryImageMatchScore ?? 0) +
    (image.imageConfidenceScore ?? 0) +
    (/same-menu-block|same-html-block|same-tcm-product|context-name-match/.test(reason) ? 40 : 0) +
    (/gallery|offercard|gds-images/.test(image.imageUrl) ? 10 : 0) +
    (similarity(food.name, image.altText ?? image.alt ?? "") >= 0.72 ? 20 : 0)
  );
}

function promoteRepresentative(food: GeneratedFood, imageUrl: string) {
  food.images = food.images
    .map((image) => ({
      ...image,
      priority: image.imageUrl === imageUrl ? 0 : image.priority + 1
    }))
    .sort((a, b) => a.priority - b.priority)
    .map((image, index) => ({ ...image, priority: index + 1 }));
  food.imageUrl = imageUrl;
  food.image_url = imageUrl;
  food.representativeImageUrl = imageUrl;
  food.representative_image_url = imageUrl;
  food.trustedPlaceholder = false;
  food.trusted_placeholder = false;
}

function summarize(dataset: GeneratedDataset) {
  const visible = visibleFoods(dataset.foods);
  const verified = visible.filter(hasPublicImage);
  const placeholders = visible.filter((food) => !hasPublicImage(food));
  return {
    visible: visible.length,
    verified: verified.length,
    placeholders: placeholders.length,
    verifiedByCategory: countBy(verified, (food) => food.category),
    placeholdersByCategory: countBy(placeholders, (food) => food.category)
  };
}

function stableId(prefix: string, input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
