# design-review-i18n-phase2d-c.md

## 0. レビュー概要

- 対象: i18n Phase 2D-C（`/stores` 一覧ページの固定UI文言の多言語化）
- 確認方法: `git diff 481d922 41a2e70`（backup-before-i18n-phase2d-c → implement-i18n-phase2d-c-stores）の全文確認、`lib/i18n/dictionaries.ts` の追加エントリ確認、本番環境（`https://new-app-chi-rosy.vercel.app`）の `/stores`・`/` のfetch確認、提出スクリーンショット（en/zh-TW）の目視確認
- commit: backup `481d922` → implement `41a2e70`（Codex報告のhash表記と差異あり。報告では`/`が言及されていなかったが、実コミットhashは履歴上連続しており問題なし）

## 1. Phase 2D-C の範囲確認

### 1.1 `/stores` 一覧の固定UI文言だけか

`git diff --stat`の変更ファイルは以下の通り。

```
app/stores/page.tsx                             |  95 +----------------------
components/stores-overview.tsx                  |  99 ++++++++++++++++++++++++
lib/i18n/dictionaries.ts                        |  16 ++++
screenshots/...（8枚、PNGのみ）
```

`app/stores/page.tsx`は95行→9行に削減され、データ取得（`listFoods()`・`buildStoresFromFoods()`）のみを担うサーバーコンポーネントとして残り、表示用JSX一式は新規ファイル`components/stores-overview.tsx`（`"use client"`）に移動している。新規コンポーネントは`StoreRow`・`groupStoresByArea`を含めて`/stores`専用であり、設計書5章の指示（`/stores`専用、他ページと共用しない）に正確に合致している。**範囲は`/stores`一覧の固定UI文言のみ**であり、想定通り。

### 1.2 `/stores/[id]` に不要に踏み込んでいないか

`diff --stat`に`app/stores/[id]/`配下のファイルは含まれていない。`store.*`（単数namespace、`store.backToList`等）も変更されていない（2.1で確認）。問題なし。

### 1.3 `/foods` `/eaten` `/areas` を不要に変更していないか

`diff --stat`にこれらのページ・コンポーネントは一切含まれていない。`components/home-dashboard.tsx`、`components/area-overview.tsx`、`components/eaten-experience.tsx`も変更なし。Phase2D-Bで指摘された「共用コンポーネントへの無条件混入」と同種の問題は発生していない。問題なし。

## 2. 翻訳対象外の維持確認

### 2.1 `lib/i18n/dictionaries.ts`の追加内容

新規namespace`stores.*`として4キー×4言語=16エントリが追加されている。

| key | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `stores.kicker` | レストラン / フードカート | Restaurants / Food Carts | 레스토랑 / 푸드 카트 | 餐廳 / 餐車 |
| `stores.title` | 店舗一覧 | Store List | 매장 목록 | 店鋪列表 |
| `stores.areaStoreCount` | {{count}}店舗 | {{count}} stores | {{count}}개 매장 | {{count}}間店 |
| `stores.listSummary` | 表示中 1 - {{count}}件　合計 {{count}}件 | Showing 1 - {{count}} of {{count}} | 표시 중 1 - {{count}}건　합계 {{count}}건 | 顯示 1 - {{count}}件　共 {{count}}件 |

設計書`i18n-phase2d-c-design-v1.md`の4キーとja値が完全一致している。既存の`store.*`（単数、`/stores/[id]`用、`store.backToList`="店舗一覧へ戻る"等）・`common.saleActive`・`common.ended`・`area.*`・`areas.*`・`eaten.*`・`nav.*`・`footer.*`は`diff`上で変更されておらず、流用・改変はない。`stores.title`（"店舗一覧"）と`store.backToList`（"店舗一覧へ戻る"）は別キーとして独立しており、Phase2C-A.1以来の「distinct keys for duplicate ja values」方針に合致している。

### 2.2 店舗名・商品名・エリア名・カテゴリ名・ジャンル名・generated JSON由来データ

`components/stores-overview.tsx`内で、`store.name`（店舗名）、`areaName`（エリア名）、`getStoreSummary()`/`getStoreBadge()`が返す文言（「アイスクリーム専門店」「レストラン」「カート販売」「ポップコーンカート」等）は、いずれも`t()`を介さず元のリテラル/関数呼び出しのまま表示されている。`lib/store-utils.ts`自体も`diff`に含まれておらず変更なし。本番`/stores`のfetch結果でも、店舗名・エリア名・`getStoreSummary()`系の文言は日本語のまま表示されている（例: 「アミティ・アイスクリーム」「アイスクリーム専門店」「ホッグズ・ヘッド」「バタービール」等）。翻訳対象外は維持されている。

## 3. 表示品質

### 3.1 本番`/stores`（ja）のfetch確認

本番fetch結果で以下を確認した。

- ページ上部: 「レストラン / フードカート」（kicker）/「店舗一覧」（h1）
- 各エリアグループ見出し横: 「3店舗」「4店舗」「2店舗」「7店舗」等（`stores.areaStoreCount`が正しく補間）
- ページ下部: 「表示中 1 - 63件　合計 63件」（`stores.listSummary`の`{{count}}`が`stores.length`=63で両箇所とも正しく補間）
- 店舗名・エリア名・店舗種別ラベルは未翻訳のまま

設計書通りの表示であり、問題なし。

### 3.2 スクリーンショット確認（en-390, zh-TW-430）

- `screenshots/i18n-phase2d-c-stores-en-390.png`: 「Restaurants / Food Carts」「Store List」、エリア見出し横に「3 stores」「4 stores」「2 stores」等。文字切れ・折り返し崩れ・横スクロールは見られない。店舗行（画像・バッジ・店名・種別・chevron）のレイアウトも壊れていない。
- `screenshots/i18n-phase2d-c-stores-zh-TW-430.png`: 「餐廳 / 餐車」「店鋪列表」、エリア見出し横に「3間店」「4間店」「2間店」等。同様に崩れなし。

両画像とも、エリア名（日本語）と店舗カードの表示は元のレイアウトを保っており、390px/430pxでの「clipped」（はみ出し）は確認できない。

### 3.3 「レストラン / フードカート」「店舗一覧」「◯店舗」の各言語表現の自然さ

- `stores.kicker`: en "Restaurants / Food Carts" / ko "레스토랑 / 푸드 카트" / zh-TW "餐廳 / 餐車" — いずれも直訳的だが`area.*`等の既存キーのトーンと一貫しており自然。
- `stores.title`: en "Store List" / ko "매장 목록" / zh-TW "店鋪列表" — 自然。
- `stores.areaStoreCount`: en "{{count}} stores"（例: "1 stores"となり単数形では英語として厳密には不自然だが、本プロジェクトの他の数量表示（例: `area.remainingInAreaUnit`="items"）も同様の単純複数形パターンを採用しており、既存方針との一貫性は保たれている。実データ上、1店舗のみのエリアは存在しないため実害は低い）/ ko "{{count}}개 매장" / zh-TW "{{count}}間店" — いずれも自然。
- `stores.listSummary`: en "Showing 1 - {{count}} of {{count}}" / ko "표시 중 1 - {{count}}건　합계 {{count}}건" / zh-TW "顯示 1 - {{count}}件　共 {{count}}件" — ja原文の「表示中 1 - ◯件　合計 ◯件」の構造・全角スペースを概ね踏襲しており妥当。

総じて各言語表現は自然であり、致命的な問題はない。

## 4. 既存機能への影響確認

### 4.1 ホーム（`/`）

本番fetch（ja）で「エリア一覧」「店舗から探す」セクションを含むホーム全体の構成・見出し・リンクを確認したが、Phase2D-Cによる変化は見られない。`components/home-dashboard.tsx`自体も`diff`に含まれていない。スクリーンショット`i18n-phase2d-c-home-ja-390.png`でも「ユニコレ」h1、「今集められるフード」「期間限定コレクション」「エリア一覧」セクションが正常表示されており、Phase2D-Bで指摘された二重見出し等の問題は見られない。

### 4.2 `/areas`（Phase2D-B）・`/eaten`（Phase2D-A）・`/foods`（Phase2C-A/B）

`components/area-overview.tsx`、`components/eaten-experience.tsx`、`/foods`関連ファイルはいずれも`diff`に含まれておらず、変更なし。本番fetchの`/`からのリンク構造（`/areas`、`/eaten`、`/foods`へのナビゲーション）も変化していない。回帰は確認されない。

### 4.3 `area-detail-v1.1`

`app/areas/[id]/`配下、`area.*`namespaceともに変更なし。影響なし。

## 5. 技術面

### 5.1 既存i18n基盤の利用

新規キーは`lib/i18n/dictionaries.ts`の既存`dictionaries`オブジェクトへの追加のみで、新しいContext・新しい辞書取得方式は導入されていない。`useLocale`からの`t()`呼び出しも既存パターン（`t("key", { param })`）に準拠している。

### 5.2 `useLocale`の使い方

`components/stores-overview.tsx`は`"use client"`を宣言し、`const { t } = useLocale();`で取得後、`t("stores.kicker")`/`t("stores.title")`/`t("stores.areaStoreCount", { count: areaStores.length })`/`t("stores.listSummary", { count: stores.length })`の4箇所で使用。`areas.cardProgress`（Phase2D-B）と同様のパラメータ渡しパターンであり、無理な使い方は見られない。

### 5.3 サーバー/クライアント境界

`app/stores/page.tsx`はサーバーコンポーネントのまま`listFoods()`・`buildStoresFromFoods()`でデータ取得し、`<StoresOverview stores={stores} />`に渡すのみとなっている。`/eaten`（`EatenExperience`）・`/areas`（`AreaOverview`）と同型のサーバー→クライアントへのprops渡しパターンであり、境界は不自然ではない。**Phase2D-Bと異なり、`StoresOverview`は`/stores`からのみimportされる専用コンポーネントとして新設されており、共用コンポーネントへの混入リスクは構造的に排除されている。**この点はPhase2D-Bでの指摘に対する適切な改善と評価できる。

### 5.4 hydration

`StoresOverview`は`"use client"`コンポーネントとして、`useLocale`（`useSyncExternalStore`でlocalStorageを読む実装）を使用する。`area-overview.tsx`・`eaten-experience.tsx`と同じ既存パターンを踏襲しており、新たなhydration不整合を生む変更ではないと判断する。本番fetch（静的HTML相当）でja表示が正しく出ていることから、SSR時のフォールバック（ja）も問題なく機能している。

## 6. 残課題・コメント（条件ではない）

- `stores.areaStoreCount`の英語表現が単数/複数で"1 stores"のような表記になりうる点は、`area.remainingInAreaUnit`等の既存キーと同様の簡易方式であり、本フェーズ独自の新規問題ではない。将来的に複数形対応の仕組みを導入する場合は、プロジェクト全体で横断的に対応すべき事項であり、Phase2D-C単体のブロッカーとはしない。

## 7. 判定

**承認**

Phase2D-C の実装は `/stores` 一覧の固定UI文言のみに範囲が収まっており、`/stores/[id]`・`/`・`/foods`・`/eaten`・`/areas`への意図しない変更は確認されない。翻訳対象外（店舗名・エリア名・カテゴリ名・ジャンル名・`lib/store-utils.ts`由来の文言）も維持されている。ja/en/zh-TWの表示・レイアウトも崩れておらず、Phase2D-Bで指摘された「共用コンポーネントへの混入」リスクも、`/stores`専用の新規クライアントコンポーネント`StoresOverview`を新設することで構造的に解消されている。技術面でも既存i18n基盤・既存パターンに準拠しており、問題は見当たらない。
