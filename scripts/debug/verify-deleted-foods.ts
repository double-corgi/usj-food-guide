import fs from "node:fs";
import path from "node:path";
import { deletedFoodIds } from "@/lib/deleted-foods";
import { readGeneratedFoods } from "@/lib/repositories/generated-data";
import { listFoods } from "@/lib/repositories/foods";
import type { FoodWithRelations } from "@/types/domain";

const outputPath = path.join(process.cwd(), "scripts", "output", "deleted-foods-audit.generated.json");

const targetNames = [
  "アイゼン&ハイターのハンバーグとフィッシュ&チップスプレート",
  "アイゼン＆ハイターのハンバーグとフィッシュ＆チップスプレート",
  "ヤクルト・ソフトクリームサンデー ~マンゴー~",
  "ヤクルト・ソフトクリームサンデー ～マンゴー～",
  "モンスターハンター・ワイルズ×USJ限定コースターセット",
  "モンスターハンターワイルズ×USJ限定コースターセット",
  "プーギーチュリトス〜ピーチ〜",
  "プーギーチュリトス～ピーチ～",
  "スプラッシュ!ゼニガメ・チュリトス~バニラフレーバー~",
  "スプラッシュ！ゼニガメ・チュリトス〜バニラフレーバー",
  "スパイダーマン・チュリトス~ラズベリー~",
  "スパイダーマン・チュリトス〜ラズベリー〜",
  "ストロベリーチュリトス",
  "サポート部隊アイルー・キッズセット",
  "クリスマス・チョコ・チュリトス",
  "オトモアイルーのチョコレートプリン マグカップ付"
];

function normalizeName(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ \t\n\r"'“”‘’・〜～‐‑‒–—―_()（）［\]\[\]【】!！.,，、。:：]/g, "")
    .replace(/＆/g, "&");
}

const targetKeys = new Set(targetNames.map(normalizeName));
const chocoCookieKey = normalizeName("チョコ&クッキー・チュリトス");

function isTargetFood(food: Pick<FoodWithRelations, "id" | "name"> & { normalizedName?: string; normalized_name?: string }) {
  if (deletedFoodIds.has(food.id)) return true;
  const keys = [food.name, food.normalizedName, food.normalized_name].filter((value): value is string => Boolean(value)).map(normalizeName);
  return keys.some((key) => targetKeys.has(key) || key.includes(chocoCookieKey));
}

function hasDisplayImage(food: FoodWithRelations) {
  return Boolean(food.representativeImageUrl || food.images?.some((image) => image.imageUrl));
}

async function main() {
  const generatedFoods = readGeneratedFoods({ includeHidden: true });
  const publicFoods = await listFoods();
  const generatedMatches = generatedFoods.filter(isTargetFood).map((food) => ({ id: food.id, name: food.name }));
  const publicMatches = publicFoods.filter(isTargetFood).map((food) => ({ id: food.id, name: food.name }));
  const publicPlaceholderFoods = publicFoods.filter((food) => {
    const image = food.representativeImageUrl ?? food.images?.find((candidate) => candidate.imageUrl)?.imageUrl ?? "";
    return image.includes("/placeholders/");
  });

  const report = {
    generatedAt: new Date().toISOString(),
    deletedFoodIdCount: deletedFoodIds.size,
    generatedFoodCount: generatedFoods.length,
    publicFoodCount: publicFoods.length,
    publicImageCount: publicFoods.filter(hasDisplayImage).length,
    publicPlaceholderCount: publicPlaceholderFoods.length,
    generatedTargetMatches: generatedMatches,
    publicTargetMatches: publicMatches,
    passed: generatedMatches.length === 0 && publicMatches.length === 0 && publicPlaceholderFoods.length === 0
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

