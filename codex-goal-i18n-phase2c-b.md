# codex-goal-i18n-phase2c-b.md

## 0. 位置づけ

Codex向けの実装指示書である。i18n Phase 2A / 2B / 2B.1 / 2C-A / 2C-A.1 で確立した仕組み（`useLocale`/`t(key, params?)`/`lib/i18n/dictionaries.ts`/`components/i18n-text.tsx`）をそのまま再利用する。新しい仕組み・新しいライブラリは追加しない。

参照ドキュメント（実装前に必ず確認すること。存在しないファイルは無視し、実在する構成に合わせること）:
- `docs/i18n-design-v1.md`
- `docs/i18n-coverage-review-v1.md`
- `docs/i18n-phase2-design-v1.md`
- `docs/i18n-phase2c-design-v1.md`
- `docs/design-review-i18n-phase2c-a.md`
- `docs/design-review-i18n-phase2c-a1.md`
- `lib/i18n/dictionaries.ts`
- `lib/i18n/use-locale.tsx`
- `app/foods/[id]/page.tsx`
- `components/food-detail.tsx`
- `components/food-card.tsx`
- `components/food-grid.tsx`

本ドキュメントは i18n Phase 2C のうち **Phase 2C-B** の実装範囲を定める。

---

## 1. Objective（今回やること）

`/foods/[id]`（商品詳細ページ）の固定UI文言のみを多言語化する（ja/en/ko/zh-TW、ja基準・フォールバック）。

- 対象ファイル: `components/food-detail.tsx`（中心）、必要であれば`app/foods/[id]/page.tsx`
- 対象外ページ: `/foods`, `/`, `/eaten`, `/areas`, `/areas/[id]`, `/stores`, `/stores/[id]`
- `components/food-card.tsx`/`components/food-grid.tsx`は**Phase 2C-Aで対応済みのため、今回は変更しない**（再利用のみ）。

---

## 2. 翻訳スコープ

以下は`components/food-detail.tsx`を実際に確認した上での対応表である。ユーザーが提示した候補文言と実装上の文言が異なる場合は、**実装上の文言を基準にする**。

### 2.1 既存キーの再利用（新規追加不要）

| 実装上の文言 | 該当行 | 再利用キー |
| --- | --- | --- |
| `食べた` / `食べた済み`（食べたボタン） | 137行目 | `foodCard.markEaten` / `foodCard.eatenDone`（Phase2C-A.1で追加済み） |
| `販売場所`（見出し） | 160行目 | `area.salesLocations`（Phase2Aで追加済み、値が完全一致） |
| `近日販売`（販売状況バッジ） | 104行目 | `foods.badgeUpcoming`（Phase2C-Aで追加済み） |
| `限定`（122行目の単独バッジ）、`◇ 限定`（107行目の`◇`付きバッジの「限定」部分） | 107, 122行目 | `foods.badgeLimited`（Phase2C-Aで追加済み）。107行目は`◇`を固定文字として残し、`◇ {t("foods.badgeLimited")}`のように組み立てる |
| `× 販売終了`（101行目の`×`付きバッジの「販売終了」部分） | 101行目 | `common.ended`（Phase1で追加済み）。`×`を固定文字として残し、`× {t("common.ended")}`のように組み立てる |
| `価格未確認`（256行目、確認情報内の価格状態dd値） | 256行目 | `foods.priceUnknown`（Phase2C-Aで追加済み） |

### 2.2 新規キー（`foodDetail.*`名前空間）

| 実装上の文言 | 該当行 | 新規キー（案） | 備考 |
| --- | --- | --- | --- |
| `一覧へ戻る` | 77行目 | `foodDetail.backToList` | ユーザー候補と一致 |
| `前` | 83行目 | `foodDetail.previous` | ユーザー候補にないが固定UI文言のため追加 |
| `次` | 88行目 | `foodDetail.next` | 同上 |
| `どこで買える？` | 157行目 | `foodDetail.howToBuy` | 販売場所セクションのキッカー |
| `価格未確認。公式・現地情報の確認を推奨します。` | 124行目 | `foodDetail.priceUnknownNote` | `foods.priceUnknown`とは別の長文のため新規キー |
| `次回食べたい` / `保存済み` | 148行目 | `foodDetail.wantNext` / `foodDetail.wantSaved` | `foodDetail.wantNext`はユーザー候補と一致。`保存済み`は新規 |
| `公式サイトを見る` | 209行目 | `foodDetail.officialSite` | |
| `図鑑を巡る` | 216行目 | `foodDetail.relatedKicker` | 関連商品セクションのキッカー |
| `関連商品` | 217行目 | `foodDetail.relatedTitle` | ユーザー候補「関連するフード」とは表記が異なるが、実装文言の`関連商品`をベースにする |
| `関連度順` | 219行目（`RelatedRail`の`title`） | `foodDetail.relatedRailTitle` | |
| `確認情報` | 223行目 | `foodDetail.confirmationInfo` | ユーザー候補と一致 |
| `カテゴリ` | 226行目（`<dl>` `<dt>`） | `foodDetail.category` | ラベルのみ。値（`categoryLabels[food.category]`）は翻訳しない |
| `形式` | 230行目 | `foodDetail.diningType` | ラベルのみ |
| `期間` | 234行目 | `foodDetail.period` | ラベルのみ。値（`period.label`、`getSalePeriodLabel`の戻り値）は翻訳しない（2.4参照） |
| `現在コンプ対象` | 238行目 | `foodDetail.completable` | ラベル |
| `対象` / `対象外` | 239行目 | `foodDetail.completableYes` / `foodDetail.completableNo` | 値 |
| `販売開始` | 242行目 | `foodDetail.saleStart` | ラベル |
| `販売終了`（246行目、確認情報内のdtラベル） | 246行目 | `foodDetail.saleEnd` | **注意**: 101行目の`× 販売終了`バッジとは文脈が異なる別キー。`common.ended`を再利用せず、確認情報用の独立キーとする（バッジとラベルで意味が異なるため） |
| `価格確認` | 250行目 | `foodDetail.priceCheck` | ラベルのみ。値（`getPriceSourceLabel`の戻り値）は翻訳しない（2.4参照） |
| `価格状態` | 255行目 | `foodDetail.priceStatus` | ラベル |
| `確認日` | 260行目 | `foodDetail.checkedDate` | ラベル |
| `未確認`（243, 247, 261行目: `formatDateLong`/`formatDateShort`の空値フォールバック、および販売終了日が確認できない場合） | 243, 247, 261行目 | `foodDetail.dateUnknown` | 日付フォーマット自体は翻訳しないが、「未確認」という状態文言は翻訳してよい |
| `未定`（247行目: 販売終了日が未定の場合） | 247行目 | `foodDetail.dateUndecided` | |
| `1店舗のみ` / `${shops.size}店舗`（`getSalesSummary`の`shopLabel`） | 330行目 | `foodDetail.shopCountSingle` / `foodDetail.shopCount`（`{{count}}`差し込み: `{{count}}店舗`） | `getSalesSummary`はファイル内のローカル関数のため、`t`を引数として渡すか、呼び出し側で組み立てる |
| `エリア確認中` / `1エリア` / `${areas.size}エリア`（`getSalesSummary`の`areaLabel`） | 331行目 | `foodDetail.areaChecking` / `foodDetail.areaCountSingle` / `foodDetail.areaCount`（`{{count}}`差し込み: `{{count}}エリア`） | `foodDetail.areaChecking`はユーザー候補「エリア確認中」と一致 |

### 2.3 ユーザー候補のうち実装に見当たらないもの（追加しない）

以下はユーザーが提示した候補文言だが、`components/food-detail.tsx`を確認した結果、該当する固定UI文言が見当たらなかった。**Phase2C-Aの方針と同様、無理に新規UI要素を追加しない。**

- `図鑑コード`: `getZukanCode(food, allFoods)`の結果（コード値、例: `#001`相当）は99行目で表示されているが、「図鑑コード」というラベル自体は表示されていない。値はgenerated data由来のため翻訳対象外。ラベルを新設するのはUI追加にあたるため、今回は追加しない。
- `エリア`: 確認情報`<dl>`内に単独の「エリア」ラベルは存在しない（`getDisplayLocationAreaName`の結果は販売場所セクション内に表示されるが、見出しラベルとしての「エリア」はない）。
- `店舗`: 同様に確認情報`<dl>`内に単独の「店舗」ラベルは存在しない。
- `食べた記録に追加`: 実装は`食べた`/`食べた済み`（2.1で対応済み、`foodCard.markEaten`/`foodCard.eatenDone`を再利用）。「食べた記録に追加」という別文言は存在しない。
- `販売情報`: 該当する見出しは見当たらない（「どこで買える？」「販売場所」が近い）。
- `店舗確認中`: 実装には`店舗未確認`という文字列が`getSalesSummary`/`getDisplayLocations`内の**比較条件**として使われているが、これはUIラベルとして直接表示されるものではない（ショップ集合から除外するための判定値）。表示文言としては存在しないため、翻訳対象に追加しない。
- `期間限定`: `common.limited`（Phase1で追加済み、「期間限定」）に該当する文言は`components/food-detail.tsx`内には見当たらない（`food.isLimited`のバッジは「限定」/「◇ 限定」であり、2.1で対応済み）。
- `このフードを記録する`: 該当する文言は見当たらない。
- `ほかの販売場所`: 該当する文言は見当たらない（「販売場所」セクション内に複数の販売場所がリスト表示されるが、見出しは「販売場所」のみ）。

これらについて、もし実装側で別の表現として既に存在する場合（例: `FoodCorrectionReportForm`コンポーネント内など、本指示書の確認対象外ファイル）は、`components/food-detail.tsx`の直接の子要素ではない可能性があるため、**深追いせず対象外として最終報告に記載すること**。新規UI文言の追加は行わない。

### 2.4 `lib/food-utils.ts`/`lib/constants.ts`由来の値（翻訳しない・関数改修もしない）

Phase2C-A/2C-A.1で確立した方針を継続する。以下はライブラリ関数の戻り値、または型名辞書の値であり、**今回はリファクタ・関数シグネチャ変更を行わず、翻訳しない**。

- `categoryLabels[food.category]`（114, 227行目）: カテゴリ名（翻訳禁止対象）
- `shopTypeLabels[location.shopType]`（190行目）: 店舗種別名
- `diningTypeLabels[food.diningType]`（55行目）: 食べ方の名称
- `getSaleStatusLabel(food)`（120行目）: 販売状況ラベル（`lib/food-utils.ts`関数）
- `getSaleUrgencyLabel(food)`（121行目、`urgencyLabel`）: 緊急度ラベル（同上）
- `getPriceSourceLabel(priceSource)`（251行目）: 価格確認元ラベル（同上）
- `getSalePeriodLabel(food)`（`getPeriodSummary`内、407行目）: 販売期間ラベル（同上）
- `getDisplayLocationAreaName(location, food)`（187行目）: エリア表示名（同上、エリア名と「エリア確認中」を両方返す可能性があるため特に注意。**この関数の戻り値そのものは変更・翻訳しない**）
- `inferDiningLabel(food)`（410-415行目、`food-detail.tsx`内のローカル関数）: `カート販売`/`食べ歩き`/`店内飲食`/`形式未確認`を返す。`diningTypeLabels`と同種の「食べ方の名称」を返すため、`diningTypeLabels`と同様に**翻訳しない**（一貫性のため）。

これらの関数・定数を変更すると影響範囲が`/foods`や他ページにも及ぶため、本Phaseでは触らない。最終報告に「翻訳対象外とした関数・定数」として一覧化すること。

---

## 3. 翻訳してはいけないもの（再確認）

- 商品名（`food.name`）
- 店舗名（`food.shop.name`, `location.shopName`）
- エリア名（`food.area.name`, `location.areaName`、ただし`getDisplayLocationAreaName`が返す「エリア確認中」という状態文言は2.4により対象外＝変更しない。エリアの固有名詞のみ翻訳禁止という意味で、状態文言も含めて今回は触らない）
- カテゴリ名・ジャンル名（`categoryLabels`/`shopTypeLabels`/`diningTypeLabels`の値）
- 商品説明・レビュー本文（`FoodReviews`コンポーネント、本指示書の対象外）
- 価格そのもの（`formatFoodPrice`/`formatPrice`の出力）
- 日付フォーマット（`formatDateShort`/`formatDateLong`の`Intl.DateTimeFormat("ja-JP", ...)`は変更しない。ただし「未確認」「未定」という代替文言は2.2で翻訳対象）
- 「25周年」などイベント名
- 画像内テキスト
- generated JSON由来の商品データ全般

---

## 4. `t()`の利用方法

Phase2B.1〜2C-A.1で確定済みの方式をそのまま使う。

- 通常の固定文言: `t("foodDetail.backToList")`
- 変数差し込み: `t("foodDetail.shopCount", { count: shops.size })` のように、辞書側の値に`{{count}}`を埋め込み`t()`が`replaceAll`で置換する（既存実装のまま、変更不要）
- `getSalesSummary`はファイル内のローカル関数であり、現在`useLocale()`を呼べない場所で定義されている。対応方法は以下のいずれかとする（Codexの実装上の判断に委ねるが、**大規模リファクタにしないこと**）:
  - (a) `getSalesSummary(food, t)`のように`t`を引数として渡す
  - (b) `getSalesSummary`は件数（`shopCount`/`areaCount`/エリア確認中かどうか）のみを返すように変更し、表示側（コンポーネント本体）で`t()`を使って文言を組み立てる
  - いずれの場合も、関数の戻り値の「意味」（件数・エリア確認中フラグ）を変えないこと

---

## 5. URL方針（変更禁止）

- `/foods/[id]`のURL構造・パラメータを変更しない
- `/en`, `/ko`, `/zh-TW`のようなロケール別パスを追加しない
- ルーティング追加、SEO対応、App Store文言対応は行わない
- `localStorage`の`unicolle-locale`、`document.documentElement.lang`の同期は既存のまま

---

## 6. 禁止事項

- `/foods`の追加改修（`components/food-grid.tsx`、`app/foods/page.tsx`の変更。Phase2C-Aで完了済み）
- `/eaten`, `/areas`, `/areas/[id]`, `/stores`, `/stores/[id]`の改修
- `components/food-card.tsx`、`components/food-grid.tsx`の変更（Phase2C-Aで対応済みのキーを参照・再利用するのみ）
- 商品名・店舗名・エリア名・カテゴリ名・ジャンル名の翻訳
- 外部翻訳API・自動翻訳の利用
- DB変更、generated JSON変更、crawlerの変更
- URL構造変更
- ホームv1.2のデザイン変更
- area-detail-v1.1のデザイン変更
- `lib/food-utils.ts`/`lib/constants.ts`の大規模リファクタ（2.4参照。`getSalesSummary`への`t`受け渡し程度の小さな変更は許容するが、関数の責務・戻り値の意味を変えるような変更は行わない）
- 無関係な整形・リファクタ（import順の調整、フォーマッタの一括適用等を含む）

---

## 7. 検証要件

### 7.1 静的検証

- `npm run lint`
- `npm run typecheck`
- `npm run build`

すべて成功すること。

### 7.2 表示検証

確認ページ: `/foods/[id]`（複数商品で確認: 価格あり/価格未確認、限定/通常、販売中/販売終了/近日販売、販売場所が複数/単数/0件のパターンを含む）, `/foods`, `/settings`, `/`, `/areas/[id]`, `/eaten`

確認言語: ja / en / ko / zh-TW
確認幅: 390px / 430px / 768px / 1280px / 1920px

確認項目:
- `/foods/[id]`の固定UI文言（2.1/2.2のキー）が各言語で正しく表示される
- 商品名・店舗名・エリア名が翻訳されていない（ja原文のまま、全言語で）
- カテゴリ名・ジャンル名（`categoryLabels`/`shopTypeLabels`/`diningTypeLabels`の値）が翻訳されていない
- 「25周年」等のイベント名が翻訳されていない
- URL構造が変わっていない
- `/en` `/ko` `/zh-TW` が追加されていない（404のまま）
- `/foods`のPhase2C-A実装（フィルター・並び替え・検索・カード表示）が壊れていない
- ホームv1.2が壊れていない
- area-detail-v1.1が壊れていない
- 390px/430pxで文字切れがない
- overflow 0 / clipped 0 / 横スクロールなし

---

## 8. Git運用

作業開始前:
```
git status
```
未コミット変更がある場合:
```
git add .
git commit -m "backup-before-i18n-phase2c-b"
git push
```
未コミット変更がない場合:
```
git commit --allow-empty -m "backup-before-i18n-phase2c-b"
git push
```

作業完了後:
```
git add .
git commit -m "implement-i18n-phase2c-b-food-detail"
git push
```

---

## 9. Codex CLI確認対応

Codex CLIの確認画面が出た場合は必ず「2. Yes, and don't ask again」を選択する。確認質問・途中停止は行わず、本指示書の範囲内（2章のスコープ、6章の禁止事項に違反しない）であればすべて選択2で進めて最後まで実行すること。

---

## 10. 最終報告フォーマット

以下を含めて報告すること。

1. 実装した内容
2. 追加した辞書キー一覧（ja/en/ko/zh-TWの値を含む、`foodDetail.*`名前空間）
3. 再利用した既存キー一覧（`foodCard.markEaten`/`foodCard.eatenDone`/`area.salesLocations`/`foods.badgeUpcoming`/`foods.badgeLimited`/`common.ended`/`foods.priceUnknown`等）
4. 翻訳対象にした範囲（2.1/2.2のキーと、対応する`components/food-detail.tsx`内の箇所）
5. 翻訳対象外にした範囲（2.3: 候補文言のうち実装に存在しなかったもの、2.4: `lib/food-utils.ts`/`lib/constants.ts`由来で翻訳しなかったもの）
6. 商品名/店舗名/エリア名/カテゴリ名/ジャンル名/イベント名を翻訳していないことの確認結果
7. URL変更なしの確認結果（`/foods/[id]`のURL構造、`/en` `/ko` `/zh-TW`が404のまま）
8. 変更ファイル一覧（`git diff <backup>..<implement> --stat`）
9. `lint`/`typecheck`/`build`の結果
10. ja/en/ko/zh-TWでの確認結果（`/foods/[id]`を中心に）
11. 390/430/768/1280/1920での確認結果（文字切れ・overflow・横スクロールの有無）
12. `/foods`のPhase2C-A実装が壊れていないことの確認結果
13. ホームv1.2が壊れていないことの確認結果
14. area-detail-v1.1が壊れていないことの確認結果
15. localhost確認結果
16. Vercel確認結果
17. バックアップコミットハッシュ・実装コミットハッシュ
18. push成功確認

---

まだ実装しないこと。本指示書はCodexへの実装指示書としての作成のみであり、Claude自身はコード変更・git操作を行わない。
