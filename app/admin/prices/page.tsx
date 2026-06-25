import fs from "node:fs";
import path from "node:path";
import { AlertTriangle, ReceiptText } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { categoryLabels } from "@/lib/constants";
import { getFoodAreaSummary, getPriceSource, getPriceSourceLabel, getSaleEndDate, getSaleStartDate, needsAreaReview } from "@/lib/food-utils";
import { readGeneratedFoods } from "@/lib/repositories/generated-data";
import type { FoodCategory, FoodWithRelations, PriceSource } from "@/types/domain";
import { recordDuplicateDecision } from "./actions";
import { PriceReviewCard } from "./price-review-card";

type Bucket =
  | "チュリトス"
  | "ピザ"
  | "バーガー"
  | "プレート"
  | "パスタ"
  | "ライス"
  | "キッズ"
  | "ドリンク"
  | "デザート"
  | "分類確認中";

type PriceFilter = "missing" | "all";
type BucketFilter = Bucket | "すべて";
type SourceFilter = "all" | "withSource" | "withoutSource";
type PriceSourceFilter = PriceSource | "all";
type ImageFilter = "all" | "withImage";
type AdminPriceSearchParams = Promise<{
  status?: string;
  bucket?: string;
  shop?: string;
  area?: string;
  source?: string;
  priceSource?: string;
  image?: string;
}>;

const bucketFilters: BucketFilter[] = ["すべて", "ドリンク", "デザート", "バーガー", "プレート", "ピザ", "パスタ", "キッズ", "ライス", "チュリトス", "分類確認中"];

export default async function AdminPricesPage({ searchParams }: { searchParams?: AdminPriceSearchParams }) {
  const params = (await searchParams) ?? {};
  const priceFilter: PriceFilter = params.status === "all" ? "all" : "missing";
  const bucketFilter = isBucketFilter(params.bucket) ? params.bucket : "すべて";
  const shopFilter = String(params.shop ?? "すべて");
  const areaFilter = String(params.area ?? "すべて");
  const sourceFilter: SourceFilter = params.source === "withoutSource" ? "withoutSource" : params.source === "withSource" ? "withSource" : "all";
  const priceSourceFilter: PriceSourceFilter = isPriceSourceFilter(params.priceSource) ? params.priceSource : "all";
  const imageFilter: ImageFilter = params.image === "withImage" ? "withImage" : "all";
  const foods = readGeneratedFoods({ includeHidden: true }).filter((food) => food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden);
  const manualDecisions = readManualPriceDecisions();
  const missing = foods.filter((food) => !hasKnownPrice(food)).sort((a, b) => bucketFor(a.category).localeCompare(bucketFor(b.category), "ja") || a.name.localeCompare(b.name, "ja"));
  const known = foods.length - missing.length;
  const duplicateCandidates = buildDuplicateCandidates(foods);
  const duplicateFoodIds = new Set(duplicateCandidates.flatMap((candidate) => [candidate.food.id, candidate.other.id]));
  const shopUnknown = foods.filter((food) => isUnknownName(food.shop.name)).length;
  const areaUnknown = foods.filter((food) => needsAreaReview(food)).length;
  const sourceMissing = foods.filter((food) => !food.sourceUrl).length;
  const priceSourceStats = buildPriceSourceStats(foods);
  const categoryPending = foods.filter((food) => food.category === "unknown" || bucketFor(food.category) === "分類確認中").length;
  const salePeriodMissing = foods.filter((food) => !getSaleStartDate(food) && !getSaleEndDate(food)).length;
  const saleEndMissing = foods.filter((food) => !getSaleEndDate(food)).length;
  const highPriorityOpen = foods.filter((food) => {
    const priceOpen = !hasKnownPrice(food) && manualDecisions[food.id]?.status !== "unconfirmable";
    return priceOpen || isUnknownName(food.shop.name) || needsAreaReview(food) || food.category === "unknown" || !food.sourceUrl;
  }).length;
  const categoryStats = buildCategoryStats(foods);
  const shopStats = buildNameStats(foods, (food) => food.shop.name);
  const areaStats = buildNameStats(foods, (food) => getFoodAreaSummary(food));
  const sourceUrlRate = percent(foods.length - sourceMissing, foods.length);
  const shopRate = percent(foods.length - shopUnknown, foods.length);
  const areaRate = percent(foods.length - areaUnknown, foods.length);
  const missingWithSource = missing.filter((food) => Boolean(food.sourceUrl)).length;
  const missingWithoutSource = missing.length - missingWithSource;
  const informationShortage = missing.filter((food) => !food.sourceUrl || isUnknownName(food.shop.name) || needsAreaReview(food)).length;
  const priceUnconfirmed = missing.length - informationShortage;
  const unconfirmableCount = missing.filter((food) => manualDecisions[food.id]?.status === "unconfirmable").length;
  const priceReviewed = known + unconfirmableCount;
  const priceReviewOpen = Math.max(foods.length - priceReviewed, 0);
  const priceReviewRate = percent(priceReviewed, foods.length);
  const displayFoods = (priceFilter === "missing" ? missing : foods)
    .filter((food) => bucketFilter === "すべて" || bucketFor(food.category) === bucketFilter)
    .filter((food) => shopFilter === "すべて" || food.shop.name === shopFilter)
    .filter((food) => areaFilter === "すべて" || getFoodAreaSummary(food) === areaFilter)
    .filter((food) => sourceFilter === "all" || (sourceFilter === "withSource" ? Boolean(food.sourceUrl) : !food.sourceUrl))
    .filter((food) => priceSourceFilter === "all" || getPriceSource(food) === priceSourceFilter)
    .filter((food) => imageFilter === "all" || hasPublicImage(food))
    .sort((a, b) => reviewPriorityScore(b, duplicateFoodIds.has(b.id), manualDecisions[b.id]?.status === "unconfirmable") - reviewPriorityScore(a, duplicateFoodIds.has(a.id), manualDecisions[a.id]?.status === "unconfirmable") || compareForPriceWork(a, b));
  const displayLabel = `${priceFilter === "missing" ? "価格未確認" : "全価格状態"} / ${bucketFilter}`;
  const currentParams = { status: priceFilter, bucket: bucketFilter, shop: shopFilter, area: areaFilter, source: sourceFilter, priceSource: priceSourceFilter, image: imageFilter };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/admin" className="text-sm font-black text-park underline underline-offset-2">
            管理画面へ戻る
          </Link>
          <h1 className="mt-2 text-3xl font-black text-ink">データ監査センター</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">価格、店舗、エリア、URL、重複、カテゴリを1画面で確認します。推測価格は登録せず、画像とfood件数は維持します。</p>
        </div>
        <div className="rounded-2xl border border-park/15 bg-mint px-5 py-4 text-sm font-black text-ink">
          価格確認率 {percent(known, foods.length)} / レビュー完了 {priceReviewRate}
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="総商品" value={foods.length} />
        <Stat label="画像あり" value={foods.filter(hasPublicImage).length} />
        <Stat label="画像未設定" value={foods.filter((food) => primaryImage(food).startsWith("/placeholders/")).length} />
        <Stat label="高優先度未対応" value={highPriorityOpen} tone="warn" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-8">
        <Stat label="価格設定済み" value={known} />
        <Stat label="価格未確認" value={missing.length} tone="warn" />
        <Stat label="価格未レビュー" value={priceReviewOpen} tone={priceReviewOpen > 0 ? "warn" : "default"} />
        <Stat label="情報不足" value={informationShortage} tone={informationShortage > 0 ? "warn" : "default"} />
        <Stat label="店舗未確認" value={shopUnknown} tone={shopUnknown > 0 ? "warn" : "default"} />
        <Stat label="エリア未確認" value={areaUnknown} tone={areaUnknown > 0 ? "warn" : "default"} />
        <Stat label="出典URL未確認" value={sourceMissing} tone={sourceMissing > 0 ? "warn" : "default"} />
        <Stat label="販売期間未設定" value={salePeriodMissing} tone={salePeriodMissing > 0 ? "warn" : "default"} />
        <Stat label="販売終了日未設定" value={saleEndMissing} tone={saleEndMissing > 0 ? "warn" : "default"} />
        <Stat label="重複候補" value={duplicateCandidates.length} tone={duplicateCandidates.length > 0 ? "warn" : "default"} />
      </section>

      {missing.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_78%)] p-5 shadow-soft">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Final price review</p>
              <h2 className="mt-1 text-2xl font-black text-ink">残り{missing.length}件は公式価格確認中</h2>
              <p className="mt-1 text-sm font-bold leading-6 text-amber-900">
                推測価格、類似商品価格、別商品価格は入れず、同一商品価格が確認できるまで未確認として維持します。
              </p>
            </div>
            <Link href={hrefFor({ ...currentParams, status: "missing", bucket: "すべて" })} className="inline-flex h-11 items-center justify-center rounded-full bg-amber-600 px-4 text-sm font-black text-white">
              未確認だけ確認
            </Link>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {missing.map((food) => {
              const manual = manualDecisions[food.id];
              return (
                <div key={`missing-summary-${food.id}`} className="rounded-2xl border border-amber-100 bg-white/90 p-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-700">価格未確認</span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">公式価格確認中</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{bucketFor(food.category)}</span>
                  </div>
                  <p className="mt-2 break-words text-sm font-black leading-5 text-ink [overflow-wrap:anywhere]">{food.name}</p>
                  <dl className="mt-2 grid gap-1 text-xs font-bold text-slate-500">
                    <div className="flex gap-2"><dt className="w-20 shrink-0 text-slate-400">エリア</dt><dd>{getFoodAreaSummary(food)}</dd></div>
                    <div className="flex gap-2"><dt className="w-20 shrink-0 text-slate-400">店舗</dt><dd>{food.shop.name}</dd></div>
                    <div className="flex gap-2"><dt className="w-20 shrink-0 text-slate-400">未確認理由</dt><dd>{manual?.reason ?? reasonCodeLabel(manual?.reasonCode)}</dd></div>
                    <div className="flex gap-2"><dt className="w-20 shrink-0 text-slate-400">確認済出典</dt><dd>{manual?.checkedSourceUrl ? "手動確認メモあり" : food.sourceUrl ? "公式URL確認待ち" : "出典URL未設定"}</dd></div>
                    <div className="flex gap-2"><dt className="w-20 shrink-0 text-slate-400">候補出典</dt><dd>{nextSourceCandidates(food, manual?.reasonCode).join(" / ")}</dd></div>
                    <div className="flex gap-2"><dt className="w-20 shrink-0 text-slate-400">最終確認日</dt><dd>{formatReviewDate(manual?.updatedAt ?? food.priceLastCheckedAt ?? food.lastCheckedAt)}</dd></div>
                    <div className="flex gap-2"><dt className="w-20 shrink-0 text-slate-400">確認担当</dt><dd>{manual?.status === "unconfirmable" ? "手動監査済み" : "管理者確認待ち"}</dd></div>
                    <div className="flex gap-2"><dt className="w-20 shrink-0 text-slate-400">次確認場所</dt><dd>{nextCheckPlace(food, manual?.reasonCode)}</dd></div>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={food.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-full bg-ink px-3 text-xs font-black text-white">
                      公式URL
                    </a>
                    {nextSourceCandidates(food, manual?.reasonCode).map((source) => (
                      <span key={`${food.id}-${source}`} className="inline-flex h-9 items-center rounded-full bg-slate-100 px-3 text-xs font-black text-slate-600">
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-park/15 bg-mint p-5 shadow-soft">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-park">Review center</p>
            <h2 className="mt-1 text-2xl font-black text-ink">未対応を優先度順に処理</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
              公式ページ確認、価格入力、カテゴリ・店舗・エリア確認、重複判定を同じ画面で行えます。価格保存後は次の商品へ進みます。
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <GoalCard label="50%まで" value={`あと${pricesNeededFor(0.5, foods.length, known)}件`} />
            <GoalCard label="60%まで" value={`あと${pricesNeededFor(0.6, foods.length, known)}件`} />
            <GoalCard label="70%まで" value={`あと${pricesNeededFor(0.7, foods.length, known)}件`} />
            <GoalCard label="レビュー完了" value={`${priceReviewed}/${foods.length}件`} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-black text-ink">品質ダッシュボード</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <QualityMetric label="出典URL設定率" value={sourceUrlRate} />
            <QualityMetric label="店舗設定率" value={shopRate} />
            <QualityMetric label="エリア設定率" value={areaRate} />
          </div>
          <div className="mt-4 grid gap-2 text-sm font-bold text-slate-600">
            <p>カテゴリ見直し候補: <span className="font-black text-ink">{categoryPending}件</span></p>
            <p>価格レビュー状態: <span className="font-black text-ink">価格確認済{known}件 / 確認不能{unconfirmableCount}件 / 未レビュー{priceReviewOpen}件</span></p>
            <p>価格レビュー完了率: <span className="font-black text-ink">{priceReviewRate}</span></p>
            <p>未確認内訳: <span className="font-black text-ink">価格要確認{priceUnconfirmed}件 / 情報不足{informationShortage}件</span></p>
            <p>確認不能理由保存済み: <span className="font-black text-ink">{unconfirmableCount}件</span></p>
            <p>出典URLあり未確認: <span className="font-black text-ink">{missingWithSource}件</span></p>
            <p>出典URLなし未確認: <span className="font-black text-ink">{missingWithoutSource}件</span></p>
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-black text-ink">優先度ルール</h2>
          <div className="mt-4 grid gap-2 text-sm font-bold text-slate-600">
            <p>出典URLあり、画像あり、価格未確認、重点カテゴリ、重複疑惑ありを高く評価します。</p>
            <p>品質スコアは画像、価格、店舗、エリア、出典URL、説明文の有無で算出します。</p>
            <p>出典URLなし商品は後回しにし、公式確認しやすい商品から処理します。</p>
          </div>
        </section>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-xl font-black text-ink">価格ソース内訳</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {priceSourceStats.map((stat) => (
            <div key={stat.source} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">{getPriceSourceLabel(stat.source)}</p>
              <p className="mt-1 text-2xl font-black text-ink">{stat.count}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-xl font-black text-ink">カテゴリ別 価格取得率</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {Object.entries(categoryStats).map(([bucket, stat]) => (
            <div key={bucket} className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-black text-ink">{bucket}</p>
              <p className="mt-2 text-2xl font-black text-park">{percent(stat.known, stat.total)}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {stat.known}/{stat.total}件 / 未設定{stat.unknown}件
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MiniStats title="未確認TOP店舗" rows={shopStats.missing.slice(0, 8)} />
        <MiniStats title="エリア別 価格取得率" rows={areaStats.rate.slice(0, 8)} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">重複候補</h2>
            <p className="text-sm font-bold text-slate-500">同名・同カテゴリ・同店舗・同画像・同じ出典URLの候補です。ここでは判定ログのみ保存し、商品削除や統合は行いません。</p>
          </div>
          <p className="text-sm font-black text-berry">{duplicateCandidates.length}件</p>
        </div>
        <div className="mt-4 grid gap-3">
          {duplicateCandidates.slice(0, 8).map((candidate) => (
            <div key={`${candidate.food.id}-${candidate.other.id}`} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="text-xs font-black text-amber-700">{candidate.reason}</p>
                  <p className="mt-1 line-clamp-1 font-black text-ink">{candidate.food.name}</p>
                  <p className="line-clamp-1 text-sm font-bold text-slate-500">{candidate.other.name}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={recordDuplicateDecision}>
                    <input type="hidden" name="foodId" value={candidate.food.id} />
                    <input type="hidden" name="otherFoodId" value={candidate.other.id} />
                    <input type="hidden" name="decision" value="same" />
                    <button className="h-9 rounded-full bg-ink px-3 text-xs font-black text-white" type="submit">同一商品</button>
                  </form>
                  <form action={recordDuplicateDecision}>
                    <input type="hidden" name="foodId" value={candidate.food.id} />
                    <input type="hidden" name="otherFoodId" value={candidate.other.id} />
                    <input type="hidden" name="decision" value="different" />
                    <button className="h-9 rounded-full bg-white px-3 text-xs font-black text-slate-700 ring-1 ring-slate-200" type="submit">別商品</button>
                  </form>
                </div>
              </div>
            </div>
          ))}
          {duplicateCandidates.length === 0 ? <p className="rounded-xl bg-slate-50 p-5 text-sm font-bold text-slate-500">重複候補はありません。</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-black text-ink">作業フィルタ</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">価格未設定を優先し、弱いカテゴリだけに絞って公式根拠を確認できます。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterLink href={hrefFor({ ...currentParams, status: "missing" })} active={priceFilter === "missing"}>
              価格未設定のみ
            </FilterLink>
            <FilterLink href={hrefFor({ ...currentParams, status: "all" })} active={priceFilter === "all"}>
              全件
            </FilterLink>
          </div>
          <div className="flex flex-wrap gap-2">
            {bucketFilters.map((bucket) => (
              <FilterLink key={bucket} href={hrefFor({ ...currentParams, bucket })} active={bucketFilter === bucket}>
                {bucket}
              </FilterLink>
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <FilterSelect label="店舗" name="shop" value={shopFilter} options={["すべて", ...shopStats.names]} params={currentParams} />
            <FilterSelect label="エリア" name="area" value={areaFilter} options={["すべて", ...areaStats.names]} params={currentParams} />
            <div className="flex flex-wrap items-end gap-2">
              <FilterLink href={hrefFor({ ...currentParams, source: "withSource" })} active={sourceFilter === "withSource"}>出典URLあり</FilterLink>
              <FilterLink href={hrefFor({ ...currentParams, source: "withoutSource" })} active={sourceFilter === "withoutSource"}>出典URLなし</FilterLink>
              <FilterLink href={hrefFor({ ...currentParams, image: "withImage" })} active={imageFilter === "withImage"}>画像あり</FilterLink>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterLink href={hrefFor({ ...currentParams, priceSource: "all" })} active={priceSourceFilter === "all"}>
              ソースすべて
            </FilterLink>
            {(["official", "official_app", "menu_photo", "trusted_report", "social_report", "unknown"] as PriceSource[]).map((source) => (
              <FilterLink key={source} href={hrefFor({ ...currentParams, priceSource: source })} active={priceSourceFilter === source}>
                {getPriceSourceLabel(source)}
              </FilterLink>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={22} aria-hidden />
          <div>
            <h2 className="font-black text-amber-950">価格未設定商品の扱い</h2>
            <p className="mt-1 text-sm leading-6 text-amber-950">
              公式ページ、公式PDF、公式イベントページで商品名と価格が確認できない場合は未設定のまま維持します。別年価格や周辺商品の価格コピーは使用しません。
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">{displayLabel}</h2>
            <p className="text-sm font-bold text-slate-500">
              表示{displayFoods.length}件。出典URLあり未確認{missingWithSource}件 / 出典URLなし未確認{missingWithoutSource}件。
            </p>
          </div>
          <p className="text-sm font-black text-berry">推測価格0件</p>
        </div>
        <div className="mt-4 grid gap-4">
          {displayFoods.map((food, index) => (
            <PriceReviewCard
              key={food.id}
              food={food}
              index={index}
              total={displayFoods.length}
              sourceUrl={food.sourceUrl}
              priceSourceUrl={food.priceSourceUrl}
              priorityScore={reviewPriorityScore(food, duplicateFoodIds.has(food.id), manualDecisions[food.id]?.status === "unconfirmable")}
              qualityScore={qualityScore(food)}
              duplicateCandidate={duplicateFoodIds.has(food.id)}
              manualDecision={manualDecisions[food.id]}
            />
          ))}
          {displayFoods.length === 0 ? <p className="rounded-xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">条件に一致する商品はありません。</p> : null}
        </div>
      </section>
    </div>
  );
}

type ManualDecision = {
  status?: string;
  reason?: string;
  reasonCode?: string;
  checkedSourceUrl?: string;
  updatedAt?: string;
};

function readManualPriceDecisions(): Record<string, ManualDecision> {
  const filePath = path.join(process.cwd(), "scripts", "output", "manual-price-decisions.json");
  try {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, ManualDecision>;
  } catch {
    return {};
  }
}

function formatReviewDate(value?: string | null) {
  if (!value) return "未確認";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo"
  }).format(date);
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`inline-flex h-9 items-center rounded-full px-3 text-xs font-black transition ${
        active ? "bg-ink text-white shadow-soft" : "bg-slate-100 text-slate-600 hover:bg-mint hover:text-park"
      }`}
    >
      {children}
    </Link>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "warn" }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-soft ${tone === "warn" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <ReceiptText className={tone === "warn" ? "text-amber-700" : "text-park"} size={22} aria-hidden />
      <p className="mt-3 text-sm font-bold text-slate-500">{label}</p>
      <p className="text-3xl font-black text-ink">{value}</p>
    </div>
  );
}

function GoalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/80 p-4">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-ink">{value}</p>
    </div>
  );
}

function QualityMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-ink">{value}</p>
    </div>
  );
}

function MiniStats({ title, rows }: { title: string; rows: Array<{ label: string; total: number; known: number; unknown: number; rate: string }> }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-black text-ink">{title}</h2>
      <div className="mt-3 divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="line-clamp-1 font-bold text-slate-600">{row.label}</span>
            <span className="shrink-0 font-black text-ink">
              {row.rate} / 未{row.unknown}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function reasonCodeLabel(reasonCode?: string) {
  const labels: Record<string, string> = {
    source_url_missing: "出典URL未設定",
    official_exact_price_not_found: "公式ページで同一商品価格なし",
    product_name_mismatch: "商品名一致なし",
    only_similar_product_found: "類似商品のみ",
    set_or_size_ambiguous: "セット/サイズ違いが曖昧",
    pdf_manual_check_required: "PDF手動確認待ち",
    shop_page_check_required: "店舗ページ確認待ち",
    trusted_report_needed: "高信頼レポート確認待ち"
  };
  return reasonCode ? labels[reasonCode] ?? reasonCode : "同一商品価格の確認待ち";
}

function nextSourceCandidates(food: FoodWithRelations, reasonCode?: string) {
  const sources = new Set<string>();
  if (food.sourceUrl) sources.add("公式商品ページ");
  if (/pdf/i.test(food.sourceUrl) || reasonCode === "pdf_manual_check_required") sources.add("公式PDF原本");
  sources.add("USJ公式アプリ");
  sources.add("現地メニュー写真");
  if (food.shop.name && !isUnknownName(food.shop.name)) sources.add("店頭メニュー");
  if (reasonCode === "set_or_size_ambiguous") sources.add("サイズ/セット内容写真");
  sources.add("高信頼現地レポート");
  return Array.from(sources).slice(0, 5);
}

function nextCheckPlace(food: FoodWithRelations, reasonCode?: string) {
  if (reasonCode === "set_or_size_ambiguous") return "セット内容が読める現地メニュー写真";
  if (reasonCode === "pdf_manual_check_required") return "公式PDFの同一商品行";
  if (food.shop.name && !isUnknownName(food.shop.name)) return `${food.shop.name}の店頭メニュー`;
  if (food.sourceUrl) return "公式ページの同一商品ブロック";
  return "公式ページまたは現地メニュー写真";
}

function FilterSelect({
  label,
  name,
  value,
  options,
  params
}: {
  label: string;
  name: "shop" | "area";
  value: string;
  options: string[];
  params: { status: PriceFilter; bucket: BucketFilter; shop: string; area: string; source: SourceFilter; priceSource: PriceSourceFilter; image: ImageFilter };
}) {
  return (
    <form action="/admin/prices" className="block">
      <input type="hidden" name="status" value={params.status} />
      <input type="hidden" name="bucket" value={params.bucket} />
      <input type="hidden" name="source" value={params.source} />
      <input type="hidden" name="priceSource" value={params.priceSource} />
      <input type="hidden" name="image" value={params.image} />
      <input type="hidden" name={name === "shop" ? "area" : "shop"} value={name === "shop" ? params.area : params.shop} />
      <label className="block">
        <span className="text-xs font-black text-slate-500">{label}</span>
        <select name={name} defaultValue={value} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-ink">
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="mt-2 h-9 rounded-full bg-slate-100 px-3 text-xs font-black text-slate-700">
        絞り込み
      </button>
    </form>
  );
}

function hasKnownPrice(food: FoodWithRelations) {
  return Boolean(food.price ?? food.priceMin ?? food.locations?.find((location) => location.price)?.price);
}

function hasPublicImage(food: FoodWithRelations) {
  const image = primaryImage(food);
  return Boolean(image) && !image?.startsWith("/placeholders/");
}

function primaryImage(food: FoodWithRelations) {
  const generatedFood = food as FoodWithRelations & { representativeImageUrl?: string };
  return food.imageUrl ?? generatedFood.representativeImageUrl ?? food.images.find((item) => item.enabled)?.imageUrl ?? "";
}

function buildCategoryStats(foods: FoodWithRelations[]) {
  const stats = new Map<Bucket, { total: number; known: number; unknown: number }>();
  for (const food of foods) {
    const bucket = bucketFor(food.category);
    const current = stats.get(bucket) ?? { total: 0, known: 0, unknown: 0 };
    current.total += 1;
    if (hasKnownPrice(food)) current.known += 1;
    else current.unknown += 1;
    stats.set(bucket, current);
  }
  return Object.fromEntries(stats.entries());
}

function buildPriceSourceStats(foods: FoodWithRelations[]) {
  const order: PriceSource[] = ["official", "official_app", "menu_photo", "trusted_report", "social_report", "unknown"];
  const stats = new Map<PriceSource, number>(order.map((source) => [source, 0]));
  for (const food of foods) {
    const source = getPriceSource(food);
    stats.set(source, (stats.get(source) ?? 0) + 1);
  }
  return order.map((source) => ({ source, count: stats.get(source) ?? 0 }));
}

function buildNameStats(foods: FoodWithRelations[], getName: (food: FoodWithRelations) => string) {
  const map = new Map<string, { label: string; total: number; known: number; unknown: number; rate: string }>();
  for (const food of foods) {
    const label = getName(food) || "未確認";
    const current = map.get(label) ?? { label, total: 0, known: 0, unknown: 0, rate: "0%" };
    current.total += 1;
    if (hasKnownPrice(food)) current.known += 1;
    else current.unknown += 1;
    current.rate = percent(current.known, current.total);
    map.set(label, current);
  }
  const rows = Array.from(map.values());
  return {
    names: rows.map((row) => row.label).sort((a, b) => a.localeCompare(b, "ja")),
    missing: rows.filter((row) => row.unknown > 0).sort((a, b) => b.unknown - a.unknown || a.label.localeCompare(b.label, "ja")),
    rate: rows.sort((a, b) => a.known / Math.max(a.total, 1) - b.known / Math.max(b.total, 1) || b.unknown - a.unknown)
  };
}

function compareForPriceWork(a: FoodWithRelations, b: FoodWithRelations) {
  return (
    Number(hasKnownPrice(a)) - Number(hasKnownPrice(b)) ||
    Number(!a.sourceUrl) - Number(!b.sourceUrl) ||
    Number(!hasPublicImage(a)) - Number(!hasPublicImage(b)) ||
    priorityForBucket(bucketFor(a.category)) - priorityForBucket(bucketFor(b.category)) ||
    Number(a.shop.name === "店舗未確認") - Number(b.shop.name === "店舗未確認") ||
    a.name.localeCompare(b.name, "ja")
  );
}

function reviewPriorityScore(food: FoodWithRelations, duplicateCandidate: boolean, priceReviewedAsUnconfirmable = false) {
  let score = 0;
  if (food.sourceUrl) score += 25;
  if (hasPublicImage(food)) score += 20;
  if (!hasKnownPrice(food) && !priceReviewedAsUnconfirmable) score += 25;
  if (["drink", "dessert", "burger", "set", "rice", "noodle", "pizza", "kids", "churro"].includes(food.category)) score += 15;
  if (duplicateCandidate) score += 15;
  if (!isUnknownName(food.shop.name)) score += 5;
  if (!needsAreaReview(food)) score += 5;
  return Math.min(score, 100);
}

function qualityScore(food: FoodWithRelations) {
  let score = 0;
  if (hasPublicImage(food)) score += 20;
  if (hasKnownPrice(food)) score += 20;
  if (!isUnknownName(food.shop.name)) score += 15;
  if (!needsAreaReview(food)) score += 15;
  if (food.sourceUrl) score += 20;
  if (food.description) score += 10;
  return Math.min(score, 100);
}

function buildDuplicateCandidates(foods: FoodWithRelations[]) {
  const candidates: Array<{ food: FoodWithRelations; other: FoodWithRelations; reason: string }> = [];
  for (let i = 0; i < foods.length; i += 1) {
    for (let j = i + 1; j < foods.length; j += 1) {
      const a = foods[i];
      const b = foods[j];
      if (a.category !== b.category) continue;
      const sameImage = Boolean(primaryImage(a) && primaryImage(a) === primaryImage(b));
      const sameSource = Boolean(a.sourceUrl && a.sourceUrl === b.sourceUrl);
      const sameShop = a.shop.name === b.shop.name && !isUnknownName(a.shop.name);
      const nameSimilarity = similarityKey(a.name) === similarityKey(b.name) || isNearName(a.name, b.name);
      if (!nameSimilarity && !sameImage) continue;
      if (sameImage || sameSource || sameShop || nameSimilarity) {
        candidates.push({
          food: a,
          other: b,
          reason: [
            nameSimilarity ? "商品名類似" : undefined,
            sameImage ? "同画像" : undefined,
            sameShop ? "同店舗" : undefined,
            sameSource ? "同じ出典URL" : undefined
          ].filter(Boolean).join(" / ")
        });
      }
    }
  }
  return candidates
    .filter((candidate) => candidate.reason)
    .sort((a, b) => reviewPriorityScore(b.food, true) - reviewPriorityScore(a.food, true) || a.food.name.localeCompare(b.food.name, "ja"))
    .slice(0, 40);
}

function similarityKey(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[〜~\-・!！?？™®©()（）【】「」『』、，,\s]/g, "")
    .replace(/セット|プレート|マグカップ付き|スプーン付き|コースターセット/g, "");
}

function isNearName(a: string, b: string) {
  const left = similarityKey(a);
  const right = similarityKey(b);
  if (!left || !right) return false;
  if (left.length < 6 || right.length < 6) return false;
  return left.includes(right) || right.includes(left);
}

function isUnknownName(value?: string) {
  return !value || /未確認|不明|unknown/i.test(value);
}

function priorityForBucket(bucket: Bucket) {
  const order: Bucket[] = ["ドリンク", "デザート", "バーガー", "プレート", "キッズ", "ピザ", "パスタ", "ライス", "チュリトス", "分類確認中"];
  const index = order.indexOf(bucket);
  return index === -1 ? order.length : index;
}

function bucketFor(category: FoodCategory): Bucket {
  if (category === "churro") return "チュリトス";
  if (category === "pizza") return "ピザ";
  if (category === "burger") return "バーガー";
  if (category === "set" || category === "chicken") return "プレート";
  if (category === "noodle") return "パスタ";
  if (category === "rice") return "ライス";
  if (category === "kids") return "キッズ";
  if (category === "drink") return "ドリンク";
  if (category === "dessert") return "デザート";
  return "分類確認中";
}

function isBucketFilter(value?: string): value is BucketFilter {
  return Boolean(value && bucketFilters.includes(value as BucketFilter));
}

function isPriceSourceFilter(value?: string): value is PriceSourceFilter {
  return Boolean(value === "all" || value === "official" || value === "official_app" || value === "menu_photo" || value === "trusted_report" || value === "social_report" || value === "unknown");
}

function hrefFor(paramsLike: { status: PriceFilter; bucket: BucketFilter; shop?: string; area?: string; source?: SourceFilter; priceSource?: PriceSourceFilter; image?: ImageFilter }) {
  const params = new URLSearchParams();
  params.set("status", paramsLike.status);
  params.set("bucket", paramsLike.bucket);
  if (paramsLike.shop && paramsLike.shop !== "すべて") params.set("shop", paramsLike.shop);
  if (paramsLike.area && paramsLike.area !== "すべて") params.set("area", paramsLike.area);
  if (paramsLike.source && paramsLike.source !== "all") params.set("source", paramsLike.source);
  if (paramsLike.priceSource && paramsLike.priceSource !== "all") params.set("priceSource", paramsLike.priceSource);
  if (paramsLike.image && paramsLike.image !== "all") params.set("image", paramsLike.image);
  return `/admin/prices?${params.toString()}`;
}

function pricesNeededFor(targetRate: number, total: number, known: number) {
  return Math.max(Math.ceil(total * targetRate) - known, 0);
}

function percent(numerator: number, denominator: number) {
  return `${Math.round((numerator / Math.max(denominator, 1)) * 1000) / 10}%`;
}
