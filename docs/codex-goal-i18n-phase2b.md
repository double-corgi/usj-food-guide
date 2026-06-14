# codex-goal-i18n-phase2b.md

## 0. 前提

- i18n Phase 2A は承認済み・実装済み（commit `644a34e`, backup `3a324b0`）。
- 本ドキュメントは **Phase 2B のみ** を対象とする。Phase 2C/2D には着手しないこと。
- 本ドキュメントの作成者（Claude）は設計担当・レビュー担当であり、実装は行っていない。実装はCodexが行う。

## 1. 目的

i18n Phase 2B では、以下2ページに限定して固定UI文言を多言語化する。

- `/`（ホーム）
- `/areas/[id]`（エリア詳細）

対象外（Phase2Bでは一切変更しない）:

- `/foods`
- `/foods/[id]`
- `/eaten`
- `/areas`（一覧）
- `/stores`
- `/stores/[id]`

## 2. 対応言語

- ja（基準・フォールバック）
- en
- ko
- zh-TW

既存の `lib/i18n/dictionaries.ts` の4言語構成を維持し、新規キーは必ず4言語すべてに追加すること。

## 3. 重要: t() の拡張（変数埋め込み対応）

Phase2Aでは「変数を含む文言は翻訳しない」としていたが、Phase2Bでは以下のような **数値を含む文言も翻訳対象** に含める。

- このエリアであと◯品
- 食べた◯ / 販売中◯品（登録分）
- 残り◯品
- 販売中◯品（登録分）

これらを翻訳するために、`lib/i18n/use-locale.tsx` の `t()` を**最小限**拡張し、変数差し込みに対応させる。

### 3.1 設計方針

- `t()` の型を以下のように拡張する。

  ```ts
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
  ```

- 辞書側の値に `{{変数名}}` 形式のプレースホルダーを埋め込む。例:
  - ja: `"area.remainingCount": "このエリアであと{{count}}品"`
  - en: `"area.remainingCount": "{{count}} left in this area"`
- `t()` の実装は、`dictionaries[locale][key] ?? dictionaries[defaultLocale][key] ?? key` で文字列を取得した後、`params` が渡されていれば `{{key}}` 形式のプレースホルダーをすべて対応する値（文字列化）で置換する、という単純な文字列置換のみとする。
- 既存の呼び出し（`t("nav.home")` のように `params` を渡さないもの）は **そのまま動作すること**。`params` はオプショナルとし、未指定時は置換処理をスキップする（既存呼び出しに影響を与えない）。
- 正規表現や複雑なICU MessageFormat等の導入は禁止。シンプルな `String.prototype.replaceAll` 等で十分。
- この拡張は `lib/i18n/use-locale.tsx` の `t` 関数本体のみに行う。`LocaleProvider` の他のロジック（`subscribe`/`getSnapshot`/`setLocale`/hydration周り）は変更しないこと。

### 3.2 この拡張の影響範囲

- `TranslationKey` の型定義（`lib/i18n/dictionaries.ts` の `keyof (typeof dictionaries)["ja"]`）には影響しない。
- Phase2A以前に追加された既存キー（`area.*`, `store.*`, `collection.*`, `common.*`, `nav.*`, `footer.*`, `settings.*`）はプレースホルダーを含まないため、`params` なしの呼び出しのまま動作する。挙動を変える必要はない。

## 4. Phase2Bで翻訳してよいもの（固定UI文言）

### 4.1 ホーム（`/`）

| 文言 | 想定キー | 備考 |
| --- | --- | --- |
| 食べた記録が、そのままコレクションになる。 | `footer.tagline`（既存・再利用） | ホーム内に完全一致のテキストがあれば `footer.tagline` を再利用する。一致しない場合のみ新規キー `home.tagline` を追加する。 |
| 食べると、棚が色づく。 | `collection.tagline`（既存・再利用） | Phase2Aで `home-progress-client.tsx` に追加済み。完全一致なら再利用。 |
| 今集められるフード | `home.collectibleFoods`（新規） | |
| 写真で選べる、販売中の登録フード。 | `home.collectibleFoodsDescription`（新規） | |
| 期間限定コレクション | `home.limitedCollection`（新規） | `common.limited`（「期間限定」）とは別物。完全一致しないため統合しない。 |
| 登録済みコレクションを見る | `home.viewRegisteredCollection`（新規） | `common.registeredCollection`（「登録済みコレクション」）とは文字列が異なるため別キーとする。 |
| 最初の1品から。 | `collection.firstBite`（既存・再利用） | Phase2Aで追加済み。 |
| 販売中◯品（登録分） | `home.activeCount`（新規・変数対応） | ja: `"販売中{{count}}品（登録分）"` |
| 残り◯品 | `home.remainingCount`（新規・変数対応） | ja: `"残り{{count}}品"` |
| コレクション数 | `home.collectionCount`（新規） | |

### 4.2 エリア詳細（`/areas/[id]`）

| 文言 | 想定キー | 備考 |
| --- | --- | --- |
| エリア一覧へ戻る | `area.backToList`（既存・再利用） | Phase2Aで追加済み。 |
| このエリアであと◯品 | `area.remainingCount`（新規・変数対応） | ja: `"このエリアであと{{count}}品"` |
| 食べた◯ / 販売中◯品（登録分） | `area.eatenProgress`（新規・変数対応） | ja: `"食べた{{eaten}} / 販売中{{total}}品（登録分）"` |
| まず食べたい3品 | `area.firstPicks`（既存・再利用） | |
| このエリアで見つけるならここから。 | `area.firstPicksDescription`（既存・再利用） | |
| このエリアで食べたフード | `area.eatenFoods`（既存・再利用） | |
| このエリアの1品目を見つけよう。 | `area.eatenFoodsEmpty`（既存・再利用） | |
| 残りのフード | `area.remainingFoods`（既存・再利用） | |
| 残りをすべて見る | `area.viewAllRemaining`（既存・再利用） | |
| 販売終了フード | `area.endedFoods`（既存・再利用） | |
| 販売場所 | `area.salesLocations`（既存・再利用） | |
| すべての販売場所を見る | `area.viewAllSalesLocations`（新規） | Phase2Aには存在しない文言。`AreaShopList` 等に該当箇所があれば対応する。なければ追加不要（推測でUIを追加しない）。 |
| このエリアの販売中フードは現在確認中です | `area.checkingNow`（既存・再利用） | |

### 4.3 キー追加時の注意

- 既存キーと完全一致するja文言は、**新規キーを作らず既存キーを再利用すること**。
- 上記表は候補であり、実際のコード上で文言が完全一致しない場合（句読点や表記の違いなど）は、無理に当てはめず、実際のja文言に基づいた新規キーを追加すること。
- 辞書キーの重複（同じja値を持つ別キー）を新たに作らないこと。Phase2Aで発生した `area.eatenFoodsViewAll` と `common.viewAll` の重複は今回新たに増やさないよう注意する。
- 新規キーは4言語（ja/en/ko/zh-TW）すべてに追加すること。en/ko/zh-TWの訳文は、Phase1/2Aで追加した既存訳文のトーン・文体に合わせること。

## 5. Phase2Bで翻訳してはいけないもの

以下は**絶対に翻訳しない**。元のja文言のまま表示し続けること。

- 商品名
- 店舗名
- エリア名
- 期間限定イベント名（例: 25周年関連の名称）
- 「25周年」のような記念表記
- 価格表示
- 日付表示
- カテゴリ名
- ジャンル名
- 商品説明文
- レビュー本文
- 画像内テキスト
- generated JSON由来の値（食品データ、店舗データ、エリアデータ等のフィールド値）

固有名詞やデータ由来の文言を翻訳すると不自然になりやすいため、Phase2Bでは**UI固定文言のみ**を対象とする。上記に該当する文字列が4.1/4.2のtable作成中に見つかった場合でも、翻訳対象に含めないこと。

## 6. URL方針

- URL構造は変更しない。
- 以下を禁止する:
  - `/en`, `/ko`, `/zh-TW` などのロケール別ルート追加
  - ルーティング構成の変更
  - SEO対応（hreflang等）の追加
  - App Store文言対応
- 言語切り替えは引き続き `localStorage` の `unicolle-locale` キーを使用する（`lib/i18n/locales.ts` / `lib/i18n/use-locale.tsx` の既存ロジックは、3章で定義したt()拡張以外、変更しない）。

## 7. 実装方針

- 既存のi18n基盤（`useLocale()` / `t()` / `dictionaries.ts` / `components/i18n-text.tsx`）を使う。新しい仕組み（新しいProvider、新しいフック、新しい翻訳ライブラリ等）は作らない。
- `t()` の拡張は3章の方針のみに限定する。
- サーバーコンポーネント内で固定文言を翻訳する必要がある場合は、Phase2Aで導入した `components/i18n-text.tsx`（`I18nText`）パターンを再利用する。`I18nText` に変数差し込み（`params`）が必要な場合は、`I18nText` のpropsに `params?: Record<string, string | number>` を追加し、内部で `t(k, params)` を呼ぶ形で対応する（新しいコンポーネントを別途作らない）。

### 7.1 確認対象ファイル（候補）

- `lib/i18n/dictionaries.ts`
- `lib/i18n/use-locale.tsx`
- `components/i18n-text.tsx`
- `components/home-progress-client.tsx`
- `components/home-dashboard.tsx`
- `app/areas/[id]/page.tsx`
- `components/area-collection-summary.tsx`
- `components/area-eaten-foods.tsx`
- `components/area-food-status-lists.tsx`

上記以外のファイルに変更が必要な場合（例: ホームの該当文言が別コンポーネントにある場合）は、Phase2Bの範囲（4章の文言、対象ページ`/`と`/areas/[id]`）に明確に該当する場合のみ変更してよい。範囲外への変更は禁止。

## 8. 禁止事項

- 全ページ一括翻訳
- `/foods` の改修
- `/foods/[id]` の改修
- `/eaten` の改修
- `/areas`（一覧）の改修
- `/stores` の改修
- `/stores/[id]` の改修
- 商品名の翻訳
- 店舗名の翻訳
- エリア名の翻訳
- 外部翻訳APIの利用
- 自動翻訳の導入
- DBスキーマ・データの変更
- generated JSONの変更
- crawlerの変更
- URL構造の変更（`/en` `/ko` `/zh-TW` 追加含む）
- home v1.2のデザイン変更（レイアウト・配色・コンポーネント構造）
- area-detail-v1.1のデザイン変更（レイアウト・配色・コンポーネント構造）
- 大規模リファクタリング
- Phase2Bと無関係なコード整形・リネーム

## 9. 検証要件

Codexは以下を**必ず**実行すること。

### 9.1 コマンド

```
npm run lint
npm run typecheck
npm run build
```

すべて成功すること。

### 9.2 確認ページ

- `/`
- `/areas/[id]`
- `/settings`
- `/foods`
- `/eaten`
- `/areas`
- `/stores`

（Phase2B対象外ページも、レイアウト崩れがないか必ず確認する。）

### 9.3 確認言語

- ja
- en
- ko
- zh-TW

### 9.4 確認幅

- 390px
- 430px
- 768px
- 1280px
- 1920px

### 9.5 確認項目

- ホームの固定文言が各言語で表示される
- エリア詳細の固定文言が各言語で表示される
- 商品名が翻訳されていない（全言語で原文ja表示のまま）
- 店舗名が翻訳されていない
- エリア名が翻訳されていない
- 「25周年」など記念・イベント名が翻訳されていない
- URL構造が変わっていない（`/areas/[id]`, `/`等のパスが変化していない）
- `/en` `/ko` `/zh-TW` が追加されていない（404のままであること）
- home v1.2の見た目が壊れていない
- area-detail-v1.1の見た目が壊れていない
- 390px / 430pxで文字切れ（テキストの折れ・はみ出し）がない
- overflow 0（横方向のオーバーフローが発生していない）
- clipped 0（テキストや要素が切り詰められていない）
- 横スクロールが発生していない

## 10. Git運用

### 10.1 作業開始前

```
git status
```

- 未コミットの変更がある場合:

  ```
  git add .
  git commit -m "backup-before-i18n-phase2b"
  git push
  ```

- 未コミットの変更がない場合:

  ```
  git commit --allow-empty -m "backup-before-i18n-phase2b"
  git push
  ```

### 10.2 作業完了後

```
git add .
git commit -m "implement-i18n-phase2b-home-area-detail"
git push
```

## 11. Codex CLI確認対応

- Codex CLIで確認画面が表示された場合は、必ず **「2. Yes, and don't ask again」** を選択すること。
- ユーザーへの確認質問は行わないこと。
- 途中で停止しないこと。
- 必要なコマンド承認はすべて上記2を選択し、最後まで実行すること。

## 12. 最終報告形式

実装完了後、以下の項目をすべて含む報告を行うこと。

1. 実装した内容
2. 追加した辞書キー（キー名・ja値・追加した4言語分の値の概要）
3. 再利用した既存キー（キー名と再利用箇所）
4. 翻訳対象にした範囲（ページ・コンポーネント単位）
5. 翻訳対象外にした範囲（4.3で対象外と判断した文言があれば、その内容と理由）
6. 商品名 / 店舗名 / エリア名を翻訳していないことの確認結果
7. URL変更なしの確認結果（`/en` `/ko` `/zh-TW` が404のままであることを含む）
8. 変更ファイル一覧（`git diff --stat` の結果）
9. lint / typecheck / build の結果
10. ja / en / ko / zh-TW での表示確認結果（ページごと）
11. 390 / 430 / 768 / 1280 / 1920 の確認結果（overflow / clipped / 横スクロールの有無を含む）
12. home v1.2が壊れていないことの確認結果
13. area-detail-v1.1が壊れていないことの確認結果
14. localhost確認結果
15. Vercel確認結果（本番URL）
16. commit hash（backup commitとimplement commitの両方）
17. push成功確認（backupとimplementの両方）

---

以上が i18n Phase 2B の実装範囲・方針・検証要件・報告形式である。Phase2C/2D の作業には着手しないこと。
