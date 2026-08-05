import { existsSync } from "node:fs";

import { getSaleStatus, getSaleType } from "@/lib/food-utils";
import { buildPublicCatalog } from "@/lib/repositories/public-catalog";
import { listAllFoodCandidates, listFoods } from "@/lib/repositories/foods";

const IOS_STATIC_CATALOG_PATH = "ios/App/App/public/api/native/catalog";
if (!process.env.UNICOLLE_STATIC_NATIVE_CATALOG_PATH && existsSync(IOS_STATIC_CATALOG_PATH)) {
  process.env.CAPACITOR_STATIC_EXPORT ??= "1";
  process.env.UNICOLLE_STATIC_NATIVE_CATALOG_PATH = IOS_STATIC_CATALOG_PATH;
}

function countBy<T>(items: T[], keyFn: (item: T) => string) {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = keyFn(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

async function main() {
  const [publicFoods, allCandidates, catalog] = await Promise.all([
    listFoods(),
    listAllFoodCandidates({ includeDeletedManualFoods: true }),
    buildPublicCatalog()
  ]);

  const publicIds = new Set(publicFoods.map((food) => food.id));
  const visibleCandidateIds = new Set(allCandidates.filter((food) => publicIds.has(food.id)).map((food) => food.id));
  const nonPublicCandidates = allCandidates.filter((food) => !visibleCandidateIds.has(food.id));

  const publicSaleStatusCounts = countBy(publicFoods, (food) => getSaleStatus(food));
  const publicSaleTypeCounts = countBy(publicFoods, (food) => getSaleType(food));
  const hiddenCandidateCount = nonPublicCandidates.filter((food) => food.hidden || food.status === "inactive" || food.deletedAt).length;

  const breakdown = {
    publicCatalogFoodCount: publicFoods.length,
    staffCatalogFoodCount: catalog.foods.length,
    allCandidateFoodCount: allCandidates.length,
    nonPublicCandidateCount: nonPublicCandidates.length,
    hiddenOrDeletedCandidateCount: hiddenCandidateCount,
    publicSaleStatusCounts,
    currentlyOnSaleFoodCount: publicSaleStatusCounts.active ?? 0,
    endedFoodCount: publicSaleStatusCounts.ended ?? 0,
    upcomingFoodCount: publicSaleStatusCounts.upcoming ?? 0,
    pausedFoodCount: publicSaleStatusCounts.paused ?? 0,
    unknownSaleStatusFoodCount: publicSaleStatusCounts.unknown ?? 0,
    publicSaleTypeCounts,
    limitedOrEventFoodCount: (publicSaleTypeCounts.limited ?? 0) + (publicSaleTypeCounts.event ?? 0),
    areaCount: catalog.areas.length,
    shopCount: catalog.shops.length,
    activeSeasonalCollectionCount: catalog.dashboard.activeSeasonalCollectionCount,
    duplicatePublicFoodIds: publicFoods.length - publicIds.size,
    catalogMatchesPublicFoods: publicFoods.length === catalog.foods.length
  };

  console.log(JSON.stringify(breakdown, null, 2));

  if (!breakdown.catalogMatchesPublicFoods || breakdown.duplicatePublicFoodIds !== 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
