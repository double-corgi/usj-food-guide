# Codex Goal: i18n 商品名・店舗名多言語化 土台構築（B1 + B7）

## 目的

商品名・店舗名多言語化の**土台だけ**を作る。

- 翻訳データファイルの器（空オブジェクト）を作成する
- fallback helper 関数を作成する
- 翻訳カバレッジ監査スクリプトを作成する

**表示は何も変わらないのが正しい。** UIへの反映は別フェーズで行う。

---

## 作業開始前

```bash
git status
```

未コミット変更がある場合:
```bash
git add .
git commit -m "backup-before-i18n-name-translation-foundation"
git push
```

未コミット変更がない場合:
```bash
git commit --allow-empty -m "backup-before-i18n-name-translation-foundation"
git push
```

---

## 実装対象ファイル

| ファイル | 操作 |
|---|---|
| `data/translations/food-names.json` | **新規作成** |
| `data/translations/store-names.json` | **新規作成** |
| `lib/i18n/name-translations.ts` | **新規作成** |
| `scripts/check-translation-coverage.ts` | **新規作成** |
| `tsconfig.json` | `@/data` パスエイリアスがなければ **最小限追加**（不要なら変更しない） |

---

## 実装内容

### 1. `data/translations/food-names.json`

```json
{}
```

- 初期値は空オブジェクトのみ
- 商品翻訳 seed はまだ入れない
- `scripts/output/` とは別ディレクトリに配置すること（`data/translations/` は手動管理ディレクトリ）

---

### 2. `data/translations/store-names.json`

```json
{}
```

- 初期値は空オブジェクトのみ
- 店舗翻訳 seed はまだ入れない

---

### 3. `lib/i18n/name-translations.ts`

以下の仕様を満たすヘルパーを作成する。

#### 型定義

```ts
import type { Locale } from "@/lib/i18n/locales";

type NameEntry = Partial<Record<Exclude<Locale, "ja">, string>>;
```

`Locale` 型は既存の `lib/i18n/locales.ts`（または `lib/i18n/dictionaries.ts`）から import する。実際のパスを確認してから import すること。

#### JSON import

```ts
import foodNamesRaw from "@/data/translations/food-names.json";
import storeNamesRaw from "@/data/translations/store-names.json";

const foodNames = foodNamesRaw as Record<string, NameEntry>;
const storeNames = storeNamesRaw as Record<string, NameEntry>;
```

`@/data` パスエイリアスが `tsconfig.json` に設定されていない場合は、`tsconfig.json` の `compilerOptions.paths` に追加する（`"@/data/*": ["./data/*"]` のパターン）。ただし、不要であれば変更しない。

#### export する関数

```ts
export function getFoodNameI18n(
  foodId: string,
  locale: Locale,
  fallback: string
): string {
  if (locale === "ja") return fallback;
  return (foodNames[foodId] as NameEntry | undefined)?.[locale] ?? fallback;
}

export function getShopNameI18n(
  shopId: string,
  locale: Locale,
  fallback: string
): string {
  if (locale === "ja") return fallback;
  return (storeNames[shopId] as NameEntry | undefined)?.[locale] ?? fallback;
}
```

**Fallback 保証（必須）:**
- `locale === "ja"` → 必ず `fallback` を返す
- エントリが存在しない → 必ず `fallback` を返す
- エントリはあるが対象 locale のキーがない → 必ず `fallback` を返す

---

### 4. `scripts/check-translation-coverage.ts`

**読み取り専用。JSONを書き換えない。**

以下の仕様を満たすスクリプトを作成する。

#### 入力ファイル（読み取りのみ）

- `scripts/output/foods.generated.json`
- `scripts/output/shops.generated.json`
- `data/translations/food-names.json`
- `data/translations/store-names.json`

#### 出力フォーマット（標準出力）

```
=== Food Translation Coverage ===
total:        294
translated:   0
missing:      294
verified:     0
needs_review: 0
orphan:       0

=== Store Translation Coverage ===
total:        42
translated:   0
missing:      42
verified:     0
needs_review: 0
orphan:       0
```

#### 各カウントの定義

| カウント | 定義 |
|---|---|
| `total` | generated JSON 側の総件数 |
| `translated` | 翻訳JSON側にエントリがある件数（en/ko/zh-TW のいずれかが存在すれば対象）|
| `missing` | generated JSON側にあるが翻訳JSON側にエントリが存在しないID |
| `verified` | 翻訳JSON側で `_status === "verified"` の件数 |
| `needs_review` | 翻訳JSON側で `_status === "needs_review"` の件数 |
| `orphan` | 翻訳JSON側にあるが generated JSON 側に存在しないID（廃番等）|

#### generated JSON の food.id / shop.id の取得

`foods.generated.json` の各要素から `id` フィールドを読む（`food-XXXXXXX` 形式）。
`shops.generated.json` の各要素から `id` フィールドを読む（`shop-XXXXXXX` 形式）。

#### 実装例（ts-node / tsx で実行できること）

```ts
import * as fs from "fs";
import * as path from "path";

const foods = JSON.parse(
  fs.readFileSync(path.resolve("scripts/output/foods.generated.json"), "utf-8")
) as Array<{ id: string }>;

// ... 以降同様に shops / food-names / store-names を読み取り、集計して出力
```

`tsconfig.json` の `moduleResolution` / `esModuleInterop` 設定に合わせて import 方式を調整すること。

---

## 禁止事項

- 商品名翻訳 seed を追加しない（`food-names.json` は `{}` のまま）
- 店舗名翻訳 seed を追加しない（`store-names.json` は `{}` のまま）
- 機械翻訳を入れない
- `scripts/output/foods.generated.json` を変更しない
- `scripts/output/shops.generated.json` を変更しない
- その他 `scripts/output/` 配下のファイルを変更しない
- DB / crawler を変更しない
- URL 構造を変更しない
- localStorage schema を変更しない
- `food.id` / `shop.id` を変更しない
- `types/domain.ts` を変更しない
- `lib/food-utils.ts` を変更しない
- `lib/store-utils.ts` を変更しない
- `lib/constants.ts` を変更しない
- `lib/i18n/dictionaries.ts` に商品名・店舗名を追加しない
- `lib/i18n/area-name.ts` を変更しない
- 既存 UI コンポーネントへの反映をしない（`/foods` `/stores` `/areas` `/eaten` の表示を変更しない）
- `home-dashboard.tsx` を変更しない
- `home-progress-client.tsx` を変更しない
- `food-card.tsx` を変更しない
- `food-detail.tsx` を変更しない
- 大規模リファクタ禁止
- 無関係なファイルの整形禁止

---

## 検証

### ビルド確認

```bash
npm run lint
npm run typecheck
npm run build
```

すべて成功すること。

### helper 動作確認

以下の4件の fallback 動作を確認すること（実際にコードを実行するか、typecheck で型が通ることを確認）:

| 呼び出し | 期待値 |
|---|---|
| `getFoodNameI18n("missing-id", "en", "テスト商品")` | `"テスト商品"` |
| `getFoodNameI18n("missing-id", "ja", "テスト商品")` | `"テスト商品"` |
| `getShopNameI18n("missing-id", "en", "テスト店舗")` | `"テスト店舗"` |
| `getShopNameI18n("missing-id", "ja", "テスト店舗")` | `"テスト店舗"` |

### カバレッジスクリプト確認

```bash
npx tsx scripts/check-translation-coverage.ts
```

または

```bash
npx ts-node scripts/check-translation-coverage.ts
```

実行環境がない場合（tsx / ts-node が入っていない場合）は、実行方法を報告するだけでよい。実行できた場合は出力結果を貼り付けること。

初期状態（翻訳JSON が `{}` のため）は以下が正しい出力:

```
total: 294, translated: 0, missing: 294, orphan: 0
total: 42,  translated: 0, missing: 42,  orphan: 0
```

### 表示確認（確認するが変更しない）

以下のページで表示が変わっていないことを確認する:

| ページ | 確認項目 |
|---|---|
| `/` | 商品名・店舗名が日本語のまま |
| `/foods` | 商品名・店舗名が日本語のまま |
| `/stores` | 店舗名が日本語のまま |
| `/settings` | 表示崩れなし |

### 既存機能保護確認

| 確認項目 | 確認方法 |
|---|---|
| i18n Phase B（エリア名・カテゴリ名）が壊れていない | `/foods`・`/areas` 確認 |
| i18n Phase C（フードカード価格）が壊れていない | `/foods` 確認 |
| Home Phase D（ホーム固定ラベル）が壊れていない | `/` 確認 |
| Home Phase C+（ホーム価格・販売ラベル）が壊れていない | `/` 確認 |
| 店舗ID衝突修正 v1.1 が壊れていない | `lib/store-utils.ts` 未変更確認 |
| generated JSON 未変更 | `scripts/output/` ファイルの変更なし確認 |
| overflow 0 / clipped 0 / 横スクロールなし | 各ページ目視確認 |

---

## 作業完了後

```bash
git add .
git commit -m "implement-i18n-name-translation-foundation"
git push
```

---

## Codex CLI 確認画面が出た場合

必ず **「Yes, and don't ask again」** を選択すること。

確認質問禁止。途中停止禁止。

---

## 完了報告に含めること

1. 作成したファイル一覧（パス）
2. `tsconfig.json` を変更したか / しなかったか（変更した場合は差分）
3. `npm run lint` / `typecheck` / `build` の結果
4. fallback 動作確認の結果（4件）
5. `check-translation-coverage.ts` の実行結果または実行方法
6. 各確認ページの表示変化なし確認
7. commit hash
