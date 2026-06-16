# i18n Phase B 設計書 — エリア名・カテゴリ名多言語化 v1

- 設計日: 2026-06-16
- 担当: Claude（UXデザイナー / 設計担当）
- 前提: bottom-nav-and-language-switcher-v1 承認済み
- 参照: `docs/app-internationalization-data-design-v1.md`
- 次工程: Codex `/goal` は別ドキュメントで作成（本ドキュメントは設計書のみ）

---

## 1. Objective

`lib/constants.ts` の `categoryLabels` / `shopTypeLabels` / `diningTypeLabels` および区・エリア名表示を既存の `dictionaries.ts` + `useLocale()` 基盤に統合し、EN / KO / zh-TW ユーザーが表示言語に合ったラベルで図鑑・フィルタ・ジャンル進捗を閲覧できるようにする。

また前回レビューで指摘した `<nav aria-label>` のアクセシビリティ問題（`"nav.label"` キー未追加）を同時に解消する。

---

## 2. Current State

### ラベルの現状

```ts
// lib/constants.ts — 全ラベルが日本語ハードコード
export const categoryLabels: Record<FoodCategory, string> = {
  churro: "チュリトス",
  popcorn: "ポップコーン",
  // ... 14種
};
export const shopTypeLabels: Record<ShopType, string> = {
  restaurant: "レストラン",
  // ... 4種
};
export const diningTypeLabels: Record<DiningType, string> = {
  takeout: "テイクアウト",
  // ... 5種
};
```

### 使用箇所の現状

| 呼び出し元 | 対象ラベル | コンポーネント種別 | 現状 |
|---|---|---|---|
| `components/food-detail.tsx` | category / diningType / shopType | client | `categoryLabels[food.category]`直接参照 |
| `components/food-grid.tsx` | category / shopType / diningType / area.name | client | 同上 + area.nameはDB値そのまま |
| `components/recommendation-rail.tsx` | category | client | `categoryLabels[food.category]`直接参照 |
| `components/eaten-experience.tsx` | category / area.name | client | `categoryLabels[x]`をグループキーにも使用 |
| `components/eaten-genre-progress.tsx` | category | client | `Object.entries(categoryLabels)`でイテレーション + グループキー共用 |
| `components/area-overview.tsx` | area.name | client | `area.name`（DB値、日本語）そのまま |
| `app/areas/[id]/page.tsx` | shopType / area.name | **server** | `shopTypeLabels[shop.type]`直接参照 |
| `app/shops/page.tsx` | shopType | **server** | `shopTypeLabels[shop.type]`直接参照 |
| `components/app-header.tsx` | nav.label | client | `t("nav.home")`を誤ってnav aria-labelに使用 |

### `t()` 利用状況

`food-detail`, `food-grid`, `recommendation-rail`, `eaten-experience`, `eaten-genre-progress`, `area-overview` はすべて `"use client"` かつ `const { t } = useLocale()` 取得済み。**追加のuseLocale呼び出しは不要**。

### 制約

- `app/areas/[id]/page.tsx` — Server Component。`useLocale()` フック不可。
- `app/shops/page.tsx` — Server Component。同上。
- エリア名は DB の `area.name` フィールドから来る（URL・ID変更不可）。

---

## 3. Translation Scope

### 対象（Phase B）

| 種別 | 内部キー数 | 新辞書キー数 |
|---|---|---|
| カテゴリラベル | 14 | 14 |
| 店舗種別ラベル | 4 | 4 |
| 飲食タイプラベル | 5 | 5 |
| エリア名 | 10 | 10 |
| nav.label（aria-label修正） | 1 | 1 |
| **合計** | **34** | **34 × 4 locale = 136 entries** |

### 対象外（Phase B スコープ外）

| 対象 | 理由 |
|---|---|
| 商品名・店舗名 | Phase D |
| `getStoreSummary()` の返り値 | 店舗名由来の複合ラベル、Phase C+ |
| `getStoreBadge()` の返り値 | 同上 |
| `StoreWithFoods.kindLabel` | SSG時に生成、アーキテクチャ変更が必要 |
| `getStoreTypeLabel()` | `kindLabel` 経由で返るため同上 |
| 価格・日付表示 | Phase C |
| `app/shops/page.tsx` | 管理用・レガシーページ |
| generated JSON | 変更禁止 |
| DB / crawler | 変更禁止 |

---

## 4. Area Name Translation Plan

### 設計方針

- エリア名は DB の `area.name` に依存するため、辞書キーへの直接マッピングが必要
- 既存の `normalizeAreaImageName()` と同じ正規化ロジックを再利用し、ルックアップ関数 `tAreaName()` を新設
- フォールバック: 翻訳キーが見つからない場合は `area.name`（日本語）をそのまま返す
- エリア名翻訳により `settings.languageDescription` の "エリア名は日本語のまま" 文言を更新する

### 新規ファイル: `lib/i18n/area-name.ts`

```ts
import type { TranslationKey } from "@/lib/i18n/dictionaries";

// area.name (日本語) → translation key のマッピング
// normalizeAreaImageName() と同じロジックでキーを導出
const areaNameKeyMap: Record<string, TranslationKey> = {
  "スーパー・ニンテンドー・ワールド":        "area.name.super-nintendo-world",
  "ウィザーディング・ワールド・オブ・ハリー・ポッター": "area.name.wizarding-world",
  "ミニオン・パーク":                    "area.name.minion-park",
  "ユニバーサル・ワンダーランド":            "area.name.universal-wonderland",
  "ハリウッド・エリア":                   "area.name.hollywood",
  "ニューヨーク・エリア":                  "area.name.new-york",
  "サンフランシスコ・エリア":              "area.name.san-francisco",
  "ジュラシック・パーク":                  "area.name.jurassic-park",
  "アミティ・ビレッジ":                   "area.name.amity-village",
  "ウォーターワールド":                   "area.name.waterworld",
};

// area.name の正規化（normalizeAreaImageName と同パターン）
function normalizeForLookup(name: string): string {
  return (name ?? "")
    .replace(/[™®]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function tAreaName(
  name: string,
  t: (key: TranslationKey) => string
): string {
  const normalized = normalizeForLookup(name);
  const key = areaNameKeyMap[normalized];
  return key ? t(key) : name; // fallback: 日本語そのまま
}
```

### 辞書値（10エリア × 4ロケール）

| キー | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `area.name.super-nintendo-world` | スーパー・ニンテンドー・ワールド | Super Nintendo World | 슈퍼 닌텐도 월드 | 超級任天堂世界 |
| `area.name.wizarding-world` | ウィザーディング・ワールド・オブ・ハリー・ポッター | The Wizarding World of Harry Potter | 위저딩 월드 오브 해리 포터 | 哈利波特魔法世界 |
| `area.name.minion-park` | ミニオン・パーク | Minion Park | 미니언 파크 | 小小兵樂園 |
| `area.name.universal-wonderland` | ユニバーサル・ワンダーランド | Universal Wonderland | 유니버설 원더랜드 | 環球奇蹟樂園 |
| `area.name.hollywood` | ハリウッド・エリア | Hollywood Area | 할리우드 에리어 | 好萊塢區 |
| `area.name.new-york` | ニューヨーク・エリア | New York Area | 뉴욕 에리어 | 紐約區 |
| `area.name.san-francisco` | サンフランシスコ・エリア | San Francisco Area | 샌프란시스코 에리어 | 舊金山區 |
| `area.name.jurassic-park` | ジュラシック・パーク | Jurassic Park | 쥬라기 파크 | 侏羅紀公園 |
| `area.name.amity-village` | アミティ・ビレッジ | Amity Village | 에미티 빌리지 | 海濱小鎮 |
| `area.name.waterworld` | ウォーターワールド | WaterWorld | 워터월드 | 水世界 |

### 適用コンポーネント

| ファイル | 変更内容 |
|---|---|
| `components/area-overview.tsx` | `area.name` → `tAreaName(area.name, t)` |
| `components/food-grid.tsx` | フィルタ select の `{area.name}` → `tAreaName(area.name, t)` |
| `components/eaten-experience.tsx` | エリア別アルバムモードのグループタイトル → `tAreaName(areaName, t)` |

### 意図的に適用しない箇所

| ファイル | 理由 |
|---|---|
| `app/areas/[id]/page.tsx` の H1 | Server Component のため `useLocale()` 不可。エリア詳細ページのタイトルは日本語のまま（Phase C で client wrapper 化を検討）。 |

### `settings.languageDescription` 更新

エリア名が翻訳されるため、現行の「エリア名は日本語のまま」文言を削除・更新する。

| ロケール | 現在 | 変更後 |
|---|---|---|
| ja | 〜エリア名は現地で見つけやすいよう日本語のまま表示します | 〜商品名・店舗名は現地で見つけやすいよう日本語のまま表示します |
| en | Food, store, and area names stay in Japanese... | Food and store names stay in Japanese... |
| ko | 〜에리어명은 현장에서 찾기 쉽도록 일본어로 표시됩니다 | 〜푸드명, 매장명은 현장에서 찾기 쉽도록 일본어로 표시됩니다 |
| zh-TW | 〜區域名會保留日文，方便在園區內查找 | 〜餐點名、店鋪名會保留日文，方便在園區內查找 |

---

## 5. Category Label Translation Plan

### 辞書キー命名規則

`"category.{FoodCategory}"` — TypeScript の `FoodCategory` ユニオン型の値をそのままサフィックスに使う。

### 辞書値（14カテゴリ × 4ロケール）

| キー | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `category.churro` | チュリトス | Churros | 추리토스 | 吉拿棒 |
| `category.popcorn` | ポップコーン | Popcorn | 팝콘 | 爆米花 |
| `category.drink` | ドリンク | Drink | 음료 | 飲料 |
| `category.dessert` | スイーツ | Sweets | 스위츠 | 甜點 |
| `category.burger` | バーガー | Burger | 버거 | 漢堡 |
| `category.pizza` | ピザ | Pizza | 피자 | 披薩 |
| `category.chicken` | チキン・肉系 | Chicken & Meat | 치킨・육류 | 炸雞・肉類 |
| `category.rice` | ライス・カレー | Rice & Curry | 라이스・카레 | 米飯・咖哩 |
| `category.noodle` | 麺・パスタ | Noodle & Pasta | 면・파스타 | 麵・義大利麵 |
| `category.snack` | スナック | Snack | 스낵 | 點心 |
| `category.kids` | キッズ | Kids | 키즈 | 兒童 |
| `category.seasonal` | 季節限定 | Seasonal | 계절 한정 | 季節限定 |
| `category.set` | セットメニュー | Set Menu | 세트메뉴 | 套餐 |
| `category.unknown` | カテゴリ確認中 | Category Checking | 카테고리 확인 중 | 類別確認中 |

### 呼び出しパターン

```tsx
// Before
<span>{categoryLabels[food.category]}</span>

// After
<span>{t(`category.${food.category}`)}</span>
```

TypeScript での型安全化（`as TranslationKey` キャスト）:

```ts
t(`category.${food.category}` as TranslationKey)
```

または辞書に `category.*` キーが追加されたあとは型推論が自動的に通る。

### グループキー問題（重要）

`eaten-experience.tsx` と `eaten-genre-progress.tsx` では現在 `categoryLabels[category]`（日本語文字列）をグループキーとして使用している。翻訳後はロケール変更でグループキーが変化し、グループが崩壊する。

**修正方針**: グループキーには常に内部カテゴリキー（例: `"churro"`）を使い、表示のみ `t("category.churro")` にする。

```ts
// eaten-genre-progress.tsx — Before
return (Object.entries(categoryLabels) as Array<[FoodCategory, string]>)
  .map(([category, label]) => ({ id: category, label, ... }))

// After
return (Object.keys(categoryLabels) as FoodCategory[])
  .map((category) => ({ id: category, label: t(`category.${category}` as TranslationKey), ... }))
```

```ts
// eaten-experience.tsx genre mode — Before
const label = categoryLabels[record.food.category] ?? "カテゴリ確認中";
groups.set(label, [...]);

// After
const key = record.food.category; // 内部キーをグループキーに
const label = t(`category.${key}` as TranslationKey);
groups.set(key, [...]);
// タイトル表示時: group.title に categoryKey を保存し、render 時に t() で表示
```

### 変更対象ファイル

| ファイル | 変更内容 |
|---|---|
| `components/food-detail.tsx` | L116, L229: `categoryLabels[food.category]` → `t("category."+x)` |
| `components/food-grid.tsx` | L216-219: `Object.entries(categoryLabels)` → keys のみ iterate + `t()` |
| `components/recommendation-rail.tsx` | L54: `categoryLabels[food.category]` → `t("category."+x)` |
| `components/eaten-experience.tsx` | L217-220 フィルタ options + L358 グループキー修正 |
| `components/eaten-genre-progress.tsx` | L83-84 イテレーションとグループキー修正 |

---

## 6. Shop Type / Dining Type Translation Plan

### Shop Type（店舗種別）

**辞書キー**: `"shopType.{ShopType}"`

| キー | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `shopType.restaurant` | レストラン | Restaurant | 레스토랑 | 餐廳 |
| `shopType.cart` | フードカート | Food Cart | 푸드 카트 | 餐車 |
| `shopType.wagon` | ワゴン | Wagon | 왜건 | 推車 |
| `shopType.unknown` | 未分類 | Uncategorized | 미분류 | 未分類 |

### Dining Type（飲食タイプ）

**辞書キー**: `"diningType.{DiningType}"`

| キー | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `diningType.takeout` | テイクアウト | Takeout | 테이크아웃 | 外帶 |
| `diningType.eat_in` | 店内飲食 | Eat In | 매장 내 식사 | 內用 |
| `diningType.both` | 店内・持ち歩き | Dine In & Takeout | 매장・테이크아웃 | 內用・外帶 |
| `diningType.food_cart` | カート販売 | Cart Sales | 카트 판매 | 餐車販售 |
| `diningType.unknown` | 不明 | Unknown | 불명 | 不明 |

### 変更対象ファイル

| ファイル | 変更内容 |
|---|---|
| `components/food-detail.tsx` | L57: `diningTypeLabels[x]` → `t("diningType."+x)` / L192: `shopTypeLabels[x]` → `t("shopType."+x)` |
| `components/food-grid.tsx` | L240-243: shopType フィルタ / L248-251: diningType フィルタ |

### `app/areas/[id]/page.tsx` ShopRow の対応

L169 の `ShopRow` コンポーネントは Server Component 内で `shopTypeLabels[shop.type]` を直接使用している。

**対応方針**: `components/area-shop-list.tsx` を新規作成（`"use client"` 付き）し、`AreaShopList` と `ShopRow` をそこに移動。`useLocale()` を利用して `t("shopType."+x)` を適用。`app/areas/[id]/page.tsx` からはこのクライアントコンポーネントを import する。

```tsx
// components/area-shop-list.tsx (新規)
"use client";
import { useLocale } from "@/lib/i18n/use-locale";
// ... AreaShopList, ShopRow を移動
```

---

## 7. nav.label Accessibility Fix

前回 `design-review-bottom-nav-and-language-switcher-v1.md` で指摘した軽微な問題の修正。

### 問題

```tsx
// components/app-header.tsx L75
<nav aria-label={t("nav.home")}>
```

`t("nav.home")` は "ホーム" を返すため、スクリーンリーダーが「ホーム ナビゲーション」と読み上げる。

### 修正

**新規辞書キー**: `"nav.label"` をすべてのロケールに追加。

| キー | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `nav.label` | メインナビゲーション | Main navigation | 메인 내비게이션 | 主要導覽 |

```tsx
// After
<nav aria-label={t("nav.label")}>
```

変更ファイル: `components/app-header.tsx` L75 のみ。

---

## 8. Files to Touch

### 新規作成

| ファイル | 内容 |
|---|---|
| `lib/i18n/area-name.ts` | `tAreaName()` ヘルパー関数 |
| `components/area-shop-list.tsx` | `AreaShopList` / `ShopRow` を client component として抽出 |

### 変更

| ファイル | 変更内容 |
|---|---|
| `lib/i18n/dictionaries.ts` | 34キー × 4ロケール = 136エントリ追加。`settings.languageDescription` 4ロケール更新。 |
| `components/app-header.tsx` | L75: `t("nav.home")` → `t("nav.label")` |
| `components/food-detail.tsx` | `categoryLabels`, `diningTypeLabels`, `shopTypeLabels` → `t()` 呼び出しに置換 |
| `components/food-grid.tsx` | 同上 + area.name フィルタ表示 → `tAreaName()` |
| `components/recommendation-rail.tsx` | `categoryLabels[x]` → `t("category."+x)` |
| `components/eaten-experience.tsx` | `categoryLabels` → `t()` + グループキー修正 + エリア名 → `tAreaName()` |
| `components/eaten-genre-progress.tsx` | `categoryLabels` イテレーション → keys only + `t()` + グループキー修正 |
| `components/area-overview.tsx` | `area.name` → `tAreaName(area.name, t)` |
| `app/areas/[id]/page.tsx` | `AreaShopList`/`ShopRow` import を `components/area-shop-list.tsx` に変更 |

---

## 9. Files Not to Touch

| ファイル | 理由 |
|---|---|
| `lib/constants.ts` | `categoryLabels` 等は型定義の参照元として残す。削除禁止。 |
| `lib/store-utils.ts` | `getStoreSummary`, `getStoreBadge`, `kindLabel`, `getStoreTypeLabel` は Phase C+ |
| `lib/i18n/use-locale.tsx` | 変更不要 |
| `lib/i18n/locales.ts` | 変更不要 |
| `app/stores/[id]/page.tsx` | `getStoreTypeLabel` 経由の表示は Phase C+ |
| `app/shops/page.tsx` | Server Component + 管理用レガシーページ、スコープ外 |
| `scripts/output/` 以下 (generated JSON) | 変更禁止 |
| `types/domain.ts` | `FoodCategory`, `ShopType`, `DiningType` の内部キー変更禁止 |
| DB / crawler / Supabase schema | 変更禁止 |
| URL 構造（`/areas/[id]`, `/stores/[id]`）| 変更禁止 |

---

## 10. Risks

### R1: TypeScript 型エラー（中リスク）

`t("category.churro")` のような動的キーは TypeScript が `TranslationKey` として推論できない場合がある。

**対処**: `as TranslationKey` キャストを明示。または `categoryKeyToTranslationKey` マッピング関数を定義してキャストを一か所に集約。

### R2: eaten-genre-progress のグループキー変更（高リスク）

現在グループキーが日本語ラベル文字列（例: `"チュリトス"`）のため、変更後は内部キー（`"churro"`）に変わる。ユーザーの localStorage に保存されているデータとの互換性への影響を確認すること。

ただし `eaten-genre-progress` はあくまで「進捗表示」であり、食べた記録の実データは `food.category`（内部キー）を参照している。グループキーの変更は表示ロジックのみに影響し、データ破壊にはならない。

### R3: area-shop-list.tsx 抽出時の props 設計（低〜中リスク）

`app/areas/[id]/page.tsx` は Server Component だが、抽出した `AreaShopList` は Client Component になる。Server → Client の props は serializable である必要がある。`AreaShopRow[]` 型は `string` と `ShopType` のみで構成されており、serializable ✅。

### R4: tAreaName フォールバック（低リスク）

DB のエリア名が `areaNameKeyMap` にない新エリア追加時は日本語フォールバック。新エリア追加時は `lib/i18n/area-name.ts` と `dictionaries.ts` を同時更新する運用手順を定める。

### R5: settings.languageDescription 更新漏れ（低リスク）

4ロケール全ての `settings.languageDescription` を更新しないと文言が矛盾する。

---

## 11. Stop and Ask Conditions

以下のいずれかに該当する場合は **実装を止めて確認** すること:

1. `lib/constants.ts` の `categoryLabels` / `shopTypeLabels` / `diningTypeLabels` を **削除** しようとした場合 → 削除禁止。`t()` 呼び出しに置換するだけでよい。
2. `types/domain.ts` の `FoodCategory` / `ShopType` / `DiningType` の値を **変更** しようとした場合 → 変更禁止。
3. `lib/store-utils.ts` を変更しようとした場合 → Phase B スコープ外。
4. URL（`/areas/[id]`, `/stores/[id]`）を変更しようとした場合 → 変更禁止。
5. `scripts/output/` 以下のファイルを編集しようとした場合 → 変更禁止。
6. エリア名の翻訳を `app/areas/[id]/page.tsx` の H1（サーバーレンダリング）に適用しようとした場合 → Phase B スコープ外。
7. `app/shops/page.tsx` を変更しようとした場合 → Phase B スコープ外（管理用ページ）。

---

## 12. Verification Plan

### コード検証（実装後・レビュー前）

```bash
# TypeScript エラーなし
npx tsc --noEmit

# 変更対象ファイルに categoryLabels[ / shopTypeLabels[ / diningTypeLabels[ が残っていないこと
grep -rn "categoryLabels\[" components/ app/
grep -rn "shopTypeLabels\[" components/ app/
grep -rn "diningTypeLabels\[" components/ app/
# 残存はgood = constants.tsとapp/shops/page.tsxのみ

# area.name 直接使用がクライアントコンポーネントに残っていないこと（food-grid / area-overview）
grep -n "area\.name" components/food-grid.tsx components/area-overview.tsx

# nav aria-label が t("nav.home") になっていないこと
grep -n "nav.home" components/app-header.tsx
# aria-label= の行に nav.home があれば修正漏れ
```

### 本番確認チェックリスト

1. `/foods` フィルタ（カテゴリ・店舗種別・飲食タイプ） — EN 切替後に英語ラベルが表示されること
2. `/areas` — EN 切替後にエリアカード名が英語になること（例: "Super Nintendo World"）
3. 食べた記録 `/eaten` のジャンル別表示 — EN 切替後にジャンル名が英語になること
4. `/foods/{id}` 商品詳細のカテゴリ / 飲食タイプ / 店舗種別 — EN 切替後に英語表示
5. 下部ナビの aria-label — スクリーンリーダーで "メインナビゲーション" と読まれること（ja）
6. `/areas/{id}` の販売場所リスト — EN 切替後に "Restaurant" / "Food Cart" 等が表示されること
7. `/stores` 一覧 — 店舗ID衝突修正 v1.1 が壊れていないこと（63件 / 0 duplicate）
8. ホーム v1.2 が壊れていないこと

---

## 13. Recommended Codex /goal Direction

（このセクションは次フェーズ: `/goal` ドキュメント作成時に展開する）

**実装ターゲット**: 下記ファイルセットへの最小限の変更。

```
新規: lib/i18n/area-name.ts
新規: components/area-shop-list.tsx
更新: lib/i18n/dictionaries.ts  （136エントリ追加 + 4エントリ更新）
更新: components/app-header.tsx
更新: components/food-detail.tsx
更新: components/food-grid.tsx
更新: components/recommendation-rail.tsx
更新: components/eaten-experience.tsx
更新: components/eaten-genre-progress.tsx
更新: components/area-overview.tsx
更新: app/areas/[id]/page.tsx  （import 変更のみ）
```

**実装順序推奨**:
1. `dictionaries.ts` に全翻訳エントリを追加（他の変更の前提）
2. `lib/i18n/area-name.ts` を新規作成
3. `components/area-shop-list.tsx` を新規作成（`app/areas/[id]/page.tsx` から移動）
4. `app-header.tsx` の `nav.label` 修正
5. 各クライアントコンポーネントの `categoryLabels/shopTypeLabels/diningTypeLabels` → `t()` 置換
6. `eaten-experience.tsx` / `eaten-genre-progress.tsx` のグループキー修正（R2 リスク注意）
7. `area-overview.tsx` / `food-grid.tsx` の `tAreaName()` 適用
8. TypeScript check + grep 検証

**コミット前確認**:
- `npx tsc --noEmit` がエラーなし
- `lib/constants.ts` の `categoryLabels` が削除されていないこと
- `lib/store-utils.ts` が変更されていないこと
- `scripts/output/` が変更されていないこと
