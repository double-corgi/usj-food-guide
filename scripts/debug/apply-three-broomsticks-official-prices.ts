import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";

type PriceConfirmation = {
  foodId: string;
  name: string;
  price: number;
  sourceUrl: string;
  sourceName: string;
  sourceQuote: string;
};

const sourceUrl = "https://www.usj.co.jp/tridiondata/usj/ko/kr/files/documents/usj-pdf-restaurant-other-menu-three-broomsticks.pdf";
const sourceName = "USJ公式 三本の箒 メニューPDF";

const confirmations: PriceConfirmation[] = [
  {
    foodId: "food-up3lba",
    name: "ローストビーフ",
    price: 3100,
    sourceUrl,
    sourceName,
    sourceQuote: "BEEF SUNDAY ROAST / ローストビーフ 3,100"
  },
  {
    foodId: "food-1reufss",
    name: "ロティサリー・スモークチキン&ポークリブ",
    price: 2600,
    sourceUrl,
    sourceName,
    sourceQuote: "ROTISSERIE SMOKED CHICKEN AND PORK RIBS PLATE / ロティサリー・スモークチキン＆ポークリブ 2,600"
  },
  {
    foodId: "food-2qri4c",
    name: "ロティサリー・スモークチキン&シェパーズパイ",
    price: 2500,
    sourceUrl,
    sourceName,
    sourceQuote: "ROTISSERIE SMOKED CHICKEN AND SHEPHERD'S PIE PLATE / ロティサリー・スモークチキン＆シェパーズパイ 2,500"
  },
  {
    foodId: "food-1dm0ouy",
    name: "ポークリブ",
    price: 2200,
    sourceUrl,
    sourceName,
    sourceQuote: "PORK RIBS PLATE / ポークリブ 2,200"
  },
  {
    foodId: "food-16q65hw",
    name: "バタービールTM・プディング",
    price: 600,
    sourceUrl,
    sourceName,
    sourceQuote: "BUTTERBEER POTTED CREAM / バタービール™・プディング 600"
  },
  {
    foodId: "food-k2clec",
    name: "ホッグズ・ヘッド・ビール ~マグカップ付~",
    price: 1400,
    sourceUrl,
    sourceName,
    sourceQuote: "HOG'S HEAD BREW / ホッグズ・ヘッド・ビール 850 / with souvenir マグカップ付 1,400"
  },
  {
    foodId: "food-manual-バタービールtm-マグカップ付き-ノンアルコール",
    name: "バタービール™ ～マグカップ付き～（ノンアルコール）",
    price: 1200,
    sourceUrl,
    sourceName,
    sourceQuote: "BUTTERBEER [NON-ALCOHOLIC] / バタービール™（ノンアルコール） with souvenir マグカップ付 1,200"
  },
  {
    foodId: "food-manual-バタービールtm-プレミアムマグカップ付き-ノンアルコール",
    name: "バタービール™ ～プレミアムマグカップ付き～（ノンアルコール）",
    price: 4600,
    sourceUrl,
    sourceName,
    sourceQuote: "BUTTERBEER [NON-ALCOHOLIC] / バタービール™（ノンアルコール） in Premium Stein プレミアムマグカップ付 4,600"
  }
];

const outputDir = path.join(process.cwd(), "scripts", "output");
const datasetPath = path.join(outputDir, "foods.generated.json");
const manualDecisionPath = path.join(outputDir, "manual-price-decisions.json");
const reportPath = path.join(outputDir, "three-broomsticks-official-prices.generated.json");
const applyChanges = process.argv.includes("--apply");

const dataset = readJson<GeneratedDataset>(datasetPath);
const manualDecisions = readJson<Record<string, Record<string, unknown>>>(manualDecisionPath, {});
const before = summarize(dataset.foods);
const beforeImages = imageSnapshot(dataset.foods);
const updates: Array<PriceConfirmation & { previousPrice?: number }> = [];
const skipped: Array<{ foodId: string; name: string; reason: string }> = [];

for (const confirmation of confirmations) {
  const food = dataset.foods.find((item) => item.id === confirmation.foodId);
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
  if (applyChanges) {
    applyPrice(food, confirmation);
    manualDecisions[confirmation.foodId] = {
      ...(manualDecisions[confirmation.foodId] ?? {}),
      status: "confirmed",
      price: confirmation.price,
      sourceUrl: confirmation.sourceUrl,
      sourceName: confirmation.sourceName,
      sourceType: "official",
      reason: confirmation.sourceQuote,
      reasonCode: "official_exact_price_found",
      updatedAt: new Date().toISOString()
    };
  }
}

const imageRegressions = compareImages(beforeImages, imageSnapshot(dataset.foods));
if (applyChanges && imageRegressions.length > 0) {
  throw new Error(`Image regression detected: ${imageRegressions.map((item) => item.foodId).join(", ")}`);
}

if (applyChanges && updates.length > 0) {
  dataset.generatedAt = new Date().toISOString();
  writeJson(datasetPath, dataset);
  writeJson(manualDecisionPath, manualDecisions);
}

const after = summarize(dataset.foods);
const report = {
  mode: applyChanges ? "apply" : "audit",
  generatedAt: new Date().toISOString(),
  sourceUrl,
  before,
  after,
  newPrices: updates.filter((update) => !update.previousPrice).length,
  imageRegressionCount: imageRegressions.length,
  imageRegressions,
  updates,
  skipped
};

writeJson(reportPath, report);
console.log(JSON.stringify(report, null, 2));

function applyPrice(food: GeneratedFood, confirmation: PriceConfirmation) {
  const now = new Date().toISOString();
  const note = `${confirmation.sourceName}で確認: ${confirmation.sourceQuote}`;
  food.price = confirmation.price;
  food.priceMin = confirmation.price;
  food.price_min = confirmation.price;
  food.priceMax = undefined;
  food.price_max = undefined;
  food.priceNote = note;
  food.price_note = note;
  food.priceSource = "official";
  food.price_source = "official";
  food.priceSourceUrl = confirmation.sourceUrl;
  food.price_source_url = confirmation.sourceUrl;
  food.priceLastCheckedAt = now;
  food.price_last_checked_at = now;
  food.priceConfidenceScore = 98;
  food.price_confidence_score = 98;
  food.lastCheckedAt = now;
  food.last_checked_at = now;
  for (const location of food.locations ?? []) {
    location.price = confirmation.price;
    location.lastCheckedAt = now;
  }
}

function summarize(foods: GeneratedFood[]) {
  const visible = foods.filter((food) => food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden);
  const priceKnown = visible.filter(hasKnownPrice).length;
  const imageTotal = visible.filter((food) => Boolean(food.imageUrl ?? food.representativeImageUrl ?? food.images?.find((image) => image.enabled))).length;
  const placeholderCount = visible.filter((food) => (food.imageUrl ?? food.representativeImageUrl ?? "").startsWith("/placeholders/")).length;
  return {
    foodTotal: visible.length,
    imageTotal,
    placeholderCount,
    priceKnown,
    priceUnknown: visible.length - priceKnown,
    priceRate: `${((priceKnown / visible.length) * 100).toFixed(1)}%`
  };
}

function hasKnownPrice(food: GeneratedFood) {
  return Boolean(food.price ?? food.priceMin ?? food.price_min ?? food.locations?.find((location) => location.price)?.price);
}

function imageSnapshot(foods: GeneratedFood[]) {
  return new Map(
    foods.map((food) => [
      food.id,
      JSON.stringify({
        imageUrl: food.imageUrl,
        representativeImageUrl: food.representativeImageUrl,
        images: food.images?.map((image) => ({
          imageUrl: image.imageUrl,
          enabled: image.enabled,
          imageVerified: image.imageVerified,
          imageApproved: image.imageApproved,
          manuallyAdded: image.manuallyAdded
        }))
      })
    ])
  );
}

function compareImages(before: Map<string, string>, after: Map<string, string>) {
  return Array.from(before.entries())
    .filter(([foodId, value]) => after.get(foodId) !== value)
    .map(([foodId]) => ({ foodId }));
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
