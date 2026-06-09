import { AdminCatalogManager } from "@/components/admin-catalog-manager";
import { listAllFoodCandidates, listFoods } from "@/lib/repositories/foods";
import { readGeneratedAreas } from "@/lib/repositories/generated-data";
import { buildStoresFromFoods } from "@/lib/store-utils";

export const dynamic = "force-dynamic";

export default async function AdminCatalogPage() {
  const [candidates, publicFoods] = await Promise.all([listAllFoodCandidates(), listFoods()]);
  const areas = readGeneratedAreas();
  const stores = buildStoresFromFoods(publicFoods);

  return (
    <AdminCatalogManager
      foods={candidates.map((food) => ({
        id: food.id,
        name: food.name,
        imageUrl: food.images[0]?.imageUrl ?? food.imageUrl ?? "",
        price: food.price ?? food.priceMin ?? food.priceMax ?? null,
        shopName: food.shop.name,
        areaName: food.area.name,
        category: food.category,
        isLimited: food.isLimited,
        isAnniversary25: isAnniversary25Food(food),
        saleStatus: food.saleStatus ?? "unknown",
        hidden: food.hidden,
        description: food.description ?? "",
        officialUrl: food.officialUrl ?? food.sourceUrl ?? ""
      }))}
      stores={stores.map((store) => ({
        id: store.id,
        name: store.name,
        areaName: store.areaName,
        type: store.type,
        imageUrl: store.imageUrl ?? "",
        description: store.description,
        officialUrl: store.officialUrl ?? "",
        hidden: false
      }))}
      areas={areas.map((area) => ({
        id: area.id,
        name: area.name,
        sortOrder: area.sortOrder
      }))}
    />
  );
}

function isAnniversary25Food(food: { name: string; description?: string | null; officialUrl?: string | null; sourceUrl?: string | null; eventName?: string; collaborationName?: string }) {
  const evidence = [food.name, food.description, food.officialUrl, food.sourceUrl, food.eventName, food.collaborationName].filter(Boolean).join(" ");
  return /25th|25周年|25th-anniversary/i.test(evidence);
}
