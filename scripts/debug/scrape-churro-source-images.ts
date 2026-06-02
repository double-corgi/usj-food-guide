import * as cheerio from "cheerio";

const urls = [
  "https://castel.jp/p/3101",
  "https://usjhack.com/churitos/",
  "https://usj.opus21.net/restaurant/popcorn-food-cart.html",
  "https://usj-yota.com/churros-usj/",
  "https://travel-campus.com/1797"
];

async function main() {
  const rows: Array<{ page: string; src: string; alt: string; width?: string; height?: string }> = [];
  for (const page of urls) {
    const response = await fetch(page, { headers: { "user-agent": "Mozilla/5.0" } });
    const html = await response.text();
    const $ = cheerio.load(html);
    $("img, source").each((_, element) => {
      const src =
        $(element).attr("data-src") ??
        $(element).attr("data-lazy-src") ??
        $(element).attr("data-original") ??
        $(element).attr("src") ??
        $(element).attr("srcset") ??
        "";
      const alt = $(element).attr("alt") ?? $(element).attr("title") ?? "";
      const context = `${src} ${alt}`.normalize("NFKC");
      if (!/チュリ|チュロ|chur|chocolate|strawberry|cinnamon|turritos|turitos/i.test(context)) return;
      if (/data:image|lazy\.svg|no[_.-]?image|logo|icon/i.test(src)) return;
      rows.push({
        page,
        src: resolveUrl(src.split(/\s+/)[0], page),
        alt,
        width: $(element).attr("width"),
        height: $(element).attr("height")
      });
    });
  }
  console.log(JSON.stringify(rows, null, 2));
}

function resolveUrl(value: string, base: string) {
  try {
    return new URL(value, base).toString();
  } catch {
    return value;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
