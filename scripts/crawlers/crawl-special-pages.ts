import type { CrawlSourceResult } from "../types/crawler";
import { fetchText } from "../utils/http";
import { extractInternalLinks, parseFoodsFromHtml } from "../utils/html-food-parser";
import { parseFoodsFromTcmJson, webUrlToTridionUrl } from "../utils/tcm-parser";

const seedUrls = [
  "https://www.usj.co.jp/web/ja/jp/events",
  "https://www.usj.co.jp/web/ja/jp/events/no-limit-summer",
  "https://www.usj.co.jp/web/ja/jp/events/halloween",
  "https://www.usj.co.jp/web/ja/jp/events/christmas",
  "https://www.usj.co.jp/web/ja/jp/areas/super-nintendo-world",
  "https://www.usj.co.jp/web/ja/jp/areas/minion-park",
  "https://www.usj.co.jp/web/ja/jp/areas/the-wizarding-world-of-harry-potter"
];

export async function crawlSpecialPages(maxPages = Number(process.env.CRAWL_MAX_SPECIAL_PAGES ?? 60)): Promise<CrawlSourceResult> {
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
        const rawLinks = extractWebLinksFromRaw(tcm);
        for (const link of [...parsed.links, ...rawLinks].filter((link) => /\/web\/ja\/jp\/(events|areas|restaurants)/.test(link))) {
          if (!visited.has(link) && !queue.includes(link)) queue.push(link);
        }
      }
      const links = extractInternalLinks(html, url).filter((link) => /\/web\/ja\/jp\/(events|areas|restaurants)/.test(link));
      for (const link of links) {
        if (!visited.has(link) && !queue.includes(link)) queue.push(link);
      }
    } catch (error) {
      errors.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    sourceName: "official-special-pages",
    sourceUrl: seedUrls[0],
    pagesCrawled: visited.size,
    foods,
    errors
  };
}

function extractWebLinksFromRaw(raw: string) {
  return raw
    .split(/["\\<>\s]+/)
    .filter((part) => part.startsWith("/usj/ja/jp/") || part.startsWith("/web/ja/jp/"))
    .map((part) => {
      try {
        return new URL(part.replace("/usj/ja/jp/", "/web/ja/jp/"), "https://www.usj.co.jp").toString();
      } catch {
        return "";
      }
    })
    .filter((url) => url && !/\.(png|jpe?g|webp|svg|ico|pdf)($|\?)/i.test(url));
}
