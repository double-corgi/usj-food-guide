import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset } from "../types/generated";

const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "output", "foods.generated.json"), "utf8")) as GeneratedDataset;
const visible = dataset.foods.filter(
  (food) =>
    food.reviewStatus === "approved" &&
    food.canonicalFood !== false &&
    !food.hidden &&
    food.displayQuality !== "low" &&
    food.status !== "ended" &&
    food.status !== "inactive" &&
    food.nameQualityScore >= 60 &&
    food.confidenceScore >= 45 &&
    !food.compositeMenu &&
    Boolean(food.sourceUrl)
);

const withPrice = visible.filter((food) => food.price || food.priceMin || food.locations?.some((location) => location.price));
const withPeriod = visible.filter((food) => food.startDate || food.endDate || food.isLimited || food.eventName || food.releasePeriod);
const withEndDate = visible.filter((food) => food.endDate);
const withLocations = visible.filter((food) => food.locations?.some((location) => location.shopName && location.shopName !== "店舗未確認"));
const withArea = visible.filter((food) => food.area?.name && food.area.name !== "エリア未確認");
const limited = visible.filter((food) => food.isLimited);

console.log(
  JSON.stringify(
    {
      visible: visible.length,
      withPrice: withPrice.length,
      priceMissing: visible.length - withPrice.length,
      withPeriod: withPeriod.length,
      withEndDate: withEndDate.length,
      withLocations: withLocations.length,
      withArea: withArea.length,
      limited: limited.length,
      locationsTotal: visible.reduce((sum, food) => sum + (food.locations?.length ?? 0), 0),
      averageLocations: Number((visible.reduce((sum, food) => sum + (food.locations?.length ?? 0), 0) / Math.max(visible.length, 1)).toFixed(2))
    },
    null,
    2
  )
);
