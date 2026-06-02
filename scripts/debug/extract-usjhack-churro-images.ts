import fs from "node:fs";
import * as cheerio from "cheerio";

const htmlPath = "/private/tmp/usjhack-churitos.html";
const html = fs.readFileSync(htmlPath, "utf8");
const $ = cheerio.load(html);

const rows: Array<{ heading: string; imageUrl: string; alt: string; width?: string; height?: string }> = [];

$("h2, h3").each((_, heading) => {
  const title = $(heading).text().replace(/\s+/g, " ").trim();
  if (!/チュリトス|チュロス|churro/i.test(title)) return;
  let cursor = $(heading).next();
  for (let index = 0; index < 8 && cursor.length; index += 1) {
    const image = cursor.is("img") ? cursor : cursor.find("img").first();
    if (image.length) {
      rows.push({
        heading: title,
        imageUrl: image.attr("src") ?? "",
        alt: image.attr("alt") ?? "",
        width: image.attr("width") ?? undefined,
        height: image.attr("height") ?? undefined
      });
      break;
    }
    cursor = cursor.next();
  }
});

console.log(JSON.stringify(rows, null, 2));
