import fs from "node:fs";
import path from "node:path";

type Area = { id: string; name: string; sortOrder: number; foodCount?: number };
type Shop = { id: string; areaId: string; name: string; type: string; officialUrl?: string; isActive: boolean; foodCount?: number };
type FoodLocation = {
  id: string;
  foodId: string;
  shopId?: string;
  shopName: string;
  areaId?: string;
  areaName: string;
  shopType: string;
  sourceUrl?: string;
};
type Food = {
  id: string;
  name: string;
  areaId: string;
  area_id?: string;
  shopId: string;
  shop_id?: string;
  area: Area;
  shop: Shop;
  locations?: FoodLocation[];
  sourceUrl?: string;
  source_url?: string;
  officialUrl?: string;
  official_url?: string;
  sourceNames?: string[];
  source_names?: string[];
  eventName?: string;
  event_name?: string;
  collaborationName?: string;
  collaboration_name?: string;
};

const outputDir = path.join(process.cwd(), "scripts", "output");
const foodsPath = path.join(outputDir, "foods.generated.json");
const areasPath = path.join(outputDir, "areas.generated.json");
const shopsPath = path.join(outputDir, "shops.generated.json");
const pendingArea: Area = { id: "area-review-pending", name: "エリア確認中", sortOrder: 999, foodCount: 0 };

const foodsDataset = JSON.parse(fs.readFileSync(foodsPath, "utf8")) as { foods: Food[]; summary?: Record<string, number> };
const areas = JSON.parse(fs.readFileSync(areasPath, "utf8")) as Area[];
const shops = JSON.parse(fs.readFileSync(shopsPath, "utf8")) as Shop[];

const areaByName = new Map(areas.filter((area) => !isOtherLike(area.name)).map((area) => [area.name, area]));
areaByName.set(pendingArea.name, pendingArea);

let rawOtherDeleted = 0;
let inferredLocationCount = 0;
let pendingLocationCount = 0;
let inferredFoodCount = 0;
let pendingFoodCount = 0;
const touchedFoods = new Set<string>();
const multiLocationFoods = new Set<string>();

for (const food of foodsDataset.foods) {
  const context = foodContext(food);
  const normalizedLocationAreas: string[] = [];

  for (const location of food.locations ?? []) {
    if ((food.locations ?? []).length >= 2) multiLocationFoods.add(food.id);
    const before = location.areaName;
    const nextAreaName = normalizeAreaName(location.areaName) ?? inferAreaFromText(`${location.shopName} ${location.sourceUrl ?? ""} ${context}`) ?? pendingArea.name;
    const nextArea = areaForName(nextAreaName);
    if (isOtherLike(before)) rawOtherDeleted += 1;
    if (nextAreaName !== before) {
      touchedFoods.add(food.id);
      if (nextAreaName === pendingArea.name) pendingLocationCount += 1;
      else inferredLocationCount += 1;
    }
    location.areaName = nextArea.name;
    location.areaId = nextArea.id;
    if (nextArea.name !== pendingArea.name && !normalizedLocationAreas.includes(nextArea.name)) normalizedLocationAreas.push(nextArea.name);
  }

  const beforeFoodAreaName = food.area?.name;
  const nextFoodAreaName =
    normalizeAreaName(beforeFoodAreaName) ??
    normalizedLocationAreas[0] ??
    inferAreaFromText(`${food.shop?.name ?? ""} ${context}`) ??
    pendingArea.name;
  const nextFoodArea = areaForName(nextFoodAreaName);

  if (isOtherLike(beforeFoodAreaName)) rawOtherDeleted += 1;
  if (nextFoodArea.name !== beforeFoodAreaName) {
    touchedFoods.add(food.id);
    if (nextFoodArea.name === pendingArea.name) pendingFoodCount += 1;
    else inferredFoodCount += 1;
  }

  food.area = { id: nextFoodArea.id, name: nextFoodArea.name, sortOrder: nextFoodArea.sortOrder };
  food.areaId = nextFoodArea.id;
  food.area_id = nextFoodArea.id;
  if (food.shop) {
    const shopAreaName = normalizeAreaName(food.shop.name === "店舗未確認" ? null : inferAreaFromText(food.shop.name)) ?? nextFoodArea.name;
    const shopArea = areaForName(shopAreaName);
    food.shop.areaId = shopArea.id;
  }
}

const shopAreaById = new Map<string, string>();
for (const food of foodsDataset.foods) {
  if (food.shop?.id && food.shop.name !== "店舗未確認") shopAreaById.set(food.shop.id, food.shop.areaId);
  for (const location of food.locations ?? []) {
    if (location.shopId && location.areaId && location.areaName !== pendingArea.name) shopAreaById.set(location.shopId, location.areaId);
  }
}

for (const shop of shops) {
  const inferred = inferAreaFromText(shop.name);
  const area = inferred ? areaForName(inferred) : shopAreaById.has(shop.id) ? areaById(shopAreaById.get(shop.id)!) : shop.areaId === "area-7bosl" ? pendingArea : areaById(shop.areaId);
  shop.areaId = area.id;
}

const nextAreas = [...areas.filter((area) => !isOtherLike(area.name)), pendingArea].map((area) => ({
  ...area,
  foodCount: foodsDataset.foods.filter((food) => food.areaId === area.id).length
}));
const nextShops = shops.map((shop) => ({
  ...shop,
  foodCount: foodsDataset.foods.filter((food) => food.shopId === shop.id || food.shop_id === shop.id).length
}));

fs.writeFileSync(foodsPath, `${JSON.stringify(foodsDataset, null, 2)}\n`);
fs.writeFileSync(areasPath, `${JSON.stringify(nextAreas, null, 2)}\n`);
fs.writeFileSync(shopsPath, `${JSON.stringify(nextShops, null, 2)}\n`);

const pendingFoods = foodsDataset.foods.filter((food) => food.area.name === pendingArea.name || food.locations?.some((location) => location.areaName === pendingArea.name));
console.log(
  JSON.stringify(
    {
      totalFoods: foodsDataset.foods.length,
      rawOtherDeleted,
      inferredFoodCount,
      inferredLocationCount,
      pendingFoodCount,
      pendingLocationCount,
      touchedFoodCount: touchedFoods.size,
      pendingAreaFoodCount: pendingFoods.length,
      multiLocationFoodCount: multiLocationFoods.size,
      pendingFoods: pendingFoods.map((food) => ({ id: food.id, name: food.name }))
    },
    null,
    2
  )
);

function areaForName(name: string) {
  const area = areaByName.get(name);
  if (area) return area;
  return pendingArea;
}

function areaById(id: string) {
  return areas.find((area) => area.id === id && !isOtherLike(area.name)) ?? pendingArea;
}

function normalizeAreaName(value?: string | null) {
  if (isOtherLike(value)) return null;
  return value!.trim();
}

function isOtherLike(value?: string | null) {
  return !value || /^(その他|エリア未確認|未確認|不明|unknown)$/i.test(value.trim());
}

function foodContext(food: Food) {
  return [
    food.name,
    food.sourceUrl,
    food.source_url,
    food.officialUrl,
    food.official_url,
    food.sourceNames?.join(" "),
    food.source_names?.join(" "),
    food.eventName,
    food.event_name,
    food.collaborationName,
    food.collaboration_name
  ]
    .filter(Boolean)
    .join(" ");
}

function inferAreaFromText(text?: string | null) {
  const normalized = text ?? "";
  if (/super-nintendo-world|kinopios-cafe|キノピオ|ヨッシー|マリオ|ピーチ|ドンキー|ジャングル・ビート|ピットストップ/.test(normalized)) return "スーパー・ニンテンドー・ワールド";
  if (/harry-potter|three-broomsticks|hog|三本の箒|ホッグズ|ホグワーツ|ハリー|ポッター/.test(normalized)) return "ウィザーディング・ワールド・オブ・ハリー・ポッター";
  if (/minion|delicious-me|ミニオン|デリシャス・ミー|イーブル・イーツ|ティム/.test(normalized)) return "ミニオン・パーク";
  if (/wonderland|snoopy|hello-kitty|cupcake-dream|elmo|スヌーピー|エルモ|キティ|ワンダーランド|カップケーキ・ドリーム|イマジネーション・プレイランド/.test(normalized)) return "ユニバーサル・ワンダーランド";
  if (/hollywood|beverly|space-fantasy|universal-monsters|curious-george|california-confectionery|メルズ|スペース・ファンタジー|ハリウッド|ハリウッド・ドリーム|ビバリーヒルズ|ユニバーサル・モンスター|ユニモン|おさるのジョージ|プレイングウィズ|シネマ 4-D|シネマ4-D|カリフォルニアコンフェクショナリー/.test(normalized)) return "ハリウッド・エリア";
  if (/new-york|finnegans|louies|saido|park-side|battery-park|spider-man|フィネガンズ|ルイズ|SAIDO|パークサイド|アズーラ|スパイダーマン|バッテリーパーク/.test(normalized)) return "ニューヨーク・エリア";
  if (/san-francisco|lombards|dragons-pearl|wharf|happiness-cafe|ロンバーズ|ドラゴンズ・パール|ワーフカフェ|ハピネス・カフェ/.test(normalized)) return "サンフランシスコ・エリア";
  if (/jurassic|discovery|lost-world|ジュラシック|ディスカバリー|ロストワールド/.test(normalized)) return "ジュラシック・パーク";
  if (/amity|jaws|boardwalk|アミティ|ジョーズ|ハンギングジョーズ|ボードウォーク/.test(normalized)) return "アミティ・ビレッジ";
  if (/waterworld|ウォーターワールド/.test(normalized)) return "ウォーターワールド";
  return null;
}
