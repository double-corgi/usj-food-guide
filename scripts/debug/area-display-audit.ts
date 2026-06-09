import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Food = {
  id: string;
  name: string;
  reviewStatus?: string;
  canonicalFood?: boolean;
  hidden?: boolean;
  displayQuality?: string;
  status?: string;
  nameQualityScore?: number;
  confidenceScore?: number;
  compositeMenu?: boolean;
  sourceUrl?: string | null;
  imageUrl?: string | null;
  representativeImageUrl?: string | null;
  images?: Array<{ enabled?: boolean; sourceType?: string; isSharedTooMuch?: boolean }> | string[];
  shop?: { name?: string | null } | null;
  area?: { name?: string | null } | null;
  officialUrl?: string | null;
  sourceNames?: string[];
  eventName?: string | null;
  collaborationName?: string | null;
  description?: string | null;
  locations?: Array<{ areaName?: string | null; name?: string | null; shopName?: string | null; sourceUrl?: string | null }>;
};

type Dataset = {
  foods: Food[];
};

const root = process.cwd();
const outputPath = join(root, "scripts", "output", "area-display-audit.generated.json");
const dataset = JSON.parse(readFileSync(join(root, "scripts/output/foods.generated.json"), "utf8")) as Dataset;
const foods = dataset.foods.filter(isVisibleFood);

const hasImage = (food: Food) => Boolean(food.imageUrl || food.representativeImageUrl || food.images?.length);
const isOther = (value?: string | null) => value === "その他";
const isOtherLike = (value?: string | null) => !value || /^(その他|エリア未確認|未確認|不明|unknown)$/i.test(value.trim());
const areaNames = (food: Food) => {
  const names = [
    food.area?.name,
    ...(food.locations ?? []).map((location) => location.areaName)
  ].filter(Boolean) as string[];
  return [...new Set(names)];
};
const displayAreaNames = (food: Food) => {
  const names: string[] = [];
  const add = (value?: string | null) => {
    if (value && !names.includes(value)) names.push(value);
  };
  for (const location of food.locations ?? []) {
    add(normalizeDisplayAreaName(location.areaName) ?? inferAreaFromText([location.shopName, location.sourceUrl, foodContext(food)].filter(Boolean).join(" ")));
  }
  add(normalizeDisplayAreaName(food.area?.name) ?? inferAreaFromText([food.shop?.name, foodContext(food)].filter(Boolean).join(" ")));
  return names.length > 0 ? names : ["エリア確認中"];
};
const displayAreaSummary = (food: Food, maxVisible = 2) => {
  const areas = displayAreaNames(food);
  if (areas.length === 1) return areas[0];
  const visible = areas.slice(0, maxVisible);
  const remaining = areas.length - visible.length;
  return `${visible.join(" / ")}${remaining > 0 ? ` ほか${remaining}箇所` : ""}`;
};

const rawOtherFoods = foods.filter((food) => areaNames(food).some(isOther));
const rawOtherLikeFoods = foods.filter((food) => areaNames(food).some(isOtherLike));
const pendingFoods = foods.filter((food) => areaNames(food).includes("エリア確認中"));
const multiLocationFoods = foods.filter((food) => (food.locations?.length ?? 0) >= 2);
const multiAreaFoods = foods.filter((food) => areaNames(food).filter((name) => name !== "エリア確認中").length >= 2);
const displayOtherFoods = foods.filter((food) => displayAreaNames(food).some(isOther));
const displayPendingFoods = foods.filter((food) => displayAreaNames(food).includes("エリア確認中"));

const report = {
  generatedAt: new Date().toISOString(),
  visibleFoodCount: foods.length,
  imageCount: foods.filter(hasImage).length,
  placeholderCount: foods.filter((food) => !hasImage(food)).length,
  rawOtherFoodCount: rawOtherFoods.length,
  rawOtherLikeFoodCount: rawOtherLikeFoods.length,
  displayOtherFoodCount: displayOtherFoods.length,
  pendingAreaFoodCount: pendingFoods.length,
  displayPendingAreaFoodCount: displayPendingFoods.length,
  multiLocationFoodCount: multiLocationFoods.length,
  multiAreaFoodCount: multiAreaFoods.length,
  displayOtherFoods: displayOtherFoods.map((food) => ({ id: food.id, name: food.name, displayAreas: displayAreaNames(food), summary: displayAreaSummary(food) })),
  pendingAreaFoods: pendingFoods.map((food) => ({ id: food.id, name: food.name })),
  multiLocationFoods: multiLocationFoods.map((food) => ({
    id: food.id,
    name: food.name,
    locationCount: food.locations?.length ?? 0,
    areas: areaNames(food),
    displayAreas: displayAreaNames(food),
    cardSummary: displayAreaSummary(food)
  })),
  checks: {
    foodCountPreserved: foods.length >= 200,
    imageCountPreserved: foods.filter(hasImage).length >= 200,
    placeholderZero: foods.filter((food) => !hasImage(food)).length === 0,
    displayOtherZero: displayOtherFoods.length === 0,
    cardSummariesDoNotContainOther: foods.every((food) => !displayAreaSummary(food).includes("その他"))
  }
};

mkdirSync(join(root, "scripts", "output"), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!Object.values(report.checks).every(Boolean)) {
  process.exitCode = 1;
}

function isVisibleFood(food: Food) {
  return (
    food.reviewStatus === "approved" &&
    food.canonicalFood !== false &&
    !food.hidden &&
    food.displayQuality !== "low" &&
    food.status !== "inactive" &&
    (food.nameQualityScore ?? 0) >= 60 &&
    (food.confidenceScore ?? 0) >= 45 &&
    !food.compositeMenu &&
    Boolean(food.sourceUrl) &&
    (
      food.shop?.name !== "店舗未確認" ||
      food.locations?.some((location) => location.shopName !== "店舗未確認") ||
      food.images?.some((image) => typeof image === "object" && image.enabled && image.sourceType === "official" && !image.isSharedTooMuch) ||
      /castel\.jp/i.test(food.sourceUrl ?? "")
    )
  );
}

function normalizeDisplayAreaName(value?: string | null) {
  if (isOtherLike(value)) return null;
  return value!.trim();
}

function foodContext(food: Food) {
  return [
    food.name,
    food.sourceUrl,
    food.officialUrl,
    food.sourceNames?.join(" "),
    food.eventName,
    food.collaborationName,
    food.description
  ].filter(Boolean).join(" ");
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
