# design-review-i18n-food-name-ui-display-v1.md

## 判定

承認

## レビュー対象

- 対象commit: `c8ae2b707665d0bffa7fe366197c002e561a9225`
- commit message: `feat: display translated food names in UI`
- 対象実装ファイル:
  - `components/food-card.tsx`
  - `components/food-grid.tsx`
  - `components/food-detail.tsx`
  - `components/eaten-experience.tsx`

## レビュー結果

B8「商品名翻訳 UI反映」は、正本 `docs/codex-goal-i18n-food-name-ui-display-v1.md` の範囲内で実装されています。

`getFoodNameI18n(food.id, locale, food.name)` を使い、`ja` では従来の日本語名、`en / ko / zh-TW` では翻訳 seed がある商品のみ翻訳名、未翻訳商品は日本語 fallback になる構成です。

## スコープ遵守

問題なし。

確認内容:

- `data/translations/food-names.json` は変更対象外のまま
- `data/translations/store-names.json` は変更対象外のまま
- `scripts/output` / generated JSON は変更対象外
- DB / crawler / package.json / coverage script は対象外
- URL構造と `food.id` は変更されていない
- 検索・フィルター・ソートの大規模変更なし

## 商品名翻訳の反映確認

### `/foods`

承認。

`components/food-card.tsx` で以下が確認できました。

- `getFoodNameI18n` を import
- `displayName = getFoodNameI18n(food.id, locale, food.name)` を作成
- カードの商品名表示を `displayName` に変更
- `FoodImage` の `alt` を `displayName` に変更
- `data-food-name={food.name}` は維持

`data-food-name` を翻訳名に変えていないため、既存のDOM属性・検索補助用途への副作用を避けられています。

### `/foods` 検索候補

承認。

`components/food-grid.tsx` で検索候補の商品名表示が `getFoodNameI18n` 経由になっています。

一方で、以下は維持されています。

- `matchesFoodQuery` は変更なし
- `sortFood` は変更なし
- 検索 haystack に翻訳名を追加していない

これは B8 の「UI表示反映のみ。検索仕様拡張は別フェーズ」という方針に合っています。

### `/foods/[id]`

承認。

`components/food-detail.tsx` で以下が確認できました。

- メイン h1 が `displayName`
- メイン画像 `alt` が `displayName`
- 関連商品レールの商品名が `displayName`
- 関連商品画像 `alt` が `displayName`

価格、販売状態、販売期間、関連商品の並び順、URLは変更されていません。

### `/eaten`

承認。

`components/eaten-experience.tsx` で以下が確認できました。

- `CollectionThumb` の `aria-label` が `displayName`
- `CollectionThumb` の `FoodImage alt` が `displayName`
- 5列サムネイル一覧に商品名テキストは再表示されていない
- `NextWantCard` の表示名と alt も翻訳対応
- 未使用の `EatenAlbumCard` も翻訳対応されているが、既存構造の範囲内

以下も維持されています。

- 5列グリッド: `grid grid-cols-5 gap-0.5 md:grid-cols-8 lg:grid-cols-10`
- タブ復活なし
- 最近食べたものセクション復活なし

## 既存機能保護

問題なし。

- 検索・フィルター・ソートの大規模変更なし
- 店舗名翻訳、価格、エリア表示への副作用なし
- `/eaten` の図鑑棚UI仕様は維持
- URLは `/foods/[food.id]` のまま

## 品質確認

Codex報告上、以下は成功済みです。

- `npm run lint`: 成功
- `npm run typecheck`: 成功
- `npm run build`: 成功
- `npm run coverage`: 成功

Coverage も期待値どおりです。

Food Translation Coverage:

- total: `294`
- translated: `77`
- missing: `217`
- verified: `6`
- needs_review: `69`
- orphan: `0`

Store Translation Coverage:

- generated_total: `42`
- translated: `42`
- missing: `0`
- display_total: `99`
- display_translated: `52`
- display_missing: `47`
- display_seed: `14`
- verified: `23`
- needs_review: `33`
- orphan: `0`

## 指摘事項

なし。

## 補足

B8では検索対象に翻訳名を追加していません。そのため、英語・韓国語・繁体字の商品名で検索できるようにする対応は、今回の範囲外として正しく未実装です。

## 最終判定

承認。
