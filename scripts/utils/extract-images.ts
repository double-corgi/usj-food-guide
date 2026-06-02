import * as cheerio from "cheerio";
import type { CrawledFood, CrawledImage } from "../types/crawler";
import { similarity } from "./normalize-food";

const imageUrlPattern = /\.(?:jpe?g|png|webp)(?:[?#].*)?$/i;
const badImagePattern =
  /(logo|icon|favicon|banner|bg-|background|sprite|map|sns|facebook|twitter|x-logo|instagram|youtube|line|app-store|google-play|placeholder|loading|arrow|button|modal|qr|guide|calendar|footer|header|nav|breadcrumb|pixel|tracking)/i;
const weakSharedPattern = /(hero|kv|mainvisual|main-visual|ogp|common|shared|bnr|campaign|area|attraction)/i;
const goodImagePattern = /(food|menu|restaurant|dining|cafe|gourmet|offercard|gds-images|churro|popcorn|drink|burger|pizza|plate|meal|set|dessert|sweets|ice|chicken|turkey|rice|curry|noodle)/i;

export function normalizeOfficialImageUrl(raw: string, baseUrl: string) {
  const decoded = decodeEntities(String(raw ?? "").trim());
  if (!decoded || decoded.startsWith("data:")) return undefined;
  const first = decoded.split(/\s+/)[0];
  const withoutCss = first.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
  if (withoutCss.startsWith("//")) return `https:${withoutCss}`;
  try {
    if (withoutCss.startsWith("/usj/ja/jp/files/")) {
      return new URL(withoutCss.replace(/^\/usj\/ja\/jp\/files\//, "/tridiondata/usj/ja/jp/files/"), "https://www.usj.co.jp").toString();
    }
    if (/^https:\/\/www\.usj\.co\.jp\/web\/ja\/jp\/files\//.test(withoutCss)) {
      return withoutCss.replace("https://www.usj.co.jp/web/ja/jp/files/", "https://www.usj.co.jp/tridiondata/usj/ja/jp/files/");
    }
    if (withoutCss.startsWith("/web/") || withoutCss.startsWith("/tridiondata/") || withoutCss.startsWith("/usj/")) {
      return new URL(withoutCss, "https://www.usj.co.jp").toString();
    }
    return new URL(withoutCss, baseUrl).toString();
  } catch {
    return undefined;
  }
}

export function absoluteUrl(raw: string, baseUrl: string) {
  return normalizeOfficialImageUrl(raw, baseUrl);
}

export function validateImageUrl(url?: string) {
  if (!url) return false;
  if (!/^https?:\/\//i.test(url)) return false;
  if (!imageUrlPattern.test(url)) return false;
  if (badImagePattern.test(url)) return false;
  return true;
}

export function extractOgImages(htmlOr$: string | cheerio.CheerioAPI, baseUrl: string): CrawledImage[] {
  const $ = typeof htmlOr$ === "string" ? cheerio.load(htmlOr$) : htmlOr$;
  const images: CrawledImage[] = [];
  $("meta[property='og:image'], meta[name='og:image'], meta[name='twitter:image'], meta[property='twitter:image']").each((_index, element) => {
    const url = normalizeOfficialImageUrl($(element).attr("content") ?? "", baseUrl);
    if (!validateImageUrl(url)) return;
    images.push({
      imageUrl: url,
      sourceUrl: baseUrl,
      altText: "OpenGraph image",
      priority: weakSharedPattern.test(url) ? 95 : 55,
      sourceType: "official",
      imageConfidenceScore: weakSharedPattern.test(url) ? 25 : 45
    });
  });
  return dedupeImages(images);
}

export function extractSrcsetImages(srcset: string, baseUrl: string): CrawledImage[] {
  return srcset
    .split(",")
    .map((entry) => entry.trim().split(/\s+/)[0])
    .map((url) => normalizeOfficialImageUrl(url, baseUrl))
    .filter(validateImageUrl)
    .map((imageUrl) => ({ imageUrl: imageUrl!, sourceUrl: baseUrl, priority: 65, sourceType: "official" as const, imageConfidenceScore: 45 }));
}

export function extractImagesFromHtml(html: string, baseUrl: string) {
  return extractImages(cheerio.load(html), baseUrl);
}

export function extractImagesNearText(html: string, productName: string, baseUrl: string) {
  const $ = cheerio.load(html);
  const images: CrawledImage[] = [];
  $("article,li,section,div,[class*='card'],[class*='menu'],[class*='food'],[class*='restaurant']").each((_index, element) => {
    const node = $(element);
    const text = node.text().replace(/\s+/g, " ");
    if (!text || similarity(productName, text.slice(0, 120)) < 0.18 && !text.includes(productName.slice(0, 4))) return;
    images.push(...extractElementImages($, node, baseUrl, productName, 25, "near-text-block", text.slice(0, 360)));
  });
  return dedupeImages(images).sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100)).slice(0, 8);
}

export function extractImages($: cheerio.CheerioAPI, pageUrl: string) {
  const images: CrawledImage[] = [...extractOgImages($, pageUrl)];
  images.push(...extractElementImages($, $("body"), pageUrl, undefined, 55, "page-body"));
  return dedupeImages(images).sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100)).slice(0, 40);
}

export function scoreImageForFood(image: CrawledImage, food: Pick<CrawledFood, "name" | "sourceUrl"> | { name: string; sourceUrl?: string }) {
  const haystack = `${image.imageUrl} ${image.altText ?? ""} ${image.title ?? ""} ${image.caption ?? ""}`.toLowerCase();
  let score = image.imageConfidenceScore ?? 35;
  if (goodImagePattern.test(haystack)) score += 24;
  if (/offercard|gds-images|restaurant|menu|food|dining/i.test(image.imageUrl)) score += 18;
  if (image.altText && similarity(food.name, image.altText) >= 0.42) score += 28;
  if (image.title && similarity(food.name, image.title) >= 0.42) score += 22;
  if (image.caption && similarity(food.name, image.caption) >= 0.3) score += 16;
  if (badImagePattern.test(haystack)) score -= 60;
  if (weakSharedPattern.test(haystack) && !/food|menu|restaurant|dining|gds-images/i.test(haystack)) score -= 22;
  if (image.isSharedTooMuch) score -= 45;
  return Math.max(0, Math.min(100, score));
}

export function detectSharedImage(imageUrl: string, foods: Array<{ images: CrawledImage[] }>) {
  const used = foods.reduce((count, food) => count + (food.images.some((image) => image.imageUrl === imageUrl) ? 1 : 0), 0);
  return used >= 8;
}

function extractElementImages(
  $: cheerio.CheerioAPI,
  scope: cheerio.Cheerio<unknown>,
  baseUrl: string,
  productName?: string,
  basePriority = 50,
  domPath = "dom",
  sourceContext?: string
) {
  const images: CrawledImage[] = [];
  scope.find("img,source,[style],[data-bg],[data-image]").add(scope.filter("img,source,[style],[data-bg],[data-image]")).each((index, element) => {
    const node = $(element);
    const rawUrls = [
      node.attr("src"),
      node.attr("data-src"),
      node.attr("data-original"),
      node.attr("data-image"),
      node.attr("data-bg"),
      ...extractSrcsetRaw(node.attr("srcset")),
      ...extractSrcsetRaw(node.attr("data-srcset")),
      ...extractBackgroundUrls(node.attr("style"))
    ].filter(Boolean) as string[];

    for (const rawUrl of rawUrls) {
      const imageUrl = normalizeOfficialImageUrl(rawUrl, baseUrl);
      if (!validateImageUrl(imageUrl)) continue;
      const altText = cleanImageText(node.attr("alt") ?? node.attr("aria-label") ?? "");
      const title = cleanImageText(node.attr("title") ?? "");
      const caption = cleanImageText(node.closest("figure,article,li,section,div").find("figcaption,[class*='caption']").first().text());
      const closestText = sourceContext ?? cleanImageText(node.closest("article,li,section,div,figure").text()).slice(0, 360);
      const candidate: CrawledImage = {
        imageUrl: imageUrl!,
        sourceUrl: baseUrl,
        altText: altText || undefined,
        title: title || undefined,
        caption: caption || undefined,
        imageSourceContext: closestText || undefined,
        domPath,
        width: toNumber(node.attr("width")),
        height: toNumber(node.attr("height")),
        priority: basePriority + index,
        sourceType: "official",
        imageConfidenceScore: 35
      };
      candidate.imageConfidenceScore = productName ? scoreImageForFood(candidate, { name: productName, sourceUrl: baseUrl }) : scoreGenericImage(candidate);
      candidate.priority = Math.max(1, basePriority + index - Math.round(candidate.imageConfidenceScore / 3));
      images.push(candidate);
    }
  });
  return dedupeImages(images);
}

function scoreGenericImage(image: CrawledImage) {
  const haystack = `${image.imageUrl} ${image.altText ?? ""} ${image.title ?? ""} ${image.caption ?? ""}`.toLowerCase();
  let score = 35;
  if (goodImagePattern.test(haystack)) score += 30;
  if (/offercard|gds-images/i.test(image.imageUrl)) score += 18;
  if (badImagePattern.test(haystack)) score -= 65;
  if (weakSharedPattern.test(haystack) && !/food|menu|restaurant|dining|gds-images/i.test(haystack)) score -= 18;
  return Math.max(0, Math.min(100, score));
}

function extractSrcsetRaw(srcset?: string) {
  if (!srcset) return [];
  return srcset.split(",").map((entry) => entry.trim().split(/\s+/)[0]).filter(Boolean);
}

function extractBackgroundUrls(style?: string) {
  if (!style) return [];
  return [...style.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((match) => match[1]);
}

export function dedupeImages(images: CrawledImage[]) {
  const seen = new Set<string>();
  return images.filter((image) => {
    const key = image.imageUrl.split("#")[0];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function decodeEntities(text: string) {
  return text.replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}

function cleanImageText(text: string) {
  return decodeEntities(text).normalize("NFKC").replace(/\s+/g, " ").trim();
}

function toNumber(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
