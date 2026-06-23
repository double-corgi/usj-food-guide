import Link from "next/link";
import { AdminFoodForm } from "@/components/admin/food-form";
import { createAdminFood } from "@/app/admin/foods/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { listAllFoodCandidates } from "@/lib/repositories/foods";
import type { FoodWithRelations } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function AdminNewFoodPage() {
  const [admin, foods] = await Promise.all([requireAdmin("editor"), listAllFoodCandidates()]);
  const { shops } = getFormOptions(foods);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-park">Phase 3B save UI</p>
          <h1 className="mt-1 text-3xl font-black text-ink">商品追加</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">
            {admin.role} 権限でSupabaseのmanual_foodsへ新規商品を保存できます。画像は自動リサイズしてStorageへ保存します。
          </p>
        </div>
        <Link href="/admin/foods" className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink hover:border-park">
          一覧へ戻る
        </Link>
      </div>
      <AdminFoodForm mode="new" shopOptions={shops} action={createAdminFood} />
    </div>
  );
}

function getFormOptions(foods: FoodWithRelations[]) {
  return {
    shops: uniqueSorted(foods.map((food) => food.shop.name))
  };
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "ja"));
}
