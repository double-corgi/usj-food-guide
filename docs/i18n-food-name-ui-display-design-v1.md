# B8 商品名翻訳 UI反映 設計書

## 目的

B6 / B7 で `data/translations/food-names.json` に追加した商品名翻訳 seed を、実際の UI 表示へ反映する。

今回の対象は **商品名の表示のみ** とする。商品 ID、URL、検索・フィルター、generated JSON、DB、crawler、翻訳 seed の内容は変更しない。

## 前提

- `data/translations/food-names.json` は 75 エントリ。
- coverage 上の Food translated は 77。
- `getFoodNameI18n(foodId, locale, fallback)` は `lib/i18n/name-translations.ts` に実装済み。
- `locale === "ja"` の場合、`getFoodNameI18n` は必ず fallback を返す。
- 翻訳がない `food.id` は、全ロケールで fallback の日本語商品名を返す。
- 店舗名翻訳の UI 反映は B3 で対応済み。

## 絶対に変更しないもの

- `data/translations/food-names.json`
- `data/translations/store-names.json`
- `scripts/output/foods.generated.json`
- `scripts/output/shops.generated.json`
- generated JSON
- DB / crawler
- URL 構造
- `food.id`
- `lib/i18n/name-translations.ts`
- `scripts/check-translation-coverage.ts`
- 価格・エリア・店舗名・カテゴリ翻訳
- 食べたページの 5 列サムネイル仕様
- 最近食べたものセクション
- タブ

## 現状調査

### 既存 helper

`lib/i18n/name-translations.ts`:

```ts
export function getFoodNameI18n(foodId: string, locale: Locale, fallback: string): string {
  return getTranslatedName(foodNames, foodId, locale, fallback);
}
```

この helper をそのまま使用する。新しい辞書キーは追加しない。

### 商品名を直接表示している主な箇所

#### `/foods` 一覧

`components/food-card.tsx`

- `data-food-name={food.name}`
- カード内の商品名: `{food.name}`
- `FoodImage` は alt 未指定のため `food.name` を内部 fallback として使用

対応方針:

- 表示用に `const displayName = getFoodNameI18n(food.id, locale, food.name)` を作る。
- カード内の商品名を `displayName` に変更する。
- `FoodImage` には `alt={displayName}` を渡す。
- `data-food-name` は検索・テスト・既存 DOM 互換を考慮し、原則 `food.name` のまま維持する。

`components/food-grid.tsx`

- 検索候補の表示: `{food.name}`
- 検索候補の補足: `{getFoodAreaSummary(food)} / {food.shop.name}`
- 検索ロジック: `matchesFoodQuery` 内で `food.name` を使用
- ソート: `a.name.localeCompare(...)` を使用
- 自然言語 intent 判定で `food.name` を使用

対応方針:

- 検索候補の表示名のみ翻訳対応する。
- `FoodGrid` はすでに `useLocale()` を使っているため、`locale` を取得し、候補表示に `getFoodNameI18n(food.id, locale, food.name)` を使う。
- 検索・ソート・自然言語 intent 判定は変更しない。
- 理由: 翻訳表示と検索仕様を同時に変えると挙動差分が大きい。B8 は UI 表示反映のみ。

#### `/foods/[id]` 商品詳細

`components/food-detail.tsx`

- メイン画像 alt: `alt={food.name}`
- h1: `{food.name}`
- 関連商品レールの商品名: `{food.name}`
- 関連商品の並び順: `a.food.name.localeCompare(...)`
- 関連商品の URL: `/foods/${food.id}`

対応方針:

- `FoodDetail` 内で `const displayName = getFoodNameI18n(food.id, locale, food.name)` を作る。
- メイン画像 alt と h1 を `displayName` に変更する。
- `RelatedRail` 内でも商品名表示を翻訳対応する。
- `RelatedRail` は `locale` を受け取っているため、`getFoodNameI18n(food.id, locale, food.name)` を内部で使える。
- 関連商品の並び順は日本語名ベースのまま変更しない。
- URL は `/foods/${food.id}` のまま変更しない。

`app/foods/[id]/page.tsx`

- Server Component。
- `FoodDetail` に data を渡しているだけ。

対応方針:

- 原則変更しない。
- `useLocale()` は Server Component で使わない。

#### `/eaten` 食べたページ

`components/eaten-experience.tsx`

現在の表示:

- `NextWantCard` の商品名: `{food.name}`
- `NextWantCard` の `FoodImage` alt: `alt={food.name}`
- `EatenAlbumCard` の商品名: `{food.name}` ただし現行 UI では呼び出しなし
- `EatenAlbumCard` のユーザー写真 alt: `${food.name}の食べた写真`
- `CollectionThumb` の `aria-label={food.name}`
- `CollectionThumb` の `FoodImage` alt: `alt={food.name}`

対応方針:

- 食べた商品一覧の 5 列サムネイルには、商品名テキストを再表示しない。
- `CollectionThumb` の `aria-label` と `FoodImage alt` だけ翻訳対応する。
- `NextWantCard` は画面内で商品名を表示するため、商品名と alt を翻訳対応する。
- `EatenAlbumCard` は現在未使用だが、将来復活時の不整合を避けるため、関数内の表示名・alt も翻訳対応してよい。
- 5 列グリッド、タブなし、最近食べたものなしの仕様は維持する。

#### その他の関連表示

今回の正本で明示対象ではないが、商品名がユーザーに見える箇所として以下がある。

- `components/recommendation-rail.tsx`
- `components/store-food-list.tsx`
- `components/area-food-status-lists.tsx`
- `components/area-eaten-foods.tsx`
- `components/home-progress-client.tsx`

ただし B8 の確認対象は `/foods`, `/foods/[id]`, `/eaten` であり、範囲を広げると影響が大きい。

B8 では以下に限定する:

- `components/food-card.tsx`
- `components/food-grid.tsx`
- `components/food-detail.tsx`
- `components/eaten-experience.tsx`

ホーム、エリア詳細、店舗詳細内の商品名表示は、次フェーズで扱う。

## 検索・フィルターへの影響

B8 では検索・フィルターの判定ロジックは変更しない。

理由:

- 現在の検索は日本語商品名、店舗名、エリア名、説明文、カテゴリ、エイリアスを前提にしている。
- 翻訳名を検索 haystack に加えるには、locale に応じた query 正規化と翻訳名の保持方針を別途設計する必要がある。
- B8 は「翻訳 seed を UI 表示へ出す」ことが目的であり、検索仕様の拡張は別フェーズに分ける。

期待挙動:

- `ja`: 商品名は従来通り日本語表示。
- `en / ko / zh-TW`: 翻訳 seed がある商品だけ翻訳表示。
- 翻訳 seed がない商品は日本語 fallback。
- 検索は従来通り日本語・既存 alias ベース。

## 実装方針

### 1. import

対象 Client Component に以下を追加する。

```ts
import { getFoodNameI18n } from "@/lib/i18n/name-translations";
```

### 2. 表示名の生成

各 component 内で locale を取得済みの場合:

```ts
const displayName = getFoodNameI18n(food.id, locale, food.name);
```

`FoodGrid` は現在 `const { t } = useLocale();` のため、`const { t, locale } = useLocale();` にする。

`EatenExperience` は上位で `const { t } = useLocale();` だが、`NextWantCard`, `CollectionThumb`, `EatenAlbumCard` は個別 component なので、それぞれ必要最小限で `useLocale()` を呼ぶ。

### 3. `/foods` 一覧

`components/food-card.tsx`:

- カード表示の商品名を `displayName` にする。
- `FoodImage` alt を `displayName` にする。
- `data-food-name` は `food.name` のまま維持。

`components/food-grid.tsx`:

- 検索候補の表示名だけ `getFoodNameI18n` にする。
- 検索・sort・filter は変更しない。

### 4. `/foods/[id]` 商品詳細

`components/food-detail.tsx`:

- メイン画像 alt を `displayName` にする。
- h1 を `displayName` にする。
- `RelatedRail` の商品名表示を翻訳対応する。
- 関連商品の並び順は変更しない。

### 5. `/eaten`

`components/eaten-experience.tsx`:

- `CollectionThumb` の `aria-label` と `FoodImage alt` を翻訳対応する。
- `NextWantCard` の商品名表示と alt を翻訳対応する。
- `EatenAlbumCard` は未使用だが、関数内の商品名・alt を翻訳対応してよい。
- 一覧に商品名テキストを再表示しない。

## 変更候補ファイル

実装時の変更候補は以下のみ。

- `components/food-card.tsx`
- `components/food-grid.tsx`
- `components/food-detail.tsx`
- `components/eaten-experience.tsx`

原則として新規ファイルは作らない。

## 検証方針

### 必須コマンド

```bash
npm run lint
npm run typecheck
npm run build
npm run coverage
```

### coverage 期待値

B8 は表示反映のみなので、Food / Store Coverage は B7 後から変化しない。

Food Translation Coverage:

- total: 294
- translated: 77
- missing: 217
- verified: 6
- needs_review: 69
- orphan: 0

Store Translation Coverage:

- generated_total: 42
- translated: 42
- missing: 0
- display_total: 99
- display_translated: 52
- display_missing: 47
- display_seed: 14
- verified: 23
- needs_review: 33
- orphan: 0

### 表示確認

確認ページ:

- `/foods`
- `/foods/[id]`
- `/eaten`
- `/settings`

確認ロケール:

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

- `/foods` カード名が翻訳 seed のある商品だけ翻訳表示になる。
- `/foods/[id]` h1 が翻訳 seed のある商品だけ翻訳表示になる。
- `/foods/[id]` 関連商品名が翻訳 seed のある商品だけ翻訳表示になる。
- `/eaten` サムネイルの `aria-label` / alt が翻訳対応される。
- `/eaten` の 5 列サムネイル一覧に商品名テキストは表示されない。
- `ja` では従来通り日本語表示。
- 翻訳 seed がない商品は日本語 fallback。
- 商品 URL は `/foods/[food.id]` のまま。
- `food.id` は変更されない。
- `data/translations` は変更されない。
- generated JSON は変更されない。
- DB / crawler は触らない。

## Stop 条件

以下に該当する場合は実装を止める。

- `data/translations/food-names.json` の変更が必要に見える。
- `data/translations/store-names.json` の変更が必要に見える。
- generated JSON の変更が必要に見える。
- URL / `food.id` の変更が必要に見える。
- 検索ロジックの大規模変更が必要に見える。
- `/eaten` の 5 列サムネイル仕様に変更が必要に見える。
- タブまたは最近食べたものセクションを復活させる必要が出る。
- `npm run coverage` で Food / Store Coverage が変化する。
- lint / typecheck / build が失敗し、対象4ファイル以外の変更が必要に見える。

## レビュー観点

- 表示名だけが翻訳されているか。
- ja fallback が維持されているか。
- 未翻訳商品が日本語 fallback になっているか。
- URL / ID / generated JSON / seed JSON が不変か。
- 検索・フィルター・ソートの挙動を不用意に変えていないか。
- `/eaten` の図鑑棚 UI を崩していないか。
