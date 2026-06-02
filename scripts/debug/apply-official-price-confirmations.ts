import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";

type OfficialPriceConfirmation = {
  foodId: string;
  name: string;
  price: number;
  sourceUrl: string;
  sourceName: string;
  note: string;
};

const confirmations: OfficialPriceConfirmation[] = [
  {
    foodId: "food-u0o9uo",
    name: "マリオ・バーガー ~ベーコン&チーズ~",
    price: 2600,
    sourceUrl: "https://www.usj.co.jp/tridiondata/usj/ja/jp/files/documents/usj-pdf-restaurant-other-menu-kinopios-cafe-en.pdf",
    sourceName: "USJ公式 キノピオ・カフェ メニューPDF",
    note: "USJ公式メニューPDFに「マリオ・バーガー / Mario's Bacon Cheeseburger ¥2,600」と掲載"
  },
  {
    foodId: "food-1gtoojv",
    name: "カレーライス・キッズセット",
    price: 1400,
    sourceUrl: "https://www.usj.co.jp/tridiondata/usj/ja/jp/files/documents/usj-pdf-restaurant-other-menu-kinopios-cafe-en.pdf",
    sourceName: "USJ公式 キノピオ・カフェ メニューPDF",
    note: "USJ公式メニューPDFに「カレー・キッズセット / Kids Curry Meal ¥1,400」と掲載"
  },
  {
    foodId: "food-it27lt",
    name: "マッシュルームスープ",
    price: 900,
    sourceUrl: "https://www.usj.co.jp/tridiondata/usj/ja/jp/files/documents/usj-pdf-restaurant-other-menu-kinopios-cafe-en.pdf",
    sourceName: "USJ公式 キノピオ・カフェ メニューPDF",
    note: "USJ公式メニューPDFに「マッシュルームスープ / Mushroom Soup ¥900」と掲載"
  }
];

const outputDir = path.join(process.cwd(), "scripts", "output");
const datasetPath = path.join(outputDir, "foods.generated.json");
const reportPath = path.join(outputDir, "official-price-confirmations.generated.json");
const applyChanges = process.argv.includes("--apply");

const dataset = readJson<GeneratedDataset>(datasetPath);
const before = summarize(dataset.foods);
const updates: Array<OfficialPriceConfirmation & { previousPrice?: number }> = [];
const skipped: Array<{ foodId: string; name: string; reason: string }> = [];

for (const confirmation of confirmations) {
  const food = dataset.foods.find((candidate) => candidate.id === confirmation.foodId);
  if (!food) {
    skipped.push({ foodId: confirmation.foodId, name: confirmation.name, reason: "food-not-found" });
    continue;
  }
  if (normalizeName(food.name) !== normalizeName(confirmation.name)) {
    skipped.push({ foodId: confirmation.foodId, name: confirmation.name, reason: `name-mismatch:${food.name}` });
    continue;
  }
  if (!isOfficialUsjUrl(confirmation.sourceUrl)) {
    skipped.push({ foodId: confirmation.foodId, name: confirmation.name, reason: "source-not-official-usj" });
    continue;
  }
  if (!Number.isInteger(confirmation.price) || confirmation.price < 100 || confirmation.price > 12000) {
    skipped.push({ foodId: confirmation.foodId, name: confirmation.name, reason: "invalid-price" });
    continue;
  }

  updates.push({ ...confirmation, previousPrice: food.price ?? food.priceMin ?? food.price_min });
  if (applyChanges) applyPrice(food, confirmation);
}

if (applyChanges && updates.length > 0) {
  dataset.generatedAt = new Date().toISOString();
  writeJson(datasetPath, dataset);
}

const after = summarize(dataset.foods);
const report = {
  mode: applyChanges ? "apply" : "audit",
  generatedAt: new Date().toISOString(),
  before,
  after,
  newPrices: updates.filter((update) => !update.previousPrice).length,
  updates,
  skipped
};

writeJson(reportPath, report);
console.log(JSON.stringify(report, null, 2));

function applyPrice(food: GeneratedFood, confirmation: OfficialPriceConfirmation) {
  const now = new Date().toISOString();
  food.price = confirmation.price;
  food.priceMin = confirmation.price;
  food.price_min = confirmation.price;
  food.priceMax = undefined;
  food.price_max = undefined;
  food.priceNote = confirmation.note;
  food.price_note = confirmation.note;
  food.priceSourceUrl = confirmation.sourceUrl;
  food.price_source_url = confirmation.sourceUrl;
  food.priceLastCheckedAt = now;
  food.price_last_checked_at = now;
  food.priceConfidenceScore = 98;
  food.price_confidence_score = 98;
  food.lastCheckedAt = now;
  food.last_checked_at = now;
}

function summarize(foods: GeneratedFood[]) {
  const visible = foods.filter(
    (food) =>
      food.reviewStatus === "approved" &&
      food.canonicalFood !== false &&
      !food.hidden &&
      food.displayQuality !== "low" &&
      food.nameQualityScore >= 60 &&
      food.confidenceScore >= 45 &&
      !food.compositeMenu &&
      Boolean(food.sourceUrl)
  );
  return {
    foods: visible.length,
    images: visible.filter((food) => Boolean(food.imageUrl ?? food.representativeImageUrl ?? food.images?.find((image) => image.enabled))).length,
    placeholders: visible.filter((food) => (food.imageUrl ?? food.representativeImageUrl ?? "").startsWith("/placeholders/")).length,
    priceKnown: visible.filter(hasKnownPrice).length,
    priceUnknown: visible.filter((food) => !hasKnownPrice(food)).length
  };
}

function hasKnownPrice(food: GeneratedFood) {
  return Boolean(food.price ?? food.priceMin ?? food.price_min ?? food.locations?.find((location) => location.price)?.price);
}

function normalizeName(name: string) {
  return name.normalize("NFKC").replace(/[ "'’`´“”‘、。・･～〜~\-‐‑‒–—―!！?？:：()（）[\]【】]/g, "").toLowerCase();
}

function isOfficialUsjUrl(url: string) {
  return /^https:\/\/www\.usj\.co\.jp\//.test(url);
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
