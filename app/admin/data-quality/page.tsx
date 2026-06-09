import fs from "node:fs";
import path from "node:path";
import { AlertTriangle, CalendarDays, Database, Image as ImageIcon, Link2, MapPin, ReceiptText, Store, Tags } from "lucide-react";
import Link from "next/link";
import { categoryLabels } from "@/lib/constants";
import { dedupeFoodsByCanonical, getCanonicalFoodKey, getFoodAreaSummary, getPriceSource, getPriceSourceLabel, getSaleEndDate, getSaleStartDate, getSaleStatus, isAreaOtherLike, isCompletableFood, isExactOtherAreaName, needsAreaReview, normalizeFoodName } from "@/lib/food-utils";
import { readGeneratedFoods } from "@/lib/repositories/generated-data";
import { getFoodImage } from "@/lib/utils/image";
import type { FoodCategory, FoodWithRelations } from "@/types/domain";

type QualityRow = {
  label: string;
  total: number;
  ok: number;
  missing: number;
  rate: string;
};

export default function DataQualityPage() {
  const foods = readGeneratedFoods({ includeHidden: true }).filter((food) => food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden);
  const canonicalFoods = dedupeFoodsByCanonical(foods);
  const canonicalGroups = groupBy(foods, getCanonicalFoodKey);
  const explicitDuplicateGroups = Array.from(canonicalGroups.values()).filter((group) => group.length >= 2);
  const duplicateCandidates = buildDuplicateCandidates(foods);
  const priceKnown = foods.filter(hasKnownPrice);
  const priceUnknown = foods.filter((food) => !hasKnownPrice(food));
  const imageFoods = foods.filter(hasPublicImage);
  const placeholderFoods = foods.filter((food) => getFoodImage(food).startsWith("/placeholders/"));
  const areaMissing = foods.filter((food) => isUnknownName(food.area?.name));
  const rawOtherAreaFoods = foods.filter((food) => isExactOtherAreaName(food.area?.name) || food.locations?.some((location) => isExactOtherAreaName(location.areaName)));
  const rawUnclassifiedAreaFoods = foods.filter((food) => isAreaOtherLike(food.area?.name) || food.locations?.some((location) => isAreaOtherLike(location.areaName)));
  const displayOtherAreaFoods = foods.filter((food) => getFoodAreaSummary(food).includes("その他"));
  const areaReviewNeeded = foods.filter(needsAreaReview);
  const multiLocationFoods = foods.filter((food) => (food.locations ?? []).length >= 2);
  const shopMissing = foods.filter((food) => isUnknownName(food.shop?.name));
  const categoryMissing = foods.filter((food) => food.category === "unknown");
  const sourceMissing = foods.filter((food) => !food.sourceUrl);
  const saleStatusMissing = foods.filter((food) => !food.saleStatus);
  const saleUnknown = foods.filter((food) => getSaleStatus(food) === "unknown");
  const activeStartMissing = foods.filter((food) => getSaleStatus(food) === "active" && !getSaleStartDate(food));
  const endedEndMissing = foods.filter((food) => getSaleStatus(food) === "ended" && !getSaleEndDate(food));
  const nonCompletableActiveMismatch = foods.filter((food) => getSaleStatus(food) !== "active" && food.isCompletable === true);
  const completableFoods = canonicalFoods.filter(isCompletableFood);
  const manualPriceDecisions = readManualPriceDecisions();
  const priceUnconfirmable = priceUnknown.filter((food) => manualPriceDecisions[food.id]?.status === "unconfirmable").length;
  const priceReviewed = priceKnown.length + priceUnconfirmable;
  const priceReviewOpen = Math.max(foods.length - priceReviewed, 0);
  const categoryRates = buildRateRows(foods, (food) => categoryLabels[food.category as FoodCategory] ?? food.category, hasKnownPrice);
  const areaRates = buildRateRows(foods, (food) => food.area?.name || "エリア未確認", hasKnownPrice);
  const priceSourceRows = buildSourceRows(foods);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/admin" className="text-sm font-black text-park underline underline-offset-2">
            管理画面へ戻る
          </Link>
          <h1 className="mt-2 text-3xl font-black text-ink">データ品質監査</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">
            200商品を維持したまま、価格・画像・店舗・エリア・カテゴリ・source_urlの未設定を確認します。推測価格は登録しません。
          </p>
        </div>
        <Link href="/admin/prices" className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-black text-white shadow-soft">
          価格確認センターへ
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric icon={Database} label="商品数" value={foods.length} />
        <Metric icon={ImageIcon} label="画像あり" value={imageFoods.length} />
        <Metric icon={AlertTriangle} label="placeholder" value={placeholderFoods.length} tone={placeholderFoods.length > 0 ? "warn" : "default"} />
        <Metric icon={ReceiptText} label="価格確認率" value={percent(priceKnown.length, foods.length)} tone={priceUnknown.length > 0 ? "warn" : "default"} />
        <Metric icon={ReceiptText} label="価格レビュー完了" value={percent(priceReviewed, foods.length)} tone={priceReviewOpen > 0 ? "warn" : "default"} />
        <Metric icon={MapPin} label="エリア設定率" value={percent(foods.length - areaMissing.length, foods.length)} tone={areaMissing.length > 0 ? "warn" : "default"} />
        <Metric icon={Store} label="店舗設定率" value={percent(foods.length - shopMissing.length, foods.length)} tone={shopMissing.length > 0 ? "warn" : "default"} />
        <Metric icon={CalendarDays} label="販売期間入力率" value={percent(foods.length - saleUnknown.length, foods.length)} tone={saleUnknown.length > 0 ? "warn" : "default"} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Tags} label="カテゴリ設定率" value={percent(foods.length - categoryMissing.length, foods.length)} tone={categoryMissing.length > 0 ? "warn" : "default"} />
        <Metric icon={Link2} label="source_url率" value={percent(foods.length - sourceMissing.length, foods.length)} tone={sourceMissing.length > 0 ? "warn" : "default"} />
        <Metric icon={ReceiptText} label="価格確認済" value={priceKnown.length} />
        <Metric icon={AlertTriangle} label="価格未確認" value={priceUnknown.length} tone="warn" />
        <Metric icon={ReceiptText} label="確認不能理由保存済" value={priceUnconfirmable} />
        <Metric icon={AlertTriangle} label="価格未レビュー" value={priceReviewOpen} tone={priceReviewOpen > 0 ? "warn" : "default"} />
        <Metric icon={CalendarDays} label="コンプ対象" value={completableFoods.length} />
        <Metric icon={Database} label="canonical商品" value={canonicalFoods.length} />
        <Metric icon={AlertTriangle} label="重複候補" value={duplicateCandidates.length} tone={duplicateCandidates.length > 0 ? "warn" : "default"} />
        <Metric icon={Database} label="canonical重複グループ" value={explicitDuplicateGroups.length} />
        <Metric icon={AlertTriangle} label="販売期間確認中" value={saleUnknown.length} tone={saleUnknown.length > 0 ? "warn" : "default"} />
        <Metric icon={MapPin} label="area=その他" value={rawOtherAreaFoods.length} tone={rawOtherAreaFoods.length > 0 ? "warn" : "default"} />
        <Metric icon={MapPin} label="表示上その他" value={displayOtherAreaFoods.length} tone={displayOtherAreaFoods.length > 0 ? "warn" : "default"} />
        <Metric icon={MapPin} label="raw未分類エリア" value={rawUnclassifiedAreaFoods.length} tone={rawUnclassifiedAreaFoods.length > 0 ? "warn" : "default"} />
        <Metric icon={AlertTriangle} label="エリア確認中" value={areaReviewNeeded.length} tone={areaReviewNeeded.length > 0 ? "warn" : "default"} />
        <Metric icon={Store} label="2箇所以上販売" value={multiLocationFoods.length} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-xl font-black text-ink">販売期間監査</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric icon={AlertTriangle} label="saleStatus未設定" value={saleStatusMissing.length} tone={saleStatusMissing.length > 0 ? "warn" : "default"} />
          <Metric icon={AlertTriangle} label="active開始日なし" value={activeStartMissing.length} tone={activeStartMissing.length > 0 ? "warn" : "default"} />
          <Metric icon={AlertTriangle} label="ended終了日なし" value={endedEndMissing.length} tone={endedEndMissing.length > 0 ? "warn" : "default"} />
          <Metric icon={AlertTriangle} label="unknown商品" value={saleUnknown.length} tone={saleUnknown.length > 0 ? "warn" : "default"} />
          <Metric icon={AlertTriangle} label="対象外混入疑い" value={nonCompletableActiveMismatch.length} tone={nonCompletableActiveMismatch.length > 0 ? "warn" : "default"} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <AuditPanel title="カテゴリ別 価格確認率" rows={categoryRates} />
        <AuditPanel title="エリア別 価格確認率" rows={areaRates} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-xl font-black text-ink">価格ソース内訳</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {priceSourceRows.map((row) => (
            <div key={row.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">{row.label}</p>
              <p className="mt-1 text-2xl font-black text-ink">{row.total}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <MissingList title="価格未確認" foods={priceUnknown} field="price" />
        <MissingList title="エリア未設定" foods={areaMissing} field="area" />
        <MissingList title="area=その他" foods={rawOtherAreaFoods} field="area" />
        <MissingList title="表示上その他" foods={displayOtherAreaFoods} field="area" />
        <MissingList title="raw未分類エリア" foods={rawUnclassifiedAreaFoods} field="area" />
        <MissingList title="エリア確認中" foods={areaReviewNeeded} field="area" />
        <MissingList title="2箇所以上販売" foods={multiLocationFoods} field="area" />
        <MissingList title="重複候補" foods={duplicateCandidates.flatMap((group) => group.foods).slice(0, 80)} field="source" />
        <MissingList title="店舗未設定" foods={shopMissing} field="shop" />
        <MissingList title="カテゴリ未設定" foods={categoryMissing} field="category" />
        <MissingList title="source_url未設定" foods={sourceMissing} field="source" />
        <MissingList title="販売期間確認中" foods={saleUnknown} field="sale" />
        <MissingList title="販売開始日未設定(active)" foods={activeStartMissing} field="sale" />
        <MissingList title="販売終了日未設定(ended)" foods={endedEndMissing} field="sale" />
      </section>
    </div>
  );
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
}

function buildDuplicateCandidates(foods: FoodWithRelations[]) {
  const groups = groupBy(foods, (food) => [
    normalizeFoodName(food.name),
    food.priceMin ?? food.price ?? "unknown-price",
    food.shop?.name ?? "unknown-shop",
    getFoodAreaSummary(food)
  ].join("|"));
  return Array.from(groups.entries())
    .filter(([, group]) => group.length >= 2)
    .map(([key, group]) => ({ key, foods: group }));
}

function Metric({
  icon: Icon,
  label,
  value,
  tone = "default"
}: {
  icon: typeof Database;
  label: string;
  value: string | number;
  tone?: "default" | "warn";
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-soft ${tone === "warn" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <Icon className={tone === "warn" ? "text-amber-700" : "text-park"} size={22} aria-hidden />
      <p className="mt-3 text-sm font-bold text-slate-500">{label}</p>
      <p className="text-3xl font-black text-ink">{value}</p>
    </div>
  );
}

function AuditPanel({ title, rows }: { title: string; rows: QualityRow[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-xl font-black text-ink">{title}</h2>
      <div className="mt-4 divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[1fr_auto] gap-4 py-3">
            <div className="min-w-0">
              <p className="line-clamp-1 text-sm font-black text-ink">{row.label}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                確認済{row.ok}/{row.total} / 未確認{row.missing}
              </p>
            </div>
            <p className="text-lg font-black text-park">{row.rate}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MissingList({ title, foods, field }: { title: string; foods: FoodWithRelations[]; field: "price" | "area" | "shop" | "category" | "source" | "sale" }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-xl font-black text-ink">{title}</h2>
        <p className="text-sm font-black text-berry">{foods.length}件</p>
      </div>
      <div className="mt-4 max-h-[520px] divide-y divide-slate-100 overflow-y-auto">
        {foods.slice(0, 80).map((food) => (
          <div key={`${title}-${food.id}`} className="grid grid-cols-[72px_1fr] gap-3 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getFoodImage(food)} alt="" className="h-16 w-[72px] rounded-xl object-cover" />
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-black text-ink">{food.name}</p>
              <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-500">
                {categoryLabels[food.category] ?? food.category} / {getFoodAreaSummary(food)} / {food.shop?.name ?? "店舗未確認"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-black">
                <Link href={`/admin/prices?status=missing&bucket=すべて`} className="rounded-full bg-mint px-2 py-1 text-park">
                  価格確認へ
                </Link>
                {food.sourceUrl ? (
                  <a href={food.sourceUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                    source
                  </a>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">sourceなし</span>
                )}
                <span className="rounded-full bg-slate-50 px-2 py-1 text-slate-500">{field}</span>
              </div>
            </div>
          </div>
        ))}
        {foods.length === 0 ? <p className="rounded-xl bg-slate-50 p-5 text-sm font-bold text-slate-500">対象はありません。</p> : null}
      </div>
    </section>
  );
}

function hasKnownPrice(food: FoodWithRelations) {
  return Boolean(food.price ?? food.priceMin ?? food.locations?.find((location) => location.price)?.price);
}

function hasPublicImage(food: FoodWithRelations) {
  return !getFoodImage(food).startsWith("/placeholders/");
}

function isUnknownName(value?: string) {
  return !value || /未確認|不明|unknown|その他/i.test(value);
}

function buildRateRows(foods: FoodWithRelations[], getLabel: (food: FoodWithRelations) => string, isOk: (food: FoodWithRelations) => boolean): QualityRow[] {
  const stats = new Map<string, QualityRow>();
  for (const food of foods) {
    const label = getLabel(food) || "未確認";
    const current = stats.get(label) ?? { label, total: 0, ok: 0, missing: 0, rate: "0%" };
    current.total += 1;
    if (isOk(food)) current.ok += 1;
    else current.missing += 1;
    current.rate = percent(current.ok, current.total);
    stats.set(label, current);
  }
  return Array.from(stats.values()).sort((a, b) => a.ok / Math.max(a.total, 1) - b.ok / Math.max(b.total, 1) || b.missing - a.missing || a.label.localeCompare(b.label, "ja"));
}

function buildSourceRows(foods: FoodWithRelations[]) {
  const labels = ["official", "official_app", "menu_photo", "trusted_report", "social_report", "unknown"] as const;
  return labels.map((source) => ({
    label: getPriceSourceLabel(source),
    total: foods.filter((food) => getPriceSource(food) === source).length
  }));
}

function readManualPriceDecisions(): Record<string, { status?: string }> {
  const filePath = path.join(process.cwd(), "scripts", "output", "manual-price-decisions.json");
  try {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, { status?: string }>;
  } catch {
    return {};
  }
}

function percent(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 1000) / 10}%`;
}
