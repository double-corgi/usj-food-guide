import { fetchText } from "../utils/http";
import { parseFoodsFromHtml } from "../utils/html-food-parser";

const urls = process.argv.slice(2);

async function main() {
  for (const url of urls) {
    try {
      const html = await fetchText(url, { retries: 1, timeoutMs: 8000 });
      const foods = parseFoodsFromHtml(html, url);
      console.log(`\nURL ${url} foods=${foods.length}`);
      for (const food of foods.slice(0, 30)) {
        console.log([food.name, food.category, food.images.length, food.images[0]?.imageUrl ?? ""].join(" | "));
      }
    } catch (error) {
      console.log(`\nERR ${url} ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
