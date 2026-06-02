import fs from "node:fs";
import path from "node:path";

const url = "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/kids-menu/index.html";
const targets = ["サンドウィッチ・キッズプレート", "カレー・キッズプレート", "キッズ・ハンバーガーセット"];

const response = await fetch(url);
const data = await response.json();
const matches: Array<{
  target: string;
  path: string;
  strings: string[];
  prices: string[];
  locations: string[];
}> = [];

walk(data, [], (value, objectPath) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const strings = collectStrings(value);
  const text = strings.join(" ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  for (const target of targets) {
    if (!text.includes(target)) continue;
    matches.push({
      target,
      path: objectPath.join("."),
      strings: strings
        .map((item) => item.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .slice(0, 120),
      prices: Array.from(text.matchAll(/[￥¥]\s?[\d,]+/g)).map((match) => match[0]),
      locations: Array.from(text.matchAll(/販売場所：\s*([^￥]+?)(?=(?:[￥¥]\s?[\d,]+|$))/g)).map((match) => match[1].trim())
    });
  }
});

const outputPath = path.join(process.cwd(), "scripts", "output", "kids-menu-offer-card-context.generated.json");
fs.writeFileSync(outputPath, `${JSON.stringify({ url, generatedAt: new Date().toISOString(), matches }, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, matches: matches.length, targets: summarize(matches) }, null, 2));

function walk(value: unknown, objectPath: string[], visit: (value: unknown, objectPath: string[]) => void) {
  visit(value, objectPath);
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, [...objectPath, String(index)], visit));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      walk(child, [...objectPath, key], visit);
    }
  }
}

function collectStrings(value: unknown): string[] {
  const strings: string[] = [];
  const collect = (item: unknown) => {
    if (!item) return;
    if (typeof item === "string") strings.push(item);
    else if (Array.isArray(item)) item.forEach(collect);
    else if (typeof item === "object") Object.values(item as Record<string, unknown>).forEach(collect);
  };
  collect(value);
  return strings;
}

function summarize(items: typeof matches) {
  const byTarget: Record<string, number> = {};
  for (const item of items) byTarget[item.target] = (byTarget[item.target] ?? 0) + 1;
  return byTarget;
}
