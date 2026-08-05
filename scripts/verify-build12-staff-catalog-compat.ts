import { buildPublicCatalog } from "@/lib/repositories/public-catalog";

const ARCHIVE_STAFF_CHUNK = "/private/tmp/unicolle-build12-staff-ui.xcarchive/Products/Applications/App.app/public/_next/static/chunks/7409-9fd88cf98e137dcd.js";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function simulateBuild12Dashboard(response: Awaited<ReturnType<typeof buildPublicCatalog>>) {
  const dashboard = response.dashboard;
  const foods = response.foods.map((food) => ({
    publicState: "published",
    hidden: false,
    deletedAt: null,
    saleStatus: food.saleStatus
  }));
  const areas = response.areas.map((area) => ({ deletedAt: null, id: area.id }));
  const shops = response.shops.map((shop) => ({ deletedAt: null, id: shop.id }));
  return {
    onSaleFoodCount: dashboard?.onSaleFoodCount ?? foods.filter((food) => food.publicState === "published" && !food.hidden && !food.deletedAt && food.saleStatus === "active").length,
    unpublishedFoodCount: dashboard?.unpublishedFoodCount ?? foods.filter((food) => (food.publicState !== "published" || food.hidden) && !food.deletedAt).length,
    areaCount: dashboard?.areaCount ?? areas.filter((area) => !area.deletedAt).length,
    shopCount: dashboard?.shopCount ?? shops.filter((shop) => !shop.deletedAt).length,
    activeSeasonalCollectionCount: dashboard?.activeSeasonalCollectionCount ?? 0
  };
}

async function main() {
  const fs = await import("node:fs");
  const archiveChunk = fs.readFileSync(ARCHIVE_STAFF_CHUNK, "utf8");
  for (const key of ["eV?.onSaleFoodCount", "eV?.unpublishedFoodCount", "eV?.areaCount", "eV?.shopCount", "eV?.activeSeasonalCollectionCount"]) {
    assert(archiveChunk.includes(key), "Build 12 staff chunk does not read " + key);
  }

  const catalog = await buildPublicCatalog();
  const simulated = simulateBuild12Dashboard(catalog);
  const expected = {
    onSaleFoodCount: catalog.dashboard.onSaleFoodCount,
    unpublishedFoodCount: catalog.dashboard.unpublishedFoodCount,
    areaCount: catalog.dashboard.areaCount,
    shopCount: catalog.dashboard.shopCount,
    activeSeasonalCollectionCount: catalog.dashboard.activeSeasonalCollectionCount
  };

  console.log(JSON.stringify({ expected, simulated, archiveParserKeysPresent: true }, null, 2));
  assert(JSON.stringify(expected) === JSON.stringify(simulated), "Build 12 dashboard compatibility mismatch");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
