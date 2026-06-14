# codex-goal-i18n-phase2d-b.md

## 0. 役割・前提

- 本ドキュメントは i18n Phase 2D-B（`/areas` 一覧ページの固定UI文言の多言語化）の実装指示です。
- 設計の根拠は `docs/i18n-phase2d-b-design-v1.md`。実装前に必ず確認してください。
- 既存の i18n 基盤（`LocaleProvider` / `useLocale` / `t(key, params?)`、ja → 3段フォールバック、`{{placeholder}}` 補間、`localStorage` の `unicolle-locale`、`unicolle-locale-change` イベント）をそのまま使用し、新しい仕組み（新しいContext、ルーティング、サーバー側i18n取得方法など）は作らないでください。
- 本フェーズの対象は **`/areas`（エリア一覧ページ）の固定UI文言だけ** です。

## 1. 対象範囲

### 1.1 対象（in-scope）

- `app/areas/page.tsx`
- `components/area-overview.tsx`

### 1.2 対象外（out-of-scope。一切変更しないこと）

- `/`（`app/page.tsx` および home 用コンポーネント）
- `/foods`、`/foods/[id]`
- `/eaten`（`components/eaten-experience.tsx`、`components/eaten-area-progress.tsx`、`components/eaten-genre-progress.tsx`）
- `/areas/[id]`（エリア詳細ページ。`area.*` namespaceは既存のまま、変更・流用しない）
- `/stores`、`/stores/[id]`

これらのファイル・ページに対する変更（リファクタ・インポート整理・フォーマット変更を含む）は一切行わないでください。

## 2. 翻訳対象キーの設計

新規namespace `areas.*` を `lib/i18n/dictionaries.ts` に追加してください（`/areas/[id]` で使われている既存の `area.*`（単数）とは別namespaceです。混同・統合・リネームしないこと）。

### 2.1 追加するキー（ja値は現状のリテラル文言と完全一致させること）

| key | ja | 用途・配置 |
|---|---|---|
| `areas.kicker` | `エリア別フード図鑑` | `app/areas/page.tsx` のページ上部kicker |
| `areas.title` | `エリアから探す` | `app/areas/page.tsx` のh1タイトル |
| `areas.subtitle` | `残りフードをエリアごとに確認できます。` | `app/areas/page.tsx` のサブタイトル |
| `areas.cardProgress` | `残り {{count}}品 / コンプ率 {{rate}}%` | `components/area-overview.tsx` の各エリアカード内の進捗テキスト。`{{count}}` = `completion.uneaten`、`{{rate}}` = `completion.rate` |

計4キー。`ja`/`en`/`ko`/`zh-TW` の4言語分、計16エントリを追加してください。

en/ko/zh-TWの値は、既存の `area.*`・`eaten.areaProgress.*` 等で使われている語彙・トーンと一貫性を持たせ、自然な訳にしてください（直訳調・機械翻訳調を避ける）。`areas.cardProgress` は「残り{{count}}品」と「コンプ率{{rate}}%」の2要素を含む1文として、各言語で自然な語順・表現にしてください（例: 英語であれば "{{count}} left / {{rate}}% complete" のような構成が考えられますが、最終的な訳文・語順はあなたの判断で自然なものにしてください）。

### 2.2 既存キーの扱い

- `area.*`（`/areas/[id]` 用、例: `area.remainingCount`="このエリアであと{{count}}品" 等）は変更・リネーム・流用禁止。
- `eaten.areaProgress.remaining`（"残り {{count}}"）は変更・流用禁止。`areas.cardProgress` は完全に独立した新規キーとして追加すること。
- `nav.*`、`footer.*` の「エリア一覧」等は変更しないこと。

## 3. 翻訳してはいけないもの

以下は絶対に翻訳・変更しないこと。

- エリア名（`area.name`、`AreaOverview` 内で表示される各カードの見出し）
- 商品名・店舗名・カテゴリ名・ジャンル名（本ページには直接表示されないが、`listFoods()` 等のデータ取得処理・データ構造には触れないこと）
- 商品説明・価格・日付
- generated JSON由来の商品データ（`lib/repositories/foods.ts` 等のデータ取得ロジック）
- 画像内テキスト・`area.image` のパス
- `areaImageDefinitions`、`normalizeAreaImageName`、`calculateAreaProgress` 等のロジック・データ（表示テキスト以外のロジック変更は不要）

## 4. URL・ロケール方針

- URL構造（`/areas`、`/areas/[id]` へのリンク等）は変更しないこと。
- `/en`、`/ko`、`/zh-TW` 等のロケール別ルートは追加しないこと。
- 既存の `localStorage` キー `unicolle-locale`、イベント `unicolle-locale-change`、`document.documentElement.lang` の同期ロジックは変更しないこと。

## 5. 実装方針

### 5.1 サーバーコンポーネント対応について

`app/areas/page.tsx` は `async function` のサーバーコンポーネント（`"use client"` なし）であり、`lib/i18n/use-locale.tsx` の `useLocale`／`LocaleProvider` は `"use client"` 専用（`useSyncExternalStore` でブラウザの `localStorage` を読む実装）です。サーバーコンポーネントから直接 `useLocale` を呼ぶことはできません。

`/eaten` の既存実装（`app/eaten/page.tsx` はデータ取得のみ行うサーバーコンポーネントで、UI・文言はすべて `"use client"` の `EatenExperience` に委譲している）と同じパターンに揃えてください。具体的には:

- `app/areas/page.tsx` 側では、`areas.kicker`/`areas.title`/`areas.subtitle` に対応する固定文言のJSX（現在ページ直下にある `<p>`/`<h1>`/`<p>` の3行）を、`"use client"` の `AreaOverview`（または新設する小さなクライアントコンポーネント）側に移し、`useLocale`の`t()`で表示するようにしてください。
- `app/areas/page.tsx` 自体はサーバーコンポーネントのまま、データ取得（`listFoods()`、`areas` の組み立て）のみを担当する形を維持してください。
- ページ全体の構造（`<div className="space-y-7">` のラップ等）やレイアウトクラスは、見た目が変わらない範囲で必要最小限の調整に留めてください。
- 新しいi18nの仕組み（サーバー側辞書取得関数の新設など）は作らないこと。あくまで既存の `useLocale`/`t()` をクライアント側で使う構成にすること。

### 5.2 `components/area-overview.tsx`

- `import { useLocale } from "@/lib/i18n/use-locale";` を追加し、`const { t } = useLocale();` を取得してください。
- 各エリアカード内の `残り {completion.uneaten}品 / コンプ率 {completion.rate}%` を `t("areas.cardProgress", { count: completion.uneaten, rate: completion.rate })` に置き換えてください。
- `area.name`（エリア名）の表示は変更しないこと。

## 6. 確認対象ファイル

実装前に以下を確認してください（存在しないファイルは無視）。

- `docs/i18n-phase2d-b-design-v1.md`
- `docs/i18n-design-v1.md`
- `docs/i18n-coverage-review-v1.md`
- `docs/i18n-phase2-design-v1.md`
- `docs/design-review-i18n-phase2d-a1.md`
- `lib/i18n/dictionaries.ts`
- `lib/i18n/use-locale.tsx`
- `lib/i18n/locales.ts`
- `app/areas/page.tsx`
- `app/eaten/page.tsx`（サーバー/クライアント分離パターンの参考として）
- `components/area-overview.tsx`
- `components/eaten-experience.tsx`（参考のみ、変更禁止）

## 7. 禁止事項

- `/areas/[id]`、`/foods`、`/foods/[id]`、`/eaten`、`/stores`、`/stores/[id]`、`/` への変更
- エリア名・商品名・店舗名・カテゴリ名・ジャンル名・商品説明・価格・日付・generated JSONデータの翻訳・変更
- `area.*`（単数、`/areas/[id]`用）、`eaten.areaProgress.*`、`nav.*`、`footer.*` の既存キーの変更・リネーム・流用
- 新しいi18n仕組み（新Context、新ルーティング、サーバー側辞書取得APIの新設等）の追加
- `/en`、`/ko`、`/zh-TW` ルートの追加、SEO対応、App Store文言対応
- 自動翻訳・外部翻訳APIの使用
- DB変更、generated JSON変更、crawler変更
- 「表示するエリアがありません」等、現在実在しない空状態UI・新規UI要素の追加（`areaImageDefinitions` は固定リストであり空状態は発生しないため、対応不要）
- 「このエリアで探す」「食べた◯品」「販売中◯品（登録分）」「エリア別コレクション」等、`/areas`に実在しない文言の新規追加

## 8. 検証要件

### 8.1 ビルド・静的検証

- `npm run lint`
- `npm run typecheck`（存在する場合）
- `npm run build`

### 8.2 表示確認

- 言語: ja / en / ko / zh-TW
- 幅: 390 / 430 / 768 / 1280 / 1920
- 対象ページ: `/areas`（メイン）。回帰確認として `/`、`/areas/[id]`（任意の1エリア）、`/eaten`、`/foods` を ja で表示確認。

### 8.3 確認項目

1. `/areas` のkicker「エリア別フード図鑑」相当、タイトル「エリアから探す」相当、サブタイト「残りフードをエリアごとに確認できます。」相当が、ja/en/ko/zh-TWで切り替えて正しく表示される
2. 各エリアカードの「残り◯品 / コンプ率◯%」相当のテキストが、ja/en/ko/zh-TWで自然に表示され、`{{count}}`/`{{rate}}` が正しい数値に補間される
3. エリア名（例: 「ハリウッド・エリア」）が4言語すべてで翻訳されず元の日本語表示のまま
4. 390px/430pxでカード内テキストの折り返し・はみ出し・画像との重なり・下部ナビとの干渉がない
5. 768/1280/1920pxでもレイアウト崩れがない
6. 横スクロールが発生しない
7. `/areas/[id]`・`/eaten`・`/`・`/foods` の表示・リンク先URL・既存i18n表示に変化がない（回帰なし）
8. `localStorage` の `unicolle-locale`・`unicolle-locale-change` イベントの動作に変化がない（言語切替が `/areas` にも反映される）
9. 既存の「食べた」記録データ・`localStorage`のスキーマに変更がない

### 8.4 スクリーンショット

- 命名規則: `screenshots/i18n-phase2d-b-areas-{locale}-{width}.png`
- 対象: en/ko/zh-TW × 390/430（最低6枚）。可能であれば ja を含めた追加幅も推奨。

## 9. Git運用

1. 作業開始前に `backup-before-i18n-phase2d-b` というメッセージで空コミット（変更がなければ `--allow-empty`）を作成し、push してください。
2. 実装後、`implement-i18n-phase2d-b-areas` というメッセージでコミットし、push してください。
3. 本ドキュメント（`codex-goal-i18n-phase2d-b.md`）以外の設計・レビュー用ドキュメントは変更しないでください。

## 10. Codex CLI確認対応

確認を求められた場合は "Yes, and don't ask again" を選択して進めてください。

## 11. 最終報告形式

実装完了後、以下の項目を含む報告をしてください。

1. 変更したファイル一覧
2. 追加した `areas.*` キー一覧（ja/en/ko/zh-TW値）
3. `app/areas/page.tsx` のサーバー/クライアント分離をどのように行ったか（5.1への対応内容）
4. `components/area-overview.tsx` の変更内容
5. `/areas` の ja/en/ko/zh-TW 表示確認結果
6. エリア名が翻訳されていないことの確認結果
7. `/areas/[id]`・`/eaten`・`/`・`/foods` の回帰確認結果
8. 390px/430pxでの文字切れ・オーバーフロー・横スクロールの有無
9. `npm run lint` 結果
10. `npm run typecheck` 結果（存在する場合）
11. `npm run build` 結果
12. localhost `/areas` の動作確認結果
13. Vercel `/areas` の動作確認結果
14. `localStorage` schema・既存記録データへの影響の有無
15. commit hash（backup・implement それぞれ）
16. push結果
17. スクリーンショットファイル一覧
18. 候補文言のうち実装に存在しなかったため追加しなかったもの（再確認）
19. その他、設計から逸脱した判断があればその理由

## 12. 注意

- 本フェーズは `/areas` 一覧の固定UI文言のみが対象です。Phase 2D-B以降（`/areas/[id]`、`/stores`等）には進まないでください。
- 既存の i18n基盤・既存キーへの影響を最小限にし、新規キーの追加と `app/areas/page.tsx`/`components/area-overview.tsx` の最小限の変更で完結させてください。
- 不明点がある場合はStop and Ask（`docs/i18n-phase2d-b-design-v1.md` 6章）に記載の通り、推測で進めず報告してください。
