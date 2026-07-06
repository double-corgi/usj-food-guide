# 2026年夏フード候補 Import Review

- 作成日: 2026-07-06
- 対象JSON: `data/imports/unicolle-summer-2026-drafts.json`
- 候補総数: 30件
- pending: 18件
- draft: 12件
- approved: 0件
- 注意: この資料はSupabase登録前の確認用。既存food.idは変更しない。

## 30件一覧

| 商品名 | 新規／既存 | 使用するfoodId | 価格 | 画像 | 店舗 | エリア | 重複処理 | 状態 | 未確認項目 | 登録方針 |
|---|---|---|---|---|---|---|---|---|---|---|
| 夏祭りの金魚 レモンサイダー | 新規 | - | 未確認 | 採用済み | ユニバーサル・マーケット内ハピネス・ワゴン | ニューヨーク・エリア | 完全な新商品として追加 | draft | price, priceVariants.price, saleStartDate, saleEndDate, saleTimeCondition.productSpecific | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| 超！！ チョコバナナ・チュリトス | 既存 | food-j4nvrm | 未確認 | 採用済み | ユニバーサル・マーケット内ハピネス・ワゴン | ニューヨーク・エリア | 既存商品へ情報をoverride | draft | price, saleStartDate, saleEndDate, saleTimeCondition.productSpecific | 新規作成しない。既存food-j4nvrmを使い、2026公式画像・店舗・エリア情報でoverride候補にする。価格は未確認のためdraft維持。 |
| いちご練乳 ソーダスムージー | 新規 | - | 未確認 | 採用済み | ユニバーサル・マーケット内トローリー・トリート | ニューヨーク・エリア | 完全な新商品として追加 | draft | price, priceVariants.price, saleStartDate, saleEndDate, saleTimeCondition.productSpecific | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| カレーナン!? 焼きそばドッグ | 新規 | - | 未確認 | 採用済み | ユニバーサル・マーケット内ホットドッグカート | ニューヨーク・エリア | 完全な新商品として追加 | draft | price, saleStartDate, saleEndDate, saleTimeCondition.productSpecific | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| フローズン・ジントニック ～シトラス～ | 新規 | - | 900円 | 採用済み | パークサイド・グリル | ニューヨーク・エリア | 完全な新商品として追加 | pending | saleStartDate, saleEndDate, saleTimeCondition.productSpecificPeriod | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| 25周年カクテル ～ポップコーンフレーバー？～ | 既存 | food-d5v0l2 | 900円 | 採用済み | パークサイド・グリル | ニューヨーク・エリア | 既存商品へ価格variantを追加 | pending | saleStartDate, saleEndDate, saleTimeCondition | 新規作成しない。既存food-d5v0l2を使用し、テイクアウト900円/店内950円のpriceVariantsを反映するoverride候補にする。 |
| キャラメルポップコーン!? チュリトス | 既存 | food-14zoddb | 800円（補助） | 採用済み | パークサイド・グリル横フードカート | ニューヨーク・エリア | 既存商品へsummer-2026を追加 | pending | description, saleStartDate, saleEndDate, saleTimeCondition, price.official | 新規作成しない。既存food-14zoddbを使用し、summer-2026コレクション紐付け候補にする。価格800円はsecondary-confirmed扱い。 |
| りんご飴 ～りんごのムース～ | 新規 | - | 950円 | 未採用（候補あり） | ビバリーヒルズ・ブランジェリー | ハリウッド・エリア | 完全な新商品として追加 | draft | saleStartDate, saleEndDate, saleTimeCondition.productSpecific, takeoutAvailable, imageUrl.singleProduct | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| 水風船 ～ピーチゼリー＆レアチーズムース～ | 新規 | - | 950円 | 未採用（候補あり） | ビバリーヒルズ・ブランジェリー | ハリウッド・エリア | 完全な新商品として追加 | draft | saleStartDate, saleEndDate, saleTimeCondition.productSpecific, takeoutAvailable, imageUrl.singleProduct | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| 紫陽花 ～葡萄と柚子の和氷菓 焼き菓子添え～ | 新規 | - | 1,800円 | 採用済み | SAIDO | ニューヨーク・エリア | 完全な新商品として追加 | pending | saleStartDate, saleEndDate, saleTimeCondition.productSpecific, takeoutAvailable | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| 柑橘おろしと白みその冷やしうどん御膳 | 新規 | - | 2,600円 | 採用済み | SAIDO | ニューヨーク・エリア | 完全な新商品として追加 | pending | saleStartDate, saleEndDate, saleTimeCondition.productSpecific, takeoutAvailable | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| オマール海老の冷製パスタ アメリケーヌのグラニテ添え | 新規 | - | 3,300円 | 採用済み | パークサイド・グリル | ニューヨーク・エリア | 完全な新商品として追加 | pending | saleStartDate, saleEndDate, takeoutAvailable | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| プルドポーク＆チキン・スパイシー BBQ ピッツアセット | 新規 | - | 1,950円 | 採用済み | ルイズ N.Y. ピザパーラー | ニューヨーク・エリア | 完全な新商品として追加 | pending | saleStartDate, saleEndDate, saleTimeCondition.productSpecific, takeoutAvailable | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| ガーリック・シュリンプ・ピッツァセット | 新規 | - | 1,950円 | 採用済み | ルイズ N.Y. ピザパーラー | ニューヨーク・エリア | 完全な新商品として追加 | pending | saleStartDate, saleEndDate, saleTimeCondition.productSpecific, takeoutAvailable | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| クランチ・タコスバーガーセット | 新規 | - | 2,100円 | 採用済み | メルズ・ドライブイン | ハリウッド・エリア | 完全な新商品として追加 | pending | saleStartDate, saleEndDate, saleTimeCondition.productSpecific, takeoutAvailable | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| SAIDO スペシャルドリンク ～柚子～/ ～抹茶～/ ～西瓜～ | 新規 | - | 700円 | 採用済み | SAIDO | ニューヨーク・エリア | 完全な新商品として追加 | pending | saleStartDate, saleEndDate, saleTimeCondition.productSpecific, takeoutAvailable, description.variantSpecific | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| ストロベリー・フローズン・スムージー | 新規 | - | 800円 | 未採用（候補あり） | ビバリーヒルズ・ブランジェリー | ハリウッド・エリア | 完全な新商品として追加 | draft | saleStartDate, saleEndDate, saleTimeCondition.productSpecific, takeoutAvailable, imageUrl.singleProduct, description.productSpecific | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| トロピカルフルーツ・フローズン・スムージー | 新規 | - | 900円 | 未採用（候補あり） | ビバリーヒルズ・ブランジェリー | ハリウッド・エリア | 完全な新商品として追加 | draft | saleStartDate, saleEndDate, saleTimeCondition.productSpecific, takeoutAvailable, imageUrl.singleProduct, description.productSpecific | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| マンゴー・フローズン・スムージー | 新規 | - | 800円 | 未採用（候補あり） | ビバリーヒルズ・ブランジェリー | ハリウッド・エリア | 完全な新商品として追加 | draft | saleStartDate, saleEndDate, saleTimeCondition.productSpecific, takeoutAvailable, imageUrl.singleProduct, description.productSpecific | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| クラッシュ！大悪党のブラッドオレンジ・フローズンソーダ | 新規 | - | 900円 | 採用済み | イーブル・イーツ | ミニオン・パーク | 完全な新商品として追加 | pending | saleStartDate, saleEndDate, saleTimeCondition.productSpecific, takeoutAvailable, description.productSpecific, priceVariants | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| 映画スターのミニオンフラッペ ～ピーチ＆レモン～ | 新規 | - | 900円 | 採用済み | デリシャス・ミー！ ザ・クッキー・キッチン | ミニオン・パーク | 完全な新商品として追加 | pending | saleStartDate, saleEndDate, saleTimeCondition.productSpecific, takeoutAvailable, description.productSpecific, priceVariants | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| スヌーピー・フラッペ ～いちごミルク＆白桃～ | 新規 | - | 900円 | 採用済み | スヌーピー™・バックロット・カフェ | ユニバーサル・ワンダーランド | 完全な新商品として追加 | pending | saleStartDate, saleEndDate, saleTimeCondition.productSpecific, takeoutAvailable, priceVariants | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| 遊泳禁止!! ジョーズ・フラッペ ～ピーチ＆ソルトホイップ～ | 新規 | - | 900円 | 採用済み | ボードウォーク・スナック | アミティ・ビレッジ | 完全な新商品として追加 | pending | saleStartDate, saleEndDate, saleTimeCondition.productSpecific, takeoutAvailable, priceVariants | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| トロピカル・フラッペ ～ストロベリー～ | 新規 | - | 800円 | 未採用（候補あり） | ワーフカフェ / ボードウォーク・スナック | サンフランシスコ・エリア / アミティ・ビレッジ | 完全な新商品として追加 | draft | saleStartDate, saleEndDate, takeoutAvailable, saleTimeCondition.normalHours, imageUrl.singleProduct | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| トロピカル・フラッペ ～マンゴー～ | 新規 | - | 800円 | 未採用（候補あり） | ワーフカフェ / ボードウォーク・スナック | サンフランシスコ・エリア / アミティ・ビレッジ | 完全な新商品として追加 | draft | saleStartDate, saleEndDate, takeoutAvailable, saleTimeCondition.normalHours, imageUrl.singleProduct | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| ジョーズ・ドリンクボトル | 新規 | - | 2,300円 | 採用済み | アミティ・ランディング・レストラン | アミティ・ビレッジ | 完全な新商品として追加 | pending | saleStartDate, saleEndDate, saleTimeCondition.productSpecific, takeoutAvailable | manual_foodsへ新規候補として登録。ただし人間確認後。 |
| 憧れの大悪党？ ボブ・ドリンクボトル | 既存 | food-1kvqau2 | 2,300円 | 採用済み | デリシャス・ミー！ ザ・クッキー・キッチン / ワーフカフェ | ミニオン・パーク / サンフランシスコ・エリア | 既存商品へsummer-2026を追加 | pending | saleStartDate, saleEndDate, saleTimeCondition.productSpecific, takeoutAvailable, description.productSpecific | 新規作成しない。既存food-1kvqau2を使用し、soft drink bottle offer-card画像や販売店舗の補完はoverride候補にする。 |
| ジュラシック・パーク・ドリンクボトル | 既存 | food-alnomv | 2,300円（補助） | 採用済み | ジュラシック・パーク・ザ・ライド スプラッシュダウン前フードカート | ジュラシック・パーク | 既存商品へsummer-2026を追加 | pending | saleStartDate, saleEndDate, saleTimeCondition.productSpecific, takeoutAvailable, description.productSpecific, price.official | 新規作成しない。既存food-alnomvを使用し、summer-2026コレクション紐付け候補にする。価格2,300円はsecondary-confirmed扱い。 |
| 大悪党のためのドーナツ・バーガー ～BBQ ポーク&ベーコン～ | 既存 | food-r24nsm | 1,200円 | 採用済み | イーブル・イーツ | ミニオン・パーク | 既存商品へ情報をoverride | pending | saleStartDate, saleEndDate, saleTimeCondition.productSpecific, takeoutAvailable, description.productSpecific, priceVariants | 新規作成しない。既存food-r24nsmを使用し、公式確認した価格・店舗・画像をoverride候補にする。 |
| ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き | 新規 | - | 未確認 | 未採用（候補あり） | イルミネーション・シアター入口横フードカート / パークサイド・グリル横フードカート | ニューヨーク・エリア | 完全な新商品として追加 | draft | price, priceVariants, saleStartDate, saleEndDate, saleTimeCondition.normalHours, takeoutAvailable, imageUrl.singleProduct | manual_foodsへ新規候補として登録。ただし人間確認後。 |

## 価格未確認

- 夏祭りの金魚 レモンサイダー
- 超！！ チョコバナナ・チュリトス
- いちご練乳 ソーダスムージー
- カレーナン!? 焼きそばドッグ
- ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き

## 画像未確認

- りんご飴 ～りんごのムース～
- 水風船 ～ピーチゼリー＆レアチーズムース～
- ストロベリー・フローズン・スムージー
- トロピカルフルーツ・フローズン・スムージー
- マンゴー・フローズン・スムージー
- トロピカル・フラッペ ～ストロベリー～
- トロピカル・フラッペ ～マンゴー～
- ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き

## 重複候補の判断

- 超！！ チョコバナナ・チュリトス: 既存商品へ情報をoverride / 使用foodId: food-j4nvrm / 新規作成しない。既存food-j4nvrmを使い、2026公式画像・店舗・エリア情報でoverride候補にする。価格は未確認のためdraft維持。
- 25周年カクテル ～ポップコーンフレーバー？～: 既存商品へ価格variantを追加 / 使用foodId: food-d5v0l2 / 新規作成しない。既存food-d5v0l2を使用し、テイクアウト900円/店内950円のpriceVariantsを反映するoverride候補にする。
- キャラメルポップコーン!? チュリトス: 既存商品へsummer-2026を追加 / 使用foodId: food-14zoddb / 新規作成しない。既存food-14zoddbを使用し、summer-2026コレクション紐付け候補にする。価格800円はsecondary-confirmed扱い。
- 憧れの大悪党？ ボブ・ドリンクボトル: 既存商品へsummer-2026を追加 / 使用foodId: food-1kvqau2 / 新規作成しない。既存food-1kvqau2を使用し、soft drink bottle offer-card画像や販売店舗の補完はoverride候補にする。
- ジュラシック・パーク・ドリンクボトル: 既存商品へsummer-2026を追加 / 使用foodId: food-alnomv / 新規作成しない。既存food-alnomvを使用し、summer-2026コレクション紐付け候補にする。価格2,300円はsecondary-confirmed扱い。
- 大悪党のためのドーナツ・バーガー ～BBQ ポーク&ベーコン～: 既存商品へ情報をoverride / 使用foodId: food-r24nsm / 新規作成しない。既存food-r24nsmを使用し、公式確認した価格・店舗・画像をoverride候補にする。
- めざせ大悪党！ デイブ・ポップコーンバケツ: 2026年夏商品と確認できず除外 / 使用foodId: food-c2z2tz / summer-2026候補には登録しない。既存food-c2z2tz/food-1c6f0vwは現状維持。
- DK クラッシュサンデー ～トロピカルバナナ・フレーバー～ マグカップ付き: 2026年夏商品と確認できず除外 / 使用foodId: food-1yi0toj / summer-2026候補には登録しない。将来扱う場合は通常版/マグカップ付きをpriceVariants統合。

## 販売期間

- 商品単位の販売開始日・販売終了日は30件すべて未確認のため、各候補の `saleStartDate` / `saleEndDate` はnullを維持。
- 公式ニュースで確認できたイベント期間は collection-level reference としてのみ扱う。商品個別日付へは推測入力しない。
- collection参考期間: 2026-07-01 〜 2026-08-26
