# Design Review: i18n Phase B「エリア名・カテゴリ名多言語化」v1

- **対象 goal**: `docs/codex-goal-i18n-phase-b-area-category-v1.md`
- **設計書**: `docs/i18n-phase-b-area-category-design-v1.md`
- **実装 commit**: d97045f implement-i18n-phase-b-area-category
- **レビュー日**: 2026-06-17
- **担当**: Claude (Product Owner / UX / UI / Review)

---

## 判定

**承認**

---

## 確認ファイル一覧

| ファイル | 確認方法 |
|---|---|
| `lib/i18n/dictionaries.ts` | コード読み取り（全4ロケール検証） |
| `lib/i18n/use-locale.tsx` | コード読み取り（変更妥当性確認） |
| `lib/i18n/area-name.ts` | コード読み取り |
| `lib/constants.ts` | grep（削除されていないことを確認） |
| `lib/store-utils.ts` | grep（変更なし確認） |
| `components/area-shop-list.tsx` | コード読み取り |
| `components/app-header.tsx` | コード読み取り |
| `components/area-overview.tsx` | コード読み取り |
| `components/eaten-area-progress.tsx` | コード読み取り |
| `components/food-grid.tsx` | コード読み取り |
| `components/food-card.tsx` | コード読み取り |
| `components/food-detail.tsx` | コード読み取り |
| `components/eaten-experience.tsx` | コード読み取り |
| `components/eaten-genre-progress.tsx` | コード読み取り |
| `components/recommendation-rail.tsx` | コード読み取り |
| `app/areas/[id]/page.tsx` | コード読み取り |
| screenshots × 7 | 目視確認 |

---

## 1. Phase Bスコープ確認

| チェック | 結果 |
|---|---|
| 商品名（food.name）翻訳なし | ✅ 日本語維持 |
| 店舗名（shop.name）翻訳なし | ✅ 日本語維持 |
| 価格表示変更なし | ✅ |
| 日付表示変更なし | ✅ |
| generated JSON / DB / crawler 変更なし | ✅ |
| URL構造変更なし | ✅ |
| `lib/store-utils.ts` 変更なし | ✅（504行、未変更） |
| `lib/constants.ts` categoryLabels / shopTypeLabels / diningTypeLabels 削除なし | ✅（3定義とも維持） |

---

## 2. lib/i18n/use-locale.tsx の変更妥当性

Codex が「言語切替が即座に反映されない問題を最小修正」と報告。変更内容を全行確認。

### 変更内容

```ts
const localeChangeEvent = "unicolle-locale-change";

// LocaleProvider:
useEffect(() => {
  const syncLocale = () => {
    const stored = window.localStorage.getItem(localeStorageKey);
    const safeLocale = isSupportedLocale(stored) ? stored : defaultLocale;
    setLocaleState(safeLocale);
    document.documentElement.lang = safeLocale;
  };
  syncLocale();                                    // マウント時に localStorage を読む
  window.addEventListener("storage", syncLocale);  // クロスタブ同期
  window.addEventListener(localeChangeEvent, syncLocale); // 同タブ同期
  return () => {
    window.removeEventListener("storage", syncLocale);
    window.removeEventListener(localeChangeEvent, syncLocale);
  };
}, []);

const setLocale = useCallback((nextLocale: Locale) => {
  window.localStorage.setItem(localeStorageKey, safeLocale);
  setLocaleState(safeLocale);
  document.documentElement.lang = safeLocale;
  window.dispatchEvent(new Event(localeChangeEvent)); // 同タブへ通知
}, []);
```

### 各観点の確認

| 観点 | 判定 | 根拠 |
|---|---|---|
| 変更は最小限か | ✅ | setLocale に event dispatch 追加、useEffect に storage/custom event リスナー追加のみ |
| localStorage `unicolle-locale` 維持 | ✅ | `localeStorageKey` 定数そのまま使用 |
| `document.documentElement.lang` 更新 | ✅ | `setLocale` と `syncLocale` 両方で更新 |
| hydration 安全性 | ✅ | 初期 state = `defaultLocale`（"ja"）→ SSR と一致、mount 後に localStorage 読み込み。hydration mismatch なし |
| 言語切替の即時反映 | ✅ | `setLocale` → `dispatchEvent(localeChangeEvent)` → 同タブの全 LocaleProvider が `syncLocale` で更新 |
| クロスタブ同期 | ✅ | `window.addEventListener("storage", syncLocale)` |
| cleanup 漏れ | ✅ | useEffect の return で両リスナー削除済み |
| /settings 言語切替破壊なし | ✅ | setLocale の動作は以前と同等以上（追加のみ） |

**判定: 変更は妥当かつ最小限。既存動作を破壊しない。**

---

## 3. dictionaries.ts — 翻訳キー（144エントリ）

| キー群 | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `nav.label` | メインナビゲーション | Main navigation | 메인 내비게이션 | 主要導覽 |
| `settings.languageDescription` | 商品名・店舗名のみ日本語 | Food/store names stay Japanese | ✅ | ✅ |
| `category.*` × 14 | ✅ | ✅ | ✅ | ✅ |
| `shopType.*` × 4 | ✅ | ✅ | ✅ | ✅ |
| `diningType.*` × 5 | ✅ | ✅ | ✅ | ✅ |
| `area.name.*` × 10 | ✅ | ✅ | ✅ | ✅ |
| `area.salesLocationCount` | `{{count}}か所` | `{{count}} locations` | `{{count}}곳` | `{{count}}處` |
| `area.remainingSalesLocations` | `あと{{count}}か所` | `{{count}} more locations` | `{{count}}곳 더 보기` | `還有{{count}}處` |

全144エントリ確認。`settings.languageDescription` から「エリア名」削除済み ✅

---

## 4. 各コンポーネント確認

### lib/i18n/area-name.ts

```ts
// 10エリア全件マッピング、normalizeAreaName で™®を除去
export function tAreaName(name: string, t: ...): string {
  const key = areaNameKeyMap[normalizeAreaName(name)];
  return key ? t(key) : name; // fallback = 元の日本語 name（安全）
}
```

✅ fallback 安全（キー未ヒット時は元の name をそのまま返す）

---

### components/area-shop-list.tsx

| 確認点 | 結果 |
|---|---|
| `shopTypeLabels` import なし | ✅ |
| `t(\`shopType.${shop.type}\` as TranslationKey)` | ✅ |
| `t("area.salesLocationCount", { count: shops.length })` | ✅ |
| `t("area.remainingSalesLocations", { count: hidden.length })` | ✅ |
| 日本語固定なし | ✅ |

---

### components/app-header.tsx

```tsx
<nav aria-label={t("nav.label")} ...>
```
✅

---

### components/area-overview.tsx

```tsx
<h2>{tAreaName(area.name, t)}</h2>
```
✅

---

### components/eaten-area-progress.tsx

```tsx
<h3>{tAreaName(progress.area.name, t)}</h3>
```
✅ 全テキストが `t()` 経由

---

### components/food-grid.tsx

| 対象 | 実装 |
|---|---|
| カテゴリチップ表示 | `t(\`category.${item.value}\` as TranslationKey)` ✅ |
| カテゴリフィルタ | `t(\`category.${value}\` as TranslationKey)` ✅ |
| shopType フィルタ | `t(\`shopType.${value}\` as TranslationKey)` ✅ |
| diningType フィルタ | `t(\`diningType.${value}\` as TranslationKey)` ✅ |
| エリアフィルタ | `tAreaName(area.name, t)` ✅ |
| status フィルタ | `statusLabels[value]` — Phase C スコープ |

`categoryChips` 配列定義に日本語 `label` フィールドが残っているが、レンダリングでは使用されず（L153 で `t()` 上書き）。表示への影響なし。

---

### components/food-card.tsx

| 確認点 | 結果 |
|---|---|
| `tAreaName` でエリア名翻訳 | ✅（L57, L83） |
| 食べた/未食べボタン | `t("foodCard.eatenDone")` / `t("foodCard.markEaten")` ✅ |
| 価格表示 | `formatFoodPrice(food)` — 変更なし ✅ |

**軽微指摘 A**: L84 `ほか${areaDisplay.hiddenCount}箇所` — エリアが複数ある場合の suffix が日本語固定。Phase B スコープ外だが EN/KO/zh-TW でも「ほか◯箇所」と表示される。Phase C 以降で対処推奨。

---

### components/food-detail.tsx

```ts
// L57-58
const diningType = food.diningType && food.diningType !== "unknown"
  ? food.diningType
  : inferDiningType(food);          // DiningType 内部キーを返す
const diningLabel = t(`diningType.${diningType}` as TranslationKey);

// L413-418
function inferDiningType(food: FoodWithRelations): DiningType {
  if (food.shop.type === "cart" || food.shop.type === "wagon") return "food_cart";
  if (food.category === "churro" || ...) return "takeout";
  if (food.shop.type === "restaurant") return "eat_in";
  return "unknown";  // t("diningType.unknown") で解決
}
```

✅ 案A 実装済み。`inferDiningType` が `DiningType` 内部キーを返し `t()` で翻訳。日本語固定 fallback なし。

---

### components/eaten-experience.tsx

| 確認点 | 結果 |
|---|---|
| カテゴリフィルタ options | `t(\`category.${category}\` as TranslationKey)` ✅ |
| エリアフィルタ options | `tAreaName(areaName, t)` ✅ |
| albumMode=genre グルーピングキー | `id: \`genre-${category}\`` — FoodCategory 内部キー ✅ |
| albumMode=genre セクション title | `t(\`category.${category}\` as TranslationKey)` ✅ |
| albumMode=area セクション title | `tAreaName(areaName, t)` ✅ |

グルーピングキー規律 ✅（翻訳ラベルをキーにしていない）

---

### components/eaten-genre-progress.tsx

| 確認点 | 結果 |
|---|---|
| 反復ソース | `Object.keys(categoryLabels) as FoodCategory[]` ✅ |
| ラベル | `t(\`category.${category}\` as TranslationKey)` ✅ |
| `key` / `item.id` | FoodCategory 内部キー ✅ |
| `/foods?category=` URL | `item.id`（内部キー、翻訳ラベルではない）✅ |

---

### components/recommendation-rail.tsx

| 確認点 | 結果 |
|---|---|
| カテゴリ表示 | `t(\`category.${food.category}\` as TranslationKey)` ✅ |
| 商品名・価格 | 変更なし ✅ |

**軽微指摘 B（pre-existing）**: `title = "チェック候補"`、`description = "残り・限定..."` のデフォルト props、`候補`・`もっと探す` の固定文字列が日本語。これらは Phase B 変更前から存在するラベルであり、今回の scope 外。Phase C 以降で対処推奨。

---

### app/areas/[id]/page.tsx

- `AreaShopList, type AreaShopRow` を `components/area-shop-list` から import ✅
- `<I18nText k="area.backToList" />` ✅
- H1 `{area.name}` は Server Component 限界により日本語（設計書で許容済み）✅
- **軽微指摘 C（pre-existing）**: L106 `残り${getRemainingDays(food) ?? "未確認"}日` — `getSaleUrgencyLabel` null 時の fallback が日本語固定。Phase B スコープ外。Phase C で対処推奨。

---

## 5. スクリーンショット目視確認

| スクリーンショット | 確認内容 | 判定 |
|---|---|---|
| `i18n-phase-b-areas-en-390.png` | "Super Nintendo World", "The Wizarding World of Harry Potter" | ✅ |
| `i18n-phase-b-areas-ko-390.png` | "슈퍼 닌텐도 월드", "위저딩 월드 오브 해리 포터" | ✅ |
| `i18n-phase-b-areas-zh-390.png` | "超級任天堂世界", "哈利波特魔法世界" | ✅ |
| `i18n-phase-b-foods-filter-en-390.png` | "All Genres", "All Store Types", "All Dining Styles" | ✅ |
| `i18n-phase-b-food-detail-en-390.png` | 商品名日本語維持 ✅、カテゴリ "Noodle & Pasta" ✅ | ✅ |
| `i18n-phase-b-eaten-genre-en-390.png` | Eaten 画面 EN 全体が翻訳 ✅ | ✅ |
| `i18n-phase-b-area-detail-shops-en-390.png` | H1 "ハリウッド・エリア"（日本語維持・設計通り）、"First 3 Picks" EN ✅ | ✅ |

---

## 6. 既存機能破壊確認

| 確認項目 | 結果 |
|---|---|
| 店舗ID衝突修正 v1.1 | ✅ hrefTotal 63 / unique 63 / duplicate 0 / shop-1tt48e8×1 / nonASCII×0 |
| bottom-nav-and-language-switcher-v1 | ✅ nav active states 維持 |
| overflow / clipped / 横スクロール | ✅ すべて 0 |
| lint / typecheck / build | ✅ すべて成功 |

---

## 指摘事項まとめ

以下はすべて Phase B 承認に影響しない軽微・pre-existing の指摘。Phase C 以降で対処推奨。

| # | ファイル | 内容 | 分類 |
|---|---|---|---|
| A | `food-card.tsx` L84 | `ほか${areaDisplay.hiddenCount}箇所` — 複数エリア時の suffix が日本語固定 | 軽微（Phase C） |
| B | `recommendation-rail.tsx` | `title`・`description` デフォルト props、`候補`・`もっと探す` が日本語固定 | pre-existing（Phase C） |
| C | `areas/[id]/page.tsx` L106 | `残り${getRemainingDays(food) ?? "未確認"}日` — fallback が日本語固定 | pre-existing（Phase C） |

---

## 総評

Phase B で設計した全要件が正しく実装されている。

- 144翻訳エントリ（4ロケール）完全追加 ✅
- `tAreaName` ヘルパーによるエリア名多言語化 ✅
- `area-shop-list.tsx` の client component 分離と shopType t() 化 ✅
- `use-locale.tsx` の言語切替即時反映修正が最小限かつ安全 ✅
- `eaten-experience` / `eaten-genre-progress` のグルーピングキー規律（内部キー使用）✅
- `inferDiningType`（案A）による diningType 多言語化、日本語 fallback なし ✅
- `food-card.tsx`・`eaten-area-progress.tsx`・`recommendation-rail.tsx` にも必要箇所で `tAreaName` / `t()` 適用 ✅
- 商品名・店舗名の日本語維持 ✅
- store-id-collision-fix v1.1 無傷 ✅
- lib/constants.ts categoryLabels / shopTypeLabels / diningTypeLabels 維持 ✅
- lib/store-utils.ts 未変更 ✅

指摘 A・B・C はいずれも pre-existing またはスコープ外のため、Phase B 承認の妨げにならない。
