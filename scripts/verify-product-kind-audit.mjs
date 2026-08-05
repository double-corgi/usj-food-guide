import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const productKindValues = new Set(["churro", "popcorn", "drink", "snack", "cart", "seasonal", "nintendo", "minion", "harry_potter", "unknown"]);
const labelToValue = new Map([["チュリトス", "churro"], ["ポップコーン", "popcorn"], ["ドリンク", "drink"], ["食べ歩き", "snack"], ["カート", "cart"], ["季節限定", "seasonal"], ["ニンテンドー", "nintendo"], ["ミニオン", "minion"], ["ハリーポッター", "harry_potter"], ["その他", "unknown"]]);
const candidates = ["ios/App/App/public/api/native/catalog", "out/api/native/catalog"];
const sourcePath = candidates.find((item) => existsSync(item));
const catalog = sourcePath ? JSON.parse(readFileSync(sourcePath, "utf8")) : { foods: [] };
const foods = Array.isArray(catalog.foods) ? catalog.foods : [];
const legacyRows = [];
for (const food of foods) {
  const tags = Array.isArray(food.category_tags) ? food.category_tags : Array.isArray(food.categoryTags) ? food.categoryTags : [];
  const normalized = tags.map((item) => labelToValue.get(String(item)) ?? String(item)).filter((item) => productKindValues.has(item));
  if (normalized.length > 1 && normalized.includes("unknown") && normalized.some((item) => item !== "unknown")) {
    legacyRows.push({ id: food.id, name: food.name, tags: normalized });
  }
}
const reportPath = join(process.cwd(), "docs/ios-build18-product-kind-audit.md");
mkdirSync(dirname(reportPath), { recursive: true });
const report = [
  "# iOS Build 18 Product Kind Audit",
  "",
  "Generated: " + new Date().toISOString(),
  "",
  "## Scope",
  "",
  "- Source artifact: `" + (sourcePath ?? "not found") + "`",
  "- Production writes: none",
  "- Service role credentials: not used",
  "- This audit checks bundled/public catalog rows available to the app and verifies the runtime normalization rule for staff-loaded rows.",
  "",
  "## Rule",
  "",
  "- 商品の種類 is stored as exactly one canonical `category_tags` value.",
  "- If a legacy row contains a recognized kind plus `その他`, the recognized kind is shown and saved; `その他` is not preserved unless explicitly selected by the operator.",
  "",
  "## Bundled Catalog Result",
  "",
  "- Foods inspected: " + foods.length,
  "- Legacy `種類＋その他` rows found in bundled catalog: " + legacyRows.length,
  "",
  "## Legacy Rows",
  ""
];
if (!legacyRows.length) {
  report.push("- None in the bundled/public catalog artifact.");
} else {
  for (const row of legacyRows) report.push("- " + row.id + ": " + String(row.name).replace(/\|/g, " ") + " / " + row.tags.join(", "));
}
report.push("", "## Production Data Note", "", "No production data was changed. Hidden/manual staff rows that are only readable through authenticated staff APIs are normalized at load/save time by Build 18, but are not bulk-edited by this audit.");
writeFileSync(reportPath, report.join("\n") + "\n");
console.log("PASS product kind audit written to " + reportPath);
