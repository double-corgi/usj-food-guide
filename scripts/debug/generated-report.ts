import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset } from "../types/generated";
import { getFoodImage } from "../../lib/utils/image";

const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "output", "foods.generated.json"), "utf8")) as GeneratedDataset;
const report = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "output", "latest-crawl-report.json"), "utf8")) as {
  pagesCrawled: number;
  foodsFound: number;
  addedCount: number;
  updatedCount: number;
  inactiveCount: number;
  errors: string[];
  requiredSourceCoverage?: Array<{ url: string; fetched: boolean; sourceNames: string[]; extractedFoods: number }>;
  sources: Array<{ sourceName: string; pagesCrawled: number; foods: unknown[]; errors: string[] }>;
};

const visible = dataset.foods.filter(
  (food) =>
    food.reviewStatus === "approved" &&
    food.canonicalFood !== false &&
    !food.hidden &&
    food.displayQuality !== "low" &&
    food.nameQualityScore >= 60 &&
    food.confidenceScore >= 45 &&
    !food.compositeMenu &&
    Boolean(food.sourceUrl) &&
    (
      food.shop.name !== "店舗未確認" ||
      food.locations?.some((location) => location.shopName !== "店舗未確認") ||
      food.images.some((image) => image.enabled && image.sourceType === "official" && image.imageVerified && !image.isSharedTooMuch && !image.hasWatermark) ||
      /castel\.jp/i.test(food.sourceUrl)
    )
);
const byCategory = countBy(visible, (food) => food.category);
const byArea = countBy(visible, (food) => food.area.name);
const bySource = countBy(dataset.foods, (food) => food.sourceNames[0] ?? "unknown");
const placeholderCount = visible.filter((food) => getFoodImage(food).startsWith("/placeholders/")).length;
const officialImageCount = visible.filter((food) => food.images.some((image) => image.enabled && image.sourceType === "official" && image.imageVerified && !image.isSharedTooMuch && !image.hasWatermark)).length;
const imageMismatchExcluded = dataset.foods.filter((food) => food.images.some((image) => image.sourceType === "official" && !image.enabled && image.imageMismatchReason)).length;
const watermarkExcluded = dataset.foods.filter((food) => food.images.some((image) => image.hasWatermark || image.imageMismatchReason?.startsWith("watermark:") || image.imageMismatchReason === "supplemental-watermark-risk")).length;
const compositeCount = dataset.foods.filter((food) => food.compositeMenu || food.rejectionReasons.includes("composite-menu")).length;
const nameFiltered = dataset.foods.filter((food) => food.rejectionReasons.some((reason) => ["bad-food-name", "low-name-quality", "html-json-js-fragment", "navigation-or-system-text"].includes(reason))).length;
const statusBy = countBy(visible, (food) => food.status);
const diningBy = countBy(visible, (food) => food.diningType ?? "unknown");
const confidence = {
  "90-100": visible.filter((food) => food.confidenceScore >= 90).length,
  "70-89": visible.filter((food) => food.confidenceScore >= 70 && food.confidenceScore < 90).length,
  "65-69": visible.filter((food) => food.confidenceScore >= 65 && food.confidenceScore < 70).length
};
const locationCount = visible.reduce((sum, food) => sum + (food.locations?.length ?? 1), 0);
const duplicateMerged = dataset.foods.filter((food) => food.hidden && food.duplicateGroupId).length;
const renamedOrCleaned = dataset.foods.filter((food) => food.normalizedName !== food.name.replace(/\s+/g, "").toLowerCase()).length;

console.log(
  JSON.stringify(
    {
      localhostVisibleFoods: visible.length,
      crawlerTotalCandidates: report.foodsFound,
      beforeMergeCandidates: dataset.summary.generatedFoods,
      afterMergeFoods: visible.length,
      foodLocations: locationCount,
      averageLocationsPerFood: Number((locationCount / Math.max(visible.length, 1)).toFixed(2)),
      generatedFoods: dataset.summary.generatedFoods,
      approved: dataset.summary.approved,
      pending: dataset.summary.pending,
      rejected: dataset.summary.rejected,
      hidden: dataset.summary.hidden,
      duplicateHidden: dataset.summary.duplicateHidden,
      canonicalFoods: dataset.foods.filter((food) => food.canonicalFood).length,
      officialImageCount,
      verifiedOfficialImages: dataset.summary.verifiedOfficialImages,
      placeholderCount,
      noRepresentativeImage: visible.filter((food) => !food.imageUrl && !food.representativeImageUrl && !food.images.some((image) => image.enabled)).length,
      imageMismatchExcluded,
      watermarkExcluded,
      image403Or404: "not-network-validated",
      nameFiltered,
      renamedOrCleaned,
      compositeCandidates: compositeCount,
      imageAttachedRate: `${Math.round((visible.filter((food) => food.images.length > 0).length / Math.max(visible.length, 1)) * 100)}%`,
      confidence,
      byCategory,
      byArea,
      bySource,
      requiredSourceCoverage: report.requiredSourceCoverage ?? [],
      castelCandidates: dataset.foods.filter((food) => /castel\.jp/i.test(`${food.sourceUrl} ${food.sourceNames.join(" ")}`)).length,
      officialConfirmed: visible.filter((food) => /(?:^|\/\/)(?:www\.)?usj\.co\.jp|usjfoodallergy/i.test(`${food.sourceUrl} ${food.sourceNames.join(" ")}`)).length,
      statusBy,
      priceKnown: visible.filter((food) => food.price || food.priceMin || food.locations?.some((location) => location.price)).length,
      priceUnknown: visible.filter((food) => !(food.price || food.priceMin || food.locations?.some((location) => location.price))).length,
      diningBy,
      takeoutOrCart: visible.filter((food) => food.diningType === "takeout" || food.diningType === "food_cart").length,
      eatIn: visible.filter((food) => food.diningType === "eat_in" || food.diningType === "both").length,
      foodCart: visible.filter((food) => food.diningType === "food_cart").length,
      finalUpdatedAt: dataset.generatedAt,
      pagesCrawled: report.pagesCrawled,
      sourcePages: report.sources.map((source) => ({
        sourceName: source.sourceName,
        pagesCrawled: source.pagesCrawled,
        foods: source.foods.length,
        errors: source.errors.length
      })),
      supabaseSaved: report.addedCount + report.updatedCount,
      generatedJsonSaved: dataset.foods.length,
      errors: report.errors.length
    },
    null,
    2
  )
);

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
