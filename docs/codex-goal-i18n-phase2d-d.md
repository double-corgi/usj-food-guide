# codex-goal-i18n-phase2d-d.md

## 0. 役割・前提

- 本ドキュメントは i18n Phase 2D-D（`/stores/[id]` 店舗詳細ページの固定UI文言の多言語化）の実装指示です。
- 設計の根拠は `docs/i18n-phase2d-d-design-v1.md`。実装前に必ず確認してください。実装範囲・キー設計はこの設計書に完全準拠してください。
- 既存の i18n 基盤（`LocaleProvider` / `useLocale` / `t(key, params?)`、`I18nText`コンポーネント、ja → 3段フォールバック、`{{placeholder}}` 補間、`localStorage` の `unicolle-locale`、`unicolle-locale-change` イベント）をそのまま使用し、新しい仕組みは作らないでください。
- 本フェーズの対象は **`/stores/[id]`（店舗詳細ページ）の固定UI文言だけ** です。

## 1. 対象範囲

### 1.1 対象ファイル（in-scope）

- `app/stores/[id]/page.tsx`
- `lib/i18n/dictionaries.ts`（新規キー追加のみ）

### 1.2 変更禁止ファイル・対象外ページ（out-of-scope。一切変更しないこと）

- `/`（`app/page.tsx`、`components/home-dashboard.tsx`等のhome用コンポーネント）
- `/foods`、`/foods/[id]`
- `/eaten`（`components/eaten-experience.tsx`、`components/eaten-area-progress.tsx`、`components/eaten-genre-progress.tsx`）
- `/areas`、`/areas/[id]`（`components/area-overview.tsx`を含む）
- `/stores`（`components/stores-overview.tsx`を含む）
- `lib/store-utils.ts`（2.2参照。表示文言の参照のみ行い、関数自体・返り値は変更しないこと）
- `components/store-food-list.tsx`（2.5参照。本フェーズでは変更禁止。`store.availableFoodsEmpty`・`common.eaten`は既に対応済みであり、追加対応は不要）
- `lib/repositories/foods.ts`等のデータ取得・generated JSON関連ファイル

これらのファイル・ページに対する変更（リファクタ・インポート整理・フォーマット変更を含む）は一切行わないでください。

## 2. 追加するキー（既存namespace `store.*` への追加）

`lib/i18n/dictionaries.ts`の既存namespace `store.*`（`/stores/[id]`専用、単数。`store.backToList`/`store.availableFoods`/`store.availableFoodsEmpty`が既に存在する）に、以下14キーを追加してください。新しいnamespaceは作らないこと。

### 2.1 追加するキー一覧（ja値は現状のリテラル文言と完全一致させること）

| key | ja | 用途・配置 |
|---|---|---|
| `store.detailKicker` | `店舗` | ページ上部のkicker |
| `store.availableFoodsKicker` | `販売商品` | 販売商品セクションのkicker |
| `store.availableFoodsCount` | `{{count}}品を掲載しています。` | 販売商品セクションの件数表示。`{{count}}` = `displayFoods.length` |
| `store.infoKicker` | `店舗情報` | 店舗情報セクションのkicker |
| `store.infoSectionTitle` | `確認できる情報` | 店舗情報セクションの見出し（h2） |
| `store.infoAreaLabel` | `エリア` | 情報カード見出し（エリア） |
| `store.infoTypeLabel` | `店舗種別` | 情報カード見出し（店舗種別） |
| `store.infoScheduleLabel` | `営業時間・スケジュール` | 情報カード見出し（営業時間） |
| `store.scheduleBodyWithUrl` | `正確な営業時間は公式サイトでご確認ください` | 情報カード本文（`officialUrl`あり） |
| `store.scheduleBodyWithoutUrl` | `営業時間は現地または公式情報でご確認ください` | 情報カード本文（`officialUrl`なし） |
| `store.scheduleLinkLabel` | `公式サイトで確認` | 営業時間カードのリンクラベル |
| `store.infoOfficialLabel` | `公式サイト` | 情報カード見出し（公式サイト。`officialUrl`がある場合のみ表示） |
| `store.officialBody` | `最新情報は公式サイトで確認できます` | 公式サイトカードの本文 |
| `store.officialLinkLabel` | `公式サイトを開く` | 公式サイトカードのリンクラベル |

計14キー。`ja`/`en`/`ko`/`zh-TW` の4言語分、計56エントリを追加してください。

en/ko/zh-TWの値は、既存の`store.*`・`foods.*`・`foodDetail.officialSite`（"公式サイトを見る"）等の語彙・トーンと一貫性を持たせ、自然な訳にしてください（直訳調・機械翻訳調を避ける）。

### 2.2 既存キーの扱い（変更・流用禁止）

- `store.backToList`（"店舗一覧へ戻る"）、`store.availableFoods`（"この店舗で買える商品"）、`store.availableFoodsEmpty`（"この店舗で買える商品はまだ登録されていません。"）は変更・リネーム・流用禁止。すでに`app/stores/[id]/page.tsx`・`components/store-food-list.tsx`で`I18nText`/`t()`により使用済み。
- `common.saleActive`（"販売中"）、`common.ended`（"販売終了"）、`area.viewAllSalesLocations`（"すべての販売場所を見る"）、`foodDetail.officialSite`（"公式サイトを見る"）、`foods.title`（"フードを探す"）、`area.*`、`areas.*`、`stores.*`（複数、`/stores`一覧専用）、`nav.*`、`footer.*`は変更・リネーム・流用禁止。
  - 特に`store.scheduleLinkLabel`（"公式サイトで確認"）・`store.officialLinkLabel`（"公式サイトを開く"）・既存`foodDetail.officialSite`（"公式サイトを見る"）はja値が似ているが、それぞれ独立したキーとして扱うこと（流用・統合・リネーム禁止）。

## 3. 翻訳対象

`app/stores/[id]/page.tsx`内の以下の箇所を、既存の`I18nText`パターン（`<I18nText k="..." />` / `<I18nText k="..." params={{...}} />`）または`t()`で置き換えてください。

```tsx
// 1. ページ上部kicker
<p className="text-xs font-black text-park">店舗</p>
// → <I18nText k="store.detailKicker" />

// 2. 販売商品セクション
<p className="text-xs font-black text-park">販売商品</p>
// → <I18nText k="store.availableFoodsKicker" />

<p className="mt-2 text-sm font-bold text-slate-500">{displayFoods.length}品を掲載しています。</p>
// → <p className="mt-2 text-sm font-bold text-slate-500">
//      <I18nText k="store.availableFoodsCount" params={{ count: displayFoods.length }} />
//    </p>

// 3. 店舗情報セクション
<p className="text-xs font-black text-park">店舗情報</p>
// → <I18nText k="store.infoKicker" />

<h2 className="mt-1 text-xl font-black text-ink">確認できる情報</h2>
// → <I18nText k="store.infoSectionTitle" />

<StoreInfoItem icon={MapPin} title="エリア" body={store.areaName} />
// → title に <I18nText k="store.infoAreaLabel" /> を渡す（body の store.areaName は翻訳対象外、そのまま）

<StoreInfoItem icon={Store} title="店舗種別" body={getStoreTypeLabel(store)} />
// → title に <I18nText k="store.infoTypeLabel" /> を渡す（body の getStoreTypeLabel(store) は翻訳対象外、そのまま）

<StoreInfoItem
  icon={Clock}
  title="営業時間・スケジュール"
  body={officialUrl ? "正確な営業時間は公式サイトでご確認ください" : "営業時間は現地または公式情報でご確認ください"}
  linkHref={officialUrl}
  linkLabel="公式サイトで確認"
/>
// → title に <I18nText k="store.infoScheduleLabel" />
// → body に officialUrl ? <I18nText k="store.scheduleBodyWithUrl" /> : <I18nText k="store.scheduleBodyWithoutUrl" />
// → linkLabel に <I18nText k="store.scheduleLinkLabel" />

{officialUrl ? (
  <StoreInfoItem icon={ExternalLink} title="公式サイト" body="最新情報は公式サイトで確認できます" linkHref={officialUrl} linkLabel="公式サイトを開く" />
) : null}
// → title に <I18nText k="store.infoOfficialLabel" />
// → body に <I18nText k="store.officialBody" />
// → linkLabel に <I18nText k="store.officialLinkLabel" />
```

上記以外に新規の翻訳対象を追加しないでください。

### 3.1 `StoreInfoItem`コンポーネントの型変更について

`StoreInfoItem`（`app/stores/[id]/page.tsx`内のヘルパー関数）の`title`/`body`/`linkLabel`プロパティは現状`string`型ですが、`I18nText`は`ReactNode`を返すため、`title`/`body`/`linkLabel`の型を`ReactNode`に変更してください。

- `StoreInfoItem`はこのファイル内でのみ使用されるヘルパーであり、本フェーズの変更範囲は`app/stores/[id]/page.tsx`内に限定されます。
- `body`に渡される値のうち、`store.areaName`・`getStoreTypeLabel(store)`は翻訳対象外データであり、そのまま（文字列のまま）渡してください。`ReactNode`型であれば文字列もそのまま渡せます。
- レイアウト・クラス名・構造（`<div className="flex gap-3">`等）は変更しないでください。

## 4. 翻訳対象外（絶対に翻訳・変更しないこと）

- 店舗名（`store.name`、`<h1>{store.name}</h1>`）
- エリア名（`store.areaName`）
- 商品名（`StoreFoodList`内の`food.name`）
- カテゴリ名・ジャンル名
- 商品説明・価格・日付
- generated JSON由来の商品データ（`listFoods()`、`buildStoresFromFoods()`、`findStoreById()`等のデータ取得・構築ロジック）
- 画像内テキスト
- `getStoreSummary(store, representativeFood)`・`getStoreTypeLabel(store)`の返り値（`lib/store-utils.ts`。Phase2D-Cで非翻訳方針を確認済みのStop and Ask対象を継続。これらの関数・`lib/store-utils.ts`自体は変更禁止）
- `getFoodAreaSummary(food)`の返り値（`lib/food-utils.ts`、既存のStop and Ask対象。変更禁止）
- `components/store-food-list.tsx`内の`aria-label="次回食べたい"`（本フェーズの対象外。1.2参照、変更禁止）

## 5. URL・ロケール方針

- URL構造（`/stores/[id]`、`/stores`への戻りリンク`/stores`等）は変更しないこと。
- `/en`、`/ko`、`/zh-TW`等のロケール別ルートは追加しないこと。
- 既存の`localStorage`キー`unicolle-locale`、イベント`unicolle-locale-change`、`document.documentElement.lang`の同期ロジックは変更しないこと。

## 6. 実装方針

- `app/stores/[id]/page.tsx`はサーバーコンポーネントのまま維持してください（`"use client"`化・サーバー/クライアント分離の新設は不要）。
- 既存の`I18nText`（`components/i18n-text.tsx`）パターンをそのまま使用してください。`I18nText`は`"use client"`の小コンポーネントで、サーバーコンポーネント内に`t()`の結果を埋め込む既存の仕組みです。新しいi18n仕組み（新Context、サーバー側辞書取得APIの新設等）は作らないこと。
- `<I18nText k="store.availableFoodsCount" params={{ count: displayFoods.length }} />`のように、`params`付きで`I18nText`を使用する箇所が本フェーズで初めてになりますが、`I18nText`の型定義（`k: TranslationKey, params?: Record<string, string | number>`）は既に`params`を受け付ける設計になっているため、コンポーネント自体の変更は不要です（`lib/i18n/dictionaries.ts`へのキー追加のみで動作します）。実際に動作することを確認してください。
- `StoreInfoItem`の型変更は3.1に従ってください。

## 7. 確認対象ファイル

実装前に以下を確認してください（存在しないファイルは無視）。

- `docs/i18n-phase2d-d-design-v1.md`
- `docs/i18n-design-v1.md`
- `docs/i18n-coverage-review-v1.md`
- `docs/i18n-phase2-design-v1.md`
- `docs/design-review-i18n-phase2d-c.md`
- `lib/i18n/dictionaries.ts`
- `lib/i18n/use-locale.tsx`
- `lib/i18n/locales.ts`
- `components/i18n-text.tsx`
- `app/stores/[id]/page.tsx`
- `components/store-food-list.tsx`（参照のみ、変更禁止）
- `lib/store-utils.ts`（参照のみ、変更禁止）

## 8. 禁止事項

- `/`、`/foods`、`/foods/[id]`、`/eaten`、`/areas`、`/areas/[id]`、`/stores`への変更
- 店舗名・エリア名・商品名・カテゴリ名・ジャンル名・商品説明・価格・日付・generated JSONデータの翻訳・変更
- `lib/store-utils.ts`・`lib/food-utils.ts`の関数・返り値の変更（翻訳含む）
- `components/store-food-list.tsx`の変更（`aria-label="次回食べたい"`を含む）
- `store.backToList`・`store.availableFoods`・`store.availableFoodsEmpty`・`common.saleActive`・`common.ended`・`area.viewAllSalesLocations`・`foodDetail.officialSite`・`foods.title`・`area.*`・`areas.*`・`stores.*`・`nav.*`・`footer.*`の既存キーの変更・リネーム・流用
- 新しいi18n仕組み（新Context、新ルーティング、サーバー側辞書取得APIの新設等）の追加
- `/en`、`/ko`、`/zh-TW`ルートの追加、SEO対応、App Store文言対応
- 自動翻訳・外部翻訳APIの使用
- DB変更、generated JSON変更、crawler変更
- 「販売中」「販売終了」「販売場所」「価格」「フードを探す」「すべて見る」「表示するフードがありません」等、`/stores/[id]`に実在しない文言・既存キーで対応済みの文言の新規追加

## 9. Stop and Ask

以下に該当する状況が発生した場合は、実装を進めず報告してください（推測で進めないこと）。

- `app/stores/[id]/page.tsx`の現在の構造が本ドキュメント記載と異なり、3章のキー埋め込みがそのまま適用できない場合。
- `StoreInfoItem`の`title`/`body`/`linkLabel`を`ReactNode`化することで、型エラーや想定外の表示崩れが発生する場合。
- `store.availableFoodsCount`（"{{count}}品を掲載しています。"）が`displayFoods.length === 0`の場面で実際に表示されることが判明した場合（設計上は`StoreFoodList`が空状態UI（`store.availableFoodsEmpty`）に切り替わり、この文は0件で表示されない想定）。表示される場合は、0件時の文言が4言語で不自然にならないか確認のうえ報告してください。
- 2.1の14キー以外に、翻訳しないと表示が破綻する固定UI文言が見つかった場合（その場合は追加せず、見つかった文言と理由を最終報告に記載すること）。
- `<I18nText k="..." params={{...}}>`が想定通り動作しない場合（補間結果が表示されない、エラーになる等）。

## 10. 検証要件

### 10.1 ビルド・静的検証

- `npm run lint`
- `npm run typecheck`（存在する場合）
- `npm run build`

### 10.2 表示確認

- 言語: ja / en / ko / zh-TW
- 幅: 390 / 430 / 768 / 1280 / 1920
- 対象ページ: `/stores/[id]`（メイン）。`officialUrl`あり/なしの店舗を最低1件ずつ確認すること。回帰確認として`/`、`/stores`、`/areas`、`/areas/[id]`、`/eaten`、`/foods`をjaで表示確認。

### 10.3 確認項目

1. `/stores/[id]`のページ上部kicker「店舗」相当、販売商品セクションのkicker「販売商品」相当・件数「{{count}}品を掲載しています。」相当、店舗情報セクションのkicker「店舗情報」相当・見出し「確認できる情報」相当、情報カード見出し（エリア/店舗種別/営業時間・スケジュール/公式サイト）相当、本文（`officialUrl`あり/なしの2パターン）、リンクラベル（公式サイトで確認/公式サイトを開く）相当が、ja/en/ko/zh-TWで切り替えて正しく表示・補間される
2. `officialUrl`がない店舗では「公式サイト」情報カード自体が表示されないこと（既存の条件分岐ロジックが維持されている）
3. 店舗名・エリア名・`getStoreSummary()`/`getStoreTypeLabel()`由来の文言・商品名・価格・カテゴリ名・ジャンル名が4言語すべてで翻訳されず元の日本語表示のまま
4. 390px/430pxで情報カード・販売商品グリッドのテキストの折り返し・はみ出し・横スクロールがない
5. 768/1280/1920pxでもレイアウト崩れがない
6. `/`・`/stores`・`/areas`・`/areas/[id]`・`/eaten`・`/foods`の表示・リンク先URL・既存i18n表示に変化がない（回帰なし）
7. `localStorage`の`unicolle-locale`・`unicolle-locale-change`イベントの動作に変化がない（言語切替が`/stores/[id]`にも反映される）
8. 既存の「食べた」記録データ・`localStorage`のスキーマに変更がない

### 10.4 スクリーンショット

- 命名規則: `screenshots/i18n-phase2d-d-store-detail-{locale}-{width}.png`
- 対象: en/ko/zh-TW × 390/430（最低6枚）。`officialUrl`あり・なしの店舗それぞれ1枚以上を含めることを推奨。可能であれば ja を含めた追加幅も推奨。

## 11. Git運用

1. 作業開始前に`backup-before-i18n-phase2d-d`というメッセージで空コミット（変更がなければ`--allow-empty`）を作成し、push してください。
2. 実装後、`implement-i18n-phase2d-d-store-detail`というメッセージでコミットし、push してください。
3. 本ドキュメント（`codex-goal-i18n-phase2d-d.md`）以外の設計・レビュー用ドキュメントは変更しないでください。

## 12. Codex CLI確認対応

確認を求められた場合は "Yes, and don't ask again" を選択して進めてください。

## 13. 完了条件

以下をすべて満たした場合に完了とみなします。

1. `lib/i18n/dictionaries.ts`の`store.*`namespaceに、2.1記載の14キー×4言語=56エントリが追加されている。
2. `app/stores/[id]/page.tsx`はサーバーコンポーネントのまま維持されている。
3. 3章記載の箇所すべてが`I18nText`（`t()`）で表示されている。
4. `StoreInfoItem`の`title`/`body`/`linkLabel`が`ReactNode`型に変更され、翻訳対象外データ（店舗名・エリア名・`getStoreSummary()`/`getStoreTypeLabel()`の返り値）はそのまま渡されている。
5. 4章記載の翻訳対象外（店舗名・エリア名・商品名・`lib/store-utils.ts`/`lib/food-utils.ts`由来の文言・`aria-label="次回食べたい"`等）が変更されていない。
6. `components/store-food-list.tsx`・`lib/store-utils.ts`・`lib/food-utils.ts`が変更されていない。
7. `/`、`/foods`、`/foods/[id]`、`/eaten`、`/areas`、`/areas/[id]`、`/stores`が変更されていない。
8. `npm run lint`・`npm run typecheck`（存在する場合）・`npm run build`がすべて成功する。
9. ja/en/ko/zh-TW × 390/430/768/1280/1920で`/stores/[id]`の表示崩れ・横スクロール・文字切れがない（`officialUrl`あり/なし両パターン確認）。
10. 10.4のスクリーンショットが取得されている。
11. backup・implementのコミットがそれぞれ作成され、pushされている。

## 14. 最終報告形式

実装完了後、以下の項目を含む報告をしてください。

1. 変更したファイル一覧
2. 追加した`store.*`キー一覧（ja/en/ko/zh-TW値、14キー）
3. `app/stores/[id]/page.tsx`での`I18nText`埋め込み内容（3章への対応内容）と`StoreInfoItem`の型変更内容
4. `/stores/[id]`のja/en/ko/zh-TW表示確認結果（`officialUrl`あり/なし双方）
5. 店舗名・エリア名・`getStoreSummary()`/`getStoreTypeLabel()`由来文言・商品名・価格・カテゴリ名・ジャンル名が翻訳されていないことの確認結果
6. `/`・`/stores`・`/areas`・`/areas/[id]`・`/eaten`・`/foods`の回帰確認結果
7. 390px/430pxでの文字切れ・オーバーフロー・横スクロールの有無
8. `npm run lint`結果
9. `npm run typecheck`結果（存在する場合）
10. `npm run build`結果
11. localhost `/stores/[id]`の動作確認結果
12. Vercel `/stores/[id]`の動作確認結果
13. `localStorage` schema・既存記録データへの影響の有無
14. commit hash（backup・implementそれぞれ）
15. push結果
16. スクリーンショットファイル一覧
17. `store.availableFoodsCount`が0件時に表示されるかどうかの確認結果
18. その他、設計から逸脱した判断があればその理由

## 15. 注意

- 本フェーズは`/stores/[id]`店舗詳細の固定UI文言のみが対象です。Phase 2D-D以降には進まないでください。
- Phase2D-Cまでで確立した「実在する固定UI文言だけを翻訳する」「ja値が似ていても用途が異なる場合は別キーにする」方針を継続してください。
- 不明点がある場合は9章のStop and Askに記載の通り、推測で進めず報告してください。
