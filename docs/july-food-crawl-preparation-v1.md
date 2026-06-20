# USJ 7月フード限定crawl準備 v1

## 1. 対象候補

`docs/july-food-addition-research-v1.md` をもとに、7月以降フード追加前のsourceUrl seedとcrawler経路を確認した。

今回の調査では以下を行っていない。

- crawlerは実行していない
- DBは実行していない
- generated JSONは変更していない
- `scripts/output` は変更していない
- `data/translations` は変更していない
- `app` / `components` / `public` は変更していない

### 新規追加候補

#### 夏祭りの金魚 レモンサイダー ネオンカップ付き

- 公式sourceUrl:
  - https://www.usj.co.jp/tridiondata/usj/ja/jp/events/summer-2026/universal-summer/matsuri-nights/index.html
  - https://www.usj.co.jp/company/news/2026/0422/
- expected area/shop: ニューヨーク・エリア / ユニバーサル・マーケット内ハピネス・ワゴン
- sales start: 2026年6月29日（月）
- event period: 2026年7月1日（水）から2026年8月26日（水）
- expected status: 現在日が2026年6月20日なら upcoming 扱いが妥当
- price: 公式確認範囲では未確認
- image候補: `usj-gds-summer-2026-matsuri-nights-lemon-soda-offercard-h.jpg`
- 既存データ: 同名・明確な類似なし

### 既存更新候補

#### 超!! チョコバナナ・チュリトス

- existing food.id: `food-j4nvrm`
- 依頼文で出ていた `food-j4ivrm` は、現行 `foods.generated.json` では確認できなかった
- current sourceUrl: https://www.usj.co.jp/company/news/2026/0422/
- current issue:
  - `saleStatus` は upcoming
  - priceが未設定
  - areaが `スーパー・ニンテンドー・ワールド`
  - shopが `パーク内レストラン`
  - 公式Matsuriページで確認できる販売場所とずれている可能性がある
- action: 新規追加ではなく、既存データ補正候補

### Watch候補

#### ごく甘ぶどうメロリンラブ・スウィーツ

- 公式sourceUrl:
  - https://www.usj.co.jp/company/news/2026/0424/
  - https://www.usj.co.jp/tridiondata/usj/ja/jp/events/onepiece/summer-2026/index.html
- status: ONE PIECE 2026 / サンジの海賊レストラン関連の事前販売スイーツ候補
- issue:
  - 価格が未確認
  - 画像が未確認
  - 通常販売食品として扱うべきか未確定
  - 販売場所/販売形態が不十分
- action: 今回の限定crawl対象には含めず、公式詳細公開後またはseed追加後のwatch対象にする

### 追加しない候補

- キャラメルポップコーン!? チュリトス: 既存データにあり
- ターキーレッグ!? まん: 既存データにあり
- ネオンカップ単体: foodではなくグッズ/容器扱いの可能性が高い
- ネオン・カップ&ソフトドリンク系: 公式上で食品として明確に分離できるまでは保留
- 公式で食品として確認できないもの: 確定候補にしない

## 2. 公式sourceUrl seed確認

### Matsuri候補

対象URL:

- https://www.usj.co.jp/web/ja/jp/events/summer-2026/universal-summer/matsuri-nights
- https://www.usj.co.jp/tridiondata/usj/ja/jp/events/summer-2026/universal-summer/matsuri-nights/index.html
- https://www.usj.co.jp/company/news/2026/0422/
- https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
- https://www.usj.co.jp/web/ja/jp/restaurants/food-cart

既存seed状況:

- `scripts/crawlers/crawl-targeted-pages.ts` の `eventSeeds` に `company/news/2026/0422/` がある
- `scripts/crawlers/crawl-targeted-pages.ts` の `eventSeeds` に `events/summer-2026/universal-summer/matsuri-nights` がある
- `seasonal` / `limited` config は `eventSeeds` と `restaurants/seasonal-food` を使う
- `foodcarts` config は `restaurants/food-cart` を使うが、Matsuri eventSeedsは直接含まない

結論:

- Matsuri候補は既存seedで拾える可能性が高い
- 最初に使う候補は `crawl:seasonal` または `crawl:limited`
- チュリトスだけを見るなら `crawl:churros` も候補だが、レモンサイダーは漏れる可能性がある
- レモンサイダーを拾う可能性を考えると、`crawl:seasonal` / `crawl:limited` を優先する

### ONE PIECE候補

対象URL:

- https://www.usj.co.jp/company/news/2026/0424/
- https://www.usj.co.jp/web/ja/jp/events/onepiece/summer-2026
- https://www.usj.co.jp/tridiondata/usj/ja/jp/events/onepiece/summer-2026/index.html

既存seed状況:

- `eventSeeds` に `company/news/2026/0424/` はない
- `eventSeeds` に `events/onepiece/summer-2026` はない
- `coverage` の linkPattern は `/web/ja/jp/events` と `/company/news/20` をたどれるが、seedにないURLへ必ず到達できるとは限らない

結論:

- ONE PIECE 2026系は、次フェーズでseed追加の検討が必要
- 現時点では個別食品情報が不足しているため、Matsuri限定crawlとは分ける
- `ごく甘ぶどうメロリンラブ・スウィーツ` はwatch扱いで、今回のgenerated JSON更新対象にしない

### seasonal / event / food-cart URL候補

既存seedとして確認できた主要URL:

- https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
- https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
- https://www.usj.co.jp/web/ja/jp/restaurants/popcorn-cart
- https://www.usj.co.jp/web/ja/jp/events
- https://www.usj.co.jp/web/ja/jp/events/summer-2026/universal-summer/matsuri-nights
- https://www.usj.co.jp/company/news/2026/0422/
- https://www.usj.co.jp/company/news/2026/0423/
- https://www.usj.co.jp/company/news/2026/0513/

## 3. crawler入口

### 使えそうなnpm script

優先候補:

- `npm run crawl:seasonal`
  - `scripts/crawl-category.ts seasonal`
  - `targetConfigs.seasonal`
  - `eventSeeds` と `restaurants/seasonal-food` を対象にする
  - Matsuri event pageを拾える可能性が高い

- `npm run crawl:limited`
  - 実体は `scripts/crawl-category.ts seasonal`
  - `crawl:seasonal` と同じmodeで動く
  - 使うなら `crawl:seasonal` に統一した方が分かりやすい

補助候補:

- `npm run crawl:churros`
  - `company/news/2026/0422/` をseedに含む
  - `超!! チョコバナナ・チュリトス` の確認には使える
  - レモンサイダーはキーワード対象外になりやすい

- `npm run crawl:drinks`
  - ドリンク系キーワードを持つ
  - ただし `company/news/2026/0422/` とMatsuri event pageがseedにないため、現状では夏祭りレモンサイダーを拾えない可能性が高い

- `npm run crawl:foodcarts`
  - food-cart系には強い
  - Matsuri eventSeedsは直接含まない

### 使えそうなscripts

- `scripts/crawl-category.ts`
  - 限定crawlの実行入口
  - 既存 `latest-crawl-report.json` のsourceを差し替えながら `foods.generated.json` / `shops.generated.json` / `areas.generated.json` / category reportを書き出す

- `scripts/crawlers/crawl-targeted-pages.ts`
  - sourceUrl seed本体
  - Matsuri seedは既に存在
  - ONE PIECE 2026 seedは追加検討が必要

- `scripts/debug/dataset-diff-report.ts`
  - before/afterの差分確認に使える候補
  - 次タスクで、バックアップしたJSONと更新後JSONを比較する用途に向く

- `scripts/debug/visible-delta.ts`
  - 表示対象の変化確認に使える候補

### 実行してはいけないscript

今回の準備段階では、以下は実行しない。

- `npm run crawl`
- `npm run crawl:restaurants`
- `npm run crawl:events`
- `npm run crawl:news`
- `npm run crawl:pdfs`
- `npm run crawl:quality`
- `npm run crawl:images`
- `npm run crawl:image-candidates`
- `npm run crawl:food-images`
- `scripts/debug/augment-generated-from-official-pages.ts`
- `scripts/debug/regenerate-from-report.ts`
- `scripts/debug/apply-*`

理由:

- 広範囲にgenerated JSONを書き換える可能性がある
- DB persistenceやsource統合範囲が広くなる可能性がある
- 今回のMatsuri候補だけを見るには過剰

### 生成される可能性があるファイル

`scripts/crawl-category.ts` を実行すると、少なくとも以下が更新される可能性がある。

- `scripts/output/foods.generated.json`
- `scripts/output/shops.generated.json`
- `scripts/output/areas.generated.json`
- `scripts/output/latest-crawl-report.json`
- `scripts/output/seasonal.crawl-report.json`

`scripts/crawl-usj-foods.ts` を実行すると、以下も更新対象になる。

- `scripts/output/latest-foods.json`
- `scripts/output/latest-crawl-report.json`
- `scripts/output/foods.generated.json`
- `scripts/output/shops.generated.json`
- `scripts/output/areas.generated.json`

## 4. 安全な次手順

### バックアップ対象

次回crawl前に、最低限以下を `/private/tmp` などgit管理外へコピーする。

- `scripts/output/foods.generated.json`
- `scripts/output/shops.generated.json`
- `scripts/output/areas.generated.json`
- `scripts/output/latest-crawl-report.json`

任意で以下もバックアップする。

- `scripts/output/seasonal.crawl-report.json`
- `scripts/output/latest-foods.json`

### 先に確認すべき差分

crawler実行前に確認するもの:

- `git status --short`
- `git status --short --branch`
- `git log -3 --oneline`
- `rg -n "summer-2026|matsuri|onepiece|0422|0424|seasonal-food|food-cart" scripts`
- `rg -n "夏祭りの金魚|チョコバナナ|メロリン" scripts/output/foods.generated.json`

### 限定crawlの実行候補

次回実行するなら、第一候補は以下。

```bash
npm run crawl:seasonal
```

理由:

- `targetConfigs.seasonal` が `eventSeeds` と `restaurants/seasonal-food` を含む
- Matsuri event pageと `company/news/2026/0422/` が既存seedにある
- `夏祭りの金魚 レモンサイダー ネオンカップ付き` と `超!! チョコバナナ・チュリトス` の両方を拾える可能性が比較的高い

第二候補:

```bash
npm run crawl:churros
```

用途:

- `超!! チョコバナナ・チュリトス` の補正確認
- レモンサイダー確認には不十分な可能性がある

第三候補:

```bash
npm run crawl:drinks
```

用途:

- レモンサイダー系のキーワードには合う
- ただし現状seedにMatsuri公式ページがないため、実行前にseed追加が必要になる可能性がある

### 失敗時の戻し方

次回crawl実行後、想定外差分が出た場合は以下で戻す。

```bash
git restore scripts/output/foods.generated.json
git restore scripts/output/shops.generated.json
git restore scripts/output/areas.generated.json
git restore scripts/output/latest-crawl-report.json
git restore scripts/output/seasonal.crawl-report.json
git restore scripts/output/latest-foods.json
```

未追跡出力が出た場合は、対象を確認してから削除する。`git add .` は使わない。

### generated JSON更新後に見るべきdiff

必ず確認するもの:

- 新規foodが `夏祭りの金魚 レモンサイダー ネオンカップ付き` に限定されているか
- `food-j4nvrm` の変更が name / price / area / shop / sourceUrl / image / saleStatus の想定範囲に収まっているか
- 2026年6月20日時点で、6月29日販売開始の商品が active になっていないか
- food.id / store.id / URL構造が変わっていないか
- 既存180品の表示対象が大きく変化していないか
- `shops.generated.json` に意図しない大量差分がないか
- `areas.generated.json` に意図しない差分がないか
- `latest-crawl-report.json` のsource coverageとerrors

検証候補:

```bash
npm run coverage
npm run audit:duplicates
npm run lint
npm run typecheck
npm run build
```

## 5. Stop条件

次回の限定crawl/追加作業では、以下に該当したら停止する。

- sourceUrlが公式確認できない
- crawlerが広範囲すぎる
- generated JSON差分が大きすぎる
- 画像候補が不明
- 店舗/価格/期間が不明
- `food-j4nvrm` 以外の既存foodに大量差分が出る
- `夏祭りの金魚 レモンサイダー ネオンカップ付き` 以外の新規foodが大量に出る
- active/upcomingの判定が現在日と矛盾する
- `shops.generated.json` / `areas.generated.json` に想定外の構造差分が出る
- data/translations更新が必要になる
- DB / crawler全実行が必要になる

## 6. 次のCodex /goal案

次回は、まだ本追加ではなく「限定crawl実行と差分確認」に絞る。

推奨する次タスク:

- Matsuri公式sourceUrlを既存seedで拾えるか確認する
- generated JSONをバックアップする
- `npm run crawl:seasonal` を1回だけ実行する
- generated JSON差分を確認する
- 想定差分ならreview用に停止、または限定コミットする
- 想定外差分なら即restoreして報告する

ONE PIECE 2026系は、Matsuri限定crawlとは分離する。

