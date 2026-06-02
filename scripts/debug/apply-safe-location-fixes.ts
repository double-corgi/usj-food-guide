import fs from "node:fs";
import path from "node:path";
import { getFoodImage } from "../../lib/utils/image";
import type { FoodLocation, ShopType } from "../../types/domain";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";

type LocationFix = {
  match: RegExp;
  shopName: string;
  areaName: string;
  shopType: ShopType;
};

const outputDir = path.join(process.cwd(), "scripts", "output");
const datasetPath = path.join(outputDir, "foods.generated.json");
const reportPath = path.join(outputDir, "safe-location-fixes.generated.json");

const fixes: LocationFix[] = [
  { match: /\/restaurants\/kinopios-cafe\//, shopName: "キノピオ・カフェ", areaName: "スーパー・ニンテンドー・ワールド", shopType: "restaurant" },
  { match: /\/restaurants\/jungle-beat-shakes\//, shopName: "ジャングル・ビート・シェイク", areaName: "スーパー・ニンテンドー・ワールド", shopType: "restaurant" },
  { match: /\/restaurants\/three-broomsticks\//, shopName: "三本の箒", areaName: "ウィザーディング・ワールド・オブ・ハリー・ポッター", shopType: "restaurant" },
  { match: /\/restaurants\/hogs-head\//, shopName: "ホッグズ・ヘッド", areaName: "ウィザーディング・ワールド・オブ・ハリー・ポッター", shopType: "restaurant" },
  { match: /\/restaurants\/studio-stars-restaurant\//, shopName: "スタジオ・スターズ・レストラン", areaName: "ハリウッド・エリア", shopType: "restaurant" },
  { match: /\/restaurants\/mels-drive-in\//, shopName: "メルズ・ドライブイン", areaName: "ハリウッド・エリア", shopType: "restaurant" },
  { match: /\/restaurants\/beverly-hills-boulangerie\//, shopName: "ビバリーヒルズ・ブランジェリー", areaName: "ハリウッド・エリア", shopType: "restaurant" },
  { match: /\/restaurants\/discovery-restaurant\//, shopName: "ディスカバリー・レストラン", areaName: "ジュラシック・パーク", shopType: "restaurant" },
  { match: /\/restaurants\/lost-world-restaurant\//, shopName: "ロストワールド・レストラン", areaName: "ジュラシック・パーク", shopType: "restaurant" },
  { match: /\/restaurants\/amity-landing-restaurant\//, shopName: "アミティ・ランディング・レストラン", areaName: "アミティ・ビレッジ", shopType: "restaurant" },
  { match: /\/restaurants\/boardwalk-snacks\//, shopName: "ボードウォーク・スナック", areaName: "アミティ・ビレッジ", shopType: "restaurant" },
  { match: /\/restaurants\/happiness-cafe\//, shopName: "ハピネス・カフェ", areaName: "サンフランシスコ・エリア", shopType: "restaurant" },
  { match: /\/restaurants\/wharf-cafe\//, shopName: "ワーフカフェ", areaName: "サンフランシスコ・エリア", shopType: "restaurant" },
  { match: /\/restaurants\/snoopys-backlot-cafe\//, shopName: "スヌーピー・バックロット・カフェ", areaName: "ユニバーサル・ワンダーランド", shopType: "restaurant" },
  { match: /\/restaurants\/hello-kittys-corner-cafe\//, shopName: "ハローキティのコーナーカフェ", areaName: "ユニバーサル・ワンダーランド", shopType: "restaurant" }
];

const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8")) as GeneratedDataset;
const beforeImages = imageSnapshot(dataset.foods);
const changes: Array<{ id: string; name: string; beforeShop: string; afterShop: string; beforeArea: string; afterArea: string; sourceUrl: string }> = [];
const now = new Date().toISOString();

for (const food of dataset.foods) {
  if (food.reviewStatus !== "approved" || food.canonicalFood === false || food.hidden) continue;
  const sourceUrl = food.sourceUrl ?? food.source_url ?? food.officialUrl ?? "";
  const fix = fixes.find((candidate) => candidate.match.test(sourceUrl));
  if (!fix) continue;

  const beforeShop = food.shop?.name ?? "";
  const beforeArea = food.area?.name ?? "";
  const shouldFixShop = isUnknownName(beforeShop) || beforeShop === "その他";
  const shouldFixArea = isUnknownName(beforeArea) || beforeArea === "その他";
  if (!shouldFixShop && !shouldFixArea) continue;

  applyLocation(food, fix, now, shouldFixShop, shouldFixArea);
  changes.push({
    id: food.id,
    name: food.name,
    beforeShop,
    afterShop: food.shop.name,
    beforeArea,
    afterArea: food.area.name,
    sourceUrl
  });
}

const imageRegression = countImageRegression(beforeImages, imageSnapshot(dataset.foods));
if (imageRegression > 0) {
  throw new Error(`Image regression detected: ${imageRegression}`);
}

dataset.generatedAt = now;
fs.writeFileSync(datasetPath, `${JSON.stringify(dataset, null, 2)}\n`);
const report = {
  generatedAt: now,
  foodTotal: dataset.foods.filter((food) => food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden).length,
  imageTotal: dataset.foods.filter((food) => food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden && !getFoodImage(food).startsWith("/placeholders/")).length,
  placeholderCount: dataset.foods.filter((food) => food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden && getFoodImage(food).startsWith("/placeholders/")).length,
  imageRegression,
  changed: changes.length,
  changes
};
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

function applyLocation(food: GeneratedFood, fix: LocationFix, now: string, fixShop: boolean, fixArea: boolean) {
  if (fixShop) {
    food.shop.name = fix.shopName;
    food.shop.type = fix.shopType;
  }
  if (fixArea) {
    food.area.name = fix.areaName;
    food.shop.areaId = food.area.id;
  }
  food.lastCheckedAt = now;
  food.last_checked_at = now;
  if (!food.locations?.length) {
    food.locations = [buildLocation(food, fix, now)];
    return;
  }
  for (const location of food.locations) {
    if (fixShop && isUnknownName(location.shopName)) location.shopName = fix.shopName;
    if (fixArea && isUnknownName(location.areaName)) location.areaName = fix.areaName;
    if (fixShop) location.shopType = fix.shopType;
    location.lastCheckedAt = now;
  }
}

function buildLocation(food: GeneratedFood, fix: LocationFix, now: string): FoodLocation {
  return {
    id: `location-${food.id}`,
    foodId: food.id,
    shopId: food.shopId,
    shopName: fix.shopName,
    areaId: food.areaId,
    areaName: fix.areaName,
    shopType: fix.shopType,
    sourceUrl: food.sourceUrl,
    status: food.status,
    startDate: food.startDate,
    endDate: food.endDate,
    lastCheckedAt: now
  };
}

function isUnknownName(value?: string) {
  return !value || /未確認|不明|unknown|その他/i.test(value);
}

function imageSnapshot(foods: GeneratedFood[]) {
  return new Map(
    foods.map((food) => [
      food.id,
      {
        imageUrl: food.imageUrl,
        representativeImageUrl: food.representativeImageUrl,
        images: food.images?.map((image) => ({
          imageUrl: image.imageUrl,
          imageVerified: image.imageVerified,
          imageApproved: image.imageApproved ?? image.image_approved,
          manuallyAdded: image.manuallyAdded ?? image.manually_added
        })) ?? []
      }
    ])
  );
}

function countImageRegression(before: ReturnType<typeof imageSnapshot>, after: ReturnType<typeof imageSnapshot>) {
  let regressions = 0;
  for (const [foodId, previous] of before.entries()) {
    const current = after.get(foodId);
    if (!current) continue;
    if (previous.imageUrl && !current.imageUrl) regressions += 1;
    if (previous.representativeImageUrl && !current.representativeImageUrl) regressions += 1;
    if (previous.images.length > current.images.length) regressions += 1;
    const previousPrimary = previous.imageUrl ?? previous.representativeImageUrl ?? previous.images[0]?.imageUrl;
    const currentPrimary = current.imageUrl ?? current.representativeImageUrl ?? current.images[0]?.imageUrl;
    if (previousPrimary && previousPrimary !== currentPrimary && currentPrimary?.startsWith("/placeholders/")) regressions += 1;
  }
  return regressions;
}
