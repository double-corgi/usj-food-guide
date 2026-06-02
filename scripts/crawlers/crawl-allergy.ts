import type { CrawlSourceResult, CrawledFood } from "../types/crawler";
import { fetchText } from "../utils/http";
import { inferCategory, inferStatus, normalizeFoodName } from "../utils/normalize-food";
import { inferArea, inferShopType, knownRestaurantAreas, normalizeShopName } from "../utils/normalize-shop";
import { parseFoodsFromHtml } from "../utils/html-food-parser";

const allergyUrls = [
  "https://usjfoodallergy.usj.co.jp/search_restaurant",
  "https://dev-usjfoodallergy.usj.co.jp/",
  "https://www.usj.co.jp/parkguide/pdf/detail.pdf"
];

const fallbackRestaurants = Object.keys(knownRestaurantAreas);

export async function crawlAllergy(): Promise<CrawlSourceResult> {
  const foods: CrawledFood[] = [];
  const errors: string[] = [];
  let pagesCrawled = 0;

  for (const url of allergyUrls.slice(0, 2)) {
    try {
      const html = await fetchText(url, { retries: 1, timeoutMs: 12000 });
      pagesCrawled += 1;
      foods.push(...parseFoodsFromHtml(html, url));
      for (const name of extractRestaurantNames(html)) {
        foods.push(toRestaurantPlaceholder(name, url));
      }
    } catch (error) {
      errors.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  for (const name of fallbackRestaurants) {
    foods.push(toRestaurantPlaceholder(name, "https://usjfoodallergy.usj.co.jp/search_restaurant"));
  }

  return {
    sourceName: "official-allergy",
    sourceUrl: allergyUrls[0],
    pagesCrawled,
    foods,
    errors
  };
}

function extractRestaurantNames(html: string) {
  const names = new Set<string>();
  for (const name of fallbackRestaurants) {
    if (html.includes(name)) names.add(name);
  }
  return [...names];
}

function toRestaurantPlaceholder(shop: string, sourceUrl: string): CrawledFood {
  const shopName = normalizeShopName(shop);
  const name = `${shopName} メニュー確認中`;
  return {
    name,
    normalizedName: normalizeFoodName(name),
    shopName,
    areaName: inferArea(shopName),
    shopType: inferShopType(shopName),
    category: inferCategory(name),
    description: "公式アレルゲン情報に掲載されている店舗です。詳細メニューは公式ページまたは管理画面で確認してください。",
    officialUrl: sourceUrl,
    sourceUrl,
    status: inferStatus(),
    isLimited: false,
    images: [],
    confidence: 0.25
  };
}
