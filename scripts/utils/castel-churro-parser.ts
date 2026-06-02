import * as cheerio from "cheerio";
import type { Cheerio, Element } from "cheerio";
import type { CrawledFood, CrawledImage } from "../types/crawler";
import { cleanFoodName, inferLimited, inferStatus, normalizeFoodName, scoreFoodNameQuality, splitCompositeMenuName } from "./normalize-food";
import { inferArea, inferShopType, normalizeShopName } from "./normalize-shop";
import { parsePrice } from "./parse-price";
import { extractDates } from "./extract-dates";
import { absoluteUrl } from "./extract-images";

const churroPattern = /チュリトス|チュロス|churro|churrito/i;
const currentArticlePattern = /2026年春|2026春|2026年3月|2026年5月|現在販売|販売中|販売期間\s*20?26/i;
const endedPattern = /販売終了|販売休止|休止中|過去|2025年|2024年|2023年|2022年|2021年/;
const crawlReferenceDate = new Date(`${process.env.CRAWL_AS_OF_DATE ?? "2026-05-28"}T00:00:00+09:00`);

export function parseCastelChurros(html: string, sourceUrl: string): CrawledFood[] {
  const $ = cheerio.load(html);
  $("br").replaceWith("\n");
  const foods: CrawledFood[] = [];

  $("h2,h3,h4").each((_index, element) => {
    const heading = $(element);
    const rawHeading = heading.text();
    const name = cleanCastelChurroName(rawHeading);
    if (!isUsableCastelChurroName(name)) return;

    const blockNodes = heading.nextUntil("h2,h3,h4");
    const blockBodyText = blockNodes
      .map((_nodeIndex, node) => $(node).text())
      .get()
      .join("\n");
    const sectionContext = heading
      .prevAll("h2,h3")
      .slice(0, 3)
      .map((_headingIndex, node) => $(node).text())
      .get()
      .reverse()
      .join("\n");
    const blockText = normalizeBlockText(`${rawHeading}\n${blockBodyText}`);
    const status = inferCastelStatus(`${sectionContext}\n${blockText}`);
    const price = parsePriceForBlock(rawHeading, blockText);
    const dates = extractDates(blockText);
    const locations = extractSaleLocations(blockText);
    const images = extractCastelBlockImages($, blockNodes, sourceUrl, name, blockText);

    for (const location of locations.length > 0 ? locations : ["フードカート"]) {
      const shopName = normalizeShopName(location);
      const areaName = inferArea(shopName, blockText);
      foods.push({
        name,
        normalizedName: normalizeFoodName(name),
        shopName,
        areaName,
        shopType: inferShopType(shopName, `${blockText} フードカート`),
        category: "churro",
        price,
        description: blockText.slice(0, 260),
        sourceUrl,
        officialUrl: undefined,
        startDate: dates.startDate,
        endDate: dates.endDate,
        status,
        isLimited: inferLimited(blockText) || status === "ended",
        images,
        confidence: scoreCastelChurro(name, blockText, price, images)
      });
    }
  });

  return dedupeCastelFoods(foods);
}

function cleanCastelChurroName(raw: string) {
  const withoutPrefix = String(raw ?? "")
    .normalize("NFKC")
    .replace(/^#+\s*/, "")
    .replace(/^[◆■●・\s]*/, "")
    .replace(/^[①-⑳]\s*/, "")
    .replace(/^【[^】]+】\s*/, "")
    .replace(/^〖[^〗]+〗\s*/, "")
    .replace(/^ユニバの(?:チュロス|チュリトス)\s*[:：]\s*/i, "")
    .replace(/^期間限定(?:チュロス|チュリトス)?\s*[:：]?\s*/i, "")
    .replace(/^定番(?:チュロス|チュリトス)?\s*[:：]?\s*/i, "")
    .replace(/：\s*\d{2,5}円$/, "")
    .replace(/:\s*\d{2,5}円$/, "");
  const composite = splitCompositeMenuName(withoutPrefix);
  const candidate = composite.isComposite && composite.productCandidates.length === 1 ? composite.primary : withoutPrefix;
  return cleanFoodName(candidate).replace(/チュロス/g, "チュリトス");
}

function isUsableCastelChurroName(name: string) {
  if (!churroPattern.test(name)) return false;
  if (/販売場所マップ|販売場所|定番チュリトス$|期間限定チュリトス$|キャラクターチュリトス$|販売終了$|まとめ/.test(name)) return false;
  if (/左.*右|中.*右|[、,].*[、,]/.test(name)) return false;
  return scoreFoodNameQuality(name) >= 70;
}

function normalizeBlockText(text: string) {
  return text
    .normalize("NFKC")
    .replace(/[ \t　]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .replace(/^[\s　]+|[\s　]+$/g, "");
}

function parsePriceForBlock(rawHeading: string, blockText: string) {
  return parsePrice(`${rawHeading} ${blockText}`);
}

function extractSaleLocations(blockText: string) {
  const normalized = blockText.replace(/[ \t　]+/g, " ");
  const match = normalized.match(/販売場所\s*[:：]?\s*(.+?)(?:\n販売期間|\n値段|\n価格|\n税込|$)/s);
  if (!match) return [];
  return match[1]
    .split(/\n|[、,／/]|(?:\s{2,})/)
    .map((location) => cleanFoodName(location))
    .map((location) => location.replace(/^(?:と|、)+/, "").trim())
    .filter((location) => location.length >= 3)
    .filter((location) => !/販売休止中|未定|なし|販売期間|値段|価格|税込/.test(location))
    .filter((location) => !/^\d{4}年|\d{1,2}月\d{1,2}日/.test(location))
    .filter((location) => !/以前|変わらず|です|ます|あります|向かいにある|食べられ|チェック|ください|おすすめ|まとめ/.test(location))
    .filter((location) => !/[!！。?？]$/.test(location))
    .slice(0, 6);
}

function inferCastelStatus(blockText: string) {
  const dates = extractDates(blockText);
  if (/販売休止中|販売終了/.test(blockText)) return "ended";
  const safeEndDate = dates.startDate && dates.endDate && dates.endDate < dates.startDate ? undefined : dates.endDate;
  if (/2026年/.test(blockText) && !/2026年1月4日/.test(blockText)) {
    return inferStatus(dates.startDate, safeEndDate, crawlReferenceDate) === "ended" ? "ended" : "active";
  }
  if (endedPattern.test(blockText) && !currentArticlePattern.test(blockText) && safeEndDate) return "ended";
  const status = inferStatus(dates.startDate, safeEndDate, crawlReferenceDate);
  return status === "unknown" ? "active" : status;
}

function extractCastelBlockImages($: cheerio.CheerioAPI, blockNodes: Cheerio<Element>, sourceUrl: string, name: string, blockText: string): CrawledImage[] {
  const candidates: CrawledImage[] = [];
  blockNodes.find("img,source").each((_index, imageElement) => {
    const node = $(imageElement);
    const srcset = node.attr("srcset") ?? node.attr("data-srcset");
    const src = pickBestSrc(node.attr("src") ?? node.attr("data-src") ?? node.attr("data-original") ?? node.attr("data-lazy-src") ?? srcset);
    if (!src) return;
    const imageUrl = absoluteUrl(src, sourceUrl);
    if (!/^https:\/\/c\d+\.castel\.jp\//.test(imageUrl)) return;
    const altText = cleanFoodName(node.attr("alt") ?? node.attr("title") ?? "");
    const matchScore = scoreCastelImage(name, altText, imageUrl, blockText);
    if (matchScore < 75) return;
    candidates.push({
      imageUrl,
      sourceUrl,
      altText,
      caption: altText,
      sourceType: "placeholder",
      imageSourceContext: blockText.slice(0, 260),
      imageMatchReason: "Castel article section: supplemental image candidate, not used on public cards.",
      imageMismatchReason: "supplemental-watermark-risk",
      imageConfidenceScore: matchScore,
      imageMatchScore: matchScore,
      categoryImageMatchScore: 95,
      imageVerified: false,
      priority: matchScore
    });
  });
  return dedupeImages(candidates).slice(0, 2);
}

function pickBestSrc(value?: string) {
  if (!value) return undefined;
  return value
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean)
    .sort((a, b) => Number(/800x|x\/1/.test(b)) - Number(/800x|x\/1/.test(a)))[0];
}

function scoreCastelImage(name: string, altText: string, imageUrl: string, blockText: string) {
  let score = 76;
  const normalizedName = normalizeFoodName(name);
  const normalizedAlt = normalizeFoodName(altText);
  const normalizedUrl = normalizeFoodName(imageUrl);
  if (normalizedAlt && (normalizedAlt.includes(normalizedName) || normalizedName.includes(normalizedAlt))) score += 18;
  if (/chur|churr|turitos|turritos|churitos/i.test(imageUrl)) score += 14;
  if (/チュリトス|チュロス/.test(altText)) score += 10;
  if (blockText.includes(name)) score += 10;
  if (/map|マップ|signboard|cart-signboard|logo|favicon|banner|sprite|twitter|facebook/i.test(imageUrl)) score -= 45;
  if (/販売場所マップ|マップ/.test(altText)) score -= 50;
  return Math.max(0, Math.min(100, score));
}

function scoreCastelChurro(name: string, blockText: string, price?: number, images: CrawledImage[] = []) {
  let score = scoreFoodNameQuality(name);
  if (price) score += 10;
  if (/販売場所/.test(blockText)) score += 10;
  if (/販売期間/.test(blockText)) score += 5;
  if (images.some((image) => image.imageVerified)) score += 12;
  if (/販売休止中|販売終了/.test(blockText)) score -= 20;
  return Math.max(0, Math.min(100, score));
}

function dedupeImages(images: CrawledImage[]) {
  const seen = new Set<string>();
  return images.filter((image) => {
    if (seen.has(image.imageUrl)) return false;
    seen.add(image.imageUrl);
    return true;
  });
}

function dedupeCastelFoods(foods: CrawledFood[]) {
  const seen = new Set<string>();
  return foods.filter((food) => {
    const key = `${food.normalizedName}:${food.shopName}:${food.status}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
