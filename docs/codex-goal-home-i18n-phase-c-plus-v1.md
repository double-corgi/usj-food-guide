# Codex Goal: Home Phase C+「ホーム価格・販売ラベル i18n 接続」v1

## 概要

`components/home-progress-client.tsx` の `HomeFoodRailCard` と `getHomeFoodChip` に残っている価格表示・販売ラベルの未 i18n 箇所を、i18n Phase C で作成済みの helper に接続する。

**変更対象: `components/home-progress-client.tsx` の 1ファイルのみ**

**参照設計書:** `docs/home-i18n-phase-c-plus-design-v1.md`

---

## 禁止事項（最優先）

以下は**絶対にやってはいけない**。

- `lib/food-utils.ts` を変更しない（`formatFoodPrice` / `getSaleUrgencyLabel` の export 削除禁止）
- `lib/i18n/format-price.ts` を変更しない
- `lib/i18n/sale-label-utils.ts` を変更しない
- `lib/i18n/dictionaries.ts` を変更しない（新規キー追加禁止）
- `components/home-dashboard.tsx` を変更しない
- `HomeCollectionHero` を変更しない
- `HomeActiveFoodCollection` を変更しない
- `HomeLimitedCollection` を変更しない
- `HomeRecentRecords` を変更しない
- `HomeFoodRailCard` の props（`food`, `className`）を変更しない
- `getHomeFoodChip` の戻り値型 `{ label: string; tone: string } | null` を変えない
- `lib/store-utils.ts` / `lib/constants.ts` を変更しない
- 商品名・店舗名を翻訳しない
- generated JSON / DB / crawler を変更しない
- 無関係なリファクタ・整形をしない

---

## Git 作業前処理

```bash
git status
```

**未コミット変更がある場合:**
```bash
git add .
git commit -m "backup-before-home-i18n-phase-c-plus"
git push
```

**未コミット変更がない場合:**
```bash
git commit --allow-empty -m "backup-before-home-i18n-phase-c-plus"
git push
```

---

## 実装前確認

```bash
# getHomeFoodChip の呼び出し元が HomeFoodRailCard の1箇所のみか確認
grep -rn "getHomeFoodChip" components/ lib/ app/ --include="*.tsx" --include="*.ts"

# formatFoodPrice の home-progress-client.tsx 内の使用箇所確認
grep -n "formatFoodPrice" components/home-progress-client.tsx

# getSaleUrgencyLabel の home-progress-client.tsx 内の使用箇所確認
grep -n "getSaleUrgencyLabel" components/home-progress-client.tsx

# 固定 "限定" の使用箇所確認（LIMITED_WORDS 配列 と getHomeFoodChip を区別する）
grep -n '"限定"' components/home-progress-client.tsx
```

**期待:**
- `getHomeFoodChip` の呼び出しは `home-progress-client.tsx` の `HomeFoodRailCard` 内の 1件のみ
- `formatFoodPrice` は L246 付近に 1件（import + usage）
- `getSaleUrgencyLabel` は L450 付近に 1件（import + usage）
- `"限定"` は L29 の `LIMITED_WORDS` 配列と L452 の `getHomeFoodChip` 内の 2件

上記以外の想定外の使用が見つかった場合は **停止して確認すること**。

---

## Step 1: import を整理する

`components/home-progress-client.tsx` の先頭 import ブロックを変更する。

### `@/lib/food-utils` からの import

```ts
// Before（L5〜L15 付近）
import {
  calculateCompletion,
  dedupeFoodsByCanonical,
  formatFoodPrice,
  getCanonicalFoodKey,
  getEatenCanonicalKeys,
  getFoodAreaSummary,
  getRemainingDays,
  getSaleUrgencyLabel,
  isCompletableFood
} from "@/lib/food-utils";

// After: formatFoodPrice と getSaleUrgencyLabel を削除する
import {
  calculateCompletion,
  dedupeFoodsByCanonical,
  getCanonicalFoodKey,
  getEatenCanonicalKeys,
  getFoodAreaSummary,
  getRemainingDays,
  isCompletableFood
} from "@/lib/food-utils";
```

### 新規 import を追加する

既存の import ブロックの後（または適切な位置）に追加する。

```ts
import { formatPriceI18n } from "@/lib/i18n/format-price";
import { getUrgencyLabelI18n } from "@/lib/i18n/sale-label-utils";
```

`TranslationKey` が未 import の場合は追加する（`TFn` 型定義に必要）。

```ts
import type { TranslationKey } from "@/lib/i18n/dictionaries";
```

---

## Step 2: `TFn` 型を定義する

ファイル先頭付近（定数定義の前後）に以下を追加する。

```ts
type TFn = (key: TranslationKey, params?: Record<string, string | number>) => string;
```

---

## Step 3: `getHomeFoodChip` を修正する

```ts
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

**変更のポイント:**
- 引数に `t: TFn` を追加
- `getSaleUrgencyLabel(food)` → `getUrgencyLabelI18n(food, t)`
- `"限定"` → `t("common.limited")`
- `tone` の値はそのまま維持
- 戻り値型 `{ label: string; tone: string } | null` はそのまま維持

---

## Step 4: `HomeFoodRailCard` を修正する

```tsx
// Before（L235〜L254 付近）
function HomeFoodRailCard({ food, className = "" }: { food: FoodWithRelations; className?: string }) {
  const chip = getHomeFoodChip(food);

  return (
    <Link href={`/foods/${food.id}`} className={`group w-[74vw] max-w-[300px] shrink-0 snap-start lg:w-auto lg:max-w-none ${className}`}>
      <div className="aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-slate-100">
        <FoodImage food={food} className="h-full w-full transition duration-300 group-hover:scale-[1.03]" />
      </div>
      <div className="mt-3 space-y-1">
        <p className="line-clamp-2 min-h-[42px] text-[15px] font-black leading-[1.45] text-ink">{food.name}</p>
        <p className="line-clamp-1 text-xs font-bold text-slate-500">
          <span className="font-black text-[#071b3a]">{formatFoodPrice(food)}</span>
          <span className="px-1.5 text-slate-300">/</span>
          {getFoodAreaSummary(food)}
        </p>
        {chip ? <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${chip.tone}`}>{chip.label}</span> : null}
      </div>
    </Link>
  );
}

// After
function HomeFoodRailCard({ food, className = "" }: { food: FoodWithRelations; className?: string }) {
  const { t, locale } = useLocale();
  const chip = getHomeFoodChip(food, t);

  return (
    <Link href={`/foods/${food.id}`} className={`group w-[74vw] max-w-[300px] shrink-0 snap-start lg:w-auto lg:max-w-none ${className}`}>
      <div className="aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-slate-100">
        <FoodImage food={food} className="h-full w-full transition duration-300 group-hover:scale-[1.03]" />
      </div>
      <div className="mt-3 space-y-1">
        <p className="line-clamp-2 min-h-[42px] text-[15px] font-black leading-[1.45] text-ink">{food.name}</p>
        <p className="line-clamp-1 text-xs font-bold text-slate-500">
          <span className="font-black text-[#071b3a]">{formatPriceI18n(food, locale, t)}</span>
          <span className="px-1.5 text-slate-300">/</span>
          {getFoodAreaSummary(food)}
        </p>
        {chip ? <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${chip.tone}`}>{chip.label}</span> : null}
      </div>
    </Link>
  );
}
```

**変更のポイント:**
- `const { t, locale } = useLocale()` を追加（`HomeFoodRailCard` は関数コンポーネントのため `useLocale()` を呼べる）
- `getHomeFoodChip(food)` → `getHomeFoodChip(food, t)`
- `formatFoodPrice(food)` → `formatPriceI18n(food, locale, t)`
- `food.name` の表示はそのまま維持（商品名は日本語固定）
- props `{ food, className }` は変更しない
- `chip.label` / `chip.tone` の参照はそのまま維持

---

## Step 5: 変更確認（grep）

```bash
# formatFoodPrice が home-progress-client.tsx から消えていること（0件が正）
grep -n "formatFoodPrice" components/home-progress-client.tsx

# getSaleUrgencyLabel が home-progress-client.tsx から消えていること（0件が正）
grep -n "getSaleUrgencyLabel" components/home-progress-client.tsx

# getHomeFoodChip 内の固定 "限定" が消えていること
# （L29 の LIMITED_WORDS 配列内の "限定" は残ってよい）
grep -n '"限定"' components/home-progress-client.tsx

# lib/food-utils.ts の export が維持されていること
grep -n "formatFoodPrice\|getSaleUrgencyLabel" lib/food-utils.ts

# formatPriceI18n / getUrgencyLabelI18n が追加されていること
grep -n "formatPriceI18n\|getUrgencyLabelI18n" components/home-progress-client.tsx

# dictionaries.ts の foods.priceUnknown が4件維持されていること
grep -n '"foods\.priceUnknown"' lib/i18n/dictionaries.ts | wc -l

# dictionaries.ts の urgency.* が維持されていること
grep -n '"urgency\.' lib/i18n/dictionaries.ts | wc -l
```

**期待結果:**

| コマンド | 期待 |
|---|---|
| `formatFoodPrice` in `home-progress-client.tsx` | 0件 |
| `getSaleUrgencyLabel` in `home-progress-client.tsx` | 0件 |
| `"限定"` in `home-progress-client.tsx` | `LIMITED_WORDS` 配列のみ（1件、L29 付近）。`getHomeFoodChip` 内は 0件 |
| `formatFoodPrice\|getSaleUrgencyLabel` in `food-utils.ts` | 各 1件以上（削除されていない） |
| `formatPriceI18n\|getUrgencyLabelI18n` in `home-progress-client.tsx` | import + 使用で各 1件以上 |
| `foods.priceUnknown` count in `dictionaries.ts` | 4件 |
| `urgency.` count in `dictionaries.ts` | 8件以上（変化なし） |

---

## Step 6: lint / typecheck / build

```bash
npm run lint
npm run typecheck
npm run build
```

すべて成功すること。エラーが出た場合は修正してから次へ進む。

**TypeScript エラーが出た場合の確認ポイント:**
- `TranslationKey` が import されているか
- `TFn` 型が定義されているか
- `getHomeFoodChip` の呼び出し元（`HomeFoodRailCard`）が `t` を渡しているか
- `formatPriceI18n` の第2引数が `Locale` 型（`locale` は `useLocale()` から取得した値）になっているか

---

## Step 7: スクリーンショット保存

以下のスクリーンショットを `screenshots/` に保存すること。

| ファイル名 | URL | 言語 | 幅 | 確認内容 |
|---|---|---|---|---|
| `home-phase-c-plus-ja-390.png` | `/` | ja | 390 | 価格が `¥3,500` 形式、緊急ラベルが日本語 |
| `home-phase-c-plus-en-390.png` | `/` | en | 390 | 価格が `¥3,500` 形式（円のみ）、緊急ラベルが英語 |
| `home-phase-c-plus-ko-390.png` | `/` | ko | 390 | 価格が `¥3,500（약 ₩xxx）` 形式、緊急ラベルが韓国語、「限定」→「기간 한정」 |
| `home-phase-c-plus-zh-390.png` | `/` | zh-TW | 390 | 価格が `¥3,500（約 NT$xxx）` 形式、緊急ラベルが繁体字、「限定」→「期間限定」 |
| `home-phase-c-plus-ko-1280.png` | `/` | ko | 1280 | デスクトップでの価格行の `line-clamp-1` 折り返し確認 |

---

## Step 8: 動作確認チェックリスト

### 価格表示（`HomeFoodRailCard`）

- [ ] ja で価格が `¥3,500` 形式で表示される
- [ ] en で価格が `¥3,500` 形式（補助通貨なし）で表示される
- [ ] ko で価格が `¥3,500（약 ₩32,200）` 形式で表示される
- [ ] zh-TW で価格が `¥3,500（約 NT$735）` 形式で表示される
- [ ] 価格不明商品が ja で `価格未確認` と表示される
- [ ] 価格不明商品が en で `Price not confirmed` と表示される
- [ ] 価格不明商品が ko で `가격 미확인` と表示される
- [ ] 価格不明商品が zh-TW で `價格未確認` と表示される
- [ ] 価格行が `line-clamp-1` で 1行に収まっている（ko / zh-TW 補助通貨表示時も）

### 販売緊急ラベル・限定バッジ（`getHomeFoodChip`）

- [ ] 終了間近（14日以内）の商品で ja: `残りN日` が表示される
- [ ] 終了間近（14日以内）の商品で en: `N days left` が表示される
- [ ] 終了間近（14日以内）の商品で ko: `N일 남음` が表示される
- [ ] 終了間近（14日以内）の商品で zh-TW: `剩N天` が表示される
- [ ] 限定商品で ja: `期間限定` バッジが表示される（金色バッジ）
- [ ] 限定商品で en: `Limited Time` バッジが表示される（金色バッジ）
- [ ] 限定商品で ko: `기간 한정` バッジが表示される（金色バッジ）
- [ ] 限定商品で zh-TW: `期間限定` バッジが表示される（金色バッジ）

### 商品名・既存機能の保護

- [ ] 商品名（`food.name`）がすべての言語で日本語のまま表示される
- [ ] `HomeCollectionHero` が壊れていない（"USJ FOOD COLLECTION" / `ユニバフードコレクション` / tagline）
- [ ] `HomeActiveFoodCollection` が壊れていない（Phase D 成果確認）
- [ ] `HomeLimitedCollection` の「コンプリート」/「あとN品」バッジが壊れていない（Phase D 成果確認）
- [ ] `HomeRecentRecords` の「最近の記録」/「アルバムを見る」が壊れていない（Phase D 成果確認）
- [ ] `home-dashboard.tsx` のエリア一覧・店舗から探す等が壊れていない（Phase D 成果確認）
- [ ] bottom-nav アクティブ状態が正常
- [ ] language-switcher が正常
- [ ] /foods / /areas / /stores / /settings が壊れていない
- [ ] i18n Phase B（エリア名・カテゴリ名）が壊れていない
- [ ] i18n Phase C（フードカード・エリア詳細の価格表示）が壊れていない
- [ ] overflow: 0 / clipped: 0 / 横スクロールなし

---

## Stop and Ask Conditions

以下の状況になったら作業を停止してレビュー担当に確認すること。

1. `lib/food-utils.ts` の変更が必要と判断した場合
2. `getHomeFoodChip` が `HomeFoodRailCard` 以外からも呼ばれていることが判明した場合
3. `HomeActiveFoodCollection` / `HomeLimitedCollection` / `HomeRecentRecords` に変更が波及する状況になった場合
4. `HomeCollectionHero` を変更しなければならない状況になった場合
5. `formatPriceI18n` の引数型と `FoodWithRelations` が型不整合で typecheck エラーが解消しない場合
6. `TFn` 型の定義方法で typecheck エラーが解消しない場合
7. `npm run typecheck` で `home-progress-client.tsx` 以外のファイルにエラーが出た場合
8. `lib/i18n/dictionaries.ts` に新規キー追加が必要と判断した場合
9. ko / zh-TW で価格行が `line-clamp-1` に収まらず、レイアウト構造の変更が必要になった場合

---

## Git コミット

```bash
git add .
git commit -m "implement-home-i18n-phase-c-plus"
git push
```

---

## 変更ファイル一覧

### 変更（1ファイルのみ）

| ファイル | 変更内容 |
|---|---|
| `components/home-progress-client.tsx` | import 整理、`TFn` 型定義追加、`HomeFoodRailCard` に `useLocale()` 追加・price/chip 置換、`getHomeFoodChip` に `t` 引数追加・urgency/limited 置換 |

### 変更しないファイル

| ファイル | 理由 |
|---|---|
| `lib/food-utils.ts` | `formatFoodPrice` / `getSaleUrgencyLabel` の export を保持する必要がある |
| `lib/i18n/format-price.ts` | Phase C 成果保護 |
| `lib/i18n/sale-label-utils.ts` | Phase C 成果保護 |
| `lib/i18n/dictionaries.ts` | 辞書追加不要（必要な全キーは Phase C で追加済み） |
| `components/home-dashboard.tsx` | Phase D 成果保護 |
| `lib/constants.ts` | 変更不要 |
| `lib/store-utils.ts` | 変更不要 |
| `components/app-header.tsx` | 承認済み構成保護 |
| `app/page.tsx` | 変更不要 |
| generated JSON / DB / crawler | 絶対変更禁止 |
