import { fetchText } from "../utils/http";
import { parseFoodsFromTcmJson, webUrlToTridionUrl } from "../utils/tcm-parser";
import { normalizeFoodName } from "../utils/normalize-food";

const seeds = process.argv.slice(2);
const urls = seeds.length > 0 ? seeds : [
  "https://www.usj.co.jp/web/ja/jp/restaurants",
  "https://www.usj.co.jp/web/ja/jp/restaurants/food-cart",
  "https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food",
  "https://www.usj.co.jp/web/ja/jp/restaurants/super-nintendo-world-food",
  "https://www.usj.co.jp/web/ja/jp/restaurants/the-wizarding-world-of-harry-potter-food",
  "https://www.usj.co.jp/web/ja/jp/restaurants/minion-food"
];

const seen = new Set<string>();
const queue = [...urls];
const results: Array<{ url: string; foods: number; names: string[] }> = [];

async function main() {
  while (queue.length > 0 && seen.size < 220) {
    const webUrl = queue.shift();
    if (!webUrl || seen.has(webUrl)) continue;
    seen.add(webUrl);
    const tcmUrl = webUrlToTridionUrl(webUrl);
    if (!tcmUrl) continue;
    try {
      const raw = await fetchText(tcmUrl, { retries: 1, timeoutMs: 15000 });
      const parsed = parseFoodsFromTcmJson(raw, tcmUrl);
      if (parsed.foods.length > 0) {
        results.push({
          url: tcmUrl,
          foods: parsed.foods.length,
          names: [...new Map(parsed.foods.map((food) => [normalizeFoodName(food.name), food.name])).values()].slice(0, 20)
        });
      }
      for (const link of parsed.links) {
        if (/\/web\/ja\/jp\/(?:restaurants|events|areas)|\/company\/news\//.test(link) && !seen.has(link) && !queue.includes(link)) {
          queue.push(link);
        }
      }
    } catch {
      // Keep scan best-effort; individual crawlers record detailed errors.
    }
  }
  console.log(JSON.stringify({ scanned: seen.size, pagesWithFoods: results.length, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
