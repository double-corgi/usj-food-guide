import type { CrawledFood, CrawledImage } from "../types/crawler";
import { cleanFoodName, inferCategory, inferLimited, inferStatus, looksLikeFoodName, normalizeFoodName, scoreFoodNameQuality, splitCompositeMenuName } from "./normalize-food";
import { inferArea, inferShopType, normalizeShopName } from "./normalize-shop";
import { parsePrice } from "./parse-price";
import { extractDates } from "./extract-dates";
import { absoluteUrl, dedupeImages, normalizeOfficialImageUrl, validateImageUrl } from "./extract-images";

export function webUrlToTridionUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith("/web/ja/jp")) return null;
    const slug = parsed.pathname
      .replace(/^\/web\/ja\/jp\/?/, "")
      .replace(/\/index\.html$/, "")
      .replace(/\/$/, "");
    return `https://www.usj.co.jp/tridiondata/usj/ja/jp/${slug || "index"}/index.html`;
  } catch {
    return null;
  }
}

export function parseFoodsFromTcmJson(raw: string, sourceUrl: string): { foods: CrawledFood[]; links: string[]; pdfs: string[] } {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { foods: [], links: [], pdfs: [] };
  }

  const rawStrings = collectRawStrings(data);
  const strings = rawStrings.map(stripHtml);
  const links = strings
    .filter((value) => /^\/(?:web|usj)\/ja\/jp|^https:\/\/www\.usj\.co\.jp\/(?:web|usj)\/ja\/jp/.test(value))
    .map((value) => absoluteUrl(value.replace("/usj/ja/jp/", "/web/ja/jp/"), "https://www.usj.co.jp"))
    .filter(Boolean);
  const embeddedLinks = [
    ...rawStrings.flatMap((value) => [...value.matchAll(/href=["']([^"']+)["']/g)].map((match) => match[1])),
    ...[...raw.matchAll(/href=\\\"([^\"]+)\\\"/g)].map((match) => match[1]),
    ...[...raw.matchAll(/href=\\'([^\']+)\\'/g)].map((match) => match[1]),
    ...raw.split(/["\\<>\s]+/).filter((part) => part.startsWith("/usj/ja/jp/") || part.startsWith("/web/ja/jp/"))
  ];
  links.push(
    ...embeddedLinks
      .filter((value) => /^\/(?:web|usj)\/ja\/jp|^https:\/\/www\.usj\.co\.jp\/(?:web|usj)\/ja\/jp/.test(value))
      .map((value) => absoluteUrl(value.replace(/\\+$/g, "").replace("/usj/ja/jp/", "/web/ja/jp/"), "https://www.usj.co.jp"))
      .filter(Boolean)
  );
  const pdfs = rawStrings
    .filter((value) => /\.pdf($|\?)/i.test(value))
    .map((value) => absoluteUrl(value, sourceUrl))
    .filter(Boolean);

  const componentFoods = collectComponents(data).flatMap((component) => buildFoodsFromComponent(component, sourceUrl));
  return {
    foods: dedupeFoods(componentFoods),
    links: [...new Set(links)],
    pdfs: [...new Set(pdfs)]
  };
}

function collectComponents(value: unknown): unknown[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(collectComponents);
  const object = value as Record<string, unknown>;
  const linkedItems = getLinkedItems(object);
  if (linkedItems.length > 0) return linkedItems.flatMap(collectComponents);
  const title = String(object.Title || object.title || object.name || "");
  const fields = object.Fields || object.fields;
  const current = fields && (hasDirectHeading(fields) || /menu|food|restaurant|card|tile|article|image/i.test(title)) ? [object] : [];
  return [...current, ...Object.values(object).flatMap(collectComponents)];
}

function getLinkedItems(object: Record<string, unknown>) {
  const fields = (object.Fields || object.fields) as Record<string, any> | undefined;
  const values = fields?.items?.LinkedComponentValues;
  return Array.isArray(values) ? values : [];
}

function hasDirectHeading(fields: unknown) {
  if (!fields || typeof fields !== "object") return false;
  const object = fields as Record<string, any>;
  return Boolean(object.heading?.Values?.length || object.name?.Values?.length || object.title?.Values?.length || object.menuName?.Values?.length || object.productName?.Values?.length);
}

function buildFoodsFromComponent(component: unknown, sourceUrl: string) {
  const strings = collectStrings(component);
  const text = strings.join(" ");
  const names = [...new Set([...extractStructuredNames(component), ...extractOfficialFoodImageAltNames(strings)])];
  return [...new Set(names)].map((name) => {
    const images = extractTcmImages(strings, sourceUrl, name, names.length > 1).slice(0, 6);
    return buildFood(name, sourceUrl, text, images, inferShopName(strings), images.length ? 0.76 : 0.68);
  });
}

function buildFood(name: string, sourceUrl: string, text: string, images: CrawledImage[], shop?: string, confidence = 0.6): CrawledFood {
  const cleanedName = cleanFoodName(name);
  const { startDate, endDate } = extractDates(text);
  const shopName = normalizeShopName(shop || inferShopName([text]));
  return {
    name: cleanedName,
    normalizedName: normalizeFoodName(cleanedName),
    shopName,
    areaName: inferArea(shopName, text),
    shopType: inferShopType(shopName, text),
    category: inferCategory(`${name} ${text}`),
    price: parsePrice(text),
    description: text.slice(0, 220),
    officialUrl: sourceUrl.replace("/tridiondata/usj/ja/jp/", "/web/ja/jp/").replace(/\/index\.html$/, ""),
    sourceUrl,
    startDate,
    endDate,
    status: inferStatus(startDate, endDate),
    isLimited: inferLimited(text),
    images: images.slice(0, 5),
    confidence
  };
}

function collectStrings(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === "string") return [stripHtml(value)];
  if (typeof value === "number" || typeof value === "boolean") return [String(value)];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (typeof value === "object") return Object.values(value).flatMap(collectStrings);
  return [];
}

function collectRawStrings(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === "string") return [value];
  if (typeof value === "number" || typeof value === "boolean") return [String(value)];
  if (Array.isArray(value)) return value.flatMap(collectRawStrings);
  if (typeof value === "object") return Object.values(value).flatMap(collectRawStrings);
  return [];
}

function extractStructuredNames(value: unknown): string[] {
  const names = new Set<string>();
  walkStructured(value, [], names);
  return [...names].filter((name) => looksLikeFoodName(name) && scoreFoodNameQuality(name) >= 70 && !splitCompositeMenuName(name).isComposite);
}

function extractOfficialFoodImageAltNames(strings: string[]) {
  const names = new Set<string>();
  const joined = strings.join(" ").replace(/\s+/g, " ");
  const hasOfficialFoodImage = /gds-images\/[^ ]*(?:gds-food|food-|offercard|gallery)[^ ]*\.(?:jpe?g|png|webp)/i.test(joined);
  const weakImageContext = /related-[abc]\.|page-title|park-map|logo|restaurant-[abc]\.|interior|map-|hero|mainvisual/i.test(joined);
  if (!hasOfficialFoodImage || weakImageContext) return [];

  for (const match of joined.matchAll(/Global alt\s+(.{3,90}?)(?:\s+0\s+tcm:Metadata|\s+tcm:Metadata|\s+custom:Metadata|\s+\d+\s+tcm:|\s+tcm:|$)/gi)) {
    names.add(cleanFoodName(match[1]));
  }

  strings.forEach((value, index) => {
    if (!/Global alt/i.test(value)) return;
    for (const candidate of strings.slice(index + 1, index + 5)) {
      names.add(cleanFoodName(candidate));
    }
  });

  return [...names].filter((name) => looksLikeFoodName(name) && scoreFoodNameQuality(name) >= 76 && !splitCompositeMenuName(name).isComposite);
}

function walkStructured(value: unknown, path: string[], names: Set<string>) {
  if (value == null) return;
  if (typeof value === "string") {
    for (const candidate of extractNamesFromKeyValue(path, value)) names.add(candidate);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkStructured(item, [...path, String(index)], names));
    return;
  }
  if (typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
      walkStructured(childValue, [...path, childKey], names);
    }
  }
}

function extractNamesFromKeyValue(path: string[], rawValue: string) {
  const normalizedPath = path.join(".");
  const normalizedKey = path.at(-2) ?? path.at(-1) ?? "";
  if (/(MetadataFields|alt|mediaDescription|shortDescription|description|seo|keyword|breadcrumb|url|href|src|caption|aria|summary|body|text|copy|note|notice)/i.test(normalizedPath)) return [];
  const candidates: string[] = [];
  const cleanedValue = stripHtml(rawValue);
  if (
    /(?:^|\.)Fields\.(heading|name|title|menuName|productName|itemName|displayName)\.Values\.\d+$/i.test(normalizedPath) ||
    /^(name|title|heading|menuName|productName|itemName|displayName)$/i.test(normalizedKey) ||
    /(menu|product|food|item).*name/i.test(normalizedKey)
  ) {
    candidates.push(cleanedValue);
  }
  if (/<h[1-4][^>]*>|class=["'][^"']*(?:title|name|menu|product)[^"']*["']/i.test(rawValue)) {
    candidates.push(...extractHeadingNames(rawValue));
  }
  return candidates.map(cleanFoodName).filter(Boolean);
}

function extractHeadingNames(html: string) {
  const names: string[] = [];
  for (const match of html.matchAll(/<h[1-4][^>]*>(.*?)<\/h[1-4]>/gis)) names.push(stripHtml(match[1]));
  for (const match of html.matchAll(/class=["'][^"']*(?:title|name|menu|product)[^"']*["'][^>]*>(.*?)</gis)) names.push(stripHtml(match[1]));
  return names;
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTcmImages(strings: string[], sourceUrl: string, productName?: string, ambiguousComponent = false): CrawledImage[] {
  const context = strings.join(" ").replace(/\s+/g, " ").slice(0, 420);
  return dedupeImages(
    strings
      .flatMap((value) => [...value.matchAll(/(?:https?:)?\/\/[^"'\\\s<>]+?\.(?:png|jpe?g|webp)(?:\?[^"'\\\s<>]*)?|\/(?:web|usj|tridiondata)\/[^"'\\\s<>]+?\.(?:png|jpe?g|webp)(?:\?[^"'\\\s<>]*)?/gi)].map((match) => match[0]))
      .map((value, index) => ({
        imageUrl: normalizeOfficialImageUrl(value, sourceUrl),
        sourceUrl,
        sourceType: "official" as const,
        imageSourceContext: context,
        domPath: ambiguousComponent ? "tcm-component:ambiguous" : "tcm-component",
        priority: index + 10,
        imageMatchReason: productName && !ambiguousComponent ? "same-tcm-component" : undefined,
        imageMismatchReason: ambiguousComponent ? "ambiguous-tcm-component-multiple-products" : undefined,
        imageConfidenceScore: /gds-images|offercard|food|menu|restaurant/i.test(value) ? (ambiguousComponent ? 48 : 72) : 42
      }))
      .filter((image) => validateImageUrl(image.imageUrl) && !/logo|favicon|icon/i.test(image.imageUrl))
  );
}

function inferShopName(strings: string[]) {
  const joined = strings.join(" ");
  const match = joined.match(/([ァ-ヶー一-龠A-Za-z0-9&！!・･\s]{2,32}(?:レストラン|カフェ|キッチン|パーラー|グリル|ワゴン|カート|パブ))/);
  return match?.[1];
}

function dedupeFoods(foods: CrawledFood[]) {
  const map = new Map<string, CrawledFood>();
  for (const food of foods.filter((item) => looksLikeFoodName(item.name))) {
    const key = `${food.normalizedName}:${food.shopName}`;
    const current = map.get(key);
    if (!current || food.confidence > current.confidence || food.images.length > current.images.length) {
      map.set(key, food);
    }
  }
  return [...map.values()];
}
