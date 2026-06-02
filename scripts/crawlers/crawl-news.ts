import type { CrawlSourceResult } from "../types/crawler";
import { fetchText } from "../utils/http";
import { extractInternalLinks, parseFoodsFromHtml } from "../utils/html-food-parser";
import { parseFoodsFromTcmJson, webUrlToTridionUrl } from "../utils/tcm-parser";

const seedUrls = [
  "https://www.usj.co.jp/company/news/",
  "https://www.usj.co.jp/company/company_e/news/",
  "https://www.usj.co.jp/web/ja/jp/news"
];

export async function crawlNews(maxPages = Number(process.env.CRAWL_MAX_NEWS_PAGES ?? 50)): Promise<CrawlSourceResult> {
  const visited = new Set<string>();
  const queue = [...seedUrls];
  const foods = [];
  const errors: string[] = [];

  while (queue.length > 0 && visited.size < maxPages) {
    const url = queue.shift();
    if (!url || visited.has(url)) continue;
    visited.add(url);
    try {
      const html = await fetchText(url);
      foods.push(...parseFoodsFromHtml(html, url));
      const tridionUrl = webUrlToTridionUrl(url);
      if (tridionUrl) {
        const tcm = await fetchText(tridionUrl);
        const parsed = parseFoodsFromTcmJson(tcm, tridionUrl);
        foods.push(...parsed.foods);
        parsed.links.filter((link) => /news|events|restaurant|food|menu/i.test(link)).forEach((link) => {
          if (!visited.has(link) && !queue.includes(link)) queue.push(link);
        });
      }
      const links = extractInternalLinks(html, url).filter((link) => /news|events|restaurant|food|menu/i.test(link));
      for (const link of links.slice(0, 80)) {
        if (!visited.has(link) && !queue.includes(link)) queue.push(link);
      }
    } catch (error) {
      errors.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    sourceName: "official-news",
    sourceUrl: seedUrls[0],
    pagesCrawled: visited.size,
    foods,
    errors
  };
}
