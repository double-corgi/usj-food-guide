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
