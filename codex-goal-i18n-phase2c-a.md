# codex-goal-i18n-phase2c-a.md

## 0. 位置づけ

これは Codex 向けの実装指示書である。i18n Phase 2A / 2B / 2B.1 で確立した仕組み（`useLocale`/`t(key, params?)`/`lib/i18n/dictionaries.ts`/`components/i18n-text.tsx`）をそのまま再利用する。新しい仕組み・新しいライブラリは追加しない。

参照ドキュメント（実装前に必ず確認すること）:
- `docs/i18n-design-v1.md`
- `docs/i18n-phase2-design-v1.md`
- `docs/design-review-i18n-phase2a.md`
- `docs/design-review-i18n-phase2b.md`
- `docs/design-review-i18n-phase2b-1.md`
- `docs/i18n-phase2c-design-v1.md`（本Phaseの設計のベース）

本ドキュメントは i18n Phase 2C のうち **Phase 2C-A** の実装範囲を定める。Phase 2C-B（`/foods/[id]`、`components/food-detail.tsx`）は別の `/goal` で扱うため、今回は対象外。

---

## 1. Objective（今回やること）

`/foods` ページの固定UI文言のみを多言語化する（ja/en/ko/zh-TW）。

- 対象ファイル: `app/foods/page.tsx`, `components/food-grid.tsx`
- 条件付き対象: `components/food-card.tsx`（2.3で範囲を限定）
- 対象外: `components/food-detail.tsx`, `app/foods/[id]/page.tsx`（Phase 2C-Bで対応）
- 対象外ページ: `/`, `/areas/[id]`, `/eaten`, `/areas`, `/stores`, `/stores/[id]`, `/settings`
  - ただし `components/food-card.tsx` はこれらのページでも使われている共有コンポーネントである。`food-card.tsx`に変更を加える場合は、対象外ページの表示が壊れないことを検証すること（7章）。

---

## 2. 翻訳スコープ

### 2.1 翻訳してよいもの（`components/food-grid.tsx`）

以下の固定UI文言を `t()` / `<I18nText k="..." />` に置き換える。すべて4言語（ja/en/ko/zh-TW）を `lib/i18n/dictionaries.ts` に追加する。

**主要文言（必須）**

| 現在の文言（ja） | 新キー / 既存キー |
| --- | --- |
| `フードを探す`（`title ?? "フードを探す"`、および `app/foods/page.tsx` の `title="フードを探す"`） | `foods.title`（新規） |
| `写真で選んで、残りを見つける。` | `foods.subtitle`（新規） |
| `メニュー・店舗・エリアで検索`（検索inputの`placeholder`） | `foods.searchPlaceholder`（新規） |
| `表示条件`（フィルター開閉ボタン） | `foods.filterToggle`（新規） |
| `すべて`（`categoryChips`の`value: "all"`のラベル） | `foods.categoryAll`（新規） |
| `{filteredFoods.length}品` | `foods.resultCount`（新規、`{{count}}`差し込み: `{{count}}品`） |
| `図鑑 {canonicalFoods.length}品` | `foods.catalogCount`（新規、`{{count}}`差し込み: `図鑑 {{count}}品`） |
| `さらに60件表示` | `foods.loadMore`（新規） |
| `該当するメニューがありません` | `foods.noMatchTitle`（新規） |
| `検索条件やチェック状態を変更してください。` | `foods.noMatchDescription`（新規） |
| `該当なし`（検索サジェスト内） | `foods.noResultsInline`（新規） |
| `情報提供`（CTAボタン、複数箇所） | `foods.requestCta`（新規） |
| `掲載してほしい商品を送る` | `foods.requestSectionTitle`（新規） |
| `投稿内容は管理者確認後に必要に応じて反映します。` | `foods.requestSectionDescription`（新規） |

**フィルター・並び替えの「固定UIラベル」（必須）**

以下は「フィルターの見出し・選択肢ラベル」であり、商品データ由来のカテゴリ名・ジャンル名・店舗名・エリア名そのものではない。これらは翻訳してよい。

| 現在の文言（ja） | 新キー |
| --- | --- |
| `販売中`（`<select>` `option value="active"`, `TogglePill`） | `common.saleActive`（既存キーを再利用） |
| `期間限定`（`<select>` `option value="limited"`, `TogglePill`） | `common.limited`（既存キーを再利用） |
| `販売終了`（`<select>` `option value="ended"`） | `common.ended`（既存キーを再利用） |
| `終了間近` | `foods.saleFilterEndingSoon`（新規） |
| `常設` | `foods.saleFilterPermanent`（新規） |
| `近日販売` | `foods.saleFilterUpcoming`（新規） |
| `販売期間確認中` | `foods.saleFilterUnknown`（新規） |
| `図鑑すべて` | `foods.saleFilterAll`（新規） |
| `全エリア`（`<select>` エリア） | `foods.areaFilterAll`（新規） |
| `全店舗`（`<select>` 店舗） | `foods.shopFilterAll`（新規） |
| `全ジャンル`（`<select>` カテゴリの先頭オプション。`categoryLabels`の各値は翻訳しない） | `foods.categoryFilterAll`（新規） |
| `全店舗種別`（`<select>` 店舗種別の先頭オプション。`shopTypeLabels`の各値は翻訳しない） | `foods.shopTypeFilterAll`（新規） |
| `食べ方すべて`（`<select>` 食べ方の先頭オプション。`diningTypeLabels`の各値は翻訳しない） | `foods.diningTypeFilterAll`（新規） |
| `確認状況すべて`（`<select>` 確認状況の先頭オプション。`statusLabels`の各値は翻訳しない） | `foods.statusFilterAll`（新規） |
| `価格すべて` | `foods.priceFilterAll`（新規） |
| `価格確認済` | `foods.priceFilterKnown`（新規） |
| `価格未確認`（`<select>`の価格フィルター選択肢） | `foods.priceFilterUnknown`（新規） |
| `おすすめ順` | `foods.sortRecommended`（新規） |
| `新しい順` | `foods.sortNew`（新規） |
| `画像あり優先` | `foods.sortImage`（新規） |
| `公開情報確認順` | `foods.sortStatus`（新規） |
| `残り優先` | `foods.sortUneaten`（新規） |
| `カテゴリ順` | `foods.sortCategory`（新規） |
| `店舗順` | `foods.sortShop`（新規） |
| `価格安い順` | `foods.sortPriceAsc`（新規） |
| `価格高い順` | `foods.sortPriceDesc`（新規） |
| `食べ歩き優先` | `foods.sortWalk`（新規） |
| `写真あり`（`TogglePill`） | `foods.toggleImageOnly`（新規） |
| `価格確認済`（`TogglePill`、上記`foods.priceFilterKnown`と表示文言が同一なら同じキーを使ってよい） | `foods.priceFilterKnown`（再利用） |
| `価格未確認`（`TogglePill`） | `foods.priceFilterUnknown`（再利用） |
| `テイクアウト可`（`TogglePill`） | `foods.toggleTakeout`（新規） |
| `店内飲食`（`TogglePill`） | `foods.toggleEatIn`（新規） |
| `カート販売`（`TogglePill`） | `foods.toggleFoodCart`（新規） |

### 2.2 翻訳してはいけないもの

- 商品名（`food.name`）
- 店舗名（`food.shop.name` / `location.shopName`、`<select>`の店舗オプションの個々の店舗名）
- エリア名（`food.area.name` / `location.areaName`、`<select>`のエリアオプションの個々のエリア名）
- カテゴリ名・ジャンル名（`categoryChips`の各ラベル「チュリトス」「ポップコーン」「ドリンク」「ピザ」「バーガー」「パスタ」「プレート」「ライス」「キッズ」「スイーツ」、`<select>`の`categoryLabels`/`shopTypeLabels`/`diningTypeLabels`/`statusLabels`の各値）
- 商品説明・価格そのもの・日付・generated JSON由来データ・イベント名（「25周年」等）

### 2.3 `components/food-card.tsx` の扱い（重要・範囲限定）

`food-card.tsx`は`/foods`を含む複数ページで使われる共有コンポーネントである。Phase 2C-Aでは、以下の**コンポーネント内に直接ハードコードされた文言のみ**を翻訳対象とする。

| 現在の文言（ja） | 新キー / 既存キー | 備考 |
| --- | --- | --- |
| `食べた`（ボタン） | `common.eaten`（既存キーを再利用） | |
| `食べた済み`（ボタン） | `foodCard.eatenDone`（新規） | |
| `価格未確認`（`displayPrice()`が直接返す文字列。**`lib/food-utils.ts`内の関数の戻り値ではなく、`food-card.tsx`内にハードコードされている場合のみ**対象） | `foods.priceUnknown`（新規） | 下記の確認手順を参照 |

**`food-card.tsx`のバッジ文言（`getCardBadges()`内の「限定」「販売終了」「近日販売」、および`getSaleUrgencyLabel(food)`の戻り値）について**:

- これらの一部は `lib/food-utils.ts` 内の関数（例: `getSaleUrgencyLabel`）が返す文字列である可能性がある。
- **Phase 2C-Aでは `lib/food-utils.ts` のリファクタ・関数シグネチャ変更は行わない。**
- まず該当箇所を調査し、
  - (a) `food-card.tsx`内に直接ハードコードされた文字列リテラルである場合 → `t()`/`<I18nText>`に置き換えてよい（`common.limited`は「期間限定」のため「限定」単体は新規キー`foods.badgeLimited`、「販売終了」は`common.ended`を再利用、「近日販売」は新規キー`foods.badgeUpcoming`）。
  - (b) `lib/food-utils.ts`内の関数の戻り値である場合 → **今回は翻訳しない**。最終報告で「`lib/food-utils.ts`の関数が返すため2C-Aでは対象外とした箇所」として明記すること。

この判断に迷う場合は、コードを変更せず最終報告で確認結果を報告すること（Stop and Ask）。

---

## 3. `t()` の利用方法

Phase 2B.1 で確定済みの方式をそのまま使う。新しい仕組みは作らない。

- 通常の固定文言: `t("foods.title")` または `<I18nText k="foods.title" />`
- 変数差し込みが必要な文言: `t("foods.resultCount", { count: filteredFoods.length })`
  - `lib/i18n/dictionaries.ts`側の値に`{{count}}`のような`{{key}}`を埋め込み、`t()`が`replaceAll`で置換する（既存実装のまま、変更不要）。

---

## 4. `lib/i18n/dictionaries.ts` への追加

- 既存の構造（`nav.*`/`footer.*`/`settings.*`/`common.*`/`area.*`/`store.*`/`collection.*`/`home.*`）に加えて、`foods.*`/`foodCard.*`の名前空間を新設する。
- `TranslationKey`型に新規キーを追加する。
- ja/en/ko/zh-TWの4言語すべてに値を追加する（1言語でも欠けるとビルド時の型エラーになる前提を維持する）。
- 既存キーの値・既存キーの削除・既存キーのリネームは行わない。

---

## 5. URL方針（変更禁止）

- `/foods`のURL構造・クエリパラメータ構造を変更しない。
- `/en`, `/ko`, `/zh-TW`のようなロケール別パスを追加しない。
- `localStorage`の`unicolle-locale`キー、`document.documentElement.lang`の同期は既存のまま。

---

## 6. 禁止事項

- `app/foods/[id]/page.tsx`, `components/food-detail.tsx`の変更（Phase 2C-Bで対応するため、今回は触らない）
- `lib/food-utils.ts`, `lib/constants.ts`のリファクタ・関数シグネチャ変更
- `categoryLabels`/`shopTypeLabels`/`diningTypeLabels`/`statusLabels`の値、`categoryChips`の各カテゴリラベル（「すべて」を除く）の翻訳
- 商品名・店舗名・エリア名・商品説明・価格・日付・generated JSON由来データ・イベント名の翻訳
- `food-grid.tsx`/`food-card.tsx`のレイアウト・CSSクラス・コンポーネント構造の変更（テキストのみ`t()`/`<I18nText>`に置き換える）
- 新しいi18nライブラリ・自動翻訳・外部API・新しい状態管理の追加
- `/foods`以外のページの新規UI追加・デザイン変更
- generated JSON、crawler、DBスキーマの変更

---

## 7. 検証要件

### 7.1 静的検証
- `npm run lint`
- `npm run typecheck`（または該当する型チェックコマンド）
- `npm run build`

すべて成功すること。

### 7.2 表示検証

言語: ja / en / ko / zh-TW
幅: 390px / 430px / 768px / 1280px / 1920px

確認ページ:
- `/foods`（必須・今回の主対象）
- `/foods/[id]`（`food-card.tsx`を変更した場合、関連商品カード等への影響確認として必須）
- `/`（`food-card.tsx`を変更した場合、ホームのカード表示確認として必須）
- `/areas/[id]`（同上）
- `/eaten`（`food-grid.tsx`/`food-card.tsx`を変更した場合、`mode="eaten"`での表示確認として必須）

各ページ・各言語・各幅で:
- overflow 0 / clipped 0 / 横スクロールなし
- 商品名・店舗名・エリア名が翻訳されていない（ja原文のまま、全言語で）
- `categoryChips`の各カテゴリラベル、`categoryLabels`/`shopTypeLabels`/`diningTypeLabels`/`statusLabels`の値が翻訳されていない
- 2.1/2.3で指定した固定UI文言が、各言語で正しく表示される
- `/eaten`・`/`・`/areas/[id]`が既存のホームv1.2 / area-detail-v1.1のデザインを壊していない（Phase2A/2B/2B.1で確認済みの内容が維持されている）

---

## 8. Git運用

1. 作業前に現状を `git status` で確認し、未コミットの変更がないことを確認する。
2. バックアップコミットを作成する（変更がなければ `--allow-empty` を使用）。
3. バックアップコミットのハッシュを記録する。
4. 実装を行う。
5. 7章の検証をすべて実施する。
6. 実装をコミットする。
7. バックアップコミット・実装コミットの両方をリモートにpushする。
8. コミットハッシュ（バックアップ / 実装）、push結果を最終報告に含める。

---

## 9. Codex CLI確認対応

Codex CLIが対話中に確認（y/N等）を求めるプロンプトを出した場合、本指示書の範囲内（2章のスコープ、6章の禁止事項に違反しない）であれば許可して進めてよい。範囲外の操作を確認された場合は、実行せずに最終報告でその旨を報告すること。

---

## 10. 最終報告フォーマット

以下の項目を含めて報告すること。

1. 変更したファイル一覧（`git diff <backup>..<implement> --stat`の結果）
2. `lib/i18n/dictionaries.ts`に追加したキー一覧（ja/en/ko/zh-TWの値も含む）
3. `components/food-grid.tsx`で`t()`/`<I18nText>`に置き換えた箇所一覧
4. `components/food-card.tsx`で変更した箇所一覧、および2.3(b)に該当して**翻訳しなかった箇所**（`lib/food-utils.ts`の関数戻り値であるため対象外とした文言）の報告
5. `app/foods/page.tsx`の変更内容
6. URL構造が変わっていないことの確認結果
7. `/en` `/ko` `/zh-TW` が404のままであることの確認結果
8. 商品名/店舗名/エリア名/カテゴリ名/ジャンル名を翻訳していないことの確認結果
9. `categoryLabels`/`shopTypeLabels`/`diningTypeLabels`/`statusLabels`/`categoryChips`を変更していないことの確認結果
10. generated JSON/crawler/DBを変更していないことの確認結果
11. `lint`/`typecheck`/`build`の結果
12. 7.2の表示検証結果（言語×幅×ページのスクリーンショットまたは確認結果）
13. `/foods`が壊れていないことの確認結果
14. `/`, `/areas/[id]`, `/eaten`, `/foods/[id]`が壊れていないことの確認結果（`food-card.tsx`を変更した場合は特に）
15. バックアップコミットハッシュ
16. 実装コミットハッシュ
17. push結果（成功/失敗）

---

まだ実装しないこと。本指示書はCodexへの実装指示書としての作成のみであり、Claude自身はコード変更・git操作を行わない。
