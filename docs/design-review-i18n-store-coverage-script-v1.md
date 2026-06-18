# Design Review: coverage script 拡張（B5）

**対象 commit:** dd9bc83b4a7bf10807bb634ae98f06e1f066e7fa (extend i18n store coverage script)  
**レビュー日:** 2026-06-18  
**レビュー担当:** Claude（設計担当 / レビュー担当）

---

## 判定: 承認

---

## 1. スコープ遵守

| 確認項目 | 結果 |
|---|---|
| 変更ファイルが `scripts/check-translation-coverage.ts` と `package.json` のみ | ✅ `git show dd9bc83 --name-only` で 2件のみ確認 |
| `data/translations/store-names.json` 変更なし | ✅ |
| `data/translations/food-names.json` 変更なし | ✅ |
| `scripts/output/` 変更なし | ✅ |
| `lib/store-utils.ts` 変更なし（import のみ） | ✅ diff 冒頭 2行が import 追加のみ |
| components / app / UIコード 変更なし | ✅ |
| git status: clean | ✅ |

---

## 2. coverage 定義の正確性

### `countStoreCoverage` の各メトリクス

| メトリクス | 算出ロジック | 設計書との一致 |
|---|---|---|
| `generated_total` | `generatedIds.length`（shops.generated.json 由来 42件） | ✅ |
| `translated` | generatedIds のうち `hasAnyTranslation(translations[id])` が true の件数 | ✅ |
| `missing` | generatedIds のうち hasAnyTranslation が false の件数 | ✅ |
| `display_total` | `displayStores.length`（buildStoresFromFoods の出力数） | ✅ |
| `display_translated` | `[store.id, ...store.aliases].some(k => hasAnyTranslation(translations[k]))` が true の store 数 | ✅ |
| `display_missing` | 上記が false の store 数 | ✅ |
| `display_seed` | translation keys で `!generatedIdSet.has(id) && displayKeys.has(id)` | ✅ |
| `orphan` | translation keys で `!generatedIdSet.has(id) && !displayKeys.has(id)` | ✅ |
| `verified` / `needs_review` | 全 translation keys の `_status` 集計（generated 有無に依存しない） | ✅ |

### display_translated ロジックの詳細確認

```ts
displayStores.forEach((store) => {
  const hasTranslation = [store.id, ...store.aliases].some((key) => hasAnyTranslation(translations[key]));
  ...
});
```

`[store.id, ...store.aliases]` の走査順は B3 実装の `getStoreNameTranslationId` と完全一致。coverage script の「翻訳ありと見なす」基準が実際の翻訳表示ロジックと同一の判定基準になっている。✅

### orphan / display_seed の分類ロジック

```ts
if (!generatedIdSet.has(id)) {
  if (displayKeys.has(id)) display_seed += 1;
  else orphan += 1;
}
```

generatedIdSet に存在するキーは `display_seed` にも `orphan` にも加算されない（generated seed として正常扱い）。B4 追加 14件は `!generatedIdSet.has(id)` かつ `displayKeys.has(id)` → 全件 `display_seed` に分類される。✅

---

## 3. B4との整合

| 確認項目 | 結果 |
|---|---|
| B4 追加 14件が `orphan` ではなく `display_seed` として分類されている | ✅ 出力 `display_seed: 14` で確認 |
| `orphan: 14 → 0` | ✅ `npm run coverage` で確認 |
| `display_translated: 52` が B4 前の診断結果（Translated 38 → +14 = 52）と一致 | ✅ |
| `display_missing: 47` が B4 前の診断結果（Fallback 61 → -14 = 47）と一致 | ✅ |

alias キー 7件（`shop-ホッグズ-ヘッド-パブ` 等）は `displayKeys` の aliases 側に存在するため `displayKeys.has(id)` = true → `display_seed`。display ID 直接キー 7件（`shop-restaurant-7uhqb` 等）は `displayKeys` の store.id 側に存在するため同様。両グループ合計 14件が `display_seed: 14` として正しく集計されている。✅

---

## 4. 既存機能保護

### Food Translation Coverage（変化なし）

```
total:        294  ✅
translated:   0    ✅
missing:      294  ✅
verified:     0    ✅
needs_review: 0    ✅
orphan:       0    ✅
```

`countCoverage`（food 用）は完全に未変更。`printCoverage` も未変更。food section が store 拡張の影響を受けていない。✅

### Store generated 側メトリクス（変化なし）

```
generated_total: 42  ✅ (旧 total: 42 と同値)
translated:      42  ✅ (旧 translated: 42 と同値)
missing:         0   ✅ (旧 missing: 0 と同値)
```

generated 側の意味・数値とも B4 以前から変化なし。✅

### 品質保証

| 確認項目 | 結果 |
|---|---|
| `npm run lint` | ✅ OK |
| `npm run typecheck` | ✅ OK（並列実行の .next/types タイミング問題は B5 コードに起因しない一時的エラー） |
| `npm run build` | ✅ OK |
| `npm run coverage` | ✅ 期待出力と完全一致（レビュー時に直接実行で確認） |

---

## 5. package.json

```json
"coverage": "ts-node -r tsconfig-paths/register --transpile-only --compiler-options '{\"module\":\"CommonJS\",\"moduleResolution\":\"node\",\"target\":\"ES2022\"}' scripts/check-translation-coverage.ts"
```

| 確認項目 | 結果 |
|---|---|
| 既存スクリプトを上書き・破壊していない（+1 行追加のみ） | ✅ |
| `-r tsconfig-paths/register` 指定あり（`@/lib` import に必要） | ✅ |
| `--transpile-only` + `--compiler-options` のパターンが `audit:canonical` 等と同一 | ✅ |
| `npm run coverage` の実行結果が正常 | ✅ |

---

## 6. 設計書との差分（軽微）

### [低・改善] `buildDisplayStoreInfo` の型キャスト

**設計書:** `as { foods: FoodWithRelations[] }`（required）  
**実装:** `as { foods?: FoodWithRelations[] }`（optional）

`foods` キーが欠落していた場合に `[]` にフォールバックする防御的コード。設計書より堅牢。問題なし。✅

---

## 7. 既存コードへの注記（B5 非起因・参考情報）

`countCoverage`（食品用、B5 で変更なし）の L100〜L104 に dead code が存在する:

```ts
Object.entries(translations).forEach(([id, entry]) => {
  if (entry._status === "verified") verified += 1;
  if (entry._status === "needs_review") needs_review += 1;
  if (!generatedIdSet.has(id)) return;  // ← loop body はここで終わり、return は無効
});
```

この `return` は loop body の最後に位置しており、`forEach` コールバック的には early exit として機能するが、その後に実行されるコードが存在しないため dead code。B5 以前から存在するコードであり、今回のレビュー対象外・非ブロッキング。

---

## 8. 総評

設計書の仕様を正確に実装しており、`buildStoresFromFoods` の import から `countStoreCoverage` の新メトリクス算出まで全て設計書通り。`display_translated` の算出ロジックが実際の B3 翻訳表示ロジック（`getStoreNameTranslationId`）と同一の走査順を採用しており、coverage script と実表示の整合性が取れている。Food Coverage への影響なし。lint / typecheck / build / `npm run coverage` 全通過。

---

## 証跡

- `git show dd9bc83 --name-only`: 2件変更（package.json / scripts/check-translation-coverage.ts）
- `scripts/check-translation-coverage.ts` 全行目視確認
- `npm run coverage` をレビュー時に直接実行・出力確認
- 実装 commit: `dd9bc83b4a7bf10807bb634ae98f06e1f066e7fa`
