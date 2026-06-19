# Codex Goal: B8 商品名翻訳 UI反映

## 目的

B6 / B7 で `data/translations/food-names.json` に追加した商品名翻訳 seed を、UI 表示へ反映してください。

今回は **商品名の UI 表示反映のみ** です。

## 正本

補助資料:

- `docs/i18n-food-name-ui-display-design-v1.md`

今回の実装では、この goal と上記設計書に従ってください。

## 前提

- B6 商品名翻訳 seed 初回35件は完了済み。
- B7 商品名翻訳 seed 第2弾40件は完了済み。
- `data/translations/food-names.json` は 75 エントリ。
- `npm run coverage` 上の Food translated は 77。
- `getFoodNameI18n(foodId, locale, fallback)` は `lib/i18n/name-translations.ts` に実装済み。
- 店舗名翻訳の UI 反映は B3 で対応済み。

## 今回の変更対象

原則、変更してよいファイルは以下のみです。

- `components/food-card.tsx`
- `components/food-grid.tsx`
- `components/food-detail.tsx`
- `components/eaten-experience.tsx`

必要がないファイルは触らないでください。

## 絶対禁止

- `git add .` 禁止
- `data/translations/food-names.json` 変更禁止
- `data/translations/store-names.json` 変更禁止
- `scripts/output/foods.generated.json` 変更禁止
- `scripts/output/shops.generated.json` 変更禁止
- generated JSON 変更禁止
- DB / crawler 実行禁止
- `lib/i18n/name-translations.ts` 変更禁止
- `scripts/check-translation-coverage.ts` 変更禁止
- `package.json` 変更禁止
- URL 構造変更禁止
- `food.id` 変更禁止
- 店舗名翻訳の追加変更禁止
- 価格・エリア・カテゴリ・店舗名の翻訳変更禁止
- 検索ロジックの大規模変更禁止
- `/eaten` の 5列サムネイル仕様変更禁止
- `/eaten` のタブ復活禁止
- `/eaten` の「最近食べたもの」セクション復活禁止
- 大規模リファクタ禁止
- 無関係な整形禁止

## 作業開始前

必ず確認してください。

```bash
git status --short
git status --short --branch
node -e "const f=require('./data/translations/food-names.json'); console.log(Object.keys(f).length)"
npm run coverage
```

期待:

- working tree が clean
- `food-names.json` の entries が 75
- coverage が B7 後の値と一致

## 実装内容

### 1. `components/food-card.tsx`

目的:

- `/foods` 一覧カードの商品名表示を翻訳対応する。

実装:

- `getFoodNameI18n` を import する。
- 既存の `useLocale()` から `locale` は取得済み。
- `FoodCard` 内で以下を作る。

```ts
const displayName = getFoodNameI18n(food.id, locale, food.name);
```

- カード内の商品名表示を `{displayName}` にする。
- `FoodImage` に `alt={displayName}` を渡す。
- `data-food-name={food.name}` は原則そのまま維持する。

禁止:

- 食べたボタンのロジック変更
- 価格表示変更
- エリア表示変更
- `data-food-name` を翻訳名に変えること

### 2. `components/food-grid.tsx`

目的:

- `/foods` 検索候補に出る商品名表示を翻訳対応する。

実装:

- `getFoodNameI18n` を import する。
- `const { t } = useLocale();` を `const { t, locale } = useLocale();` にする。
- 検索候補表示の `{food.name}` を `getFoodNameI18n(food.id, locale, food.name)` にする。

重要:

- `matchesFoodQuery` は変更しない。
- `sortFood` は変更しない。
- `matchesNaturalIntent` は変更しない。
- 検索 haystack に翻訳名を追加しない。

理由:

- B8 は UI 表示反映のみ。
- 検索仕様の拡張は別フェーズで扱う。

### 3. `components/food-detail.tsx`

目的:

- `/foods/[id]` のメイン商品名と関連商品名を翻訳対応する。

実装:

- `getFoodNameI18n` を import する。
- `FoodDetail` 内で以下を作る。

```ts
const displayName = getFoodNameI18n(food.id, locale, food.name);
```

- メイン画像 `FoodImage` の alt を `displayName` にする。
- h1 の `{food.name}` を `{displayName}` にする。
- `RelatedRail` 内の商品名表示を翻訳対応する。
- `RelatedRail` はすでに `locale` を props で受け取っているため、内部で `getFoodNameI18n(food.id, locale, food.name)` を使う。

禁止:

- `app/foods/[id]/page.tsx` 変更
- 関連商品の並び順変更
- URL 変更
- 価格・販売期間・販売状態の変更

### 4. `components/eaten-experience.tsx`

目的:

- `/eaten` のサムネイル accessibility 表示と、表示中の商品名を翻訳対応する。

実装:

- `getFoodNameI18n` を import する。
- `CollectionThumb` で `useLocale()` から `locale` を取得する。
- `CollectionThumb` 内で `displayName` を作る。
- `aria-label={displayName}` にする。
- `FoodImage` の alt を `displayName` にする。
- `NextWantCard` の商品名表示と alt を翻訳対応する。
- `EatenAlbumCard` は現在未使用でも、関数内の商品名表示と alt を翻訳対応してよい。

禁止:

- 食べたページの 5列グリッド変更
- 商品名テキストを 5列サムネイル一覧へ再表示すること
- タブ復活
- 最近食べたものセクション復活
- 食べたログ保存ロジック変更

## 表示仕様

- `ja`: 全商品名は従来通り日本語表示。
- `en`: 翻訳 seed がある商品だけ英語表示。未翻訳商品は日本語 fallback。
- `ko`: 翻訳 seed がある商品だけ韓国語表示。未翻訳商品は日本語 fallback。
- `zh-TW`: 翻訳 seed がある商品だけ繁体字表示。未翻訳商品は日本語 fallback。
- URL は常に `/foods/[food.id]`。
- `food.id` は変更しない。

## 検証

必ず実行してください。

```bash
npm run lint
npm run typecheck
npm run build
npm run coverage
```

## coverage 期待値

B8 は UI 表示反映のみなので、Food / Store Coverage は変化しないこと。

Food Translation Coverage:

```text
total:        294
translated:   77
missing:      217
verified:     6
needs_review: 69
orphan:       0
```

Store Translation Coverage:

```text
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

## grep / diff 確認

実装後に確認してください。

```bash
git diff --stat
git diff -- components/food-card.tsx components/food-grid.tsx components/food-detail.tsx components/eaten-experience.tsx
git diff --stat -- "data/translations/**" "scripts/output/**" "lib/i18n/name-translations.ts" "scripts/check-translation-coverage.ts" "package.json"
grep -rn "getFoodNameI18n" components/food-card.tsx components/food-grid.tsx components/food-detail.tsx components/eaten-experience.tsx
```

期待:

- 差分は対象 component のみ。
- `data/translations/**` に差分なし。
- `scripts/output/**` に差分なし。
- `lib/i18n/name-translations.ts` に差分なし。
- `scripts/check-translation-coverage.ts` に差分なし。
- `package.json` に差分なし。

## 表示確認

確認ページ:

- `/foods`
- `/foods/[id]`
- `/eaten`
- `/settings`

確認言語:

- `ja`
- `en`
- `ko`
- `zh-TW`

確認幅:

- 390
- 430
- 768
- 1280
- 1920

確認項目:

- `/foods` カード名が翻訳 seed のある商品だけ翻訳表示される。
- `/foods/[id]` h1 が翻訳 seed のある商品だけ翻訳表示される。
- `/foods/[id]` 関連商品名が翻訳 seed のある商品だけ翻訳表示される。
- `/eaten` の `CollectionThumb` の `aria-label` / alt が翻訳対応される。
- `/eaten` の 5列サムネイル一覧に商品名テキストが再表示されていない。
- `ja` は従来通り日本語表示。
- 翻訳 seed がない商品は日本語 fallback。
- 商品 URL は `/foods/[food.id]` のまま。
- `food.id` は変更されていない。
- 検索・フィルター・ソートが大きく変わっていない。
- タブが復活していない。
- 最近食べたものセクションが復活していない。
- overflow 0。
- clipped 0。
- 横スクロールなし。

## Stop 条件

以下に該当した場合は作業を止めて報告してください。

- `data/translations/food-names.json` の変更が必要に見える。
- `data/translations/store-names.json` の変更が必要に見える。
- generated JSON の変更が必要に見える。
- `food.id` / URL の変更が必要に見える。
- `lib/i18n/name-translations.ts` の変更が必要に見える。
- `scripts/check-translation-coverage.ts` の変更が必要に見える。
- `app/foods/[id]/page.tsx` の変更が必要に見える。
- 検索ロジックの大規模変更が必要に見える。
- `/eaten` の 5列サムネイル仕様に影響が出る。
- `/eaten` のタブまたは最近食べたものセクションを戻す必要が出る。
- `npm run coverage` で Food / Store Coverage が変化する。
- `npm run lint` が失敗する。
- `npm run typecheck` が失敗する。
- `npm run build` が失敗する。

## Git

作業完了後、変更したファイルだけを個別に stage してください。

例:

```bash
git add components/food-card.tsx
git add components/food-grid.tsx
git add components/food-detail.tsx
git add components/eaten-experience.tsx
```

`git add .` は禁止です。

staged 確認:

```bash
git diff --cached --name-only
git diff --cached --stat
```

staged が対象 component のみであることを確認してください。

commit:

```bash
git commit -m "feat(i18n): display translated food names in UI"
git push
```

最後に確認:

```bash
git status --short
git status --short --branch
git log -3 --oneline
git rev-parse HEAD
```

## 完了報告に含めること

- commit hash
- push 成功確認
- 変更ファイル一覧
- `/foods` カード名の翻訳対応内容
- `/foods/[id]` h1 の翻訳対応内容
- `/foods/[id]` 関連商品名の翻訳対応内容
- `/eaten` aria-label / alt の翻訳対応内容
- `/eaten` に商品名テキストを再表示していない確認
- `ja` で日本語表示が維持されている確認
- `en / ko / zh-TW` で seed あり商品の翻訳表示確認
- seed なし商品の日本語 fallback 確認
- URL / `food.id` 未変更確認
- 検索・フィルター・ソートを大きく変えていない確認
- `npm run lint` 結果
- `npm run typecheck` 結果
- `npm run build` 結果
- `npm run coverage` 全出力
- Food / Store Coverage が変化していない確認
- `data/translations` 未変更確認
- generated JSON / DB / crawler 未変更確認
- git status clean
- main / origin/main 同期済み
