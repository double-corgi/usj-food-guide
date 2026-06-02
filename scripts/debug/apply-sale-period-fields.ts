import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";
import type { SaleStatus } from "../../types/domain";

const filePath = path.join(process.cwd(), "scripts", "output", "foods.generated.json");
const dataset = JSON.parse(fs.readFileSync(filePath, "utf8")) as GeneratedDataset;

let updated = 0;
const counts: Record<SaleStatus, number> = {
  active: 0,
  ended: 0,
  upcoming: 0,
  unknown: 0
};

dataset.foods = dataset.foods.map((food) => {
  const saleStartDate = food.saleStartDate ?? food.sale_start_date ?? food.startDate ?? food.start_date ?? null;
  const saleEndDate = food.saleEndDate ?? food.sale_end_date ?? food.endDate ?? food.end_date ?? null;
  const saleStatus = food.saleStatus ?? food.sale_status ?? deriveSaleStatus(food, saleStartDate, saleEndDate);
  const salePeriodLabel = food.salePeriodLabel ?? food.sale_period_label ?? buildSalePeriodLabel(saleStatus, saleStartDate, saleEndDate);
  const isCompletable = saleStatus === "active";
  counts[saleStatus] += 1;

  if (
    food.saleStatus !== saleStatus ||
    food.saleStartDate !== saleStartDate ||
    food.saleEndDate !== saleEndDate ||
    food.salePeriodLabel !== salePeriodLabel ||
    food.isCompletable !== isCompletable
  ) {
    updated += 1;
  }

  return {
    ...food,
    saleStatus,
    sale_status: saleStatus,
    saleStartDate,
    sale_start_date: saleStartDate,
    saleEndDate,
    sale_end_date: saleEndDate,
    salePeriodLabel,
    sale_period_label: salePeriodLabel,
    isCompletable,
    is_completable: isCompletable
  };
});

dataset.generatedAt = new Date().toISOString();
fs.writeFileSync(filePath, `${JSON.stringify(dataset, null, 2)}\n`);

console.log(JSON.stringify({ updated, counts }, null, 2));

function deriveSaleStatus(food: GeneratedFood, startDate?: string | null, endDate?: string | null): SaleStatus {
  const todayKey = new Date().toISOString().slice(0, 10);
  if (startDate && startDate > todayKey) return "upcoming";
  if (endDate && todayKey > endDate) return "ended";
  if (food.status === "scheduled") return "upcoming";
  if (food.status === "ended" || food.status === "inactive") return "ended";
  if (food.status === "active") return "active";
  return "unknown";
}

function buildSalePeriodLabel(status: SaleStatus, startDate?: string | null, endDate?: string | null) {
  if (status === "active") {
    if (startDate && endDate) return `${formatDateJa(startDate)}〜${formatDateJa(endDate)}`;
    if (startDate) return `${formatDateJa(startDate)}〜販売終了日未定`;
    return "販売中";
  }
  if (status === "ended") {
    if (startDate && endDate) return `${formatDateJa(startDate)}〜${formatDateJa(endDate)}`;
    return "販売終了";
  }
  if (status === "upcoming") return startDate ? `${formatDateJa(startDate)}開始予定` : "近日販売";
  return "販売期間確認中";
}

function formatDateJa(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).format(date);
}
