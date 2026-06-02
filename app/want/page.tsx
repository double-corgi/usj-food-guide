import { FoodGrid } from "@/components/food-grid";
import { listFoods } from "@/lib/repositories/foods";

export default async function WantPage() {
  const foods = await listFoods();
  return <FoodGrid foods={foods} mode="want" title="次回食べたい / お気に入り" />;
}
