import { AreaOverview } from "@/components/area-overview";
import { listFoods } from "@/lib/repositories/foods";

export default async function AreasPage() {
  const foodsWithRelations = await listFoods();
  const areas = Array.from(new Map(foodsWithRelations.map((food) => [food.area.id, food.area])).values()).sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-black text-berry">エリア別フード図鑑</p>
        <h1 className="mt-1 text-3xl font-black text-ink">どのエリアで何を食べるか決める</h1>
        <p className="mt-2 text-sm font-bold text-slate-500">エリアごとのフード数、販売場所、未食をまとめて確認できます。</p>
      </div>
      <AreaOverview areas={areas} foods={foodsWithRelations} />
    </div>
  );
}
