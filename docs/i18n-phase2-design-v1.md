# i18n-phase2-design-v1.md

担当: Claude（PO/UX/UIデザイン/レビュー・設計担当）
位置づけ: 設計のみ。コード変更・git操作・実装は行わない。Codex用 `/goal` は本ドキュメントでは作成しない。
前提資料: `docs/i18n-design-v1.md`、`docs/i18n-coverage-review-v1.md`、`lib/i18n/dictionaries.ts`、`lib/i18n/use-locale.tsx`、および対象ページ・コンポーネントのコードリードに基づく。

---

## 1. Objective

Phase 2では「全ページ一括翻訳」ではなく、アプリ全体で繰り返し使われている**高頻度の共通UIラベル**を辞書化し、ja/en/ko/zh-TWで切り替え可能にする。商品名・店舗名・エリア名・カテゴリ名・ユーザー投稿・日付フォーマット・URL構造は対象外とし、Phase 1で確立した基盤（`LocaleProvider`/`useLocale`/`t()`/localStorage）をそのまま流用する。

Phase 2の中でも実装は一度に行わず、最初のCodex実装は**Phase 2A（共通ラベルのみ）**に限定する。Phase 2B以降は、2Aの実装結果をレビューした上で個別に設計・`/goal`化する。

---

## 2. Translation Scope

### 翻訳する範囲（Phase 2全体）

UIラベルとしての共通語・セクション見出し・定型文。商品名・店舗名・エリア名・カテゴリ名・ジャンル名・口コミ本文を含まないテキスト。例:

販売中／限定／販売終了／食べた／残り／価格／すべて見る／登録済みコレクション／期間限定コレクション／まず食べたい／このエリアであと◯品／販売場所／エリア一覧へ戻る／店舗一覧へ戻る／この店舗で買える商品／このエリアで食べたフード／残りのフード／販売終了フード／最初の1品から／食べると、棚が色づく　など。

### 翻訳しない範囲（Phase 2全体）

- 商品名・店舗名・エリア名（データ由来の固有名詞）
- 商品説明・口コミ・コメント（ユーザー投稿/データ由来の自由記述）
- カテゴリ名・ジャンル名（`/foods`の食べ物ジャンル分類など、データ分類由来）
- 画像内テキスト
- 価格データそのもの（数値・通貨表記の生成ロジック）
- `Intl.DateTimeFormat`等の日付フォーマット
- URL構造、`/en` `/ko` `/zh-TW` 等のロケール別ルート追加

理由: 固有名詞・データ由来名・ユーザー投稿・SEO/URLに関わる領域は影響範囲が広く、誤訳・誤動作時の被害が大きいため、Phase 2のスコープからは明確に外す。

---

## 3. Candidate Keys

`docs/i18n-coverage-review-v1.md`の「Phase 2で翻訳すべき範囲」「Phase 2で翻訳してよいもの」をもとに、既存の`lib/i18n/dictionaries.ts`の`common.*`（Phase1で追加済みだが未使用の11キー）を土台にしつつ、新規namespace（`collection.*` / `area.*` / `store.*` / `home.*`）を追加する案。

### 3.1 既存 `common.*`（再利用・配線するもの）

Phase1で定義済み・未使用のキーをそのまま配線する。

```
common.saleActive        販売中
common.limited           限定
common.ended             販売終了
common.eaten             食べた
common.area              エリア
common.store             店舗
common.home              ホーム   ※nav.homeと重複の可能性あり、3.5で要検討
common.viewAll           すべて見る
common.price             価格
common.registeredCollection  登録済みコレクション
common.search            探す
```

### 3.2 新規 `common.*` 追加候補

```
common.remaining          残り
common.remainingCount     残り{count}品   ※変数埋め込み（3.6参照）
```

### 3.3 新規 `collection.*`（ホーム関連）

```
collection.registered     登録済みコレクション   ※common.registeredCollectionと統合するか要検討
collection.limited         期間限定コレクション
collection.firstBite       最初の1品から
collection.tagline         食べると、棚が色づく。
```

### 3.4 新規 `area.*`（エリア詳細）

```
area.backToList            エリア一覧へ戻る
area.firstPicks             まず食べたい3品
area.firstPicksDescription   このエリアで見つけるならここから。
area.endingSoon              終了間近のフード
area.endingSoonDescription   このエリアで逃しやすい商品を販売終了日が近い順に表示します。
area.remainingFoods          残りのフード
area.remainingFoodsEmpty     現在販売中の残り商品はありません。
area.remainingInArea         このエリアであと{count}品   ※変数埋め込み（3.6参照）
area.endedFoods               販売終了フード
area.endedFoodsEmpty          このエリアに販売終了フードはありません。
area.endedFoodsNote           販売終了フードは図鑑の記録として残ります。
area.eatenFoods                このエリアで食べたフード
area.eatenFoodsEmpty           このエリアの1品目を見つけよう。
area.salesLocations            販売場所
area.salesLocationsCount       {count}か所
area.viewAllLocations          すべての販売場所を見る（あと{count}か所）
area.complete                  このエリアはコンプリート
area.checkingNow                このエリアの販売中フードは現在確認中です
```

### 3.5 新規 `store.*`（店舗一覧・詳細）

```
store.backToList            店舗一覧へ戻る
store.availableFoods         この店舗で買える商品
store.availableFoodsEmpty    この店舗で買える商品はまだ登録されていません。
store.listTitle               店舗一覧
store.totalCount               合計
store.displaying                表示中
```

### 3.6 変数埋め込みに関する設計メモ（重要・新規論点）

「このエリアであと{count}品」「すべての販売場所を見る（あと{count}か所）」のように、文中に動的な数値が入る文言が複数存在する。現状の`t(key: TranslationKey): string`は引数なしの単純な辞書ルックアップのみで、変数差し込みに対応していない。

Phase 2Aでは、まず**変数を含まない固定文言のみ**を対象とし、`t()`のシグネチャは変更しない。「あと◯品」のような数値入り文言は、

- 案A: `t("area.remainingPrefix")`（「あと」）+ 数値 + `t("common.unitFood")`（「品」）のように分割し、UI側で連結する
- 案B: `t(key, params)`のように`t()`を拡張し、`{count}`のようなプレースホルダーを置換する

のどちらかを採用する必要があるが、**日本語は「あと{n}品」、英語は「{n} left」のように語順そのものが変わる**ため、案Aの単純連結は言語によって不自然になりうる。Phase 2Aでは変数を含まない文言（例: 「残りのフード」「すべて見る」「エリア一覧へ戻る」「このエリアで食べたフード」など）に限定し、変数埋め込み文言（「このエリアであと{count}品」「あと{count}か所」「{count}品中」等）は**Phase 2B以降で`t()`の拡張方針を別途決定してから対応する**。

---

## 4. Page Impact

| ページ | 影響するキー（Phase2A候補） |
|---|---|
| `/` | `collection.registered` / `collection.limited` / `collection.firstBite` / `collection.tagline` / `common.viewAll` / `common.area`（エリア一覧）/ `common.store`（店舗から探す） |
| `/foods` | `common.saleActive` / `common.limited` / `common.ended` / `common.viewAll`（一部のみ。フィルター文言の大半はPhase2C） |
| `/foods/[id]` | `common.saleActive` / `common.limited` / `common.ended` / `common.eaten` / `common.area` / `common.store` / `common.price`（一部のみ。詳細な状態ラベルはPhase2C） |
| `/eaten` | `common.eaten` / `common.remaining` / `common.limited`（一部のみ。大半はPhase2D） |
| `/areas` | （Phase2Aでは見出し「エリアから探す」等は対象外。`common.area`の参照のみ） |
| `/areas/[id]` | `area.backToList` / `area.firstPicks` / `area.firstPicksDescription` / `area.endingSoon` / `area.endingSoonDescription` / `area.remainingFoods` / `area.remainingFoodsEmpty` / `area.endedFoods` / `area.endedFoodsEmpty` / `area.endedFoodsNote` / `area.eatenFoods` / `area.eatenFoodsEmpty` / `area.salesLocations` / `area.complete` / `area.checkingNow` / `common.viewAll`（変数埋め込み系`area.remainingInArea`等はPhase2B以降） |
| `/stores` | `store.listTitle` / `store.totalCount` / `store.displaying` / `common.store` |
| `/stores/[id]` | `store.backToList` / `store.availableFoods` / `store.availableFoodsEmpty` / `common.eaten` |

Phase2Aで実際に着手するのは、上記のうち**変数を含まず・かつ複数ページで再利用される`common.*`系**を中心とする（5節参照）。

---

## 5. Implementation Phases

Phase 2全体を以下に分割する。**最初のCodex実装はPhase 2Aのみ**とする。

### Phase 2A（最初の実装対象）

- 既存`common.*`の11キーをコンポーネントに実配線する: `common.saleActive` / `common.limited` / `common.ended` / `common.eaten` / `common.area` / `common.store` / `common.viewAll` / `common.price` / `common.search`
- `common.registeredCollection` / `common.home` は3.5の重複検討後に配線（重複が確定するまで保留可）
- 変数を含まない`area.*`の見出し・空状態文言のうち、影響範囲が`/areas/[id]`に限定されるもの: `area.backToList` / `area.firstPicks` / `area.firstPicksDescription` / `area.endingSoon` / `area.endingSoonDescription` / `area.remainingFoods` / `area.remainingFoodsEmpty` / `area.endedFoods` / `area.endedFoodsEmpty` / `area.endedFoodsNote` / `area.eatenFoods` / `area.eatenFoodsEmpty` / `area.salesLocations` / `area.complete` / `area.checkingNow`
- `store.backToList` / `store.availableFoods` / `store.availableFoodsEmpty`（`/stores/[id]`のみ、影響範囲が小さい）
- `collection.firstBite` / `collection.tagline`（ホームのキャッチコピー、影響範囲はホームのみ）

対象コンポーネント（変更想定）: `components/food-card.tsx`, `components/status-badge.tsx`（または`lib/constants.ts`のラベル参照箇所）, `app/areas/[id]/page.tsx`, `components/area-collection-summary.tsx`, `components/area-eaten-foods.tsx`, `components/area-food-status-lists.tsx`, `app/stores/[id]/page.tsx`, `components/store-food-list.tsx`, `components/home-progress-client.tsx`（キャッチコピーのみ）

変数埋め込み（「あと{count}品」等）、`/foods`のフィルターUI、`/eaten`、`/areas`一覧見出し、`/stores`一覧見出しは**Phase2Aの対象外**。

### Phase 2B

- ホームの主要見出し（「今集められるフード」「期間限定コレクション」「エリア一覧」「店舗から探す」「登録済みコレクションを見る」等）
- `area.remainingInArea`等、変数埋め込みを含む文言（`t()`拡張方針の決定後）
- `/areas`一覧ページの見出し（「エリアから探す」「エリア別フード図鑑」）

### Phase 2C

- `/foods`の絞り込み・ソートUI主要ラベル（全エリア/全店舗/価格安い順・高い順/新しい順 等）
- `/foods/[id]`の状態・セクションラベル（どこで買える？/販売場所/関連商品/食べ歩き 等）
- `lib/constants.ts`の`statusLabels`/`shopTypeLabels`（Owner判断後）

### Phase 2D

- `/eaten`の各セクション見出し・絞り込みUI
- `/stores`一覧ページの見出し・件数表示
- 設定ページのデータ管理セクション（`local-data-backup-panel.tsx`）

---

## 6. Risks

- **文言取りこぼし**: 同じ日本語表現（例: 「すべて見る」「食べた」）が複数コンポーネントに分散しており、一部だけ`t()`化されて他が未対応のまま残る「中途半端な翻訳」状態になるリスク。Phase2Aでは対象ファイルを明示し、grepで該当文言の全出現箇所を洗い出してから実装することが必須。
- **翻訳キーの命名ミス・重複**: `common.registeredCollection`と新設`collection.registered`、`common.home`と既存`nav.home`のように、Phase1の`common.*`と今回の新規namespaceが意味的に重複する可能性がある。Phase2A実装前に重複キーを統合するか使い分けるかを確定させる必要がある（3.5/5節）。
- **文章中の変数**: 「あと{count}品」のような数値埋め込み文言は、`t()`が現状未対応のため、誤った文字列結合で言語ごとに不自然な語順になるリスク。Phase2Aでは対象外とすることでリスクを回避。
- **韓国語/繁体字での文字幅増加によるレイアウト崩れ**: 「このエリアで食べたフード」「すべての販売場所を見る」等、日本語では1行に収まる見出しがko/zh-TWで折り返す可能性がある。特に`line-clamp`や`min-h-*`指定のあるボタン・見出しは要確認。
- **商品名・店舗名・エリア名を誤って翻訳キー化してしまうリスク**: `area.firstPicks`（「まず食べたい3品」）のような見出し内に動的な商品名は含まれないため安全だが、実装時に近接するコード（`food.name`等の表示部分）まで誤って`t()`化しないよう、対象範囲をコードレベルで明示する必要がある。
- **`StatusBadge`等、`lib/constants.ts`に定義された定数オブジェクトの扱い**: `statusLabels`/`shopTypeLabels`は型`Record<FoodStatus, string>`等の構造を持つため、`t()`の文字列ベースの仕組みとどう統合するかは設計が必要（Phase2Cで検討、Phase2Aでは対象外）。

---

## 7. Stop and Ask

以下はClaudeが勝手に決めない。Owner判断が必要。

- 商品名翻訳（対象外の方針継続でよいか、将来的にも変更しないか）
- 店舗名翻訳（同上）
- エリア名翻訳（同上）
- URL変更（`/en` `/ko` `/zh-TW`ルートの新設、案A継続かの再確認）
- 自動翻訳・外部翻訳API利用（Phase1のOwner決定「使用しない」をPhase2でも継続するか）
- カテゴリ名・ジャンル名翻訳（`/foods`の「あまい/ちゅろす/ぽっぷこーん」等。`i18n-coverage-review-v1.md`で挙げた未確定事項）
- SEO方針（`<html lang>`の動的切替が検索エンジンのクロール・インデックスに与える影響をどう扱うか。現状はクライアント側のみの切替でSSR/メタデータはja固定だが、Phase2で多言語ページが増えた場合に方針変更が必要か）

---

## 8. Verification Plan

Phase2A実装後、以下を確認する。

- 言語: ja / en / ko / zh-TW の4言語で表示確認
- 幅: 390 / 430 / 768 / 1280 / 1920 の5幅で確認
- overflow（横スクロール・要素のはみ出し）が0であること
- clipped（テキストの途中切れ・重なり）が0であること
- 下部ナビ（モバイル）の表示崩れがないこと
- `/settings`（言語切替UI自体、Phase1の表示が壊れていないこと）
- `/`（ホーム、`collection.firstBite`/`collection.tagline`等の表示）
- `/areas/[id]`（エリア詳細、Phase2Aで最も変更点が多いページ）
- `/foods`（Phase2Aでは`common.*`の一部のみだが、`food-card.tsx`のステータスラベル表示を確認）
- `/stores/[id]`（`store.backToList`/`store.availableFoods`等）

加えて、Phase1のレビューで確立した方法（コードリード＋本番URLの独立フェッチ）で、Codexの自己申告に依存せず検証する。

---

本ドキュメントは設計のみ。Codex用 `/goal`はまだ作成しない。
