import { AdSlot } from "@/components/ad-slot";
import { FoodGrid } from "@/components/food-grid";
import { readGeneratedSummary } from "@/lib/repositories/generated-data";
import { listFoods } from "@/lib/repositories/foods";
import type { DiningType, FoodCategory } from "@/types/domain";
import type { ListMode, SaleFilter, SortMode } from "@/components/food-grid";

export const revalidate = 3600;

const categoryAliases: Record<string, FoodCategory> = {
  churro: "churro",
  popcorn: "popcorn",
  drink: "drink",
  drinks: "drink",
  pizza: "pizza",
  burger: "burger",
  pasta: "noodle",
  noodle: "noodle",
  kids: "kids",
  sweets: "dessert",
  sweet: "dessert",
  dessert: "dessert",
  desserts: "dessert",
  plate: "set",
  set: "set",
  rice: "rice",
  snack: "snack",
  chicken: "chicken",
  seasonal: "seasonal",
};

function parseCategory(value?: string) {
  if (!value) return undefined;
  return categoryAliases[value.toLowerCase()];
}

function parseDiningType(value?: string) {
  if (value === "takeout" || value === "eat_in" || value === "both" || value === "food_cart" || value === "unknown") {
    return value;
  }
  return undefined;
}

function parseSaleFilter(value?: string): SaleFilter | undefined {
  if (
    value === "active" ||
    value === "endingSoon" ||
    value === "ended" ||
    value === "upcoming" ||
    value === "unknown" ||
    value === "permanent" ||
    value === "limited" ||
    value === "all"
  ) {
    return value;
  }
  return undefined;
}

function parseMode(value?: string): ListMode | undefined {
  if (value === "all" || value === "eaten") return value;
  return undefined;
}

function parseSort(value?: string): SortMode | undefined {
  if (
    value === "recommended" ||
    value === "new" ||
    value === "image" ||
    value === "status" ||
    value === "uneaten" ||
    value === "category" ||
    value === "shop" ||
    value === "priceAsc" ||
    value === "priceDesc" ||
    value === "walk"
  ) {
    return value;
  }
  return undefined;
}

export default async function FoodsPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string; area?: string; shop?: string; diningType?: string; status?: string; sale?: string; mode?: string; sort?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const foods = await listFoods();
  const generatedSummary = readGeneratedSummary();
  return (
    <>
      <FoodGrid
        foods={foods}
        mode={parseMode(resolvedSearchParams.mode)}
        generatedAt={typeof generatedSummary.generatedAt === "string" ? generatedSummary.generatedAt : undefined}
        initialCategory={parseCategory(resolvedSearchParams.category)}
        initialAreaId={resolvedSearchParams.area}
        initialShopId={resolvedSearchParams.shop}
        initialDiningType={parseDiningType(resolvedSearchParams.diningType) as DiningType | undefined}
        initialSaleFilter={parseSaleFilter(resolvedSearchParams.sale ?? resolvedSearchParams.status)}
        initialSort={parseSort(resolvedSearchParams.sort)}
      />
      <AdSlot slotId="foods-bottom" />
    </>
  );
}
