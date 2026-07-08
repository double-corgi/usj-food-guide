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

# 第3グループ: フードカート・キャラクター系ドリンク・フラッペ

- 情報確認日: 2026-07-06
- 対象: フードカート掲載商品、キャラクター系ドリンクボトル、フラッペ。
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
  - https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/minion-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/evil-eats
  - https://www.usj.co.jp/web/ja/jp/restaurants/delicious-me-the-cookie-kitchen
  - https://www.usj.co.jp/web/ja/jp/restaurants/snoopys-backlot-cafe
  - https://www.usj.co.jp/web/ja/jp/restaurants/boardwalk-snacks
  - https://www.usj.co.jp/web/ja/jp/restaurants/wharf-cafe
  - https://www.usj.co.jp/web/ja/jp/restaurants/amity-landing-restaurant
- 取得メモ:
  - `snoopy-backlot-cafe` と `boardwalk-snack` の単数形URLは本文取得できず、公式シーズナルページ内リンクから `snoopys-backlot-cafe` と `boardwalk-snacks` を確認した。
  - 公式フードカート/シーズナルページは商品名・販売場所・画像を確認できるが、価格は店舗ページ側で確認したものを優先した。
  - ジュラシック・パーク・ドリンクボトルは公式フードカート掲載と画像は確認できたが、公式ページ内の価格本文は確認できなかった。

## 第3グループ 調査結果

### クラッシュ！大悪党のブラッドオレンジ・フローズンソーダ

- 正式商品名: クラッシュ！大悪党のブラッドオレンジ・フローズンソーダ
- 価格: 900円
- 価格バリエーション: 未確認
- 販売店舗: イーブル・イーツ
- エリア: ミニオン・パーク
- カテゴリ: drink
- 商品説明: 公式フードカート/ミニオンフードでは販売場所と商品名を確認。商品本文説明は未確認。
- 販売開始日: 未確認
- 販売終了日: 未確認
- 販売時間条件: 商品単位の販売時間は未確認
- テイクアウト可否: フードカート/スナック系掲載のため候補はあるが、公式本文で個別明記なし
- 商品画像: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-villain-con-blood-orange-frozen-soda-summer-2026-offercard-h.jpg
- 画像出典URL: https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/evil-eats/index.html
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
  - https://www.usj.co.jp/web/ja/jp/restaurants/minion-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/evil-eats
- 未確認項目: 販売開始日、販売終了日、商品単位の販売時間、テイクアウト可否、商品説明本文、価格バリエーション。
- 重複候補: 同名なし。

### 映画スターのミニオンフラッペ ～ピーチ＆レモン～

- 正式商品名: 映画スターのミニオンフラッペ ～ピーチ＆レモン～
- 価格: 900円
- 価格バリエーション: 未確認
- 販売店舗: デリシャス・ミー！ ザ・クッキー・キッチン
- エリア: ミニオン・パーク
- カテゴリ: dessert_drink
- 商品説明: 公式フードカート/ミニオンフードでは販売場所と商品名を確認。商品本文説明は未確認。
- 販売開始日: 未確認
- 販売終了日: 未確認
- 販売時間条件: 商品単位の販売時間は未確認
- テイクアウト可否: フードカート/スナック系掲載のため候補はあるが、公式本文で個別明記なし
- 商品画像: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-movie-star-minion-frappe-peach-and-lemon-summer-2026-offercard-h.jpg
- 画像出典URL: https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/delicious-me-the-cookie-kitchen/index.html
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
  - https://www.usj.co.jp/web/ja/jp/restaurants/minion-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/delicious-me-the-cookie-kitchen
- 未確認項目: 販売開始日、販売終了日、商品単位の販売時間、テイクアウト可否、商品説明本文、価格バリエーション。
- 重複候補: 同名なし。

### スヌーピー・フラッペ ～いちごミルク＆白桃～

- 正式商品名: スヌーピー・フラッペ ～いちごミルク＆白桃～
- 価格: 900円
- 価格バリエーション: 未確認
- 販売店舗: スヌーピー™・バックロット・カフェ
- エリア: ユニバーサル・ワンダーランド
- カテゴリ: dessert_drink
- 商品説明: サーフィンを楽しむスヌーピーがおしゃれなフラッペ。サーフボードの飾り付き。
- 販売開始日: 未確認
- 販売終了日: 未確認
- 販売時間条件: 商品単位の販売時間は未確認
- テイクアウト可否: 未確認
- 商品画像: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-snoopy-frappe-offercard-h.jpg
- 画像出典URL: https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/snoopys-backlot-cafe/index.html
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/snoopys-backlot-cafe
- 未確認項目: 販売開始日、販売終了日、商品単位の販売時間、テイクアウト可否、価格バリエーション。
- 重複候補: 同名なし。

### 遊泳禁止!! ジョーズ・フラッペ ～ピーチ＆ソルトホイップ～

- 正式商品名: 遊泳禁止!! ジョーズ・フラッペ ～ピーチ＆ソルトホイップ～
- 価格: 900円
- 価格バリエーション: 未確認
- 販売店舗: ボードウォーク・スナック
- エリア: アミティ・ビレッジ
- カテゴリ: dessert_drink
- 商品説明: 遊泳禁止のサインと白波から覗くジョーズの気配を表現した、ピーチ＆ソルトホイップのフラッペ。
- 販売開始日: 未確認
- 販売終了日: 未確認
- 販売時間条件: 商品単位の販売時間は未確認
- テイクアウト可否: フードカート/スナック系掲載のため候補はあるが、公式本文で個別明記なし
- 商品画像: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-no-swimming-allowed-jaws-frappe-peach-salt-whip-offercard-h.jpg
- 画像出典URL: https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/boardwalk-snacks/index.html
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/boardwalk-snacks
- 未確認項目: 販売開始日、販売終了日、商品単位の販売時間、テイクアウト可否、価格バリエーション。
- 重複候補: 同名なし。

### トロピカル・フラッペ ～ストロベリー～

- 正式商品名: トロピカル・フラッペ ～ストロベリー～
- 価格: 800円
- 価格バリエーション: 通常 800円 / ネオン・カップ付き 1,650円
- 販売店舗: ワーフカフェ、ボードウォーク・スナック
- エリア: サンフランシスコ・エリア、アミティ・ビレッジ
- カテゴリ: dessert_drink
- 商品説明: 夏に食べたいフルーツかき氷。ネオン・カップ付きの価格バリエーションあり。
- 販売開始日: 未確認
- 販売終了日: 未確認
- 販売時間条件: ネオン・カップ＆フラッペを18:00までに購入でソフトドリンク（L）引換券をレジで渡す旨を公式店舗ページで確認。通常販売時間は未確認。
- テイクアウト可否: フードカート/スナック系掲載のため候補はあるが、公式本文で個別明記なし
- 商品画像: なし（マンゴーとの同時掲載画像のみ確認）
- 画像候補:
  - https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-tropical-frappe-mango-and-strawberry-summer-2026-offercard-h.jpg
  - https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-tropical-frappe-mango-strawberry-with-neon-cup-summer-2026-gallery-a.jpg
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
  - https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/wharf-cafe
  - https://www.usj.co.jp/web/ja/jp/restaurants/boardwalk-snacks
- 未確認項目: 販売開始日、販売終了日、通常販売時間、テイクアウト可否、単体商品画像。
- 重複候補: 同名なし。

### トロピカル・フラッペ ～マンゴー～

- 正式商品名: トロピカル・フラッペ ～マンゴー～
- 価格: 800円
- 価格バリエーション: 通常 800円 / ネオン・カップ付き 1,650円
- 販売店舗: ワーフカフェ、ボードウォーク・スナック
- エリア: サンフランシスコ・エリア、アミティ・ビレッジ
- カテゴリ: dessert_drink
- 商品説明: 夏に食べたいフルーツかき氷。ネオン・カップ付きの価格バリエーションあり。
- 販売開始日: 未確認
- 販売終了日: 未確認
- 販売時間条件: ネオン・カップ＆フラッペを18:00までに購入でソフトドリンク（L）引換券をレジで渡す旨を公式店舗ページで確認。通常販売時間は未確認。
- テイクアウト可否: フードカート/スナック系掲載のため候補はあるが、公式本文で個別明記なし
- 商品画像: なし（ストロベリーとの同時掲載画像のみ確認）
- 画像候補:
  - https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-tropical-frappe-mango-and-strawberry-summer-2026-offercard-h.jpg
  - https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-tropical-frappe-mango-strawberry-with-neon-cup-summer-2026-gallery-a.jpg
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
  - https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/wharf-cafe
  - https://www.usj.co.jp/web/ja/jp/restaurants/boardwalk-snacks
- 未確認項目: 販売開始日、販売終了日、通常販売時間、テイクアウト可否、単体商品画像。
- 重複候補: 同名なし。

### ジョーズ・ドリンクボトル

- 正式商品名: ジョーズ・ドリンクボトル
- 価格: 2,300円
- 価格バリエーション: ソフトドリンク（R）付き 2,300円
- 販売店舗: アミティ・ランディング・レストラン
- エリア: アミティ・ビレッジ
- カテゴリ: drink
- 商品説明: ジョーズのヒストリーを感じさせるワイルド＆レトロなデザインの大容量ドリンクボトル。25周年限定ストラップ付き、ソフトドリンク（R）付き。
- 販売開始日: 未確認
- 販売終了日: 未確認
- 販売時間条件: 商品単位の販売時間は未確認
- テイクアウト可否: 未確認
- 商品画像: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-jaws-drink-bottle-2026-offercard-h.jpg
- 画像出典URL: https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/amity-landing-restaurant/index.html
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/amity-landing-restaurant
- 未確認項目: 販売開始日、販売終了日、商品単位の販売時間、テイクアウト可否。
- 重複候補: 第2グループでは容器系として除外メモに入れていたが、第3グループではキャラクターボトル付きドリンク対象として再調査し、ドラフト候補に追加。

### 憧れの大悪党？ ボブ・ドリンクボトル

- 正式商品名: 憧れの大悪党？ ボブ・ドリンクボトル
- 価格: 2,300円
- 価格バリエーション: ソフトドリンク付き 2,300円
- 販売店舗: デリシャス・ミー！ ザ・クッキー・キッチン、ワーフカフェ
- エリア: ミニオン・パーク、サンフランシスコ・エリア
- カテゴリ: drink
- 商品説明: 公式フードカート/ミニオンフードおよび店舗ページ掲載のボブ・ドリンクボトル。ワーフカフェでは「ソフトドリンク（憧れの大悪党？ ボブ・ドリンクボトル）」として掲載。
- 販売開始日: 未確認
- 販売終了日: 未確認
- 販売時間条件: 商品単位の販売時間は未確認
- テイクアウト可否: フードカート/スナック系掲載のため候補はあるが、公式本文で個別明記なし
- 商品画像: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-respected-villain-bob-drink-bottle-2025-offercard-h.jpg
- 画像出典URL: https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/delicious-me-the-cookie-kitchen/index.html
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
  - https://www.usj.co.jp/web/ja/jp/restaurants/minion-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/delicious-me-the-cookie-kitchen
  - https://www.usj.co.jp/web/ja/jp/restaurants/wharf-cafe
- 未確認項目: 販売開始日、販売終了日、商品単位の販売時間、テイクアウト可否、商品説明本文。
- 重複候補: `scripts/output/foods.generated.json` に `food-1kvqau2`、`food-8xwq2b`、`food-1h2frv3` が存在。新規本登録前に既存データとの統合確認が必要。

### ジュラシック・パーク・ドリンクボトル

- 正式商品名: ジュラシック・パーク・ドリンクボトル
- 価格: 未確認
- 価格バリエーション: 未確認
- 販売店舗: ジュラシック・パーク・ザ・ライド スプラッシュダウン前フードカート
- エリア: ジュラシック・パーク
- カテゴリ: drink
- 商品説明: 公式フードカート掲載のドリンクボトル。公式価格本文は確認できず。
- 販売開始日: 未確認
- 販売終了日: 未確認
- 販売時間条件: 商品単位の販売時間は未確認
- テイクアウト可否: フードカート掲載のため候補はあるが、公式本文で個別明記なし
- 商品画像: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-jurassic-park-drink-bottle-2026-gallery-a.jpg
- 画像出典URL: https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html
- 公式参照URL: https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
- 未確認項目: 価格、価格バリエーション、販売開始日、販売終了日、商品単位の販売時間、テイクアウト可否、商品説明本文。
- 重複候補: `scripts/output/foods.generated.json` に `food-alnomv` と `food-1242pz2` が存在し、canonical_group_id は `group-6kxx40`。新規本登録前に既存データとの統合確認が必要。

### 大悪党のためのドーナツ・バーガー ～BBQ ポーク&ベーコン～

- 正式商品名: 大悪党のためのドーナツ・バーガー ～BBQ ポーク&ベーコン～
- 価格: 1,200円
- 価格バリエーション: 未確認
- 販売店舗: イーブル・イーツ
- エリア: ミニオン・パーク
- カテゴリ: burger
- 商品説明: 公式フードカート/ミニオンフード同時掲載のドーナツ・バーガー。商品本文説明は未確認。
- 販売開始日: 未確認
- 販売終了日: 未確認
- 販売時間条件: 商品単位の販売時間は未確認
- テイクアウト可否: フードカート/スナック系掲載のため候補はあるが、公式本文で個別明記なし
- 商品画像: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-villain-con-donut-burger-bbq-pork-and-bacon-2025-offercard-h.jpg
- 画像出典URL: https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/evil-eats/index.html
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
  - https://www.usj.co.jp/web/ja/jp/restaurants/minion-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/evil-eats
- 未確認項目: 販売開始日、販売終了日、商品単位の販売時間、テイクアウト可否、商品説明本文、価格バリエーション。
- 重複候補: `scripts/output/foods.generated.json` に `food-r24nsm` が存在。新規本登録前に既存データとの統合確認が必要。

## 第3グループでJSON追加しない公式同時掲載物

- めざせ大悪党！ デイブ・ポップコーンバケツ: 公式フードカート/ミニオンフードに掲載。ポップコーンバケツであり、公式価格を今回確認できなかったためJSON追加は見送り。
- DK クラッシュサンデー ～トロピカルバナナ・フレーバー～ マグカップ付き: 公式フードカートに掲載。2026年夏限定としての価格・期間を今回確定できなかったためJSON追加は見送り。
- ネオン・カップ: トロピカル・フラッペの `priceVariants` としてのみ扱い、単独商品として追加しない。
- 光る！ ボトルストラップ: ドリンク容器の周辺グッズとして扱い、単独商品として追加しない。

## 第3グループ 重複照合メモ

- 照合対象:
  - `scripts/output/foods.generated.json`
  - `data/manual-foods.json`
  - `data/manual-food-overrides.json`
  - `data/duplicate-overrides.json`
  - 第1・第2グループの `data/imports/unicolle-summer-2026-drafts.json`
- 第3グループの最低限対象6商品は、既存生成データ、manual、overrides、第1・第2グループ候補に同名なし。
- キャラクターボトル系では、ボブ・ドリンクボトルとジュラシック・パーク・ドリンクボトルに既存generated候補あり。
- 関連同時掲載商品のドーナツ・バーガーにも既存generated候補あり。
- 価格違い、ネオン・カップ付き、ボトル付きは原則 `priceVariants` として整理した。
- 複数商品同時掲載画像は、誤画像を避けるため `imageUrl` を空にし、`imageCandidates` にだけ保存する。

## 第3グループの判断

- 公式で価格まで確認できたものは価格を保存した。
- 商品単位の販売開始日・販売終了日が未確認のため、第3グループの新規追記分は全件 `draft`。
- 第2グループで除外メモに入っていたジョーズ・ドリンクボトルは、今回のユーザー指定が「キャラクターボトル、カップ付きドリンク」を含むため、除外理由を更新し、第3グループのドラフト候補として追加する。

# 第4グループ: 残り商品確認と最終監査

- 情報確認日: 2026-07-06
- 対象: 第3グループで未処理として残したフードカート同時掲載商品、公式シーズナル/フードカート上の未登録商品、候補JSON全体の最終監査。
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
  - https://www.usj.co.jp/web/ja/jp/restaurants/minion-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/jungle-beat-shakes
  - https://www.usj.co.jp/web/ja/jp/restaurants/pit-stop-popcorn
  - https://www.usj.co.jp/web/ja/jp/restaurants/hello-kittys-corner-cafe
  - https://www.usj.co.jp/web/ja/jp/restaurants/yoshis-snack-island
- 取得メモ:
  - ジャングル・ビート・シェイク、ピットストップ・ポップコーン、ハローキティのコーナーカフェ、ヨッシー・スナック・アイランドの公式店舗ページを取得し、ピックアップグルメの見出しと画像を確認した。
  - 店舗ページでは商品単位の価格本文が確認できず、店舗全体の価格帯のみ確認できたため、価格は推測しない。
  - 公式シーズナルページに掲載され、summer-2026画像が確認できた `ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き` のみ第4グループでJSON追加した。
  - 公式で夏限定と確認できないフードカート常設/既存候補は、summer-2026候補へ無理に追加しない。

## 第4グループ 調査結果

### ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き

- 正式商品名: ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き
- 価格: 未確認
- 価格バリエーション: 未確認
- 販売店舗: イルミネーション・シアター入口横フードカート、パークサイド・グリル横フードカート
- エリア: ニューヨーク・エリア
- カテゴリ: dessert_drink
- 商品説明: マイメロディとクロミが新しい衣装でバケツ＆スプーンにオンステージ。キュートさ満点のアイテムでソフローズンを楽しめる公式シーズナル掲載商品。
- 販売開始日: 未確認
- 販売終了日: 未確認
- 通常販売時間: 未確認
- テイクアウト可否: フードカート掲載のため候補はあるが、公式本文で個別明記なし
- 商品画像: なし（クロミ・ボトルストラップ、ソフローズン、マイメロディ・ボトルストラップの3点同時掲載画像のみ確認）
- 画像候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-my-melody-kuromi-bottle-strap-with-ice-pack-and-soft-frozen-grape-with-my-melody-kuromi-cup-and-spoon-summer-2026-gallery-a.jpg
- 画像出典URL: https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/seasonal-food/index.html
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food
  - https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
- 未確認項目: 価格、価格バリエーション、販売開始日、販売終了日、通常販売時間、テイクアウト可否、単体商品画像。
- 重複候補: 同名なし。

### めざせ大悪党！ デイブ・ポップコーンバケツ

- 正式商品名: めざせ大悪党！ デイブ・ポップコーンバケツ
- 価格: 公式ページでは未確認
- 価格バリエーション: 未確認
- 販売店舗: セントラルパーク入口横ポップコーンカート、ユニバーサル・ワンダーランド入口横ポップコーンカート
- エリア: ニューヨーク・エリア、ユニバーサル・ワンダーランド
- カテゴリ: popcorn_bucket
- 商品説明: 公式フードカート/ミニオンフードに掲載されているデイブのポップコーンバケツ。
- 販売開始日: 未確認
- 販売終了日: 未確認
- 通常販売時間: 未確認
- テイクアウト可否: フードカート掲載のため候補はあるが、公式本文で個別明記なし
- 商品画像: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-wannabe-villain-dave-popcorn-bucket-2025-a.jpg
- 画像出典URL: https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
  - https://www.usj.co.jp/web/ja/jp/restaurants/minion-food
- 未確認項目: 公式価格、価格バリエーション、販売開始日、販売終了日、通常販売時間、テイクアウト可否、2026年夏限定性。
- 重複候補: `scripts/output/foods.generated.json` に `food-c2z2tz` と `food-1c6f0vw` が存在し、canonical_group_id は `group-cbhlq8`。
- 判断: 公式掲載と画像は確認できたが、公式で2026年夏限定とは確認できないためsummer-2026候補JSONへは追加しない。

### DK クラッシュサンデー ～トロピカルバナナ・フレーバー～ マグカップ付き

- 正式商品名: DK クラッシュサンデー ～トロピカルバナナ・フレーバー～ マグカップ付き
- 価格: 公式ページでは未確認
- 価格バリエーション:
  - DK クラッシュサンデー ～トロピカルバナナ・フレーバー～ マグカップ付き
  - DK クラッシュサンデー ～トロピカルバナナ・フレーバー～
- 販売店舗: ジャングル・ビート・シェイク
- エリア: スーパー・ニンテンドー・ワールド
- カテゴリ: dessert
- 商品説明: 公式フードカートとジャングル・ビート・シェイク店舗ページに掲載されているDKクラッシュサンデー。店舗ページでマグカップ付きと通常版の見出しを確認。
- 販売開始日: 未確認
- 販売終了日: 未確認
- 通常販売時間: 未確認
- テイクアウト可否: 未確認
- 商品画像:
  - マグカップ付き: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-dk-crush-sundae-tropical-banana-flavor-spring-2025-gallery-a.jpg
  - 通常版候補: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-dk-crush-sundae-tropical-banana-flavor-with-souvenir-offercard-h.jpg
- 画像出典URL:
  - https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html
  - https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/jungle-beat-shakes/index.html
- 公式参照URL:
  - https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
  - https://www.usj.co.jp/web/ja/jp/restaurants/jungle-beat-shakes
- 未確認項目: 公式価格、販売開始日、販売終了日、通常販売時間、テイクアウト可否、2026年夏限定性。
- 重複候補: `scripts/output/foods.generated.json` に `food-1yi0toj`、`food-u2l4ko`、`food-1wc5ggu` が存在。マグカップ付きと通常版は別候補になっているが、今回のsummer-2026候補には追加しない。
- 判断: 公式掲載と画像は確認できたが、公式で2026年夏限定とは確認できないためsummer-2026候補JSONへは追加しない。将来登録する場合は通常版/マグカップ付きを同一商品の `priceVariants` として扱う。

## 第4グループでJSON追加しない公式同時掲載物

- クロミ・ボトルストラップ アイスパック付き: グッズ/ストラップ扱い。ソフローズンの関連画像には含まれるが単独食品候補にしない。
- マイメロディ・ボトルストラップ アイスパック付き: グッズ/ストラップ扱い。ソフローズンの関連画像には含まれるが単独食品候補にしない。
- DK クラッシュサンデー ～トロピカルバナナ・フレーバー～: 公式店舗ページに通常版見出しはあるが、公式で2026年夏限定とは確認できないため追加しない。
- ヨッシー＆タマゴ・ドリンクボトル / 1UPキノコ×ハテナブロック・ドリンクボトル / スーパーキノコ・ドリンクボトル: 公式フードカート/店舗ページに掲載はあるが、公式で2026年夏限定とは確認できないため追加しない。
- ヨッシーのラッシー: 公式フードカート/店舗ページに掲載はあるが、公式で2026年夏限定とは確認できないため追加しない。
- ハローキティ・チュリトス ～いちごミルク～、ハローキティのフローズン・スムージー ～いちご～、ハローキティ・ドリンクカップ: 公式フードカート/店舗ページに掲載はあるが、公式で2026年夏限定とは確認できないため追加しない。

## 全候補 最終監査

- JSON候補総数: 30件
- 状態:
  - draft: 30件
  - pending: 0件
  - approved: 0件
- ID重複: 0件
- 正規化商品名重複: 0件
- 採用画像URL重複: 0件
- 公式URLがない商品: 0件
- 大文字ブランド表記の混入: 0件
- 既存generated/manual/overrideのファイル差分: なし

### 価格未確認商品

- 夏祭りの金魚 レモンサイダー
- 超！！ チョコバナナ・チュリトス
- いちご練乳 ソーダスムージー
- カレーナン!? 焼きそばドッグ
- キャラメルポップコーン!? チュリトス
- ジュラシック・パーク・ドリンクボトル
- ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き

### 画像未確認商品

- りんご飴 ～りんごのムース～
- 水風船 ～ピーチゼリー＆レアチーズムース～
- ストロベリー・フローズン・スムージー
- トロピカルフルーツ・フローズン・スムージー
- マンゴー・フローズン・スムージー
- トロピカル・フラッペ ～ストロベリー～
- トロピカル・フラッペ ～マンゴー～
- ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き

### 販売期間未確認商品

- 全30件で商品単位の販売開始日・販売終了日が未確認。
- 公式シーズナル/フードカート/店舗ページで掲載は確認できるが、商品単位の期間は推測せず空欄維持。

### 既存商品との重複候補

- 超！！ チョコバナナ・チュリトス: `food-j4nvrm`
- 25周年カクテル ～ポップコーンフレーバー？～: `food-d5v0l2`, `food-gpkw6l`
- キャラメルポップコーン!? チュリトス: `food-ymiw07`
- 憧れの大悪党？ ボブ・ドリンクボトル: `food-1kvqau2`, `food-8xwq2b`, `food-1h2frv3`
- ジュラシック・パーク・ドリンクボトル: `food-alnomv`, `food-1242pz2`
- 大悪党のためのドーナツ・バーガー ～BBQ ポーク&ベーコン～: `food-r24nsm`
- めざせ大悪党！ デイブ・ポップコーンバケツ: `food-c2z2tz`, `food-1c6f0vw`。JSON候補には追加せず除外メモに保存。
- DK クラッシュサンデー ～トロピカルバナナ・フレーバー～: `food-1yi0toj`, `food-u2l4ko`, `food-1wc5ggu`。JSON候補には追加せず除外メモに保存。

### priceVariants統合確認

- 夏祭りの金魚 レモンサイダー: 通常 / ネオン・カップ付き候補を同一商品に統合。
- いちご練乳 ソーダスムージー: 通常 / ネオン・カップ付き候補を同一商品に統合。
- フローズン・ジントニック ～シトラス～: 通常 / ネオン・カップ付き候補を同一商品に統合。
- トロピカル・フラッペ ～ストロベリー～: 通常 800円 / ネオン・カップ付き 1,650円を同一商品に統合。
- トロピカル・フラッペ ～マンゴー～: 通常 800円 / ネオン・カップ付き 1,650円を同一商品に統合。
- プルドポーク＆チキン・スパイシー BBQ ピッツアセット: セット 2,400円 / ホールピッツァ 3,900円を同一商品に統合。
- DK クラッシュサンデー: 将来登録する場合は通常版/マグカップ付きの分割登録を避け、`priceVariants` として整理する。

## 第4グループの判断

- 第4グループでJSONに追加したのは、公式シーズナルページで2026年夏掲載を確認できた `ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き` の1件のみ。
- デイブ・ポップコーンバケツとDKクラッシュサンデーは公式掲載・画像・販売場所を確認したが、公式で2026年夏限定とは確認できないため、summer-2026候補には追加しない。
- 人間確認前のため、全30件を `draft` のまま維持する。

# Supabase登録前 最終データ整理

- 情報確認日: 2026-07-06
- 目的: 30候補の重複処理方針、不足価格、画像採用可否、販売期間の扱い、import reviewの整理。
- 対象JSON: `data/imports/unicolle-summer-2026-drafts.json`
- 登録前確認表: `docs/unicolle-summer-2026-import-review.md`

## ステータス整理結果

- 候補総数: 30件
- pending: 18件
- draft: 12件
- approved: 0件
- pending条件: 正式商品名、採用画像、価格、店舗、エリア、参照URL、重複処理方針がそろっていること。
- draft維持理由: 価格未確認、採用画像未確認、または重複処理前の人間確認が必要なため。

## 価格補完結果

- official-confirmed: 公式USJページで価格確認済み。
- secondary-confirmed: 公式価格は未確認だが、既存generated内の補助情報価格として確認。公式確認済みとは扱わない。
- unresolved: 公式/補助情報とも価格未確認。

### secondary-confirmedへ補完

- キャラメルポップコーン!? チュリトス: 800円。`scripts/output/foods.generated.json` の同一generated候補に補助情報価格あり。公式価格は未確認。
- ジュラシック・パーク・ドリンクボトル: 2,300円。`scripts/output/foods.generated.json` の同一generated候補に補助情報価格あり。公式価格は未確認。

### unresolvedのまま

- 夏祭りの金魚 レモンサイダー
- 超！！ チョコバナナ・チュリトス
- いちご練乳 ソーダスムージー
- カレーナン!? 焼きそばドッグ
- ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き

## 画像整理結果

- 商品名と画像が完全一致する単体公式画像のみ `imageUrl` に採用。
- 集合写真、複数商品同時掲載画像、店舗外観、メニュー表は採用しない。
- 画像未採用の商品は `imageCandidates` と出典URLのみ保存。

画像未採用のまま:

- りんご飴 ～りんごのムース～
- 水風船 ～ピーチゼリー＆レアチーズムース～
- ストロベリー・フローズン・スムージー
- トロピカルフルーツ・フローズン・スムージー
- マンゴー・フローズン・スムージー
- トロピカル・フラッペ ～ストロベリー～
- トロピカル・フラッペ ～マンゴー～
- ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き

## 重複候補7件の確定方針

- 超！！ チョコバナナ・チュリトス: `food-j4nvrm` を使用。既存商品へ情報をoverride。2026公式画像、店舗、エリアを補完候補にする。価格未確認のためdraft維持。
- 25周年カクテル ～ポップコーンフレーバー？～: `food-d5v0l2` を使用。既存商品へ価格variantを追加。`food-gpkw6l` は同canonical groupの重複候補。
- キャラメルポップコーン!? チュリトス: `food-14zoddb` を使用。既存商品へsummer-2026を追加。価格800円はsecondary-confirmed。
- 憧れの大悪党？ ボブ・ドリンクボトル: `food-1kvqau2` を使用。既存商品へsummer-2026を追加。`food-8xwq2b` は同canonical group、`food-1h2frv3` はsoft drink表記variantとして統合候補。
- ジュラシック・パーク・ドリンクボトル: `food-alnomv` を使用。既存商品へsummer-2026を追加。価格2,300円はsecondary-confirmed。`food-1242pz2` は同canonical groupのgallery候補。
- 大悪党のためのドーナツ・バーガー ～BBQ ポーク&ベーコン～: `food-r24nsm` を使用。既存商品へ情報をoverride。公式価格1,200円、店舗、画像を補完候補にする。
- めざせ大悪党！ デイブ・ポップコーンバケツ: `food-c2z2tz` は既存候補だが、2026年夏商品と確認できず除外。summer-2026候補JSONには追加しない。

## 除外した商品

- めざせ大悪党！ デイブ・ポップコーンバケツ: 公式フードカート/ミニオンフード掲載と画像は確認。公式で2026年夏限定とは確認できないため除外。
- DK クラッシュサンデー ～トロピカルバナナ・フレーバー～ マグカップ付き: 公式フードカート/店舗掲載と画像は確認。公式で2026年夏限定とは確認できないため除外。
- クロミ・ボトルストラップ アイスパック付き / マイメロディ・ボトルストラップ アイスパック付き: グッズ/ストラップ扱い。食品候補にしない。

## 販売期間の扱い

- 商品単位の公式開始日・終了日は30件すべて未確認。
- 各候補の `saleStartDate` / `saleEndDate` はnullを維持。
- 公式ニュースで `ユニバーサル・サマー・マツリ・ナイト ～ネオン・グロウアップ～` のイベント期間 2026-07-01〜2026-08-26 を確認。
- この日付はcollection-level referenceとしてJSONに保存し、商品個別日付には推測入力しない。

# Phase R3 画像候補レビュー整理

- 情報確認日: 2026-07-08
- 対象: `/admin/summer-2026-review` の画像候補Picker実装前データ整理。
- 方針: Codex調査だけでは `confirmed` にしない。単体商品画像として確定できない公式画像は `imageCandidates` に保存し、`imageReviewStatus` は `candidate-only` または `unresolved` とする。
- 5値化: `confirmed` / `incorrect` / `unresolved` / `no-image` / `candidate-only`。

## 現在画像未採用の商品

現在のJSONを正として、画像未登録・未採用の商品は8件。

- りんご飴 ～りんごのムース～
- 水風船 ～ピーチゼリー＆レアチーズムース～
- ストロベリー・フローズン・スムージー
- トロピカルフルーツ・フローズン・スムージー
- マンゴー・フローズン・スムージー
- トロピカル・フラッペ ～ストロベリー～
- トロピカル・フラッペ ～マンゴー～
- ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き

## 公式候補画像の再確認

- りんご飴 / 水風船: USJ公式ビバリーヒルズ・ブランジェリーおよびシーズナルフードの公式画像を候補として保持。2商品同時掲載画像のため、単体採用は行わない。
- ストロベリー / トロピカルフルーツ / マンゴー・フローズン・スムージー: USJ公式ビバリーヒルズ・ブランジェリーおよびシーズナルフードの3商品同時掲載画像を候補として保持。単体商品画像ではないため、`imageUrl` は空欄維持。
- トロピカル・フラッペ ～ストロベリー～ / ～マンゴー～: USJ公式ワーフカフェおよびフードカートの2商品同時掲載画像、ネオンカップ付きgallery画像を候補として保持。単体採用は行わない。
- ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き: USJ公式シーズナルフードのマイメロディ/クロミ関連商品同時掲載画像を候補として保持。商品単体画像ではないため、`imageUrl` は空欄維持。

## R3データ反映

- `data/imports/unicolle-summer-2026-drafts.json` に `imageReviewStatus`、`imageReviewNote`、`imageCheckedAt` を追加。
- `imageCandidates` は URL重複を除外し、`sourceUrl`、`sourceType`、`title`、`note`、`discoveredAt`、`status` を保持。
- R3時点では既存の `unconfirmed` 判断を、候補ありの場合 `candidate-only`、候補なしの場合 `unresolved` に正規化した。R3.1監査でこの一律変換を修正。
- 人間が確認済みの `confirmed` は存在しないため、今回の整理で自動confirmed化した商品は0件。

# Phase R3.1 画像レビュー状態監査

- 情報確認日: 2026-07-08
- 対象: R3後に全30件が `candidate-only` になった状態の監査。
- 比較元: `fd41dc4` 時点の `data/imports/unicolle-summer-2026-drafts.json` / `data/imports/unicolle-summer-2026-review-decisions.json`

## 原因

- R3前のレビュー判断は30件すべて旧値 `unconfirmed`。
- R3前のdraftには30件すべて `imageCandidates` が存在していた。
- R3の正規化で「旧 `unconfirmed` かつ候補あり」を一律 `candidate-only` に変換したため、R3前から `imageUrl` が存在した22件まで候補未採用扱いになった。
- R3の保存正規化で、編集済み `imageUrl` を候補配列へ自動混入していたため、再保存時にもcandidate判定が広がりやすい状態だった。

## 修正方針

- 旧 `unconfirmed` は候補数に関係なく `unresolved` へ変換する。
- `candidate-only` は、正式採用済みの `imageUrl` がなく、有効な `imageCandidates` が1件以上ある商品に限定する。
- `confirmed`、`incorrect`、`no-image` は、人間が保存した履歴がある場合だけ維持する。
- 現在採用中の `imageUrl` はPicker上の「現在採用中の画像」として表示し、正規化時に候補へ自動混入しない。

## R3.1整理後の件数

- confirmed: 0件
- candidate-only: 8件
- unresolved: 22件
- incorrect: 0件
- no-image: 0件
- approved: 0件
- import-ready: 0件

## candidate-only 8件

いずれもR3前から `imageUrl` が空で、公式候補画像はあるが単体正式採用できていない商品。

- りんご飴 ～りんごのムース～
- 水風船 ～ピーチゼリー＆レアチーズムース～
- ストロベリー・フローズン・スムージー
- トロピカルフルーツ・フローズン・スムージー
- マンゴー・フローズン・スムージー
- トロピカル・フラッペ ～ストロベリー～
- トロピカル・フラッペ ～マンゴー～
- ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き

## unresolved 22件

- R3前から `imageUrl` と `imageSourceUrl` は存在する。
- ただし `review-decisions.json` に人間confirmed履歴はなく、旧 `imageReview` は全件 `unconfirmed`。
- Codexだけでは `confirmed` にせず、人間がレビュー画面で採用保存するまで `unresolved` とする。

## 候補検査

- candidate-onlyで候補0件の商品: 0件
- 採用画像URL重複: 0件
- 同一商品内の候補URL重複: 0件
- Google検索サムネイルURL、ローカルURL、一時URL: 0件

## 画像候補再監査（2026-07-08 R5後）

- 実施日時: 2026-07-08T14:15:00.000+09:00
- 監査前: candidate-only 8件 / unresolved 22件
- 監査後: candidate-only 29件 / unresolved 1件
- 公式ページ本文で、シーズナルメニュー大特集および食べ歩きフード特集に対象商品のImage alt/商品名掲載を確認した。
- shell環境では `curl -I` が `www.usj.co.jp` をDNS解決できなかったため、画像URLのネットワーク到達性はブラウザ検索ツールと公式ページ掲載状況で確認した。
- Codexではconfirmedへ変更せず、imageUrlにも正式採用しない。候補画像はすべて人間確認用としてimageCandidatesへ保存。
- 集合画像はnoteへ集合画像/複数商品掲載の可能性と切り抜き禁止を明記した。
- 詳細表は `docs/unicolle-summer-2026-image-candidate-audit.md` を参照。
