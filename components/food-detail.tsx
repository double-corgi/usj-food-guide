"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Check, ChevronLeft, ChevronRight, ExternalLink, Flag, MapPin, Sparkles, Star, Store, Utensils } from "lucide-react";
import { categoryLabels, diningTypeLabels, shopTypeLabels, statusLabels } from "@/lib/constants";
import { getFoodValueScore, scoreFormulaText, scoreReasonText } from "@/lib/food-value-score";
import { formatFoodPrice, formatPrice, formatSaleDateShort, getPriceSource, getPriceSourceLabel, getRemainingDays, getSaleEndDate, getSalePeriodLabel, getSaleStartDate, getSaleStatus, getSaleStatusLabel, getSaleStatusTone, getSaleTypeLabel, getSaleUrgencyLabel, getZukanCode, isCompletableFood, isEaten, isWanted } from "@/lib/food-utils";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { FoodCategory, FoodLocation, FoodWithRelations } from "@/types/domain";
import { FoodImageGallery } from "@/components/food-image-gallery";
import { FoodImage } from "@/components/food-image";
import { UnofficialNotice } from "@/components/unofficial-notice";

type RelatedGroups = {
  sameCategory: FoodWithRelations[];
  sameArea: FoodWithRelations[];
  sameShop: FoodWithRelations[];
  sameEvent?: FoodWithRelations[];
  sameSeries?: FoodWithRelations[];
  together?: FoodWithRelations[];
};

export function FoodDetail({
  food,
  allFoods,
  previousFood,
  nextFood,
  relatedGroups,
}: {
  food: FoodWithRelations;
  allFoods?: FoodWithRelations[];
  previousFood?: FoodWithRelations;
  nextFood?: FoodWithRelations;
  relatedGroups?: RelatedGroups;
}) {
  const { logs, toggleEaten, toggleWant } = useFoodLogs();
  const eaten = isEaten(logs, food.id);
  const wanted = isWanted(logs, food.id);
  const locations = getDisplayLocations(food);
  const primaryLocation = locations[0];
  const period = getPeriodSummary(food);
  const saleStatus = getSaleStatus(food);
  const saleStartDate = getSaleStartDate(food);
  const saleEndDate = getSaleEndDate(food);
  const remainingDays = getRemainingDays(food);
  const urgencyLabel = getSaleUrgencyLabel(food);
  const priceSource = getPriceSource(food);
  const knownPrice = Boolean(food.price ?? food.priceMin);
  const diningLabel = food.diningType && food.diningType !== "unknown" ? diningTypeLabels[food.diningType] : inferDiningLabel(food);
  const officialHref = food.officialUrl ?? food.sourceUrl;
  const foodPool = allFoods ?? [];
  const valueScore = getFoodValueScore(food, foodPool);
  const salesSummary = getSalesSummary(food);
  const relatedFoods = buildRelatedFoods(food, foodPool, relatedGroups).slice(0, 12);

  useEffect(() => {
    try {
      const key = "uniba-recent-foods-v1";
      const current = JSON.parse(window.localStorage.getItem(key) ?? "[]") as string[];
      const next = [food.id, ...current.filter((id) => id !== food.id)].slice(0, 20);
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // localStorage may be unavailable in private contexts.
    }
  }, [food.id]);

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/foods" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-soft">
          <ChevronLeft size={17} aria-hidden />
          一覧へ戻る
        </Link>
        <div className="grid grid-cols-2 gap-2">
          {previousFood ? (
            <Link href={`/foods/${previousFood.id}`} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-700">
              <ChevronLeft size={15} aria-hidden />
              前
            </Link>
          ) : null}
          {nextFood ? (
            <Link href={`/foods/${nextFood.id}`} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-700">
              次
              <ChevronRight size={15} aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>

      <section className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white text-ink shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
        <div className="relative h-[310px] bg-slate-100 sm:h-[520px]">
          <FoodImageGallery images={food.images} category={food.category} name={food.name} variant="hero" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/92 px-3 py-1.5 text-xs font-black text-park shadow-sm">{getZukanCode(food, allFoods)}</span>
            {saleStatus === "ended" ? (
              <span className="rounded-full bg-slate-800/88 px-3 py-1.5 text-xs font-black text-white shadow-sm">× 販売終了</span>
            ) : null}
            {saleStatus === "upcoming" ? (
              <span className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-black text-white shadow-sm">近日販売</span>
            ) : null}
          {food.isLimited ? (
              <span className="rounded-full bg-berry px-3 py-1.5 text-xs font-black text-white shadow-sm">◇ 限定</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => toggleWant(food.id)}
            className={`absolute bottom-4 right-4 inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black shadow-[0_12px_30px_rgba(15,23,42,0.24)] active:scale-[0.98] ${
              wanted ? "bg-amber-400 text-white" : "bg-white/94 text-ink"
            }`}
          >
            <Flag size={17} aria-hidden fill={wanted ? "currentColor" : "none"} />
            次回食べたい
          </button>
        </div>

        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-mint px-3 py-1 text-xs font-black text-park">{categoryLabels[food.category]}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${getSaleStatusTone(food)}`}>{period.label}</span>
            </div>
            <h1 className="break-words text-3xl font-black leading-tight tracking-tight text-ink [overflow-wrap:anywhere] sm:text-5xl">
              {food.name}
            </h1>
            <p className="text-2xl font-black text-park">{formatFoodPrice(food)}</p>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2">
              <p className="text-[11px] font-black text-amber-700">販売期間</p>
              <p className="mt-0.5 text-sm font-black text-ink">
                {formatSaleDateShort(saleStartDate) ?? "開始日未確認"}〜{saleEndDate ? formatSaleDateShort(saleEndDate) : "終了日未定"}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-black sm:grid-cols-4">
                <SaleMiniFact label="販売状況" value={getSaleStatusLabel(food)} />
                <SaleMiniFact label="販売開始日" value={formatDateLong(saleStartDate) ?? "未確認"} />
                <SaleMiniFact label="販売終了予定日" value={saleEndDate ? formatDateLong(saleEndDate) ?? "未確認" : saleStatus === "active" ? "未定" : "未確認"} />
                <SaleMiniFact label="最終確認日" value={formatDateLong(food.lastCheckedAt ?? food.priceLastCheckedAt) ?? "未確認"} />
              </dl>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-black">
                <span className="rounded-full bg-white px-2.5 py-1 text-amber-800">{getSaleTypeLabel(food)}</span>
                {urgencyLabel ? <span className="rounded-full bg-berry px-2.5 py-1 text-white">{urgencyLabel}</span> : null}
                {typeof remainingDays === "number" && remainingDays > 30 ? <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">あと{remainingDays}日</span> : null}
              </div>
            </div>
            <p className="text-xs font-black text-slate-500">
              {getPriceSourceLabel(priceSource)}
              {food.priceLastCheckedAt ? ` / ${formatDateShort(food.priceLastCheckedAt)}確認` : ""}
            </p>
            {!knownPrice ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-black leading-5 text-amber-800">
                価格は未確認です。推測価格や別商品の価格は表示していません。
              </p>
            ) : null}
            <p className="flex min-w-0 items-start gap-2 text-sm font-bold text-slate-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-park" aria-hidden />
              <span className="min-w-0 break-words [overflow-wrap:anywhere]">{primaryLocation?.shopName ?? food.shop.name}</span>
            </p>
            <p className="flex min-w-0 items-start gap-2 text-xs font-bold text-slate-500">
              <Utensils className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <span>{diningLabel} / {period.label}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleEaten(food.id)}
            className={`inline-flex h-14 min-w-[190px] items-center justify-center gap-2 rounded-2xl text-base font-black shadow-sm active:scale-[0.98] ${eaten ? "bg-park text-white" : "bg-ink text-white"}`}
          >
            <Check size={20} aria-hidden />
            {eaten ? "GET済み" : "食べた"}
          </button>
        </div>
      </section>

      <ValueScorePanel score={valueScore} food={food} salesSummary={salesSummary} />

      <section className="grid gap-3 sm:grid-cols-2">
        <MiniInfoCard label="販売店舗" value={salesSummary.shopLabel} note={`${salesSummary.shopCount}店舗で確認`} />
        <MiniInfoCard label="販売エリア" value={salesSummary.areaLabel} note={`${salesSummary.areaCount}エリアで確認`} />
      </section>

      <section className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-soft">
        <h2 className="flex items-center gap-2 text-base font-black text-ink">
          <Store size={18} aria-hidden className="text-park" />
          販売場所
        </h2>
        <div className="mt-3 grid gap-2">
          {locations.map((location, index) => (
            <div key={`${location.shopName}-${location.areaName}-${location.sourceUrl ?? index}`} className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-black text-ink [overflow-wrap:anywhere]">{location.shopName}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{location.areaName}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600">{shopTypeLabels[location.shopType]}</span>
              </div>
              <p className="mt-2 text-xs font-bold text-slate-500">
                {location.price ? formatPrice(location.price) : formatFoodPrice(food)} / {statusLabels[location.status]}
              </p>
            </div>
          ))}
        </div>
      </section>

      <a
        href={officialHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 shadow-soft"
      >
        公式サイトを見る
        <ExternalLink size={17} aria-hidden />
      </a>

      <section className="space-y-4 rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-soft">
        <div>
          <p className="text-xs font-black text-park">このフードから巡る</p>
          <h2 className="mt-1 text-lg font-black text-ink">次に食べたくなる候補</h2>
        </div>
        <RelatedRail title="関連度順" foods={relatedFoods} />
      </section>

      <details className="rounded-[1.35rem] border border-slate-200 bg-white p-4 text-sm font-bold text-slate-600 shadow-soft">
        <summary className="cursor-pointer text-sm font-black text-ink">確認情報</summary>
        <dl className="mt-3 grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">カテゴリ</dt>
            <dd className="font-black text-ink">{categoryLabels[food.category]}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">形式</dt>
            <dd className="font-black text-ink">{diningLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">期間</dt>
            <dd className="font-black text-ink">{period.label}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">コンプ対象</dt>
            <dd className="font-black text-ink">{isCompletableFood(food) ? "対象" : "対象外"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">販売開始</dt>
            <dd className="font-black text-ink">{formatDateLong(saleStartDate) ?? "未確認"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">販売終了</dt>
            <dd className="font-black text-ink">{saleEndDate ? formatDateLong(saleEndDate) ?? "未確認" : saleStatus === "active" ? "未定" : "未確認"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">価格確認</dt>
            <dd className="font-black text-ink">{getPriceSourceLabel(priceSource)}</dd>
          </div>
          {!knownPrice ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">価格状態</dt>
              <dd className="font-black text-amber-700">価格未確認</dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">確認日</dt>
            <dd className="font-black text-ink">{formatDateShort(food.priceLastCheckedAt)}</dd>
          </div>
        </dl>
      </details>

      <UnofficialNotice />
    </div>
  );
}

function SaleMiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white px-2.5 py-2">
      <dt className="text-[10px] text-amber-700/70">{label}</dt>
      <dd className="mt-0.5 text-[11px] text-ink">{value}</dd>
    </div>
  );
}

function buildRelatedFoods(food: FoodWithRelations, allFoods: FoodWithRelations[], groups?: RelatedGroups) {
  const scores = new Map<string, { food: FoodWithRelations; score: number }>();
  const add = (items: FoodWithRelations[] | undefined, weight: number) => {
    (items ?? []).forEach((candidate, index) => {
      if (candidate.id === food.id) return;
      const current = scores.get(candidate.id);
      const score = weight + Math.max(0, 12 - index);
      scores.set(candidate.id, { food: candidate, score: (current?.score ?? 0) + score });
    });
  };

  add(groups?.sameSeries, 100);
  add(groups?.sameCategory, 84);
  add(groups?.sameArea, 68);
  add(groups?.sameShop, 62);
  add(groups?.together, 62);
  add(groups?.sameEvent, 56);

  for (const candidate of allFoods) {
    if (candidate.id === food.id) continue;
    const current = scores.get(candidate.id);
    const sameArea = candidate.areaId === food.areaId || candidate.locations?.some((location) => location.areaId === food.areaId);
    const categoryAffinity = categoryAffinityScore(food.category, candidate.category);
    const baseScore =
      (sameArea ? 26 : 0) +
      categoryAffinity +
      Math.min(candidate.extractionSourceCount ?? 0, 5) * 5 +
      Math.min(candidate.confidenceScore ?? 0, 100) / 12 +
      (candidate.isLimited ? 8 : 0) +
      (candidate.price || candidate.priceMin ? 6 : 0);
    if (baseScore <= 0 && !current) continue;
    scores.set(candidate.id, { food: candidate, score: (current?.score ?? 0) + baseScore });
  }

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name, "ja"))
    .map((item) => item.food);
}

function ValueScorePanel({
  score,
  food,
  salesSummary
}: {
  score: ReturnType<typeof getFoodValueScore>;
  food: FoodWithRelations;
  salesSummary: ReturnType<typeof getSalesSummary>;
}) {
  const reasonText = scoreReasonText(score);
  const reasonBullets = scoreReasonBullets(score, food, salesSummary, reasonText);
  const audience = audienceText(score);
  const notFor = notForText(score, food);
  const evidence = scoreEvidenceChips(score, food, salesSummary);
  return (
    <section className="rounded-[1.35rem] border border-amber-100 bg-[linear-gradient(135deg,#fffdf4_0%,#ffffff_74%)] p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-black text-amber-700">
            <Sparkles size={15} aria-hidden />
            攻略スコア
          </p>
          <h2 className="mt-1 text-3xl font-black text-ink">{score.total}<span className="text-base text-slate-600">/100</span></h2>
          <p className="mt-1 text-sm font-black tracking-[0.08em] text-amber-400">{scoreStars(score.stars.recommendation)}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{scoreSummaryText(score, food, salesSummary)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(score.reasons.length ? score.reasons : ["今日の候補"]).map((reason) => (
            <span key={reason} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-park shadow-sm">
              {reason}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-5">
        <StarRating label="味" value={score.stars.taste} metric={score.metrics.taste} />
        <StarRating label="満足度" value={score.stars.satisfaction} metric={score.metrics.satisfaction} />
        <StarRating label="希少性" value={score.stars.rarity} metric={score.metrics.rarity} />
        <StarRating label="限定性" value={score.stars.limitedness} metric={score.metrics.limitedness} />
        <StarRating label="ボリューム" value={score.stars.volume} metric={score.metrics.volume} />
        <StarRating label="写真映え" value={score.stars.photo} metric={score.metrics.photo} />
        <StarRating label="買いやすさ" value={score.stars.waitCost} metric={score.metrics.waitCost} />
        <StarRating label="コスパ" value={score.stars.price} metric={score.metrics.price} />
        <StarRating label="入手難度" value={score.stars.difficulty} metric={score.metrics.difficulty} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {evidence.map((item) => (
          <span key={item} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
            {item}
          </span>
        ))}
      </div>
      <p className="mt-3 rounded-2xl bg-white/72 px-3 py-2 text-[11px] font-bold leading-5 text-slate-500">
        スコアの見方: {scoreFormulaText()}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/72 p-3">
          <p className="text-[11px] font-black text-park">選ぶ理由</p>
          <ul className="mt-1 grid gap-1 text-xs font-bold leading-5 text-slate-600">
            {reasonBullets.high.map((reason) => (
              <li key={reason} className="flex gap-1.5">
                <span className="text-park">・</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-white/72 p-3">
          <p className="text-[11px] font-black text-amber-700">注意ポイント</p>
          <ul className="mt-1 grid gap-1 text-xs font-bold leading-5 text-slate-600">
            {reasonBullets.low.map((reason) => (
              <li key={reason} className="flex gap-1.5">
                <span className="text-amber-700">・</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-white/72 p-3 sm:col-span-2">
          <p className="text-[11px] font-black text-berry">向いている人</p>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-600">{audience}</p>
        </div>
        <div className="rounded-2xl bg-white/72 p-3 sm:col-span-2">
          <p className="text-[11px] font-black text-slate-500">向いていない人</p>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-600">{notFor}</p>
        </div>
      </div>
    </section>
  );
}

function scoreStars(value: number) {
  return "★".repeat(value) + "☆".repeat(Math.max(0, 5 - value));
}

function scoreSummaryText(score: ReturnType<typeof getFoodValueScore>, food: FoodWithRelations, salesSummary: ReturnType<typeof getSalesSummary>) {
  if (score.stars.limitedness >= 4 && score.stars.photo >= 4) return "限定感と写真映えで、今日の記念に選びやすい一品です。";
  if (score.stars.price >= 4 && score.stars.waitCost >= 4) return "価格と買いやすさのバランスが良く、迷った時に選びやすい一品です。";
  if (score.stars.satisfaction >= 4 && score.stars.volume >= 4) return "満足度とボリュームを重視したい時に向いています。";
  if (salesSummary.shopCount <= 1) return "販売場所が限られるため、目的地を決めて取りに行くタイプです。";
  if (food.category === "kids") return "子ども連れでも候補にしやすいバランス型です。";
  return "価格、場所、カテゴリを見ながら現地で選びやすい一品です。";
}

function scoreReasonBullets(
  score: ReturnType<typeof getFoodValueScore>,
  food: FoodWithRelations,
  salesSummary: ReturnType<typeof getSalesSummary>,
  reasonText: ReturnType<typeof scoreReasonText>
) {
  const price = food.priceMin ?? food.price ?? food.locations?.find((location) => location.price)?.price;
  const high = [
    salesSummary.shopCount > 1 ? `販売店舗${salesSummary.shopCount}店舗で見つけやすい` : "1店舗限定で目的地を決めやすい",
    food.isLimited || food.endDate ? "期間限定・イベント感がある" : null,
    score.metrics.photo >= 85 ? `写真映え${score.metrics.photo}点で記録に残しやすい` : null,
    score.metrics.satisfaction >= 85 ? `満足度${score.metrics.satisfaction}点で主役候補` : null,
    price ? `予算を決めやすい ${formatPrice(price)}` : null,
    ...reasonText.high.map((reason) => `${reason}評価`)
  ].filter(Boolean) as string[];
  const low = [
    !price ? "価格は未確認" : null,
    score.metrics.price <= 45 && price ? "価格は高めなので予算確認向き" : null,
    score.metrics.waitCost <= 45 ? "限定・店内提供で待ち時間に注意" : null,
    score.metrics.volume <= 45 ? "軽めの商品で食事メインには弱い" : null,
    score.metrics.rarity <= 45 && !food.isLimited ? "希少性は控えめ" : null,
    ...reasonText.low.map((reason) => `${reason}評価`)
  ].filter(Boolean) as string[];
  return {
    high: Array.from(new Set(high)).slice(0, 4),
    low: Array.from(new Set(low.length ? low : ["大きな弱点はありません"])).slice(0, 4)
  };
}

function scoreEvidenceChips(score: ReturnType<typeof getFoodValueScore>, food: FoodWithRelations, salesSummary: ReturnType<typeof getSalesSummary>) {
  const chips = [
    food.isLimited || food.endDate ? "限定" : null,
    food.price || food.priceMin ? "予算を決めやすい" : null,
    `店舗数${salesSummary.shopCount}`,
    score.metrics.photo >= 85 ? "写真映え高" : null,
    score.metrics.satisfaction >= 85 ? "満足度高" : null,
    score.metrics.rarity >= 85 ? "希少性高" : null,
    score.metrics.price >= 75 ? "コスパ良" : null
  ].filter(Boolean) as string[];
  return Array.from(new Set(chips)).slice(0, 6);
}

function audienceText(score: ReturnType<typeof getFoodValueScore>) {
  if (score.stars.photo >= 4 && score.stars.limitedness >= 4) return "写真も限定感も重視して、今日の記念になる一品を選びたい人向けです。";
  if (score.stars.price >= 4 && score.stars.waitCost >= 4) return "価格と買いやすさを優先して、現地で迷わず決めたい人向けです。";
  if (score.stars.volume >= 4 && score.stars.satisfaction >= 4) return "しっかり食べて満足感を取りたい人向けです。";
  if (score.stars.rarity >= 4) return "定番よりもレア感やイベント感を優先したい人向けです。";
  return "価格、場所、カテゴリのバランスで選びたい人向けです。";
}

function notForText(score: ReturnType<typeof getFoodValueScore>, food: FoodWithRelations) {
  const price = food.priceMin ?? food.price ?? food.locations?.find((location) => location.price)?.price;
  if (score.stars.volume <= 2) return "しっかり食事量を取りたい人は、プレートやバーガー系も一緒に見るのがおすすめです。";
  if (score.stars.price <= 2 && price) return "安さだけで決めたい人は、コスパ最強や価格が見える商品から選ぶ方が向いています。";
  if (score.stars.waitCost <= 2) return "待ち時間や移動を減らしたい人は、販売店舗が多い商品を優先した方が選びやすいです。";
  if (food.isLimited || food.endDate) return "定番だけを落ち着いて選びたい人は、限定ではない通常候補も確認してください。";
  return "強い限定感やレア感を最優先したい人には、少し物足りない可能性があります。";
}

function MiniInfoCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-xs font-black text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-ink">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{note}</p>
    </div>
  );
}

function getSalesSummary(food: FoodWithRelations) {
  const shops = new Set<string>();
  const areas = new Set<string>();
  for (const location of food.locations ?? []) {
    if (location.shopName && location.shopName !== "店舗未確認") shops.add(location.shopName);
    if (location.areaName && location.areaName !== "エリア未確認") areas.add(location.areaName);
  }
  if (food.shop.name && food.shop.name !== "店舗未確認") shops.add(food.shop.name);
  if (food.area.name && food.area.name !== "エリア未確認") areas.add(food.area.name);
  return {
    shopCount: shops.size,
    areaCount: areas.size,
    shopLabel: shops.size <= 1 ? "1店舗のみ" : `${shops.size}店舗`,
    areaLabel: areas.size <= 1 ? "1エリア" : `${areas.size}エリア`
  };
}

function StarRating({ label, value, metric }: { label: string; value: number; metric: number }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-black text-slate-500">{label}</p>
        <p className="text-sm font-black text-ink">{metric}</p>
      </div>
      <p className="mt-1 flex gap-0.5 text-amber-400" aria-label={`${label} ${value}/5`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} size={14} fill={index < value ? "currentColor" : "none"} aria-hidden />
        ))}
      </p>
    </div>
  );
}

function categoryAffinityScore(source: FoodCategory, target: FoodCategory) {
  if (source === target) return 30;
  const lightFoods = new Set<FoodCategory>(["drink", "dessert", "snack", "popcorn", "churro"]);
  const mealFoods = new Set<FoodCategory>(["burger", "pizza", "noodle", "rice", "set", "chicken", "kids"]);
  if (lightFoods.has(source) && lightFoods.has(target)) return 10;
  if (mealFoods.has(source) && mealFoods.has(target)) return 8;
  if ((source === "drink" && mealFoods.has(target)) || (mealFoods.has(source) && target === "drink")) return -24;
  return -8;
}

function RelatedRail({ title, foods }: { title: string; foods: FoodWithRelations[] }) {
  if (foods.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-black text-ink">{title}</h3>
      <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-3">
          {foods.map((food) => (
            <Link key={`${title}-${food.id}`} href={`/foods/${food.id}`} className="w-[148px] shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm transition active:scale-[0.99] hover:-translate-y-0.5">
              <div className="h-[104px] overflow-hidden bg-slate-100">
                <FoodImage food={food} className="h-full w-full" />
              </div>
              <div className="space-y-1 p-2.5">
                <p className="line-clamp-2 h-10 break-words text-xs font-black leading-5 text-ink [overflow-wrap:anywhere]">{food.name}</p>
                <p className="truncate text-xs font-black text-park">{formatFoodPrice(food)}</p>
                <p className="truncate text-[10px] font-bold text-slate-600">{food.area.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function getDisplayLocations(food: FoodWithRelations): FoodLocation[] {
  const locations = food.locations?.filter((location) => location.shopName && location.shopName !== "店舗未確認") ?? [];
  if (locations.length > 0) return locations;
  return [
    {
      id: `${food.id}-fallback-location`,
      foodId: food.id,
      shopId: food.shop.id,
      shopName: food.shop.name,
      areaId: food.area.id,
      areaName: food.area.name,
      shopType: food.shop.type,
      price: food.price,
      sourceUrl: food.sourceUrl,
      status: food.status,
      startDate: food.startDate,
      endDate: food.endDate,
      lastCheckedAt: food.lastCheckedAt
    }
  ];
}

function getPeriodSummary(food: FoodWithRelations) {
  return { label: getSalePeriodLabel(food) };
}

function inferDiningLabel(food: FoodWithRelations) {
  if (food.shop.type === "cart" || food.shop.type === "wagon") return "カート販売";
  if (food.category === "churro" || food.category === "popcorn" || food.category === "drink" || food.category === "snack") return "食べ歩き";
  if (food.shop.type === "restaurant") return "店内飲食";
  return "形式未確認";
}

function formatDateShort(value?: string | null) {
  if (!value) return "未確認";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", timeZone: "Asia/Tokyo" }).format(date);
}

function formatDateLong(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).format(date);
}
