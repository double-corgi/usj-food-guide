# i18n-phase2d-a-design-v1.md

## 1. Objective

Phase 2D-A では `/eaten`（食べた記録ページ）の固定UI文言を、既存のi18n基盤（`lib/i18n/use-locale.tsx` の `useLocale().t()`、`lib/i18n/dictionaries.ts` の ja/en/ko/zh-TW辞書、`unicolle-locale` localStorage方式）に乗せて多言語化する。

対象は `components/eaten-experience.tsx` を中心とした `/eaten` ページの固定見出し・ラベル・空状態文言・並び替え選択肢・フィルター操作文言。`/eaten` から呼び出される `components/eaten-area-progress.tsx` / `components/eaten-genre-progress.tsx` の固定見出しも、`/eaten` 表示の一部として本フェーズの対象に含める（理由は2章で補足）。

商品名・店舗名・エリア名・カテゴリ/ジャンル名・価格・日付・ユーザーメモ・コレクション件数などの**データ由来の値**は一切変更しない。Phase 2C-A/2C-A.1/2C-B で確立した「固定UIラベルだけを`t()`化し、データ値はそのまま」という方針をそのまま踏襲する。

本ドキュメントは設計のみ。Codex用 `/goal` はまだ作成しない。

## 2. Translation Scope

### 2.1 翻訳する（固定UIラベル）

`components/eaten-experience.tsx`:

- ページkicker「記録アルバム」、見出し「食べた記録」、サブテキスト「これまでに食べたUSJフードを、写真で振り返る。」
- 統計行: 「食べた {{count}}品」「販売中コンプ {{rate}}%」「図鑑 {{rate}}%」「総額」「未記録」（総額未確定時のフォールバック）
- タブ: 「食べた」（既存 `common.eaten` 再利用）/「次回食べたい」（既存 `foodDetail.wantNext` 再利用）
- 次回食べたいセクション: kicker「次回の候補」、見出し「次回食べたい」（`foodDetail.wantNext`再利用）、説明文「商品詳細のボタンから保存した、次の来園で食べたいフードです。」
- 最近食べたものセクション: kicker「最近の記録」、見出し「最近食べたもの」
- 空状態（最近の記録なし）: 「まだ食べた記録がありません。」「最初の一品を探す」
- アルバムセクション: kicker「アルバム」、見出し「食べた商品一覧」、件数表示「{{shown}} / {{total}}品」
- アルバムモードのタブとその説明文: 「最近」「今月」「エリア別」「ジャンル別」「全て」＋各説明文（「新しい順」等は別キーで既存だが、ここは独自の説明文）
- 「表示を絞る」（詳細開閉トグル）
- フィルターの「全エリア」「全ジャンル」見出し相当（既存 `foods.areaFilterAll`「全エリア」/`foods.categoryFilterAll`「全ジャンル」を再利用）
- 並び替え選択肢: 「食べた日順」「価格が高い順」「価格が低い順」
- アルバム内セクション見出し（エリア別・ジャンル別モード時）の件数表示「{{total}}品中 {{count}}品」
- 該当0件時: 「条件に合う食べた記録はありません。」
- カード内「{{count}}回」（食べた回数）
- 日付未記録時のフォールバック文言「日付未記録」
- 最下部の集計説明文（「集計の考え方: 現在販売中コンプ率は〜」）

`components/eaten-area-progress.tsx`:

- kicker「エリア別進捗」、見出し「エリアごとの記録」
- 「{{count}}エリア」
- 「残り {{count}}」
- 「図鑑 {{eaten}}/{{total}}」
- リンク文言「食べた商品」「残り商品」「エリアを見る」

`components/eaten-genre-progress.tsx`:

- kicker「ジャンル別進捗」、見出し「ジャンルごとの記録」
- 「{{count}}ジャンル」
- 「残り {{count}}」
- 「図鑑 {{eaten}}/{{total}}」
- リンク文言「食べた商品」「残り商品」

> `eaten-area-progress.tsx`/`eaten-genre-progress.tsx` は今回の確認対象ファイルリストに含まれていないが、`/eaten` の最下部セクションとして常時表示されており、ユーザー指定の翻訳候補「エリアごとの記録」「残り」がここに実在する。`/eaten`の表示崩れ・未翻訳箇所を防ぐため、本設計では2ファイルをスコープに含めることを提案する。**Codexへの指示書作成前に、この2ファイルを含めてよいかオーナー確認をお願いしたい。**（5章・6章でも再掲）

### 2.2 翻訳しない（データ由来・対象外）

- 商品名・店舗名・エリア名・カテゴリ/ジャンル名そのもの（`categoryLabels`の値、`getFoodAreaSummary`等の戻り値）
- 価格表示（`formatFoodPrice`の出力）、合計金額の数値部分
- 日付フォーマット（`formatDate`の `Intl.DateTimeFormat` 出力）
- ユーザー記録メモ（`log.memo`）
- `getSaleStatusLabel`/`isCompletableFood` 等 `lib/food-utils.ts` / `lib/constants.ts` 由来のラベル・値（Phase2C-A/Bと同じ「Stop and Ask」対象として変更しない）
- `/` `/foods` `/foods/[id]` `/areas` `/areas/[id]` `/stores` `/stores/[id]` のUI（対象外ページ）

## 3. Candidate Keys

ja値は `components/eaten-experience.tsx` / `eaten-area-progress.tsx` / `eaten-genre-progress.tsx` 内の実在文言から起こした。`{{}}`はプレースホルダ。

### 3.1 `eaten.*`（新規・eaten-experience.tsx）

| key | ja（実在文言） | 備考 |
|---|---|---|
| `eaten.kicker` | 記録アルバム | ページkicker |
| `eaten.title` | 食べた記録 | h1 |
| `eaten.subtitle` | これまでに食べたUSJフードを、写真で振り返る。 | |
| `eaten.eatenCount` | 食べた {{count}}品 | 統計行 |
| `eaten.activeCompletion` | 販売中コンプ {{rate}}% | 統計行 |
| `eaten.archiveRecord` | 図鑑 {{rate}}% | 統計行 |
| `eaten.totalSpend` | 総額 | 統計行ラベル |
| `eaten.noRecordValue` | 未記録 | 総額が0のときの値 |
| `eaten.wantTabKicker` | 次回の候補 | 「次回食べたい」タブ内kicker |
| `eaten.wantDescription` | 商品詳細のボタンから保存した、次の来園で食べたいフードです。 | |
| `eaten.recentKicker` | 最近の記録 | |
| `eaten.recentTitle` | 最近食べたもの | h2 |
| `eaten.emptyTitle` | まだ食べた記録がありません。 | 空状態見出し（ユーザー候補「まだ食べた記録がありません」と一致） |
| `eaten.emptyCta` | 最初の一品を探す | 空状態CTAボタン |
| `eaten.albumKicker` | アルバム | |
| `eaten.albumTitle` | 食べた商品一覧 | h2 |
| `eaten.albumCount` | {{shown}} / {{total}}品 | |
| `eaten.albumMode.recent` | 最近 | タブラベル |
| `eaten.albumMode.recentDescription` | 新しい記録を24件まで | タブ説明 |
| `eaten.albumMode.month` | 今月 | タブラベル |
| `eaten.albumMode.monthDescription` | 今月食べた記録 | タブ説明 |
| `eaten.albumMode.area` | エリア別 | タブラベル |
| `eaten.albumMode.areaDescription` | エリアごとに整理 | タブ説明 |
| `eaten.albumMode.genre` | ジャンル別 | タブラベル |
| `eaten.albumMode.genreDescription` | ジャンルごとに整理 | タブ説明 |
| `eaten.albumMode.all` | 全て | タブラベル |
| `eaten.albumMode.allDescription` | すべての記録 | タブ説明 |
| `eaten.filterToggle` | 表示を絞る | detailsのsummary |
| `eaten.sortRecent` | 食べた日順 | select option |
| `eaten.sortPriceDesc` | 価格が高い順 | select option |
| `eaten.sortPriceAsc` | 価格が低い順| select option |
| `eaten.sectionCount` | {{total}}品中 {{count}}品 | エリア別/ジャンル別セクション見出し横 |
| `eaten.noFilterResults` | 条件に合う食べた記録はありません。 | フィルター結果0件 |
| `eaten.timesCount` | {{count}}回 | カード内 |
| `eaten.dateUnknown` | 日付未記録 | `formatDate`のフォールバック |
| `eaten.calcNote` | 集計の考え方: 現在販売中コンプ率は販売中の商品だけを母数にします。販売終了商品は図鑑全体の記録として残り、食べた履歴からは消えません。 | 最下部注記 |

既存キー再利用:

| 用途 | 再利用キー | ja値 |
|---|---|---|
| タブ「食べた」 | `common.eaten` | 食べた |
| タブ／見出し「次回食べたい」 | `foodDetail.wantNext` | 次回食べたい |
| フィルター「全エリア」 | `foods.areaFilterAll` | 全エリア |
| フィルター「全ジャンル」 | `foods.categoryFilterAll` | 全ジャンル |

### 3.2 `eaten.areaProgress.*`（新規・eaten-area-progress.tsx、要オーナー確認）

| key | ja（実在文言） |
|---|---|
| `eaten.areaProgress.kicker` | エリア別進捗 |
| `eaten.areaProgress.title` | エリアごとの記録 |
| `eaten.areaProgress.areaCount` | {{count}}エリア |
| `eaten.areaProgress.remaining` | 残り {{count}} |
| `eaten.areaProgress.archive` | 図鑑 {{eaten}}/{{total}} |
| `eaten.areaProgress.viewEaten` | 食べた商品 |
| `eaten.areaProgress.viewRemaining` | 残り商品 |
| `eaten.areaProgress.viewArea` | エリアを見る |

### 3.3 `eaten.genreProgress.*`（新規・eaten-genre-progress.tsx、要オーナー確認）

| key | ja（実在文言） |
|---|---|
| `eaten.genreProgress.kicker` | ジャンル別進捗 |
| `eaten.genreProgress.title` | ジャンルごとの記録 |
| `eaten.genreProgress.genreCount` | {{count}}ジャンル |
| `eaten.genreProgress.remaining` | 残り {{count}} |
| `eaten.genreProgress.archive` | 図鑑 {{eaten}}/{{total}} |
| `eaten.genreProgress.viewEaten` | 食べた商品 |
| `eaten.genreProgress.viewRemaining` | 残り商品 |

`eaten.areaProgress.remaining`と`eaten.genreProgress.remaining`、`eaten.areaProgress.archive`と`eaten.genreProgress.archive`、`viewEaten`/`viewRemaining`はja文言が同一だが、Phase2C-Aの`foodCard.eatenDone`/`common.eaten`重複問題の再発防止のため、コンポーネントごとに独立キーとして定義する（将来の文言差別化に対応しやすくするため）。

### 3.4 ユーザー指定候補キーとの対応・不一致

ユーザーから提示された候補キー（`eaten.title`/`eaten.emptyTitle`/`eaten.emptyDescription`/`eaten.collectionCount`/`eaten.progressRate`/`eaten.recentRecords`/`eaten.areaRecords`/`eaten.nextWant`/`eaten.viewAlbum`/`eaten.findFoods`/`eaten.noRecords`）とコード実態の対応は以下の通り。

| ユーザー候補 | コード上の実在文言 | 対応 |
|---|---|---|
| `eaten.title`（食べた記録） | 「食べた記録」 | `eaten.title`として採用 |
| `eaten.emptyTitle`（まだ食べた記録がありません） | 「まだ食べた記録がありません。」 | `eaten.emptyTitle`として採用 |
| `eaten.emptyDescription`（最初の1品を記録しましょう） | コード実在文言は「最初の一品を探す」（ボタン文言）。「最初の1品を記録しましょう」という説明文は存在しない | `eaten.emptyCta`＝「最初の一品を探す」として採用し、「最初の1品を記録しましょう」相当の独立説明文は**追加しない**（5章Stop and Ask参照） |
| `eaten.collectionCount`（コレクション数） | `/eaten`内に「コレクション数」という固定ラベルは存在しない（`home.collectionCount`はホーム側で既存定義） | `/eaten`に新規追加しない。必要であればPhase2D-Bで検討 |
| `eaten.progressRate`（達成率） | `/eaten`内に「達成率」という固定ラベルは存在しない（数値は%表示のみ、ラベルなし） | 新規追加しない |
| `eaten.recentRecords`（最近食べたフード） | 実在文言は「最近食べたもの」（h2） | `eaten.recentTitle`＝「最近食べたもの」として採用。「最近食べたフード」への文言変更は行わない（5章参照） |
| `eaten.areaRecords`（エリアごとの記録） | `eaten-area-progress.tsx`のh2「エリアごとの記録」と完全一致 | `eaten.areaProgress.title`として採用（3.2、オーナー確認待ち） |
| `eaten.nextWant`（次回食べたい） | 既存`foodDetail.wantNext`＝「次回食べたい」と完全一致 | 新規キー追加せず既存キーを再利用 |
| `eaten.viewAlbum`（アルバムを見る） | `/eaten`内に「アルバムを見る」というボタン・リンクは存在しない | 新規追加しない（5章参照） |
| `eaten.findFoods`（探しに行く） | 実在文言は「最初の一品を探す」のみ。「探しに行く」という独立ボタンは存在しない | `eaten.emptyCta`に統合、別キー追加しない |
| `eaten.noRecords`（表示する記録がありません） | 実在文言は「条件に合う食べた記録はありません。」 | `eaten.noFilterResults`として採用 |

## 4. Page Impact

- `components/eaten-experience.tsx`: `"use client"`コンポーネントの先頭で `useLocale()` を呼び、`t()`を全固定文言に適用。プレースホルダ（`{{count}}`/`{{rate}}`/`{{shown}}`/`{{total}}`/`{{eaten}}`）はPhase2C-Bと同じ`replaceAll`方式で渡す。`albumModes`配列はラベル・説明文を`t()`参照に置き換える（配列定義箇所をコンポーネント内に移すか、idのみの配列＋`t()`マップに変更する設計判断はCodex側で行うが、ja文言を変更しないこと）。
- `app/eaten/page.tsx`: サーバーコンポーネントのままで変更不要（`EatenExperience`はクライアント側で`useLocale`を使う）。
- `components/eaten-area-progress.tsx` / `components/eaten-genre-progress.tsx`: 2.1で挙げた通り、オーナー承認が得られれば`"use client"`化（または既にクライアントかどうか確認）＋`useLocale()`導入が必要。承認が得られない場合は本フェーズの対象外とし、`/eaten`内のこの2セクションは日本語のまま残る（Phase2D-Bへ持ち越し）。
- `lib/i18n/dictionaries.ts`: `eaten.*`（および承認されれば`eaten.areaProgress.*`/`eaten.genreProgress.*`）キーをja/en/ko/zh-TWの4言語に追加。既存キーとの重複は3章で確認済み（重複なし）。
- `/foods`(Phase2C-A) / `/foods/[id]`(Phase2C-B) / ホーム / area-detail には変更を加えない。

## 5. Risks

- **0品状態の文言が長くなる**: 「まだ食べた記録がありません。」「最初の一品を探す」は en/ko/zh-TWで文字数が増える可能性がある。空状態カードは`rounded-[1.35rem] border border-dashed`の固定幅エリアなので、390px幅で2行以内に収まるか確認が必要。
- **韓国語/繁体字でカード幅が伸びる**: アルバムモードタブ（「エリア別」「ジャンル別」等）や並び替えセレクトの文言が長くなると、`-mx-4 flex gap-2 overflow-x-auto`の横スクロール領域や`<select>`の固定高さ`h-11`内でテキストが折り返す可能性がある。
- **商品名とUIラベルを混同する**: `EatenAlbumCard`/`NextWantCard`内の`food.name`・`getFoodAreaSummary(food)`・`formatFoodPrice(food)`は翻訳対象外。`t()`化は見出し・ラベル・空状態文言のみに限定する必要がある。
- **日付や記録メモを誤って翻訳対象にする**: `log.memo`（ユーザー入力）、`formatDate(log.eatenAt)`（`Intl.DateTimeFormat`出力）は翻訳しない。「日付未記録」という**フォールバック文言のみ**`t()`化し、日付フォーマット自体（`month: "numeric", day: "numeric", weekday: "short"`）は変更しない。
- **既存の記録データに触ってしまうリスク**: `useFoodLogs`/`localStorage`の記録データ（`UserFoodLog`）構造やキー名には一切触れない。文言の`t()`化のみで、ロジック・データ構造変更は行わない。
- **`eaten-area-progress.tsx`/`eaten-genre-progress.tsx`をスコープに含めるかどうかの判断遅延リスク**: 2.1で述べた通り、この2ファイルは元の確認対象リストに含まれていない。含めない場合、`/eaten`下部に日本語のまま残るセクションが生じ、ページ内で言語が混在する見た目になる。Codex指示書作成前にオーナー判断が必要。

## 6. Stop and Ask

以下はCodex指示書作成時点でも、Claude側で勝手に決めない。

- 商品名翻訳・店舗名翻訳・エリア名翻訳・カテゴリ/ジャンル名翻訳（一切しない、確認のみ）
- 日付フォーマット変更（`formatDate`の`Intl.DateTimeFormat`オプションは変更しない）
- ユーザー記録メモ（`log.memo`）の翻訳（しない）
- URL変更・ロケールルート追加（しない）
- 自動翻訳・外部翻訳API利用（しない）
- 記録データ（`UserFoodLog`、localStorage）の修正（しない）
- **`eaten-area-progress.tsx`/`eaten-genre-progress.tsx`を本フェーズに含めるか**（2.1・5章で提起。オーナー判断待ち）
- ユーザー候補にあった「最初の1品を記録しましょう」「コレクション数」「達成率」「アルバムを見る」「最近食べたフード」への文言変更・新規追加（コード実態と不一致のため、3.4の通り**現状の実在文言ベースで`/goal`を作る**ことを推奨。文言自体を変更したい場合は別途デザイン変更として扱う）

## 7. Verification Plan

実装後（`/goal`作成・Codex実装後）の確認観点として以下を予定する。

- 確認言語: ja / en / ko / zh-TW
- 確認幅: 390 / 430 / 768 / 1280 / 1920px
- 確認ページ: `/eaten`（メイン対象）、`/settings`（言語切替の起点）、`/`、`/foods`、`/foods/[id]`（非破壊確認）
- 表示確認項目:
  - 横スクロールが発生しないこと（overflow 0 / clipped 0）
  - `/eaten`の統計行・タブ・空状態・アルバムセクション・並び替え・エリア別/ジャンル別進捗（対象に含めた場合）がja/en/ko/zh-TWで正しく表示されること
  - 商品名・店舗名・エリア名・カテゴリ/ジャンル名・価格・日付フォーマット・ユーザーメモが翻訳されていないこと
  - 「食べた」/「次回食べたい」タブの既存キー再利用が`foodCard`/`foodDetail`系と表記揺れを起こしていないこと
  - 0件状態（記録なし／フィルター該当なし）の文言が390px幅で崩れないこと
  - ユーザーの既存記録データ（`localStorage`の`UserFoodLog`）が変更・消失していないこと

## 8. Next Steps

本ドキュメントはPhase 2D-Aの設計のみ。Codex用 `/goal`（`codex-goal-i18n-phase2d-a.md`）は、6章「`eaten-area-progress.tsx`/`eaten-genre-progress.tsx`を含めるか」についてオーナー判断を得たうえで、別途作成する。
