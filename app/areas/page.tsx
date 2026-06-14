import { AreaOverview } from "@/components/area-overview";
import { listFoods } from "@/lib/repositories/foods";

export default async function AreasPage() {
  const foodsWithRelations = await listFoods();
  const areas = Array.from(new Map(foodsWithRelations.map((food) => [food.area.id, food.area])).values()).sort((a, b) => a.sortOrder - b.sortOrder);
  return <AreaOverview areas={areas} foods={foodsWithRelations} />;
}
