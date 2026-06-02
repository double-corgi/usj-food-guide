import * as cheerio from "cheerio";

async function main() {
  const response = await fetch("https://castel.jp/p/3101", { headers: { "user-agent": "Mozilla/5.0" } });
  const html = await response.text();
  const $ = cheerio.load(html);
  const items: Array<{ href: string; text: string }> = [];
  $('a[href*="/item/"]').each((_, element) => {
    const href = String($(element).attr("href") ?? "");
    const text = $(element).text().trim().replace(/\s+/g, " ");
    if (/チュリ|チュロ|chur/i.test(`${href} ${text}`)) items.push({ href, text });
  });
  const images: Array<{ src: string; alt: string }> = [];
  $("img").each((_, element) => {
    const src = String($(element).attr("src") ?? $(element).attr("data-src") ?? "");
    const alt = String($(element).attr("alt") ?? "");
    if (/チュリ|チュロ|chur/i.test(`${src} ${alt}`)) {
      const attrs = Object.fromEntries(Object.entries(element.attribs ?? {}).filter(([key]) => /src|data|alt|class/i.test(key)));
      images.push({ src: String(attrs["data-src"] ?? attrs["data-original"] ?? attrs["data-lazy-src"] ?? src), alt: `${alt} ${JSON.stringify(attrs)}` });
    }
  });
  console.log(JSON.stringify({ items, images }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
