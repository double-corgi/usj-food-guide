# i18n-phase2c-design-v1.md

## 0. 前提・確認済みドキュメント

以下を確認した上で本設計を作成した。

- `docs/i18n-design-v1.md`（i18nの基本方針: `useLocale`/`t()`/`localStorage`方式）
- `docs/i18n-coverage-review-v1.md`（翻訳漏れ監査。`/foods`, `/foods/[id]` は当時「未翻訳」と分類されていた領域）
- `docs/i18n-phase2-design-v1.md`（Phase2全体設計。2A/2B/2C/2Dの分割方針、`t()`への変数差し込み拡張の方針）
- `docs/design-review-i18n-phase2a.md`（承認。`area.*`/`store.*`/`collection.*` 追加、`I18nText`導入）
- `docs/design-review-i18n-phase2b.md`（条件付き承認。home/area-detailの固定文言を `t()`/`I18nText` で対応）
- `docs/design-review-i18n-phase2b-1.md`（承認。`t(key, params)` の `{{placeholder}}` 方式が確定運用、area-detail-v1.1の大きな数字表示を復元）
- `lib/i18n/dictionaries.ts`（ja/en/ko/zh-TW、`nav.*`/`footer.*`/`settings.*`/`common.*`/`area.*`/`store.*`/`collection.*`/`home.*`）
- `lib/i18n/use-locale.tsx`（`t(key: TranslationKey, params?: Record<string, string|number>): string`、`{{key}}`置換、3段fallback）
- `app/foods/page.tsx`（`FoodGrid` に `title="フードを探す"` を渡すサーバーコンポーネント）
- `app/foods/[id]/page.tsx`（`FoodDetail` をレンダリングするサーバーコンポーネント）
- `components/food-card.tsx`（`"食べた"`/`"食べた済み"`、バッジ「限定」「販売終了」「近日販売」、`"価格未確認"`）
- `components/food-grid.tsx`（`"use client"`。検索欄、カテゴリchip、フィルター/並び替えの`<select>`群、`TogglePill`、結果0件時の文言、CTA文言など、本Phaseで最も翻訳対象が多いファイル）
- `components/food-detail.tsx`（`"use client"`。一覧へ戻る、前/次、食べた/食べた済み、次回食べたい/保存済み、販売場所、確認情報`<details>`、関連商品、公式サイトを見る等）

`components/food-grid.tsx` は `/foods` と `/eaten`（`mode="eaten"`）の両方で使われている共有コンポーネントである点に注意（4章で詳述）。

---

## 1. Objective

Phase 2Cでは、`/foods` と `/foods/[id]` の**固定UI文言のみ**を多言語化する。

- 対象ページ: `/foods`, `/foods/[id]`
- 対象外ページ: `/`, `/areas/[id]`, `/eaten`, `/areas`, `/stores`, `/stores/[id]`
- 既存のi18n基盤（`useLocale`/`t()`/`dictionaries.ts`/`I18nText`、Phase2B.1で確定した `{{placeholder}}` による変数差し込み）を再利用し、新しい仕組みは作らない。
- 商品名・店舗名・エリア名・カテゴリ名・ジャンル名・商品説明・レビュー本文・価格・日付・generated JSON由来データ・イベント名（「25周年」等）は翻訳しない。

---

## 2. Translation Scope

### 2.1 翻訳する範囲（固定UI文言）

ユーザー指定の文言を、実装ファイル上の出現箇所に対応付けた。

#### `/foods`（`components/food-grid.tsx` が中心）

| ユーザー指定の文言 | 実装上の対応箇所 | 備考 |
| --- | --- | --- |
| フードを探す | `app/foods/page.tsx` の `title="フードを探す"`、`food-grid.tsx` の `{title ?? "フードを探す"}` | `/eaten` でも同コンポーネントが使われるが、`/eaten` 側は別の `title` が渡される想定（4.2参照）。 |
| 検索 | `food-grid.tsx` の検索input `placeholder="メニュー・店舗・エリアで検索"`、表示条件ボタン「表示条件」 | 「検索」という単独の文言は現状コード上に見当たらない。`nav.search`/`common.search`（既存キー、「探す」）と意味が近いが、placeholderの全文を翻訳対象とする。 |
| 販売中 | `TogglePill`「販売中」、`<select>`内 `option value="active"`「販売中」 | `common.saleActive`（既存・Phase1で追加、「販売中」）を再利用可能。 |
| 限定 | `food-card.tsx` バッジ「限定」、`food-grid.tsx` `<select>` `option value="limited"`「期間限定」、`TogglePill`「期間限定」 | 「限定」（food-card）と「期間限定」（grid）は別表記。`common.limited`（既存、「期間限定」）と完全一致するのは「期間限定」側のみ。「限定」は新規キー候補（3章）。 |
| 販売終了 | `food-card.tsx` バッジ「販売終了」、`<select>` `option value="ended"`「販売終了」、`food-detail.tsx` 「× 販売終了」 | `common.ended`（既存、「販売終了」）を再利用可能。`food-detail.tsx`の「× 販売終了」は記号付きのため別途検討（3章）。 |
| 価格 | `<select>` `option value="all"`「価格すべて」「価格確認済」「価格未確認」 | `common.price`（既存、「価格」）はラベル単体。フィルター文言は新規キー候補。 |
| エリア | `<select>` `option value="all"`「全エリア」 | `common.area`（既存、「エリア」）と完全一致しない。新規キー候補。 |
| 店舗 | `<select>` `option value="all"`「全店舗」 | `common.store`（既存、「店舗」）と完全一致しない。新規キー候補。 |
| すべて | `categoryChips` の `{ value: "all", label: "すべて", icon: "✨" }` | `common.viewAll`（既存、「すべて見る」）とは異なる。新規キー候補。 |
| 絞り込み | 「表示条件」ボタン（`SlidersHorizontal` アイコン + 「表示条件」） | ユーザー指定の「絞り込み」とコード上の「表示条件」は表記が異なる。実装上の文言は「表示条件」のため、これをベースに新規キーを作る（3章）。 |
| 並び替え | `<select>` の並び替えオプション群（「おすすめ順」など） | 並び替え`<select>`自体に見出しラベルはない。各オプション値の翻訳は3章で扱う。 |
| 食べた | `food-card.tsx` ボタン「食べた」/「食べた済み」、`TogglePill`「食べた」は見当たらず | `common.eaten`（既存、Phase2Aで`store-food-list.tsx`のaria-labelに利用済み、「食べた」）を再利用可能。 |
| 未食 | コード上に「未食」という文言は見当たらない（`mode="eaten"` はあるが表示ラベルなし） | Phase2Cで新規追加するか、対象外とするか要確認（6章 Stop and Ask）。 |
| 表示件数 | `{filteredFoods.length}品` / `図鑑 {canonicalFoods.length}品`、「さらに60件表示」 | 「表示件数」という見出し文言自体はコード上に存在しない。「さらに60件表示」が実質的な対応箇所。 |
| 条件をクリア | コード上に「条件をクリア」相当の機能・文言は見当たらない | 新規UIの追加が必要になるため、Phase2Cの「固定UI文言の翻訳」の範囲を超える可能性がある（6章 Stop and Ask）。 |
| 該当するフードがありません | `food-grid.tsx` の0件時表示「該当するメニューがありません」 + 「検索条件やチェック状態を変更してください。」 + 「情報提供」 | ユーザー指定文言と実装文言（「メニュー」vs「フード」）が異なる。実装文言ベースで新規キー化する。 |

#### `/foods/[id]`（`components/food-detail.tsx` が中心）

| ユーザー指定の文言 | 実装上の対応箇所 | 備考 |
| --- | --- | --- |
| 一覧へ戻る | `food-detail.tsx` `<Link href="/foods">` 「一覧へ戻る」 | `area.backToList`（既存、「エリア一覧へ戻る」）とは文言が異なる。新規キー候補。 |
| 図鑑コード | `getZukanCode(food, allFoods)` の結果を表示するバッジ（ラベルなし、コード値のみ表示） | 見出しラベル自体はコード上にない。値（例: `#001`等）はgenerated data由来のため翻訳対象外。Phase2Cでラベルを追加するかは6章で確認。 |
| 販売中 | `getSaleStatusLabel(food)` の戻り値、`food-card.tsx` と同様 | `lib/food-utils.ts` 側の実装。日本語ハードコードであれば`common.saleActive`等を再利用できるか確認が必要（6章）。 |
| 販売終了 | 同上 + 「× 販売終了」バッジ | 同上。 |
| 価格 | 「価格確認」「価格状態」（確認情報`<details>`内のラベル） | `common.price`（既存、「価格」）と完全一致しない。新規キー候補。 |
| 販売場所 | `food-detail.tsx` 見出し「販売場所」（`Store`アイコン付き） | `area.salesLocations`（既存、Phase2Aで追加、「販売場所」）と**完全一致**。再利用可能。 |
| エリア | `getSalesSummary` の `areaLabel`（「1エリア」「Nエリア」「エリア確認中」） | `common.area`（既存、「エリア」）とは完全一致しない。新規キー候補（変数差し込み）。 |
| 食べた | ボタン「食べた」/「食べた済み」 | `common.eaten`（既存）を再利用可能。 |
| 食べた記録に追加 | コード上に「食べた記録に追加」という文言は見当たらない（ボタンは「食べた」/「食べた済み」のみ） | ユーザー指定文言と実装文言が異なる。実装文言ベースで対応するか、新規ラベル追加が必要か6章で確認。 |
| 次回食べたい | ボタン「次回食べたい」/「保存済み」 | 新規キー候補。 |
| 販売情報 | コード上に「販売情報」という見出しは見当たらない（「どこで買える？」「販売場所」がある） | ユーザー指定文言と実装文言の対応関係を6章で確認。 |
| 確認情報 | `<details><summary>確認情報</summary>` + `<dl>`内の各ラベル（カテゴリ/形式/期間/現在コンプ対象/販売開始/販売終了/価格確認/価格状態/確認日） | 新規キー群が必要（3章）。 |
| 価格未確認 | `food-card.tsx` の `displayPrice()` 戻り値「価格未確認」、`food-detail.tsx` の「価格未確認。公式・現地情報の確認を推奨します。」、`<select>`の「価格未確認」 | 複数箇所で表記が異なる（短いラベル / 文章 / フィルター選択肢）。3章で個別キー化。 |
| エリア確認中 | `getDisplayLocationAreaName` 等が返す値（`food-grid.tsx`/`food-detail.tsx`双方から参照） | `lib/food-utils.ts` 内の関数戻り値。i18n対応するには関数自体への変更が必要になる可能性があり、6章で確認。 |
| 店舗確認中 | コード上に「店舗確認中」という文言は見当たらない（「店舗未確認」はある） | ユーザー指定文言と実装文言（「未確認」 vs 「確認中」）の表記揺れがある。6章で確認。 |

### 2.2 翻訳しない範囲

以下は**絶対に翻訳しない**。

- 商品名（`food.name`）
- 店舗名（`food.shop.name`, `location.shopName`）
- エリア名（`food.area.name`, `location.areaName`、ただし「エリア確認中」のような状態ラベルは2.1の対象）
- カテゴリ名・ジャンル名（`categoryLabels`、`categoryChips`の各ラベル「チュリトス」「ポップコーン」「ドリンク」等。Phase2Cでは**固定UIラベルのみ**を対象とし、商品カテゴリの名称そのものは対象外とする）
- 商品説明（`food.description`）
- レビュー本文（`FoodReviews`コンポーネント内のユーザー投稿テキスト）
- 画像内テキスト
- 価格そのもの（`￥2,600`等の数値・通貨表記）
- 日付フォーマット（`formatDateShort`/`formatDateLong`の出力。`Intl.DateTimeFormat("ja-JP", ...)`はja固定で、Phase2Cでは変更しない）
- generated JSON由来の商品データ全般
- 「25周年」などイベント名（`food.eventName`）

---

## 3. Candidate Keys

既存キーの再利用を優先し、完全一致しないものは新規キーを追加する。すべて4言語（ja/en/ko/zh-TW）に追加する。

### 3.1 既存キーの再利用

| 既存キー | ja値 | 再利用箇所 |
| --- | --- | --- |
| `common.saleActive` | 販売中 | `<select>` `option value="active"`、`TogglePill`「販売中」、`getSaleStatusLabel`の"active"相当（要確認） |
| `common.ended` | 販売終了 | `<select>` `option value="ended"`、`food-card.tsx`バッジ「販売終了」、`getSaleStatusLabel`の"ended"相当（要確認） |
| `common.limited` | 期間限定 | `<select>` `option value="limited"`、`TogglePill`「期間限定」 |
| `common.eaten` | 食べた | `food-card.tsx`/`food-detail.tsx` ボタン「食べた」（「食べた済み」は別途、3.2） |
| `area.salesLocations` | 販売場所 | `food-detail.tsx` 見出し「販売場所」 |
| `common.viewAll` | すべて見る | （直接の完全一致箇所は今回見当たらないが、`categoryChips`の「すべて」とは別物として扱う） |

### 3.2 新規キー（`foods.*` 名前空間）

| キー | ja値 | 用途 |
| --- | --- | --- |
| `foods.title` | フードを探す | `/foods`の見出し・既存ハードコードと同一文言（`common.home`等と同様、Phase1由来のフッターリンク「フードを探す」とは別の見出し用途として独立キー化） |
| `foods.subtitle` | 写真で選んで、残りを見つける。 | `/foods`見出し下の説明文 |
| `foods.searchPlaceholder` | メニュー・店舗・エリアで検索 | 検索inputの`placeholder` |
| `foods.filterToggle` | 表示条件 | フィルター開閉ボタン |
| `foods.categoryAll` | すべて | `categoryChips`の`value: "all"`ラベル |
| `foods.resultCount` | {{count}}品 | `{filteredFoods.length}品`（`{{count}}`差し込み） |
| `foods.catalogCount` | 図鑑 {{count}}品 | `図鑑 {canonicalFoods.length}品`（`{{count}}`差し込み） |
| `foods.loadMore` | さらに60件表示 | 「さらに60件表示」ボタン |
| `foods.noMatchTitle` | 該当するメニューがありません | 0件時の見出し |
| `foods.noMatchDescription` | 検索条件やチェック状態を変更してください。 | 0件時の説明文 |
| `foods.noResultsInline` | 該当なし | 検索サジェスト内「該当なし」 |
| `foods.requestCta` | 情報提供 | 「情報提供」ボタン（複数箇所で再利用） |
| `foods.requestSectionTitle` | 掲載してほしい商品を送る | CTAセクション見出し |
| `foods.requestSectionDescription` | 投稿内容は管理者確認後に必要に応じて反映します。 | CTAセクション説明文 |
| `foods.badgeLimited` | 限定 | `food-card.tsx`バッジ「限定」（`common.limited`の「期間限定」とは別表記のため独立キー） |
| `foods.badgeUpcoming` | 近日販売 | `food-card.tsx`/`food-detail.tsx`バッジ「近日販売」 |
| `foods.priceUnknown` | 価格未確認 | `food-card.tsx`の`displayPrice()`が返す短いラベル |
| `foods.priceUnknownNote` | 価格未確認。公式・現地情報の確認を推奨します。 | `food-detail.tsx`の注記文 |
| `foods.priceFilterKnown` | 価格確認済 | `<select>` `option value="known"` / `TogglePill` |
| `foods.priceFilterUnknown` | 価格未確認 | `<select>` `option value="unknown"` / `TogglePill`（`foods.priceUnknown`と同値だが用途が異なるため要否は6章で確認） |
| `foods.areaFilterAll` | 全エリア | `<select>` `option value="all"`（エリア） |
| `foods.shopFilterAll` | 全店舗 | `<select>` `option value="all"`（店舗） |

> 並び替え・フィルターの `<select>` 内オプション（「おすすめ順」「新しい順」「画像あり優先」「公開情報確認順」「残り優先」「カテゴリ順」「店舗順」「価格安い順」「価格高い順」「食べ歩き優先」、「全ジャンル」「全店舗種別」「食べ方すべて」「確認状況すべて」「終了間近」「常設」「近日販売」「販売期間確認中」「図鑑すべて」、`TogglePill`の「写真あり」「テイクアウト可」「店内飲食」「カート販売」等）は、ユーザー指定リストには明示されていないが`/foods`の主要な固定UI文言である。件数が多いため、3.3で別表として整理し、Phase2Cに含めるか2Dへ分割するかを6章で確認する。

### 3.3 並び替え・詳細フィルター関連（要Owner確認・3.2とは別枠）

| キー（案） | ja値 |
| --- | --- |
| `foods.sortRecommended` | おすすめ順 |
| `foods.sortNew` | 新しい順 |
| `foods.sortImage` | 画像あり優先 |
| `foods.sortStatus` | 公開情報確認順 |
| `foods.sortUneaten` | 残り優先 |
| `foods.sortCategory` | カテゴリ順 |
| `foods.sortShop` | 店舗順 |
| `foods.sortPriceAsc` | 価格安い順 |
| `foods.sortPriceDesc` | 価格高い順 |
| `foods.sortWalk` | 食べ歩き優先 |
| `foods.categoryFilterAll` | 全ジャンル |
| `foods.shopTypeFilterAll` | 全店舗種別 |
| `foods.diningTypeFilterAll` | 食べ方すべて |
| `foods.statusFilterAll` | 確認状況すべて |
| `foods.saleFilterEndingSoon` | 終了間近 |
| `foods.saleFilterPermanent` | 常設 |
| `foods.saleFilterUpcoming` | 近日販売 |
| `foods.saleFilterUnknown` | 販売期間確認中 |
| `foods.saleFilterAll` | 図鑑すべて |
| `foods.toggleImageOnly` | 写真あり |
| `foods.toggleTakeout` | テイクアウト可 |
| `foods.toggleEatIn` | 店内飲食 |
| `foods.toggleFoodCart` | カート販売 |
| `foods.priceFilterAll` | 価格すべて |

これらは `categoryLabels`/`diningTypeLabels`/`shopTypeLabels`/`statusLabels`（`lib/constants.ts`、ジャンル名・カテゴリ名）とは異なる「フィルターの選択肢ラベル」である。ジャンル名そのもの（`categoryLabels`の値）は2.2により翻訳対象外。

### 3.4 `/foods/[id]`（`foodDetail.*` 名前空間）

| キー | ja値 | 用途 |
| --- | --- | --- |
| `foodDetail.backToList` | 一覧へ戻る | 一覧へ戻るリンク |
| `foodDetail.previous` | 前 | 前の商品へのリンク |
| `foodDetail.next` | 次 | 次の商品へのリンク |
| `foodDetail.eaten` | 食べた | `common.eaten`を再利用できない場合の代替（基本は再利用） |
| `foodDetail.eatenDone` | 食べた済み | 食べた済みボタン |
| `foodDetail.wantNext` | 次回食べたい | 次回食べたいボタン |
| `foodDetail.wantSaved` | 保存済み | 保存済みボタン |
| `foodDetail.howToBuy` | どこで買える？ | 販売場所セクションの上部キッカー |
| `foodDetail.salesLocations` | 販売場所 | `area.salesLocations`を再利用（再掲） |
| `foodDetail.shopCountSingle` | 1店舗のみ | `getSalesSummary`の`shopLabel`（1件） |
| `foodDetail.shopCount` | {{count}}店舗 | `getSalesSummary`の`shopLabel`（複数件、`{{count}}`差し込み） |
| `foodDetail.areaCountSingle` | 1エリア | `getSalesSummary`の`areaLabel`（1件） |
| `foodDetail.areaCount` | {{count}}エリア | `getSalesSummary`の`areaLabel`（複数件、`{{count}}`差し込み） |
| `foodDetail.areaChecking` | エリア確認中 | `getSalesSummary`の`areaLabel`（0件） |
| `foodDetail.officialSite` | 公式サイトを見る | 公式サイトリンク |
| `foodDetail.relatedTitle` | 関連商品 | 関連商品セクション見出し |
| `foodDetail.relatedKicker` | 図鑑を巡る | 関連商品セクションのキッカー |
| `foodDetail.relatedRailTitle` | 関連度順 | `RelatedRail`の`title` |
| `foodDetail.confirmationInfo` | 確認情報 | `<details><summary>` |
| `foodDetail.category` | カテゴリ | 確認情報`<dl>`内ラベル |
| `foodDetail.diningType` | 形式 | 同上 |
| `foodDetail.period` | 期間 | 同上 |
| `foodDetail.completable` | 現在コンプ対象 | 同上 |
| `foodDetail.completableYes` | 対象 | 値 |
| `foodDetail.completableNo` | 対象外 | 値 |
| `foodDetail.saleStart` | 販売開始 | 確認情報`<dl>`内ラベル |
| `foodDetail.saleEnd` | 販売終了 | 確認情報`<dl>`内ラベル（`common.ended`「販売終了」とは用途が異なる：状態バッジ vs 確認情報のラベル。表記は同じだが文脈が異なるため、再利用可否は6章で確認） |
| `foodDetail.priceCheck` | 価格確認 | 確認情報`<dl>`内ラベル |
| `foodDetail.priceStatus` | 価格状態 | 確認情報`<dl>`内ラベル |
| `foodDetail.priceUnknown` | 価格未確認 | 値（`foods.priceUnknown`を再利用可能） |
| `foodDetail.checkedDate` | 確認日 | 確認情報`<dl>`内ラベル |
| `foodDetail.dateUnknown` | 未確認 | `formatDateShort`/各種日付の未確認値 |
| `foodDetail.dateUndecided` | 未定 | 販売終了日が未定の場合 |

> `getSaleStatusLabel`/`getZukanCode`/`getDisplayLocationAreaName`/`getPriceSourceLabel`/`shopTypeLabels`/`diningTypeLabels`等は `lib/food-utils.ts` / `lib/constants.ts` 内の関数・定数であり、`food-card.tsx`/`food-detail.tsx`/`food-grid.tsx`の複数箇所から参照されている。これらの戻り値を翻訳するには、関数自体に`t()`を渡す（あるいは呼び出し側でラベルを変換する）設計判断が必要になる。本設計では候補キーのみ提示し、関数改修の方針は6章 Stop and Askとする。

---

## 4. Page Impact

### 4.1 `/foods/[id]`

- `components/food-detail.tsx`（`"use client"`）に `useLocale()` を導入し、3.4のキーで固定文言を置き換える。
- バッジ・確認情報`<dl>`・販売場所セクションなど、レイアウト構造を変えずにテキストのみ`t()`に置き換える想定であれば、Phase2A/2Bと同様のリスクの低い変更になる。
- `getSalesSummary`が返す`shopLabel`/`areaLabel`（「1店舗のみ」「Nエリア」「エリア確認中」等）は文字列をそのまま返しているため、`{{count}}`差し込み対応の関数に変更するか、`food-detail.tsx`側で件数を受け取って`t()`で組み立てるよう改修するかの選択が必要（6章）。
- `formatDateShort`/`formatDateLong`は`Intl.DateTimeFormat("ja-JP", ...)`で固定されており、Phase2Cでは変更しない（2.2参照）。日付の「表示形式」自体は翻訳対象外だが、「未確認」「未定」は2.1/3.4の対象。

### 4.2 `/foods`

- `app/foods/page.tsx`はサーバーコンポーネントで`title="フードを探す"`をハードコードしている。`components/food-grid.tsx`は`"use client"`。
- **重要**: `FoodGrid`は`/eaten`ページ（`mode="eaten"`）からも呼び出される共有コンポーネントである可能性が高い（`ListMode = "all" | "eaten"`、`showRequestCta`等のprops設計から推測）。Phase2Cは`/eaten`を対象外としているため、`food-grid.tsx`を翻訳対応する際は、**`/eaten`から見たときに表示が壊れない・意図せず翻訳されない**ことを検証する必要がある（7章 検証ページに`/eaten`を含める）。
- `food-grid.tsx`内の文言は、検索・フィルター・並び替え・結果表示・0件表示・CTAなど多岐にわたる。3.2/3.3で分類した通り、最低限の主要文言（3.2）と、件数の多いフィルター/並び替えオプション（3.3）に分けて段階的に対応することを検討してもよい（6章）。
- `food-card.tsx`は`/foods`・`/foods/[id]`の関連商品・`/eaten`・home・area-detail等、非常に広い範囲で使われている共有コンポーネントである。バッジ文言（「限定」「販売終了」「近日販売」）と「食べた」/「食べた済み」ボタンを翻訳する場合、**`food-card.tsx`を使うすべてのページ**（`/`, `/areas/[id]`, `/foods`, `/foods/[id]`関連商品, `/eaten`等）に影響する。Phase2Cの対象ページは`/foods`と`/foods/[id]`のみだが、`food-card.tsx`自体の変更は事実上ページ横断になる点を踏まえ、検証ページを広めに取る（7章）。

---

## 5. Risks

1. **フィルター文言が長くなる**: en/ko/zh-TWで「公開情報確認順」「販売期間確認中」のような長いラベルを`<select>`の`<option>`やチップに入れると、要素の最小幅が広がり、`md:grid-cols-4 lg:grid-cols-6`のグリッドが崩れる可能性がある。`<option>`要素自体は通常レイアウトに影響しないが、`TogglePill`やチップ表示のテキストは折り返し・はみ出しのリスクがある。
2. **韓国語/繁体字でチップ幅が伸びる**: `categoryChips`は横スクロール可能（`overflow-x-auto`）なため致命的ではないが、`TogglePill`群（`flex flex-wrap`）は折り返し行数が増える可能性がある。390px/430pxでの確認が必須。
3. **商品名とUIラベルを混同するリスク**: 「限定」「販売終了」「近日販売」「価格未確認」等は、商品名・商品説明文中にも同様の語が自然文として出現する可能性がある（例: 商品説明に「期間限定の特別メニュー」等）。`t()`置き換えは**UIのラベル・バッジ・ボタン・見出し・固定文のみ**に限定し、`food.name`/`food.description`/`food.eventName`等のデータフィールドには絶対に適用しないことを明文化する。
4. **「価格未確認」など未確認系文言の扱い**: 「価格未確認」は(a)`food-card.tsx`の短いラベル、(b)`food-detail.tsx`の長い注記文、(c)`<select>`のフィルター選択肢、の3箇所で使われており、文脈ごとに異なるキー（`foods.priceUnknown`/`foods.priceUnknownNote`/`foods.priceFilterUnknown`）に分割する設計とした（3.2/3.4）。同様に「エリア確認中」「店舗未確認」も`lib/food-utils.ts`内の関数戻り値であり、関数のi18n対応方針が必要（6章）。
5. **既存カードレイアウトが崩れる**: `food-card.tsx`はテキストの`line-clamp`/`truncate`/固定高さ（`h-[462px]`, `h-[3.9rem]`, `h-7`, `h-8`等）に強く依存したデザインになっている。バッジラベルやボタンラベルが長い言語（特にドイツ語的に長くなりがちな表現がある場合のen、あるいはko/zh-TWでの折り返し）では、固定高さ内でテキストが収まらない可能性がある。Phase2Aの`I18nText`/Phase2Bの`t()`置き換えと同様、**構造・クラスは変更せず文言のみ差し替える**ことを基本方針とし、収まらない場合はPhase2Cの中で個別に対応を判断する（大規模リファクタは禁止）。
6. **共有コンポーネントの影響範囲**: 4.2で述べた通り、`food-card.tsx`/`food-grid.tsx`の変更は`/foods`・`/foods/[id]`だけでなく`/`・`/areas/[id]`・`/eaten`にも影響する。Phase2Cの「対象外ページ」を変更しないという制約と、共有コンポーネントを変更せざるを得ないという現実のバランスを取る必要がある（6章 Stop and Ask）。

---

## 6. Stop and Ask

以下はClaude（設計担当）が勝手に決めず、Owner判断を仰ぐ。

1. **商品名翻訳**: 行わない（確定方針、変更不可）。
2. **カテゴリ名・ジャンル名翻訳**: `categoryLabels`/`categoryChips`の各ラベル（「チュリトス」「ポップコーン」等）自体の翻訳は行わない（確定方針）。一方、3.3の「フィルターの見出し・選択肢ラベル」（例: 「全ジャンル」「カテゴリ順」）はUIラベルとして翻訳対象に含めてよいか、Ownerの確認が必要。
3. **URL変更**: 行わない（確定方針、変更不可）。
4. **自動翻訳・外部API**: 利用しない（確定方針、変更不可）。
5. **データ修正・価格修正**: 行わない（確定方針、変更不可）。
6. **共有コンポーネント（`food-card.tsx`/`food-grid.tsx`）の変更範囲**: これらはPhase2C対象外ページ（`/`, `/areas/[id]`, `/eaten`）にも使われている。Phase2Cで`food-card.tsx`のバッジ・ボタン文言を翻訳する場合、対象外ページにも翻訳が反映されることになるが、これを許容するか、`/foods`・`/foods/[id]`専用の表示分岐を作るか（後者は大規模化・複雑化のリスクがある）。**推奨: 許容する**（バッジ・ボタンの固定文言は本質的にページ横断のUIラベルであり、Phase2A/2Bでも`common.*`は全ページ共通として扱われている）。Ownerの確認が必要。
7. **`lib/food-utils.ts`内の関数（`getSaleStatusLabel`/`getDisplayLocationAreaName`/`getPriceSourceLabel`等）のi18n対応方針**: これらは現在ja文字列を直接返す純粋関数で、`useLocale()`を呼べない（Reactコンポーネント外）。対応方針の選択肢:
   - (a) 関数に`t`関数を引数として渡す形に変更する
   - (b) 関数は「状態キー」（例: `"active"`/`"ended"`/`"unknown"`のようなenum値）を返すように変更し、呼び出し側のコンポーネントで`t()`に変換する
   - (c) Phase2Cでは対応せず、これらの関数が返す文言は対象外として2D以降に持ち越す
   - **影響範囲が広く（`food-card.tsx`/`food-detail.tsx`/`food-grid.tsx`すべてから参照）、関数シグネチャの変更を伴うため「大規模リファクタ」に該当しうる。Ownerの判断を要する。**
8. **`/foods`のフィルター・並び替えオプション（3.3）の扱い**: 件数が多いため、Phase2Cに全て含めるか、主要文言（3.2）のみをPhase2Cとし、3.3を「Phase2C-2」のような形で分割するか。
9. **ユーザー指定文言と実装文言の表記差分の扱い**（例: 「絞り込み」→実装は「表示条件」、「該当するフードがありません」→実装は「該当するメニューがありません」、「食べた記録に追加」→実装は「食べた」/「食べた済み」、「未食」「条件をクリア」「販売情報」「店舗確認中」→実装上に直接対応する文言が見当たらない）: 実装文言ベースで翻訳キーを設計するか、ユーザー指定文言に合わせて表示文言自体を変更するか。**後者は「文言変更」であり、翻訳の範囲を超えたUI文言修正になるため、Phase2Cの範囲外として2D以降または別途相談とすることを推奨**。
10. **`foodDetail.code`（図鑑コード）のラベル追加**: 現状は値のみ表示でラベルがない。ラベルを新設するのは「UI追加」であり、Phase2Cの「固定UI文言の翻訳」の範囲を超える可能性がある。追加するか見送るかOwnerの判断を要する。

---

## 7. Verification Plan

### 7.1 言語・幅

- 言語: ja / en / ko / zh-TW
- 幅: 390px / 430px / 768px / 1280px / 1920px

### 7.2 確認ページ

- `/foods`
- `/foods/[id]`（複数商品で確認: 価格あり/価格未確認、限定/通常、販売中/販売終了/近日販売の各パターンを含む）
- `/settings`（既存ページの非破壊確認として継続）
- **`/eaten`**（`food-grid.tsx`/`food-card.tsx`の変更が対象外ページに影響しないことの確認のため、Phase2Cでは追加で必須とする）
- **`/`・`/areas/[id]`**（`food-card.tsx`変更の影響確認として、Phase2A/2B同様の非破壊チェックを継続する）

### 7.3 確認項目

- 各幅で overflow 0 / clipped 0 / 横スクロールなし
- ja/en/ko/zh-TWで、3章のキーに対応するUI文言（検索欄placeholder、フィルター・並び替え選択肢、バッジ、ボタン、確認情報`<dl>`等）が正しく表示される
- 商品名が翻訳されていない（`food.name`がja原文のまま、全言語で）
- 店舗名が翻訳されていない（`food.shop.name`/`location.shopName`がja原文のまま）
- エリア名が翻訳されていない（`food.area.name`/`location.areaName`がja原文のまま。状態ラベル「エリア確認中」等は翻訳対象であることに注意し、固有名詞のエリア名とは区別して確認する）
- カテゴリ名・ジャンル名（`categoryLabels`の値）が翻訳されていない
- 「25周年」等のイベント名が翻訳されていない
- 価格表示（`￥2,600`等）・日付表示（`formatDateShort`/`formatDateLong`の出力形式）が変更されていない
- `food-card.tsx`/`food-grid.tsx`の変更により、`/`・`/areas/[id]`・`/eaten`のレイアウト・既存文言（home v1.2 / area-detail-v1.1で確認済みの内容）が壊れていない
- URL構造が変わっていない（`/en` `/ko` `/zh-TW` が追加されていない、`/foods`・`/foods/[id]`のクエリパラメータ構造が変化していない）

---

## 8. まとめ・推奨事項

- Phase2Cはユーザー指定の対象範囲（`/foods`, `/foods/[id]`の固定UI文言）に対して、3章で候補キーを整理した。既存キー（`common.*`/`area.salesLocations`）の再利用は限定的で、`foods.*`/`foodDetail.*`という新しい名前空間が中心になる。
- 件数・影響範囲ともにPhase2A/2Bより大きく、特に共有コンポーネント（`food-card.tsx`/`food-grid.tsx`）の扱いと、`lib/food-utils.ts`内の関数のi18n対応方針（6章7番）が設計上の最大の論点である。
- ユーザー指定文言と実装上の実際の文言に差分がある項目（6章9番）が複数あり、これらをどう扱うかにより、Phase2Cの作業量・リスクが大きく変わる。
- 推奨: 6章のStop and Ask（特に6, 7, 8, 9）についてOwnerの方針を確認した上で、`codex-goal-i18n-phase2c.md`を作成する。方針によっては、3.2（主要文言）を「Phase2C」、3.3（フィルター/並び替えの全選択肢）と6章7番（`food-utils.ts`関数のi18n対応）を「Phase2C-2」として分割することも検討の余地がある。

まだ`/goal`は作成していない。コード変更・git操作は行っていない。
