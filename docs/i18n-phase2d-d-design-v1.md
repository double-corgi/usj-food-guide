# i18n-phase2d-d-design-v1.md

## 1. Objective

i18n Phase 2D-D では、`/stores/[id]`（店舗詳細ページ）の固定UI文言のみを多言語化する（ja/en/ko/zh-TW）。

対象ページ:
- `/stores/[id]`（`app/stores/[id]/page.tsx` + `components/store-food-list.tsx`）

対象外（変更しない）:
- `/`
- `/foods`
- `/foods/[id]`
- `/eaten`
- `/areas`
- `/areas/[id]`
- `/stores`

jaを基準・フォールバックとする。既存のi18n基盤（`LocaleProvider`/`useLocale`/`t()`、3段フォールバック、`{{placeholder}}`補間、`I18nText`コンポーネント）をそのまま使用し、新しい仕組みは作らない。

## 2. Translation Scope

### 2.1 対象ファイルの現状確認

`app/stores/[id]/page.tsx`は`async function`のサーバーコンポーネント（`"use client"`なし）。すでに2箇所で`components/i18n-text.tsx`の`I18nText`（`"use client"`の小コンポーネントで、サーバーコンポーネント内に`t()`結果を埋め込む既存パターン）を使用している。

```tsx
<Link href="/stores" ...>
  <ChevronLeft size={17} aria-hidden />
  <I18nText k="store.backToList" />
</Link>
...
<h2 className="mt-1 text-2xl font-black text-ink">
  <I18nText k="store.availableFoods" />
</h2>
```

この2箇所はPhase2C/2D-Aいずれかで既に対応済みのため、本フェーズでの新規対応は不要。

ページ内の固定UI文言（現状ja直書き）は以下の通り。

```tsx
// 1. ページ上部kicker
<p className="text-xs font-black text-park">店舗</p>
<h1 ...>{store.name}</h1>                 {/* 店舗名: 翻訳対象外 */}
<p ...><MapPin .../>{store.areaName}</p>  {/* エリア名: 翻訳対象外 */}
<p ...>{storeSummary}</p>                 {/* getStoreSummary(): 翻訳対象外 */}

// 2. 販売商品セクション
<p className="text-xs font-black text-park">販売商品</p>
<h2 ...><I18nText k="store.availableFoods" /></h2>  {/* 対応済み */}
<p className="mt-2 text-sm font-bold text-slate-500">{displayFoods.length}品を掲載しています。</p>
<StoreFoodList foods={displayFoods} />

// 3. 店舗情報セクション
<p className="text-xs font-black text-park">店舗情報</p>
<h2 className="mt-1 text-xl font-black text-ink">確認できる情報</h2>
<StoreInfoItem icon={MapPin} title="エリア" body={store.areaName} />
<StoreInfoItem icon={Store} title="店舗種別" body={getStoreTypeLabel(store)} />
<StoreInfoItem
  icon={Clock}
  title="営業時間・スケジュール"
  body={officialUrl ? "正確な営業時間は公式サイトでご確認ください" : "営業時間は現地または公式情報でご確認ください"}
  linkHref={officialUrl}
  linkLabel="公式サイトで確認"
/>
{officialUrl ? (
  <StoreInfoItem icon={ExternalLink} title="公式サイト" body="最新情報は公式サイトで確認できます" linkHref={officialUrl} linkLabel="公式サイトを開く" />
) : null}
```

`components/store-food-list.tsx`（`"use client"`、既存）は`store.availableFoodsEmpty`・`common.eaten`を既に`t()`で使用している。1箇所だけ`aria-label="次回食べたい"`がハードコードされたまま残っている（2.5で扱う）。

### 2.2 翻訳してよいもの（実在する固定UI文言）

| 表示箇所 | ja文言 |
|---|---|
| ページ上部kicker | 「店舗」 |
| 販売商品セクションkicker | 「販売商品」 |
| 販売商品セクション件数 | 「{{count}}品を掲載しています。」 |
| 店舗情報セクションkicker | 「店舗情報」 |
| 店舗情報セクション見出し | 「確認できる情報」 |
| 情報カード見出し1 | 「エリア」 |
| 情報カード見出し2 | 「店舗種別」 |
| 情報カード見出し3 | 「営業時間・スケジュール」 |
| 情報カード本文（公式URLあり） | 「正確な営業時間は公式サイトでご確認ください」 |
| 情報カード本文（公式URLなし） | 「営業時間は現地または公式情報でご確認ください」 |
| リンクラベル1 | 「公式サイトで確認」 |
| 情報カード見出し4（公式URLありの場合のみ表示） | 「公式サイト」 |
| 情報カード本文4 | 「最新情報は公式サイトで確認できます」 |
| リンクラベル2 | 「公式サイトを開く」 |

すでに対応済み（既存キーを使用、変更不要）:
- 「店舗一覧へ戻る」→ `store.backToList`
- 「この店舗で買える商品」→ `store.availableFoods`
- 「この店舗で買える商品はまだ登録されていません。」→ `store.availableFoodsEmpty`（`components/store-food-list.tsx`で対応済み）

### 2.3 翻訳してはいけないもの

- 店舗名（`store.name`）
- 商品名（`StoreFoodList`内の`food.name`）
- エリア名（`store.areaName`）
- カテゴリ名・ジャンル名
- 商品説明
- 価格そのもの（`formatFoodPrice(food)`の出力）
- 日付
- generated JSON由来の商品データ
- 画像内テキスト
- `getStoreSummary(store, representativeFood)`・`getStoreTypeLabel(store)`の返り値（`lib/store-utils.ts`、Phase2D-Cで非翻訳方針を確認済みのStop and Ask対象を継続）
- `getFoodAreaSummary(food)`の返り値（`lib/food-utils.ts`、既存のStop and Ask対象）

### 2.4 ユーザー提示の候補キーと実装の対応関係

| ユーザー候補 | 実装上の対応 |
|---|---|
| 店舗一覧へ戻る | 既存`store.backToList`で対応済み。変更不要。 |
| この店舗で買える商品 | 既存`store.availableFoods`で対応済み。変更不要。 |
| 販売中 | `/stores/[id]`に該当する固定UI文言なし（`common.saleActive`はこのページでは使用されていない）。**新規追加しない**。 |
| 販売終了 | 同上。`common.ended`はこのページでは使用されていない。**新規追加しない**。 |
| 取り扱いフード | `/stores/[id]`に「取り扱いフード」という文言は存在しない。販売商品セクションのkicker「販売商品」が近い位置づけだが、文言が異なるため候補とは別物として扱う（`store.availableFoodsKicker`として翻訳対象に含める）。 |
| 販売場所 | `/stores/[id]`に該当する固定UI文言なし。`area.viewAllSalesLocations`（「すべての販売場所を見る」、`/areas/[id]`用）も本ページでは使用されていない。**新規追加しない**。 |
| エリア | 情報カードの見出し「エリア」と完全一致。**翻訳対象に含める**（`store.infoAreaLabel`）。 |
| 価格 | 情報カードや本文に「価格」という単独ラベルは存在しない（価格は商品カード内に直接表示されるのみで、翻訳対象外データ）。**新規追加しない**。 |
| 表示するフードがありません | 既存`store.availableFoodsEmpty`（「この店舗で買える商品はまだ登録されていません。」）が同じ空状態を既にカバーしている。文言が異なる新規キーとしては追加せず、既存キーを継続利用する。 |
| 店舗情報 | 店舗情報セクションのkickerと完全一致。**翻訳対象に含める**（`store.infoKicker`）。 |
| 店舗詳細 | ページ上部のkickerは「店舗」であり、「店舗詳細」という文言は実在しない。実装に存在する「店舗」を翻訳対象に含める（`store.detailKicker`）。候補「店舗詳細」とは文言が異なる点を明記。 |
| フードを探す | `/stores/[id]`に該当する固定UI文言なし（`/foods`の`foods.title`と同文だが、本ページには存在しない）。**新規追加しない**。 |
| すべて見る | `/stores/[id]`に該当する固定UI文言なし。**新規追加しない**。 |

候補のうち実装に存在し新規翻訳対象となるのは「エリア」「店舗情報」のみで、「店舗詳細」は実装上の文言「店舗」に読み替えて対応する。残りの候補（販売中/販売終了/取り扱いフード（近い文言「販売商品」あり）/販売場所/価格/表示するフードがありません/フードを探す/すべて見る）は実装に存在しないか既存キーで対応済みのため、新規追加しない。

一方で、2.2に列挙した「{{count}}品を掲載しています。」「確認できる情報」「店舗種別」「営業時間・スケジュール」「正確な営業時間は公式サイトでご確認ください」「営業時間は現地または公式情報でご確認ください」「公式サイトで確認」「公式サイト」「最新情報は公式サイトで確認できます」「公式サイトを開く」は、ユーザー候補リストには明示されていないが、`/stores/[id]`の主要な固定UI文言であり、翻訳しないとページの大部分（特に「店舗情報」セクション全体）が日本語のまま残ってしまう。Phase2D-A〜Cで確立した「候補にないが翻訳しないと不整合になる固定文言は対象に含める」方針に従い、翻訳対象に含めることを提案する（最終判断は4章Stop and Askで確認）。

### 2.5 `aria-label="次回食べたい"`（`components/store-food-list.tsx`）について

`StoreFoodList`内の`wanted`バッジに`aria-label="次回食べたい"`がハードコードされている（画面表示テキストではなく、スクリーンリーダー向けのみ）。ユーザー候補リストにこの文言は含まれておらず、`/stores/[id]`専用の文言でもない（同種のバッジ・aria-labelは他ページにも存在しうる）。本フェーズの候補範囲外として、**Stop and Askで対応方針を確認**し、対応する場合も既存の同名キーがあれば流用する（新規重複キーを避ける）。

## 3. Candidate Keys

新規namespaceは作らず、既存の`store.*`（`/stores/[id]`専用、単数namespace）に追加する。`store.*`は既にPhase2C以前から`store.backToList`/`store.availableFoods`/`store.availableFoodsEmpty`が存在する、本ページ専用のnamespace。

| key | ja（現状値） | 用途 |
|---|---|---|
| `store.detailKicker` | 店舗 | ページ上部のkicker |
| `store.availableFoodsKicker` | 販売商品 | 販売商品セクションのkicker |
| `store.availableFoodsCount` | {{count}}品を掲載しています。 | 販売商品セクションの件数表示。`{{count}}`=`displayFoods.length` |
| `store.infoKicker` | 店舗情報 | 店舗情報セクションのkicker |
| `store.infoSectionTitle` | 確認できる情報 | 店舗情報セクションの見出し（h2） |
| `store.infoAreaLabel` | エリア | 情報カード見出し（エリア） |
| `store.infoTypeLabel` | 店舗種別 | 情報カード見出し（店舗種別） |
| `store.infoScheduleLabel` | 営業時間・スケジュール | 情報カード見出し（営業時間） |
| `store.scheduleBodyWithUrl` | 正確な営業時間は公式サイトでご確認ください | 情報カード本文（公式URLあり） |
| `store.scheduleBodyWithoutUrl` | 営業時間は現地または公式情報でご確認ください | 情報カード本文（公式URLなし） |
| `store.scheduleLinkLabel` | 公式サイトで確認 | 情報カードのリンクラベル（営業時間カード） |
| `store.infoOfficialLabel` | 公式サイト | 情報カード見出し（公式サイト、公式URLありの場合のみ表示） |
| `store.officialBody` | 最新情報は公式サイトで確認できます | 情報カード本文（公式サイトカード） |
| `store.officialLinkLabel` | 公式サイトを開く | 情報カードのリンクラベル（公式サイトカード） |

計14キー × 4言語 = 56エントリ。

en/ko/zh-TWの値は、既存の`store.*`・`foods.*`・`foodDetail.officialSite`（「公式サイトを見る」）等の語彙・トーンと一貫性を持たせ、自然な訳にしてください。`store.scheduleLinkLabel`（公式サイトで確認）・`store.officialLinkLabel`（公式サイトを開く）・`foodDetail.officialSite`（公式サイトを見る）はja値が似ているが文脈・用途が異なるため、Phase2C-A.1以来の「distinct keys for duplicate ja values」方針に従い、それぞれ独立したキーとして追加する（既存`foodDetail.officialSite`の流用・改変はしない）。

### 3.1 既存キーの扱い（変更・流用禁止）

- `store.backToList`（"店舗一覧へ戻る"）、`store.availableFoods`（"この店舗で買える商品"）、`store.availableFoodsEmpty`（"この店舗で買える商品はまだ登録されていません。"）は変更・リネーム・流用禁止。
- `common.saleActive`（"販売中"）、`common.ended`（"販売終了"）、`area.viewAllSalesLocations`（"すべての販売場所を見る"）、`foodDetail.officialSite`（"公式サイトを見る"）、`foods.title`（"フードを探す"）、`area.*`、`areas.*`、`nav.*`、`footer.*`は変更・リネーム・流用禁止。

## 4. Page Impact

- `app/stores/[id]/page.tsx`: サーバーコンポーネントのまま維持。既存の`I18nText`パターン（`<I18nText k="..." />` / `<I18nText k="..." params={{...}} />`）を新規14キー分の表示箇所に追加する想定。
- `StoreInfoItem`（同ファイル内のヘルパー関数）: `title`/`body`/`linkLabel`プロパティは現状`string`型。`I18nText`は`ReactNode`を返すため、これらのプロパティ型を`ReactNode`に変更する必要が生じる可能性がある（実装方針の詳細はCodexの`/goal`で具体化する）。
- `components/store-food-list.tsx`: 2.5のaria-label対応をStop and Askの結果に応じて追加する可能性がある。それ以外の変更は不要（`store.availableFoodsEmpty`・`common.eaten`は対応済み）。
- 他ページ（`/`、`/foods`、`/foods/[id]`、`/eaten`、`/areas`、`/areas/[id]`、`/stores`）への変更はない。

## 5. Risks

- **キー数の規模**: 本フェーズは新規14キー×4言語=56エントリと、過去のPhase2D-A〜C（いずれも4キー×4言語=16エントリ）に比べて規模が大きい。情報カードまわりの文言が密集しているため、1フェーズで一括対応するか、「販売商品セクション」と「店舗情報セクション」に分割（例: Phase2D-D / Phase2D-D.1）するかは、実装・レビューの負荷を踏まえてオーナー判断が必要（Stop and Ask参照）。
- `StoreInfoItem`の`title`/`body`/`linkLabel`を`string`から`ReactNode`に変更する場合、型変更がコンポーネント全体に影響する範囲を確認する必要がある。本ファイル内のみで完結するヘルパーであるため影響範囲は限定的と見込まれるが、実装時に確認が必要。
- `store.availableFoodsCount`（「{{count}}品を掲載しています。」）はen/ko/zh-TWで`{{count}}`が0・1・複数の場合に不自然にならないか確認が必要（例: 0品の場合に文として成立するか）。`displayFoods.length`が0の場合は`StoreFoodList`側で`store.availableFoodsEmpty`の空状態UIに切り替わるため、この文が0品で表示されるケースは実際には発生しない可能性がある点も含め、実装時に確認する。
- `store.scheduleBodyWithUrl`/`store.scheduleBodyWithoutUrl`の分岐は`officialUrl`の有無による条件分岐であり、4言語それぞれで2パターンの文言が必要。条件分岐ロジック自体（`officialUrl ? ... : ...`）は変更しないこと。
- 「店舗」（`store.detailKicker`）はページ上部の短いkickerであり、ユーザー候補「店舗詳細」とは文言が異なる。en/ko/zh-TWへの訳出時に「店舗」単独の訳（例: en "Store"）と、ナビゲーションの`nav.stores`（"Stores"/店舗）との見分けがつくか、不自然にならないかを確認する必要がある（Phase2C-A.1の「distinct keys」方針により別キーとするが、訳文が同一になる可能性はある）。

## 6. Stop and Ask

以下はオーナー確認が必要なため、Phase2D-Dでは対応しない、または対応方針の決定が必要。

- **フェーズ分割の是非**: 3章の新規14キーを1フェーズで実装するか、「販売商品セクション」（`store.availableFoodsKicker`/`store.availableFoodsCount`の2キー）と「店舗情報セクション」（残り12キー）に分割するか。
- **2.5のaria-label「次回食べたい」**: `/stores/[id]`専用の文言ではないため、本フェーズで対応するか、別フェーズ（他ページの同種aria-label一括対応）に回すか。対応する場合、既存の同名キーがあれば流用する。
- 「販売中」「販売終了」「販売場所」「価格」「フードを探す」「すべて見る」「表示するフードがありません」（既存キーで対応済みのため新規追加なし）: 候補に含まれていたが実装に存在しない/既存キーで対応済みのため新規追加しない、という2.4の判断でよいか。
- 「店舗詳細」→「店舗」への読み替え（`store.detailKicker`）でよいか。
- `store.availableFoodsCount`の0品時の扱い（実際に到達するか、到達する場合の文言）。
- 店舗名翻訳、エリア名翻訳、`getStoreSummary()`/`getStoreTypeLabel()`の翻訳、URL変更、自動翻訳、外部API、generated JSON変更、DB変更、crawler変更は全てStop and Ask対象（変更しない）。

## 7. Verification Plan

- 言語: ja / en / ko / zh-TW
- 幅: 390 / 430 / 768 / 1280 / 1920
- 確認ページ: `/stores/[id]`（任意の複数店舗。`officialUrl`あり/なしの両パターンを最低1件ずつ確認）に加え、回帰確認として`/`、`/stores`、`/areas`、`/areas/[id]`、`/eaten`、`/foods`
- 確認項目:
  - ページ上部kicker「店舗」、販売商品セクションkicker「販売商品」、件数「◯品を掲載しています。」、店舗情報セクションkicker「店舗情報」、見出し「確認できる情報」、情報カード見出し（エリア/店舗種別/営業時間・スケジュール/公式サイト）、本文（公式URLあり/なしの2パターン）、リンクラベル（公式サイトで確認/公式サイトを開く）が4言語で正しく表示される
  - 店舗名・エリア名・`getStoreSummary()`/`getStoreTypeLabel()`の返り値・商品名・価格・カテゴリ名・ジャンル名が4言語とも翻訳されず元の日本語表示のまま
  - `officialUrl`の有無による分岐（営業時間カードの本文、公式サイトカードの表示/非表示）が各言語で正しく機能する
  - 390px/430pxで情報カード・販売商品グリッドのテキストの折り返し・はみ出し・横スクロールがない
  - 768/1280/1920pxでもレイアウト崩れがない
  - `/`、`/stores`、`/areas`、`/areas/[id]`、`/eaten`、`/foods`の表示・リンク先URL・既存i18n表示に変化がない（回帰なし）
  - `localStorage`の`unicolle-locale`・`unicolle-locale-change`イベント、既存の食べた記録データに変更がない

Codex用`/goal`は本ドキュメントでは作成しない。
