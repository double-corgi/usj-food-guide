# Goal: coverage script 拡張（B5）

## あなたの役割

あなたは実装担当です。設計に従って `scripts/check-translation-coverage.ts` と `package.json` のみを編集してください。

**禁止:**
- `data/translations/store-names.json` 変更禁止
- `data/translations/food-names.json` 変更禁止
- `scripts/output/` 配下の generated JSON 変更禁止
- `lib/store-utils.ts` 変更禁止（import のみ許可）
- DB / crawler 実行禁止
- components / app / lib 変更禁止（store-name-client.tsx 等に触れない）
- `git add .` 禁止

---

## 背景

B4「fallback 店舗 seed 追加」で `data/translations/store-names.json` に 14件の display ID / legacy alias 用 seed を追加した。その結果、`check-translation-coverage.ts` が `orphan: 14` を出力するようになった。

これは coverage script が `scripts/output/shops.generated.json` の 42件 ID のみを参照しており、`buildStoresFromFoods` が動的生成する display ID / aliases を認識していないことが原因。

B5 では coverage script を拡張し、`buildStoresFromFoods` の出力 ID も valid key として扱うことで `orphan: 0` を実現する。

---

## Step 0: 作業開始前の確認

```bash
git status
```

`scripts/check-translation-coverage.ts` が変更されていないことを確認する。

---

## Step 1: scripts/check-translation-coverage.ts を変更する

### 1-1. ファイルの先頭 import に追加する

以下の 2行を既存の `import * as fs` / `import * as path` の後に追加する:

```ts
import { buildStoresFromFoods } from "@/lib/store-utils";
import type { FoodWithRelations } from "@/types/domain";
```

### 1-2. 型定義を追加する

既存の `type Coverage = { ... }` の直後（同じファイル内）に以下を追加する:

```ts
type StoreCoverageExtended = {
  generated_total: number;
  translated: number;
  missing: number;
  display_total: number;
  display_translated: number;
  display_missing: number;
  display_seed: number;
  verified: number;
  needs_review: number;
  orphan: number;
};
```

### 1-3. `buildDisplayStoreInfo` 関数を追加する

既存のヘルパー関数群（`isRecord`, `hasAnyTranslation` 等）の後ろに追加する:

```ts
function buildDisplayStoreInfo() {
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

### 1-4. `countStoreCoverage` 関数を追加する

```ts
function countStoreCoverage(
  generatedIds: string[],
  translations: Record<string, TranslationEntry>,
  displayInfo: ReturnType<typeof buildDisplayStoreInfo>
): StoreCoverageExtended {
  const generatedIdSet = new Set(generatedIds);
  const { keys: displayKeys, stores: displayStores } = displayInfo;
  const translationKeys = Object.keys(translations);

  let translated = 0;
  let missing = 0;
  generatedIds.forEach((id) => {
    if (hasAnyTranslation(translations[id])) translated += 1;
    else missing += 1;
  });

  const display_total = displayStores.length;
  let display_translated = 0;
  let display_missing = 0;
  displayStores.forEach((store) => {
    const hasTranslation = [store.id, ...store.aliases].some((k) => hasAnyTranslation(translations[k]));
    if (hasTranslation) display_translated += 1;
    else display_missing += 1;
  });

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

### 1-5. `printStoreCoverage` 関数を追加する

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

### 1-6. メイン処理を変更する

ファイル末尾の実行部分を以下のように変更する:

**変更前:**
```ts
const foodIds = readGeneratedIds("scripts/output/foods.generated.json", "foods");
const shopIds = readGeneratedIds("scripts/output/shops.generated.json");
const foodTranslations = readTranslations("data/translations/food-names.json");
const storeTranslations = readTranslations("data/translations/store-names.json");

printCoverage("Food Translation Coverage", countCoverage(foodIds, foodTranslations));
printCoverage("Store Translation Coverage", countCoverage(shopIds, storeTranslations));
```

**変更後:**
```ts
const foodIds = readGeneratedIds("scripts/output/foods.generated.json", "foods");
const shopIds = readGeneratedIds("scripts/output/shops.generated.json");
const foodTranslations = readTranslations("data/translations/food-names.json");
const storeTranslations = readTranslations("data/translations/store-names.json");
const displayInfo = buildDisplayStoreInfo();

printCoverage("Food Translation Coverage", countCoverage(foodIds, foodTranslations));
printStoreCoverage("Store Translation Coverage", countStoreCoverage(shopIds, storeTranslations, displayInfo));
```

**注意:** 既存の `countCoverage` と `printCoverage` は変更しない。Food Coverage はこれらを引き続き使用する。

---

## Step 2: package.json に coverage スクリプトを追加する

`package.json` の `"scripts"` セクションに以下を追加する（既存の `"lint"` エントリの直後が推奨）:

```json
"coverage": "ts-node -r tsconfig-paths/register --transpile-only --compiler-options '{\"module\":\"CommonJS\",\"moduleResolution\":\"node\",\"target\":\"ES2022\"}' scripts/check-translation-coverage.ts",
```

このパターンは既存の `audit:canonical` スクリプトと同じ形式。

---

## Step 3: lint / typecheck を実行する

```bash
npm run lint && npm run typecheck
```

両方成功することを確認する。

---

## Step 4: coverage script を実行して結果を確認する

```bash
npx ts-node -r tsconfig-paths/register --transpile-only \
  --compiler-options '{"module":"CommonJS","moduleResolution":"node","target":"ES2022"}' \
  scripts/check-translation-coverage.ts
```

**期待する出力（Store セクション）:**

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

**合否判定:**

| 条件 | 合格 |
|---|---|
| `orphan: 0` になった | ✅ 必須 |
| `display_seed: 14` になった | ✅ 必須 |
| `display_translated: 52`（±2 以内） | ✅ 期待値 |
| `generated_total: 42` / `translated: 42` / `missing: 0` が変化していない | ✅ 必須 |
| Food Translation Coverage が変化していない | ✅ 必須 |

display_total / display_translated / display_missing は ts-node の実行環境差分により ±5 程度の誤差がありえる。`orphan: 0` と `display_seed: 14` が最重要。

**上記条件を満たさない場合は実装を止めて報告すること。**

---

## Step 5: build を実行する

```bash
npm run build
```

成功することを確認する。

---

## Step 6: package.json でも実行できることを確認する

```bash
npm run coverage
```

Step 4 と同じ出力が得られることを確認する。

---

## Step 7: git add（変更ファイルのみ）

```bash
git add scripts/check-translation-coverage.ts
git add package.json
```

`git add .` は禁止。他のファイルを add しないこと。

---

## Step 8: commit する

```bash
git commit -m "feat: extend coverage script to recognize display store IDs and aliases (B5)"
```

---

## 完了報告に含めること

1. `scripts/check-translation-coverage.ts` の変更概要（追加行数）
2. `package.json` の変更概要（追加 script 名）
3. coverage script の実行結果（全行）
4. lint / typecheck / build の結果
5. `orphan: 0` と `display_seed: 14` の確認

---

## Stop and Ask 条件

以下のいずれかに該当する場合は実装を止めて報告すること:

- `buildStoresFromFoods` の import でエラーが発生し、解決策が不明な場合
- `foods.generated.json` の読み込みで型エラーが発生し、単純な型キャストで解決できない場合
- `orphan` が 0 にならない場合（`display_seed` が 14 未満の場合）
- `countCoverage`（Food Coverage）の出力が変化した場合
- lint / typecheck / build が失敗し、Coverage 系コード以外の変更が必要になった場合
