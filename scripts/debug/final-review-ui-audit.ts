import fs from "node:fs";
import path from "node:path";

type FoodImage = {
  enabled?: boolean;
  imageMismatchReason?: string;
  hasWatermark?: boolean;
};

type Food = {
  reviewStatus?: string;
  hidden?: boolean;
  images?: FoodImage[];
  price?: number;
  priceMin?: number;
  priceSource?: string;
  priceSourceUrl?: string;
  saleStatus?: string;
  status?: string;
  saleStartDate?: string | null;
  saleEndDate?: string | null;
  startDate?: string;
  endDate?: string;
};

const filePath = path.join(process.cwd(), "scripts", "output", "foods.generated.json");
const dataset = JSON.parse(fs.readFileSync(filePath, "utf8")) as { foods?: Food[] };
const foods = (dataset.foods ?? []).filter((food) => food.reviewStatus === "approved" && !food.hidden);

const imageCount = foods.filter((food) => (food.images ?? []).some((image) => image.enabled && !image.imageMismatchReason && !image.hasWatermark)).length;
const placeholderCount = foods.length - imageCount;
const priceConfirmed = foods.filter((food) => getPriceSource(food) !== "unknown").length;
const salePeriodKnown = foods.filter((food) => getSaleStatus(food) !== "unknown").length;
const activeCount = foods.filter((food) => getSaleStatus(food) === "active").length;

console.log(
  JSON.stringify(
    {
      totalFoods: foods.length,
      imageCount,
      placeholderCount,
      reviewCount: 0,
      priceConfirmed,
      priceUnknown: foods.length - priceConfirmed,
      priceRate: `${Math.round((priceConfirmed / Math.max(foods.length, 1)) * 1000) / 10}%`,
      salePeriodKnown,
      salePeriodRate: `${Math.round((salePeriodKnown / Math.max(foods.length, 1)) * 1000) / 10}%`,
      activeCount,
      archiveCount: foods.length
    },
    null,
    2
  )
);

function getPriceSource(food: Food) {
  if (!food.price && !food.priceMin) return "unknown";
  if (food.priceSource) return food.priceSource;
  const sourceUrl = food.priceSourceUrl ?? "";
  if (/usj\.co\.jp/i.test(sourceUrl)) return "official";
  if (/x\.com|twitter\.com|instagram\.com|threads\.net/i.test(sourceUrl)) return "social_report";
  return "trusted_report";
}

function getSaleStatus(food: Food) {
  if (food.saleStatus) return food.saleStatus;
  const startDate = food.saleStartDate ?? food.startDate;
  const endDate = food.saleEndDate ?? food.endDate;
  const todayKey = new Date().toISOString().slice(0, 10);
  if (startDate && startDate > todayKey) return "upcoming";
  if (endDate && todayKey > endDate) return "ended";
  if (startDate || endDate || food.status === "active") return "active";
  if (food.status === "ended" || food.status === "inactive") return "ended";
  return "unknown";
}
