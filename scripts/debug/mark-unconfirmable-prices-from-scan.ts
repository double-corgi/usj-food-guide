import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";

type ManualDecision = {
  status?: string;
  reason?: string;
  reasonCode?: string;
  checkedSourceUrl?: string;
  updatedAt?: string;
};

const outputDir = path.join(process.cwd(), "scripts", "output");
const datasetPath = path.join(outputDir, "foods.generated.json");
const decisionsPath = path.join(outputDir, "manual-price-decisions.json");
const reportPath = path.join(outputDir, "manual-price-unconfirmable.generated.json");

const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8")) as GeneratedDataset;
const decisions = readJson<Record<string, ManualDecision>>(decisionsPath, {});
const now = new Date().toISOString();
let added = 0;
let keptConfirmed = 0;
let keptExisting = 0;
let refreshed = 0;

for (const food of visibleFoods(dataset.foods)) {
  if (hasKnownPrice(food)) continue;
  const existing = decisions[food.id];
  if (existing?.status === "confirmed") {
    keptConfirmed += 1;
    continue;
  }
  const reasonCode = missingPriceReason(food);
  if (existing?.status === "unconfirmable" && existing.reasonCode === reasonCode && existing.checkedSourceUrl === food.sourceUrl) {
    keptExisting += 1;
    continue;
  }
  decisions[food.id] = {
    ...(existing ?? {}),
    status: "unconfirmable",
    reasonCode,
    reason: labelForReason(reasonCode),
    checkedSourceUrl: food.sourceUrl,
    updatedAt: now
  };
  if (existing?.status === "unconfirmable") refreshed += 1;
  else added += 1;
}

fs.writeFileSync(decisionsPath, `${JSON.stringify(sortObject(decisions), null, 2)}\n`);
const report = {
  generatedAt: now,
  foodTotal: visibleFoods(dataset.foods).length,
  priceKnown: visibleFoods(dataset.foods).filter(hasKnownPrice).length,
  priceUnknown: visibleFoods(dataset.foods).filter((food) => !hasKnownPrice(food)).length,
  addedUnconfirmable: added,
  refreshedUnconfirmable: refreshed,
  keptConfirmed,
  keptExistingUnconfirmable: keptExisting,
  unconfirmableTotal: Object.values(decisions).filter((decision) => decision.status === "unconfirmable").length,
  reasonStats: buildReasonStats(decisions)
};
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function visibleFoods(foods: GeneratedFood[]) {
  return foods.filter((food) => food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden);
}

function hasKnownPrice(food: GeneratedFood) {
  return Boolean(food.price ?? food.priceMin ?? food.price_min ?? food.locations?.find((location) => location.price)?.price);
}

function missingPriceReason(food: GeneratedFood) {
  if (!food.sourceUrl) return "source_url_missing";
  if (food.category === "set" || food.category === "kids") return "set_or_size_ambiguous";
  if (isUnknownName(food.shop.name) || isUnknownName(food.area.name)) return "shop_page_check_required";
  if (/\.pdf/i.test(food.sourceUrl)) return "pdf_manual_check_required";
  return "official_exact_price_not_found";
}

function isUnknownName(value?: string) {
  return !value || /未確認|不明|unknown/i.test(value);
}

function labelForReason(reasonCode: string) {
  const labels: Record<string, string> = {
    source_url_missing: "source_url未設定のため公式価格照合不可",
    official_exact_price_not_found: "公式ページで同一商品ブロックの価格を確認できず",
    product_name_mismatch: "商品名一致なし",
    only_similar_product_found: "類似商品のみで同一商品と断定不可",
    set_or_size_ambiguous: "セット/サイズ違いがあり価格の同一性を断定不可",
    pdf_manual_check_required: "PDF手動確認待ち",
    shop_page_check_required: "店舗またはエリア未確認のため店舗ページ照合が必要",
    trusted_report_needed: "公式外の高信頼レポート確認待ち"
  };
  return labels[reasonCode] ?? "価格根拠を確認できず";
}

function sortObject<T>(value: Record<string, T>) {
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}

function buildReasonStats(decisions: Record<string, ManualDecision>) {
  const stats = new Map<string, number>();
  for (const decision of Object.values(decisions)) {
    if (decision.status !== "unconfirmable") continue;
    const key = decision.reasonCode ?? "unknown";
    stats.set(key, (stats.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(Array.from(stats.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}
