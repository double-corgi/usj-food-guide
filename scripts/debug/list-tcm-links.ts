import { fetchText } from "../utils/http";
import { parseFoodsFromTcmJson } from "../utils/tcm-parser";

async function main() {
  const url = process.argv[2] ?? "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/index.html";
  const raw = await fetchText(url);
  const parsed = parseFoodsFromTcmJson(raw, url);
  console.log(JSON.stringify(parsed.links.sort(), null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
