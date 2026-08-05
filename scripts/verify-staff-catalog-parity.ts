import { existsSync } from "node:fs";

import { listAreas } from "@/lib/repositories/areas";
import { listFoods } from "@/lib/repositories/foods";
import { buildPublicCatalog } from "@/lib/repositories/public-catalog";

const IOS_STATIC_CATALOG_PATH = "ios/App/App/public/api/native/catalog";
if (!process.env.UNICOLLE_STATIC_NATIVE_CATALOG_PATH && existsSync(IOS_STATIC_CATALOG_PATH)) {
  process.env.CAPACITOR_STATIC_EXPORT ??= "1";
  process.env.UNICOLLE_STATIC_NATIVE_CATALOG_PATH = IOS_STATIC_CATALOG_PATH;
}

function countDuplicates(ids: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return duplicates.size;
}

async function main() {
  const [publicFoods, publicAreas, staffCatalog] = await Promise.all([listFoods(), listAreas(), buildPublicCatalog()]);
  const publicFoodIds = publicFoods.map((food) => food.id);
  const staffFoodIds = staffCatalog.foods.map((food) => food.id);
  const publicAreaIds = publicAreas.map((area) => area.id);
  const staffAreaIds = staffCatalog.areas.map((area) => area.id);
  const publicShopIds = new Set<string>();
  for (const food of publicFoods) {
    if (food.shop?.id) publicShopIds.add(food.shop.id);
    for (const location of food.locations ?? []) {
      if (location.shopId) publicShopIds.add(location.shopId);
      else publicShopIds.add([location.shopName, location.areaId ?? food.areaId ?? "area"].join("-"));
    }
  }
  const staffShopIds = staffCatalog.shops.map((shop) => shop.id);
  const missingFoodIds = publicFoodIds.filter((id) => !staffFoodIds.includes(id));
  const missingAreaIds = publicAreaIds.filter((id) => !staffAreaIds.includes(id));
  const missingShopIds = Array.from(publicShopIds).filter((id) => !staffShopIds.includes(id));
  const result = {
    publicCatalogCount: publicFoods.length,
    staffCatalogCount: staffCatalog.dashboard.publicFoodCount,
    duplicateProductIds: countDuplicates(staffFoodIds),
    publicDuplicateProductIds: countDuplicates(publicFoodIds),
    publicAreaCount: publicAreas.length,
    staffAreaCount: staffCatalog.dashboard.areaCount,
    publicShopCount: publicShopIds.size,
    staffShopCount: staffCatalog.dashboard.shopCount,
    activeSeasonalCollectionCount: staffCatalog.dashboard.activeSeasonalCollectionCount,
    missingFoodCount: missingFoodIds.length,
    missingAreaCount: missingAreaIds.length,
    missingShopCount: missingShopIds.length,
    parity: publicFoods.length === staffCatalog.dashboard.publicFoodCount && publicAreas.length === staffCatalog.dashboard.areaCount && publicShopIds.size === staffCatalog.dashboard.shopCount && countDuplicates(staffFoodIds) === 0 && missingFoodIds.length === 0 && missingAreaIds.length === 0 && missingShopIds.length === 0
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.parity) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
