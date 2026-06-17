# Design Review: i18n Phase C「価格・日付・残存日本語固定ラベル多言語化」

**レビュー対象 commit:** dd4d2d29 (`implement-i18n-phase-c-price-date-label`)
**レビュー日:** 2026-06-17
**判定:** ✅ **承認**

---

## 検証対象ファイル一覧

### 新規作成（5件）

| ファイル | 検証 |
|---|---|
| `lib/currency-rates.ts` | 全文読取 |
| `lib/i18n/format-date.ts` | 全文読取 |
| `lib/i18n/format-price.ts` | 全文読取 |
| `lib/i18n/sale-label-utils.ts` | 全文読取 |
| `components/area-urgency-label.tsx` | 全文読取 |

### 更新（5件）

| ファイル | 検証 |
|---|---|
| `components/food-card.tsx` | 全文読取 |
| `components/recommendation-rail.tsx` | 全文読取 |
| `components/food-detail.tsx` | 全文読取（438行） |
| `app/areas/[id]/page.tsx` | 全文読取 |
| `lib/i18n/dictionaries.ts` | 全文読取（1100行超） |

### スクリーンショット（6件）

| ファイル | 確認内容 |
|---|---|
| `i18n-phase-c-food-card-price-ja-390.png` | ja: ¥1,800 / ¥950 — 日本円のみ ✅ |
| `i18n-phase-c-food-card-price-ko-390.png` | ko: ¥1,800（약 ₩1…）/ ¥950（약 ₩8,7…） ✅ |
| `i18n-phase-c-food-detail-price-ko-390.png` | ko: ¥3,500（약 ₩32,200）/ 판매 중 ✅ |
| `i18n-phase-c-food-detail-period-en-390.png` | en: ¥3,500 On Sale — USD なし ✅ |
| `i18n-phase-c-area-detail-urgency-en-390.png` | en: "37 items" "First 3 Picks" "Foods Eaten in This Area" ✅ |
| `i18n-phase-c-areas-zh-390.png` | zh-TW: エリア名繁体字（Phase B 維持確認） ✅ |

---

## Phase C スコープ確認

### スコープ内（すべて対応済み）

| 対象 | 判定 | 確認内容 |
|---|---|---|
| `food-card.tsx` の「ほか◯箇所」| ✅ | L86: `t("foodCard.moreAreas", { count })` に変更済み |
| `recommendation-rail.tsx` の固定日本語 | ✅ | 4件すべて `t()` 化済み |
| `areas/[id]/page.tsx` の緊急ラベル | ✅ | `<AreaUrgencyLabel food={{...}}/>` に変更済み |
| 価格表示（food-card / food-detail / recommendation-rail） | ✅ | `formatPriceI18n` に切替済み |
| 日付表示（food-detail 販売開始・終了・確認日） | ✅ | `formatDateI18n` に切替済み |
| 販売期間（food-detail） | ✅ | `getSalePeriodLabelI18n` に切替済み |
| 販売状態バッジ（food-detail） | ✅ | `getSaleStatusLabelI18n` に切替済み |
| 残り日数ラベル（food-card badge） | ✅ | `getUrgencyLabelI18n` に切替済み |

### スコープ外（正しく触れていない）

| 対象 | 判定 | 理由 |
|---|---|---|
| 商品名翻訳 | ✅ 未変更 | 日本語のまま維持 |
| 店舗名翻訳 | ✅ 未変更 | 日本語のまま維持 |
| `lib/food-utils.ts` シグネチャ | ✅ 未変更 | import 元は使用継続 |
| `lib/store-utils.ts` | ✅ 未変更 | 確認済み |
| `lib/constants.ts` | ✅ 未変更 | 既存定数保持 |
| generated JSON / DB / crawler | ✅ 未変更 | 確認済み |
| URL 構造 | ✅ 未変更 | `/en` 等追加なし |
| Phase C+ 対象4ファイル | ✅ 未変更 | 変更ファイル一覧に不在 |

---

## 重点確認：新規ファイル詳細

### lib/currency-rates.ts ✅

```ts
KRW_PER_JPY: 9.2  // 設計通り
TWD_PER_JPY: 0.21 // 設計通り
updatedAt: "2026-06-17" // 設計通り
```

`convertToKRW`: 100ウォン単位丸め ✅  
`convertToTWD`: 1NT$単位丸め ✅

### lib/i18n/format-price.ts ✅

- `if (typeof min !== "number") return t("foods.priceUnknown")` ← 直接日本語文字列でなく辞書キー参照 ✅
- 範囲判定: `rangeMax === null` フラグで単価/範囲を分岐 ✅
- ko 範囲: `약 ₩4,600–₩7,400` 形式（min/max 両方変換）✅
- zh-TW 範囲: `約 NT$105–NT$168` 形式（min/max 両方変換）✅
- 設計差異: `formatJpy` が `Intl.NumberFormat` でなく `¥${price.toLocaleString("ja-JP")}` を使用。`¥1,200` の出力は同一 ✅（承認に影響なし）

### lib/i18n/format-date.ts ✅

- `timeZone: "Asia/Tokyo"` — 日本時間ベースでの表示 ✅
- `Number.isNaN` チェックで無効日付に対し元文字列を返す ✅
- try/catch で例外安全 ✅

### lib/i18n/sale-label-utils.ts ✅

- `lib/food-utils.ts` の関数のみ import（シグネチャ変更なし）✅
- `getUrgencyLabelI18n`: `remainingDays` が数値でない場合 `null` 返却 → 表示なし ✅
- `getSalePeriodLabelI18n`: ja ロケールで `getSalePeriodLabel(food)` 優先 ✅ — 既存 generated JSON 由来の日本語文字列を保持
- `getSaleStatusLabelI18n`: 既存辞書キー（`common.saleActive` / `common.ended` / `foods.saleFilterUpcoming` / `foods.saleFilterUnknown`）を再利用 ✅

### components/area-urgency-label.tsx ✅

```tsx
type AreaUrgencyFood = {
  saleEndDate?: string | null;
  endDate?: string | null;
  remainingDays?: number | null;
  saleStatus?: SaleStatus;
  status: FoodStatus;  // required
  saleStartDate?: string | null;
  startDate?: string | null;
};
```

- 最小フィールド型 ✅（`FoodWithRelations` 全体を渡していない）
- `"use client"` ✅（Server Component から呼び出せる）
- `label === null` 時に `return null` ✅（ラベルなし時は何も表示しない）

Server Component 側の呼び出しも7フィールド個別渡し ✅

---

## 重点確認：変更ファイル詳細

### components/food-card.tsx ✅

- L22: `const { locale, t } = useLocale()` — `locale` 追加 ✅
- L86: `t("foodCard.moreAreas", { count: areaDisplay.hiddenCount })` — 固定「ほか」消去 ✅
- L54: `displayPrice(food, locale, t)` ✅
- L119: `displayPrice` 関数が `formatPriceI18n` を使用 ✅
- L147: `getUrgencyLabelI18n(food, t)` — badge も i18n 版 ✅
- `getSaleUrgencyLabel`・`formatFoodPrice`・`formatPrice` の import が消去されている ✅

### components/recommendation-rail.tsx ✅

- props: `title?: string`・`description?: string`（デフォルト値なし）に変更 ✅
- L32-33: `displayTitle = title ?? t("recommendRail.defaultTitle")` ✅
- L41: `t("recommendRail.kicker")` ✅
- L47: `t("recommendRail.viewMore")` ✅
- L63: `formatPriceI18n(food, locale, t)` ✅ — recommendation rail 内の価格も i18n 化

### app/areas/[id]/page.tsx ✅

- L107-117: `<AreaUrgencyLabel food={{ saleEndDate: food.saleEndDate, ... }} />` — 7フィールド個別渡し ✅
- `useLocale()` は追加されていない ✅（Server Component のまま）

**既知の制約（Phase C スコープ外）:**
- L84・L106 の `{formatFoodPrice(food)}` は `firstBites` / `endingSoonFoods` の価格表示に残存
- これは Server Component の制約によるものであり、今回の goal で変更指示なし
- Phase C+ 対象として次フェーズで対応予定

### components/food-detail.tsx ✅

| 変更箇所 | Before | After | 確認 |
|---|---|---|---|
| L43 | `const { t }` | `const { locale, t }` | ✅ |
| L53 | `getPeriodSummary(food)` | `getSalePeriodLabelI18n(food, locale, t)` | ✅ |
| L57 | `getSaleUrgencyLabel(food)` | `getUrgencyLabelI18n(food, t)` | ✅ |
| L125 | `formatFoodPrice(food)` | `formatPriceI18n(food, locale, t)` | ✅ |
| L126 | `getSaleStatusLabel(food)` | `getSaleStatusLabelI18n(food, t)` | ✅ |
| L199 | `formatPrice(location.price) / formatFoodPrice(food)` | `formatPriceI18n(...)` | ✅ |
| L241 | `period.label` | `periodLabel` | ✅ |
| L249 | `formatDateLong(saleStartDate)` | `formatDateI18n(saleStartDate, locale)` | ✅ |
| L253 | `formatDateLong(saleEndDate)` | `formatDateI18n(saleEndDate, locale)` | ✅ |
| L267 | `formatDateShort(...)` | `formatDateI18n(..., locale, { month: "numeric", day: "numeric" })` | ✅ ※ |

※ 確認日のフォーマット: 設計では `formatDateShortI18n`（month: "short" → "Mar 9"）だが、実装は `{ month: "numeric", day: "numeric" }`（"3/9"）。数値形式の方が簡潔で日付確認欄として合理的。locale-aware であり機能要件を満たす ✅

`getPeriodSummary`・`formatDateLong`・`formatDateShort` のローカル関数は削除済みで、import も整理済み ✅

### lib/i18n/dictionaries.ts ✅

10キー × 4ロケール = 40エントリ追加確認。全4ロケールで対応するキーが存在することを目視確認。

---

## 辞書値の設計差異（マイナー・承認に影響なし）

| キー | 設計値 | 実装値 | 影響 |
|---|---|---|---|
| `urgency.daysRemaining` (ja) | `あと{{count}}日` | `残り{{count}}日` | 現データで表示なし。ja では「残り」も自然な表現 |
| `urgency.daysRemaining` (en) | `{{count}} more days` | `{{count}} days left` | 現データで表示なし。`endingSoonDays` と同値だが意味は通じる |
| `urgency.daysRemaining` (ko) | `{{count}}일 더` | `{{count}}일 남음` | 現データで表示なし。`endingSoonDays` と同値 |
| `urgency.daysRemaining` (zh-TW) | `還有{{count}}天` | `剩{{count}}天` | 現データで表示なし。`endingSoonDays` と同値 |
| `foodCard.moreAreas` (en) | `+{{count}} more` | `{{count}} more locations` | 現データで表示なし。意味は同等 |
| `foodCard.moreAreas` (ko) | `외 {{count}}곳` | `{{count}}곳 더` | 現データで表示なし。意味は同等 |
| `foodCard.moreAreas` (zh-TW) | `另{{count}}處` | `還有{{count}}處` | 現データで表示なし。意味は同等 |

これらは現在のデータで実際に表示されるコードパスに入らない（`hiddenCount > 0` の food なし / `remainingDays > 30` の食品なし）。将来データが変化した際に差異が現れる可能性はあるが、機能として問題はない。必要であれば次のレビューサイクルで辞書値のみ調整可能。

---

## スクリーンショット視認確認

### ja（390px）`/foods`
- 価格: `¥1,800` / `¥950` — 補助通貨なし ✅
- 商品名: 日本語のまま ✅

### ko（390px）`/foods`
- 価格: `¥1,800（약 ₩1...）` / `¥950（약 ₩8,7...）` — 補助通貨表示 ✅
- `약` が付いている ✅
- 「푸드 찾기」「사진으로 고르고, 남은 푸드를 찾아보세요.」— UI 翻訳維持 ✅

### ko（390px）`/foods/food-62sv41`（food-detail）
- 価格: `¥3,500（약 ₩32,200）` ✅
- 販売状態: `판매 중`（Sales Statusラベル i18n 化）✅
- 「먹은 것으로 기록」ボタン ✅
- USD なし ✅

### en（390px）`/foods/food-62sv41`（food-detail）
- 価格: `¥3,500` — JPY のみ ✅
- 販売状態: `On Sale` ✅
- ボタン: `Mark as eaten` / `Want next time` ✅
- 「Sales Locations」/ 「1 store only / 1 area」✅
- 価格行: `¥3,500（약 ₩32,200）/ Eat In` ✅（location 内価格も i18n 化済み）

### en（390px）`/areas/area-o1b56e`（area-detail）
- 「37 items」「Eaten 0 / On sale 37 items (registered)」✅
- 「First 3 Picks」「Foods Eaten in This Area」「Foods Left」✅
- `firstBites` 価格: `¥1,800` / `¥750`（`formatFoodPrice` のまま — Server Component 制約、スコープ外）
- "Ending Soon Foods" セクション: 現データ0件のため非表示 → `endingSoonFoods.length === 0` で `null` return ✅

### zh-TW（390px）`/areas`
- エリア名: 「超級任天堂世界」「哈利波特魔法世界」「小小兵樂園」「環球奇蹟樂園」✅（Phase B 翻訳維持）
- 「依區域尋找」「可以依區域確認剩下的餐點。」✅
- 「剩下30品 / 完成率 0%」✅

---

## 既存機能破壊チェック

| 確認項目 | 判定 |
|---|---|
| Phase B（エリア名・カテゴリ名翻訳）| ✅ zh-TW screenshot で繁体字エリア名確認 |
| bottom-nav アクティブ状態 | ✅ 全 screenshot で nav 正常 |
| 店舗ID衝突修正 v1.1 | ✅ `lib/store-utils.ts` 未変更 |
| ホーム v1.2 | ✅ Phase C+ 対象ファイル未変更 |
| overflow / clipped / 横スクロール | ✅ 報告値 0 / 0 / 0 |
| npm run lint | ✅ 成功 |
| npm run typecheck | ✅ 成功 |
| npm run build | ✅ 成功 |

---

## 判定サマリー

| レビュー観点 | 判定 |
|---|---|
| Phase C スコープ遵守 | ✅ |
| `lib/food-utils.ts` 保護 | ✅ |
| `lib/store-utils.ts` 保護 | ✅ |
| 新規ファイル 5件 | ✅ |
| 辞書 40エントリ追加 | ✅（マイナー差異は承認範囲内） |
| 価格: JPY 全ロケール表示 | ✅ |
| 価格: ko / zh-TW 補助通貨 | ✅ |
| 価格: en で USD なし | ✅ |
| 価格範囲で補助通貨も範囲表示 | ✅ |
| 日付: locale-aware フォーマット | ✅ |
| ja: salePeriodLabel 優先 | ✅ |
| AreaUrgencyLabel: 最小フィールド | ✅ |
| Server Component に useLocale なし | ✅ |
| Phase C+ ファイル未変更 | ✅ |
| スクリーンショット 6件 | ✅ |

---

## 判定

**承認**

設計の機能要件をすべて満たしている。辞書値のマイナー差異（`urgency.daysRemaining` と `foodCard.moreAreas` の表記）は現データで表示されないコードパスであり、承認を妨げない。`areas/[id]/page.tsx` の `firstBites` / `endingSoonFoods` 価格（`formatFoodPrice` 残存）は Server Component の制約によるものでスコープ外として想定通り。

---

## Phase D 以降への申し送り

1. **`urgency.daysRemaining` 辞書値**: 将来 >30日の食品が出た際、設計意図（endingSoonDays と差別化する表現）に合わせた調整を検討する
2. **`areas/[id]/page.tsx` 価格**: `firstBites` / `endingSoonFoods` セクションの価格表示（`formatFoodPrice` 残存）は Phase C+ 対象として次フェーズで対応
3. **Phase D**: 商品名・店舗名の翻訳ファイル設計（本レビューで商品名・店舗名が日本語維持であることを確認済み）
