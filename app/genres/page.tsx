import Link from "next/link";
import { Tags } from "lucide-react";
import { categoryLabels } from "@/lib/constants";
import { listFoods } from "@/lib/repositories/foods";
import type { FoodCategory } from "@/types/domain";

export default async function GenresPage() {
  const foodsWithRelations = await listFoods();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black text-ink">ジャンル別ページ</h1>
        <p className="mt-2 text-sm font-bold text-slate-500">チュリトス、ポップコーン、ドリンクなどで探せます。</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(categoryLabels).map(([category, label]) => {
          const count = foodsWithRelations.filter((food) => food.category === (category as FoodCategory)).length;
          return (
            <Link key={category} href={`/foods?category=${category}`} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft hover:border-park">
              <Tags className="text-berry" size={22} aria-hidden />
              <h2 className="mt-3 text-xl font-black text-ink">{label}</h2>
              <p className="mt-2 text-sm font-bold text-slate-500">{count}件</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
