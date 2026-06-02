import { EatenExperience } from "@/components/eaten-experience";
import { listFoods } from "@/lib/repositories/foods";

export default async function EatenPage() {
  const foods = await listFoods();
  return <EatenExperience foods={foods} />;
}
