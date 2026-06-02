import fs from "node:fs";
import path from "node:path";
import { getFoodImage } from "../../lib/utils/image";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";

const root = process.cwd();
const dataset = JSON.parse(fs.readFileSync(path.join(root, "scripts", "output", "foods.generated.json"), "utf8")) as GeneratedDataset;
const foods = dataset.foods.filter((food) => food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden);

const files = {
  home: read("components/home-dashboard.tsx"),
  card: read("components/food-card.tsx"),
  detail: read("components/food-detail.tsx"),
  score: read("lib/food-value-score.ts")
};

const homeAndCards = `${files.home}\n${files.card}`;
const legacyRankingLabels = ["限定TOP5", "コスパTOP5", "SNS話題TOP5", "初心者向けTOP5", "まずUSJなら", "コスパ重視", "SNS映え"];
const preferredRankingLabels = ["限定フード", "コスパ最強", "SNSで人気", "初めてならこれ", "新着追加"];
const thumbnailPriceLabels = ["価格確認済", "確認済", "価格確認中", "価格未確認", "公開情報確認中"];
const popularGenreLabels = ["すべて", "チュリトス", "ポップコーン", "ドリンク", "ピザ", "バーガー", "スイーツ", "キッズ"];
const nonPopularGenreLabels = ["パスタ", "プレート", "ライス"];

const priceKnown = foods.filter(hasKnownPrice).length;
const imageTotal = foods.filter((food) => !getFoodImage(food as never).startsWith("/placeholders/")).length;
const placeholderCount = foods.length - imageTotal;

const checks = [
  check("food 200件維持", foods.length >= 200, foods.length),
  check("画像200件維持", imageTotal >= 200, imageTotal),
  check("placeholder 0維持", placeholderCount === 0, placeholderCount),
  check("価格確認率96%以上", priceKnown / Math.max(foods.length, 1) >= 0.96, `${priceKnown}/${foods.length}`),
  check("旧ランキング名がホームから消えている", missingAll(files.home, legacyRankingLabels), presentIn(files.home, legacyRankingLabels)),
  check("人間向けランキング名が揃っている", presentAll(files.home, preferredRankingLabels), missingFrom(files.home, preferredRankingLabels)),
  check("ホーム/商品カードの価格確認ラベルが消えている", missingAll(homeAndCards, thumbnailPriceLabels), presentIn(homeAndCards, thumbnailPriceLabels)),
  check("人気ジャンルのみホームに表示", presentAll(files.home, popularGenreLabels) && missingAll(files.home, nonPopularGenreLabels.map((label) => `homeCategoryLabels.has("${label}")`)), presentIn(files.home, popularGenreLabels)),
  check("詳細フィルタ導線が探す画面へ集約", files.home.includes("詳細フィルタへ") && files.home.includes('href="/foods"'), "詳細フィルタへ"),
  check("攻略スコアが詳細で意味付き表示", presentAll(files.detail, ["攻略スコア", "スコアの見方", "選ぶ理由", "注意ポイント", "向いている人", "向いていない人"]), missingFrom(files.detail, ["攻略スコア", "スコアの見方", "選ぶ理由", "注意ポイント", "向いている人", "向いていない人"])),
  check("攻略スコアがホームカードにも表示", files.home.includes("攻略{score.total}点"), "攻略{score.total}点"),
  check("価格ソースと確認日が詳細のみで確認可能", files.detail.includes("getPriceSourceLabel(priceSource)") && files.detail.includes("priceLastCheckedAt"), "price source / checked date"),
  check("初心者に分かりにくいスコア語を除去", missingAll(`${files.detail}\n${files.score}`, ["待機コスト", "入手性"]), presentIn(`${files.detail}\n${files.score}`, ["待機コスト", "入手性"]))
];

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    foodTotal: foods.length,
    imageTotal,
    placeholderCount,
    priceKnown,
    priceUnknown: foods.length - priceKnown,
    priceRate: `${Math.round((priceKnown / Math.max(foods.length, 1)) * 1000) / 10}%`
  },
  checks,
  passed: checks.every((item) => item.ok)
};

const outputPath = path.join(root, "scripts", "output", "public-quality-audit.generated.json");
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (!report.passed) {
  process.exitCode = 1;
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function hasKnownPrice(food: GeneratedFood) {
  return Boolean(food.priceMin ?? food.price ?? food.locations?.find((location) => location.price)?.price);
}

function check(name: string, ok: boolean, evidence: unknown) {
  return { name, ok, evidence };
}

function presentAll(source: string, values: string[]) {
  return values.every((value) => source.includes(value));
}

function missingAll(source: string, values: string[]) {
  return values.every((value) => !source.includes(value));
}

function presentIn(source: string, values: string[]) {
  return values.filter((value) => source.includes(value));
}

function missingFrom(source: string, values: string[]) {
  return values.filter((value) => !source.includes(value));
}
