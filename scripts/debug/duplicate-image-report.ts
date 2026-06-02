import fs from "node:fs";
import path from "node:path";

type FoodImage = {
  imageUrl?: string;
  enabled?: boolean;
  sourceType?: string;
  imageVerified?: boolean;
  imageMismatchReason?: string;
};

type Food = {
  id: string;
  name: string;
  category: string;
  hidden?: boolean;
  reviewStatus?: string;
  status?: string;
  images?: FoodImage[];
};

type Dataset = {
  foods: Food[];
};

const datasetPath = path.join(process.cwd(), "scripts", "output", "foods.generated.json");
const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8")) as Dataset;
const visible = dataset.foods.filter((food) =>
  food.reviewStatus === "approved" &&
  !food.hidden &&
  food.status !== "ended" &&
  food.status !== "inactive"
);

const byImage = new Map<string, Food[]>();

for (const food of visible) {
  const image = food.images?.find((candidate) =>
    candidate.enabled &&
    candidate.sourceType === "official" &&
    candidate.imageVerified &&
    !candidate.imageMismatchReason &&
    candidate.imageUrl
  );
  if (!image?.imageUrl) continue;
  const current = byImage.get(image.imageUrl) ?? [];
  current.push(food);
  byImage.set(image.imageUrl, current);
}

const shared = Array.from(byImage.entries())
  .filter(([, foods]) => foods.length > 1)
  .sort((a, b) => b[1].length - a[1].length)
  .map(([imageUrl, foods]) => ({
    imageUrl,
    count: foods.length,
    categories: Array.from(new Set(foods.map((food) => food.category))),
    foods: foods.map((food) => food.name)
  }));

console.log(JSON.stringify({
  visible: visible.length,
  verifiedImageUrls: byImage.size,
  sharedImageGroups: shared.length,
  suspiciousSharedGroups: shared.filter((group) => group.count >= 5 || group.categories.length > 1).length,
  shared: shared.slice(0, 40)
}, null, 2));
