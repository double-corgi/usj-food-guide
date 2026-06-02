import * as cheerio from "cheerio";
import type { CrawledFood, CrawledImage } from "../types/crawler";
import { cleanFoodName, extractProductNameFromContext, inferCategory, inferLimited, inferStatus, looksLikeFoodName, normalizeFoodName, scoreFoodNameQuality, splitCompositeMenuName } from "./normalize-food";
import { inferArea, inferShopType, normalizeShopName } from "./normalize-shop";
import { parsePrice } from "./parse-price";
import { extractDates } from "./extract-dates";
import { absoluteUrl, extractImages, extractImagesNearText } from "./extract-images";

export function parseFoodsFromHtml(html: string, pageUrl: string, sourceShop?: string): CrawledFood[] {
  const $ = cheerio.load(html);
  const pageText = $("body").text().replace(/\s+/g, " ");
  const pageImages = extractImages($, pageUrl);
  const jsonLdFoods = parseJsonLd($, pageUrl);
  const blockFoods = parseMenuBlocks(html, pageUrl, sourceShop);
  const cardFoods = parseDomCards($, pageUrl, sourceShop);
  const textFoods = parseTextFoods(pageText, pageUrl, sourceShop);
  return dedupeFoods([...jsonLdFoods, ...blockFoods, ...cardFoods, ...textFoods]);
}

export function parseMenuBlocks(html: string, pageUrl: string, sourceShop?: string): CrawledFood[] {
  const $ = cheerio.load(html);
  const foods: CrawledFood[] = [];
  $("article,li,section,tr,dl,[class*='card'],[class*='menu'],[class*='food'],[class*='restaurant'],[class*='item'],[class*='product'],[class*='tile']").each(
    (index, element) => {
      const node = $(element);
      const text = node.text().replace(/\s+/g, " ").trim();
      if (!text || text.length > 900) return;
      const titleText =
        node.find("h1,h2,h3,h4,dt,th,[class*='title'],[class*='name'],[class*='product'],[class*='menu']").first().text() ||
        nearestPriceName(text);
      const name = extractProductNameFromContext(titleText, text);
      if (!looksLikeFoodName(name) || splitCompositeMenuName(name).isComposite) return;
      const images = extractImagesNearText(node.html() ?? "", name, pageUrl).map((image) => ({
        ...image,
        imageSourceContext: text.slice(0, 360),
        domPath: `menu-block:${index}`
      }));
      foods.push(buildFood({ name, pageUrl, images, text, shopName: sourceShop, confidence: images.length ? 0.82 : 0.68 }));
    }
  );
  return foods;
}

export function extractInternalLinks(html: string, pageUrl: string) {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  $("a[href], link[href], script[src]").each((_index, element) => {
    const raw = $(element).attr("href") || $(element).attr("src");
    if (!raw) return;
    const url = absoluteUrl(raw, pageUrl);
    if (!url) return;
    if (isUsefulUsjUrl(url)) links.add(url);
  });
  for (const match of html.matchAll(/https?:\/\/(?:www\.)?usj\.co\.jp\/[^"'\\\s<>]+|\/web\/ja\/jp\/(?:restaurants|events|areas|attractions|news)[^"'\\\s<>]*/g)) {
    const url = absoluteUrl(match[0], pageUrl);
    if (isUsefulUsjUrl(url)) links.add(url);
  }
  return [...links];
}

export function extractPdfLinks(html: string, pageUrl: string) {
  return extractInternalLinks(html, pageUrl).filter((url) => /\.pdf($|\?)/i.test(url));
}

function parseJsonLd($: cheerio.CheerioAPI, pageUrl: string) {
  const foods: CrawledFood[] = [];
  $("script[type='application/ld+json']").each((_index, element) => {
    const raw = $(element).contents().text();
    try {
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items.flatMap(flattenGraph)) {
        const type = String(item["@type"] || "");
        const name = cleanFoodName(String(item.name || ""));
        if (!name || !/(MenuItem|Product|Restaurant|Food|Recipe)/i.test(type + name)) continue;
        if (!looksLikeFoodName(name)) continue;
        foods.push(buildFood({ name, pageUrl, images: [], text: JSON.stringify(item), shopName: item.provider?.name || item.seller?.name }));
      }
    } catch {
      // Broken JSON-LD should not stop the crawler.
    }
  });
  return foods;
}

function parseDomCards($: cheerio.CheerioAPI, pageUrl: string, sourceShop?: string) {
  const foods: CrawledFood[] = [];
  $("[class*='menu'], [class*='food'], [class*='restaurant'], article, li, .card, .tile").each((_index, element) => {
    const node = $(element);
    const text = node.text().replace(/\s+/g, " ").trim();
    if (!text || !looksLikeFoodName(text)) return;
    const heading = extractProductNameFromContext(node.find("h1,h2,h3,h4,[class*='title'],[class*='name']").first().text() || text.split(/[。｜|]/)[0], text);
    if (!looksLikeFoodName(heading)) return;
    const images = extractImages(cheerio.load(node.html() || ""), pageUrl);
    foods.push(buildFood({ name: heading, pageUrl, images, text, shopName: sourceShop }));
  });
  return foods;
}

function parseTextFoods(text: string, pageUrl: string, sourceShop?: string) {
  const candidates = new Set<string>();
  for (const match of text.matchAll(/([ァ-ヶー一-龠A-Za-z0-9&！!・･\s]{3,44}(?:セット|プレート|バーガー|ピザ|カレー|チュリトス|ポップコーン|ドリンク|ケーキ|アイス|スナック|サンド|ターキー|チキン|パフェ|クッキー|ラテ|ソーダ|フラッペ)[ァ-ヶー一-龠A-Za-z0-9&！!・･\s]{0,14})/g)) {
    candidates.add(cleanFoodName(match[1]));
  }
  return [...candidates]
    .filter((name) => looksLikeFoodName(name) && !splitCompositeMenuName(name).isComposite)
    .map((name) => buildFood({ name, pageUrl, images: [], text, shopName: sourceShop, confidence: 0.5 }));
}

function buildFood(input: { name: string; pageUrl: string; images: CrawledImage[]; text: string; shopName?: string; confidence?: number }): CrawledFood {
  const { startDate, endDate } = extractDates(input.text);
  const shopName = normalizeShopName(input.shopName || inferShopName(input.text));
  const category = inferCategory(`${input.name} ${input.text}`);
  return {
    name: cleanFoodName(input.name),
    normalizedName: normalizeFoodName(input.name),
    shopName,
    areaName: inferArea(shopName, input.text),
    shopType: inferShopType(shopName, input.text),
    category,
    price: parsePrice(input.text),
    description: input.text.slice(0, 220),
    officialUrl: input.pageUrl,
    sourceUrl: input.pageUrl,
    startDate,
    endDate,
    status: inferStatus(startDate, endDate),
    isLimited: inferLimited(input.text),
    images: input.images.slice(0, 5),
    confidence: input.confidence ?? 0.75
  };
}

function inferShopName(text: string) {
  const markers = ["レストラン", "カフェ", "キッチン", "パーラー", "グリル", "ワゴン", "カート", "パブ"];
  for (const marker of markers) {
    const match = text.match(new RegExp(`([ァ-ヶー一-龠A-Za-z0-9&！!・･\\s]{2,32}${marker})`));
    if (match) return match[1];
  }
  return "店舗未確認";
}

function nearestPriceName(text: string) {
  const priceIndex = text.search(/(?:￥|¥)?\s*\d{2,5}(?:,\d{3})?\s*円|(?:￥|¥)\s*\d/);
  const slice = priceIndex >= 0 ? text.slice(Math.max(0, priceIndex - 80), priceIndex) : text.slice(0, 90);
  return slice.split(/[。|｜\n]/).map(cleanFoodName).filter(Boolean).sort((a, b) => scoreFoodNameQuality(b) - scoreFoodNameQuality(a))[0] ?? "";
}

function flattenGraph(item: Record<string, unknown>): Record<string, any>[] {
  const graph = item["@graph"];
  if (Array.isArray(graph)) return graph as Record<string, any>[];
  return [item as Record<string, any>];
}

function dedupeFoods(foods: CrawledFood[]) {
  const map = new Map<string, CrawledFood>();
  for (const food of foods) {
    const key = `${food.normalizedName}:${food.shopName}`;
    const current = map.get(key);
    if (!current || food.confidence > current.confidence || food.images.length > current.images.length) {
      map.set(key, food);
    }
  }
  return [...map.values()];
}

function isUsefulUsjUrl(url: string) {
  return /^https:\/\/(www\.)?usj\.co\.jp\//.test(url) && !/\.(png|jpe?g|gif|svg|webp|ico|css|woff2?)($|\?)/i.test(url);
}
