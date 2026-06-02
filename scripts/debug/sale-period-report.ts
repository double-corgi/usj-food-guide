import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";
import type { SaleStatus } from "../../types/domain";

const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "output", "foods.generated.json"), "utf8")) as GeneratedDataset;
const outputPath = path.join(process.cwd(), "scripts", "output", "sale-period-report.generated.json");
const visibleFoods = dataset.foods.filter(
  (food) =>
    food.reviewStatus === "approved" &&
    food.canonicalFood !== false &&
    !food.hidden &&
    food.displayQuality !== "low" &&
    food.status !== "inactive" &&
    food.nameQualityScore >= 60 &&
    food.confidenceScore >= 45 &&
    !food.compositeMenu &&
    Boolean(food.sourceUrl)
);

const counts: Record<SaleStatus, number> = {
  active: 0,
  ended: 0,
  upcoming: 0,
  unknown: 0
};

for (const food of visibleFoods) counts[getSaleStatus(food)] += 1;

const withPeriodInput = visibleFoods.filter((food) => getSaleStatus(food) !== "unknown").length;
const unknownFoods = visibleFoods.filter((food) => getSaleStatus(food) === "unknown");
const activeStartMissing = visibleFoods.filter((food) => getSaleStatus(food) === "active" && !(food.saleStartDate ?? food.sale_start_date ?? food.startDate ?? food.start_date));
const endedEndMissing = visibleFoods.filter((food) => getSaleStatus(food) === "ended" && !(food.saleEndDate ?? food.sale_end_date ?? food.endDate ?? food.end_date));
const completableMismatch = visibleFoods.filter((food) => Boolean(food.isCompletable ?? food.is_completable) !== (getSaleStatus(food) === "active"));

const report = {
  generatedAt: new Date().toISOString(),
  totalFoods: visibleFoods.length,
  activeFoods: counts.active,
  endedFoods: counts.ended,
  upcomingFoods: counts.upcoming,
  unknownFoods: counts.unknown,
  completableFoods: counts.active,
  salePeriodInputRate: percent(withPeriodInput, visibleFoods.length),
  activeStartMissing: activeStartMissing.map(toReviewRow),
  endedEndMissing: endedEndMissing.map(toReviewRow),
  completableMismatch: completableMismatch.map(toReviewRow),
  unknownFoodsForReview: unknownFoods.map(toReviewRow),
  unknownFoodNames: unknownFoods.map((food) => food.name)
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

function getSaleStatus(food: GeneratedFood): SaleStatus {
  if (food.saleStatus) return food.saleStatus;
  if (food.sale_status) return food.sale_status;
  if (food.status === "scheduled") return "upcoming";
  if (food.status === "ended" || food.status === "inactive") return "ended";
  if (food.status === "active") return "active";
  return "unknown";
}

function toReviewRow(food: GeneratedFood) {
  return {
    id: food.id,
    name: food.name,
    category: food.category,
    areaName: food.area?.name,
    shopName: food.shop?.name,
    saleStatus: getSaleStatus(food),
    saleStartDate: food.saleStartDate ?? food.sale_start_date ?? food.startDate ?? food.start_date ?? null,
    saleEndDate: food.saleEndDate ?? food.sale_end_date ?? food.endDate ?? food.end_date ?? null,
    sourceUrl: food.sourceUrl ?? food.source_url
  };
}

function percent(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 1000) / 10}%`;
}
