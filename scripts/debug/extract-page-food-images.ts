import fs from "node:fs";
import * as cheerio from "cheerio";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: ts-node scripts/debug/extract-page-food-images.ts <html-file>");
  process.exit(1);
}

const html = fs.readFileSync(filePath, "utf8");
const $ = cheerio.load(html);

const rows: Array<{
  heading: string;
  imageUrl: string;
  alt: string;
  width?: string;
  height?: string;
  nearbyText: string;
}> = [];

$("h1, h2, h3, h4").each((_, heading) => {
  const title = $(heading).text().replace(/\s+/g, " ").trim();
  if (!/チュリトス|チュロス|churro|ポップコーン|ドリンク|ソーダ|ラテ|スムージー|フローズン|シェイク/i.test(title)) return;

  let cursor = $(heading).next();
  const nearbyTexts: string[] = [];

  for (let index = 0; index < 12 && cursor.length; index += 1) {
    nearbyTexts.push(cursor.text().replace(/\s+/g, " ").trim());
    const image = cursor.is("img") ? cursor : cursor.find("img").first();
    if (image.length) {
      rows.push({
        heading: title,
        imageUrl: normalizeUrl(image.attr("src") || image.attr("data-src") || image.attr("data-lazy-src") || ""),
        alt: image.attr("alt") ?? "",
        width: image.attr("width") ?? undefined,
        height: image.attr("height") ?? undefined,
        nearbyText: nearbyTexts.join(" ").slice(0, 280)
      });
      return;
    }
    cursor = cursor.next();
  }
});

console.log(JSON.stringify(rows, null, 2));

function normalizeUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}
