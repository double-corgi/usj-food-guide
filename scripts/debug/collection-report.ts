import fs from "node:fs";
import path from "node:path";

type Food = {
  id: string;
  name: string;
  category: string;
  area?: { id: string; name: string };
  areaId?: string;
  shop?: { id: string; name: string };
  shopId?: string;
  eventName?: string;
  hidden?: boolean;
  reviewStatus?: string;
  status?: string;
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

const byCategory = countBy(visible, (food) => food.category);
const byArea = countBy(visible, (food) => food.area?.name ?? food.areaId ?? "unknown");
const withRelated = visible.filter((food) =>
  visible.some((candidate) => candidate.id !== food.id && candidate.category === food.category) ||
  visible.some((candidate) => candidate.id !== food.id && (candidate.area?.id ?? candidate.areaId) === (food.area?.id ?? food.areaId)) ||
  visible.some((candidate) => candidate.id !== food.id && (candidate.shop?.id ?? candidate.shopId) === (food.shop?.id ?? food.shopId)) ||
  Boolean(food.eventName && visible.some((candidate) => candidate.id !== food.id && candidate.eventName === food.eventName))
);

console.log(JSON.stringify({
  visible: visible.length,
  relatedFoodsAvailable: withRelated.length,
  areaPages: Object.keys(byArea).length,
  categoryCounts: byCategory,
  areaCounts: byArea
}, null, 2));

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
