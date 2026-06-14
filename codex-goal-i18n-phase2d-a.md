# codex-goal-i18n-phase2d-a.md

## 0. 役割・前提

このドキュメントは Codex 実装用の指示書である。Claude は設計・レビュー担当であり、実装は行わない。

Phase 2C-A / 2C-A.1 / 2C-B は承認・証跡commit済み。本フェーズ（Phase 2D-A）は `/eaten`（食べた記録ページ）の固定UI文言だけを多言語化する。

設計の詳細根拠は `docs/i18n-phase2d-a-design-v1.md` を参照すること。本指示書はその設計を実装可能な形に整理したものであり、内容に矛盾がある場合は本指示書を優先する。

## 1. 対象範囲

### 1.1 対象ページ

- `/eaten`（`app/eaten/page.tsx` → `components/eaten-experience.tsx`）
- `/eaten` の下部に常時表示される `components/eaten-area-progress.tsx` / `components/eaten-genre-progress.tsx` の固定見出し・ラベルも対象に含める（`/eaten` 表示の一部のため）

### 1.2 対象外ページ（一切変更しない）

- `/`
- `/foods`
- `/foods/[id]`
- `/areas`
- `/areas/[id]`
- `/stores`
- `/stores/[id]`

`components/food-card.tsx` / `components/food-grid.tsx` は確認対象として参照してよいが、**変更してはいけない**（Phase 2C-A/2C-Bの実装内容を壊さないこと）。

## 2. 翻訳対象キーの設計

以下は `components/eaten-experience.tsx` / `components/eaten-area-progress.tsx` / `components/eaten-genre-progress.tsx` の実装コードに実在する文言だけを対象にした候補キー一覧である。**実装前に必ず該当ファイルの該当箇所を読み、文言が完全一致することを確認してから`t()`化すること。** 一致しない場合や該当箇所が見つからない場合は、その項目を追加せず本報告でその旨を報告すること（新規UI文言の追加は禁止）。

### 2.1 新規キー: `eaten.*`（`components/eaten-experience.tsx`）

| key | ja値（実在文言） | 用途 |
|---|---|---|
| `eaten.kicker` | 記録アルバム | ページkicker |
| `eaten.title` | 食べた記録 | h1見出し |
| `eaten.subtitle` | これまでに食べたUSJフードを、写真で振り返る。 | サブテキスト |
| `eaten.eatenCount` | 食べた {{count}}品 | 統計行（プレースホルダ`{{count}}`） |
| `eaten.activeCompletion` | 販売中コンプ {{rate}}% | 統計行（プレースホルダ`{{rate}}`） |
| `eaten.archiveRecord` | 図鑑 {{rate}}% | 統計行（プレースホルダ`{{rate}}`） |
| `eaten.totalSpend` | 総額 | 統計行ラベル |
| `eaten.noRecordValue` | 未記録 | 総額が0/未確定時のフォールバック値 |
| `eaten.wantTabKicker` | 次回の候補 | 「次回食べたい」タブ内kicker |
| `eaten.wantDescription` | 商品詳細のボタンから保存した、次の来園で食べたいフードです。 | 説明文 |
| `eaten.recentKicker` | 最近の記録 | セクションkicker |
| `eaten.recentTitle` | 最近食べたもの | h2見出し |
| `eaten.emptyTitle` | まだ食べた記録がありません。 | 空状態見出し |
| `eaten.emptyCta` | 最初の一品を探す | 空状態CTAボタン |
| `eaten.albumKicker` | アルバム | セクションkicker |
| `eaten.albumTitle` | 食べた商品一覧 | h2見出し |
| `eaten.albumCount` | {{shown}} / {{total}}品 | 件数表示（プレースホルダ`{{shown}}`/`{{total}}`） |
| `eaten.albumMode.recent` | 最近 | アルバムモードタブラベル |
| `eaten.albumMode.recentDescription` | 新しい記録を24件まで | アルバムモードタブ説明文 |
| `eaten.albumMode.month` | 今月 | アルバムモードタブラベル |
| `eaten.albumMode.monthDescription` | 今月食べた記録 | アルバムモードタブ説明文 |
| `eaten.albumMode.area` | エリア別 | アルバムモードタブラベル |
| `eaten.albumMode.areaDescription` | エリアごとに整理 | アルバムモードタブ説明文 |
| `eaten.albumMode.genre` | ジャンル別 | アルバムモードタブラベル |
| `eaten.albumMode.genreDescription` | ジャンルごとに整理 | アルバムモードタブ説明文 |
| `eaten.albumMode.all` | 全て | アルバムモードタブラベル |
| `eaten.albumMode.allDescription` | すべての記録 | アルバムモードタブ説明文 |
| `eaten.filterToggle` | 表示を絞る | `<details><summary>`の絞り込みトグル |
| `eaten.sortRecent` | 食べた日順 | 並び替えselectのoption |
| `eaten.sortPriceDesc` | 価格が高い順 | 並び替えselectのoption |
| `eaten.sortPriceAsc` | 価格が低い順 | 並び替えselectのoption |
| `eaten.sectionCount` | {{total}}品中 {{count}}品 | エリア別/ジャンル別モードのセクション見出し横（プレースホルダ`{{total}}`/`{{count}}`） |
| `eaten.noFilterResults` | 条件に合う食べた記録はありません。 | フィルター結果0件時 |
| `eaten.timesCount` | {{count}}回 | カード内の食べた回数（プレースホルダ`{{count}}`） |
| `eaten.dateUnknown` | 日付未記録 | `formatDate`関数の未設定時フォールバック |
| `eaten.calcNote` | 集計の考え方: 現在販売中コンプ率は販売中の商品だけを母数にします。販売終了商品は図鑑全体の記録として残り、食べた履歴からは消えません。 | 最下部の注記文 |

### 2.2 新規キー: `eaten.areaProgress.*`（`components/eaten-area-progress.tsx`）

| key | ja値（実在文言） | 用途 |
|---|---|---|
| `eaten.areaProgress.kicker` | エリア別進捗 | セクションkicker |
| `eaten.areaProgress.title` | エリアごとの記録 | h2見出し |
| `eaten.areaProgress.areaCount` | {{count}}エリア | エリア数表示（プレースホルダ`{{count}}`） |
| `eaten.areaProgress.remaining` | 残り {{count}} | 各エリアカード内の残り数（プレースホルダ`{{count}}`） |
| `eaten.areaProgress.archive` | 図鑑 {{eaten}}/{{total}} | 各エリアカード内の図鑑進捗（プレースホルダ`{{eaten}}`/`{{total}}`） |
| `eaten.areaProgress.viewEaten` | 食べた商品 | リンク文言 |
| `eaten.areaProgress.viewRemaining` | 残り商品 | リンク文言 |
| `eaten.areaProgress.viewArea` | エリアを見る | リンク文言 |

### 2.3 新規キー: `eaten.genreProgress.*`（`components/eaten-genre-progress.tsx`）

| key | ja値（実在文言） | 用途 |
|---|---|---|
| `eaten.genreProgress.kicker` | ジャンル別進捗 | セクションkicker |
| `eaten.genreProgress.title` | ジャンルごとの記録 | h2見出し |
| `eaten.genreProgress.genreCount` | {{count}}ジャンル | ジャンル数表示（プレースホルダ`{{count}}`） |
| `eaten.genreProgress.remaining` | 残り {{count}} | 各ジャンルカード内の残り数（プレースホルダ`{{count}}`） |
| `eaten.genreProgress.archive` | 図鑑 {{eaten}}/{{total}} | 各ジャンルカード内の図鑑進捗（プレースホルダ`{{eaten}}`/`{{total}}`） |
| `eaten.genreProgress.viewEaten` | 食べた商品 | リンク文言 |
| `eaten.genreProgress.viewRemaining` | 残り商品 | リンク文言 |

`eaten.areaProgress.*`と`eaten.genreProgress.*`はja値が一部重複する（「残り {{count}}」「図鑑 {{eaten}}/{{total}}」「食べた商品」「残り商品」）が、Phase2C-Aで発生した`foodCard.eatenDone`/`common.eaten`の重複問題（en/zh-TWで同一訳語になり意味が区別できなくなった事例）の再発防止のため、**意図的に別キーとして定義する**こと。キーを共通化・統合しないこと。

### 2.4 既存キーの再利用

| 用途 | 再利用キー | ja値 |
|---|---|---|
| タブ「食べた」 | `common.eaten` | 食べた |
| タブ／見出し「次回食べたい」 | `foodDetail.wantNext` | 次回食べたい |
| フィルターセレクトの「全エリア」 | `foods.areaFilterAll` | 全エリア |
| フィルターセレクトの「全ジャンル」 | `foods.categoryFilterAll` | 全ジャンル |

これらは新規キーを追加せず、既存の`lib/i18n/dictionaries.ts`内のキーをそのまま参照すること。

### 2.5 ユーザー提示候補との対応・注意事項

オーナーから提示された翻訳候補のうち、以下はコード実態に存在しないため**新規UI文言として追加しないこと**。

- 「最初の1品を記録しましょう」→ 実在するのは「最初の一品を探す」（`eaten.emptyCta`として採用）。新しい説明文を追加しない。
- 「コレクション数」「達成率」→ `/eaten`に該当する固定ラベルは存在しない。新規追加しない。
- 「最近食べたフード」→ 実在するのは「最近食べたもの」（`eaten.recentTitle`として採用）。文言自体は変更しない。
- 「アルバムを見る」→ `/eaten`に該当するボタン・リンクは存在しない。新規追加しない。
- 「探しに行く」→ 実在するのは「最初の一品を探す」のみ（`eaten.emptyCta`に統合）。
- 「表示する記録がありません」→ 実在するのは「条件に合う食べた記録はありません。」（`eaten.noFilterResults`として採用）。
- 「記録済み」→ `/eaten`の固定UIラベルとして該当箇所が見つからない場合は追加しない。見つかった場合のみ、本報告でその対応箇所と採用キー名を報告すること。
- 「エリアごとの記録」→ `eaten-area-progress.tsx`のh2と完全一致のため`eaten.areaProgress.title`として採用。
- 「販売中」「販売終了」→ 既存`common.saleActive`/`common.ended`を再利用（新規キー追加禁止）。
- 「残り」→ `eaten.areaProgress.remaining`/`eaten.genreProgress.remaining`として2.2/2.3の通り採用。

候補リストにある文言と一致する実装箇所が見つからない場合、無理に新しいUI要素・ラベルを追加しないこと。その場合は最終報告の「翻訳対象にした範囲」「翻訳対象外にした範囲」で、見つからなかった候補とその理由を明記すること。

## 3. 翻訳してはいけないもの

以下は絶対に翻訳・変更しない。

- 商品名（`food.name`）
- 店舗名・エリア名（`getFoodAreaSummary`等の戻り値、`area.name`、areaFilterのoption値等）
- カテゴリ名・ジャンル名（`categoryLabels`の値、カテゴリフィルターのoption値）
- 商品説明
- ユーザー投稿コメント・記録メモ（`log.memo`）
- 価格そのもの（`formatFoodPrice`の出力、合計金額の数値部分）
- 日付フォーマット（`formatDate`関数の`Intl.DateTimeFormat`オプション・出力形式。「日付未記録」という**フォールバック文言のみ**`eaten.dateUnknown`として`t()`化してよいが、日付が存在する場合の表示形式は変更しないこと）
- 画像内テキスト
- generated JSON由来の商品データ全般

`lib/food-utils.ts` / `lib/constants.ts` 由来の関数戻り値（`getSaleStatusLabel`、`categoryLabels`等）はPhase2C-A/2C-Bと同じ方針で**変更・翻訳しない**こと。

## 4. URL・ロケール方針

- URL構造は変更しない。
- `/en` `/ko` `/zh-TW` のロケールルートは追加しない。
- 新しいルーティングを追加しない。SEO対応・App Store文言対応も行わない。
- 引き続き`localStorage`の`unicolle-locale`キーとイベント（`unicolle-locale-change`）を使用する。新しい保存方式・新しい仕組みは作らない。

## 5. 実装方針

- 既存のi18n基盤（`lib/i18n/use-locale.tsx`の`useLocale()`、`t(key, params?)`、3段フォールバック ja→キー）をそのまま使う。
- `components/eaten-experience.tsx`は既に`"use client"`なので、コンポーネント先頭で`useLocale()`を呼び出し、`t()`を2.1の対象文言に適用する。プレースホルダは既存の`{{placeholder}}`形式・`replaceAll`方式に合わせる。
- `albumModes`配列（ラベル・説明文の定義）は、`t()`を使えるようにコンポーネント内に移すか、idと`t()`キーのマッピングに変更してよい。ただしja表示文言自体は変更しないこと。
- `components/eaten-area-progress.tsx` / `components/eaten-genre-progress.tsx` が現在`"use client"`でない場合は、`useLocale()`を使うために`"use client"`化してよい。それ以外の構造（データ取得・計算ロジック）は変更しないこと。
- `lib/i18n/dictionaries.ts`に2.1〜2.3のキーをja/en/ko/zh-TWの4言語すべてに追加する。既存キーとの重複がないことを追加前に確認すること（Phase2C-Bまでの既存キー一覧は`docs/design-review-i18n-phase2c-b.md`等を参照）。
- 辞書のキー構造・命名規則は既存の`foods.*`/`foodDetail.*`/`area.*`等の階層命名パターンに合わせること（例: `eaten.albumMode.recent`のようなネスト表現が既存辞書の型定義で許容されているか確認し、許容されていない場合はフラットなキー名（例: `eaten.albumModeRecent`）に変更してよい。型定義に合わせて調整し、ja値・用途は変更しないこと）。
- en/ko/zh-TWの訳語は、Phase2C-A/2C-A.1/2C-Bで使われている語調・トーン（カジュアルだが情報として明確）に合わせること。

## 6. 確認対象ファイル

以下を確認すること。存在しないファイルは無視し、実在する構成に合わせる。

- `docs/i18n-design-v1.md`
- `docs/i18n-coverage-review-v1.md`
- `docs/i18n-phase2-design-v1.md`
- `docs/i18n-phase2d-a-design-v1.md`
- `docs/design-review-i18n-phase2c-b.md`
- `lib/i18n/dictionaries.ts`
- `lib/i18n/use-locale.tsx`
- `app/eaten/page.tsx`
- `components/eaten-experience.tsx`
- `components/eaten-area-progress.tsx`
- `components/eaten-genre-progress.tsx`
- `components/food-card.tsx`（変更禁止、参照のみ）
- `components/food-grid.tsx`（変更禁止、参照のみ）

## 7. 禁止事項

- `/foods`の改修
- `/foods/[id]`の改修
- `/areas`の改修
- `/areas/[id]`の改修
- `/stores`の改修
- `/stores/[id]`の改修
- 商品名翻訳
- 店舗名翻訳
- エリア名翻訳
- カテゴリ名翻訳
- ジャンル名翻訳
- ユーザー記録メモ（`log.memo`）の翻訳
- 日付フォーマットの変更
- 外部翻訳APIの利用
- 自動翻訳
- DB変更
- generated JSONの変更
- crawlerの変更
- URL構造の変更
- ホームv1.2のデザイン変更
- area-detail-v1.1のデザイン変更
- 大規模リファクタ
- 本タスクと無関係な整形・変更

## 8. 検証要件

以下を必ず実行すること。

```
npm run lint
npm run typecheck
npm run build
```

すべて成功させること。エラーが出た場合は修正してから完了報告すること。

### 8.1 確認ページ

- `/eaten`
- `/settings`
- `/`
- `/foods`
- `/foods/[id]`
- `/areas/[id]`

### 8.2 確認言語

- ja
- en
- ko
- zh-TW

### 8.3 確認幅

- 390px
- 430px
- 768px
- 1280px
- 1920px

### 8.4 確認項目

- `/eaten`の固定UI文言（2.1〜2.3で定義した範囲）が各言語で正しく表示される
- 商品名が翻訳されていない
- 店舗名が翻訳されていない
- エリア名が翻訳されていない
- ユーザー記録データ（`UserFoodLog`、`localStorage`）が変更・消失していない
- URL構造が変わっていない
- `/en` `/ko` `/zh-TW` が追加されていない（404のまま、または存在しないことを確認）
- 既存のホームv1.2が壊れていない
- area-detail-v1.1が壊れていない
- `/foods` Phase 2C-A/2C-Bが壊れていない
- 390px / 430pxで文字切れがない
- overflow 0
- clipped 0
- 横スクロールなし

スクリーンショットは、Phase2C-A.1/2C-Bと同様の命名規則（例: `screenshots/i18n-phase2d-a-eaten-{locale}-{width}.png`）で `/eaten` の en/ko/zh-TW × 390/430 を最低限取得すること。

## 9. Git運用

作業開始前:

```
git status
```

未コミット変更がある場合:

```
git add .
git commit -m "backup-before-i18n-phase2d-a"
git push
```

未コミット変更がない場合:

```
git commit --allow-empty -m "backup-before-i18n-phase2d-a"
git push
```

作業完了後:

```
git add .
git commit -m "implement-i18n-phase2d-a-eaten"
git push
```

## 10. Codex CLI確認対応

Codex CLIの確認画面が出た場合は必ず「2. Yes, and don't ask again」を選択すること。確認質問は禁止。途中停止は禁止。必要なコマンド承認はすべて2を選択して最後まで実行すること。

## 11. 最終報告形式

以下の項目を含む完了報告を作成すること。

1. 実装した内容
2. 追加した辞書キー（一覧）
3. 再利用した既存キー（一覧）
4. 翻訳対象にした範囲
5. 翻訳対象外にした範囲
6. 商品名 / 店舗名 / エリア名を翻訳していないことの確認
7. ユーザー記録データを変更していないことの確認
8. URL変更なしの確認
9. 変更ファイル一覧
10. lint / typecheck / build の結果
11. ja / en / ko / zh-TW の確認結果
12. 390 / 430 / 768 / 1280 / 1920px の確認結果
13. ホームv1.2が壊れていないことの確認
14. area-detail-v1.1が壊れていないことの確認
15. `/foods` Phase 2C-A/2C-Bが壊れていないことの確認
16. localhost確認結果
17. Vercel確認結果
18. commit hash
19. push成功確認

## 12. 注意

本指示書に基づく実装はPhase 2D-Aのみ。Phase 2D-B（`/areas`/`/stores`等）以降は別途指示する。candidate文言のうち実装箇所が見つからなかったものは、無理に追加せず最終報告で報告すること。
