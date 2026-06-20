import { notFound } from "next/navigation";
import { FoodDetail } from "@/components/food-detail";
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
  return (
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
  );
}

function uniqueFoods(foods: Awaited<ReturnType<typeof listFoods>>) {
  return Array.from(new Map(foods.map((food) => [food.id, food])).values());
}
