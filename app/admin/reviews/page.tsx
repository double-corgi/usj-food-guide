import { ReviewAdminPanel } from "@/app/admin/reviews/review-admin-panel";
import { listFoods } from "@/lib/repositories/foods";

export default async function AdminReviewsPage() {
  const foods = await listFoods();
  const foodSummaries = foods.map((food) => ({ id: food.id, name: food.name }));
  return <ReviewAdminPanel foods={foodSummaries} />;
}
