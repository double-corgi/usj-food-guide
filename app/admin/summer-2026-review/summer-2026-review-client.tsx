"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, Database, Filter, ImageOff, Link2, MapPin, ReceiptText, Store, Tags } from "lucide-react";

export type PriceVerificationStatus = "official-confirmed" | "secondary-confirmed" | "unresolved" | string;

export type ReviewItem = {
  id: string;
  reviewStatus: "pending" | "draft" | "approved" | string;
  name: string;
  normalizedName?: string | null;
  category?: string | null;
  collectionId?: string | null;
  price?: number | null;
  priceText?: string | null;
  priceSource?: string | null;
  priceVariants?: Array<{
    label?: string | null;
    price?: number | null;
    priceText?: string | null;
    source?: string | null;
    note?: string | null;
  }>;
  shopName?: string | null;
  shopOfficialUrl?: string | null;
  areaName?: string | null;
  diningType?: string | null;
  takeoutAvailable?: boolean | null;
  description?: string | null;
  saleStartDate?: string | null;
  saleEndDate?: string | null;
  eventStartDate?: string | null;
  eventEndDate?: string | null;
  saleTimeCondition?: string | null;
  sourceUrl?: string | null;
  officialReferenceUrls?: string[];
  lastCheckedAt?: string | null;
  imageUrl?: string | null;
  imageSourceUrl?: string | null;
  imageCandidates?: Array<{
    url?: string | null;
    sourceUrl?: string | null;
    status?: string | null;
    note?: string | null;
  }>;
  unconfirmedFields?: string[];
  duplicateCandidates?: Array<{
    source?: string | null;
    id?: string | null;
    name?: string | null;
    canonicalGroupId?: string | null;
    reason?: string | null;
    decision?: string | null;
  }>;
  dedupeNotes?: string | null;
  priceVerification?: {
    status?: PriceVerificationStatus;
    sourceType?: string | null;
    note?: string | null;
  };
  importReview?: {
    isExisting?: boolean;
    plannedFoodId?: string | null;
    duplicateHandling?: string | null;
    registrationTarget?: string | null;
    registrationPolicy?: string | null;
    notes?: string | null;
  };
};

export type ExcludedReviewItem = {
  name: string;
  reason: string;
  sourceUrl: string | null;
  plannedFoodId: string | null;
  duplicateHandling: string;
  registrationPolicy: string;
  imageUrl: string | null;
  imageSourceUrl: string | null;
};

export type SourceFileInfo = {
  path: string;
  size: number;
  updatedAt: string;
};

type ReviewFilter = "all" | "pending" | "draft" | "new" | "existing" | "price-missing" | "image-missing" | "duplicates";

const FILTERS: Array<{ id: ReviewFilter; label: string }> = [
  { id: "all", label: "すべて" },
  { id: "pending", label: "pending" },
  { id: "draft", label: "draft" },
  { id: "new", label: "新規商品" },
  { id: "existing", label: "既存商品へ追記" },
  { id: "price-missing", label: "価格未確認" },
  { id: "image-missing", label: "画像未確認" },
  { id: "duplicates", label: "重複候補" }
];

export function Summer2026ReviewClient({
  items,
  excludedItems,
  sourceFiles
}: {
  items: ReviewItem[];
  excludedItems: ExcludedReviewItem[];
  sourceFiles: SourceFileInfo[];
}) {
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>("all");
  const metrics = useMemo(() => buildMetrics(items, excludedItems), [items, excludedItems]);
  const visibleItems = useMemo(() => sortItems(items).filter((item) => matchesFilter(item, activeFilter)), [items, activeFilter]);

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="全候補" value={metrics.total} tone="blue" />
        <MetricCard label="pending" value={metrics.pending} tone="blue" />
        <MetricCard label="draft" value={metrics.draft} tone="slate" />
        <MetricCard label="approved" value={metrics.approved} tone="slate" />
        <MetricCard label="新規登録予定" value={metrics.newItems} tone="gold" />
        <MetricCard label="既存商品へ追記予定" value={metrics.existingItems} tone="blue" />
        <MetricCard label="除外予定" value={metrics.excludedItems} tone="slate" />
        <MetricCard label="価格未確認" value={metrics.priceMissing} tone="warn" />
        <MetricCard label="画像未確認" value={metrics.imageMissing} tone="warn" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <Filter size={18} aria-hidden />
            表示フィルター
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-full border px-4 py-2 text-xs font-black transition ${
                  activeFilter === filter.id ? "border-park bg-park text-white" : "border-slate-200 bg-white text-ink hover:border-park hover:text-park"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-cream p-4 shadow-soft sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-ink">確認元ファイル</h2>
            <p className="mt-1 text-sm font-bold text-slate-600">画面は登録前データと調査資料を確認元として表示しています。</p>
          </div>
          <div className="grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-3">
            {sourceFiles.map((file) => (
              <div key={file.path} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <p className="break-all font-black text-ink">{file.path}</p>
                <p className="mt-1">{formatFileSize(file.size)} / {formatDate(file.updatedAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {visibleItems.map((item) => (
          <ReviewCard key={item.id} item={item} />
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sun/20 text-amber-800">
            <AlertTriangle size={21} aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-black text-ink">今回の登録候補から除外</h2>
            <p className="mt-1 text-sm font-bold leading-6 text-slate-600">夏フード候補30件とは別に、登録しない方針として確認した商品です。</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {excludedItems.map((item) => (
            <ExcludedCard key={item.name} item={item} />
          ))}
        </div>
      </section>
    </>
  );
}

function ReviewCard({ item }: { item: ReviewItem }) {
  const priceStatus = item.priceVerification?.status ?? "unresolved";
  const references = uniqueText([item.sourceUrl, ...(item.officialReferenceUrls ?? []), item.shopOfficialUrl]);
  const unconfirmedFields = item.unconfirmedFields ?? [];
  const duplicateCandidates = item.duplicateCandidates ?? [];

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft" data-review-card={item.id}>
      <div className="grid gap-0 lg:grid-cols-[minmax(260px,0.86fr)_1.14fr]">
        <div className="bg-slate-100">
          {item.imageUrl ? (
            // Candidate image URLs are reviewed as-is; missing or mismatched fallbacks are intentionally avoided here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.name} className="aspect-[4/3] h-full min-h-72 w-full object-cover" loading="lazy" />
          ) : (
            <div className="grid aspect-[4/3] min-h-72 place-items-center bg-slate-100 p-6 text-center">
              <div>
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-500 shadow-soft">
                  <ImageOff size={28} aria-hidden />
                </span>
                <p className="mt-4 text-sm font-black text-ink">画像未確認</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">採用画像なし。代替画像は使用していません。</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={item.reviewStatus} />
            <PriceStatusBadge status={priceStatus} />
            <span className={`rounded-full px-3 py-1 text-xs font-black ${item.importReview?.isExisting ? "bg-ink text-white" : "bg-sun/25 text-amber-900"}`}>
              {item.importReview?.isExisting ? "既存商品へ追記" : "新規商品"}
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-black leading-tight text-ink [overflow-wrap:anywhere]">{item.name}</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{item.description || "商品説明未確認"}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoBlock icon={<ReceiptText size={18} aria-hidden />} label="価格" value={formatPrice(item)} />
            <InfoBlock icon={<Store size={18} aria-hidden />} label="店舗" value={item.shopName || "未確認"} />
            <InfoBlock icon={<MapPin size={18} aria-hidden />} label="エリア" value={item.areaName || "未確認"} />
            <InfoBlock icon={<Tags size={18} aria-hidden />} label="カテゴリ" value={item.category || "未確認"} />
            <InfoBlock icon={<Database size={18} aria-hidden />} label="collection" value={item.collectionId || "未確認"} />
            <InfoBlock icon={<CalendarDays size={18} aria-hidden />} label="販売期間" value={formatSalePeriod(item)} />
          </div>

          <DetailSection title="価格バリエーション">
            {item.priceVariants && item.priceVariants.length > 0 ? (
              <ul className="space-y-2">
                {item.priceVariants.map((variant, index) => (
                  <li key={`${variant.label ?? "variant"}-${index}`} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-700">
                    <span className="font-black text-ink">{variant.label || "バリエーション"}</span>
                    <span> / {variant.priceText || (variant.price ? `${variant.price.toLocaleString("ja-JP")}円` : "価格未確認")}</span>
                    {variant.note ? <span> / {variant.note}</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-bold text-slate-500">価格バリエーションなし</p>
            )}
          </DetailSection>

          <div className="grid gap-3 md:grid-cols-2">
            <DetailSection title="登録方針">
              <dl className="space-y-2 text-xs font-bold leading-5 text-slate-700">
                <Definition label="使用予定foodId" value={item.importReview?.plannedFoodId || item.id} />
                <Definition label="重複処理" value={item.importReview?.duplicateHandling || item.dedupeNotes || "未確認"} />
                <Definition label="保存先" value={item.importReview?.registrationTarget || item.importReview?.registrationPolicy || "未確認"} />
              </dl>
            </DetailSection>

            <DetailSection title="未確認項目">
              {unconfirmedFields.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {unconfirmedFields.map((field) => (
                    <span key={field} className="rounded-full bg-sun/20 px-2.5 py-1 text-xs font-black text-amber-900">
                      {field}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-bold text-park">未確認項目なし</p>
              )}
            </DetailSection>
          </div>

          <DetailSection title="公式URL">
            <LinkList urls={references} emptyText="公式参照URL未確認" />
          </DetailSection>

          <DetailSection title="画像出典URL">
            {item.imageSourceUrl ? <LinkList urls={[item.imageSourceUrl]} emptyText="画像出典URL未確認" /> : <p className="text-sm font-bold text-slate-500">画像出典URL未確認</p>}
          </DetailSection>

          {duplicateCandidates.length > 0 ? (
            <DetailSection title="重複候補">
              <ul className="space-y-2">
                {duplicateCandidates.map((candidate, index) => (
                  <li key={`${candidate.id ?? "candidate"}-${index}`} className="rounded-xl border border-slate-200 bg-cream px-3 py-2 text-xs font-bold leading-5 text-slate-700">
                    <span className="font-black text-ink">{candidate.name || candidate.id || "候補名未確認"}</span>
                    {candidate.reason ? <span> / {candidate.reason}</span> : null}
                    {candidate.decision ? <span> / {candidate.decision}</span> : null}
                  </li>
                ))}
              </ul>
            </DetailSection>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ExcludedCard({ item }: { item: ExcludedReviewItem }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-cream p-4">
      <h3 className="text-base font-black leading-tight text-ink [overflow-wrap:anywhere]">{item.name}</h3>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-700">{item.reason}</p>
      <dl className="mt-3 space-y-2 text-xs font-bold leading-5 text-slate-700">
        <Definition label="使用予定foodId" value={item.plannedFoodId || "なし"} />
        <Definition label="重複処理" value={item.duplicateHandling} />
        <Definition label="登録方針" value={item.registrationPolicy} />
      </dl>
      <div className="mt-3">
        <LinkList urls={uniqueText([item.sourceUrl, item.imageSourceUrl])} emptyText="参照URL未確認" />
      </div>
    </article>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: "blue" | "gold" | "slate" | "warn" }) {
  const toneClass = {
    blue: "border-park/20 bg-mint text-park",
    gold: "border-sun/40 bg-sun/20 text-amber-900",
    slate: "border-slate-200 bg-white text-ink",
    warn: "border-amber-300 bg-amber-50 text-amber-900"
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 shadow-soft ${toneClass}`}>
      <p className="text-xs font-black">{label}</p>
      <p className="mt-2 text-3xl font-black leading-none">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className = status === "pending" ? "bg-park text-white" : status === "draft" ? "bg-slate-100 text-slate-700" : "bg-berry text-white";
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>{status}</span>;
}

function PriceStatusBadge({ status }: { status: PriceVerificationStatus }) {
  const config =
    status === "official-confirmed"
      ? { label: "価格: 公式確認", className: "bg-mint text-park" }
      : status === "secondary-confirmed"
        ? { label: "価格: 補助情報確認", className: "bg-sun/25 text-amber-900" }
        : { label: "価格: 未確認", className: "bg-slate-100 text-slate-700" };

  return <span className={`rounded-full px-3 py-1 text-xs font-black ${config.className}`}>{config.label}</span>;
}

function InfoBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="flex items-center gap-2 text-xs font-black text-slate-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-black leading-5 text-ink [overflow-wrap:anywhere]">{value}</p>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3">
      <h3 className="text-xs font-black text-slate-500">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Definition({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-black text-ink [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}

function LinkList({ urls, emptyText }: { urls: string[]; emptyText: string }) {
  if (urls.length === 0) return <p className="text-sm font-bold text-slate-500">{emptyText}</p>;

  return (
    <ul className="space-y-2">
      {urls.map((url) => (
        <li key={url}>
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-start gap-2 text-xs font-black leading-5 text-park underline underline-offset-4">
            <Link2 size={14} className="mt-0.5 shrink-0" aria-hidden />
            <span className="[overflow-wrap:anywhere]">{url}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function buildMetrics(items: ReviewItem[], excludedItems: ExcludedReviewItem[]) {
  return {
    total: items.length,
    pending: items.filter((item) => item.reviewStatus === "pending").length,
    draft: items.filter((item) => item.reviewStatus === "draft").length,
    approved: items.filter((item) => item.reviewStatus === "approved").length,
    newItems: items.filter((item) => !item.importReview?.isExisting).length,
    existingItems: items.filter((item) => item.importReview?.isExisting).length,
    excludedItems: excludedItems.length,
    priceMissing: items.filter(hasMissingPrice).length,
    imageMissing: items.filter((item) => !item.imageUrl).length
  };
}

function matchesFilter(item: ReviewItem, filter: ReviewFilter) {
  if (filter === "all") return true;
  if (filter === "pending") return item.reviewStatus === "pending";
  if (filter === "draft") return item.reviewStatus === "draft";
  if (filter === "new") return !item.importReview?.isExisting;
  if (filter === "existing") return Boolean(item.importReview?.isExisting);
  if (filter === "price-missing") return hasMissingPrice(item);
  if (filter === "image-missing") return !item.imageUrl;
  if (filter === "duplicates") return Boolean(item.importReview?.isExisting || item.duplicateCandidates?.length);
  return true;
}

function sortItems(items: ReviewItem[]) {
  return [...items].sort((left, right) => {
    const statusDiff = statusRank(left.reviewStatus) - statusRank(right.reviewStatus);
    if (statusDiff !== 0) return statusDiff;

    const existingDiff = existingRank(left) - existingRank(right);
    if (existingDiff !== 0) return existingDiff;

    return left.name.localeCompare(right.name, "ja");
  });
}

function statusRank(status: string) {
  if (status === "pending") return 0;
  if (status === "draft") return 1;
  return 2;
}

function existingRank(item: ReviewItem) {
  return item.importReview?.isExisting ? 1 : 0;
}

function hasMissingPrice(item: ReviewItem) {
  return item.price == null || item.priceVerification?.status === "unresolved";
}

function formatPrice(item: ReviewItem) {
  if (item.priceText) return item.priceText;
  if (item.price != null) return `${item.price.toLocaleString("ja-JP")}円`;
  return "未確認";
}

function formatSalePeriod(item: ReviewItem) {
  if (item.saleStartDate || item.saleEndDate) return `${item.saleStartDate ?? "開始未確認"} - ${item.saleEndDate ?? "終了未確認"}`;
  if (item.eventStartDate || item.eventEndDate) return `collection参考: ${item.eventStartDate ?? "開始未確認"} - ${item.eventEndDate ?? "終了未確認"}`;
  return "未確認";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size}B`;
  return `${Math.round(size / 1024).toLocaleString("ja-JP")}KB`;
}

function uniqueText(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}
