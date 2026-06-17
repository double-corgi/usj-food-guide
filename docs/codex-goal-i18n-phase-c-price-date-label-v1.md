# Codex Goal: i18n Phase C「価格・日付・残存日本語固定ラベル多言語化」

## 概要

i18n Phase B で残った日本語固定ラベルを解消し、価格・日付表示を多言語対応させる。

**参照設計書:** `docs/i18n-phase-c-price-date-label-design-v1.md`

---

## 禁止事項（最優先）

以下は**絶対にやってはいけない**。発見したら作業を停止してレビュー担当に確認すること。

- `lib/food-utils.ts` の既存関数シグネチャ・内部ロジックを変更しない
- `lib/store-utils.ts` を変更しない
- `lib/constants.ts` の `categoryLabels`・`shopTypeLabels`・`diningTypeLabels` を削除しない
- `scripts/output/` 以下の generated JSON を変更しない
- DB・crawler スクリプトを変更しない
- 商品名・店舗名を翻訳しない
- 価格の主表示を JPY 以外に置き換えない
- 外部 API を追加しない
- `/en`・`/ko`・`/zh-TW` などのルートを追加しない
- `app/areas/[id]/page.tsx` に `useLocale()` を直接追加しない（Server Component のため）
- `lib/food-utils.ts` の private 関数（`formatDateJa` 等）を export するためだけに変更しない
- `lib/currency-rates.ts` の数値を設計書記載値（KRW: 9.2、TWD: 0.21）以外に変更しない
- Phase C+ 対象（`home-progress-client.tsx`・`eaten-food-rails.tsx`・`eaten-experience.tsx`・`store-food-list.tsx`）を変更しない

---

## Git 作業前処理

```bash
git status
```

**未コミット変更がある場合:**
```bash
git add .
git commit -m "backup-before-i18n-phase-c-price-date-label"
git push
```

**未コミット変更がない場合:**
```bash
git commit --allow-empty -m "backup-before-i18n-phase-c-price-date-label"
git push
```

---

## 実装前確認

`lib/food-utils.ts` で以下の関数が export されていることを確認する。

```bash
grep -n "^export function getSaleStatus\|^export function getRemainingDays\|^export function getSalePeriodLabel\|^export function getSaleStartDate\|^export function getSaleEndDate" lib/food-utils.ts
```

期待出力: 5件すべてヒットすること。未 export の関数があった場合は `lib/food-utils.ts` を変更せず、`lib/i18n/sale-label-utils.ts` 内でローカル補助関数を用意して対処すること。

---

## Step 1: lib/currency-rates.ts を新規作成

```ts
/**
 * 静的為替レート（概算）
 * 更新日: 2026-06-17
 * 目安: 四半期ごとに見直す
 * 免責: あくまで参考値。実際の為替レートは変動します。
 */
export const CURRENCY_RATES = {
  KRW_PER_JPY: 9.2,   // 1 JPY ≈ 9.2 KRW (2026-06 概算)
  TWD_PER_JPY: 0.21,  // 1 JPY ≈ 0.21 TWD (2026-06 概算)
  updatedAt: "2026-06-17"
} as const;

/** 100ウォン単位で丸める */
export function convertToKRW(jpy: number): number {
  return Math.round((jpy * CURRENCY_RATES.KRW_PER_JPY) / 100) * 100;
}

/** 1NT$単位で丸める */
export function convertToTWD(jpy: number): number {
  return Math.round(jpy * CURRENCY_RATES.TWD_PER_JPY);
}
```

---

## Step 2: lib/i18n/format-date.ts を新規作成

```ts
import type { Locale } from "@/lib/i18n/locales";

const intlLocaleMap: Record<Locale, string> = {
  ja: "ja-JP",
  en: "en-US",
  ko: "ko-KR",
  "zh-TW": "zh-TW"
};

/**
 * YYYY-MM-DD 形式の日付文字列をロケール対応でフォーマット
 * 失敗時は元の文字列をそのまま返す
 */
export function formatDateI18n(
  dateStr: string | null | undefined,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }
): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat(intlLocaleMap[locale], {
      timeZone: "Asia/Tokyo",
      ...options
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * 短縮形の日付フォーマット（月/日のみ）
 * ja: 3月9日、en: Mar 9、ko: 3월 9일、zh-TW: 3月9日
 */
export function formatDateShortI18n(
  dateStr: string | null | undefined,
  locale: Locale
): string | null {
  return formatDateI18n(dateStr, locale, { month: "short", day: "numeric" });
}
```

---

## Step 3: lib/i18n/format-price.ts を新規作成

```ts
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { convertToKRW, convertToTWD } from "@/lib/currency-rates";

type PriceInput = {
  price?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
};

/**
 * ロケール対応の価格フォーマット
 * - ja / en: ¥1,200
 * - ko: ¥1,200（약 ₩11,000）
 * - zh-TW: ¥1,200（約 NT$252）
 * 価格範囲の場合、補助通貨も範囲表示にする
 * - ko: ¥500 – ¥800（약 ₩4,600–₩7,400）
 * - zh-TW: ¥500 – ¥800（約 NT$105–NT$168）
 */
export function formatPriceI18n(
  food: PriceInput,
  locale: Locale,
  t: (key: TranslationKey) => string
): string {
  const min = food.priceMin ?? food.price;
  const max = food.priceMax ?? food.price;
  if (!min) return t("foods.priceUnknown");

  const isRange = Boolean(max && max !== min);
  const primaryMin = formatJpy(min);
  const primaryMax = isRange ? formatJpy(max!) : null;
  const jpySeparator = locale === "ja" ? "〜" : " – ";
  const primary = primaryMax ? `${primaryMin}${jpySeparator}${primaryMax}` : primaryMin;

  if (locale === "ko") {
    const supplement = isRange
      ? `약 ₩${convertToKRW(min).toLocaleString("ko-KR")}–₩${convertToKRW(max!).toLocaleString("ko-KR")}`
      : `약 ₩${convertToKRW(min).toLocaleString("ko-KR")}`;
    return `${primary}（${supplement}）`;
  }
  if (locale === "zh-TW") {
    const supplement = isRange
      ? `約 NT$${convertToTWD(min)}–NT$${convertToTWD(max!)}`
      : `約 NT$${convertToTWD(min)}`;
    return `${primary}（${supplement}）`;
  }
  return primary;
}

function formatJpy(price: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(price);
}
```

---

## Step 4: lib/i18n/sale-label-utils.ts を新規作成

**前提**: 以下を `lib/food-utils.ts` から import して使う。未 export の場合は停止して確認すること。

```ts
import {
  getSaleStatus,
  getRemainingDays,
  getSaleStartDate,
  getSaleEndDate,
  getSalePeriodLabel
} from "@/lib/food-utils";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { formatDateShortI18n } from "@/lib/i18n/format-date";
import type { Locale } from "@/lib/i18n/locales";
import type { FoodWithRelations, SaleStatus } from "@/types/domain";

type UrgencyFood = Pick<FoodWithRelations,
  "saleEndDate" | "endDate" | "remainingDays" | "saleStatus" | "status" | "saleStartDate" | "startDate"
>;

type TFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

/**
 * 終了間近・残り日数ラベルの i18n ラッパー
 * - null を返した場合はラベル非表示
 */
export function getUrgencyLabelI18n(food: UrgencyFood, t: TFn): string | null {
  const remainingDays = getRemainingDays(food);
  if (typeof remainingDays !== "number") return null;
  if (getSaleStatus(food) === "ended") return t("common.ended");
  if (remainingDays <= 14) return t("urgency.endingSoonDays", { count: remainingDays });
  if (remainingDays <= 30) return t("foods.saleFilterEndingSoon");  // 既存キー再利用
  return t("urgency.daysRemaining", { count: remainingDays });
}

/**
 * 販売状態ラベルの i18n ラッパー
 */
export function getSaleStatusLabelI18n(
  food: Parameters<typeof getSaleStatus>[0],
  t: TFn
): string {
  const status = getSaleStatus(food);
  const keyMap: Record<SaleStatus, TranslationKey> = {
    active: "common.saleActive",
    ended: "common.ended",
    upcoming: "foods.saleFilterUpcoming",
    unknown: "foods.saleFilterUnknown"
  };
  return t(keyMap[status]);
}

/**
 * 販売期間ラベルの i18n ラッパー
 * - ja ロケールでは food.salePeriodLabel フィールド（generated JSON 由来）を優先
 * - en/ko/zh-TW では formatDateShortI18n を使って再構築
 */
export function getSalePeriodLabelI18n(
  food: Parameters<typeof getSalePeriodLabel>[0],
  locale: Locale,
  t: TFn
): string {
  // ja: 既存データを優先（generated JSON 由来の日本語文字列をそのまま使う）
  if (locale === "ja") return getSalePeriodLabel(food);

  const saleStatus = getSaleStatus(food);
  const start = getSaleStartDate(food);
  const end = getSaleEndDate(food);

  if (saleStatus === "active") {
    if (start && end) {
      return t("salePeriod.dateRange", {
        start: formatDateShortI18n(start, locale) ?? start,
        end: formatDateShortI18n(end, locale) ?? end
      });
    }
    if (start) {
      return t("salePeriod.openEndFrom", {
        start: formatDateShortI18n(start, locale) ?? start
      });
    }
    return t("common.saleActive");
  }
  if (saleStatus === "ended") {
    if (start && end) {
      return t("salePeriod.dateRange", {
        start: formatDateShortI18n(start, locale) ?? start,
        end: formatDateShortI18n(end, locale) ?? end
      });
    }
    return t("common.ended");
  }
  if (saleStatus === "upcoming") {
    if (start) {
      return t("salePeriod.upcomingFrom", {
        start: formatDateShortI18n(start, locale) ?? start
      });
    }
    return t("foods.saleFilterUpcoming");
  }
  return t("foods.saleFilterUnknown");
}
```

---

## Step 5: components/area-urgency-label.tsx を新規作成

**重要**: Server Component（`app/areas/[id]/page.tsx`）から Client Component への props は最小フィールドのみ渡す。`food` オブジェクト全体を渡さないこと。

```tsx
"use client";

import { getUrgencyLabelI18n } from "@/lib/i18n/sale-label-utils";
import { useLocale } from "@/lib/i18n/use-locale";

/** urgency label 判定に必要な最小フィールド */
type AreaUrgencyLabelProps = {
  saleEndDate?: string | null;
  endDate?: string | null;
  remainingDays?: number | null;
  saleStatus?: string | null;
  status?: string | null;
  saleStartDate?: string | null;
  startDate?: string | null;
};

export function AreaUrgencyLabel({ food }: { food: AreaUrgencyLabelProps }) {
  const { t } = useLocale();
  const label = getUrgencyLabelI18n(food as Parameters<typeof getUrgencyLabelI18n>[0], t);
  if (!label) return null;
  return <p className="mt-1 text-[11px] font-bold text-slate-500">{label}</p>;
}
```

---

## Step 6: lib/i18n/dictionaries.ts に新規キーを追加

以下の10キー × 4ロケール = 40エントリを `dictionaries.ts` に追加する。

**追加場所**: 各ロケールブロック内の既存キーを壊さず、適切なグループの末尾に追記する。既存キーの削除・変更は一切しない。

### ja ロケールに追加

```ts
// foodCard 系
"foodCard.moreAreas": "ほか{{count}}箇所",

// recommendRail 系
"recommendRail.kicker": "候補",
"recommendRail.defaultTitle": "チェック候補",
"recommendRail.defaultDescription": "残り・限定・近いジャンルから、候補を絞れます。",
"recommendRail.viewMore": "もっと探す",

// urgency 系
"urgency.endingSoonDays": "残り{{count}}日",
"urgency.daysRemaining": "あと{{count}}日",

// salePeriod 系
"salePeriod.dateRange": "{{start}}〜{{end}}",
"salePeriod.openEndFrom": "{{start}}〜販売終了日未定",
"salePeriod.upcomingFrom": "{{start}}開始予定",
```

### en ロケールに追加

```ts
// foodCard 系
"foodCard.moreAreas": "+{{count}} more",

// recommendRail 系
"recommendRail.kicker": "Picks",
"recommendRail.defaultTitle": "Check These",
"recommendRail.defaultDescription": "Narrow down by remaining, limited edition, or similar genres.",
"recommendRail.viewMore": "Find more",

// urgency 系
"urgency.endingSoonDays": "{{count}} days left",
"urgency.daysRemaining": "{{count}} more days",

// salePeriod 系
"salePeriod.dateRange": "{{start}} – {{end}}",
"salePeriod.openEndFrom": "From {{start}} (end TBD)",
"salePeriod.upcomingFrom": "Starting {{start}}",
```

### ko ロケールに追加

```ts
// foodCard 系
"foodCard.moreAreas": "외 {{count}}곳",

// recommendRail 系
"recommendRail.kicker": "추천",
"recommendRail.defaultTitle": "확인 후보",
"recommendRail.defaultDescription": "남은 것・한정・비슷한 장르에서 후보를 추릴 수 있습니다.",
"recommendRail.viewMore": "더 찾기",

// urgency 系
"urgency.endingSoonDays": "{{count}}일 남음",
"urgency.daysRemaining": "{{count}}일 더",

// salePeriod 系
"salePeriod.dateRange": "{{start}} – {{end}}",
"salePeriod.openEndFrom": "{{start}}부터 (종료일 미정)",
"salePeriod.upcomingFrom": "{{start}} 시작 예정",
```

### zh-TW ロケールに追加

```ts
// foodCard 系
"foodCard.moreAreas": "另{{count}}處",

// recommendRail 系
"recommendRail.kicker": "推薦",
"recommendRail.defaultTitle": "推薦選項",
"recommendRail.defaultDescription": "從剩餘、限定、相近類別中篩選候選。",
"recommendRail.viewMore": "更多",

// urgency 系
"urgency.endingSoonDays": "剩{{count}}天",
"urgency.daysRemaining": "還有{{count}}天",

// salePeriod 系
"salePeriod.dateRange": "{{start}} – {{end}}",
"salePeriod.openEndFrom": "自{{start}}起（結束日未定）",
"salePeriod.upcomingFrom": "預計{{start}}開始",
```

---

## Step 7: components/food-card.tsx を更新

### 7-1. import に追加

```ts
import { formatPriceI18n } from "@/lib/i18n/format-price";
import type { Locale } from "@/lib/i18n/locales";
```

既存の `formatFoodPrice`・`formatPrice` の import は、後述の変更で使われなくなる場合は削除してよい。

### 7-2. useLocale() から locale も取得

```ts
// Before:
const { t } = useLocale();

// After:
const { t, locale } = useLocale();
```

### 7-3. getTranslatedAreaSummary の suffix 修正 (L84付近)

```ts
// Before:
function getTranslatedAreaSummary(areaDisplay: ReturnType<typeof getFoodAreaDisplay>, t: ReturnType<typeof useLocale>["t"]) {
  const visibleAreas = areaDisplay.visibleAreas.map((areaName) => tAreaName(areaName, t));
  return `${visibleAreas.join(" / ")}${areaDisplay.hiddenCount > 0 ? ` ほか${areaDisplay.hiddenCount}箇所` : ""}`;
}

// After:
function getTranslatedAreaSummary(areaDisplay: ReturnType<typeof getFoodAreaDisplay>, t: ReturnType<typeof useLocale>["t"]) {
  const visibleAreas = areaDisplay.visibleAreas.map((areaName) => tAreaName(areaName, t));
  const suffix = areaDisplay.hiddenCount > 0
    ? ` ${t("foodCard.moreAreas", { count: areaDisplay.hiddenCount })}`
    : "";
  return `${visibleAreas.join(" / ")}${suffix}`;
}
```

### 7-4. displayPrice 関数を formatPriceI18n に切り替え (L117-121付近)

```ts
// Before:
function displayPrice(food: FoodWithRelations, t: ReturnType<typeof useLocale>["t"]) {
  const locationPrice = food.locations?.find((location) => location.price)?.price;
  if (!food.price && !food.priceMin && locationPrice) return formatPrice(locationPrice);
  return hasPrice(food) ? formatFoodPrice(food) : t("foods.priceUnknown");
}

// After:
function displayPrice(food: FoodWithRelations, locale: Locale, t: ReturnType<typeof useLocale>["t"]) {
  const locationPrice = food.locations?.find((location) => location.price)?.price;
  if (!food.price && !food.priceMin && locationPrice) {
    return formatPriceI18n({ price: locationPrice }, locale, t);
  }
  return formatPriceI18n(food, locale, t);
}
```

### 7-5. displayPrice の呼び出し箇所を更新 (L52付近)

```tsx
// Before:
<p data-food-card-price ...>
  {displayPrice(food, t)}
</p>

// After:
<p data-food-card-price ...>
  {displayPrice(food, locale, t)}
</p>
```

---

## Step 8: components/recommendation-rail.tsx を更新

### 8-1. props 定義から日本語デフォルト値を削除し、コンポーネント内で t() フォールバックを使う

```tsx
// Before:
export function RecommendationRail({
  foods,
  baseFood,
  areaId,
  title = "チェック候補",
  description = "残り・限定・近いジャンルから、候補を絞れます。"
}: {
  foods: FoodWithRelations[];
  baseFood?: FoodWithRelations;
  areaId?: string;
  title?: string;
  description?: string;
}) {
  const { t } = useLocale();

// After:
export function RecommendationRail({
  foods,
  baseFood,
  areaId,
  title,
  description
}: {
  foods: FoodWithRelations[];
  baseFood?: FoodWithRelations;
  areaId?: string;
  title?: string;
  description?: string;
}) {
  const { t } = useLocale();
  const displayTitle = title ?? t("recommendRail.defaultTitle");
  const displayDescription = description ?? t("recommendRail.defaultDescription");
```

### 8-2. JSX 内の固定文字列を t() に置換

```tsx
// Before (L37付近):
<p className="flex items-center gap-2 text-sm font-black text-berry">
  <Sparkles size={17} aria-hidden />
    候補
</p>
<h2 className="mt-1 text-xl font-black text-ink">{title}</h2>
<p className="mt-1 text-sm font-bold text-slate-500">{description}</p>

// After:
<p className="flex items-center gap-2 text-sm font-black text-berry">
  <Sparkles size={17} aria-hidden />
  {t("recommendRail.kicker")}
</p>
<h2 className="mt-1 text-xl font-black text-ink">{displayTitle}</h2>
<p className="mt-1 text-sm font-bold text-slate-500">{displayDescription}</p>
```

```tsx
// Before (L45付近):
<Link href="/foods?sort=uneaten" className="inline-flex items-center gap-1 text-sm font-black text-park">
  もっと探す
  <ArrowRight size={16} aria-hidden />
</Link>

// After:
<Link href="/foods?sort=uneaten" className="inline-flex items-center gap-1 text-sm font-black text-park">
  {t("recommendRail.viewMore")}
  <ArrowRight size={16} aria-hidden />
</Link>
```

---

## Step 9: app/areas/[id]/page.tsx の L106 付近を修正

### 9-1. import に AreaUrgencyLabel を追加

```ts
import { AreaUrgencyLabel } from "@/components/area-urgency-label";
```

### 9-2. L106 の `<p>` 要素を AreaUrgencyLabel に置換

`endingSoonFoods` の map 内にある終了間近ラベルを置換する。

```tsx
// Before (L106付近):
<p className="mt-1 text-[11px] font-bold text-slate-500">{getSaleUrgencyLabel(food) ?? `残り${getRemainingDays(food) ?? "未確認"}日`}</p>

// After:
<AreaUrgencyLabel food={{
  saleEndDate: food.saleEndDate,
  endDate: food.endDate,
  remainingDays: food.remainingDays,
  saleStatus: food.saleStatus,
  status: food.status,
  saleStartDate: food.saleStartDate,
  startDate: food.startDate,
}} />
```

### 9-3. 不要になった import を整理

`getSaleUrgencyLabel`・`getRemainingDays` がこのファイルで他に使われていない場合は import から削除する。使われている箇所が他にあれば残す。

---

## Step 10: components/food-detail.tsx を更新

### 10-1. import を更新

**food-utils.ts からの import** — 以下の関数は i18n 版に置き換えるので削除する（他に使用箇所がない場合のみ削除）:
- `formatFoodPrice`
- `formatPrice`
- `getSaleUrgencyLabel`
- `getSalePeriodLabel`
- `getSaleStatusLabel`

**新規 import を追加**:

```ts
import { getUrgencyLabelI18n, getSaleStatusLabelI18n, getSalePeriodLabelI18n } from "@/lib/i18n/sale-label-utils";
import { formatPriceI18n } from "@/lib/i18n/format-price";
import { formatDateI18n, formatDateShortI18n } from "@/lib/i18n/format-date";
```

### 10-2. useLocale() から locale も取得 (L40付近)

```ts
// Before:
const { t } = useLocale();

// After:
const { t, locale } = useLocale();
```

### 10-3. urgencyLabel を i18n 版に変更 (L54付近)

```ts
// Before:
const urgencyLabel = getSaleUrgencyLabel(food);

// After:
const urgencyLabel = getUrgencyLabelI18n(food, t);
```

### 10-4. period を i18n 版に変更 (L50付近)

```ts
// Before:
const period = getPeriodSummary(food);

// After:
const periodLabel = getSalePeriodLabelI18n(food, locale, t);
```

### 10-5. 主価格表示を i18n 版に変更 (L122付近)

```tsx
// Before:
<p className="text-3xl font-black leading-none text-park">{formatFoodPrice(food)}</p>

// After:
<p className="text-3xl font-black leading-none text-park">{formatPriceI18n(food, locale, t)}</p>
```

### 10-6. 販売状態バッジを i18n 版に変更 (L123付近)

```tsx
// Before:
<span className={`rounded-full px-3 py-1 text-xs font-black ${getSaleStatusTone(food)}`}>{getSaleStatusLabel(food)}</span>

// After:
<span className={`rounded-full px-3 py-1 text-xs font-black ${getSaleStatusTone(food)}`}>{getSaleStatusLabelI18n(food, t)}</span>
```

### 10-7. 販売場所内の価格表示を i18n 版に変更 (L196付近)

```tsx
// Before:
{location.price ? formatPrice(location.price) : formatFoodPrice(food)} / {diningLabel}

// After:
{location.price ? formatPriceI18n({ price: location.price }, locale, t) : formatPriceI18n(food, locale, t)} / {diningLabel}
```

### 10-8. 販売期間の表示を i18n 版に変更 (L238付近)

```tsx
// Before:
<dd className="font-black text-slate-700">{period.label}</dd>

// After:
<dd className="font-black text-slate-700">{periodLabel}</dd>
```

### 10-9. 販売開始日の表示を i18n 版に変更 (L246付近)

```tsx
// Before:
<dd className="font-black text-slate-700">{formatDateLong(saleStartDate) ?? t("foodDetail.dateUnknown")}</dd>

// After:
<dd className="font-black text-slate-700">{formatDateI18n(saleStartDate, locale) ?? t("foodDetail.dateUnknown")}</dd>
```

### 10-10. 販売終了日の表示を i18n 版に変更 (L250付近)

```tsx
// Before:
<dd className="font-black text-slate-700">{saleEndDate ? formatDateLong(saleEndDate) ?? t("foodDetail.dateUnknown") : saleStatus === "active" ? t("foodDetail.dateUndecided") : t("foodDetail.dateUnknown")}</dd>

// After:
<dd className="font-black text-slate-700">{saleEndDate ? formatDateI18n(saleEndDate, locale) ?? t("foodDetail.dateUnknown") : saleStatus === "active" ? t("foodDetail.dateUndecided") : t("foodDetail.dateUnknown")}</dd>
```

### 10-11. 価格確認日の表示を i18n 版に変更 (L264付近)

```tsx
// Before:
<dd className="font-black text-slate-700">{formatDateShort(food.priceLastCheckedAt, t("foodDetail.dateUnknown"))}</dd>

// After:
<dd className="font-black text-slate-700">{formatDateShortI18n(food.priceLastCheckedAt, locale) ?? t("foodDetail.dateUnknown")}</dd>
```

### 10-12. getPeriodSummary 関数の削除

`getPeriodSummary` はもう呼ばれないので削除する。

```ts
// 削除対象:
function getPeriodSummary(food: FoodWithRelations) {
  return { label: getSalePeriodLabel(food) };
}
```

### 10-13. formatDateLong・formatDateShort ローカル関数の整理

`formatDateLong` と `formatDateShort` がこのファイル内で他に使われていない場合は削除してよい。使われている箇所があれば残す。

---

## Step 11: 検証

### 11-1. lint / typecheck / build

```bash
npm run lint
npm run typecheck
npm run build
```

すべて成功すること。エラーがある場合は修正してから次へ進む。

### 11-2. grep 確認（日本語固定残存チェック）

```bash
# food-card.tsx に「ほか」が残っていないこと
grep -n "ほか" components/food-card.tsx

# recommendation-rail.tsx に固定日本語が残っていないこと
grep -n "チェック候補\|もっと探す\|もっと\|候補" components/recommendation-rail.tsx

# areas/[id]/page.tsx に「残り」「未確認」が残っていないこと
grep -n "残り\|未確認" app/areas/[id]/page.tsx

# area-urgency-label.tsx に「残り」「未確認」が入っていないこと（t() を使うため）
grep -n "残り\|未確認" components/area-urgency-label.tsx

# components/ 内に「価格未確認」の直書きがないこと
grep -rn "価格未確認" components/ --include="*.tsx"

# i18n helper 内に「価格未確認」の直書きがないこと
grep -rn "価格未確認" lib/i18n/format-price.ts lib/i18n/sale-label-utils.ts 2>/dev/null || true
```

**注意:** `lib/i18n/dictionaries.ts` の ja ロケールには翻訳値として「価格未確認」が正しく残る。`lib/food-utils.ts` の既存「価格未確認」も Phase C 対象外。Codex はこれらを消すために `dictionaries.ts` や `lib/food-utils.ts` を変更してはいけない。

期待結果:
- `grep -n "ほか" components/food-card.tsx` → 0件（またはコメント・文字列リテラル以外）
- `grep -n "チェック候補\|もっと探す" components/recommendation-rail.tsx` → 0件
- `grep -n "残り\|未確認" app/areas/[id]/page.tsx` → 0件
- `components/` 内の「価格未確認」直書き → 0件
- `lib/i18n/format-price.ts` / `lib/i18n/sale-label-utils.ts` 内の「価格未確認」直書き → 0件
- `lib/i18n/dictionaries.ts` の ja ロケールの「価格未確認」→ 許容（翻訳値として正しい）
- `lib/food-utils.ts` の既存「価格未確認」→ 許容（Phase C 対象外、変更しない）

### 11-3. store-id 衝突修正維持確認

```bash
# /stores ページの href 整合性確認
grep -o 'href="/stores/[^"]*"' .next/server/app/stores/page.html 2>/dev/null | sort | uniq -d | head
```

または開発サーバーで `/stores` を確認し、hrefTotal: 63 / unique: 63 / duplicate: 0 であること。

### 11-4. スクリーンショット保存

以下のスクリーンショットを `screenshots/` に保存すること（ブラウザで確認）:

| ファイル名 | 確認内容 |
|---|---|
| `i18n-phase-c-food-card-price-ja-390.png` | ja設定 390px: food-card の価格が `¥1,200` |
| `i18n-phase-c-food-card-price-ko-390.png` | ko設定 390px: food-card の価格が `¥1,200（약 ₩11,000）` |
| `i18n-phase-c-food-detail-price-ko-390.png` | ko設定 390px: food-detail の価格が `¥1,200（약 ₩11,000）` |
| `i18n-phase-c-food-detail-period-en-390.png` | en設定 390px: food-detail の販売期間が "Mar 9, 2026" 等の英語形式 |
| `i18n-phase-c-area-detail-urgency-en-390.png` | en設定 390px: `/areas/[id]` の終了間近フードに "X days left" 等が表示 |
| `i18n-phase-c-areas-zh-390.png` | zh-TW設定 390px: `/areas` エリア名が繁体字（Phase B 維持確認） |

---

## Step 12: 動作確認チェックリスト

### ラベル修正

- [ ] EN 設定で food-card に複数エリア表示: `+◯ more` と表示される（「ほか」なし）
- [ ] EN 設定で `/areas/[id]` 終了間近フード: "◯ days left" / "Ending Soon" 等の英語
- [ ] KO 設定で `/areas/[id]` 終了間近フード: "◯일 남음" 等の韓国語

### 価格表示

- [ ] ja 設定: `¥1,200`
- [ ] en 設定: `¥1,200`（USD なし）
- [ ] ko 설정: `¥1,200（약 ₩11,000）`
- [ ] zh-TW 設定: `¥1,200（約 NT$252）`
- [ ] 価格範囲 (priceMin/priceMax): ko→`¥500 – ¥800（약 ₩4,600–₩7,400）`、zh-TW→`¥500 – ¥800（約 NT$105–NT$168）`
- [ ] 価格未確認: EN→"Price not confirmed"、KO→"가격 미확인"、zh-TW→"價格未確認"

### 日付・期間表示

- [ ] EN 設定で food-detail の販売期間: "Mar 9, 2026" 形式
- [ ] KO 設定で food-detail の販売期間: "3월 9일" 形式
- [ ] 開始日のみ（終了日未定）: EN→"From {{start}} (end TBD)"
- [ ] 近日販売 + 開始日あり: EN→"Starting {{start}}"

### スコープ遵守

- [ ] 商品名・店舗名は日本語のまま
- [ ] generated JSON / DB / crawler 変更なし
- [ ] `lib/food-utils.ts` の関数シグネチャが変更されていない
- [ ] Phase B（エリア名・カテゴリ名・店舗種別・飲食タイプ翻訳）が壊れていない

### 既存機能

- [ ] 店舗ID衝突修正 v1.1 維持（/stores hrefTotal: 63 / unique: 63 / duplicate: 0）
- [ ] bottom-nav アクティブ状態が正常
- [ ] overflow: 0 / clipped: 0 / 横スクロール: 0

---

## Step 13: Git コミット

```bash
git add .
git commit -m "implement-i18n-phase-c-price-date-label"
git push
```

---

## Stop and Ask Conditions

以下の状況になったら作業を停止してレビュー担当に確認すること。

1. `lib/food-utils.ts` の既存関数の内部ロジックまたはシグネチャを変更する必要が出た場合
2. `lib/food-utils.ts` の private 関数（`formatDateJa` 等）を export する必要が出た場合
3. `getSaleStartDate` / `getSaleEndDate` が未 export で実装方針に迷う場合（設計時確認では全件 export 済みだが、コード差異があれば確認）
4. `lib/currency-rates.ts` の数値（KRW: 9.2、TWD: 0.21）以外の値を入れる必要が出た場合
5. `app/areas/[id]/page.tsx` に `useLocale()` を直接追加しようとした場合
6. `lib/store-utils.ts` を変更する必要が出た場合
7. generated JSON を編集する必要が出た場合
8. 商品名・店舗名を翻訳する必要が出た場合
9. 価格の主表示を JPY 以外に置き換えようとした場合
10. Phase C+ 対象（`home-progress-client.tsx`・`eaten-food-rails.tsx`・`eaten-experience.tsx`・`store-food-list.tsx`）を変更しようとした場合

---

## 変更ファイル一覧

### 新規作成

| ファイル | 役割 |
|---|---|
| `lib/currency-rates.ts` | KRW/TWD 静的レート・換算関数 |
| `lib/i18n/format-date.ts` | `formatDateI18n`・`formatDateShortI18n` |
| `lib/i18n/format-price.ts` | `formatPriceI18n` |
| `lib/i18n/sale-label-utils.ts` | `getUrgencyLabelI18n`・`getSaleStatusLabelI18n`・`getSalePeriodLabelI18n` |
| `components/area-urgency-label.tsx` | server component から urgency label を表示するための最小 client component |

### 更新

| ファイル | 変更内容 |
|---|---|
| `lib/i18n/dictionaries.ts` | 10キー × 4ロケール = 40エントリ追加 |
| `components/food-card.tsx` | `ほか◯箇所` → `t("foodCard.moreAreas", { count })`、価格表示を `formatPriceI18n` に切替 |
| `components/recommendation-rail.tsx` | 4件の固定日本語を `t()` に置換 |
| `app/areas/[id]/page.tsx` | L106 `<p>` を `<AreaUrgencyLabel food={{...}} />` に置換 |
| `components/food-detail.tsx` | urgency/period/status ラベルを `*I18n` 版に切替、価格・日付を i18n 版に切替 |

### 変更しないファイル

| ファイル | 理由 |
|---|---|
| `lib/food-utils.ts` | 既存関数はそのまま維持。ラッパーを別ファイルに作る |
| `lib/store-utils.ts` | 変更禁止 |
| `lib/constants.ts` | 定数削除禁止 |
| `lib/i18n/area-name.ts` | Phase B で確定済み |
| `lib/i18n/use-locale.tsx` | Phase B で確定済み |
| `components/app-header.tsx` | Phase A/B で確定済み |
| `components/area-shop-list.tsx` | Phase B で確定済み |
| generated JSON / DB / crawler | 変更禁止 |
