import Link from "next/link";
import { notFound } from "next/navigation";
import { updateManualFood } from "@/app/admin/foods/actions";
import { AdminFoodForm } from "@/components/admin/food-form";
import { requireAdmin } from "@/lib/admin-auth";
import { listAllFoodCandidates } from "@/lib/repositories/foods";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import type { FoodWithRelations } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function AdminEditFoodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [admin, foods] = await Promise.all([requireAdmin("editor"), listAllFoodCandidates()]);
  const food = foods.find((candidate) => candidate.id === id);
  if (!food) notFound();

  const { shops } = getFormOptions(foods);
  const adminFields = await getAdminFoodFields(food.id);
  const canSave = adminFields.isManualFood;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-park">Manual food edit</p>
          <h1 className="mt-1 text-3xl font-black text-ink">商品編集</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">
            {admin.role} 権限で閲覧できます。
            {canSave ? "manual_foodsの商品だけ保存できます。画像未選択時は既存画像を維持します。" : "generated商品の編集保存はまだ実装していません。"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/foods/${food.id}`} className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink hover:border-park">
            詳細へ戻る
          </Link>
          <Link href="/admin/foods" className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink hover:border-park">
            一覧へ戻る
          </Link>
        </div>
      </div>
      <AdminFoodForm
        mode="edit"
        food={food}
        shopOptions={shops}
        action={canSave ? updateManualFood : undefined}
        adminNotes={adminFields.adminNotes}
        categoryTags={adminFields.categoryTags}
      />
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

async function getAdminFoodFields(foodId: string) {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return { isManualFood: false, adminNotes: null, categoryTags: null };

  const { data } = await supabase.from("manual_foods").select("id, admin_notes, category_tags").eq("id", foodId).maybeSingle();
  return {
    isManualFood: Boolean(data?.id),
    adminNotes: data?.admin_notes ?? null,
    categoryTags: data?.category_tags ?? null
  };
}
