import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";
import { normalizeFoodName, similarity } from "../utils/normalize-food";

const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "output", "foods.generated.json"), "utf8")) as GeneratedDataset;

const visible = dataset.foods.filter((food) => food.canonicalFood && food.reviewStatus === "approved" && !food.hidden && food.displayQuality !== "low" && food.nameQualityScore >= 60);
const withImages = dataset.foods.filter((food) => food.images.some((image) => image.enabled && image.imageVerified && image.sourceType === "official"));
const missing = visible.filter((food) => !food.images.some((image) => image.enabled && image.imageVerified && image.sourceType === "official"));

const candidates = missing
  .map((food) => {
    const matches = withImages
      .filter((candidate) => candidate.category === food.category)
      .map((candidate) => ({ candidate, score: matchScore(food, candidate) }))
      .filter((match) => match.score >= 0.72)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    return {
      food: food.name,
      category: food.category,
      source: food.sourceUrl,
      matches: matches.map((match) => ({
        score: Number(match.score.toFixed(3)),
        name: match.candidate.name,
        source: match.candidate.sourceUrl,
        image: match.candidate.images.find((image) => image.enabled && image.imageVerified)?.imageUrl
      }))
    };
  })
  .filter((entry) => entry.matches.length > 0);

console.log(JSON.stringify({ missing: missing.length, candidates: candidates.length, samples: candidates.slice(0, 80) }, null, 2));

function matchScore(left: GeneratedFood, right: GeneratedFood) {
  const leftNorm = normalizeFoodName(left.name);
  const rightNorm = normalizeFoodName(right.name);
  if (leftNorm === rightNorm) return 1;
  const byName = similarity(left.name, right.name);
  const leftTokens = tokenSet(left.name);
  const rightTokens = tokenSet(right.name);
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length / Math.max(1, Math.min(leftTokens.size, rightTokens.size));
  return Math.max(byName, overlap);
}

function tokenSet(value: string) {
  return new Set(
    value
      .normalize("NFKC")
      .split(/[・\s~〜、。&/／()（）【】「」!'".-]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !/チュリトス|チュロス|ドリンク|セット|フード|メニュー|スペシャル/.test(token))
  );
}
