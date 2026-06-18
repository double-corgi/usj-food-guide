# 設計: coverage script 拡張（B5）

**作成日:** 2026-06-18  
**設計担当:** Claude（設計担当 / レビュー担当）  
**対象ファイル:** `scripts/check-translation-coverage.ts`（主）、`package.json`（convenience script 追加のみ）

---

## 1. 背景と問題

B4 完了後の coverage script 出力:

```
=== Store Translation Coverage ===
total:        42
translated:   42
missing:      0
verified:     23
needs_review: 33
orphan:       14     ← 問題: B4追加14件が orphan 扱い
```

**orphan 14 の原因（調査結果）:**

`countCoverage(shopIds, storeTranslations)` における orphan 判定:
```ts
const orphan = Object.keys(translations).filter((id) => !generatedIdSet.has(id)).length;
```

`generatedIdSet` は `scripts/output/shops.generated.json` の 42件 ID のみで構成される。B4 で追加した 14件のキー（`shop-ホッグズ-ヘッド-パブ` 等の alias / `shop-restaurant-7uhqb` 等の display ID）はこの 42件に含まれないため、全て orphan と判定される。

**B4 追加 14件は機能的に有効な seed**

`getStoreNameTranslationId`（B3 実装）が `[store.id, ...store.aliases]` を走査して翻訳を引く仕組みにより、これら 14件は実際に `/stores` 表示で参照される。orphan 判定は coverage script の参照範囲が限定的なことによる誤判定。

---

## 2. 調査結果

### 2-1. check-translation-coverage.ts の現状

| 処理 | 内容 |
|---|---|
| `total: 42` | `shops.generated.json` の ID 数 |
| `translated: 42` | generated shop ID が `store-names.json` にキーとして存在する件数 |
| `missing: 0` | generated shop ID が `store-names.json` にない件数 |
| `orphan: 14` | `store-names.json` のキーが `shops.generated.json` に存在しない件数 |
| `verified / needs_review` | `store-names.json` 全エントリの `_status` 集計（generated 有無に依存しない） |

**現在の `countCoverage` はインポートなしの純粋な Node.js スクリプト。** `import * as fs` / `import * as path` のみ。

### 2-2. buildStoresFromFoods の import 可否

**安全に import できる。**

確認根拠:
1. `scripts/list-stores-with-translation.ts`（B4 調査時に作成）が `buildStoresFromFoods` を `@/lib/store-utils` から import し、`foods.generated.json` を食べ物データとして正常に実行した実績がある
2. `package.json` の `audit:canonical` スクリプトが `-r tsconfig-paths/register --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node","target":"ES2022"}'` パターンで `@/lib` を使用している
3. `buildStoresFromFoods` は純粋な計算関数（DB / 外部通信なし）

### 2-3. foods.generated.json の形状

```
{ "foods": [ { id, shopId, areaId, name, shop: {id, name, type, officialUrl, ...}, locations: [...], area: {...}, ... } ] }
```

全フィールドが `FoodWithRelations` の shape と一致。`buildStoresFromFoods(foods)` に直接渡せる。食べ物数: **294件**。

### 2-4. B5 後の期待値

`buildStoresFromFoods(foods)` の出力:
- **display stores: 99件**（既存調査より）
- 全 store の `[store.id, ...store.aliases]` を展開した valid key 集合: 約 120〜150 キー（store 1件あたり 0〜3 aliases）

B4 追加 14件のキーは全てこの valid key 集合に含まれる → orphan: 0

---

## 3. 設計方針

**方針 B + C + D を採用**（ユーザー提示の設計候補より）:
- `validStoreTranslationKeys = shopIds ∪ displayStore.ids ∪ displayStore.aliases`
- orphan = `store-names.json` のキーが `validStoreTranslationKeys` に含まれない件数
- 出力に `display_seed` / `display_total` / `display_translated` を追加

**store-utils.ts は変更しない。** 既存の `buildStoresFromFoods` を import のみ。

---

## 4. 変更設計（scripts/check-translation-coverage.ts）

### 4-1. 追加 import

```ts
import { buildStoresFromFoods } from "@/lib/store-utils";
import type { FoodWithRelations } from "@/types/domain";
```

`--transpile-only` で実行するため、型 import はランタイムに影響しない。

### 4-2. 追加型定義

```ts
type StoreCoverageExtended = {
  generated_total: number;   // shops.generated.json の ID 数（42）
  translated: number;        // generated IDs で翻訳ありの件数
  missing: number;           // generated IDs で翻訳なしの件数
  display_total: number;     // buildStoresFromFoods の出力 store 数
  display_translated: number;// display stores で翻訳キーにヒットした件数
  display_missing: number;   // display stores で翻訳キーにヒットしなかった件数
  display_seed: number;      // store-names.json のキーで display-only（generated外）のもの
  verified: number;
  needs_review: number;
  orphan: number;            // store-names.json のキーで generated にも display にも存在しない件数
};
```

`Coverage`（Food 用の既存型）は変更しない。Store は `StoreCoverageExtended` で別扱いにする。

### 4-3. 追加関数

#### `buildDisplayStoreInfo()`

```ts
function buildDisplayStoreInfo(): { keys: Set<string>; stores: ReturnType<typeof buildStoresFromFoods> } {
  const raw = readJson("scripts/output/foods.generated.json") as { foods: FoodWithRelations[] };
  const foods = Array.isArray(raw.foods) ? raw.foods : [];
  const stores = buildStoresFromFoods(foods);
  const keys = new Set<string>();
  for (const store of stores) {
    keys.add(store.id);
    for (const alias of store.aliases) keys.add(alias);
  }
  return { keys, stores };
}
```

#### `countStoreCoverage()`

```ts
function countStoreCoverage(
  generatedIds: string[],
  translations: Record<string, TranslationEntry>,
  displayInfo: ReturnType<typeof buildDisplayStoreInfo>
): StoreCoverageExtended {
  const generatedIdSet = new Set(generatedIds);
  const { keys: displayKeys, stores: displayStores } = displayInfo;
  const translationKeys = Object.keys(translations);

  // generated coverage
  let translated = 0;
  let missing = 0;
  generatedIds.forEach((id) => {
    if (hasAnyTranslation(translations[id])) translated += 1;
    else missing += 1;
  });

  // display coverage
  const display_total = displayStores.length;
  let display_translated = 0;
  let display_missing = 0;
  displayStores.forEach((store) => {
    const hasTranslation = [store.id, ...store.aliases].some((k) => hasAnyTranslation(translations[k]));
    if (hasTranslation) display_translated += 1;
    else display_missing += 1;
  });

  // seed classification
  let display_seed = 0;
  let orphan = 0;
  let verified = 0;
  let needs_review = 0;
  translationKeys.forEach((id) => {
    const entry = translations[id];
    if (entry._status === "verified") verified += 1;
    if (entry._status === "needs_review") needs_review += 1;
    if (!generatedIdSet.has(id)) {
      if (displayKeys.has(id)) display_seed += 1;
      else orphan += 1;
    }
  });

  return {
    generated_total: generatedIds.length,
    translated,
    missing,
    display_total,
    display_translated,
    display_missing,
    display_seed,
    verified,
    needs_review,
    orphan
  };
}
```

#### `printStoreCoverage()`

```ts
function printStoreCoverage(title: string, coverage: StoreCoverageExtended) {
  console.log(`=== ${title} ===`);
  console.log(`generated_total:    ${coverage.generated_total}`);
  console.log(`translated:         ${coverage.translated}`);
  console.log(`missing:            ${coverage.missing}`);
  console.log(`display_total:      ${coverage.display_total}`);
  console.log(`display_translated: ${coverage.display_translated}`);
  console.log(`display_missing:    ${coverage.display_missing}`);
  console.log(`display_seed:       ${coverage.display_seed}`);
  console.log(`verified:           ${coverage.verified}`);
  console.log(`needs_review:       ${coverage.needs_review}`);
  console.log(`orphan:             ${coverage.orphan}`);
  console.log("");
}
```

### 4-4. メイン処理の変更

```ts
// Before (変更なし):
const foodIds = readGeneratedIds("scripts/output/foods.generated.json", "foods");
const shopIds = readGeneratedIds("scripts/output/shops.generated.json");
const foodTranslations = readTranslations("data/translations/food-names.json");
const storeTranslations = readTranslations("data/translations/store-names.json");

// Add:
const displayInfo = buildDisplayStoreInfo();

// Before:
printCoverage("Food Translation Coverage", countCoverage(foodIds, foodTranslations));
printCoverage("Store Translation Coverage", countCoverage(shopIds, storeTranslations));

// After:
printCoverage("Food Translation Coverage", countCoverage(foodIds, foodTranslations));
printStoreCoverage("Store Translation Coverage", countStoreCoverage(shopIds, storeTranslations, displayInfo));
```

Food Coverage は `countCoverage`（既存）のまま変更しない。Store Coverage のみ `countStoreCoverage` + `printStoreCoverage` に置き換える。

---

## 5. 期待する出力

### Food Translation Coverage（変化なし）

```
=== Food Translation Coverage ===
total:        294
translated:   0
missing:      294
verified:     0
needs_review: 0
orphan:       0
```

### Store Translation Coverage（B5 後）

```
=== Store Translation Coverage ===
generated_total:    42
translated:         42
missing:            0
display_total:      99
display_translated: 52
display_missing:    47
display_seed:       14
verified:           23
needs_review:       33
orphan:             0
```

- `orphan: 14 → 0` ✅
- `display_seed: 14`（B4 追加分が valid seed として明示）✅
- `display_total: 99 / display_translated: 52 / display_missing: 47` は新規情報として追加 ✅

---

## 6. スクリプト実行方法の変更

### 変更理由

`@/lib/store-utils` を import するため、tsconfig-paths が必要になる。

### 変更前（暗黙の実行方法）

```bash
npx ts-node scripts/check-translation-coverage.ts
```

### 変更後

```bash
npx ts-node -r tsconfig-paths/register --transpile-only \
  --compiler-options '{"module":"CommonJS","moduleResolution":"node","target":"ES2022"}' \
  scripts/check-translation-coverage.ts
```

このパターンは `package.json` の `audit:canonical` で既に使用されており、プロジェクトの標準パターン。

### package.json への追加（convenience）

```json
"coverage": "ts-node -r tsconfig-paths/register --transpile-only --compiler-options '{\"module\":\"CommonJS\",\"moduleResolution\":\"node\",\"target\":\"ES2022\"}' scripts/check-translation-coverage.ts"
```

`npm run coverage` で実行可能になる。

---

## 7. 変更ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `scripts/check-translation-coverage.ts` | 2件 import 追加 / 型追加 / 関数追加 3件 / main 処理 2行変更 |
| `package.json` | `"coverage"` スクリプト 1件追加 |

**変更しないファイル:**
- `data/translations/store-names.json`
- `data/translations/food-names.json`
- `scripts/output/shops.generated.json`
- `scripts/output/foods.generated.json`
- `lib/store-utils.ts`
- components / app / DB / crawler

---

## 8. Stop and Ask 条件（調査結果）

| 条件 | 判定 |
|---|---|
| buildStoresFromFoods を script から安全に import できない | ✅ 安全（既存パターンで実証済み） |
| DB / 外部通信が必要 | ✅ 不要（foods.generated.json から読む） |
| generated JSON の変更が必要 | ✅ 不要 |
| store-utils.ts の変更が必要 | ✅ 不要（import のみ） |
| coverage の定義が壊れる | ✅ Food Coverage は変更なし / Store Coverage は既存 `total/translated/missing/orphan` の意味を保ちつつ新規フィールド追加 |

**Stop and Ask 条件は全て「問題なし」。Codex に投げてよい。**

---

## 9. 禁止事項

- `data/translations/store-names.json` 変更禁止
- `data/translations/food-names.json` 変更禁止
- `scripts/output/` 配下の generated JSON 変更禁止
- `lib/store-utils.ts` 変更禁止（import のみ）
- DB / crawler 実行禁止
- UIコード変更禁止
- `git add .` 禁止（変更ファイルを個別 add）
