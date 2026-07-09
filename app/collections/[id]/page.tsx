import { notFound } from "next/navigation";
import { SeasonalCollectionDetail } from "@/components/seasonal-collection-detail";
import { listFoodCollections } from "@/lib/repositories/collections";
import { listFoods } from "@/lib/repositories/foods";
import { isFoodInCollection, SUMMER_2026_COLLECTION_ID } from "@/lib/seasonal-collections";

export const dynamic = "force-dynamic";

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [collections, foods] = await Promise.all([listFoodCollections(), listFoods()]);
  const collection = collections.find((item) => item.id === id);
  if (!collection) notFound();

  const collectionFoods = foods.filter((food) => isFoodInCollection(food, id));
  if (id !== SUMMER_2026_COLLECTION_ID && collectionFoods.length === 0) notFound();

  return <SeasonalCollectionDetail collection={collection} foods={collectionFoods} allFoods={foods} />;
}
