import { AreaOverview } from "@/components/area-overview";
import { listAreas } from "@/lib/repositories/areas";
import { listFoods } from "@/lib/repositories/foods";

export default async function AreasPage() {
  const [foodsWithRelations, areas] = await Promise.all([listFoods(), listAreas()]);
  return <AreaOverview areas={areas} foods={foodsWithRelations} />;
}
