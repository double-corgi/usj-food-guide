import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset } from "../types/generated";

const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "output", "foods.generated.json"), "utf8")) as GeneratedDataset;
const targetIds = new Set([
  "food-xagefj",
  "food-1tt4lsm",
  "food-6vmlhh",
  "food-yf0vco",
  "food-mioln1",
  "food-1u1wwri",
  "food-xitytu",
  "food-13ex3cf",
  "food-1rhhv0e",
  "food-1fmms6w",
  "food-c4k9tn",
  "food-17k66nk",
  "food-7yyri",
  "food-1t33gzj",
  "food-1pc1exr"
]);

const foods = dataset.foods.filter((food) => targetIds.has(food.id));
const urls = Array.from(new Set(foods.map((food) => food.sourceUrl).filter(Boolean)));
const out: Array<{ url: string; food: string; contexts: string[]; nearbyLocationWords: string[] }> = [];

for (const url of urls) {
  const response = await fetch(url);
  const raw = await response.text();
  const strings = extractStrings(raw);
  const joined = strings.join("\n").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const locationWords = strings
    .filter((value) => /レストラン|カフェ|カート|販売場所|場所|エリア|ロンバーズ|フィネガンズ|スタジオ|ルイズ|シネマ|フード/.test(value))
    .map((value) => value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 80);

  for (const food of foods.filter((item) => item.sourceUrl === url)) {
    const needles = nameNeedles(food.name);
    const contexts = needles.flatMap((needle) => contextAround(joined, needle)).slice(0, 12);
    out.push({ url, food: `${food.id} ${food.name}`, contexts, nearbyLocationWords: locationWords });
  }
}

const outputPath = path.join(process.cwd(), "scripts", "output", "official-context-inspection.generated.json");
fs.writeFileSync(outputPath, `${JSON.stringify(out, null, 2)}\n`);
console.log(JSON.stringify(out, null, 2));

function extractStrings(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    const strings: string[] = [];
    const walk = (value: unknown) => {
      if (!value) return;
      if (typeof value === "string") strings.push(value);
      else if (Array.isArray(value)) value.forEach(walk);
      else if (typeof value === "object") Object.values(value as Record<string, unknown>).forEach(walk);
    };
    walk(parsed);
    return strings;
  } catch {
    return [raw];
  }
}

function nameNeedles(name: string) {
  const normalized = name.replace(/[~〜].*$/, "").replace(/[（(].*$/, "").trim();
  const parts = [name, normalized, ...name.split(/[ ~〜&＆・]/).filter((part) => part.length >= 4)];
  return Array.from(new Set(parts)).filter(Boolean);
}

function contextAround(text: string, needle: string) {
  const contexts: string[] = [];
  let index = text.indexOf(needle);
  while (index >= 0 && contexts.length < 3) {
    contexts.push(text.slice(Math.max(0, index - 260), Math.min(text.length, index + needle.length + 260)));
    index = text.indexOf(needle, index + needle.length);
  }
  return contexts;
}
