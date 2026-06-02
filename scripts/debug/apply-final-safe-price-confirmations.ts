import fs from "node:fs";
import path from "node:path";

const DATA_PATH = path.join(process.cwd(), "scripts/output/foods.generated.json");
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

const confirmations = [
  {
    id: "food-fhqonz",
    price: 1600,
    sourceUrl: "https://castel.jp/p/3049",
    sourceName: "Castel ザ・ドラゴンズ・パール メニュー",
    note: "Castelでザ・ドラゴンズ・パール・コンボA/Bが各1,600円と明記。商品名・店舗・コンボ価格が一致するため高信頼補完として採用。",
    checkedAt: "2026-06-01T03:55:00.000Z"
  }
];

const byId = new Map(confirmations.map((item) => [item.id, item]));
let updated = 0;

for (const food of data.foods ?? []) {
  const confirmation = byId.get(food.id);
  if (!confirmation) continue;

  food.price = confirmation.price;
  food.priceMin = confirmation.price;
  food.priceMax = confirmation.price;
  food.price_min = confirmation.price;
  food.price_max = confirmation.price;
  food.priceNote = confirmation.note;
  food.price_note = confirmation.note;
  food.priceSource = "trusted_report";
  food.price_source = "trusted_report";
  food.priceSourceUrl = confirmation.sourceUrl;
  food.price_source_url = confirmation.sourceUrl;
  food.priceSourceName = confirmation.sourceName;
  food.price_source_name = confirmation.sourceName;
  food.priceLastCheckedAt = confirmation.checkedAt;
  food.price_last_checked_at = confirmation.checkedAt;
  food.priceConfidenceScore = 82;
  food.price_confidence_score = 82;
  food.priceReviewStatus = "confirmed";
  food.price_review_status = "confirmed";
  food.priceReviewReason = "trusted_report_exact_name_match";
  food.price_review_reason = "trusted_report_exact_name_match";
  food.manualPriceStatus = undefined;
  food.manual_price_status = undefined;
  food.manualPriceReason = undefined;
  food.manual_price_reason = undefined;

  for (const location of food.locations ?? []) {
    if (location.shopName === "ザ・ドラゴンズ・パール") {
      location.price = confirmation.price;
      location.sourceUrl = location.sourceUrl || confirmation.sourceUrl;
      location.lastCheckedAt = confirmation.checkedAt;
    }
  }

  updated += 1;
}

fs.writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ updated, ids: confirmations.map((item) => item.id) }, null, 2));
