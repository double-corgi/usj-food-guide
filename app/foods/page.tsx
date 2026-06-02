import { FoodGrid } from "@/components/food-grid";
import { readGeneratedSummary } from "@/lib/repositories/generated-data";
import { listFoods } from "@/lib/repositories/foods";
import type { DiningType, FoodCategory } from "@/types/domain";
import type { SaleFilter } from "@/components/food-grid";

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

export default async function FoodsPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string; area?: string; shop?: string; diningType?: string; status?: string; sale?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const foods = await listFoods();
  const generatedSummary = readGeneratedSummary();
  return (
    <FoodGrid
      foods={foods}
      title="食べたいものを探す"
      generatedAt={typeof generatedSummary.generatedAt === "string" ? generatedSummary.generatedAt : undefined}
      initialCategory={parseCategory(resolvedSearchParams.category)}
      initialAreaId={resolvedSearchParams.area}
      initialShopId={resolvedSearchParams.shop}
      initialDiningType={parseDiningType(resolvedSearchParams.diningType) as DiningType | undefined}
      initialSaleFilter={parseSaleFilter(resolvedSearchParams.sale ?? resolvedSearchParams.status)}
    />
  );
}
