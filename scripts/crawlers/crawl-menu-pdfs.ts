import type { CrawlSourceResult, CrawledFood } from "../types/crawler";
import { fetchBuffer, fetchText } from "../utils/http";
import { extractInternalLinks, extractPdfLinks } from "../utils/html-food-parser";
import { cleanFoodName, inferCategory, inferLimited, inferStatus, looksLikeFoodName, normalizeFoodName } from "../utils/normalize-food";
import { inferArea, inferShopType, normalizeShopName } from "../utils/normalize-shop";
import { parsePrice } from "../utils/parse-price";
import { extractDates } from "../utils/extract-dates";

const seedPages = [
  "https://www.usj.co.jp/web/ja/jp/restaurants",
  "https://www.usj.co.jp/web/ja/jp/areas/super-nintendo-world",
  "https://www.usj.co.jp/web/ja/jp/events"
];

const knownPdfs = [
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/files/documents/usj-pdf-serviceguide-food-allergies-detail-20260105.pdf",
  "https://www.usj.co.jp/parkguide/pdf/detail.pdf",
  "https://www.usj.co.jp/tridiondata/usj/ja/jp/files/documents/usj-pdf-restaurant-other-menu-kinopios-cafe-en.pdf"
];

export async function crawlMenuPdfs(maxPdfs = Number(process.env.CRAWL_MAX_PDFS ?? 12)): Promise<CrawlSourceResult> {
  const pdfUrls = new Set(knownPdfs);
  const errors: string[] = [];
  let pagesCrawled = 0;

  for (const page of seedPages) {
    try {
      const html = await fetchText(page);
      pagesCrawled += 1;
      extractPdfLinks(html, page).forEach((url) => pdfUrls.add(url));
      extractInternalLinks(html, page)
        .filter((url) => /pdf|menu|restaurant/i.test(url))
        .slice(0, 20)
        .forEach((url) => {
          if (/\.pdf($|\?)/i.test(url)) pdfUrls.add(url);
        });
    } catch (error) {
      errors.push(`${page}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const foods: CrawledFood[] = [];
  for (const pdfUrl of [...pdfUrls].slice(0, maxPdfs)) {
    try {
      const buffer = await fetchBuffer(pdfUrl, { timeoutMs: 20000, retries: 1 });
      const pdfModule = await import("pdf-parse");
      const PDFParse = pdfModule.PDFParse as new (options: { data: Buffer }) => {
        getText: () => Promise<{ text: string }>;
        destroy?: () => Promise<void>;
      };
      const parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      await parser.destroy?.();
      pagesCrawled += 1;
      foods.push(...parseFoodsFromPdfText(parsed.text, pdfUrl));
    } catch (error) {
      errors.push(`${pdfUrl}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    sourceName: "official-menu-pdfs",
    sourceUrl: seedPages[0],
    pagesCrawled,
    foods,
    errors
  };
}

function parseFoodsFromPdfText(text: string, sourceUrl: string): CrawledFood[] {
  const foods: CrawledFood[] = [];
  const lines = text
    .split(/\n|\r/)
    .map((line) => cleanFoodName(line))
    .filter(Boolean);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const windowText = lines.slice(Math.max(0, index - 2), index + 4).join(" ");
    if (/^(?:--\s*)?\d+\s+of\s+\d+(?:\s*--)?$/i.test(line)) continue;
    if (!looksLikeFoodName(line) && !looksLikeFoodName(windowText)) continue;
    const name = looksLikeFoodName(line) ? line : cleanFoodName(windowText.split(/[。｜|]/)[0]);
    if (!looksLikeFoodName(name)) continue;
    const { startDate, endDate } = extractDates(windowText);
    const shopName = normalizeShopName(inferShopFromPdf(sourceUrl, windowText));
    foods.push({
      name,
      normalizedName: normalizeFoodName(name),
      shopName,
      areaName: inferArea(shopName, windowText),
      shopType: inferShopType(shopName, windowText),
      category: inferCategory(`${name} ${windowText}`),
      price: parsePrice(windowText),
      description: windowText.slice(0, 220),
      officialUrl: sourceUrl,
      sourceUrl,
      startDate,
      endDate,
      status: inferStatus(startDate, endDate),
      isLimited: inferLimited(windowText),
      images: [],
      confidence: 0.58
    });
  }
  return dedupe(foods);
}

function inferShopFromPdf(sourceUrl: string, text: string) {
  if (/kinopios/i.test(sourceUrl)) return "キノピオ・カフェ";
  const match = text.match(/([ァ-ヶー一-龠A-Za-z0-9&！!・･\s]{2,28}(?:カフェ|レストラン|パーラー|グリル|キッチン|パブ))/);
  return match?.[1] ?? "店舗未確認";
}

function dedupe(foods: CrawledFood[]) {
  return [...new Map(foods.map((food) => [`${food.normalizedName}:${food.shopName}`, food])).values()];
}
