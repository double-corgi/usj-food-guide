import Link from "next/link";
import { AdminFoodForm, type DuplicateCandidate } from "@/components/admin/food-form";
import { createAdminFood } from "@/app/admin/foods/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { buildAdminShopOptions } from "@/lib/admin-shop-options";
import { listAllFoodCandidates } from "@/lib/repositories/foods";
import type { FoodWithRelations } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function AdminNewFoodPage() {
  const [admin, foods] = await Promise.all([requireAdmin("editor"), listAllFoodCandidates()]);
  const { shops } = getFormOptions(foods);
  const duplicateCandidates = getDuplicateCandidates(foods);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-park">商品管理</p>
          <h1 className="mt-1 text-3xl font-black text-ink">商品追加</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">
            {admin.role} 権限で新規商品を保存できます。画像は自動でサイズ調整され、保存すると公開ページに反映されます。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink hover:border-park">
            管理トップ
          </Link>
          <Link href="/admin/foods" className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink hover:border-park">
            一覧へ戻る
          </Link>
        </div>
      </div>
      <AdminFoodForm mode="new" shopOptions={shops} action={createAdminFood} duplicateCandidates={duplicateCandidates} />
    </div>
  );
}

function getDuplicateCandidates(foods: FoodWithRelations[]): DuplicateCandidate[] {
  return foods.map((food) => ({
    id: food.id,
    name: food.name,
    areaName: food.area.name,
    shopName: food.shop.name,
    source: food.manualOverride || food.sourceNames?.includes("manual_foods") ? "manual_foods" : "generated"
  }));
}

function getFormOptions(foods: FoodWithRelations[]) {
  return {
    shops: buildAdminShopOptions(foods)
  };
}
