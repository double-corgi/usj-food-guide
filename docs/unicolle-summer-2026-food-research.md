# Unicolle 2026 Summer Food Research

- 対象: 第1グループ（夏祭り・屋外販売系）
- 情報確認日: 2026-07-06
- 登録状態: 価格未確認のため全件 `draft`
- 今回変更しないもの: generated JSON / manual_foods / food_overrides / Supabase / UI

## 参照した公式ソース

- USJ公式イベントページ: https://www.usj.co.jp/web/ja/jp/events/summer-2026/universal-summer/matsuri-nights
- USJ公式食べ歩きフード特集: https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
- 合同会社ユー・エス・ジェイ公式ニュース: https://www.usj.co.jp/company/news/2026/0422/
- 公式 `contentdata` JSON:
  - https://www.usj.co.jp/contentdata/usj/ja/jp/events/summer-2026/universal-summer/matsuri-nights/index.html
  - https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html

## 公式ページ取得メモ

- `web/ja/jp/events/summer-2026/universal-summer/matsuri-nights` は本文取得できた。
- `web/ja/jp/restaurants/food-cart` は本文取得できた。
- `tridiondata/usj/ja/jp/restaurants/food-cart/index.html` は取得できたが、食べ歩きフードの内容が古い構成だったため、現行確認には `contentdata` 側を優先した。
- 価格は公式イベントページ、公式食べ歩きフード特集、公式 `contentdata` JSON の対象カード内では確認できなかった。
- 公式ニュース `2026/0422` は、イベント開催期間と夏祭り満喫セット価格を確認できるが、個別フード単品価格は確認できなかった。

## 公式で確認できた共通情報

- イベント名: ユニバーサル・サマー・マツリ・ナイト ～ネオン・グロウアップ～
- イベント開催期間: 2026年7月1日（水）～2026年8月26日（水）
- イベント開催時間: 18:30～21:00
- 例外: 2026年7月3日（金）および8月22日（土）は20:00まで。2026年8月21日（金）はイベント開催なし。
- ニュースリリース上の開催店舗: フードはユニバーサル・マーケット（ニューヨーク・エリア）をはじめ、パーク内レストランやフードカートなど。
- フード注意書き: 商品のデザイン、価格、販売店舗、販売方法および販売開始日などは予告なく変更の場合あり。品切れあり。天候や時間により営業しない店舗あり。
- 個別フードの販売開始日・販売終了日は公式本文上で商品単位には未確認。イベント期間は参考情報として保存し、商品販売期間としては確定しない。

## 第1グループ 商品別確認

### 夏祭りの金魚 レモンサイダー

- 正式商品名: 夏祭りの金魚 レモンサイダー
- 価格: 未確認
- 価格バリエーション: 夏祭りの金魚 レモンサイダー / 夏祭りの金魚 レモンサイダー ネオン・カップ付き（価格は両方未確認）
- 販売店舗: ユニバーサル・マーケット内ハピネス・ワゴン
- エリア: ニューヨーク・エリア
- カテゴリ: drink
- 商品説明: シュワっとしたレモンサイダーに鮮やかな金魚が浮かんだ夏祭りの爽やかドリンク。
- 販売開始日: 未確認（イベント開始日は2026-07-01）
- 販売終了日: 未確認（イベント終了日は2026-08-26）
- 販売時間条件: イベントは18:30～21:00。商品販売時間は未確認。天候や時間により営業しない店舗あり。
- テイクアウト可否: 可（食べ歩きフード特集 / フードカート掲載）
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/events/summer-2026/universal-summer/matsuri-nights
  - https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
- 商品画像:
  - 採用候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-summer-festival-goldfish-lemon-soda-with-neon-cup-summer-2026-gallery-a.jpg
  - 追加候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-summer-2026-matsuri-nights-goldfish-lemon-soda-infocard-h.jpg
  - 判定: 商品名と一致する公式画像。単品とネオン・カップ付きの2種が同一画像に含まれるため、価格差は `priceVariants` として扱う。
- 既存商品との重複: 同名なし。既存 `food-j4nvrm` とは同画像ブロックの関連商品だが別商品。
- 未確認項目: 価格、各バリエーション価格、商品単位の販売開始日、商品単位の販売終了日、商品単位の販売時間。

### 超！！ チョコバナナ・チュリトス

- 正式商品名: 超！！ チョコバナナ・チュリトス
- 価格: 未確認
- 価格バリエーション: 未確認
- 販売店舗: ユニバーサル・マーケット内ハピネス・ワゴン
- エリア: ニューヨーク・エリア
- カテゴリ: churro
- 商品説明: チョコバナナがチュリトスに変身。バナナフレーバーのチュリトスにチョコソース。
- 販売開始日: 未確認（イベント開始日は2026-07-01）
- 販売終了日: 未確認（イベント終了日は2026-08-26）
- 販売時間条件: イベントは18:30～21:00。商品販売時間は未確認。天候や時間により営業しない店舗あり。
- テイクアウト可否: 可（食べ歩きフード特集 / フードカート掲載）
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/events/summer-2026/universal-summer/matsuri-nights
  - https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
- 商品画像:
  - 採用候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-extreme-choco-banana-churritos-summer-2026-gallery-a.jpg
  - 追加候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-summer-2026-matsuri-nights-choco-banana-churritos-infocard-h.jpg
  - 判定: 商品名と一致する公式商品画像。
- 既存商品との重複:
  - `food-j4nvrm` 超!! チョコバナナ・チュリトス
  - 既存データは公式ニュース由来だが、店舗が「パーク内レストラン」、エリアが「スーパー・ニンテンドー・ワールド」、画像がミニオンのチョコバナナ・チュリトスになっており、今回確認した公式情報と不一致の可能性が高い。
  - 新規商品としてではなく、既存 `food-j4nvrm` の補正候補として扱う。
- 未確認項目: 価格、商品単位の販売開始日、商品単位の販売終了日、商品単位の販売時間。

### いちご練乳 ソーダスムージー

- 正式商品名: いちご練乳 ソーダスムージー
- 価格: 未確認
- 価格バリエーション: いちご練乳 ソーダスムージー / いちご練乳 ソーダスムージー ネオン・カップ付き（価格は両方未確認）
- 販売店舗: ユニバーサル・マーケット内トローリー・トリート
- エリア: ニューヨーク・エリア
- カテゴリ: drink
- 商品説明: いちご氷とソーダを混ぜて楽しむ、練乳がけかき氷風の冷たいドリンク。
- 販売開始日: 未確認（イベント開始日は2026-07-01）
- 販売終了日: 未確認（イベント終了日は2026-08-26）
- 販売時間条件: イベントは18:30～21:00。商品販売時間は未確認。天候や時間により営業しない店舗あり。
- テイクアウト可否: 可（食べ歩きフード特集 / フードカート掲載）
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/events/summer-2026/universal-summer/matsuri-nights
  - https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
- 商品画像:
  - 採用候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-strawberry-and-condensed-milk-seltzer-smoothie-with-neon-cup-summer-2026-gallery-a.jpg
  - 追加候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-summer-2026-matsuri-nights-strawberry-and-condensed-milk-seltzer-smoothie-infocard-h.jpg
  - 判定: 商品名と一致する公式画像。通常版とネオン・カップ付きは `priceVariants` として扱う。
- 既存商品との重複: 同名なし。
- 未確認項目: 価格、各バリエーション価格、商品単位の販売開始日、商品単位の販売終了日、商品単位の販売時間。

### カレーナン!? 焼きそばドッグ

- 正式商品名: カレーナン!? 焼きそばドッグ
- 価格: 未確認
- 価格バリエーション: 未確認
- 販売店舗: ユニバーサル・マーケット内ホットドッグカート
- エリア: ニューヨーク・エリア
- カテゴリ: snack
- 商品説明: 焼きそばをカレー風味のナンで楽しむワンハンドメニュー。
- 販売開始日: 未確認（イベント開始日は2026-07-01）
- 販売終了日: 未確認（イベント終了日は2026-08-26）
- 販売時間条件: イベントは18:30～21:00。商品販売時間は未確認。天候や時間により営業しない店舗あり。
- テイクアウト可否: 可（食べ歩きフード特集 / フードカート掲載）
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/events/summer-2026/universal-summer/matsuri-nights
  - https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
- 商品画像:
  - 採用候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-whats-this-yakisoba-dog-summer-2026-gallery-a.jpg
  - 追加候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-summer-2026-matsuri-nights-yakisoba-dog-infocard-h.jpg
  - 判定: 商品名と一致する公式商品画像。
- 既存商品との重複: 同名なし。
- 未確認項目: 価格、商品単位の販売開始日、商品単位の販売終了日、商品単位の販売時間。

## 同じ2026年夏イベントで公式掲載されている関連フード

### フローズン・ジントニック ～シトラス～

- 正式商品名: フローズン・ジントニック ～シトラス～
- 価格: 未確認
- 価格バリエーション: 通常 / ネオン・カップ付き（価格は両方未確認）
- 販売店舗: パークサイド・グリル
- エリア: ニューヨーク・エリア
- カテゴリ: drink
- 商品画像: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-frozen-gin-and-tonic-citrus-with-neon-cup-summer-2026-gallery-a.jpg
- 公式参照URL: https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
- 未確認項目: 価格、各バリエーション価格、販売期間、販売時間、テイクアウト可否。
- 重複候補: 同名なし。

### 25周年カクテル ～ポップコーンフレーバー？～

- 正式商品名: 25周年カクテル ～ポップコーンフレーバー？～
- 価格: 未確認（既存生成データには同名候補があるが、公式単品価格は今回未確認）
- 販売店舗: パークサイド・グリル
- エリア: ニューヨーク・エリア
- カテゴリ: drink
- テイクアウト可否: テイクアウト、店内どちらでも注文可（公式食べ歩きフード特集の注記）
- 商品画像: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-25th-anniversary-cocktail-popcorn-flavor-spring-2026-gallery-a.jpg
- 公式参照URL: https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
- 重複候補: `food-d5v0l2` / `food-gpkw6l` 25周年カクテル ~ポップコーンフレーバー?~。同一 `canonicalGroupId` (`group-16r5f57`) の既存生成データ。
- 未確認項目: 公式単品価格、販売期間、販売時間。

### キャラメルポップコーン!? チュリトス

- 正式商品名: キャラメルポップコーン!? チュリトス
- 価格: 公式単品価格は今回未確認（既存生成データでは `food-ymiw07` に800円の非公式/信頼レポート価格あり）
- 販売店舗: パークサイド・グリル横フードカート（公式食べ歩きフード特集の今回確認箇所）
- エリア: ニューヨーク・エリア
- カテゴリ: churro
- 商品画像: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-caramel-popcorn-churritos-spring-2026-gallery-a.jpg
- 公式参照URL: https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
- 重複候補: `food-ymiw07` キャラメルポップコーン!? チュリトス。新規追加ではなく既存商品の販売場所/夏イベント関連確認として扱う。
- 未確認項目: 公式単品価格、販売期間、販売時間。

## 非フード扱い・今回JSON追加しないもの

- ネオン・カップ: 容器/グッズ扱い。ドリンク商品の `priceVariants` のラベルとしてのみ扱う。
- 光る！ ボトルストラップ: ボトルストラップ単体。フードではないため、今回の食品ドラフトには追加しない。
- ゴブレット・ロブ / ゲーム景品: カーニバルゲーム/非売品。食品ではないため追加しない。

## 重複照合メモ

- 照合対象:
  - `scripts/output/foods.generated.json`
  - `data/manual-foods.json`
  - `data/manual-food-overrides.json`
  - `data/duplicate-overrides.json`
- 同名なし:
  - 夏祭りの金魚 レモンサイダー
  - いちご練乳 ソーダスムージー
  - カレーナン!? 焼きそばドッグ
  - フローズン・ジントニック ～シトラス～
- 既存補正/重複候補:
  - `food-j4nvrm` 超!! チョコバナナ・チュリトス: 公式の夏祭り商品と同一候補。ただし既存の店舗・エリア・画像が不一致。
  - `food-ymiw07` キャラメルポップコーン!? チュリトス: 同名既存商品。新規追加しない。
  - `food-d5v0l2` / `food-gpkw6l` 25周年カクテル ～ポップコーンフレーバー？～: 同一 `canonicalGroupId` の既存同名候補あり。新規追加しない。
- 通常版とカップ付きは別商品にしない。`priceVariants` として扱う。

## 今回の判断

- 公式で商品名、画像、販売店舗、エリア、カテゴリ、説明は確認できた。
- 価格と商品単位の販売期間が不足しているため、全件 `draft`。
- `approved` は使用しない。
- 禁止されている大文字ブランド表記は使用しない。

## 第2グループ（レストラン・デザート系）追記

- 対象: 第2グループ（レストラン・デザート系）
- 情報確認日: 2026-07-06
- 登録状態: 商品単位の販売開始日・販売終了日が未確認のため、新規追記分は全件 `draft`
- 今回変更しないもの: generated JSON / manual_foods / food_overrides / Supabase / UI

## 第2グループで参照した公式ソース

- USJ公式シーズナルメニュー: https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
- USJ公式店舗ページ（パークサイド・グリル）: https://www.usj.co.jp/web/ja/jp/restaurants/park-side-grille
- USJ公式店舗ページ（SAIDO）: https://www.usj.co.jp/web/ja/jp/restaurants/saido
- USJ公式店舗ページ（ルイズ N.Y. ピザパーラー）: https://www.usj.co.jp/web/ja/jp/restaurants/louies-ny-pizza-parlor
- USJ公式店舗ページ（ビバリーヒルズ・ブランジェリー）: https://www.usj.co.jp/web/ja/jp/restaurants/beverly-hills-boulangerie
- USJ公式店舗ページ（メルズ・ドライブイン）: https://www.usj.co.jp/web/ja/jp/restaurants/mels-drive-in
- 公式 `contentdata` JSON:
  - https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/seasonal-food/index.html
  - https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/park-side-grille/index.html
  - https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/saido/index.html
  - https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/louies-ny-pizza-parlor/index.html
  - https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/beverly-hills-boulangerie/index.html
  - https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/mels-drive-in/index.html

## 第2グループ公式ページ取得メモ

- シーズナルメニュー公式ページで、夏向けレストランメニューとデザート系商品の商品名、説明、販売場所、画像を確認した。
- 店舗ページで確認できた価格は公式価格として保存した。
- 価格表記は公式ページ上で税込価格と明記されている。
- 商品単位の販売開始日・販売終了日は、今回確認した公式本文内では未確認。
- 店舗営業時間は確認日周辺の営業予定として保存し、商品販売期間とは分けて扱う。
- りんご飴と水風船、フローズン・スムージー3種は公式画像が複数商品同時掲載のため、商品単体画像としては `imageUrl` を空にし、公式画像候補に保存する。

## 第2グループ 商品別確認

### りんご飴 ～りんごのムース～

- 正式商品名: りんご飴 ～りんごのムース～
- 価格: 950円（公式店舗ページで「各 ￥950」と確認）
- 価格バリエーション: 水風船 ～ピーチゼリー＆レアチーズムース～と同価格。別商品として扱い、同一画像候補のみ共有。
- 販売店舗: ビバリーヒルズ・ブランジェリー
- エリア: ハリウッド・エリア
- カテゴリ: dessert
- 商品説明: りんご飴がケーキになった商品。角切り果肉と、カリっとした飴の歯ざわりをザラメで表現。
- 販売開始日: 未確認
- 販売終了日: 未確認
- 販売時間条件: 商品単位の販売時間は未確認。店舗営業時間は確認日周辺で9:00～21:00中心。
- テイクアウト可否: 未確認
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/beverly-hills-boulangerie
- 商品画像:
  - 採用: なし（単体画像未確認）
  - 候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-candy-apple-apple-mousse-and-water-balloon-peach-jelly-and-cheese-mousse-summer-2026-offercard-h.jpg
  - 候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-candy-apple-apple-mousse-and-water-balloon-peach-jelly-cheese-mousse-summer-2026-gallery-a.jpg
  - 判定: 公式画像は水風船との同時掲載。誤画像を避けるため `imageUrl` は空にする。
- 既存商品との重複: 同名なし。
- 未確認項目: 商品単位の販売開始日、商品単位の販売終了日、商品単位の販売時間、テイクアウト可否、単体商品画像。

### 水風船 ～ピーチゼリー＆レアチーズムース～

- 正式商品名: 水風船 ～ピーチゼリー＆レアチーズムース～
- 価格: 950円（公式店舗ページで「各 ￥950」と確認）
- 価格バリエーション: りんご飴 ～りんごのムース～と同価格。別商品として扱い、同一画像候補のみ共有。
- 販売店舗: ビバリーヒルズ・ブランジェリー
- エリア: ハリウッド・エリア
- カテゴリ: dessert
- 商品説明: 水風船のフォルムが印象的なカップデザート。桃とレアチーズムースの爽やかな味わい。
- 販売開始日: 未確認
- 販売終了日: 未確認
- 販売時間条件: 商品単位の販売時間は未確認。店舗営業時間は確認日周辺で9:00～21:00中心。
- テイクアウト可否: 未確認
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/beverly-hills-boulangerie
- 商品画像:
  - 採用: なし（単体画像未確認）
  - 候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-candy-apple-apple-mousse-and-water-balloon-peach-jelly-and-cheese-mousse-summer-2026-offercard-h.jpg
  - 候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-candy-apple-apple-mousse-and-water-balloon-peach-jelly-cheese-mousse-summer-2026-gallery-b.jpg
  - 判定: 公式画像はりんご飴との同時掲載。誤画像を避けるため `imageUrl` は空にする。
- 既存商品との重複: 同名なし。
- 未確認項目: 商品単位の販売開始日、商品単位の販売終了日、商品単位の販売時間、テイクアウト可否、単体商品画像。

### 紫陽花 ～葡萄と柚子の和氷菓 焼き菓子添え～

- 正式商品名: 紫陽花 ～葡萄と柚子の和氷菓 焼き菓子添え～
- 価格: 1,800円
- 価格バリエーション: 未確認
- 販売店舗: SAIDO
- エリア: ニューヨーク・エリア
- カテゴリ: dessert
- 商品説明: 葡萄シロップをかけて移ろう色味と雨の庭園の静寂を感じさせる氷菓。紫陽花の庭園を模した多彩な食感の和風デザート。
- 販売開始日: 未確認
- 販売終了日: 未確認
- 販売時間条件: 商品単位の販売時間は未確認。店舗営業時間は確認日周辺で10:30～20:00。
- テイクアウト可否: 未確認
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/saido
- 商品画像:
  - 採用候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-hydrangea-grape-and-yuzu-japanese-shaved-ice-with-cake-summer-2026-gallery-a.jpg
  - 追加候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-hydrangea-grape-and-with-yuzu-japanese-japanese--shaved-ice-with-cake-summer-2026-offercard-h.jpg
  - 判定: 商品名と一致する公式商品画像。
- 既存商品との重複: 同名なし。
- 未確認項目: 価格バリエーション、商品単位の販売開始日、商品単位の販売終了日、商品単位の販売時間、テイクアウト可否。

### 柑橘おろしと白みその冷やしうどん御膳

- 正式商品名: 柑橘おろしと白みその冷やしうどん御膳
- 価格: 2,600円
- 価格バリエーション: 未確認
- 販売店舗: SAIDO
- エリア: ニューヨーク・エリア
- カテゴリ: meal
- 商品説明: 夏にぴったりの冷製うどんと天ぷらの盛合わせ。柑橘おろしと胡麻味噌だれで味の変化を楽しめる。天ぷら3種、白胡麻豆腐、季節のジュレ、紅白なます、香の物付き。
- 販売開始日: 未確認
- 販売終了日: 未確認
- 販売時間条件: 商品単位の販売時間は未確認。店舗営業時間は確認日周辺で10:30～20:00。
- テイクアウト可否: 未確認
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/saido
- 商品画像:
  - 採用候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-cold-udon-set-meal-with-citrus-grated-radish-and-white-miso-summer-2026-gallery-a.jpg
  - 追加候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-cold-udon-set-meal-with-citrus-grated-radish-and-white-miso-summer-2025-v2-offercard-h.jpg
  - 判定: 商品名と一致する公式商品画像。店舗ページの画像ファイル名は2025を含むが、2026-07-06確認時点の公式店舗ページ掲載画像。
- 既存商品との重複: 同名なし。
- 未確認項目: 価格バリエーション、商品単位の販売開始日、商品単位の販売終了日、商品単位の販売時間、テイクアウト可否。

### オマール海老の冷製パスタ アメリケーヌのグラニテ添え

- 正式商品名: オマール海老の冷製パスタ アメリケーヌのグラニテ添え
- 価格: 3,300円
- 価格バリエーション: 未確認
- 販売店舗: パークサイド・グリル
- エリア: ニューヨーク・エリア
- カテゴリ: pasta
- 商品説明: ひんやり冷たいグラニテ仕立てのソースが特徴の冷製パスタ。海鮮と野菜のさまざまな食感を楽しめる。ソフトドリンク付き。
- 販売開始日: 未確認
- 販売終了日: 未確認
- 販売時間条件: オープン～15:00まで販売。
- テイクアウト可否: 未確認
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/park-side-grille
- 商品画像:
  - 採用候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-chilled-lobster-pasta-with-americaine-granita-summer-2026-gallery-a.jpg
  - 追加候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-chilled-lobster-pasta-with-americaine-granita-summer-2026-offercard-h.jpg
  - 判定: 商品名と一致する公式商品画像。
- 既存商品との重複: 同名なし。
- 未確認項目: 価格バリエーション、商品単位の販売開始日、商品単位の販売終了日、テイクアウト可否。

### プルドポーク＆チキン・スパイシー BBQ ピッツアセット

- 正式商品名: プルドポーク＆チキン・スパイシー BBQ ピッツアセット
- 価格: 1,950円（ピッツァセット）
- 価格バリエーション: ホールピッツァ 6,900円。セット違いとして `priceVariants` 候補に保存。
- 販売店舗: ルイズ N.Y. ピザパーラー
- エリア: ニューヨーク・エリア
- カテゴリ: pizza
- 商品説明: プルドポークとチキンのBBQピッツァ。野菜の彩りとハラペーニョがアクセント。ピッツァセットはフライドポテト、ソフトドリンク付き。
- 販売開始日: 未確認
- 販売終了日: 未確認
- 販売時間条件: 商品単位の販売時間は未確認。店舗営業時間は確認日周辺で9:30～20:30。
- テイクアウト可否: 未確認
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/louies-ny-pizza-parlor
- 商品画像:
  - 採用候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-pulled-pork-and-chicken-spicy-bbq-pizza-meal-summer-2026-gallery-a.jpg
  - 追加候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-pizza-pulled-pork-and-chicken-spicy-bbq-summer-2026-offercard-h.jpg
  - 判定: 商品名と一致する公式商品画像。
- 既存商品との重複: 同名なし。
- 未確認項目: 商品単位の販売開始日、商品単位の販売終了日、商品単位の販売時間、テイクアウト可否。

## 第2グループ 関連商品

### ガーリック・シュリンプ・ピッツァセット

- 正式商品名: ガーリック・シュリンプ・ピッツァセット
- 価格: 1,950円（ピッツァセット）
- 価格バリエーション: ホールピッツァ 6,900円。セット違いとして `priceVariants` 候補に保存。
- 販売店舗: ルイズ N.Y. ピザパーラー
- エリア: ニューヨーク・エリア
- カテゴリ: pizza
- 商品説明: ガーリックたっぷりのピッツァ。焼いたレモンの爽やかさで味の変化も楽しめる。ピッツァセットはフライドポテト、ソフトドリンク付き。
- 商品画像: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-louies-pizza-meal-garlic-shrimp-summer-2026-gallery-a.jpg
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/louies-ny-pizza-parlor
- 未確認項目: 商品単位の販売開始日、商品単位の販売終了日、商品単位の販売時間、テイクアウト可否。
- 重複候補: 同名なし。

### クランチ・タコスバーガーセット

- 正式商品名: クランチ・タコスバーガーセット
- 価格: 2,100円
- 価格バリエーション: 未確認
- 販売店舗: メルズ・ドライブイン
- エリア: ハリウッド・エリア
- カテゴリ: burger
- 商品説明: サクサク食感がポイントのタコスバーガー。フライドポテト、ソフトドリンク付き。
- 商品画像: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-crunchy-taco-burger-meal-summer-2026-gallery-a.jpg
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/mels-drive-in
- 未確認項目: 商品単位の販売開始日、商品単位の販売終了日、商品単位の販売時間、テイクアウト可否。
- 重複候補: 同名なし。

### SAIDO スペシャルドリンク ～柚子～/ ～抹茶～/ ～西瓜～

- 正式商品名: SAIDO スペシャルドリンク ～柚子～/ ～抹茶～/ ～西瓜～
- 価格: 各700円
- 価格バリエーション: 柚子 / 抹茶 / 西瓜。すべて700円。
- 販売店舗: SAIDO
- エリア: ニューヨーク・エリア
- カテゴリ: drink
- 商品説明: 公式店舗ページのおすすめメニューに同時掲載されているスペシャルドリンク3種。
- 商品画像: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-saido-special-drink-yuzu-green-tea-watermelon-summer-2026-offercard-h.jpg
- 公式参照URL: https://www.usj.co.jp/web/ja/jp/restaurants/saido
- 未確認項目: 商品単位の販売開始日、商品単位の販売終了日、商品単位の販売時間、テイクアウト可否、各味の個別説明。
- 重複候補: 同名なし。

### ストロベリー・フローズン・スムージー / トロピカルフルーツ・フローズン・スムージー / マンゴー・フローズン・スムージー

- 正式商品名:
  - ストロベリー・フローズン・スムージー
  - トロピカルフルーツ・フローズン・スムージー
  - マンゴー・フローズン・スムージー
- 価格:
  - ストロベリー: 800円
  - トロピカルフルーツ: 900円
  - マンゴー: 800円
- 販売店舗: ビバリーヒルズ・ブランジェリー
- エリア: ハリウッド・エリア
- カテゴリ: drink
- 商品説明: 公式シーズナルページと店舗ページに同時掲載されているフローズン・スムージー3種。
- 商品画像:
  - 採用: なし（3商品同時掲載画像のみ確認）
  - 候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-tropical-frozen-smoothie-strawberry-and-mixed-tropical-fruits-and-mango-offercard-h.jpg
  - 候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-tropical-frozen-smoothie-strawberry-and-mixed-tropical-fruits-and-mango-gallery-a.jpg
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/beverly-hills-boulangerie
- 未確認項目: 商品単位の販売開始日、商品単位の販売終了日、商品単位の販売時間、テイクアウト可否、単体商品画像、個別説明。
- 重複候補: 同名なし。

## 第2グループで除外する公式同時掲載物

- ジョーズ・ドリンクボトル: ボトル/容器系商品のため食品ドラフトには追加しない。
- ネオン・カップ: 容器/グッズ扱い。ドリンク商品の `priceVariants` としてのみ扱う。
- 光る！ ボトルストラップ: ボトルストラップ単体。食品ではないため追加しない。

## 第2グループ 重複照合メモ

- 照合対象:
  - `scripts/output/foods.generated.json`
  - `data/manual-foods.json`
  - `data/manual-food-overrides.json`
  - `data/duplicate-overrides.json`
  - 第1グループの `data/imports/unicolle-summer-2026-drafts.json`
- 正規化商品名、商品名直接検索、画像URL、店舗、エリア、価格を確認した。
- 第2グループ新規追記対象について、既存生成データ、manual、overrides、第1グループ内に同名候補なし。
- 価格違い/セット違いは別商品にせず、ピッツァセットとホールピッツァを `priceVariants` として扱う。
- 複数商品同時掲載画像は、誤画像を避けるため `imageUrl` を空にし、`imageCandidates` にだけ保存する。

## 第2グループの判断

- 公式で価格まで確認できたものは価格を保存した。
- 商品単位の販売開始日・販売終了日が未確認のため、第2グループの新規追記分は全件 `draft`。
- 第1グループで価格未確認だった `フローズン・ジントニック ～シトラス～` と `25周年カクテル ～ポップコーンフレーバー？～` は、パークサイド・グリル公式店舗ページで価格を確認できたためJSON側を補完する。
