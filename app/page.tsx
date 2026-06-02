import { HomeDashboard } from "@/components/home-dashboard";
import { readGeneratedAreas, readGeneratedSummary } from "@/lib/repositories/generated-data";
import { listFoods } from "@/lib/repositories/foods";

export const revalidate = 3600;

export default async function Page() {
  const foods = await listFoods();
  const areas = readGeneratedAreas();
  const generatedSummary = readGeneratedSummary();
  return <HomeDashboard foods={foods} areas={areas} generatedAt={typeof generatedSummary.generatedAt === "string" ? generatedSummary.generatedAt : undefined} />;
}
