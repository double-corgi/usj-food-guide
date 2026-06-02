import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "scripts/output/foods.generated.json");
const dataset = JSON.parse(fs.readFileSync(file, "utf8"));
const foods = Array.isArray(dataset.foods) ? dataset.foods : [];

const visible = foods.filter(
  (food: any) =>
    food.canonicalFood &&
    food.reviewStatus === "approved" &&
    !food.hidden &&
    food.displayQuality !== "low" &&
    food.nameQualityScore >= 60
);

const placeholders = visible.filter((food: any) => !food.images?.some((image: any) => image.enabled && image.sourceType === "official" && image.imageVerified));

console.log(`visible=${visible.length} placeholders=${placeholders.length}`);
for (const food of placeholders) {
  console.log(
    JSON.stringify(
      {
        id: food.id,
        name: food.name,
        category: food.category,
        sourceUrl: food.sourceUrl,
        shop: food.shop?.name,
        area: food.area?.name,
        imageCount: food.images?.length ?? 0,
        images: (food.images ?? []).slice(0, 3).map((image: any) => ({
          url: image.imageUrl,
          enabled: image.enabled,
          sourceType: image.sourceType,
          verified: image.imageVerified,
          match: image.imageMatchScore,
          mismatch: image.imageMismatchReason
        }))
      },
      null,
      2
    )
  );
}
