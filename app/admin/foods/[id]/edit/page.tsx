import Link from "next/link";
import { notFound } from "next/navigation";
import { setManualFoodDeleted, setManualFoodVisibility, updateGeneratedFoodOverride, updateManualFood } from "@/app/admin/foods/actions";
import { AdminFoodForm } from "@/components/admin/food-form";
import { ManualFoodDeleteButton } from "@/components/admin/manual-food-delete-button";
import { requireAdmin } from "@/lib/admin-auth";
import { buildAdminShopOptions } from "@/lib/admin-shop-options";
import { listFoodCollections } from "@/lib/repositories/collections";
import { listAllFoodCandidates } from "@/lib/repositories/foods";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import type { FoodWithRelations } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function AdminEditFoodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [admin, foods, collections] = await Promise.all([requireAdmin("editor"), listAllFoodCandidates(), listFoodCollections()]);
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
            {formatAdminRole(admin.role)} 権限で操作できます。
            {isManual ? "自分で追加した商品を保存できます。画像未選択時は既存画像を維持します。" : "自動取得の商品は、元データを変えずに基本情報と画像だけ修正できます。"}
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
        infoSourceUrl={adminFields.infoSourceUrl}
        collections={collections}
      />
      {isManual ? (
        <details className="group rounded-2xl border border-rose-100 bg-white p-4 shadow-soft sm:p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl outline-none transition focus-visible:ring-4 focus-visible:ring-rose-100 [&::-webkit-details-marker]:hidden">
            <div>
              <h2 className="text-lg font-black text-rose-800">危険な操作</h2>
              <p className="mt-1 text-sm font-bold leading-6 text-rose-700">
                削除済みにすると公開ページと通常一覧から消えます。あとで復元できます。
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-700 group-open:hidden">
              開く
            </span>
            <span className="hidden shrink-0 rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-800 group-open:inline-flex">
              閉じる
            </span>
          </summary>
          <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-4">
            <p className="text-sm font-bold leading-6 text-rose-800">
              この商品を削除済みにしますか？公開ページと通常の管理一覧から消えますが、あとで復元できます。
            </p>
            <div className="mt-3 w-full sm:w-44">
              <ManualFoodDeleteButton foodId={food.id} deleted={false} action={setManualFoodDeleted} tone="danger" />
            </div>
          </div>
        </details>
      ) : null}
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
  if (!supabase) return { isManualFood: manualSource, hasOverride: false, adminNotes: null, categoryTags: null, nameEn: null, infoSourceUrl: food.sourceUrl };

  const { data, error } = await supabase.from("manual_foods").select("id, admin_notes, category_tags, name_en, source_url").eq("id", food.id).maybeSingle();
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
      nameEn: data.name_en ?? null,
      infoSourceUrl: data.source_url ?? food.sourceUrl
    };
  }

  const override = await supabase.from("food_overrides").select("food_id, admin_notes, category_tags, name_en, info_source_url").eq("food_id", food.id).maybeSingle();
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
    nameEn: override.data?.name_en ?? null,
    infoSourceUrl: override.data?.info_source_url ?? food.sourceUrl
  };
}

function formatAdminRole(role: string) {
  if (role === "owner") return "管理者";
  if (role === "editor") return "運営者";
  if (role === "viewer") return "見るだけ";
  return role;
}
