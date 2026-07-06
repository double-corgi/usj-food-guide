import Link from "next/link";
import { AdminFoodForm, type DuplicateCandidate } from "@/components/admin/food-form";
import { createAdminFood } from "@/app/admin/foods/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { buildAdminShopOptions } from "@/lib/admin-shop-options";
import { listFoodCollections } from "@/lib/repositories/collections";
import { listAllFoodCandidates } from "@/lib/repositories/foods";
import type { FoodWithRelations } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function AdminNewFoodPage() {
  const [admin, foods, collections] = await Promise.all([requireAdmin("editor"), listAllFoodCandidates(), listFoodCollections()]);
  const { shops } = getFormOptions(foods);
  const duplicateCandidates = getDuplicateCandidates(foods);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="overflow-hidden rounded-2xl border border-park/15 bg-white shadow-soft">
        <div className="grid gap-4 border-b border-slate-100 bg-mint/55 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-park">商品管理</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-ink sm:text-4xl">新しいフードを登録</h1>
            <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-slate-600">
              写真と基本情報を入れるだけで、公開ページに追加できます。迷ったら必須項目から順番に入力してください。
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/80 p-3 text-sm font-black text-park shadow-sm">
            {admin.role} 権限で保存できます
          </div>
        </div>
        <div className="flex flex-wrap gap-2 p-4 sm:p-5">
          <Link href="/admin" className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink shadow-sm hover:border-park">
            管理トップ
          </Link>
          <Link href="/admin/foods" className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink shadow-sm hover:border-park">
            一覧へ戻る
          </Link>
        </div>
      </div>
      <AdminFoodForm mode="new" shopOptions={shops} action={createAdminFood} duplicateCandidates={duplicateCandidates} collections={collections} />
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
