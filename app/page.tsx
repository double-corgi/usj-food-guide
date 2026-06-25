import { HomeDashboard } from "@/components/home-dashboard";
import { readGeneratedAreas, readGeneratedSummary } from "@/lib/repositories/generated-data";
import { listFoods, listHomeActiveCollectionFoods } from "@/lib/repositories/foods";

export const revalidate = 60;

export default async function Page() {
  const [foods, activeCollectionFoods] = await Promise.all([listFoods(), listHomeActiveCollectionFoods()]);
  const areas = readGeneratedAreas();
  const generatedSummary = readGeneratedSummary();
  return <HomeDashboard foods={foods} activeCollectionFoods={activeCollectionFoods} areas={areas} generatedAt={typeof generatedSummary.generatedAt === "string" ? generatedSummary.generatedAt : undefined} />;
}
