import { StoresOverview } from "@/components/stores-overview";
import { buildStoresFromFoods } from "@/lib/store-utils";
import { listFoods } from "@/lib/repositories/foods";

export default async function StoresPage() {
  const foods = await listFoods();
  const stores = buildStoresFromFoods(foods);
  return <StoresOverview stores={stores} />;
}
