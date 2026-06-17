# Design: B「商品名・店舗名の本格多言語化」v1

**設計日:** 2026-06-17
**前提:** i18n Phase B/C 承認済み / Home Phase D / Phase C+ 承認済み

---

## 1. Objective

ユニコレ全体で、商品名・店舗名を ja / en / ko / zh-TW の4言語に対応させる。

**最重要原則:**
- 機械翻訳を自動で本番適用しない
- 翻訳がない場合は必ず日本語名に fallback する
- 商品ID・店舗IDを保存キー・URLに使い続ける（翻訳名は display layer のみ）
- generated JSON / DB / crawler は変更しない
- localStorage schema は変更しない

---

## 2. Current State（実読取確認済み）

### データ規模

| 種別 | 件数 | 備考 |
|---|---|---|
| 商品（foods.generated.json） | 294件（表示対象 ~235件） | `food-XXXXXXX` 形式 ID |
| 店舗（shops.generated.json） | 42件 | `shop-XXXXXXX` 形式 ID |
| エリア | 10件 | Phase B で辞書化済み ✅ |
| カテゴリ | 14種 | Phase B で辞書化済み ✅ |

### 現在の商品名・店舗名の表示状況

| 箇所 | 現状 |
|---|---|
| `food-card.tsx` | `food.name`（日本語固定） |
| `food-detail.tsx` | `food.name`（日本語固定）|
| `food-grid.tsx` | `food.name` / `food.shop.name`（日本語固定）|
| `home-progress-client.tsx` | `food.name`（日本語固定、Phase C+で意図的に維持）|
| `/stores` / `/stores/[id]` | `shop.name`（日本語固定）|
| `FoodLocation.shopName` | 日本語固定 |

### 検索ロジック現状（`food-grid.tsx` L368〜385）

`matchesFoodQuery` の haystack に以下を結合:
```
food.name + food.shop.name + areaNames + description + eventName + flavor + category翻訳 + locations.shopName/areaName
```
→ 日本語名のみ。翻訳名は含まれていない。

### ID 安定性確認

- `food.id` = `food-XXXXXXX`（7文字サフィックス、クローラー生成の stable hash）✅
- `shop.id` = `shop-XXXXXXX`（同形式）✅
- `UserFoodLog.foodId` = `food.id` — localStorage schema で使用中。翻訳は一切影響しない ✅
- 店舗ID衝突修正 v1.1 承認済み — 現在の `shop.id` を翻訳キーとして使う ✅

### エリア名（参考: `lib/i18n/area-name.ts`）

Phase B で実装済みの `tAreaName(name, t)` パターンが**翻訳helper設計の模範**になる:
- 日本語名をキーとして `Record<string, TranslationKey>` でマッピング
- フォールバックは日本語名そのまま
- **商品名・店舗名は件数が多いためこのパターンは採用しない**（辞書キーが爆発する）

---

## 3. Translation Scope

### 対象

| 種別 | 対象フィールド |
|---|---|
| 商品名 | `food.name`（表示時のみ翻訳。原文は保持） |
| 店舗名 | `shop.name` / `FoodLocation.shopName`（表示時のみ翻訳） |

### 表示箇所

| ページ・コンポーネント | 対象 |
|---|---|
| `/foods`（food-grid.tsx） | 商品名、店舗名 |
| `/foods/[id]`（food-detail.tsx） | 商品名（日本語原文併記）、店舗名 |
| `/stores`（stores page） | 店舗名 |
| `/stores/[id]` | 店舗名、商品名 |
| `/areas/[id]` | 商品名、店舗名 |
| `/eaten` | 商品名、店舗名 |
| ホーム（home-progress-client.tsx） | 商品名（HomeFoodRailCard など） |

---

## 4. Out of Scope

- `food.description` の翻訳
- `UserFoodLog.memo` の翻訳
- `food.priceNote` の翻訳
- generated JSON の変更
- DB / crawler の変更
- URL構造の変更（`/foods/[id]` の `id` は `food.id` のまま）
- localStorage schema の変更
- 自動翻訳 API の本番導入
- 店舗ID衝突修正への再手入れ
- ローマ字検索（発音ベースの英語検索）
- app-wide な大規模リファクタ

---

## 5. Translation Data Model Options

### 候補 A: `lib/i18n/name-translations.ts`（TypeScript ファイル）

```ts
export const foodNameTranslations: Record<string, Partial<Record<Locale, string>>> = {
  "food-62sv4l": { en: "Super Star Anniversary Plate...", ko: "...", "zh-TW": "..." },
  ...
};
```

| 観点 | 評価 |
|---|---|
| Codex が扱いやすいか | ✅ TypeScript として直接編集可能 |
| 人間がレビューしやすいか | ⚠️ 294+件が1ファイルに入ると大きく、diff が重い |
| generated JSON と分離できるか | ✅ |
| build 時に型安全 | ✅ Locale 型でキーを制約できる |
| 欠損検出しやすいか | ⚠️ TS コンパイラでは検出できない（Partial のため）|
| 将来 CSV 管理に移行しやすいか | ❌ TS→CSV 変換が必要 |

### 候補 B: `scripts/output/translations/food-names.json`

| 観点 | 評価 |
|---|---|
| Codex が扱いやすいか | ✅ |
| 人間がレビューしやすいか | ✅ JSON は diff が読みやすい |
| generated JSON と分離できるか | ❌ `scripts/output/` はクローラー出力ディレクトリ。混在が紛らわしい |
| build 時に型安全 | ⚠️ 手動型付けが必要 |
| 欠損検出しやすいか | ✅ スクリプトで確認しやすい |
| 将来 CSV 管理に移行しやすいか | ✅ |

### 候補 C: `data/translations/food-names.json` + `data/translations/store-names.json`

| 観点 | 評価 |
|---|---|
| Codex が扱いやすいか | ✅ |
| 人間がレビューしやすいか | ✅ ファイルが分離されており diff が読みやすい |
| generated JSON と分離できるか | ✅ `data/translations/` は明確に手動管理ディレクトリ |
| build 時に型安全 | ✅ `import ... as const` + 型ガードで担保可能 |
| 欠損検出しやすいか | ✅ スクリプトで確認しやすい |
| 将来 CSV 管理に移行しやすいか | ✅ JSON ↔ CSV 変換が容易 |

---

## 6. Recommended Data Model

**推奨: 候補 C**（`data/translations/` ディレクトリ + `lib/i18n/name-translations.ts` ヘルパー）

理由:
- generated JSON と手動翻訳データが明確に分離される
- ファイルを商品用・店舗用に分けることで diff の粒度を保てる
- JSON なので翻訳担当者・外注・CSV ツールへの移行が容易
- ヘルパーを `lib/i18n/` に置くことで既存の helper パターン（`area-name.ts`、`format-price.ts` 等）と一貫する

### データファイル構造

```
data/
  translations/
    food-names.json      ← 商品名翻訳辞書（food.id キー）
    store-names.json     ← 店舗名翻訳辞書（shop.id キー）
```

### JSON スキーマ（`food-names.json`）

```json
{
  "food-62sv4l": {
    "en": "Super Star Anniversary Plate ~Mushroom Lasagna & Fried Chicken~",
    "ko": "슈퍼스타 애니버서리 플레이트 ~버섯 라자냐 & 프라이드 치킨~",
    "zh-TW": "超級巨星週年紀念拼盤 ~蘑菇千層麵&炸雞~",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-u0o9uo": {
    "en": "Mario Burger ~Bacon & Cheese~",
    "ko": "마리오 버거 ~베이컨 & 치즈~",
    "zh-TW": "瑪利歐漢堡 ~培根起司~",
    "_source": "official",
    "_status": "verified"
  }
}
```

`_source` / `_status` は表示には使わない内部管理フィールド。

### JSON スキーマ（`store-names.json`）

```json
{
  "shop-1vff8rf": {
    "en": "Kinopio's Cafe",
    "ko": "키노피오 카페",
    "zh-TW": "奇諾比奧咖啡廳",
    "_source": "official",
    "_status": "verified"
  },
  "shop-1ptfw3y": {
    "en": "SAIDO",
    "ko": "사이도",
    "zh-TW": "SAIDO",
    "_source": "official",
    "_status": "verified"
  }
}
```

### ヘルパー関数（`lib/i18n/name-translations.ts`）

```ts
import foodNamesRaw from "@/data/translations/food-names.json";
import storeNamesRaw from "@/data/translations/store-names.json";
import type { Locale } from "@/lib/i18n/locales";

type NameEntry = Partial<Record<Exclude<Locale, "ja">, string>>;
const foodNames = foodNamesRaw as Record<string, NameEntry>;
const storeNames = storeNamesRaw as Record<string, NameEntry>;

export function getFoodNameI18n(foodId: string, locale: Locale, fallback: string): string {
  if (locale === "ja") return fallback;
  return foodNames[foodId]?.[locale] ?? fallback;
}

export function getShopNameI18n(shopId: string, locale: Locale, fallback: string): string {
  if (locale === "ja") return fallback;
  return storeNames[shopId]?.[locale] ?? fallback;
}
```

**Fallback 保証:** `?? fallback` によって翻訳が存在しない場合は必ず日本語名を返す。

---

## 7. Food Name Translation Plan

### 対象商品の優先順位

| 優先度 | 対象 | 件数（概算） |
|---|---|---|
| 高 | IP名を含む代表商品（マリオ・ハリポタ・ミニオン系） | ~40件 |
| 高 | 公式 URL で英語名が確認できる商品 | ~50件 |
| 中 | 期間限定・イベント商品 | ~60件 |
| 低 | その他の常設商品 | ~130件 |
| 暫定 | 全商品の器だけ作り、seed なしで空 | 全294件分の器のみ |

### 翻訳ソース方針

| ソース | `_source` 値 | `_status` 値 | 採用条件 |
|---|---|---|---|
| USJ 公式サイト英語版 | `official` | `verified` | 公式英語名が確認できる場合 |
| 人間確認済み翻訳 | `manual` | `verified` | レビュー担当が確認した場合 |
| 仮訳（未確認） | `provisional` | `needs_review` | 初期 seed 段階 |
| 未翻訳 | — | `missing` （エントリ自体なし） | 翻訳がない場合は fallback |

### 商品名翻訳の特殊ケース

- **IP 固有名詞（マリオ・ハリポタ等）**: 公式英語表記をそのまま使う（例: "Mario Burger" / "Butterbeer"）
- **日本語特有の食品名（チュリトス・ポップコーン等）**: 英語圏で通じる名称を使う（Churro / Popcorn）
- **説明的な商品名（〜プレート 〜ラザニア&フライドチキン〜）**: 成分名を翻訳、IP 部分は公式表記維持
- **日本語固有表現（「食べ歩き」「期間限定」等）**: 商品名には含めず、ラベルで処理済み（Phase C）

---

## 8. Store Name Translation Plan

店舗 42件は商品より少なく、公式 URL が全件存在するため翻訳品質管理がしやすい。

### 翻訳方針

| 種別 | 方針 |
|---|---|
| IP レストラン（キノピオ・カフェ等） | 公式英語名を使う（Kinopio's Cafe） |
| エリア型レストラン（アミティ・ランディング等） | 公式英語名を翻訳 |
| ラテン文字名（SAIDO） | そのまま使う（en: SAIDO / ko: 사이도） |
| フードカート（内部名称のみ） | 店舗種別 + エリア名から構成 |

### store-names.json 42件は Phase B2 で一括作成

42件は人間が確認可能な量。公式 URL から英語名を取得し、ko/zh-TW は provisional として seed し、`needs_review` でステータス管理する。

---

## 9. Display Policy

### ja ロケール

変更なし。`food.name` / `shop.name` をそのまま表示する。

### en / ko / zh-TW ロケール

| 表示箇所 | 翻訳がある場合 | 翻訳がない場合（fallback） |
|---|---|---|
| 商品カード（food-card.tsx） | 翻訳名のみ表示 | 日本語名のまま表示（見た目に差異なし） |
| 商品詳細（food-detail.tsx） | 翻訳名 + 日本語原文を小さく併記 | 日本語名のみ（parkで探せるように）|
| ホーム商品カード（HomeFoodRailCard） | 翻訳名のみ | 日本語名のまま |
| 店舗カード・店舗詳細 | 翻訳名のみ | 日本語名のまま |
| /eaten の記録一覧 | 翻訳名のみ | 日本語名のまま |

### 商品詳細での日本語原文併記

```tsx
// en/ko/zh-TW の food-detail.tsx
<h1>{getFoodNameI18n(food.id, locale, food.name)}</h1>
{locale !== "ja" && getFoodNameI18n(food.id, locale, food.name) !== food.name && (
  <p className="text-xs text-slate-400 mt-0.5">{food.name}</p>
)}
```

翻訳がない（fallback中）の場合は原文の二重表示にならない。

---

## 10. Search Policy

### 方針

日本語名と翻訳名の**両方で検索できる**ようにする。既存の検索ロジック（`matchesFoodQuery`）を壊さない。

### `matchesFoodQuery` の haystack 拡張（Phase B6）

```ts
function matchesFoodQuery(food: FoodWithRelations, query: string, locale: Locale, t: ...) {
  const haystack = normalizeFoodName([
    food.name,              // 日本語名（既存）
    food.shop.name,         // 店舗日本語名（既存）
    getFoodNameI18n(food.id, "en", ""),    // 英語名（追加）
    getFoodNameI18n(food.id, locale, ""), // 現在ロケール翻訳名（追加）
    getShopNameI18n(food.shop.id, "en", ""), // 店舗英語名（追加）
    // ... 以下既存
  ].filter(Boolean).join(""));
```

**現在の `matchesFoodQuery` シグネチャ:** `(food, query, t: (key) => string)` → `locale` 引数を追加する必要がある。ただし、これは Phase B6 での対応。

### ローマ字検索

今フェーズでは対象外。英語名・翻訳名が入ることで実質的にローマ字不要のケースが多い。

---

## 11. Fallback Policy

```
getFoodNameI18n(foodId, locale, fallback):
  locale === "ja"  → fallback（日本語名そのまま）
  locale !== "ja"  → foodNames[foodId]?.[locale] ?? fallback
```

**fallback が発動するケース:**
1. `data/translations/food-names.json` にエントリがない商品
2. エントリはあるが対象 locale のキーがない商品（例: `en` はあるが `ko` がない）

**fallback 時の表示:**
- 日本語名がそのまま表示される（現在と変わらない）
- 詳細ページでの「日本語原文の小さな併記」は翻訳がある場合のみ表示（fallback時は二重表示にならない）

---

## 12. Verification / Missing Translation Audit

### 欠損チェックスクリプト（Phase B7）

`scripts/check-translation-coverage.ts` を新規作成:

```ts
// foods.generated.json の全 food.id に対して food-names.json の網羅率を報告
// 出力: missing / needs_review / verified の件数と割合
```

### 翻訳ステータス管理

| `_status` 値 | 意味 | 表示可否 |
|---|---|---|
| `verified` | 人間確認済み | ✅ 表示可 |
| `needs_review` | 仮訳・要確認 | ✅ 表示可（fallbackより優先。品質に注意）|
| — (missing) | 翻訳なし | fallback で日本語表示 |

`needs_review` 翻訳は表示するが、管理者が定期的に確認・`verified` に昇格させる運用とする。

---

## 13. Files to Touch

### 新規作成

| ファイル | 内容 |
|---|---|
| `data/translations/food-names.json` | 商品名翻訳辞書（初期はまず器のみ、または優先商品のみ seed）|
| `data/translations/store-names.json` | 店舗名翻訳辞書（42件を一括 seed）|
| `lib/i18n/name-translations.ts` | `getFoodNameI18n` / `getShopNameI18n` helper |
| `scripts/check-translation-coverage.ts` | 翻訳カバレッジチェックスクリプト（Phase B7）|

### 変更（フェーズ別）

| フェーズ | ファイル | 変更内容 |
|---|---|---|
| B3 | `components/store-card.tsx` 等 | `getShopNameI18n` 反映 |
| B4（未確認）| `/stores/[id]` 関連ページ | 店舗名 i18n 反映 |
| B5 | `components/food-card.tsx` | `getFoodNameI18n` 反映 |
| B5 | `components/food-detail.tsx` | `getFoodNameI18n` + 日本語原文併記 |
| B5 | `components/home-progress-client.tsx` | `HomeFoodRailCard` の `food.name` → `getFoodNameI18n` |
| B6 | `components/food-grid.tsx` | `matchesFoodQuery` の haystack 拡張 |

---

## 14. Files Not to Touch

| ファイル | 理由 |
|---|---|
| `scripts/output/foods.generated.json` | crawler 生成ファイル、絶対変更禁止 |
| `scripts/output/shops.generated.json` | 同上 |
| `lib/food-utils.ts` | 既存ロジック保護。`food.name` へのアクセスは display layer で吸収 |
| `lib/store-utils.ts` | 同上 |
| `lib/constants.ts` | 変更不要 |
| `types/domain.ts` | `Food.name` / `Shop.name` フィールドは日本語原文として維持 |
| `lib/i18n/dictionaries.ts` | 商品名・店舗名は辞書に入れない（数が多すぎる） |
| `lib/i18n/area-name.ts` | 承認済み Phase B 成果保護 |
| localStorage schema | `UserFoodLog.foodId` = `food.id` のまま |
| URL 構造（`/foods/[id]`等） | `food.id` をそのまま使用 |

---

## 15. Risks

### R1: 翻訳品質による UX 劣化

仮訳（`needs_review`）の商品名が不自然・誤訳で表示される可能性。

**対処:** 初期フェーズでは優先商品（IP 商品・代表的なメニュー）のみ `verified` にして表示。全商品は fallback からスタートする。

### R2: food.id の変更

クローラーが再クロールで `food.id` を変更した場合、翻訳辞書のキーが孤立する。

**対処:** `_status: "orphan"` 検出を欠損チェックスクリプトに含める。クローラーは基本的に ID を変えないが、`scripts/output/deleted-foods.generated.json` を監視して廃番 ID を定期清掃する。

### R3: `FoodLocation.shopName` が `shop.id` を持たない

`FoodLocation` は `shopId?: string`（optional）。`shopId` がない場合は `shopName`（日本語文字列）のみ。

**対処:** `getShopNameI18n` の呼び出し時に `shopId` が undefined の場合は `shopName`（fallback）をそのまま使う。

```ts
// shopId がある場合のみ翻訳、ない場合は shopName fallback
const displayShopName = location.shopId
  ? getShopNameI18n(location.shopId, locale, location.shopName)
  : location.shopName;
```

### R4: 検索ロジックへの影響

`matchesFoodQuery` に `locale` 引数を追加するため、呼び出し元のシグネチャ変更が必要（Phase B6）。`food-grid.tsx` の呼び出しが複数箇所ある場合に変更漏れが出る可能性。

**対処:** Phase B6 で `grep -n "matchesFoodQuery"` で呼び出し元を全数確認してから変更する。

### R5: `data/` ディレクトリの Next.js バンドル扱い

`data/translations/food-names.json` を `import ... from "@/data/translations/..."` する場合、Next.js の `tsconfig.json` で `@/data` パスエイリアスが設定されているか確認が必要。

**対処:** Phase B1 で `tsconfig.json` の `paths` を確認し、必要なら `@/data` エイリアスを追加する（`@/lib` と同パターン）。もしくは相対パスで import する。

---

## 16. Stop and Ask Conditions

1. `scripts/output/foods.generated.json` / `shops.generated.json` の変更が必要と判断した場合
2. `DB` / crawler の変更が必要と判断した場合
3. `food.id` が翻訳辞書キーとして不安定（頻繁に変わる）と判明した場合
4. `shop.id` が翻訳キーとして不安定と判明した場合
5. 機械翻訳を確認なしに大量の `verified` として登録しようとした場合
6. 翻訳名を `UserFoodLog.foodId` や URL に使おうとした場合
7. `localStorage` schema の変更が必要になった場合
8. 店舗ID衝突修正（v1.1）のファイルに触れる必要が出た場合
9. `types/domain.ts` の `Food` / `Shop` 型に `name` 以外のフィールドを追加しようとした場合
10. 検索ロジックの全面書き換えが必要になった場合（`matchesFoodQuery` の小修正は OK）
11. `data/translations/` の JSON が 1MB を超えるような大量データになる見込みになった場合（CDN/DB移行を検討）

---

## 17. Recommended Implementation Phases

### Phase B1: データ構造とヘルパーだけ作る（最小）

**変更ファイル:**
- `data/translations/food-names.json`（空オブジェクト `{}`）
- `data/translations/store-names.json`（空オブジェクト `{}`）
- `lib/i18n/name-translations.ts`（`getFoodNameI18n` / `getShopNameI18n`）

**目的:** helper の型安全性・build 動作を確認する。表示への影響ゼロ。

---

### Phase B2: 店舗名 42件の翻訳辞書を seed

**変更ファイル:**
- `data/translations/store-names.json`（42件追加）

**目的:** 件数が少なく管理しやすい店舗名から着手。公式 URL から英語名を取得し seed する。ko/zh-TW は provisional。

---

### Phase B3: `/stores` / `/stores/[id]` に店舗名 i18n を反映

**変更ファイル:**
- 店舗名を表示しているコンポーネント（store-card.tsx 相当、stores page 等）
- `area-shop-list.tsx`（エリア詳細内の店舗名）

**目的:** 店舗名の翻訳を実際の画面に反映。商品名への影響なし。

---

### Phase B4: `/foods` / `/foods/[id]` / ホームの商品名に i18n を反映

**変更ファイル:**
- `components/food-card.tsx`
- `components/food-detail.tsx`（翻訳名 + 日本語原文の小さな併記）
- `components/home-progress-client.tsx`（HomeFoodRailCard）

**目的:** 商品名の翻訳表示を実装。fallback が機能することを確認。

---

### Phase B5: 商品名の優先 seed 追加

**変更ファイル:**
- `data/translations/food-names.json`（IP商品・代表商品を優先的に追加）

**目的:** 高頻度商品の翻訳品質を確保する。全294件を一度に追加しない。

---

### Phase B6: 検索対応（翻訳名も haystack に含める）

**変更ファイル:**
- `components/food-grid.tsx`（`matchesFoodQuery` の haystack 拡張）

**目的:** en/ko/zh-TW の翻訳名でも商品検索できるようにする。日本語検索は現状維持。

---

### Phase B7: 欠損チェック・翻訳監査スクリプト

**変更ファイル:**
- `scripts/check-translation-coverage.ts`（新規）

**目的:** 翻訳カバレッジの定量確認。missing / needs_review / verified の件数・割合を出力。

---

## 18. Recommended Codex /goal Direction

Codex への指示は Phase B1 から順番に作成する。各フェーズは独立した Goal として設計する。

### Phase B1 Goal の骨子

```
変更ファイル:
  - data/translations/food-names.json（新規、空オブジェクト）
  - data/translations/store-names.json（新規、空オブジェクト）
  - lib/i18n/name-translations.ts（新規）
  - tsconfig.json（@/data パスエイリアスが未設定なら追加）

禁止:
  - scripts/output/ ファイルの変更
  - types/domain.ts の変更
  - lib/food-utils.ts / lib/store-utils.ts の変更
  - 既存コンポーネントへの反映（B3以降で行う）
  - 辞書データを lib/i18n/dictionaries.ts に入れない

検証:
  - npm run typecheck: helper 関数が型エラーなし
  - import が通ること（空JSONでも build 成功）
  - getFoodNameI18n("存在しないID", "en", "テスト商品") === "テスト商品" を確認
  - getFoodNameI18n("存在しないID", "ja", "テスト商品") === "テスト商品" を確認
```

### Phase B2 Goal の骨子

```
変更ファイル:
  - data/translations/store-names.json（42件追加）

禁止:
  - scripts/output/ ファイルの変更
  - 既存コンポーネントへの反映（B3で行う）
  - _status: "verified" を確認なしに使わない（公式確認できないものは "provisional"）

検証:
  - 42件すべての shop.id が shops.generated.json に存在すること
  - 欠損・孤立IDがないこと
```
