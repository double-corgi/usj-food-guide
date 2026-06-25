"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Check, ExternalLink, Pause, Search } from "lucide-react";
import { categoryLabels } from "@/lib/constants";
import { formatFoodPrice, getFoodAreaSummary, getPriceSource, getPriceSourceLabel, needsAreaReview } from "@/lib/food-utils";
import type { FoodWithRelations, PriceSource } from "@/types/domain";
import { holdManualPriceReview, saveManualMetadata, saveManualPrice, type ManualPriceState } from "./actions";

const initialState: ManualPriceState = { ok: false, message: "" };

export function PriceReviewCard({
  food,
  index,
  total,
  sourceUrl,
  priceSourceUrl,
  priorityScore,
  qualityScore,
  duplicateCandidate,
  manualDecision
}: {
  food: FoodWithRelations;
  index: number;
  total: number;
  sourceUrl: string;
  priceSourceUrl?: string;
  priorityScore: number;
  qualityScore: number;
  duplicateCandidate: boolean;
  manualDecision?: {
    status?: string;
    reason?: string;
    reasonCode?: string;
    checkedSourceUrl?: string;
    updatedAt?: string;
  };
}) {
  const [price, setPrice] = useState("");
  const [saveState, saveAction, saving] = useActionState(saveManualPrice, initialState);
  const [metadataState, metadataAction, metadataSaving] = useActionState(saveManualMetadata, initialState);
  const [holdState, holdAction, holding] = useActionState(holdManualPriceReview, initialState);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const defaultSourceUrl = priceSourceUrl || sourceUrl;
  const knownPrice = hasKnownPrice(food);
  const priceSource = getPriceSource(food);
  const searchQuery = useMemo(() => `${food.name} USJ 価格`, [food.name]);
  const nextSources = nextSourceCandidates(food, sourceUrl, manualDecision?.reasonCode);

  useEffect(() => {
    if (saveState.ok && saveState.foodId === food.id) {
      window.setTimeout(() => focusCard(index + 1), 80);
    }
  }, [food.id, index, saveState]);

  if (saveState.ok && saveState.foodId === food.id) return null;

  return (
    <article
      data-price-review-card
      data-index={index}
      className={`rounded-2xl border p-4 shadow-soft ${knownPrice ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-white"}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setPrice("");
          priceInputRef.current?.blur();
        }
        if ((event.key === "j" || event.key === "ArrowRight") && event.target === event.currentTarget) focusCard(index + 1);
        if ((event.key === "k" || event.key === "ArrowLeft") && event.target === event.currentTarget) focusCard(index - 1);
      }}
      tabIndex={0}
    >
      <div className="grid gap-4 lg:grid-cols-[132px_minmax(0,1fr)_minmax(300px,380px)]">
        <div className="overflow-hidden rounded-xl bg-slate-100">
          {primaryImage(food) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={primaryImage(food)} alt="" className="aspect-[4/3] w-full object-cover" />
          ) : (
            <div className="grid aspect-[4/3] place-items-center text-xs font-black text-slate-400">画像なし</div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <PriceStatusBadge known={knownPrice} />
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{categoryLabels[food.category] ?? food.category}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
              {index + 1}/{total}
            </span>
            <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-black text-park">Priority {priorityScore}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">品質 {qualityScore}</span>
            {duplicateCandidate ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-700">重複候補</span> : null}
            {manualDecision?.status === "unconfirmable" ? <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-black text-violet-700">確認不能理由あり</span> : null}
          </div>
          <h3 className="mt-2 text-lg font-black leading-snug text-ink">{food.name}</h3>
          <div className="mt-2 grid gap-1 text-xs font-bold text-slate-500">
            <p>店舗: {food.shop.name}</p>
            <p>エリア: {getFoodAreaSummary(food)}</p>
            <p>
              現在価格: <span className={knownPrice ? "font-black text-park" : "font-black text-rose-600"}>{formatFoodPrice(food)}</span>
            </p>
            <p>価格確認日時: {formatDate(food.priceLastCheckedAt ?? food.lastCheckedAt)}</p>
            <p>情報ソース: {getPriceSourceLabel(priceSource)}</p>
            <p>価格取得元URL: {food.priceSourceUrl ? food.priceSourceUrl : "未設定"}</p>
            {manualDecision?.reason ? <p>確認不能理由: {manualDecision.reason}</p> : null}
            {manualDecision?.updatedAt ? <p>理由保存日: {formatDate(manualDecision.updatedAt)}</p> : null}
          </div>
          {!knownPrice ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-black text-amber-900">次に確認すべき候補ソース</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {nextSources.map((source) => (
                  <span key={source} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-amber-800 shadow-sm">
                    {source}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <details className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-500">
            <summary className="cursor-pointer font-black text-slate-700">出典URLを確認</summary>
            <p className="mt-2 break-all leading-5">{sourceUrl}</p>
          </details>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-xs font-black text-white">
              公式ページを開く
              <ExternalLink size={14} aria-hidden />
            </a>
            <a href={`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-100 px-4 text-xs font-black text-slate-700">
              価格検索
              <Search size={14} aria-hidden />
            </a>
            <a href={`/foods/${food.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 px-4 text-xs font-black text-park">
              通常画面
              <ExternalLink size={14} aria-hidden />
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <form action={saveAction} className="space-y-3">
            <input type="hidden" name="foodId" value={food.id} />
            <label className="block">
              <span className="text-xs font-black text-slate-500">価格</span>
              <div className="mt-1 flex h-12 items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:border-park">
                <span className="text-sm font-black text-slate-400">¥</span>
                <input
                  ref={priceInputRef}
                  data-price-input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="price"
                  value={price}
                  onChange={(event) => setPrice(event.target.value.replace(/[^\d]/g, ""))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.form?.requestSubmit();
                    if (event.key === "Escape") setPrice("");
                  }}
                  required
                  placeholder="1200"
                  className="h-full min-w-0 flex-1 bg-transparent px-2 text-lg font-black text-ink outline-none"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-black text-slate-500">価格取得元URL</span>
              <input name="priceSourceUrl" type="url" defaultValue={defaultSourceUrl} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold outline-none focus:border-park" />
            </label>
            <label className="block">
              <span className="text-xs font-black text-slate-500">出典名</span>
              <input name="priceSourceName" defaultValue="USJ公式 手動確認" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold outline-none focus:border-park" />
            </label>
            <label className="block">
              <span className="text-xs font-black text-slate-500">価格ソース種別</span>
              <select name="priceSource" defaultValue={defaultPriceSource(priceSource)} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-ink outline-none focus:border-park">
                <option value="official">USJ公式</option>
                <option value="official_app">公式アプリ</option>
                <option value="menu_photo">現地メニュー写真</option>
                <option value="trusted_report">高信頼現地レポート</option>
                <option value="social_report">SNS現地報告</option>
              </select>
            </label>
            <button type="submit" disabled={saving || !price} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-park text-sm font-black text-white disabled:bg-slate-300">
              <Check size={16} aria-hidden />
              {saving ? "保存中..." : "保存して次へ"}
            </button>
            {saveState.message && saveState.foodId === food.id ? <p className={`text-xs font-black ${saveState.ok ? "text-emerald-700" : "text-rose-700"}`}>{saveState.message}</p> : null}
          </form>

          <form action={holdAction} className="mt-3 space-y-2 border-t border-slate-200 pt-3">
            <input type="hidden" name="foodId" value={food.id} />
            <label className="block">
              <span className="text-xs font-black text-slate-500">確認不能理由</span>
              <select name="holdReasonCode" defaultValue={manualDecision?.reasonCode ?? defaultReasonCode(food, sourceUrl)} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-ink outline-none focus:border-park">
                <option value="source_url_missing">出典URL未設定</option>
                <option value="official_exact_price_not_found">公式ページで同一商品価格なし</option>
                <option value="product_name_mismatch">商品名一致なし</option>
                <option value="only_similar_product_found">類似商品のみ</option>
                <option value="set_or_size_ambiguous">セット/サイズ違いが曖昧</option>
                <option value="pdf_manual_check_required">PDF手動確認待ち</option>
                <option value="shop_page_check_required">店舗ページ確認待ち</option>
                <option value="trusted_report_needed">高信頼レポート確認待ち</option>
              </select>
            </label>
            <input name="checkedSourceUrl" type="url" defaultValue={manualDecision?.checkedSourceUrl ?? defaultSourceUrl} placeholder="確認したURL" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold outline-none focus:border-park" />
            <input name="holdReason" defaultValue={manualDecision?.reason ?? ""} placeholder="任意メモ: 同一商品価格なし、サイズ違いのみ等" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold outline-none focus:border-park" />
            <button type="submit" disabled={holding} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white text-xs font-black text-slate-600 ring-1 ring-slate-200">
              <Pause size={14} aria-hidden />
              確認不能として理由保存
            </button>
            {holdState.message && holdState.foodId === food.id ? <p className={`text-xs font-black ${holdState.ok ? "text-emerald-700" : "text-rose-700"}`}>{holdState.message}</p> : null}
          </form>

          <form action={metadataAction} className="mt-3 space-y-2 border-t border-slate-200 pt-3">
            <input type="hidden" name="foodId" value={food.id} />
            <label className="block">
              <span className="text-xs font-black text-slate-500">カテゴリ確認</span>
              <select name="category" defaultValue={food.category} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-ink outline-none focus:border-park">
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black text-slate-500">店舗</span>
              <input name="shopName" defaultValue={food.shop.name} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold outline-none focus:border-park" />
            </label>
            <label className="block">
              <span className="text-xs font-black text-slate-500">エリア</span>
              <input name="areaName" defaultValue={needsAreaReview(food) ? "エリア確認中" : getFoodAreaSummary(food, 1)} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold outline-none focus:border-park" />
            </label>
            <button type="submit" disabled={metadataSaving} className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white disabled:bg-slate-300">
              監査情報を保存
            </button>
            {metadataState.message && metadataState.foodId === food.id ? <p className={`text-xs font-black ${metadataState.ok ? "text-emerald-700" : "text-rose-700"}`}>{metadataState.message}</p> : null}
          </form>
        </div>
      </div>
    </article>
  );
}

function defaultPriceSource(source: PriceSource) {
  return source === "unknown" ? "official" : source;
}

function defaultReasonCode(food: FoodWithRelations, sourceUrl: string) {
  if (!sourceUrl) return "source_url_missing";
  if (food.category === "set" || food.category === "kids") return "set_or_size_ambiguous";
  if (/pdf/i.test(sourceUrl)) return "pdf_manual_check_required";
  if (food.shop.name === "店舗未確認" || needsAreaReview(food)) return "shop_page_check_required";
  return "official_exact_price_not_found";
}

function nextSourceCandidates(food: FoodWithRelations, sourceUrl: string, reasonCode?: string) {
  const sources = new Set<string>();
  if (sourceUrl) sources.add("公式商品ページ");
  if (/pdf/i.test(sourceUrl) || reasonCode === "pdf_manual_check_required") sources.add("公式PDF原本");
  sources.add("USJ公式アプリ");
  sources.add("現地メニュー写真");
  if (food.shop.name && food.shop.name !== "店舗未確認") sources.add(`${food.shop.name} 店頭メニュー`);
  sources.add("高信頼現地レポート");
  if (reasonCode === "set_or_size_ambiguous") sources.add("サイズ/セット内容が分かる写真");
  return Array.from(sources).slice(0, 6);
}

function PriceStatusBadge({ known }: { known: boolean }) {
  if (known) return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">価格確認済み</span>;
  return <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-700">価格未確認 / 公式価格確認中</span>;
}

function hasKnownPrice(food: FoodWithRelations) {
  return Boolean(food.price ?? food.priceMin ?? food.locations?.find((location) => location.price)?.price);
}

function primaryImage(food: FoodWithRelations) {
  const generatedFood = food as FoodWithRelations & { representativeImageUrl?: string };
  return food.imageUrl ?? generatedFood.representativeImageUrl ?? food.images.find((image) => image.enabled)?.imageUrl;
}

function formatDate(value?: string) {
  if (!value) return "未確認";
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(new Date(value));
}

function focusCard(index: number) {
  const card = document.querySelector<HTMLElement>(`[data-price-review-card][data-index="${index}"]`);
  const input = card?.querySelector<HTMLInputElement>("[data-price-input]");
  input?.focus();
}
