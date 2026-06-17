# i18n Phase C Design: 価格・日付・残存日本語固定ラベル多言語化

- **設計日**: 2026-06-17
- **設計者**: Claude（プロダクト責任者・UXデザイナー・UIデザイナー）
- **前提**: Phase A（bottom-nav・言語切替）承認済み、Phase B（エリア名・カテゴリ名）承認済み

---

## 1. Objective

Phase B レビューで残った軽微な日本語固定ラベル3件を解消し、価格・日付表示を多言語対応させる。

**優先目標:**
1. `food-card.tsx` の `ほか◯箇所` ラベル → `t()` 化
2. `recommendation-rail.tsx` の日本語固定 props・ラベル → `t()` 化
3. `app/areas/[id]/page.tsx` の `残り◯日`・`未確認` fallback → client component 経由で解消
4. 販売終了間近・残り日数ラベル（`getSaleUrgencyLabel` 系）→ i18n ラッパー化
5. 価格表示: ko/zh-TW で補助通貨を括弧内に追加
6. 日付表示: `Intl.DateTimeFormat` によるロケール対応
7. 販売期間ラベル（`getSalePeriodLabel` 系）→ i18n ラッパー化（`food-detail.tsx` 対象）

**変更禁止:**
- `lib/food-utils.ts` の既存関数シグネチャ・ロジック変更禁止
- `lib/store-utils.ts` 変更禁止
- `lib/constants.ts` の定数削除禁止
- generated JSON・DB・crawler 変更禁止
- 商品名・店舗名の翻訳禁止
- 価格の JPY 正本を削除・置き換え禁止
- URL 構造変更禁止

---

## 2. Current State

### Phase B 残存問題（確認済み）

| ファイル | 行 | 問題 |
|---|---|---|
| `components/food-card.tsx` | L84 | `ほか${areaDisplay.hiddenCount}箇所` — 複数エリア suffix が日本語固定 |
| `components/recommendation-rail.tsx` | L17-18 | `title = "チェック候補"`, `description = "残り・限定..."` — デフォルト props が日本語 |
| `components/recommendation-rail.tsx` | L37, L45 | `候補`, `もっと探す` が直接 JSX に埋め込み |
| `app/areas/[id]/page.tsx` | L106 | `残り${getRemainingDays(food) ?? "未確認"}日` — サーバーコンポーネント内の日本語 fallback |

### 価格表示の現状

```ts
// lib/food-utils.ts
export function formatPrice(price?: number) {
  if (!price) return "価格未確認";  // ← 日本語固定
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(price);
}

export function formatFoodPrice(food: ...) {
  if (!min) return "価格未確認";  // ← 日本語固定
  if (max && max !== min) return `${formatPrice(min)}〜${formatPrice(max)}`;  // ← 「〜」固定
  return formatPrice(min);
}
```

- `foods.priceUnknown` キーは dictionaries.ts に全4ロケール存在済み ✅
- `food-card.tsx` L120 はすでに `t("foods.priceUnknown")` を使用 ✅
- 他のコンポーネント（`food-detail.tsx`・`recommendation-rail.tsx` 等）は `formatFoodPrice` を直接呼び出し → 日本語固定

### 日付表示の現状

```ts
// lib/food-utils.ts
function formatDateJa(dateStr: ...) {  // 内部 private 関数
  // "ja-JP" ロケール固定
}

export function getSaleUrgencyLabel(food: ...) {
  if (getSaleStatus(food) === "ended") return "販売終了";   // ← 日本語固定
  if (remainingDays <= 14) return `残り${remainingDays}日`;  // ← 日本語固定
  if (remainingDays <= 30) return "終了間近";               // ← 日本語固定
  return `あと${remainingDays}日`;                          // ← 日本語固定
}

export function getSalePeriodLabel(food: ...) {
  // "販売中"/"販売終了"/"近日販売"/日付範囲等を日本語固定で返す
}

export function getSaleStatusLabel(food: ...) {
  // "販売中"/"販売終了"/"近日販売"/"販売期間確認中" を日本語固定で返す
}
```

### 既存の再利用可能なキー（Phase B で確認済み）

| 既存キー | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `common.saleActive` | 販売中 | On Sale | 판매 중 | 販售中 |
| `common.ended` | 販売終了 | Ended | 판매 종료 | 販售結束 |
| `common.limited` | 期間限定 | Limited Time | 기간 한정 | 期間限定 |
| `foods.saleFilterEndingSoon` | 終了間近 | Ending Soon | 곧 종료 | 即將結束 |
| `foods.saleFilterUpcoming` | 近日販売 | Upcoming | 곧 판매 | 即將上架（※zh-TW 確認必要） |
| `foods.saleFilterUnknown` | 販売期間確認中 | Sale Period Checking | 판매 기간 확인 중 | ※ |
| `foods.priceUnknown` | 価格未確認 | Price not confirmed | 가격 미확인 | 價格未確認 |

---

## 3. Translation Scope

### Phase C 対象

| 対象 | 分類 |
|---|---|
| `食-card.tsx` の `ほか◯箇所` suffix | ラベル修正 |
| `recommendation-rail.tsx` の固定 props・ラベル | ラベル修正 |
| `areas/[id]/page.tsx` L106 の `残り◯日`/`未確認` | ラベル修正 |
| `getSaleUrgencyLabel` の日本語固定 → `getUrgencyLabelI18n` | i18n ラッパー |
| `getSalePeriodLabel` の日本語固定 → `getSalePeriodLabelI18n` | i18n ラッパー |
| `getSaleStatusLabel` の日本語固定 → `getSaleStatusLabelI18n` | i18n ラッパー |
| 価格表示: ko/zh-TW 補助通貨追加 | 価格表示 |
| 日付表示: `Intl.DateTimeFormat` ロケール対応 | 日付表示 |
| `food-detail.tsx` の上記3種類の更新 | 主要更新先 |

### Phase C 対象外（後続フェーズ）

| 対象 | 理由 |
|---|---|
| 商品名・店舗名翻訳 | Phase D |
| `home-progress-client.tsx` の urgency label | Phase C+ |
| `eaten-food-rails.tsx` の urgency label | Phase C+ |
| `eaten-experience.tsx` の `getSaleStatusLabel` | Phase C+ |
| `store-food-list.tsx` の price display | Phase C+ |
| `getPriceSourceLabel` の翻訳 | Phase C+ |
| `getSaleTypeLabel` の翻訳 | Phase C+ |
| `statusLabels` (constants.ts) の翻訳 | Phase C+ |
| `salePeriodLabel` データフィールド（generated JSON 由来）の翻訳 | Phase D |

---

## 4. Fixed Japanese Label Cleanup Plan

### 4-1. food-card.tsx — `ほか◯箇所`

**現状** (L84):
```ts
function getTranslatedAreaSummary(areaDisplay, t) {
  const visibleAreas = areaDisplay.visibleAreas.map((areaName) => tAreaName(areaName, t));
  return `${visibleAreas.join(" / ")}${areaDisplay.hiddenCount > 0 ? ` ほか${areaDisplay.hiddenCount}箇所` : ""}`;
}
```

**修正後**:
```ts
function getTranslatedAreaSummary(areaDisplay, t) {
  const visibleAreas = areaDisplay.visibleAreas.map((areaName) => tAreaName(areaName, t));
  const suffix = areaDisplay.hiddenCount > 0
    ? ` ${t("foodCard.moreAreas", { count: areaDisplay.hiddenCount })}`
    : "";
  return `${visibleAreas.join(" / ")}${suffix}`;
}
```

新規キー: `foodCard.moreAreas` → 後述 Section 8 参照

---

### 4-2. recommendation-rail.tsx — 4件の固定文字列

**現状**:
```tsx
export function RecommendationRail({
  title = "チェック候補",           // ← 日本語デフォルト
  description = "残り・限定..."     // ← 日本語デフォルト
}) {
  ...
  <p>候補</p>                       // ← 日本語固定
  <Link>もっと探す</Link>           // ← 日本語固定
```

**修正後**:
- `title` / `description` の型を `string | undefined` に変更（デフォルト値なし）
- コンポーネント本体で `title ?? t("recommendRail.defaultTitle")` を使用
- `候補` → `t("recommendRail.kicker")`
- `もっと探す` → `t("recommendRail.viewMore")`

```tsx
export function RecommendationRail({
  foods, baseFood, areaId, title, description
}: {
  ...
  title?: string;
  description?: string;
}) {
  const { t } = useLocale();
  const displayTitle = title ?? t("recommendRail.defaultTitle");
  const displayDescription = description ?? t("recommendRail.defaultDescription");
  ...
  <p className="...">{t("recommendRail.kicker")}</p>
  <h2>{displayTitle}</h2>
  <p>{displayDescription}</p>
  <Link href="/foods?sort=uneaten">{t("recommendRail.viewMore")}</Link>
```

**注意**: `RecommendationRail` は現在どのページからも import されていない（孤立コンポーネント）。将来の呼び出し元が日本語文字列を `title` に渡す場合はその時点で個別対処。

新規キー: `recommendRail.*` → Section 8 参照

---

### 4-3. app/areas/[id]/page.tsx L106 — サーバーコンポーネント内の `残り◯日`

**制約**: このファイルはサーバーコンポーネント。`useLocale()` は使えない。

**現状** (L106):
```tsx
<p className="...">{getSaleUrgencyLabel(food) ?? `残り${getRemainingDays(food) ?? "未確認"}日`}</p>
```

`getSaleUrgencyLabel` 自体も日本語固定文字列を返す。どちらの分岐も EN/KO/zh-TW で日本語が表示される。

**修正方針**: 最小 client component `AreaUrgencyLabel` を新設し、この `<p>` 要素を置き換える。

**新規ファイル**: `components/area-urgency-label.tsx`

**設計方針**: Server Component から Client Component へ `food` オブジェクト全体を渡さない。`getUrgencyLabelI18n` / `getRemainingDays` / `getSaleStatus` が必要とする最小フィールドのみを props として渡す。これにより:
- シリアライズ対象を最小化（non-serializable な値の混入リスクを排除）
- hydration 差異を防ぎやすくする
- Client Component を表示専用の leaf component に留める

```tsx
"use client";

import { getUrgencyLabelI18n } from "@/lib/i18n/sale-label-utils";
import { useLocale } from "@/lib/i18n/use-locale";

// food 全体ではなく、urgency label 判定に必要な最小フィールドだけ受け取る
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
  const label = getUrgencyLabelI18n(food, t);
  if (!label) return null;
  return <p className="mt-1 text-[11px] font-bold text-slate-500">{label}</p>;
}
```

**app/areas/[id]/page.tsx の変更** (L100-110 付近):

Server Component 側では `food` から必要フィールドだけを展開して渡す。

```tsx
// Before:
<p className="...">{getSaleUrgencyLabel(food) ?? `残り${getRemainingDays(food) ?? "未確認"}日`}</p>

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

import に `AreaUrgencyLabel` を追加。`getSaleUrgencyLabel`・`getRemainingDays` の import は不要になれば削除。

---

## 5. Price Display Plan

### 基本方針

1. **日本円（¥）は全ロケールで必ず表示する**（正本表示）
2. ko/zh-TW 設定時のみ補助通貨を括弧内に小さく追加（`text-xs text-slate-400`）
3. en 設定時は ¥ のみ（USD 換算は変動リスクが高い）
4. 外部 API 不使用、静的レートで管理
5. 補助通貨は「約」「약」接頭語で概算であることを明示
6. `lib/food-utils.ts` の `formatPrice` / `formatFoodPrice` は変更しない
7. 新関数 `formatPriceI18n` を `lib/i18n/format-price.ts` に追加

### 表示フォーマット

| ロケール | ¥1,200 の場合 | ¥500〜¥800 の場合 | 価格未確認 |
|---|---|---|---|
| ja | ¥1,200 | ¥500〜¥800 | 価格未確認 |
| en | ¥1,200 | ¥500 – ¥800 | Price not confirmed |
| ko | ¥1,200（약 ₩11,000） | ¥500 – ¥800（약 ₩4,600–₩7,400） | 가격 미확인 |
| zh-TW | ¥1,200（約 NT$252） | ¥500 – ¥800（約 NT$105–NT$168） | 價格未確認 |

### 静的レートの管理

**新規ファイル**: `lib/currency-rates.ts`

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

### formatPriceI18n の設計

**新規ファイル**: `lib/i18n/format-price.ts`

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
 * - ja: ¥1,200
 * - en: ¥1,200
 * - ko: ¥1,200（약 ₩11,000）
 * - zh-TW: ¥1,200（約 NT$252）
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

### 更新対象ファイル（Phase C）

- `components/food-detail.tsx`:
  - L122 主価格表示 (`formatFoodPrice(food)`) → `formatPriceI18n(food, locale, t)` に変更
  - L196 locations 内の price 表示 (`formatPrice(location.price)`) → `formatJpy(location.price)` またはそのまま（ロケール固定でも許容）
  - `useLocale()` から `locale` も取得する（現在は `t` のみ取得）

- `components/food-card.tsx`:
  - L119-120 の `displayPrice` 関数を `formatPriceI18n` ベースに更新
  - `useLocale()` から `locale` も取得する

**注意**: `recommendation-rail.tsx`・`store-food-list.tsx`・`eaten-experience.tsx` の `formatFoodPrice` 呼び出しは Phase C+ で対処。

---

## 6. Currency Support Plan

### 補助通貨の表示スタイル

- フォントサイズ: 主価格と同サイズ（括弧内で自然に小さく見える）
- 色: `text-slate-400`（控えめ）
- 主価格と同行・同 `<span>` 内（改行なし）
- 実装: 純粋な文字列として返す（React element ではなく）。コンポーネント側でスタイリング調整が必要な場合は `formatPriceI18n` の戻り値を分割するオーバーロードを Phase C+ で追加

### 補助通貨の免責

- `/settings` の `settings.languageDescription` に記載（コード変更不要、辞書更新のみ）:
  - ja: 現状維持（"商品名・店舗名は現地で見つけやすいよう日本語のまま表示します"）
  - ko: 기존 유지 + "補助通貨は参考値" 追記（Section 8 参照）
  - zh-TW: 既存維持 + "補助通貨は参考値" 追記

### 静的レートの更新運用

- `lib/currency-rates.ts` の `updatedAt` フィールドを参照
- 四半期ごと（年4回）に設計者がレートを確認し手動更新
- Codex は静的レートの値を勝手に変更しない（Stop and Ask Condition に記載）
- 大幅な乖離（±20%超）が発生した場合は補助通貨表示を一時的に非表示にすることを検討

---

## 7. Date / Period Display Plan

### 7-1. ロケール対応日付フォーマット

**新規ファイル**: `lib/i18n/format-date.ts`

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
 * ja: 3月9日, en: Mar 9, ko: 3월 9일, zh-TW: 3月9日
 */
export function formatDateShortI18n(
  dateStr: string | null | undefined,
  locale: Locale
): string | null {
  return formatDateI18n(dateStr, locale, { month: "short", day: "numeric" });
}
```

### 7-2. 販売終了間近・残り日数ラベルの i18n ラッパー

**新規ファイル**: `lib/i18n/sale-label-utils.ts`

#### getUrgencyLabelI18n

```ts
import { getRemainingDays, getSaleStatus } from "@/lib/food-utils";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { FoodWithRelations } from "@/types/domain";

export function getUrgencyLabelI18n(
  food: Pick<FoodWithRelations, "saleEndDate" | "endDate" | "remainingDays" | "saleStatus" | "status" | "saleStartDate" | "startDate">,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
): string | null {
  const remainingDays = getRemainingDays(food);
  if (typeof remainingDays !== "number") return null;
  if (getSaleStatus(food) === "ended") return t("common.ended");
  if (remainingDays <= 14) return t("urgency.endingSoonDays", { count: remainingDays });
  if (remainingDays <= 30) return t("foods.saleFilterEndingSoon");   // 既存キー再利用
  return t("urgency.daysRemaining", { count: remainingDays });
}
```

**新規キー**: `urgency.endingSoonDays`、`urgency.daysRemaining`（詳細は Section 8）

#### getSaleStatusLabelI18n

```ts
export function getSaleStatusLabelI18n(
  food: Parameters<typeof getSaleStatus>[0],
  t: (key: TranslationKey) => string
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
```

既存キーの再利用のみ。新規キー不要。

#### 実装前確認: lib/food-utils.ts の export 状態

`sale-label-utils.ts` は `lib/food-utils.ts` の以下の関数を import して使う。**実装前に export されていることを確認すること。**

| 関数 | Phase C での用途 | export 状態（設計時確認済み） |
|---|---|---|
| `getSaleStatus` | urgency/period/status ラベル判定 | ✅ exported（L81） |
| `getRemainingDays` | urgency ラベルの残り日数取得 | ✅ exported（L104） |
| `getSaleStartDate` | period ラベルの開始日取得 | ✅ exported（L96） |
| `getSaleEndDate` | period ラベルの終了日取得 | ✅ exported（L100） |
| `getSalePeriodLabel` | ja ロケール時の既存データ優先参照 | ✅ exported（L161） |

**重要制約**:
- export 済みの関数のみ利用する
- private 関数（`formatDateJa` 等）を使うためだけに `lib/food-utils.ts` の既存関数シグネチャやロジックを変更しない
- 必要であれば `sale-label-utils.ts` 内で最小限のローカル補助関数を定義する
- `lib/food-utils.ts` の既存ロジックを一切破壊しない

#### getSalePeriodLabelI18n

```ts
import { formatDateShortI18n } from "@/lib/i18n/format-date";
import type { Locale } from "@/lib/i18n/locales";

export function getSalePeriodLabelI18n(
  food: Parameters<typeof getSalePeriodLabel>[0],
  locale: Locale,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
): string {
  const saleStatus = getSaleStatus(food);
  const start = getSaleStartDate(food);
  const end = getSaleEndDate(food);

  if (food.salePeriodLabel && locale === "ja") return food.salePeriodLabel;  // ja: 既存データ優先

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

**重要**: `food.salePeriodLabel` は generated JSON 由来のフィールド（日本語文字列）。ja ロケールのみ既存データを優先することでデータ忠実性を保つ。en/ko/zh-TW では `formatDateShortI18n` を使って再構築する。

**新規キー**: `salePeriod.dateRange`、`salePeriod.openEndFrom`、`salePeriod.upcomingFrom`（詳細は Section 8）

---

## 8. Dictionary Key Plan

### 新規追加キー（全4ロケール）

#### foodCard 系

| キー | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `foodCard.moreAreas` | `ほか{{count}}箇所` | `+{{count}} more` | `외 {{count}}곳` | `另{{count}}處` |

#### recommendRail 系

| キー | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `recommendRail.kicker` | 候補 | Picks | 추천 | 推薦 |
| `recommendRail.defaultTitle` | チェック候補 | Check These | 확인 후보 | 推薦選項 |
| `recommendRail.defaultDescription` | 残り・限定・近いジャンルから、候補を絞れます。 | Narrow down by remaining, limited edition, or similar genres. | 남은 것・한정・비슷한 장르에서 후보를 추릴 수 있습니다. | 從剩餘、限定、相近類別中篩選候選。 |
| `recommendRail.viewMore` | もっと探す | Find more | 더 찾기 | 更多 |

#### urgency 系

| キー | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `urgency.endingSoonDays` | 残り{{count}}日 | {{count}} days left | {{count}}일 남음 | 剩{{count}}天 |
| `urgency.daysRemaining` | あと{{count}}日 | {{count}} more days | {{count}}일 더 | 還有{{count}}天 |

※ `urgency.ended` は既存の `common.ended` を再利用。`urgency.endingSoon` は既存の `foods.saleFilterEndingSoon` を再利用。

#### salePeriod 系

| キー | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `salePeriod.dateRange` | {{start}}〜{{end}} | {{start}} – {{end}} | {{start}} – {{end}} | {{start}} – {{end}} |
| `salePeriod.openEndFrom` | {{start}}〜販売終了日未定 | From {{start}} (end TBD) | {{start}}부터 (종료일 미정) | 自{{start}}起（結束日未定） |
| `salePeriod.upcomingFrom` | {{start}}開始予定 | Starting {{start}} | {{start}} 시작 예정 | 預計{{start}}開始 |

※ `salePeriod.active`（"販売中"）は既存 `common.saleActive` 再利用。`salePeriod.ended` は `common.ended` 再利用。`salePeriod.upcoming`（"近日販売"）は `foods.saleFilterUpcoming` 再利用。

### キー総数

- 新規: 4 + 4 + 2 + 3 = **13キー × 4ロケール = 52エントリ**

---

## 9. Files to Touch

### 新規作成

| ファイル | 役割 |
|---|---|
| `lib/currency-rates.ts` | KRW/TWD 静的レート・換算関数 |
| `lib/i18n/format-price.ts` | `formatPriceI18n` |
| `lib/i18n/format-date.ts` | `formatDateI18n`・`formatDateShortI18n` |
| `lib/i18n/sale-label-utils.ts` | `getUrgencyLabelI18n`・`getSaleStatusLabelI18n`・`getSalePeriodLabelI18n` |
| `components/area-urgency-label.tsx` | server component から urgency label を client 経由で表示するための最小 client component |

### 既存ファイル更新

| ファイル | 変更内容 |
|---|---|
| `lib/i18n/dictionaries.ts` | 13キー × 4ロケール = 52エントリ追加 |
| `components/food-card.tsx` | `ほか◯箇所` → `t("foodCard.moreAreas", { count })`、price 表示を `formatPriceI18n` に切替、`useLocale()` から `locale` も取得 |
| `components/recommendation-rail.tsx` | props の日本語デフォルト削除、4箇所を `t()` 化 |
| `app/areas/[id]/page.tsx` | L106 `<p>` を `<AreaUrgencyLabel food={food} />` に置換、`AreaUrgencyLabel` を import |
| `components/food-detail.tsx` | urgency/period/status ラベルを `*I18n` 版に切替、主価格を `formatPriceI18n` に切替、日付を `formatDateI18n` に切替、`useLocale()` から `locale` も取得 |

---

## 10. Files Not to Touch

| ファイル | 理由 |
|---|---|
| `lib/food-utils.ts` | 既存関数はそのまま維持。i18n ラッパーを別ファイルに作る |
| `lib/store-utils.ts` | 変更禁止 |
| `lib/constants.ts` | `categoryLabels`・`shopTypeLabels`・`diningTypeLabels` 削除禁止 |
| `lib/i18n/area-name.ts` | Phase B で確定済み |
| `lib/i18n/use-locale.tsx` | Phase B で修正済み |
| `components/app-header.tsx` | Phase A/B で確定済み |
| `components/area-shop-list.tsx` | Phase B で確定済み |
| generated JSON (`scripts/output/*.generated.json`) | 変更禁止 |
| DB・crawler スクリプト | 変更禁止 |
| URL 構造 (`app/**/page.tsx` の routing) | 変更禁止 |

---

## 11. Risks

| リスク | 影響度 | 対策 |
|---|---|---|
| 静的レートが実態と大幅乖離（±20%超） | 中：補助通貨が誤解を招く | `updatedAt` を明示し四半期見直し運用。乖離が著しい場合は補助通貨行を非表示に切り替えられる設計にする |
| `food.salePeriodLabel`（generated JSON 由来）と `getSalePeriodLabelI18n` の二重管理 | 低：ja では既存データ優先のため不整合なし | ja ロケールは `food.salePeriodLabel` フィールドを優先する（フォールバック設計） |
| `Intl.DateTimeFormat` のブラウザ互換性 | 低：モダンブラウザは全対応 | `try/catch` で dateStr をそのまま返すフォールバックを設計済み |
| `app/areas/[id]/page.tsx` に新規 client component を追加することによる hydration 差異 | 低：`AreaUrgencyLabel` は独立した leaf component | client component の初期値がサーバー HTML と異なる場合を想定し、suppressHydrationWarning を検討 |
| 価格範囲表示（priceMin〜priceMax）の補助通貨換算でどちらの値を使うか | 低：UX | max 値から換算（より高い方が安全側。実装で `food.priceMax ?? food.priceMin` とする） |
| `recommendation-rail.tsx` の props インターフェース変更により呼び出し元が壊れる | なし：現在 import なし | 現在どのページからも import されていないため影響なし。将来 import する際に呼び出し元で `title` を省略すれば `t()` デフォルトが使われる |

---

## 12. Stop and Ask Conditions

Codex は以下の状況に達した場合、実装を停止してレビュー担当に確認すること。

1. `lib/food-utils.ts` の既存関数（`getSaleUrgencyLabel`・`getSalePeriodLabel`・`formatFoodPrice` 等）の内部ロジックや戻り値の型を変更しようとした場合
2. `lib/currency-rates.ts` の `CURRENCY_RATES` 数値を設計書記載値（KRW: 9.2、TWD: 0.21）以外の値に変更しようとした場合
3. `app/areas/[id]/page.tsx` でサーバーコンポーネントに `useLocale()` を直接使おうとした場合（→ `AreaUrgencyLabel` client component 経由が正しい）
4. `lib/constants.ts` の `categoryLabels`・`shopTypeLabels`・`diningTypeLabels` を削除しようとした場合
5. generated JSON（`scripts/output/` 以下）を編集しようとした場合
6. 商品名・店舗名を翻訳しようとした場合
7. 価格の主表示を JPY から他通貨に置き換えようとした場合
8. Phase C+ 対象（`home-progress-client.tsx`・`eaten-food-rails.tsx`・`eaten-experience.tsx`・`store-food-list.tsx`）まで変更しようとした場合
9. `lib/food-utils.ts` の private 関数（`formatDateJa` 等、現在 export されていない関数）を export する必要が出た場合
10. `getSaleStartDate` / `getSaleEndDate` が未 export であるなど、実装方針に迷う場合（設計時確認では全件 export 済みだが、コード差異があれば停止して確認）

---

## 13. Verification Plan

### ラベル修正確認

- [ ] EN 設定で `/foods` の food-card に複数エリアがある場合: `+◯ more` と表示される（日本語なし）
- [ ] EN 設定で `recommendation-rail` が表示されるページ（実装後）: "Picks" / "Check These" / "Find more" が表示される
- [ ] EN/KO/zh-TW 設定で `/areas/[id]` の終了間近フード: 「残り◯日」ではなく翻訳ラベルが表示される

### 価格表示確認

- [ ] ja 設定: `¥1,200` のみ表示
- [ ] en 設定: `¥1,200` のみ表示（USD 表示なし）
- [ ] ko 설정: `¥1,200（약 ₩11,000）` 形式で表示
- [ ] zh-TW 設定: `¥1,200（約 NT$252）` 形式で表示
- [ ] 価格未確認商品: EN→"Price not confirmed"、KO→"가격 미확인"、zh-TW→"價格未確認"
- [ ] priceMin/priceMax range 表示: ja→`¥500〜¥800`、en→`¥500 – ¥800`、ko→`¥500 – ¥800（약 ₩4,600–₩7,400）`、zh-TW→`¥500 – ¥800（約 NT$105–NT$168）`
- [ ] 既存 `formatFoodPrice` を使用している他コンポーネント（`eaten-experience.tsx` 等）が壊れていない

### 日付・期間表示確認

- [ ] EN 設定で food-detail の販売期間: "Mar 9, 2026" 形式
- [ ] KO 設定で food-detail の販売期間: "3월 9일" 形式
- [ ] zh-TW 設定で food-detail の販売期間: "3月9日" 形式
- [ ] 開始日のみある場合（終了日未定）: EN→"From {{start}} (end TBD)"
- [ ] 近日販売の場合: EN→"Starting {{start}}"
- [ ] 日付が null / undefined / 不正な場合: fallback が適切（null 返却または元文字列）

### urgency ラベル確認

- [ ] `残り7日` → EN: "7 days left"、KO: "7일 남음"
- [ ] `終了間近`（15-30日）→ EN: "Ending Soon"、KO: "곧 종료"
- [ ] `あと45日` → EN: "45 more days"、KO: "45일 더"
- [ ] 残り日数不明 → `AreaUrgencyLabel` が `null` を返し `<p>` 要素が非表示になる

### 既存機能破壊確認

- [ ] `/stores` hrefTotal: 63 / unique: 63 / duplicate: 0（store-id 衝突修正維持）
- [ ] bottom-nav アクティブ状態が正常（Phase A 維持）
- [ ] `/areas` エリア名翻訳が正常（Phase B 維持）
- [ ] `/foods` カテゴリ・種別フィルター翻訳が正常（Phase B 維持）
- [ ] overflow: 0 / clipped: 0 / 横スクロール: 0
- [ ] npm run lint / typecheck / build: 成功

---

## 14. Recommended Implementation Phases

Phase C の作業量は中程度。以下の順序で実装することを推奨。

### Step 1: 基盤ファイル作成（依存関係がない）
- `lib/currency-rates.ts`
- `lib/i18n/format-date.ts`
- `lib/i18n/format-price.ts`
- `lib/i18n/sale-label-utils.ts`

### Step 2: dictionaries.ts へのキー追加（52エントリ）

### Step 3: 小規模なラベル修正（3ファイル）
- `components/food-card.tsx` — `ほか◯箇所` 修正 + price 更新
- `components/recommendation-rail.tsx` — 4件の固定文字列修正
- `components/area-urgency-label.tsx` — 新規 client component

### Step 4: pages/major components 更新
- `app/areas/[id]/page.tsx` — `<AreaUrgencyLabel>` 使用に変更
- `components/food-detail.tsx` — urgency/period/status/price/date 全更新

### Step 5: 検証
- lint / typecheck / build
- 各ロケールでの目視確認（スクリーンショット）
- store-id 衝突修正・bottom-nav の既存機能確認

---

## 15. Recommended Codex /goal Direction

### /goal ファイル名

`codex-goal-i18n-phase-c-price-date-label-v1.md`

### 渡すべき情報（Codex への引き渡し事項）

1. この設計書全文
2. `lib/currency-rates.ts` の初期レート値（KRW: 9.2、TWD: 0.21、updatedAt: "2026-06-17"）
3. 「`lib/food-utils.ts` は変更しない。ラッパーを別ファイルに作る」という明示
4. 「`app/areas/[id]/page.tsx` はサーバーコンポーネントなので `useLocale()` を直接使えない。`AreaUrgencyLabel` client component 経由で対処する」という明示
5. Phase C+ 対象（変更しないファイルリスト）の明示
6. 検証コマンド: `grep -rn "ほか" components/food-card.tsx` `grep -rn "チェック候補" components/recommendation-rail.tsx` `grep -rn "残り" app/areas` で修正漏れがないことを確認

### 今回 Codex /goal はまだ作らない
