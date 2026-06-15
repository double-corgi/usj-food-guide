# codex-goal-i18n-phase2d-c.md

## 0. 役割・前提

- 本ドキュメントは i18n Phase 2D-C（`/stores` 一覧ページの固定UI文言の多言語化）の実装指示です。
- 設計の根拠は `docs/i18n-phase2d-c-design-v1.md`。実装前に必ず確認してください。実装範囲・キー設計はこの設計書に完全準拠してください。
- 既存の i18n 基盤（`LocaleProvider` / `useLocale` / `t(key, params?)`、ja → 3段フォールバック、`{{placeholder}}` 補間、`localStorage` の `unicolle-locale`、`unicolle-locale-change` イベント）をそのまま使用し、新しい仕組みは作らないでください。
- 本フェーズの対象は **`/stores`（店舗一覧ページ）の固定UI文言だけ** です。

## 1. 対象範囲

### 1.1 対象ファイル（in-scope）

- `app/stores/page.tsx`
- 新規追加: `/stores`専用の`"use client"`コンポーネント（後述5章。ファイル名はあなたの判断で構いませんが、例: `components/stores-overview.tsx`）
- `lib/i18n/dictionaries.ts`（新規キー追加のみ）

### 1.2 変更禁止ファイル・対象外ページ（out-of-scope。一切変更しないこと）

- `/`（`app/page.tsx`、`components/home-dashboard.tsx`等のhome用コンポーネント）
- `/foods`、`/foods/[id]`
- `/eaten`（`components/eaten-experience.tsx`、`components/eaten-area-progress.tsx`、`components/eaten-genre-progress.tsx`）
- `/areas`、`/areas/[id]`（`components/area-overview.tsx`を含む）
- `/stores/[id]`
- `lib/store-utils.ts`（2.2参照。表示文言の参照のみ行い、関数自体・返り値は変更しないこと）
- `lib/repositories/foods.ts`等のデータ取得・generated JSON関連ファイル

これらのファイル・ページに対する変更（リファクタ・インポート整理・フォーマット変更を含む）は一切行わないでください。

## 2. 追加するキー（新規namespace `stores.*`）

`lib/i18n/dictionaries.ts`に新規namespace `stores.*` を追加してください。`/stores/[id]`で使われている既存の`store.*`（単数）とは別namespaceです。混同・統合・リネームしないこと。

### 2.1 追加するキー一覧（ja値は現状のリテラル文言と完全一致させること）

| key | ja | 用途・配置 |
|---|---|---|
| `stores.kicker` | `レストラン / フードカート` | `app/stores/page.tsx` のページ上部kicker |
| `stores.title` | `店舗一覧` | `app/stores/page.tsx` のh1タイトル |
| `stores.areaStoreCount` | `{{count}}店舗` | 各エリアグループ見出し横の店舗数。`{{count}}` = `areaStores.length` |
| `stores.listSummary` | `表示中 1 - {{count}}件　合計 {{count}}件` | ページ下部の件数表示。`{{count}}` = `stores.length`（同じパラメータを2回展開する。先頭の"1"は固定値としてja/en/ko/zh-TWいずれも文言内に固定文字として含める） |

計4キー。`ja`/`en`/`ko`/`zh-TW` の4言語分、計16エントリを追加してください。

en/ko/zh-TWの値は、既存の`store.*`・`area.*`・`areas.*`等で使われている語彙・トーンと一貫性を持たせ、自然な訳にしてください（直訳調・機械翻訳調を避ける）。`stores.areaStoreCount`は英語で`{{count}}`が1の場合に単数形になるかどうかなど、不自然にならない範囲であなたの判断で訳文を決定してください（無理に複数形分岐の仕組みを新設する必要はありません）。

### 2.2 既存キーの扱い（変更・流用禁止）

- `store.*`（`/stores/[id]`用、`store.backToList`="店舗一覧へ戻る"、`store.availableFoods`="この店舗で買える商品"等）は変更・リネーム・流用禁止。
- `common.saleActive`（"販売中"）、`common.ended`（"販売終了"）は変更・流用禁止。`/stores`一覧には販売中/終了の状態表示は現状ないため、新規に追加・使用しないこと。
- `area.*`、`areas.*`、`eaten.*`、`nav.*`、`footer.*`は変更・流用禁止。

## 3. 翻訳対象

`app/stores/page.tsx`内の以下4箇所のみを`t()`で置き換えてください。

```tsx
<p className="text-xs font-black text-park">レストラン / フードカート</p>
// → {t("stores.kicker")}

<h1 className="text-3xl font-black tracking-tight text-ink md:text-4xl">店舗一覧</h1>
// → {t("stores.title")}

<p className="shrink-0 text-xs font-bold text-slate-400">{areaStores.length}店舗</p>
// → {t("stores.areaStoreCount", { count: areaStores.length })}

<p className="border-t border-slate-200 pt-5 text-xs font-bold text-slate-400">
  表示中 1 - {stores.length}件　合計 {stores.length}件
</p>
// → {t("stores.listSummary", { count: stores.length })}
```

上記4箇所以外に新規の翻訳対象を追加しないでください。

## 4. 翻訳対象外（絶対に翻訳・変更しないこと）

- 店舗名（`store.name`、`StoreRow`内の`<h3>{store.name}</h3>`）
- エリア名（`areaName`、各エリアグループの見出し`<h2>`）
- 商品名（`representativeFood`等）
- カテゴリ名・ジャンル名
- 商品説明・価格・日付
- generated JSON由来の商品データ（`listFoods()`、`buildStoresFromFoods()`等のデータ取得・構築ロジック）
- 画像内テキスト
- `lib/store-utils.ts`の`getStoreSummary()`・`getStoreBadge()`・`getStoreTypeLabel()`が返す文言（例:「アイスクリーム専門店」「ハンバーガーレストラン」「フードカート」「レストラン」「フード施設」「ポップコーン」「カフェ」「スイーツ / スナック」等）。これらはPhase2A以降確立済みの「Stop and Ask」非翻訳方針（`lib/food-utils.ts`・`lib/constants.ts`と同様の扱い）の対象です。`lib/store-utils.ts`自体を変更しないこと（関数のリネーム・引数追加・返り値の翻訳化は一切禁止）。

## 5. 実装方針（サーバー/クライアント分離）

`app/stores/page.tsx`は`async function`のサーバーコンポーネント（`"use client"`なし）であり、`useLocale`はクライアント専用（`"use client"`）のため直接呼び出せません。

Phase2D-A（`/eaten`）・Phase2D-B（`/areas`）で確立したパターンに揃え、以下の構成にしてください。

1. `app/stores/page.tsx`は、データ取得（`listFoods()`、`buildStoresFromFoods()`、`groupStoresByArea()`等）のみを担うサーバーコンポーネントのまま維持する。
2. 現在`app/stores/page.tsx`内に直接書かれている表示用JSX（ページ全体のレイアウト、kicker/タイトル、エリアグループのループ、`StoreRow`、ページ下部の件数表示）を、新規の`"use client"`コンポーネントに移動する。`useLocale`の`t()`はこの新規コンポーネント内で使用する。
3. **重要（Phase2D-Bでの指摘事項への対応）**: 新規作成するクライアントコンポーネントは、`/stores`専用とし、他のページ（`/`、`/areas`、`/eaten`等）と共用しないこと。`components/area-overview.tsx`（`AreaOverview`）のように複数ページから呼び出される既存コンポーネントへ、本フェーズの新規文言・新規JSXを混ぜ込むことは禁止です。新規コンポーネントは`/stores`からのみimportしてください。
4. `StoreRow`・`groupStoresByArea`は、現状のロジックを保ったまま新規クライアントコンポーネント内に移動するか、もしくは現状通り同ファイル内のヘルパーとして維持して構いません（ロジック自体の変更は不要、配置のみ調整）。
5. 新しいi18nの仕組み（新Context、サーバー側辞書取得APIの新設等）は作らないこと。

## 6. URL・ロケール方針

- URL構造（`/stores`、`/stores/[id]`へのリンク`/stores/${store.id}`等）は変更しないこと。
- `/en`、`/ko`、`/zh-TW`等のロケール別ルートは追加しないこと。
- 既存の`localStorage`キー`unicolle-locale`、イベント`unicolle-locale-change`、`document.documentElement.lang`の同期ロジックは変更しないこと。

## 7. 確認対象ファイル

実装前に以下を確認してください（存在しないファイルは無視）。

- `docs/i18n-phase2d-c-design-v1.md`
- `docs/i18n-design-v1.md`
- `docs/i18n-coverage-review-v1.md`
- `docs/i18n-phase2-design-v1.md`
- `docs/design-review-i18n-phase2d-b.md`（Phase2D-Bでの共用コンポーネント混入の指摘を必ず確認すること）
- `lib/i18n/dictionaries.ts`
- `lib/i18n/use-locale.tsx`
- `lib/i18n/locales.ts`
- `app/stores/page.tsx`
- `app/areas/page.tsx`・`components/area-overview.tsx`（サーバー/クライアント分離の参考。ただし変更禁止）
- `lib/store-utils.ts`（参照のみ、変更禁止）

## 8. 禁止事項

- `/`、`/foods`、`/foods/[id]`、`/eaten`、`/areas`、`/areas/[id]`、`/stores/[id]`への変更
- 店舗名・エリア名・商品名・カテゴリ名・ジャンル名・商品説明・価格・日付・generated JSONデータの翻訳・変更
- `lib/store-utils.ts`の関数・返り値の変更（翻訳含む）
- `store.*`（単数、`/stores/[id]`用）、`common.saleActive`、`common.ended`、`area.*`、`areas.*`、`eaten.*`、`nav.*`、`footer.*`の既存キーの変更・リネーム・流用
- 新規クライアントコンポーネントを`/stores`以外のページ・既存共用コンポーネント（`AreaOverview`等）と共用すること
- 新しいi18n仕組み（新Context、新ルーティング、サーバー側辞書取得APIの新設等）の追加
- `/en`、`/ko`、`/zh-TW`ルートの追加、SEO対応、App Store文言対応
- 自動翻訳・外部翻訳APIの使用
- DB変更、generated JSON変更、crawler変更
- 「エリアで絞り込む」「表示する店舗がありません」「店舗から探す」「販売店舗」「この店舗で買える商品」「取り扱いフード」「詳細を見る」「販売中」「販売終了」等、`/stores`一覧に実在しない文言・UI要素の新規追加

## 9. Stop and Ask

以下に該当する状況が発生した場合は、実装を進めず報告してください（推測で進めないこと）。

- `app/stores/page.tsx`の構造が本ドキュメント記載と異なり、5章のサーバー/クライアント分離パターンをそのまま適用できない場合。
- `lib/store-utils.ts`の関数を変更しないと2.1のキー追加が成立しない場合。
- 2.1の4キー以外に、翻訳しないと表示が破綻する固定UI文言が見つかった場合（その場合は追加せず、見つかった文言と理由を最終報告に記載すること）。
- `stores.areaStoreCount`・`stores.listSummary`の`{{count}}`補間が、既存の`replaceAll`方式（同名プレースホルダー複数回展開）で意図通り動作しない場合。

## 10. 検証要件

### 10.1 ビルド・静的検証

- `npm run lint`
- `npm run typecheck`（存在する場合）
- `npm run build`

### 10.2 表示確認

- 言語: ja / en / ko / zh-TW
- 幅: 390 / 430 / 768 / 1280 / 1920
- 対象ページ: `/stores`（メイン）。回帰確認として`/`、`/stores/[id]`（任意の1店舗）、`/areas`、`/eaten`、`/foods`をjaで表示確認。

### 10.3 確認項目

1. `/stores`のkicker「レストラン / フードカート」相当、タイトル「店舗一覧」相当、各エリアグループの「{{count}}店舗」相当、ページ下部の「表示中 1 - {{count}}件　合計 {{count}}件」相当が、ja/en/ko/zh-TWで切り替えて正しく表示・補間される
2. 店舗名・エリア名・商品名・`getStoreSummary()`/`getStoreBadge()`由来の文言が4言語すべてで翻訳されず元の日本語表示のまま
3. 390px/430pxで店舗行（`StoreRow`）・エリアグループ見出し・件数表示のテキストの折り返し・はみ出し・下部ナビとの干渉がない
4. 768/1280/1920pxでもレイアウト崩れがない
5. 横スクロールが発生しない
6. `/stores/[id]`・`/areas`・`/eaten`・`/`・`/foods`の表示・リンク先URL・既存i18n表示に変化がない（回帰なし）。特に、新規作成したクライアントコンポーネントが`/stores`以外のページに影響していないことを確認する
7. `localStorage`の`unicolle-locale`・`unicolle-locale-change`イベントの動作に変化がない（言語切替が`/stores`にも反映される）
8. 既存の「食べた」記録データ・`localStorage`のスキーマに変更がない

### 10.4 スクリーンショット

- 命名規則: `screenshots/i18n-phase2d-c-stores-{locale}-{width}.png`
- 対象: en/ko/zh-TW × 390/430（最低6枚）。可能であれば ja を含めた追加幅も推奨。
- 加えて、回帰確認用にホーム`/`（ja、390px）のスクリーンショットを1枚取得し、「店舗から探す」セクション等に意図しない変更がないことを確認すること。

## 11. Git運用

1. 作業開始前に`backup-before-i18n-phase2d-c`というメッセージで空コミット（変更がなければ`--allow-empty`）を作成し、push してください。
2. 実装後、`implement-i18n-phase2d-c-stores`というメッセージでコミットし、push してください。
3. 本ドキュメント（`codex-goal-i18n-phase2d-c.md`）以外の設計・レビュー用ドキュメントは変更しないでください。

## 12. Codex CLI確認対応

確認を求められた場合は "Yes, and don't ask again" を選択して進めてください。

## 13. 完了条件

以下をすべて満たした場合に完了とみなします。

1. `lib/i18n/dictionaries.ts`に`stores.*`の4キー×4言語=16エントリが追加されている。
2. `app/stores/page.tsx`はデータ取得のみを担うサーバーコンポーネントのまま維持されている。
3. `/stores`専用の新規`"use client"`コンポーネントが追加され、3章記載の4箇所が`t()`で表示されている。
4. 新規クライアントコンポーネントが`/stores`以外のページから一切importされていない。
5. 4章記載の翻訳対象外（店舗名・エリア名・商品名・`lib/store-utils.ts`由来の文言等）が変更されていない。
6. `lib/store-utils.ts`が変更されていない。
7. `/`、`/foods`、`/foods/[id]`、`/eaten`、`/areas`、`/areas/[id]`、`/stores/[id]`が変更されていない。
8. `npm run lint`・`npm run typecheck`（存在する場合）・`npm run build`がすべて成功する。
9. ja/en/ko/zh-TW × 390/430/768/1280/1920で`/stores`の表示崩れ・横スクロール・文字切れがない。
10. 10.4のスクリーンショットが取得されている。
11. backup・implementのコミットがそれぞれ作成され、pushされている。

## 14. 最終報告形式

実装完了後、以下の項目を含む報告をしてください。

1. 変更したファイル一覧（新規作成ファイルを明記）
2. 追加した`stores.*`キー一覧（ja/en/ko/zh-TW値）
3. `app/stores/page.tsx`のサーバー/クライアント分離をどのように行ったか（5章への対応内容、新規コンポーネントのファイル名・import元）
4. `/stores`のja/en/ko/zh-TW表示確認結果
5. 店舗名・エリア名・商品名・`getStoreSummary()`/`getStoreBadge()`由来文言が翻訳されていないことの確認結果
6. `/stores/[id]`・`/areas`・`/eaten`・`/`・`/foods`の回帰確認結果（新規コンポーネントが他ページに影響していないことを含む）
7. 390px/430pxでの文字切れ・オーバーフロー・横スクロールの有無
8. `npm run lint`結果
9. `npm run typecheck`結果（存在する場合）
10. `npm run build`結果
11. localhost `/stores`の動作確認結果
12. Vercel `/stores`の動作確認結果
13. `localStorage` schema・既存記録データへの影響の有無
14. commit hash（backup・implementそれぞれ）
15. push結果
16. スクリーンショットファイル一覧
17. 候補文言のうち実装に存在しなかったため追加しなかったもの（再確認）
18. その他、設計から逸脱した判断があればその理由

## 15. 注意

- 本フェーズは`/stores`一覧の固定UI文言のみが対象です。Phase 2D-D以降には進まないでください。
- Phase2D-Bのレビュー（`docs/design-review-i18n-phase2d-b.md`）で指摘された「共用コンポーネントへの無条件混入」と同種の問題を再発させないこと。
- 不明点がある場合は9章のStop and Askに記載の通り、推測で進めず報告してください。
