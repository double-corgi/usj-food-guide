# design-review-i18n-phase2d-d.md

## 0. レビュー概要

- 対象: i18n Phase 2D-D（`/stores/[id]` 店舗詳細ページの固定UI文言の多言語化）
- 確認方法: `git diff 0876c1d b9fd366`（backup-before-i18n-phase2d-d → implement-i18n-phase2d-d-store-detail）の全文確認、`lib/i18n/dictionaries.ts`の追加エントリ確認、本番環境（`https://new-app-chi-rosy.vercel.app`）の`/stores/shop-56paaa`のfetch確認、提出スクリーンショット（en-390、zh-TW-430）の目視確認
- commit: backup `0876c1d` → implement `b9fd366`（Codex報告のhashと一致）

## 1. Phase 2D-D の範囲確認

### 1.1 `/stores/[id]` 店舗詳細の固定UI文言だけか

`git diff --stat`の変更ファイルは以下の通り。

```
app/stores/[id]/page.tsx                           |  45 +++++++++++------
lib/i18n/dictionaries.ts                           |  56 +++++++++++++++++++++
screenshots/i18n-phase2d-d-store-detail-{en,ko,zh-TW}-{390,430}.png（6枚、PNGのみ）
```

`app/stores/[id]/page.tsx`への変更は、3章で確認した14箇所の固定文言を`I18nText`に置き換え、`StoreInfoItem`の`title`/`body`/`linkLabel`を`ReactNode`型に変更したのみ。`lib/i18n/dictionaries.ts`は既存namespace `store.*`への14キー×4言語=56エントリ追加のみで、新規namespaceの作成はない。**範囲は`/stores/[id]`店舗詳細の固定UI文言のみ**であり、想定通り。

### 1.2 `/stores` 一覧に不要に踏み込んでいないか

`diff --stat`に`app/stores/page.tsx`・`components/stores-overview.tsx`（Phase2D-Cで新設）は含まれていない。`stores.*`（複数、`/stores`一覧専用）の既存4キーも変更されていない（2.1で確認）。問題なし。

### 1.3 `/foods` `/eaten` `/areas` を不要に変更していないか

`diff --stat`にこれらのページ・コンポーネントは一切含まれていない。`components/home-dashboard.tsx`、`components/area-overview.tsx`、`components/eaten-experience.tsx`、`components/store-food-list.tsx`、`lib/store-utils.ts`、`lib/food-utils.ts`も変更なし。問題なし。

## 2. 翻訳対象外の維持確認

### 2.1 `lib/i18n/dictionaries.ts`の追加内容

既存namespace`store.*`に14キー×4言語=56エントリが追加されている。

| key | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `store.detailKicker` | 店舗 | Store | 매장 | 店鋪 |
| `store.availableFoodsKicker` | 販売商品 | Available Foods | 판매 상품 | 販售商品 |
| `store.availableFoodsCount` | {{count}}品を掲載しています。 | {{count}} items listed. | {{count}}개 상품을 게재하고 있습니다. | 刊載 {{count}} 品。 |
| `store.infoKicker` | 店舗情報 | Store Info | 매장 정보 | 店鋪資訊 |
| `store.infoSectionTitle` | 確認できる情報 | Information Available | 확인할 수 있는 정보 | 可確認的資訊 |
| `store.infoAreaLabel` | エリア | Area | 에리어 | 區域 |
| `store.infoTypeLabel` | 店舗種別 | Store Type | 매장 종류 | 店鋪類型 |
| `store.infoScheduleLabel` | 営業時間・スケジュール | Hours & Schedule | 영업시간・스케줄 | 營業時間・行程 |
| `store.scheduleBodyWithUrl` | 正確な営業時間は公式サイトでご確認ください | Please check the official site for accurate hours. | 정확한 영업시간은 공식 사이트에서 확인해 주세요 | 正確營業時間請至官方網站確認 |
| `store.scheduleBodyWithoutUrl` | 営業時間は現地または公式情報でご確認ください | Please check on site or official information for hours. | 영업시간은 현장 또는 공식 정보에서 확인해 주세요 | 營業時間請於現場或官方資訊確認 |
| `store.scheduleLinkLabel` | 公式サイトで確認 | Check on the official site | 공식 사이트에서 확인 | 在官方網站確認 |
| `store.infoOfficialLabel` | 公式サイト | Official Site | 공식 사이트 | 官方網站 |
| `store.officialBody` | 最新情報は公式サイトで確認できます | You can check the latest information on the official site. | 최신 정보는 공식 사이트에서 확인할 수 있습니다 | 最新資訊可於官方網站確認 |
| `store.officialLinkLabel` | 公式サイトを開く | Open official site | 공식 사이트 열기 | 開啟官方網站 |

設計書`i18n-phase2d-d-design-v1.md`の3章の対応表とja値が完全一致している。既存の`store.backToList`・`store.availableFoods`・`store.availableFoodsEmpty`・`common.saleActive`・`common.ended`・`area.viewAllSalesLocations`・`foodDetail.officialSite`・`foods.title`・`area.*`・`areas.*`・`stores.*`・`nav.*`・`footer.*`は`diff`上で変更されていない。

`store.scheduleLinkLabel`（公式サイトで確認）・`store.officialLinkLabel`（公式サイトを開く）・既存`foodDetail.officialSite`（公式サイトを見る）は、ja値が似ているが別キーとして独立して追加されており、流用・統合は行われていない（distinct keys方針に合致）。

### 2.2 店舗名・商品名・エリア名・カテゴリ名・ジャンル名・価格・generated JSON由来データ

`diff`上、`<h1>{store.name}</h1>`（店舗名）、`{store.areaName}`（エリア名）、`{storeSummary}`（`getStoreSummary()`）、`StoreInfoItem`の`body={store.areaName}` / `body={getStoreTypeLabel(store)}`はいずれも`t()`を介さず元のリテラル/関数呼び出しのまま維持されている。`StoreFoodList`・`lib/store-utils.ts`・`lib/food-utils.ts`は`diff`に含まれておらず変更なし。

本番fetch（`/stores/shop-56paaa`）でも、店舗名「フードカート」、エリア名「エリア確認中」、店舗種別「フードカート」、商品名（「ココア&クッキー・チュリトス」等）、価格（「¥600」等）はいずれも日本語・元の表記のまま表示されており、翻訳対象外は維持されている。

## 3. 表示品質

### 3.1 本番`/stores/shop-56paaa`（ja）のfetch確認

本番fetch結果で以下を確認した。

- 「店舗一覧へ戻る」（既存`store.backToList`、変更なし）
- 「店舗」（kicker、`store.detailKicker`）
- 「販売商品」（kicker、`store.availableFoodsKicker`）
- 「この店舗で買える商品」（既存`store.availableFoods`、変更なし）
- 「4品を掲載しています。」（`store.availableFoodsCount`、`{{count}}`=4で正しく補間）
- 「店舗情報」（kicker、`store.infoKicker`）
- 「確認できる情報」（見出し、`store.infoSectionTitle`）
- 「エリア」「店舗種別」「営業時間・スケジュール」（情報カード見出し、`store.infoAreaLabel`/`store.infoTypeLabel`/`store.infoScheduleLabel`）
- 「営業時間は現地または公式情報でご確認ください」（`officialUrl`なしのため`store.scheduleBodyWithoutUrl`、正しい分岐）
- この店舗は`officialUrl`を持たないため「公式サイト」情報カードは表示されない（設計通り）

設計書通りの表示であり、問題なし。

### 3.2 スクリーンショット確認（en-390, zh-TW-430）

- `screenshots/i18n-phase2d-d-store-detail-en-390.png`: 「Back to Stores」「Store」「アミティ・アイスクリーム」（店名は日本語のまま）「Available Foods」「Foods Available at This Store」「3 items listed.」「Store Info」「Information Available」「Store Type」「Hours & Schedule」「Please check the official site for accurate hours.」「Check on the official site」「Official Site」「You can check the latest information on the official site.」「Open official site」。文字切れ・折り返し崩れ・横スクロールは見られない。この店舗は`officialUrl`があり、「Official Site」情報カードと「Check on the official site」「Open official site」の2つのリンクが両方表示されている。
- `screenshots/i18n-phase2d-d-store-detail-zh-TW-430.png`: 「返回店鋪列表」「店鋪」「フードカート」（店名は日本語のまま）「販售商品」「這間店可購買的商品」「列載 4 品。」相当の表示、「店鋪資訊」「確認可確認的資訊」相当、「區域」「店鋪類型」「營業時間・行程」「營業時間請於現場或官方資訊確認」。`officialUrl`なしのため「官方網站」カードは表示されない。同様に崩れなし。

両画像とも390px/430pxでの「clipped」（はみ出し）・横スクロールは確認できない。ナビゲーションバーの帯が画面下部のテキストに重なって見える箇所があるが、これはスクリーンショット撮影時の固定ナビ表示によるもので、Phase2D-Cのスクリーンショットでも同様に見られた既知の表示であり、本フェーズ固有の問題ではない。

### 3.3 公式サイトリンクあり/なしの店舗での表示の自然さ

- `officialUrl`あり（en-390スクリーンショットの店舗）: 「営業時間・スケジュール」カードに`store.scheduleBodyWithUrl`（"Please check the official site for accurate hours."）+ `store.scheduleLinkLabel`（"Check on the official site"）が表示され、加えて「公式サイト」カード（`store.infoOfficialLabel`+`store.officialBody`+`store.officialLinkLabel`）が表示される。2つの公式サイト関連リンクが並ぶが、これは実装変更前から存在する構造（`officialUrl`がある場合に両カードが表示される既存仕様）であり、Phase2D-Dによる新規の変更ではない。
- `officialUrl`なし（`/stores/shop-56paaa`、zh-TW-430スクリーンショットの店舗）: 「営業時間・スケジュール」カードに`store.scheduleBodyWithoutUrl`のみが表示され、「公式サイト」カードは表示されない。条件分岐は正しく機能している。

各言語の訳文も、既存の`store.*`・`foods.*`・`foodDetail.officialSite`等のトーンと一貫しており、不自然な表現は見られない。

## 4. Codex報告内の確認事項（「0品を掲載しています」について）

Codexの報告によれば、一部店舗の詳細ページで「0品を掲載しています」（`store.availableFoodsCount`の`{{count}}=0`）という表示が発生する。これについて確認した。

### 4.1 原因の切り分け

`git diff`で確認した該当行の変更は以下の通り。

```diff
-          <p className="mt-2 text-sm font-bold text-slate-500">{displayFoods.length}品を掲載しています。</p>
+          <p className="mt-2 text-sm font-bold text-slate-500">
+            <I18nText k="store.availableFoodsCount" params={{ count: displayFoods.length }} />
+          </p>
```

変更前のコード（Phase2D-D実装前）でも、`{displayFoods.length}品を掲載しています。`という同じロジックで`displayFoods.length`の値をそのまま埋め込んでいた。`displayFoods`は`getStoreDisplayFoods(store.foods, store)`（`lib/store-utils.ts`、本フェーズでは変更されていない）の結果であり、`store.foods`が空またはdedupe後に0件になる店舗では、Phase2D-D以前から`displayFoods.length === 0`となり「0品を掲載しています」という表示になっていたと判断できる。

つまり、**「0品を掲載しています」という表示自体はPhase2D-D以前から存在していたロジック・データに起因するものであり、本フェーズのi18n対応によって新たに発生した問題ではない**。Phase2D-Dが行ったのは、この既存の文言を`store.availableFoodsCount`キー（`{{count}}品を掲載しています。`）として4言語化したことのみであり、`{{count}}`に渡される値（`displayFoods.length`）の計算ロジックには一切変更を加えていない。

### 4.2 判定

この問題は、**i18n Phase 2D-Dの承認を妨げる問題ではない**。本フェーズの責務は「実在する固定UI文言を正しく翻訳キー化すること」であり、`store.availableFoodsCount`は変更前の文言・ロジックをそのまま4言語化できている（en/ko/zh-TWでも`{{count}}=0`であれば"0 items listed."/"0개 상품을 게재하고 있습니다."/"刊載 0 品。"のように、文として破綻せず表示される）。

一方で、「店舗に紐づくフードが0件のときに『この店舗で買える商品』セクションに『0品を掲載しています。』+（`StoreFoodList`側の）『この店舗で買える商品はまだ登録されていません。』という、件数表示と空状態メッセージが両方表示されてしまう」という見え方自体は、**Phase2D-Dより前から存在するUI上の改善余地**であり、別トラックのデータ・店舗詳細UX改善課題として扱うべきである（i18n対応とは独立した課題のため、本レビューの承認判定には影響しない）。

## 5. 既存機能への影響確認

### 5.1 ホーム（`/`）・`/stores`（Phase2D-C）

`app/page.tsx`・`components/home-dashboard.tsx`・`app/stores/page.tsx`・`components/stores-overview.tsx`はいずれも`diff`に含まれておらず、変更なし。影響なし。

### 5.2 `/areas`（Phase2D-B）・`/eaten`（Phase2D-A）・`/foods`（Phase2C-A/B）・`area-detail-v1.1`

`components/area-overview.tsx`、`components/eaten-experience.tsx`、`/foods`関連ファイル、`app/areas/[id]/`配下はいずれも`diff`に含まれておらず、変更なし。回帰は確認されない。

## 6. 技術面

### 6.1 既存i18n基盤の利用

新規キーは`lib/i18n/dictionaries.ts`の既存`store.*`namespaceへの追加のみで、新しいContext・新しい辞書取得方式は導入されていない。

### 6.2 `useLocale`の使い方・`I18nText`の利用

`app/stores/[id]/page.tsx`はサーバーコンポーネントのまま維持され、既存の`I18nText`（`"use client"`の小コンポーネント）パターンで14箇所すべてが置き換えられている。`store.availableFoodsCount`のような`params`付き呼び出し（`<I18nText k="store.availableFoodsCount" params={{ count: displayFoods.length }} />`）も、`I18nText`・`t()`の既存の型定義（`params?: Record<string, string | number>`）の範囲内で動作しており、`I18nText`コンポーネント自体への変更は発生していない。設計書で想定された通り。

### 6.3 サーバー/クライアント境界

`app/stores/[id]/page.tsx`はサーバーコンポーネントのまま、`I18nText`という既存の小さな`"use client"`コンポーネントを文言ごとに埋め込む方式であり、Phase2D-Cで新設した`StoresOverview`のような大きな構造分離は不要だった。境界は不自然ではない。

### 6.4 `StoreInfoItem`の型変更

`title`/`body`/`linkLabel`が`string`から`ReactNode`に変更され、`store.areaName`・`getStoreTypeLabel(store)`（翻訳対象外の文字列）はそのまま`ReactNode`として渡されている（文字列は`ReactNode`として有効）。設計書3.1の指示通りであり、型変更の影響範囲も`app/stores/[id]/page.tsx`内のみ（ファイル内ローカルヘルパー）に限定されている。

### 6.5 hydration

`I18nText`は既存パターンであり、Phase2C・Phase2D-A〜Cで複数回使用済みのコンポーネントを同様の形で再利用しているのみである。新たなhydration不整合を生む変更ではないと判断する。本番fetch（静的HTML相当）でja表示が正しく出ていることから、SSR時のフォールバック（ja）も問題なく機能している。

## 7. 判定

**承認**

Phase2D-D の実装は `/stores/[id]` 店舗詳細の固定UI文言のみに範囲が収まっており、`/stores`一覧・`/`・`/foods`・`/eaten`・`/areas`・`area-detail-v1.1`への意図しない変更は確認されない。翻訳対象外（店舗名・エリア名・商品名・価格・`getStoreSummary()`/`getStoreTypeLabel()`由来の文言）も維持されている。ja/en/zh-TWの表示・レイアウトも崩れておらず、公式サイトリンクあり/なしの分岐も正しく機能している。Codex報告にあった「0品を掲載しています」表示はPhase2D-D以前から存在するロジック・データに起因するものであり、本フェーズのi18n対応が新たに引き起こした問題ではないため、承認の妨げとはしない（別トラックのデータ・店舗詳細UX改善課題として扱う）。技術面でも既存i18n基盤・既存`I18nText`パターンに準拠しており、問題は見当たらない。
