# USJ 7月以降フード追加調査 v1

## 1. 調査概要

USJの7月以降の夏イベント、季節フード、期間限定フードについて、UNICOLEに追加すべき食品があるかを調査した。

確認した対象は以下。

- 公式USJページ
- 既存crawler設定
- 既存sourceUrl
- 既存generated JSON
- `scripts/output/foods.generated.json`
- `scripts/output/shops.generated.json`

今回の調査では以下を行っていない。

- generated JSONは変更していない
- crawlerは実行していない
- DBは触っていない
- `data/translations` は変更していない
- `app` / `components` / `public` は変更していない
- 公式以外の情報を確定データとして扱っていない

主に確認した公式ソースは以下。

- https://www.usj.co.jp/tridiondata/usj/ja/jp/events/summer-2026/universal-summer/matsuri-nights/index.html
- https://www.usj.co.jp/company/news/2026/0422/
- https://www.usj.co.jp/company/news/2026/0424/
- https://www.usj.co.jp/tridiondata/usj/ja/jp/events/onepiece/summer-2026/index.html
- https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/seasonal-food/index.html
- https://www.usj.co.jp/company/news/2026/0513/

## 2. 既存データ状況

`scripts/output/foods.generated.json` と `npm run audit:duplicates` の結果から、調査時点の食品データ状況は以下。

- total: 294
- unique food.id: 292
- public active: 180
- public archive: 181
- ended: 35
- limited: 92
- permanent: 202
- with image: 226
- without image: 68

現在の表示件数は、食品重複3ペア修正後の public active 180品を前提とする。

seasonal / event 系は、既存データ内では `isLimited` や `saleStatus`、sourceUrl、crawlerのsource分類により扱われている。特にイベント・季節フードは、`restaurants/seasonal-food`、`restaurants/food-cart`、公式news、eventページ由来のデータが混在している。

sourceUrl傾向は以下。

- 公式 `tridiondata/usj/ja`: 211件
- `castel.jp/p/3101`: 54件
- 公式PDF map: 17件
- 公式 `company/news`: 3件

既存crawlerの入口として、`package.json` には以下のようなcrawl scriptsがある。

- `crawl`
- `crawl:restaurants`
- `crawl:events`
- `crawl:news`
- `crawl:pdfs`
- `crawl:quality`
- `crawl:seasonal`
- `crawl:limited`
- `crawl:foodcarts`

`scripts/crawlers/crawl-targeted-pages.ts` には、`restaurants/seasonal-food` や `events/summer-2026/universal-summer/matsuri-nights` などのseedが含まれている。Matsuri系は既存crawler seedで拾える可能性がある。一方、ONE PIECE 2026の公式news `2026/0424` と `events/onepiece/summer-2026` は、次フェーズでseed追加の確認が必要。

## 3. 新規追加候補

### 夏祭りの金魚 レモンサイダー ネオンカップ付き

- name: 夏祭りの金魚 レモンサイダー ネオンカップ付き
- expected price: 公式確認範囲では未確認
- expected area/shop: ニューヨーク・エリア / ユニバーサル・マーケット内ハピネス・ワゴン
- period: 2026年7月1日（水）から2026年8月26日（水）までのイベント期間
- sales start: 2026年6月29日（月）
- sourceUrl:
  - https://www.usj.co.jp/tridiondata/usj/ja/jp/events/summer-2026/universal-summer/matsuri-nights/index.html
  - https://www.usj.co.jp/company/news/2026/0422/
- image候補: `usj-gds-summer-2026-matsuri-nights-lemon-soda-offercard-h.jpg`
- 既存データに同名/類似があるか: 同名・明確な類似は既存データ内に見つからない
- 追加優先度: 高

注意:

- 現在日は2026年6月20日のため、販売開始が2026年6月29日なら active ではなく upcoming 扱いが妥当。
- ネオンカップ単体はグッズ/容器扱いの可能性があるため、food単体としては慎重に扱う。
- 公式ページ上では `超!! チョコバナナ・チュリトス` と並んで紹介されており、画像はoffer card型の共通画像である可能性がある。
- 個別価格は今回確認した公式情報からは取得できていないため、crawlerまたは公式詳細の再確認が必要。

## 4. 既存更新候補

### 超!! チョコバナナ・チュリトス

- existing food.id: `food-j4nvrm`
- note: 依頼文では `food-j4ivrm` と記載があったが、調査時点の `foods.generated.json` で確認できた実在IDは `food-j4nvrm`。

現在の issue:

- `saleStatus` は upcoming
- price が未設定
- shop が「パーク内レストラン」等の広い値になっている可能性がある
- area が公式販売場所とずれている可能性がある
- 正確な販売場所/価格/期間/画像を公式sourceUrlで再確認すべき

action:

- 新規追加ではなく既存データ補正候補。
- 公式sourceUrl上の販売場所は `ユニバーサル・マーケット内ハピネス・ワゴン` と読めるため、次フェーズで crawler結果または公式ページ構造を確認する。
- 2026年6月29日販売開始であれば、2026年6月20日時点では upcoming のままでよい。

## 5. Watch候補

### ごく甘ぶどうメロリンラブ・スウィーツ

- source:
  - https://www.usj.co.jp/company/news/2026/0424/
  - https://www.usj.co.jp/tridiondata/usj/ja/jp/events/onepiece/summer-2026/index.html
- status: ONE PIECE 2026 / サンジの海賊レストラン関連の事前販売スイーツとして確認
- 価格/画像/販売場所がまだ不十分
- action: 公式詳細公開後に再確認

注意:

- 公式newsでは、サンジの海賊レストラン購入者向けの持ち帰りスイーツとして紹介されている。
- 通常販売食品としてUNICOLEに追加すべきかは、販売形態・価格・画像・sourceUrlの詳細確認が必要。
- 現時点では確定追加ではなく watch 候補とする。

## 6. 追加しない/既存扱い

- キャラメルポップコーン!? チュリトス: 既存データにあり
- ターキーレッグ!? まん: 既存データにあり
- ネオンカップ単体: foodではなくグッズ/容器扱いの可能性が高い
- ネオン・カップ&ソフトドリンク系: 公式上で食品として明確に分離できるまでは保留
- いちご練乳 ソーダスムージー: 今回確認した公式ソースでは食品として確認できず、確定候補にしない
- カレーナン!? 焼きそばドッグ: 今回確認した公式ソースでは食品として確認できず、確定候補にしない
- その他、公式で食品として確認できないものは確定候補にしない

## 7. 既存データとの差分

### 既に存在する

- `food-j4nvrm` 超!! チョコバナナ・チュリトス
- `food-ymiw07` キャラメルポップコーン!? チュリトス
- `food-19nx8rb` ターキーレッグ!? まん

### 新規追加候補

- 夏祭りの金魚 レモンサイダー ネオンカップ付き

### 期間更新だけ必要

- `food-j4nvrm` 超!! チョコバナナ・チュリトス
  - 2026年6月29日販売開始、2026年7月1日から8月26日のイベント期間と整合するか確認が必要。

### 画像更新だけ必要

- `food-j4nvrm` 超!! チョコバナナ・チュリトス
  - 公式offer card画像が既存画像より適切か確認が必要。
- 夏祭りの金魚 レモンサイダー ネオンカップ付き
  - 新規追加時に公式画像候補を確認する必要がある。

### 店舗情報更新だけ必要

- `food-j4nvrm` 超!! チョコバナナ・チュリトス
  - `ユニバーサル・マーケット内ハピネス・ワゴン` への補正候補。
  - store id / URL構造への影響がないように、既存store生成ロジックとの整合確認が必要。

### 保留

- ごく甘ぶどうメロリンラブ・スウィーツ
- ネオンカップ単体
- ネオン・カップ&ソフトドリンク系
- 公式で食品として確認できない未確定候補

## 8. 推奨フロー

1. 公式sourceUrl seedを確認する
2. 限定crawlの対象URLを確定する
3. generated JSONを更新する前にバックアップする
4. crawlまたは差分確認を小さく実行する
5. generated JSON差分を確認する
6. coverage確認を実行する
7. `audit:duplicates` 確認を実行する
8. 画像品質レビューを実行する
9. 必要なら `food-names` 翻訳seedを追加する
10. Vercel再deployを行う

特に注意する点:

- crawlerを実行する前に、Matsuri系とONE PIECE系の公式sourceUrl seedを分けて確認する。
- `crawl:events` / `crawl:seasonal` / `crawl:limited` のどれで拾うべきかを先に確認する。
- generated JSON更新時は、対象外の既存foodに大きな差分が出ていないか確認する。
- 2026年6月20日時点では、2026年6月29日販売開始の商品を active にしない。
- 新規追加後は翻訳seed、画像品質、重複監査、coverage確認を別途行う。

## 9. 次の実装候補

次はまだ本追加ではなく、以下の準備タスクが妥当。

- 公式Matsuri/ONE PIECE sourceUrl seedの差分確認
- crawler実行前のバックアップ方針確認
- `crawl:events` / `crawl:seasonal` / `crawl:limited` のどれで拾えるか確認
- generated JSON更新は次フェーズ

次フェーズの候補:

1. Matsuri公式sourceUrlだけを対象にした限定crawl差分確認
2. ONE PIECE 2026公式sourceUrlのcrawler seed追加検討
3. `夏祭りの金魚 レモンサイダー ネオンカップ付き` の新規追加可否レビュー
4. `food-j4nvrm` 超!! チョコバナナ・チュリトスの店舗/エリア/期間/画像補正レビュー
5. 追加・補正後の翻訳seed、画像品質、重複監査、coverage確認
