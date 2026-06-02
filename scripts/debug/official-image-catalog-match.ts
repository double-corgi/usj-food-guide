import fs from "node:fs";
import path from "node:path";
import type { CrawlRunResult } from "../types/crawler";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";
import { normalizeFoodName, similarity } from "../utils/normalize-food";
import { scoreCategoryImageMatch } from "../utils/image-quality";

const outputDir = path.join(process.cwd(), "scripts", "output");
const dataset = JSON.parse(fs.readFileSync(path.join(outputDir, "foods.generated.json"), "utf8")) as GeneratedDataset;
const report = JSON.parse(fs.readFileSync(path.join(outputDir, "latest-crawl-report.json"), "utf8")) as CrawlRunResult;

const catalog = buildOfficialImageCatalog(report);
const targets = dataset.foods.filter(
  (food) =>
    food.reviewStatus === "approved" &&
    food.canonicalFood !== false &&
    !food.hidden &&
    food.displayQuality !== "low" &&
    food.nameQualityScore >= 60 &&
    food.confidenceScore >= 45 &&
    !food.compositeMenu &&
    Boolean(food.sourceUrl) &&
    !food.images.some((image) => image.enabled && image.sourceType === "official" && image.imageVerified)
);

const results = targets.map((food) => ({
  name: food.name,
  category: food.category,
  sourceUrl: food.sourceUrl,
  matches: scoreMatches(food, catalog).slice(0, 8)
}));

console.log(JSON.stringify({ targets: targets.length, catalog: catalog.length, results }, null, 2));

function buildOfficialImageCatalog(crawlReport: CrawlRunResult) {
  const seen = new Set<string>();
  const images: Array<{ imageUrl: string; sourceUrl?: string; context: string; catalogFoodName?: string }> = [];
  for (const source of crawlReport.sources ?? []) {
    for (const food of source.foods ?? []) {
      for (const image of food.images ?? []) {
        add(image.imageUrl, image.sourceUrl ?? food.sourceUrl, `${food.name} ${image.imageSourceContext ?? ""}`, food.name);
      }
    }
    for (const value of [...((source.fetchedUrls ?? []) as string[]), ...((source.errors ?? []) as string[]), ...((source.rawImageUrls ?? []) as string[])]) {
      for (const match of String(value).matchAll(/https:\/\/www\.usj\.co\.jp\/(?:web\/ja\/jp|tridiondata\/usj\/ja\/jp)\/files\/images\/[^\s":]+?\.(?:jpg|jpeg|png|webp)/gi)) {
        add(match[0], (source as any).url ?? (source as any).sourceUrl, "raw source image url", undefined);
      }
    }
  }
  return images;

  function add(raw?: string, sourceUrl?: string, context = "", catalogFoodName?: string) {
    if (!raw) return;
    const imageUrl = raw.replace("https://www.usj.co.jp/web/ja/jp/files/", "https://www.usj.co.jp/tridiondata/usj/ja/jp/files/");
    if (!/^https:\/\/www\.usj\.co\.jp\/tridiondata\//i.test(imageUrl)) return;
    if (seen.has(imageUrl)) return;
    if (/(logo|icon|map|hero|mainvisual|kv|restaurant-[abc]|area|attraction|sns|castel|watermark|透かし|experience-image)/i.test(imageUrl)) return;
    seen.add(imageUrl);
    images.push({ imageUrl, sourceUrl, context, catalogFoodName });
  }
}

function scoreMatches(food: GeneratedFood, catalog: ReturnType<typeof buildOfficialImageCatalog>) {
  const signals = productSignals(food.name);
  return catalog
    .map((image) => {
      const haystack = `${image.imageUrl} ${image.context}`.toLowerCase();
      const matched = signals.filter((signal) => signal.pattern.test(haystack));
      const specific = matched.filter((signal) => signal.specific);
      const catalogName = image.catalogFoodName ?? "";
      const nameCompatible = catalogName ? similarity(food.name, catalogName) >= 0.72 || normalizeFoodName(catalogName) === food.normalizedName : false;
      const categoryScore = scoreCategoryImageMatch(haystack, food.category);
      const score = categoryScore + specific.length * 34 + (matched.length - specific.length) * 6 + (nameCompatible ? 34 : 0) + (/offercard|gallery|gds-images|food/i.test(haystack) ? 12 : 0);
      return {
        score,
        categoryScore,
        matched: matched.map((signal) => signal.label),
        catalogFoodName: image.catalogFoodName,
        imageUrl: image.imageUrl,
        sourceUrl: image.sourceUrl
      };
    })
    .filter((match) => match.matched.length > 0 || match.catalogFoodName)
    .sort((a, b) => b.score - a.score);
}

function productSignals(name: string) {
  const normalized = name.normalize("NFKC").toLowerCase();
  const signals: Array<{ pattern: RegExp; specific: boolean; label: string }> = [];
  const add = (pattern: RegExp, label: string, specific = true) => signals.push({ pattern, specific, label });
  const dictionary: Array<[RegExp, Array<{ pattern: RegExp; label: string; specific?: boolean }>] > = [
    [/チョコバナナ|バナナ/, [{ pattern: /choco-banana/, label: "choco-banana" }, { pattern: /minion/, label: "minion" }]],
    [/ホグワーツ|ハリーポッター/, [{ pattern: /hogwarts|harry-potter/, label: "hogwarts" }]],
    [/スパイダーマン/, [{ pattern: /spider-?man/, label: "spider-man" }]],
    [/おさるのジョージ|ジョージ/, [{ pattern: /curious-george|george/, label: "curious-george" }]],
    [/ゼニガメ|ポケモン/, [{ pattern: /zenigame|squirtle|pokemon/, label: "pokemon" }]],
    [/黒閃|虎杖|呪術|決めろ/, [{ pattern: /jujutsu|black-flash|itadori/, label: "jujutsu" }]],
    [/虚式|茈|ミックスベリー/, [{ pattern: /hollow-purple|mixed-berry/, label: "hollow-purple" }]],
    [/トラファルガー|ロー|オレンジ.*ビターチョコ/, [{ pattern: /trafalgar|law|one-piece|orange.*bitter.*choco/, label: "one-piece" }]],
    [/デク|ワン.?フォー.?オール|ピスタチオ/, [{ pattern: /deku|one-for-all|pistachio|hero-academia/, label: "deku" }]],
    [/プーギー|ピーチ/, [{ pattern: /poogie|pugi|peach|monster-hunter/, label: "poogie" }]],
    [/クリスマス.*チョコ/, [{ pattern: /christmas.*choco|choco.*christmas/, label: "christmas-choco" }]],
    [/ティラミス/, [{ pattern: /tiramisu/, label: "tiramisu" }]],
    [/メープル/, [{ pattern: /maple/, label: "maple" }]],
    [/チョコ.*クッキー|ココア.*クッキー/, [{ pattern: /choco.*cookie|cocoa.*cookie|cookie/, label: "cookie" }]],
    [/ストロベリー|いちご/, [{ pattern: /strawberry/, label: "strawberry", specific: false }]],
    [/チョコレート/, [{ pattern: /chocolate|choco/, label: "chocolate", specific: false }]],
    [/チュリトス|チュロス/, [{ pattern: /churro|churritos|churitos/, label: "churro", specific: false }]]
  ];
  for (const [namePattern, urlPatterns] of dictionary) {
    if (namePattern.test(normalized)) {
      for (const signal of urlPatterns) add(signal.pattern, signal.label, signal.specific ?? true);
    }
  }
  return signals;
}
