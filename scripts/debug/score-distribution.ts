import fs from "node:fs";
import path from "node:path";
import { getFoodValueScore } from "../../lib/food-value-score";
import type { GeneratedDataset } from "../types/generated";

const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "output", "foods.generated.json"), "utf8")) as GeneratedDataset;
const foods = dataset.foods.filter((food) => food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden);

const scored = foods
  .map((food) => ({ id: food.id, name: food.name, score: getFoodValueScore(food, foods).total }))
  .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "ja"));

const report = {
  total: scored.length,
  score100: scored.filter((item) => item.score >= 100).length,
  score95Plus: scored.filter((item) => item.score >= 95).length,
  score90Plus: scored.filter((item) => item.score >= 90).length,
  top20: scored.slice(0, 20)
};

fs.writeFileSync(path.join(process.cwd(), "scripts", "output", "score-distribution.generated.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
