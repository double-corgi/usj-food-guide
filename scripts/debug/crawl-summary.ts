import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset } from "../types/generated";

const datasetPath = path.join(process.cwd(), "scripts", "output", "foods.generated.json");
const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8")) as GeneratedDataset;

const visible = dataset.foods.filter((food) => food.reviewStatus === "approved" && !food.hidden);
const pending = dataset.foods.filter((food) => food.reviewStatus === "pending" && !food.hidden);
const rejected = dataset.foods.filter((food) => food.reviewStatus === "rejected");

console.log("summary", dataset.summary);
console.log("visible", visible.length);
console.log("pending", pending.length);
console.log("rejected", rejected.length);
console.log("\napproved");
for (const food of visible.slice(0, 30)) {
  console.log(food.confidenceScore, food.name, food.rejectionReasons.join(","), food.sourceUrl);
}
console.log("\npending");
for (const food of pending.slice(0, 80)) {
  console.log(food.confidenceScore, food.name, food.rejectionReasons.join(","), food.sourceUrl);
}
