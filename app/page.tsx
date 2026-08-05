import { HomeDashboard } from "@/components/home-dashboard";
import { PublicMarketingHome } from "@/components/public-marketing-home";
import { readGeneratedAreas, readGeneratedSummary } from "@/lib/repositories/generated-data";
import { listFoodCollections } from "@/lib/repositories/collections";
import { listFoods, listHomeActiveCollectionFoods } from "@/lib/repositories/foods";

export const revalidate = 60;

const isCapacitorStaticExport = process.env.CAPACITOR_STATIC_EXPORT === "1";

export default async function Page() {
  const [foods, activeCollectionFoods, collections] = await Promise.all([listFoods(), listHomeActiveCollectionFoods(), listFoodCollections()]);
  if (!isCapacitorStaticExport) {
    return <PublicMarketingHome foods={foods} collections={collections} />;
  }

  const areas = readGeneratedAreas();
  const generatedSummary = readGeneratedSummary();
  return <HomeDashboard foods={foods} activeCollectionFoods={activeCollectionFoods} collections={collections} areas={areas} generatedAt={typeof generatedSummary.generatedAt === "string" ? generatedSummary.generatedAt : undefined} />;
}
