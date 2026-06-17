# Design: Home Phase C+「ホーム価格・販売ラベル i18n 接続」v1

**設計日:** 2026-06-17
**前提:** i18n Phase C 承認済み / Home Phase D 承認済み
**参照:** `docs/design-review-i18n-phase-c-price-date-label-v1.md` / `docs/design-review-home-i18n-cleanup-v1.md`

---

## 1. Objective

Home Phase D では固定日本語「ラベル文字列」を辞書化した。本フェーズでは、ホーム画面の `HomeFoodRailCard` 内に残っている **価格表示** と **販売緊急ラベル** の未 i18n 箇所を、i18n Phase C で作成済みの helper に接続する。

- `formatFoodPrice(food)` → `formatPriceI18n(food, locale, t)`（ko / zh-TW で補助通貨表示）
- `getSaleUrgencyLabel(food)` → `getUrgencyLabelI18n(food, t)`（全言語で翻訳済みラベル）
- `"限定"` → `t("common.limited")`（固定日本語の除去）

新しい helper は作成しない。既存 helper を再利用するのみ。

---

## 2. Current State（実読取確認済み）

### `components/home-progress-client.tsx`

```
L8:   formatFoodPrice,        ← lib/food-utils から import 中
L13:  getSaleUrgencyLabel,    ← lib/food-utils から import 中

L235〜L254: HomeFoodRailCard（非エクスポートの関数コンポーネント）
  L236:  const chip = getHomeFoodChip(food);
  L246:  {formatFoodPrice(food)}     ← 残存 ①
  L250:  {chip ? <span ...>{chip.label}</span> : null}

L449〜L454: getHomeFoodChip（非エクスポートのユーティリティ関数）
  L450:  const urgency = getSaleUrgencyLabel(food);  ← 残存 ②
  L452:  { label: "限定", tone: "..." }              ← 残存 ③
```

### `lib/food-utils.ts`

```ts
// L43: ja専用、変更しない
export function formatFoodPrice(food) {
  if (!min) return "価格未確認";
  if (max && max !== min) return `${formatPrice(min)}〜${formatPrice(max)}`;
  return formatPrice(min);
}

// L138: ja専用、変更しない
export function getSaleUrgencyLabel(food) {
  if (getSaleStatus(food) === "ended") return "販売終了";
  if (remainingDays <= 14) return `残り${remainingDays}日`;
  if (remainingDays <= 30) return "終了間近";
  return `あと${remainingDays}日`;
}
```

### `lib/i18n/format-price.ts`

```ts
// Phase C 作成済み
export function formatPriceI18n(food: PriceInput, locale: Locale, t: TFn): string
// 価格不明時: t("foods.priceUnknown")
// ko:    ¥xxx（약 ₩xxx）
// zh-TW: ¥xxx（約 NT$xxx）
// ja/en: ¥xxx（円のみ）
```

`PriceInput` = `{ price?: number | null; priceMin?: number | null; priceMax?: number | null }` — `FoodWithRelations` と互換 ✅

### `lib/i18n/sale-label-utils.ts`

```ts
// Phase C 作成済み
export function getUrgencyLabelI18n(food: UrgencyFood, t: TFn): string | null
// 戻り値: null（残日数不明）/ 翻訳済み文字列
// getSaleUrgencyLabel と同じ null-check 構造 → chip の null 分岐はそのまま使える
```

`UrgencyFood` = `Pick<FoodWithRelations, "saleEndDate"|"endDate"|"remainingDays"|"saleStatus"|"status"|"saleStartDate"|"startDate">` — `FoodWithRelations` と互換 ✅

### 辞書キー確認（追加不要）

| キー | 用途 | 4ロケール存在 |
|---|---|---|
| `foods.priceUnknown` | 価格不明時の表示 | ✅（ja/en/ko/zh-TW L194, L487, L780, L1073） |
| `urgency.endingSoonDays` | 残り14日以内 | ✅（L210, L503, L796, L1089） |
| `urgency.daysRemaining` | 残り30日以内 | ✅（L211, L504, L797, L1090） |
| `foods.saleFilterEndingSoon` | 残り30日以内の中間ラベル | ✅（既存） |
| `common.ended` | 販売終了 | ✅（既存） |
| `common.limited` | 「限定」 | ✅（ja/en/ko/zh-TW 全確認） |

**辞書変更ゼロ** — 本フェーズで辞書キーの追加は不要。

---

## 3. Remaining i18n Gaps

| # | 箇所 | 現在の問題 | 影響ロケール |
|---|---|---|---|
| ① | `HomeFoodRailCard` L246 `formatFoodPrice(food)` | ja専用。ko/zh-TW で補助通貨が出ない。価格不明時「価格未確認」が固定日本語 | en / ko / zh-TW |
| ② | `getHomeFoodChip` L450 `getSaleUrgencyLabel(food)` | ja専用の文字列を返す。en/ko/zh-TW でも日本語ラベルが表示される | en / ko / zh-TW |
| ③ | `getHomeFoodChip` L452 `"限定"` | 固定日本語 | en / ko / zh-TW |

---

## 4. Scope for This Phase

**変更対象: `components/home-progress-client.tsx` のみ（1ファイル）**

| 変更 | 詳細 |
|---|---|
| Import 追加 | `formatPriceI18n` from `@/lib/i18n/format-price` |
| Import 追加 | `getUrgencyLabelI18n` from `@/lib/i18n/sale-label-utils` |
| Import 削除 | `formatFoodPrice` を `@/lib/food-utils` の import から除去 |
| Import 削除 | `getSaleUrgencyLabel` を `@/lib/food-utils` の import から除去 |
| `HomeFoodRailCard` | `const { t, locale } = useLocale()` を追加 |
| `HomeFoodRailCard` | `formatFoodPrice(food)` → `formatPriceI18n(food, locale, t)` |
| `HomeFoodRailCard` | `getHomeFoodChip(food)` → `getHomeFoodChip(food, t)` |
| `getHomeFoodChip` | 引数 `t: TFn` を追加 |
| `getHomeFoodChip` | `getSaleUrgencyLabel(food)` → `getUrgencyLabelI18n(food, t)` |
| `getHomeFoodChip` | `"限定"` → `t("common.limited")` |
| `TFn` 型 | ファイル内に `type TFn` を定義（または import） |

**辞書変更: なし**（既存キーで完結）

---

## 5. Out of Scope

- `lib/food-utils.ts` の変更（`formatFoodPrice` / `getSaleUrgencyLabel` は他のファイルで引き続き使用される可能性があるため、削除しない）
- `home-dashboard.tsx` の変更
- `lib/constants.ts` の変更
- `components/app-header.tsx` の変更
- `HomeCollectionHero` の変更
- `HomeActiveFoodCollection` / `HomeLimitedCollection` / `HomeRecentRecords` の変更（Phase D 成果を保護）
- 商品名・店舗名の翻訳
- 新しい price helper や label helper の作成
- `lib/i18n/format-price.ts` / `lib/i18n/sale-label-utils.ts` の変更
- generated JSON / DB / crawler の変更

---

## 6. Price Helper Reuse Plan

### Phase C `formatPriceI18n` の仕様（変更しない）

| ロケール | 出力例 |
|---|---|
| ja | `¥3,500` / `¥3,500〜¥4,000` / `価格未確認` |
| en | `¥3,500` / `¥3,500 – ¥4,000` / `Price not confirmed` |
| ko | `¥3,500（약 ₩32,200）` / `価格未確認` → `가격 미확인` |
| zh-TW | `¥3,500（約 NT$735）` / `價格未確認` |

### `HomeFoodRailCard` での使用方法

```tsx
// Before
function HomeFoodRailCard({ food, className = "" }: { food: FoodWithRelations; className?: string }) {
  const chip = getHomeFoodChip(food);
  // ...
  <span className="font-black text-[#071b3a]">{formatFoodPrice(food)}</span>

// After
function HomeFoodRailCard({ food, className = "" }: { food: FoodWithRelations; className?: string }) {
  const { t, locale } = useLocale();
  const chip = getHomeFoodChip(food, t);
  // ...
  <span className="font-black text-[#071b3a]">{formatPriceI18n(food, locale, t)}</span>
```

`HomeFoodRailCard` は React 関数コンポーネント（JSX を返す）であり、Client Component ファイル内（`"use client"` 宣言済み）に存在するため、`useLocale()` を直接呼べる ✅

**Props 変更なし** — `HomeFoodRailCard` のインターフェースは `{ food, className }` のまま変更しない。`locale` と `t` はコンポーネント内で `useLocale()` から取得する。

---

## 7. Urgency Label Reuse Plan

### Phase C `getUrgencyLabelI18n` の仕様（変更しない）

```ts
getUrgencyLabelI18n(food: UrgencyFood, t: TFn): string | null
// null → ラベルなし（残日数不明）
// 既存の null チェック構造と互換
```

### `getHomeFoodChip` の変更方針

```ts
// TFn 型をファイル内に定義（localインポートと統一）
type TFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

// Before
function getHomeFoodChip(food: FoodWithRelations) {
  const urgency = getSaleUrgencyLabel(food);
  if (urgency) return { label: urgency, tone: "bg-rose-50 text-rose-700" };
  if (food.isLimited) return { label: "限定", tone: "bg-[#fff4d7] text-[#8a5b16]" };
  return null;
}

// After
function getHomeFoodChip(food: FoodWithRelations, t: TFn) {
  const urgency = getUrgencyLabelI18n(food, t);
  if (urgency) return { label: urgency, tone: "bg-rose-50 text-rose-700" };
  if (food.isLimited) return { label: t("common.limited"), tone: "bg-[#fff4d7] text-[#8a5b16]" };
  return null;
}
```

**戻り値の型は変わらない** — `{ label: string; tone: string } | null` を維持する。呼び出し側（L250）の `chip.label` / `chip.tone` の参照も変更不要 ✅

---

## 8. Component Touch Plan

### `HomeFoodRailCard`（変更あり）

```
変更前:
  - useLocale() 未使用
  - formatFoodPrice(food) 呼び出し
  - getHomeFoodChip(food) 呼び出し

変更後:
  - const { t, locale } = useLocale() を追加
  - formatPriceI18n(food, locale, t) に置換
  - getHomeFoodChip(food, t) に変更
```

**`useLocale()` 追加の妥当性:**
- `home-progress-client.tsx` は `"use client"` 宣言済み ✅
- `HomeFoodRailCard` は JSX を返す関数コンポーネント ✅
- ファイル内に既に `HomeActiveFoodCollection`・`HomeLimitedCollection`・`HomeRecentRecords` が `useLocale()` を呼んでいる（Phase D 確認済み）✅
- `HomeFoodRailCard` はループ内でレンダリングされるが、フック自体はコンポーネントの先頭で呼ばれるため React のルール違反なし ✅

### `getHomeFoodChip`（変更あり）

```
変更前: function getHomeFoodChip(food: FoodWithRelations)
変更後: function getHomeFoodChip(food: FoodWithRelations, t: TFn)
呼び出し元は HomeFoodRailCard のみ → 影響範囲: 1箇所
```

---

## 9. Components Not to Touch

| コンポーネント・ファイル | 理由 |
|---|---|
| `HomeCollectionHero` | 承認済み home-hero-brand-redesign 保護 |
| `HomeActiveFoodCollection` | Phase D 成果保護（`t` は既存） |
| `HomeLimitedCollection` | Phase D 成果保護 |
| `HomeRecentRecords` | Phase D 成果保護 |
| `home-dashboard.tsx` | Phase D 成果保護 |
| `lib/food-utils.ts` | `formatFoodPrice` / `getSaleUrgencyLabel` は他ファイルが参照している可能性。削除しない |
| `lib/i18n/format-price.ts` | Phase C 成果保護 |
| `lib/i18n/sale-label-utils.ts` | Phase C 成果保護 |
| `lib/i18n/dictionaries.ts` | 辞書追加不要 |
| `lib/constants.ts` | 変更不要 |
| `components/app-header.tsx` | 承認済み構成保護 |
| generated JSON / DB / crawler | 絶対変更禁止 |

---

## 10. Risks

### R1: `formatFoodPrice` / `getSaleUrgencyLabel` が他ファイルで使われている場合

import 削除時に TypeScript エラーが出る可能性はないが、`lib/food-utils.ts` からの export 削除は行わない。`home-progress-client.tsx` のローカルな import 削除のみでよい。

**対処:** import 削除前に `grep -rn "formatFoodPrice\|getSaleUrgencyLabel" --include="*.tsx" --include="*.ts"` で他ファイルへの影響を確認する。

### R2: ko / zh-TW の価格表示が長くなりレイアウトが崩れる可能性

`¥3,500（약 ₩32,200）` など `HomeFoodRailCard` の価格行（1行 `text-xs`）に収まらない可能性がある。

- 既存クラス `line-clamp-1` が L245 の `<p>` に付いている — 文字が溢れても1行に収まる ✅
- Phase C のカード実装（`food-card.tsx` / `recommendation-rail.tsx`）で同様の長い価格表示は既に検証済み

**対処:** ko / zh-TW の 390px スクリーンショットで価格行の表示を確認する。

### R3: `TFn` 型の定義場所

`home-progress-client.tsx` に `TFn` 型を新規定義する。`sale-label-utils.ts` の `TFn` はファイル内ローカル型であり export されていないため、重複定義になるが問題なし。`TranslationKey` は既存の import に `@/lib/i18n/dictionaries` から追加するだけでよい。

ただし、`useLocale()` の `t` 関数は既に `(key: TranslationKey, params?: Record<string, string | number>) => string` 型なので、`TFn` の型エイリアスを定義しなくても `ReturnType<typeof useLocale>["t"]` で直接型付けできる。どちらでも TypeScript は通る。

**推奨:** シンプルにファイル内 local `type TFn` を定義する。

### R4: `getHomeFoodChip` の呼び出し箇所漏れ

`getHomeFoodChip` は `HomeFoodRailCard` の1箇所からのみ呼ばれている（grep 確認済み）。引数追加後に呼び出し側の更新漏れが出ないよう typecheck で確認する。

---

## 11. Stop and Ask Conditions

1. `lib/food-utils.ts` の変更が必要と判断した場合（`formatFoodPrice` / `getSaleUrgencyLabel` の削除や修正）
2. `formatPriceI18n` の引数型と `FoodWithRelations` が型不整合で typecheck エラーになる場合
3. `HomeActiveFoodCollection` / `HomeLimitedCollection` / `HomeRecentRecords` を変更しなければならない状況になった場合（Phase D 成果への波及）
4. `HomeCollectionHero` を変更しなければならない状況になった場合
5. ko / zh-TW の価格行が `line-clamp-1` で収まらず、レイアウト構造の変更が必要になった場合
6. `getHomeFoodChip` が `HomeFoodRailCard` 以外からも呼ばれていることが判明した場合（grep で事前確認すること）
7. `lib/i18n/dictionaries.ts` に新規キー追加が必要と判断した場合（今回は不要なはず）

---

## 12. Verification Plan

### grep 確認（実装後、全件 0件になるべきもの）

```bash
# 残存する formatFoodPrice を home-progress-client.tsx で確認（0件が正）
grep -n "formatFoodPrice" components/home-progress-client.tsx

# 残存する getSaleUrgencyLabel を home-progress-client.tsx で確認（0件が正）
grep -n "getSaleUrgencyLabel" components/home-progress-client.tsx

# 残存する固定「限定」を home-progress-client.tsx で確認（0件が正）
# ※ LIMITED_WORDS 配列内の "限定" は文字列データ、変更不要 → 行番号で識別
grep -n '"限定"' components/home-progress-client.tsx
```

**期待:** `"限定"` の grep は L29 の `LIMITED_WORDS` 配列内のものが残るが、L452 の `getHomeFoodChip` 内のものは 0件になること。

```bash
# food-utils.ts が変更されていないこと
grep -n "formatFoodPrice\|getSaleUrgencyLabel" lib/food-utils.ts
```

**期待:** 変更前と同じ行に残存（削除していない）

```bash
# formatPriceI18n / getUrgencyLabelI18n が追加されていること
grep -n "formatPriceI18n\|getUrgencyLabelI18n" components/home-progress-client.tsx
```

**期待:** import 行 + 使用箇所で各1件以上

```bash
# dictionaries.ts に変更がないこと（新規キー追加 0件）
# 既存の foods.priceUnknown / urgency.* / common.limited が維持されていること
grep -n '"foods\.priceUnknown"' lib/i18n/dictionaries.ts | wc -l
grep -n '"urgency\.' lib/i18n/dictionaries.ts | wc -l
```

**期待:** 各4件（4ロケール分）のまま変化なし

### lint / typecheck / build

```bash
npm run lint
npm run typecheck
npm run build
```

すべて成功すること。

### スクリーンショット確認

| ファイル名 | URL | 言語 | 幅 | 確認内容 |
|---|---|---|---|---|
| `home-phase-c-plus-ja-390.png` | `/` | ja | 390 | 価格が `¥3,500` 形式、緊急ラベルが日本語 |
| `home-phase-c-plus-en-390.png` | `/` | en | 390 | 価格が `¥3,500` 形式（円のみ）、緊急ラベルが英語 |
| `home-phase-c-plus-ko-390.png` | `/` | ko | 390 | 価格が `¥3,500（약 ₩xxx）` 形式、긴急ラベルが韓国語、「限定」→「기간 한정」 |
| `home-phase-c-plus-zh-390.png` | `/` | zh-TW | 390 | 価格が `¥3,500（約 NT$xxx）` 形式、緊急ラベルが繁体字、「限定」→「期間限定」 |
| `home-phase-c-plus-ko-1280.png` | `/` | ko | 1280 | デスクトップでの価格行の折り返し確認 |

**確認ポイント:**
- 価格行（`HomeFoodRailCard`）が `line-clamp-1` で収まっているか
- 価格不明商品で ko: `가격 미확인` / zh-TW: `價格未確認` / en: `Price not confirmed` が表示されるか
- 「限定」バッジが各ロケールで翻訳されているか（金色バッジ）
- Phase D で追加した他のラベル（エリア一覧・店舗から探す等）が壊れていないか
- HomeCollectionHero が壊れていないか
- bottom-nav / language-switcher が壊れていないか
- overflow: 0 / clipped: 0 / 横スクロールなし

---

## 13. Recommended Codex /goal Direction

Codex への指示は以下の構成で作成する（今回はまだ Goal 作成しない）。

### 変更ファイル（1ファイルのみ）

| ファイル | 変更内容 |
|---|---|
| `components/home-progress-client.tsx` | import 変更 + `HomeFoodRailCard` + `getHomeFoodChip` |

### 変更しないファイル（すべて保護）

| ファイル | 理由 |
|---|---|
| `lib/food-utils.ts` | `formatFoodPrice` / `getSaleUrgencyLabel` は export を保持 |
| `lib/i18n/format-price.ts` | Phase C 成果保護 |
| `lib/i18n/sale-label-utils.ts` | Phase C 成果保護 |
| `lib/i18n/dictionaries.ts` | 辞書追加不要 |
| `components/home-dashboard.tsx` | Phase D 成果保護 |
| その他すべて | 承認済み構成の保護 |

### 主要 Stop and Ask（Goal に含めるべきもの）

1. `lib/food-utils.ts` の変更が必要になった場合
2. `HomeActiveFoodCollection` / `HomeLimitedCollection` / `HomeRecentRecords` へ変更が波及した場合
3. typecheck エラーが `home-progress-client.tsx` 以外のファイルで発生した場合
4. `getHomeFoodChip` が複数箇所から呼ばれていることが発覚した場合

### 最小変更サマリー（Goal 作成時の参考）

```
diff: home-progress-client.tsx
- import { formatFoodPrice, ..., getSaleUrgencyLabel, ... } from "@/lib/food-utils"
+ import { ..., } from "@/lib/food-utils"  // formatFoodPrice, getSaleUrgencyLabel を削除
+ import { formatPriceI18n } from "@/lib/i18n/format-price"
+ import { getUrgencyLabelI18n } from "@/lib/i18n/sale-label-utils"
+ import type { TranslationKey } from "@/lib/i18n/dictionaries"  // TFn 用（未import の場合）

+ type TFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

function HomeFoodRailCard(...) {
+ const { t, locale } = useLocale();
- const chip = getHomeFoodChip(food);
+ const chip = getHomeFoodChip(food, t);
  ...
- {formatFoodPrice(food)}
+ {formatPriceI18n(food, locale, t)}
}

- function getHomeFoodChip(food: FoodWithRelations) {
+ function getHomeFoodChip(food: FoodWithRelations, t: TFn) {
-   const urgency = getSaleUrgencyLabel(food);
+   const urgency = getUrgencyLabelI18n(food, t);
-   if (food.isLimited) return { label: "限定", tone: "..." };
+   if (food.isLimited) return { label: t("common.limited"), tone: "..." };
}
```
