# Design Review: Home Phase C+「ホーム価格・販売ラベル i18n 接続」v1

**レビュー対象 commit:** 6a959c2 (`implement-home-i18n-phase-c-plus`)
**レビュー日:** 2026-06-17
**判定:** ✅ **承認**

---

## 検証対象

| 対象 | 検証方法 |
|---|---|
| `components/home-progress-client.tsx` | L1〜L35（import + TFn 型）、L238〜L258（HomeFoodRailCard）、L453〜L458（getHomeFoodChip）実読取 |
| `lib/food-utils.ts` | grep で formatFoodPrice / getSaleUrgencyLabel の export 残存確認 |
| grep 確認 | 6件実行・目視確認 |

---

## 1. スコープ遵守 ✅

| 確認項目 | 判定 | 詳細 |
|---|---|---|
| 変更が `home-progress-client.tsx` のみ | ✅ | 他ファイル変更なし |
| `lib/food-utils.ts` を変更していない | ✅ | L43 `formatFoodPrice` / L138 `getSaleUrgencyLabel` export 残存確認 |
| `lib/i18n/format-price.ts` を変更していない | ✅ | 未変更 |
| `lib/i18n/sale-label-utils.ts` を変更していない | ✅ | 未変更 |
| `lib/i18n/dictionaries.ts` を変更していない | ✅ | `foods.priceUnknown` 4件・`urgency.*` 8件を確認（変化なし） |
| `components/home-dashboard.tsx` を変更していない | ✅ | 未変更 |
| `HomeCollectionHero` を変更していない | ✅ | L34〜（appBrand.name / USJ FOOD COLLECTION / footer.tagline 維持） |
| `HomeActiveFoodCollection` / `HomeLimitedCollection` / `HomeRecentRecords` を変更していない | ✅ | Phase D 成果保護確認 |
| generated JSON / DB / crawler を変更していない | ✅ | 未変更 |

---

## 2. Import 整理 ✅

| 変更 | 内容 | 確認 |
|---|---|---|
| `formatFoodPrice` 削除 | `@/lib/food-utils` import から除去 | ✅ L5〜L13 に存在しない |
| `getSaleUrgencyLabel` 削除 | `@/lib/food-utils` import から除去 | ✅ L5〜L13 に存在しない |
| `formatPriceI18n` 追加 | `import { formatPriceI18n } from "@/lib/i18n/format-price"` | ✅ L15 |
| `getUrgencyLabelI18n` 追加 | `import { getUrgencyLabelI18n } from "@/lib/i18n/sale-label-utils"` | ✅ L16 |
| `TranslationKey` 追加 | `import type { TranslationKey } from "@/lib/i18n/dictionaries"` | ✅ L14 |

`TFn` 型: L32 に `type TFn = (key: TranslationKey, params?: Record<string, string | number>) => string;` として定義済み ✅

---

## 3. `HomeFoodRailCard` 実装確認 ✅

実装コード（L238〜L258）:

```tsx
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

| 確認項目 | 判定 | 詳細 |
|---|---|---|
| `const { t, locale } = useLocale()` 追加 | ✅ | L239。Client Component ファイル内の関数コンポーネントのため valid |
| `formatPriceI18n(food, locale, t)` 呼び出し | ✅ | L250。引数順序・型いずれも正しい |
| `getHomeFoodChip(food, t)` への変更 | ✅ | L240 |
| props `{ food, className }` は変更なし | ✅ | L238 のシグネチャ維持 |
| `food.name` が日本語固定 | ✅ | L248。翻訳なし |
| `chip.label` / `chip.tone` 参照はそのまま | ✅ | L254 |
| `getFoodAreaSummary(food)` はそのまま | ✅ | L252 |

**`useLocale()` の React hooks 適合性:**
- `home-progress-client.tsx` は `"use client"` 宣言済み ✅
- `HomeFoodRailCard` は JSX を返す関数コンポーネント ✅
- フックはコンポーネントのトップレベルで呼ばれている ✅
- ループ内でレンダリングされる（`HomeActiveFoodCollection` の `.map()`）が、フック自体はコンポーネントの先頭で呼ばれているため React Rules of Hooks 違反なし ✅

---

## 4. `getHomeFoodChip` 実装確認 ✅

実装コード（L453〜L458）:

```ts
function getHomeFoodChip(food: FoodWithRelations, t: TFn) {
  const urgency = getUrgencyLabelI18n(food, t);
  if (urgency) return { label: urgency, tone: "bg-rose-50 text-rose-700" };
  if (food.isLimited) return { label: t("common.limited"), tone: "bg-[#fff4d7] text-[#8a5b16]" };
  return null;
}
```

| 確認項目 | 判定 | 詳細 |
|---|---|---|
| 引数に `t: TFn` 追加 | ✅ | L453 のシグネチャ |
| `getSaleUrgencyLabel(food)` → `getUrgencyLabelI18n(food, t)` | ✅ | L454 |
| `"限定"` → `t("common.limited")` | ✅ | L456 |
| `tone` はそのまま維持 | ✅ | `"bg-[#fff4d7] text-[#8a5b16]"` 変化なし |
| 戻り値型 `{ label: string; tone: string } | null` 維持 | ✅ |  |
| 呼び出し元が `HomeFoodRailCard`（L240）の 1件のみ | ✅ | grep で 定義L453 + 呼び出しL240 の 2件のみ確認 |

**`LIMITED_WORDS` 配列内の `"限定"` 残存:**
L30 の `LIMITED_WORDS = ["25th", ..., "限定", ...]` は文字列データ配列であり、翻訳対象ではない。`getHomeFoodChip` 内の固定ラベルとは別物 ✅

---

## 5. grep 確認サマリー

| コマンド | 期待 | 実績 |
|---|---|---|
| `formatFoodPrice` in `home-progress-client.tsx` | 0件 | ✅ 0件 |
| `getSaleUrgencyLabel` in `home-progress-client.tsx` | 0件 | ✅ 0件 |
| `"限定"` in `home-progress-client.tsx` | `LIMITED_WORDS` 配列のみ | ✅ L30 のみ（`getHomeFoodChip` 内は除去済み） |
| `formatFoodPrice\|getSaleUrgencyLabel` in `food-utils.ts` | 各1件以上 | ✅ L43 / L138 で残存確認 |
| `formatPriceI18n\|getUrgencyLabelI18n` in `home-progress-client.tsx` | 各1件以上 | ✅ import（L15, L16）+ 使用箇所（L250, L454） |
| `foods.priceUnknown` count in `dictionaries.ts` | 4件 | ✅ 4件（Codex 報告一致） |
| `urgency.*` count in `dictionaries.ts` | 8件以上 | ✅ 8件（Codex 報告一致） |

---

## 6. 多言語表示確認 ✅

Codex 報告の目視確認内容を照合。

| ロケール | 価格表示 | 判定 |
|---|---|---|
| ja | `¥2,500`（円のみ） | ✅ |
| en | `¥2,500`（円のみ、USD なし） | ✅ |
| ko | `¥2,500（약 ₩23,000）` | ✅ |
| zh-TW | `¥2,500（約 NT$525）` | ✅ |

価格不明時の翻訳: `foods.priceUnknown` が各ロケールで存在することを辞書で確認済み ✅

---

## 7. 既存機能保護確認 ✅

| 確認項目 | 判定 |
|---|---|
| `HomeCollectionHero`（appBrand.name / kicker / tagline） | ✅ L34〜 維持確認 |
| `HomeActiveFoodCollection` Phase D 成果 | ✅ 未変更 |
| `HomeLimitedCollection` Phase D 成果 | ✅ 未変更 |
| `HomeRecentRecords` Phase D 成果 | ✅ 未変更 |
| `home-dashboard.tsx` Phase D 成果 | ✅ 未変更 |
| `lib/food-utils.ts` の `formatFoodPrice` / `getSaleUrgencyLabel` export | ✅ L43 / L138 で残存 |
| bottom-nav-and-language-switcher-v1 | ✅ `app-header.tsx` 未変更 |
| i18n Phase B（エリア名・カテゴリ名） | ✅ 破壊なし |
| i18n Phase C（フードカード・エリア詳細価格） | ✅ `format-price.ts` 未変更 |
| 店舗ID衝突修正 v1.1 | ✅ `lib/store-utils.ts` 未変更 |
| overflow: 0 / clipped: 0 / 横スクロールなし | ✅ Codex 報告一致 |

---

## 判定

**承認**

スコープ遵守・import 整理・`HomeFoodRailCard` の hooks 追加・`getHomeFoodChip` の i18n 接続・既存機能保護のすべてにおいて要件を満たしている。

設計書で指定した変更が 1ファイル内に正確に収まっており、`lib/food-utils.ts` の export は保護されている。`TFn` 型定義・`TranslationKey` import 追加も設計通り。

---

## 申し送り

1. **ホーム i18n 完了状況**: Home Phase D（固定ラベル）+ Phase C+（価格・販売ラベル）の対応が完了。`HomeFoodRailCard` の価格・緊急ラベルが全4ロケールで翻訳される
2. **残存する日本語**: `getFoodAreaSummary(food)` が日本語のエリアサマリーを返す可能性があるが、エリア名は Phase B で辞書化済みのため `tAreaName` 経由での対応は別途判断
3. **`home-unicole-logo` dead CSS**: `app/globals.css` に未使用定義が残存（前フェーズからの持ち越し）。清掃フェーズで削除可
4. **`lg:text-[1.45rem]` 調整候補**: HomeCollectionHero h1 の desktop サイズ（前フェーズからの持ち越し）
