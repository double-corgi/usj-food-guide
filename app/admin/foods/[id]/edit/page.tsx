import Link from "next/link";
import { notFound } from "next/navigation";
import { setManualFoodVisibility, updateGeneratedFoodOverride, updateManualFood } from "@/app/admin/foods/actions";
import { AdminFoodForm } from "@/components/admin/food-form";
import { requireAdmin } from "@/lib/admin-auth";
import { buildAdminShopOptions } from "@/lib/admin-shop-options";
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
  const adminFields = await getAdminFoodFields(food);
  const isManual = adminFields.isManualFood;
  const sourceKind = isManual ? "manual" : "generated";
  const sourceLabel = isManual ? "自分で追加した商品" : "自動取得の商品";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-park">商品管理</p>
          <h1 className="mt-1 text-3xl font-black text-ink">商品編集</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">
            {admin.role} 権限で閲覧できます。
            {isManual ? "自分で追加した商品を保存できます。画像未選択時は既存画像を維持します。" : "自動取得の商品は、元データを変えずに基本情報と画像だけ上書き保存できます。"}
          </p>
          <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${isManual ? "bg-mint text-park" : "bg-slate-100 text-slate-600"}`}>
            {sourceLabel}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink hover:border-park">
            管理トップ
          </Link>
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
        action={isManual ? updateManualFood : updateGeneratedFoodOverride}
        visibilityAction={isManual ? setManualFoodVisibility : undefined}
        sourceKind={sourceKind}
        adminNotes={adminFields.adminNotes}
        categoryTags={adminFields.categoryTags}
        nameEn={adminFields.nameEn}
      />
    </div>
  );
}

function getFormOptions(foods: FoodWithRelations[]) {
  return {
    shops: buildAdminShopOptions(foods)
  };
}

async function getAdminFoodFields(food: FoodWithRelations) {
  const manualSource = food.manualOverride === true || food.sourceNames?.includes("manual_foods") === true || food.id.startsWith("food-manual-");
  const supabase = createServiceSupabaseClient();
  if (!supabase) return { isManualFood: manualSource, hasOverride: false, adminNotes: null, categoryTags: null, nameEn: null };

  const { data, error } = await supabase.from("manual_foods").select("id, admin_notes, category_tags, name_en").eq("id", food.id).maybeSingle();
  if (error) {
    console.error("Failed to confirm manual food edit status", {
      foodId: food.id,
      sourceNames: food.sourceNames,
      manualOverride: food.manualOverride,
      message: error.message
    });
  }
  if (data?.id) {
    return {
      isManualFood: true,
      hasOverride: false,
      adminNotes: data.admin_notes ?? null,
      categoryTags: data.category_tags ?? null,
      nameEn: data.name_en ?? null
    };
  }

  const override = await supabase.from("food_overrides").select("food_id, admin_notes, category_tags, name_en").eq("food_id", food.id).maybeSingle();
  if (override.error) {
    console.error("Failed to load food override admin fields", {
      foodId: food.id,
      message: override.error.message
    });
  }

  return {
    isManualFood: manualSource,
    hasOverride: Boolean(override.data?.food_id),
    adminNotes: override.data?.admin_notes ?? null,
    categoryTags: override.data?.category_tags ?? null,
    nameEn: override.data?.name_en ?? null
  };
}
