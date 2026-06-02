import Link from "next/link";
import { Store } from "lucide-react";
import { shopTypeLabels } from "@/lib/constants";
import { listFoods } from "@/lib/repositories/foods";

export default async function ShopsPage() {
  const foodsWithRelations = await listFoods();
  const shops = Array.from(new Map(foodsWithRelations.map((food) => [food.shop.id, food.shop])).values());
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black text-ink">店舗別ページ</h1>
        <p className="mt-2 text-sm font-bold text-slate-500">店舗名、エリア、店舗種別とメニュー数を表示します。</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {shops.map((shop) => {
          const area = foodsWithRelations.find((food) => food.shop.id === shop.id)?.area;
          const menuCount = foodsWithRelations.filter((food) => food.shopId === shop.id).length;
          return (
            <Link key={shop.id} href={`/foods?shop=${shop.id}`} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft hover:border-park">
              <div className="flex items-center gap-2">
                <Store className="text-park" size={20} aria-hidden />
                <h2 className="text-xl font-black text-ink">{shop.name}</h2>
              </div>
              <p className="mt-2 text-sm font-bold text-slate-500">{area?.name} / {shopTypeLabels[shop.type]}</p>
              <p className="mt-3 text-sm font-black text-berry">{menuCount}メニュー</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
