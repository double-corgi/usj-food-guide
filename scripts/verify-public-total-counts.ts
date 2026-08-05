import { listAreas } from "@/lib/repositories/areas";
import { listFoods } from "@/lib/repositories/foods";
import { buildStoresFromFoods } from "@/lib/store-utils";
import { existsSync, readFileSync } from "node:fs";

const iosCatalogPath = "ios/App/App/public/api/native/catalog";
if (existsSync(iosCatalogPath)) {
  process.env.CAPACITOR_STATIC_EXPORT = process.env.CAPACITOR_STATIC_EXPORT ?? "1";
  process.env.UNICOLLE_STATIC_NATIVE_CATALOG_PATH = process.env.UNICOLLE_STATIC_NATIVE_CATALOG_PATH ?? iosCatalogPath;
}

async function main() {
  const [areas, foods] = await Promise.all([listAreas(), listFoods()]);
  const stores = buildStoresFromFoods(foods);
  const areaComponent = readFileSync("components/area-overview.tsx", "utf8");
  const storeComponent = readFileSync("components/stores-overview.tsx", "utf8");
  const dictionaries = readFileSync("lib/i18n/dictionaries.ts", "utf8");
  const uniqueStoreIds = new Set(stores.map((store) => store.id));
  const result = {
    areaCount: areas.length,
    storeCount: uniqueStoreIds.size,
    areaDisplayUsesCanonicalAreas: areaComponent.includes('areas.totalCount') && areaComponent.includes('areas.map((area)') && areaComponent.includes('visibleAreas.length'),
    storeDisplayUsesUniqueIds: storeComponent.includes('stores.totalCount') && storeComponent.includes('new Set(stores.map((store) => store.id)).size'),
    dictionaryKeys: (dictionaries.match(/areas\.totalCount/g) ?? []).length >= 4 && (dictionaries.match(/stores\.totalCount/g) ?? []).length >= 4
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.areaDisplayUsesCanonicalAreas || !result.storeDisplayUsesUniqueIds || !result.dictionaryKeys) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
