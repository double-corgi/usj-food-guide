# i18n-phase2d-c-design-v1.md

## 1. Objective

i18n Phase 2D-C では、`/stores`（店舗一覧ページ）の固定UI文言のみを多言語化する（ja/en/ko/zh-TW）。

対象ページ:
- `/stores`（`app/stores/page.tsx`）

対象外（変更しない）:
- `/`
- `/foods`
- `/foods/[id]`
- `/eaten`
- `/areas`
- `/areas/[id]`
- `/stores/[id]`

jaを基準・フォールバックとする。既存のi18n基盤（`LocaleProvider`/`useLocale`/`t()`、3段フォールバック、`{{placeholder}}`補間）をそのまま使用し、新しい仕組みは作らない。

## 2. Translation Scope

### 2.1 対象ファイルの現状確認

`app/stores/page.tsx`（`async function`のサーバーコンポーネント、`"use client"`なし）には以下の固定UI文言がある。

```tsx
<p className="text-xs font-black text-park">レストラン / フードカート</p>
<h1 className="text-3xl font-black tracking-tight text-ink md:text-4xl">店舗一覧</h1>
...
<p className="shrink-0 text-xs font-bold text-slate-400">{areaStores.length}店舗</p>
...
<p className="border-t border-slate-200 pt-5 text-xs font-bold text-slate-400">
  表示中 1 - {stores.length}件　合計 {stores.length}件
</p>
```

`StoreRow`コンポーネント（同ファイル内、`app/stores/page.tsx`に定義）が表示する店舗名（`store.name`）・概要文（`getStoreSummary()`の返り値）・バッジ（`getStoreBadge()`の返り値）は、いずれも`lib/store-utils.ts`のロジック・データに由来する。

### 2.2 翻訳してよいもの（実在する固定UI文言）

- 「レストラン / フードカート」（ページ上部のkicker）
- 「店舗一覧」（ページタイトル h1）
- 「{{count}}店舗」（各エリアグループの店舗数表示）
- 「表示中 1 - {{count}}件　合計 {{count}}件」（ページ下部の件数表示）

実在しない文言は追加しない（詳細は2.4参照）。

### 2.3 翻訳してはいけないもの

- 店舗名（`store.name`）
- エリア名（`areaName`、エリアグループの見出し）
- 商品名（`representativeFood`等）
- カテゴリ名・ジャンル名
- 商品説明・価格・日付
- generated JSON由来の商品データ
- 画像内テキスト
- `lib/store-utils.ts`の`getStoreSummary()`/`getStoreBadge()`/`getStoreTypeLabel()`が返す文言（「アイスクリーム専門店」「ハンバーガーレストラン」「フードカート」「レストラン」「フード施設」「ポップコーン」「カフェ」「スイーツ / スナック」等）。これらはPhase2A以降確立済みの「Stop and Ask」非翻訳方針（`lib/food-utils.ts`・`lib/constants.ts`と同様の扱い）の対象であり、`lib/store-utils.ts`も同方針に揃える。

### 2.4 ユーザー提示の候補キーと実装の対応関係

ユーザー提示の候補（「店舗一覧」「店舗から探す」「販売店舗」「この店舗で買える商品」「店舗を探す」「エリアで絞り込む」「表示する店舗がありません」「販売中」「販売終了」「取り扱いフード」「詳細を見る」）と、`app/stores/page.tsx`の実際のコードを照合した結果は以下の通り。

| ユーザー候補 | 実装上の対応 |
|---|---|
| 店舗一覧 | `app/stores/page.tsx`のh1「店舗一覧」と一致。**翻訳対象に含める**（`stores.title`）。 |
| 店舗から探す | `/stores`ページ本文には存在しない（ホーム`/`の「店舗から探す」見出しは別ページのため対象外）。追加しない。 |
| 販売店舗 | `/stores`に該当する文言なし。追加しない。 |
| この店舗で買える商品 | `/stores/[id]`の既存キー`store.availableFoods`（ja="この店舗で買える商品"）と一致するが、`/stores/[id]`は本フェーズの対象外。`/stores`一覧ページには該当箇所がないため追加しない。既存キーの流用・変更も行わない。 |
| 店舗を探す | `/stores`に該当する文言なし。ページ上部のkicker「レストラン / フードカート」を`stores.kicker`として翻訳対象に含める（候補「店舗を探す」とは文言が異なるため新規追加はしない）。 |
| エリアで絞り込む | `/stores`にはエリアによる絞り込みUI（フィルター）はなく、エリアごとに店舗をグループ化して見出し表示するのみ。フィルターUIは存在しないため追加しない（5章Risks/6章Stop and Askで言及）。 |
| 表示する店舗がありません | `buildStoresFromFoods(foods)`は常に1件以上の店舗を返す想定で、`/stores`に空状態UIは現状存在しない。新規追加しない。 |
| 販売中 / 販売終了 | `common.saleActive`="販売中"・`common.ended`="販売終了"として既存キーがあるが、`/stores`一覧ページの現在の表示には使われていない（`StoreRow`のバッジ・概要は`getStoreBadge()`/`getStoreSummary()`由来で、販売中/終了の状態表示はない）。追加しない。既存キーの流用もしない。 |
| 取り扱いフード | `/stores`に該当する文言なし（`StoreRow`の概要文`getStoreSummary()`は店舗種別の説明であり、「取り扱いフード」という見出しではない）。追加しない。 |
| 詳細を見る | `StoreRow`全体が`<Link>`で、明示的な「詳細を見る」テキストは存在しない（矢印アイコンのみ）。追加しない。 |

候補のうち「店舗一覧」のみが実装に存在する固定UI文言として直接一致する。加えて、ページ上部のkicker「レストラン / フードカート」、各エリアグループの「{{count}}店舗」、ページ下部の「表示中 1 - {{count}}件　合計 {{count}}件」の3箇所も、`/stores`の主要な固定UI文言として翻訳対象に含める（候補リストには明示されていないが、翻訳しないと表示全体に日英混在の不整合が生じるため）。

## 3. Candidate Keys

新規namespace `stores.*`（`/stores`一覧ページ専用、`store.*`は`/stores/[id]`詳細ページの既存namespaceのため重複を避ける）。

| key | ja（現状値） | 用途 |
|---|---|---|
| `stores.kicker` | レストラン / フードカート | ページ上部のkicker（`app/stores/page.tsx`） |
| `stores.title` | 店舗一覧 | ページタイトル h1（`app/stores/page.tsx`） |
| `stores.areaStoreCount` | {{count}}店舗 | 各エリアグループ見出し横の店舗数（`app/stores/page.tsx`）。`{{count}}` = `areaStores.length` |
| `stores.listSummary` | 表示中 1 - {{count}}件　合計 {{count}}件 | ページ下部の件数表示（`app/stores/page.tsx`）。`{{count}}` = `stores.length`（先頭の"1"は固定値のため文言内に含める） |

計4キー × 4言語 = 16エントリ。

新規追加するキーは上記4つのみ。既存キー（`store.*`、`common.saleActive`、`common.ended`、`nav.*`、`footer.*`等）の流用や変更は行わない。

### 3.1 `store.backToList`（"店舗一覧へ戻る"）との関係

`/stores/[id]`の既存キー`store.backToList`（ja="店舗一覧へ戻る"）は、`/stores`一覧へ戻るリンクのラベルであり、`stores.title`（ja="店舗一覧"、`/stores`のページタイトル）とは用途が異なる別キーである。Phase2C-A.1で確立した「ja値が似ていても用途が異なる場合は別キーにする」方針に従い、`stores.title`は新規の独立したキーとし、`store.backToList`の流用・改変は行わない。

### 3.2 `stores.listSummary`のフォーマットについて

現状のja実装は`表示中 1 - {stores.length}件　合計 {stores.length}件`であり、`stores.length`が2箇所に使われているが先頭の"1"は常に固定（ページネーションが存在しないため）。`stores.listSummary`は`{{count}}`パラメータ1つを2回展開する形（`replaceAll`仕様により同名プレースホルダーは複数回出現可）で、ja="表示中 1 - {{count}}件　合計 {{count}}件"として定義する。en/ko/zh-TWでも同様に`{{count}}`を1つのパラメータとして2回使用してよい。

## 4. Page Impact

- `app/stores/page.tsx`: `async function`のサーバーコンポーネント。Phase2D-Bと同様、`useLocale`はクライアント専用のため直接呼び出せない。`/eaten`・`/areas`で確立したパターン（サーバーコンポーネントはデータ取得のみを担い、表示文言は`"use client"`コンポーネントに委譲する）に揃える必要がある。現状`app/stores/page.tsx`は`StoreRow`や全体レイアウトを直接エクスポートしており、`/areas`のような既存の`"use client"`コンポーネント（`AreaOverview`相当）が存在しない。新規に`"use client"`コンポーネントを追加するか、ページ全体を`"use client"`化するかはCodexの`/goal`作成時に判断する（5章Risksで詳述）。
- `StoreRow`・`groupStoresByArea`・`lib/store-utils.ts`の各関数: ロジック自体は変更しない。表示文言の翻訳対象は2.2記載の4箇所のみ。
- 他ページ（`/`、`/foods`、`/foods/[id]`、`/eaten`、`/areas`、`/areas/[id]`、`/stores/[id]`）への変更はない。

## 5. Risks

- `app/stores/page.tsx`はサーバーコンポーネントであり、かつ`/areas`の`AreaOverview`のような既存の`"use client"`委譲先コンポーネントが存在しない。Phase2D-Bと同様の「クライアント側に文言を移す」対応を行う場合、新規の`"use client"`コンポーネント（例: `StoresOverview`）を追加する必要があり、ファイル構成の変更が`/areas/page.tsx`のケースより大きくなる可能性がある。
- Phase2D-Bのレビュー（`docs/design-review-i18n-phase2d-b.md`）で指摘された「共用コンポーネントへの無条件混入」と同種のリスクに注意する。`/stores`専用の文言を、他ページ（特にホーム`/`の「店舗から探す」セクションや`/stores/[id]`）と共用されるコンポーネントに無条件で混ぜ込まないこと。
- `stores.areaStoreCount`（「{{count}}店舗」）はen/ko/zh-TWで単数/複数表現が異なる場合がある（例: 英語の"1 store"/"2 stores"）。`{{count}}`の値が1の場合の表現が不自然にならないか確認が必要。
- `stores.listSummary`の「表示中 1 - {{count}}件　合計 {{count}}件」は、`{{count}}`を2回使う構造のため、en/ko/zh-TWでも同じ値を2か所に展開して不自然にならない訳文設計が必要。
- `lib/store-utils.ts`の`getStoreSummary()`/`getStoreBadge()`/`getStoreTypeLabel()`は、店舗名の正規表現マッチによってja文言を返す関数群であり、Phase2A以降の「Stop and Ask」非翻訳方針の対象に含めることを明示しないと、Codexが誤って翻訳対象に含めてしまうおそれがある。

## 6. Stop and Ask

以下はオーナー確認が必要なため、Phase2D-Cでは対応しない。

- 「エリアで絞り込む」: `/stores`にエリアフィルターUIは存在しない。フィルター機能自体を新設するかどうかは本フェーズの「実在する文言だけを翻訳する」方針の範囲外。
- 「表示する店舗がありません」: `/stores`に空状態UIは存在しない。空状態キーを先行整備すべきかどうか。
- 「店舗から探す」「販売店舗」「この店舗で買える商品」「取り扱いフード」「詳細を見る」「販売中」「販売終了」: `/stores`一覧に新規UI要素として追加すべきかどうか（本フェーズの方針からは範囲外）。
- `lib/store-utils.ts`の`getStoreSummary()`/`getStoreBadge()`/`getStoreTypeLabel()`を、Phase2A以降の「Stop and Ask」非翻訳方針に含めることの最終確認。
- `app/stores/page.tsx`のサーバー/クライアント分離方針（新規`"use client"`コンポーネントの追加 or ページ全体のクライアント化）。
- 店舗名翻訳、エリア名翻訳、商品名翻訳、カテゴリ名翻訳、URL変更、自動翻訳、外部API、generated JSON変更、DB変更、crawler変更は全てStop and Ask対象（変更しない）。

## 7. Verification Plan

- 言語: ja / en / ko / zh-TW
- 幅: 390 / 430 / 768 / 1280 / 1920
- 確認ページ: `/stores`（メイン対象）に加え、回帰確認として`/`、`/stores/[id]`（任意の1店舗）、`/areas`、`/eaten`、`/foods`
- 確認項目:
  - `/stores`のkicker「レストラン / フードカート」相当・タイトル「店舗一覧」相当・各エリアグループの「{{count}}店舗」相当・ページ下部の「表示中 1 - {{count}}件　合計 {{count}}件」相当が、4言語で正しく表示・補間される
  - 店舗名・エリア名・商品名・`getStoreSummary()`/`getStoreBadge()`由来の文言が4言語とも翻訳されず元の日本語表示のまま
  - 390px/430pxで店舗行（`StoreRow`）のテキストの折り返し・はみ出しがない
  - 横スクロールが発生しない
  - `/stores/[id]`・`/areas`・`/eaten`・`/`・`/foods`の表示・リンク先URLに変化がない（Phase2D-C変更の影響範囲外であることの確認、特にPhase2D-Bで懸念された共用コンポーネントへの混入が再発していないこと）
  - `localStorage`の`unicolle-locale`・`unicolle-locale-change`イベント、既存の食べた記録データに変更がない

Codex用`/goal`は本ドキュメントでは作成しない。
