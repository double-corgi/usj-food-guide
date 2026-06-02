import fs from "node:fs";
import { crawlTargetedPages } from "../crawlers/crawl-targeted-pages";

const modes = process.argv.slice(2);
const selected = modes.length ? modes : ["restaurantmenus"];

async function main() {
  const results = [];
  for (const mode of selected) {
    const result = await crawlTargetedPages(mode as never);
    results.push(result);
    console.error(`${mode}: pages=${result.pagesCrawled} foods=${result.foods.length} errors=${result.errors.length}`);
  }
  fs.writeFileSync("/private/tmp/usj-targeted-raw.json", JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ modes: selected, sources: results.length, foods: results.reduce((sum, source) => sum + source.foods.length, 0) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
