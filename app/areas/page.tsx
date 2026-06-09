import { AreaOverview } from "@/components/area-overview";
import { listFoods } from "@/lib/repositories/foods";

export default async function AreasPage() {
  const foodsWithRelations = await listFoods();
  const areas = Array.from(new Map(foodsWithRelations.map((food) => [food.area.id, food.area])).values()).sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-black tracking-[0.16em] text-park/70">エリア別フード図鑑</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink md:text-4xl">エリアから探す</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">未食フードをエリアごとに確認できます。</p>
      </div>
      <AreaOverview areas={areas} foods={foodsWithRelations} />
    </div>
  );
}
