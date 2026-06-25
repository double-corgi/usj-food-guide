import { notFound } from "next/navigation";
import Link from "next/link";
import { FoodDetail } from "@/components/food-detail";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { getFoodById, listFoods } from "@/lib/repositories/foods";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export default async function FoodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const food = await getFoodById(resolvedParams.id);
  if (!food) notFound();
  const foods = await listFoods();
  const currentIndex = foods.findIndex((candidate) => candidate.id === food.id);
  const previousFood = currentIndex > 0 ? foods[currentIndex - 1] : undefined;
  const nextFood = currentIndex >= 0 && currentIndex < foods.length - 1 ? foods[currentIndex + 1] : undefined;
  const sameCategory = foods.filter((candidate) => candidate.id !== food.id && candidate.category === food.category);
  const sameCategoryIds = new Set(sameCategory.map((candidate) => candidate.id));
  const sameArea = foods.filter((candidate) => candidate.id !== food.id && candidate.area.id === food.area.id && !sameCategoryIds.has(candidate.id));
  const sameShop = foods.filter((candidate) => candidate.id !== food.id && (candidate.shop.id === food.shop.id || candidate.locations?.some((location) => food.locations?.some((current) => current.shopName === location.shopName))));
  const sameEvent = foods.filter((candidate) => candidate.id !== food.id && food.eventName && candidate.eventName === food.eventName);
  const sameSeries = foods.filter((candidate) => candidate.id !== food.id && (candidate.category === food.category || (food.flavor && candidate.flavor === food.flavor)));
  const together = uniqueFoods([...sameShop, ...sameArea, ...sameCategory]).slice(0, 12);
  const admin = await getCurrentAdmin();
  const canEdit = admin?.mode === "supabase" && (admin.role === "owner" || admin.role === "editor");
  const isManualFood = food.manualOverride === true || food.sourceNames?.includes("manual_foods") === true || food.id.startsWith("food-manual-");

  return (
    <>
      {canEdit ? (
        <div className="mb-4 rounded-2xl border border-park/20 bg-mint p-3 shadow-soft">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black text-park">管理者として表示中</p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/foods/${food.id}`} className="inline-flex h-10 items-center justify-center rounded-full border border-park/30 bg-white px-4 text-xs font-black text-park">
                管理画面で確認
              </Link>
              <Link href={`/admin/foods/${food.id}/edit`} className="inline-flex h-10 items-center justify-center rounded-full bg-park px-4 text-xs font-black text-white">
                {isManualFood ? "この商品を編集" : "編集準備画面"}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      <FoodDetail
        food={food}
        allFoods={foods}
        previousFood={previousFood}
        nextFood={nextFood}
        relatedGroups={{
          sameCategory,
          sameArea,
          sameShop,
          sameEvent,
          sameSeries,
          together
        }}
      />
    </>
  );
}

function uniqueFoods(foods: Awaited<ReturnType<typeof listFoods>>) {
  return Array.from(new Map(foods.map((food) => [food.id, food])).values());
}
