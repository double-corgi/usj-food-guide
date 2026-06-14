# codex-goal-i18n-phase2a.md

宛先: Codex（実装担当）
発行: Claude（PO/UX/UIデザイン/レビュー・設計担当）
位置づけ: 本ドキュメントの指示のみを実装範囲とする。Phase 2B / 2C / 2D は対象外。

---

## 1. 目的

i18n Phase 2A: 「全ページ一括翻訳」ではなく、**既存の`common.*`辞書キーの実配線**と、**`/areas/[id]`・`/stores/[id]`・ホームの一部固定見出し**だけを安全に翻訳対象へ広げる。

Phase 1（承認済み）で導入した`LocaleProvider`/`useLocale`/`t()`/`localStorage`の基盤はそのまま使う。`t()`のシグネチャ変更・拡張は行わない（変数埋め込み文言はPhase2A対象外）。

---

## 2. 今回のスコープ（これだけ）

### 2.1 既存`common.*`キーの実配線

`lib/i18n/dictionaries.ts`には既に以下11キーが4言語分定義済みだが、どこからも参照されていない（未使用）。今回、**Phase2Aの対象ファイル内に同じ日本語文言が存在する箇所のみ**`t("common.xxx")`に置き換える。対象ファイル外（例: `components/food-card.tsx`, `components/food-detail.tsx`, `/foods`, `/eaten`など）は**今回は一切変更しない**。

```
common.saleActive          販売中
common.limited              期間限定
common.ended                 販売終了
common.eaten                  食べた
common.search                 探す
common.area                    エリア
common.store                   店舗
common.home                    ホーム
common.viewAll                 すべて見る
common.price                    価格
common.registeredCollection   登録済みコレクション
```

注意:
- `common.limited`（ja: "期間限定"）と、`food-card.tsx`等で使われる短い「限定」バッジ表記は**別物**。今回は`food-card.tsx`に触れないため混同しない。
- `common.home`は`nav.home`（ja: "ホーム"）と値が同じだが、用途（ナビゲーション vs 一般文言）が異なるため、**既存の`nav.home`はそのまま残し、統合・削除はしない**。今回`common.home`を使う箇所が対象ファイル内に見つからない場合は、配線せず未使用のままでよい（Phase2B以降で再検討）。
- `common.registeredCollection`（ja: "登録済みコレクション"）も同様に、対象ファイル内で完全一致する箇所にのみ使う。見出し「登録済みコレクションを見る」「登録済みコレクションへ」のように助詞・送り仮名が付く場合は、新規キー追加（2.4参照）で対応する。

### 2.2 `/areas/[id]` の固定見出し・空状態文言（新規キー追加）

`lib/i18n/dictionaries.ts`に`area.*`を新設し、`app/areas/[id]/page.tsx` / `components/area-collection-summary.tsx` / `components/area-eaten-foods.tsx` / `components/area-food-status-lists.tsx`内の以下の**変数を含まない固定文言**のみを`t()`化する。

| キー | ja（現状の文言） |
|---|---|
| `area.backToList` | エリア一覧へ戻る |
| `area.firstPicks` | まず食べたい3品 |
| `area.firstPicksDescription` | このエリアで見つけるならここから。 |
| `area.endingSoon` | 終了間近のフード |
| `area.endingSoonDescription` | このエリアで逃しやすい商品を販売終了日が近い順に表示します。 |
| `area.remainingFoods` | 残りのフード |
| `area.remainingFoodsEmpty` | 現在販売中の残り商品はありません。 |
| `area.viewAllRemaining` | 残りをすべて見る |
| `area.endedFoods` | 販売終了フード |
| `area.endedFoodsEmpty` | このエリアに販売終了フードはありません。 |
| `area.endedFoodsNote` | 販売終了フードは図鑑の記録として残ります。 |
| `area.eatenFoods` | このエリアで食べたフード |
| `area.eatenFoodsEmpty` | このエリアの1品目を見つけよう。 |
| `area.eatenFoodsViewAll` | すべて見る（`area-eaten-foods.tsx`内の「すべて見る」リンク） |
| `area.salesLocations` | 販売場所 |
| `area.complete` | このエリアはコンプリート |
| `area.checkingNow` | このエリアの販売中フードは現在確認中です |

**対象外（Phase2A範囲外、今回は触らない）**:
- `area-collection-summary.tsx`内の「このエリアであと{uneaten}品」「食べた {n} / 販売中 {n}品（登録分）」「コンプ率 {rate}%」（変数埋め込みのため）
- `area-food-status-lists.tsx`内の「あと{n}品」「{n}品」「すべての販売場所を見る（あと{hidden.length}か所）」（変数埋め込みのため）
- `area-food-status-lists.tsx`内の「販売終了」（`FoodTileGrid`の`ended`バッジ表記。`common.ended`と同一文言だが、商品タイル上のバッジ表示はPhase2C（`food-card.tsx`系と合わせて検討）に回す）
- `AreaShopList`内の「すべての販売場所を見る（あと○か所）」「○か所」「フード施設」「未確認」「不明」「店舗未確認」「エリア確認中」「日」（変数埋め込み・店舗種別ラベルのため）

### 2.3 `/stores/[id]` の固定見出し（新規キー追加）

`lib/i18n/dictionaries.ts`に`store.*`を新設し、`app/stores/[id]/page.tsx` / `components/store-food-list.tsx`内の以下の**変数を含まない固定文言**のみを`t()`化する。

| キー | ja（現状の文言） |
|---|---|
| `store.backToList` | 店舗一覧へ戻る |
| `store.availableFoods` | この店舗で買える商品 |
| `store.availableFoodsEmpty` | この店舗で買える商品はまだ登録されていません。 |

**対象外（Phase2A範囲外）**: 「○品を掲載しています。」「営業時間」「公式サイト」「店舗情報」「店舗種別」「エリア」「スケジュール」など、変数埋め込み・他ページとの重複検討が必要なものは今回は触らない。

### 2.4 ホームの短い固定コピー（新規キー追加）

`lib/i18n/dictionaries.ts`に`collection.*`を新設し、`components/home-progress-client.tsx`内の以下の文言のみを`t()`化する。

| キー | ja（現状の文言） |
|---|---|
| `collection.firstBite` | 最初の1品から。 |
| `collection.tagline` | 食べると、棚が色づく。 |

**対象外（Phase2A範囲外）**: 「今集められるフード」「すべて見る」「登録済みコレクションへ」「販売中の登録フードはすべて記録済みです。登録済みコレクションから写真を見返せます。」「期間限定コレクション」（`home-progress-client.tsx`）、「エリア一覧」「店舗から探す」「登録済みコレクションを見る」（`home-dashboard.tsx`）はPhase2Bで対応する。home v1.2のセクション構成・デザインには一切触れない。

### 2.5 `app-header.tsx` / `app-footer.tsx`（確認のみ）

Phase1で既に`nav.*`/`footer.*`が配線済み。Phase2Aでの追加変更は不要。**ファイルを変更する必要がある場合は、その理由を最終報告に明記すること。**

### 2.6 `components/bottom-nav.tsx` について

このファイルは存在しない。モバイル下部ナビは`components/app-header.tsx`内の`<nav className="... md:hidden">`として実装されており、Phase1で既に`t(item.labelKey)`化済み。**新規ファイルを作成しないこと。**

---

## 3. 翻訳辞書追加方針

`lib/i18n/dictionaries.ts`の既存4言語ブロック（ja/en/ko/zh-TW）それぞれに、2.2〜2.4で定義した`area.*` / `store.*` / `collection.*`キーを追加する。

- ja の値は、上記表の「現状の文言」と**完全一致**させること（句読点・全角/半角を含めて変更しない）。
- en/ko/zh-TWは、既存の`nav.*`/`footer.*`/`settings.*`/`common.*`の訳文と語調・トーンを揃える（カジュアルで簡潔な表現、絵文字なし）。
- `TranslationKey`の型は`keyof (typeof dictionaries)["ja"]`から自動導出されるため、4言語すべてに同じキーが揃っていることを確認する（キー数の不一致がないこと）。

---

## 4. 絶対に維持するもの

- home v1.2のレイアウト・セクション構成・スペーシング・配色（Phase2Aでは文言差し替えのみ）
- area-detail-v1.1のレイアウト・セクション構成・スペーシング・配色（Phase2Aでは文言差し替えのみ）
- `/stores/[id]`の既存レイアウト
- Phase1で実装済みの`LocaleProvider`/`useLocale`/`t()`/`localStorage`キー(`unicolle-locale`)・自己修復ロジック・`document.documentElement.lang`同期
- URL構造（`/en` `/ko` `/zh-TW`等のロケール別ルートを追加しない）
- 商品名・店舗名・エリア名・カテゴリ名・ジャンル名（データ由来の固有名詞は一切翻訳しない）

---

## 5. 禁止事項

- 商品名の翻訳
- 店舗名の翻訳
- エリア名の翻訳
- カテゴリ名・ジャンル名の翻訳
- URL構造の変更
- `/en` `/ko` `/zh-TW`等のロケール別ルートの追加
- 外部翻訳APIの利用
- 自動翻訳の導入
- DB（Supabase）スキーマ・データの変更
- generated JSON（フード/店舗/エリアデータ）の変更
- クローラー関連コードの変更
- home v1.2のデザイン変更
- area-detail-v1.1のデザイン変更
- 大規模リファクタリング（i18n基盤の構造変更、`t()`シグネチャ変更、ファイル分割・再構成など）
- 2.1〜2.4で明示した対象外文言への着手（Phase2B/2C/2D範囲）

---

## 6. 実装対象ファイル候補

- `lib/i18n/dictionaries.ts`（`area.*` / `store.*` / `collection.*`キー追加、`common.*`は既存キーを使用）
- `lib/i18n/use-locale.tsx`（変更不要見込み。型エラーが出た場合のみ最小修正）
- `components/home-progress-client.tsx`（2.4）
- `app/areas/[id]/page.tsx`（2.2）
- `components/area-collection-summary.tsx`（2.2、対象外文言に注意）
- `components/area-eaten-foods.tsx`（2.2）
- `components/area-food-status-lists.tsx`（2.2、対象外文言に注意）
- `app/stores/[id]/page.tsx`（2.3）
- `components/store-food-list.tsx`（2.3）
- `components/app-footer.tsx`（確認のみ、原則変更不要）
- `components/app-header.tsx`（確認のみ、原則変更不要）

このリスト以外のファイル（`components/food-card.tsx`, `components/food-detail.tsx`, `app/foods/*`, `app/eaten/*`, `app/stores/page.tsx`, `app/areas/page.tsx`, `lib/constants.ts`等）は変更しないこと。

---

## 7. 検証要件（すべて実行・結果を最終報告に記載）

### 7.1 コード品質

- `npm run lint`
- `npm run typecheck`
- `npm run build`

いずれも成功すること。`TranslationKey`型の不整合（4言語間のキー数不一致など）が出ないこと。

### 7.2 表示確認

- ja / en / ko / zh-TW の4言語で、`/`（ホーム）・`/areas/[id]`（任意の1エリア）・`/stores/[id]`（任意の1店舗）を確認し、2.2〜2.4で追加したキーが正しく表示されること。
- 幅 390 / 430 / 768 / 1280 / 1920 で、上記3ページのレイアウト崩れ（overflow・テキストの折れ・重なり）がないこと。特にko/zh-TWで見出し文言が長くなる場合の折り返しを確認すること。

### 7.3 既存デザインの非破壊確認

- home v1.2が壊れていないこと（ヒーロー、今集められるフード、期間限定コレクション、エリア一覧、店舗から探す、登録済みコレクションを見る、各セクションの構造・文言が2.4の対象範囲以外で変化していないこと）
- area-detail-v1.1が壊れていないこと（まず食べたい3品、終了間近のフード、残りのフード、販売終了フード、販売場所、AreaCollectionSummaryの各表示パターンが2.2の対象範囲以外で変化していないこと）

### 7.4 翻訳範囲の遵守確認

- 商品名・店舗名・エリア名が翻訳されていないこと（ja以外の言語選択時も、商品名・店舗名・エリア名は日本語表示のまま）
- カテゴリ名・ジャンル名が翻訳されていないこと

### 7.5 URL構造の確認

- `/`, `/areas/[id]`, `/stores/[id]`等のURLが変更されていないこと（`/en` `/ko` `/zh-TW`等のルートが追加されていないこと）

---

## 8. Git運用

1. `git status`で作業ツリーがクリーンであることを確認
2. バックアップコミット（変更がなければ`--allow-empty`）: `backup-before-i18n-phase2a`
3. push
4. 本ドキュメントの範囲のみ実装
5. lint/typecheck/buildが通ることを確認
6. コミット: `implement-i18n-phase2a`
7. push

---

## 9. Codex CLI確認対応

作業中に確認が必要な場合（例: en/ko/zh-TWの訳文表現、キー名の細部）は、本ドキュメントの方針を優先しつつ、文言のトーン（カジュアル・簡潔・絵文字なし、既存`common.*`/`nav.*`/`footer.*`/`settings.*`と統一）に従って判断してよい。ただし、2.1〜2.4で「対象外」と明記した文言には着手しないこと。判断に迷う場合は実装を進めず、最終報告に質問として記載すること。

---

## 10. 最終報告形式

以下を含めて報告すること。

1. 追加した辞書キー一覧（`area.*` / `store.*` / `collection.*`）と4言語の訳文
2. `common.*`のうち実際に配線したキーと、配線先ファイル・箇所
3. `common.*`のうち配線しなかったキーとその理由（対象ファイル内に該当文言がなかった場合など）
4. 変更したファイル一覧（`git diff --stat`）
5. `npm run lint` / `npm run typecheck` / `npm run build` の結果
6. ja/en/ko/zh-TWでの表示確認結果（`/`, `/areas/[id]`, `/stores/[id]`）
7. 390/430/768/1280/1920での表示確認結果
8. home v1.2 / area-detail-v1.1の非破壊確認結果
9. 商品名・店舗名・エリア名・カテゴリ名が翻訳されていないことの確認結果
10. URL構造が変更されていないことの確認結果
11. コミットハッシュ（backup / implement）とpush結果
12. 判断に迷った点・Owner確認が必要な点（あれば）

---

本ドキュメントの範囲はPhase2Aのみ。Phase2B/2C/2Dは別途設計・`/goal`化する。
