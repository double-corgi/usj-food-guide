# 2026年夏USJフード 残未完成商品の追加調査

- 実施日: 2026-07-10
- 対象: pending 15件 + 未登録保留 2件
- 方針: 公式単体画像・価格・店舗・エリア・重複処理が揃った商品だけ公開可能に変更。集合画像や価格未確認の商品はpendingまたは保留を維持。

## 結果サマリー

- 調査対象: 17件
- 新規画像設定: 2件
- 新規価格設定: 0件
- approved変更: 2件
- pending維持: 13件
- 未登録保留維持: 2件
- 正式画像URL重複: 0件
- Google検索サムネイル採用: 0件
- 集合画像からの切り抜き: 0件

## 商品別監査

| 商品名 | foodId | 現在の状態 | 不足項目 | 調査した検索語 | 調査したURL | 画像結果 | 価格結果 | 既存商品統合結果 | 最終状態 | Vercel URL | 人間確認の必要性 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 夏祭りの金魚 レモンサイダー | food-manual-0625351f22 | pending | 価格、個別販売期間 | `夏祭りの金魚 レモンサイダー USJ 2026 価格`, `金魚 レモンサイダー ネオンカップ ユニバ 値段` | https://www.usj.co.jp/contentdata/usj/ja/jp/events/summer-2026/universal-summer/matsuri-nights/index.html | 公式単体画像あり、既存imageUrlを維持 | 公式/補助情報とも価格を確定できず | 新規manual food登録済み、重複なし | pending維持 | https://unicolle.vercel.app/foods/food-manual-0625351f22 | 現地メニューまたは公式価格表の確認が必要 |
| いちご練乳 ソーダスムージー | food-manual-736109191f | pending | 価格、個別販売期間 | `いちご練乳 ソーダスムージー USJ 2026 価格`, `いちご練乳 ソーダスムージー ネオンカップ 値段` | https://www.usj.co.jp/contentdata/usj/ja/jp/events/summer-2026/universal-summer/matsuri-nights/index.html | 公式単体画像あり、既存imageUrlを維持 | 公式/補助情報とも価格を確定できず | 新規manual food登録済み、重複なし | pending維持 | https://unicolle.vercel.app/foods/food-manual-736109191f | 通常版/ネオンカップ付き価格の公式または現地メニュー確認が必要 |
| カレーナン!? 焼きそばドッグ | food-manual-2f13b0cefe | pending | 価格、個別販売期間 | `カレーナン 焼きそばドッグ USJ 2026 価格`, `カレーナン!? 焼きそばドッグ 値段 ユニバ` | https://www.usj.co.jp/contentdata/usj/ja/jp/events/summer-2026/universal-summer/matsuri-nights/index.html | 公式単体画像あり、既存imageUrlを維持 | 公式/補助情報とも価格を確定できず | 新規manual food登録済み、重複なし | pending維持 | https://unicolle.vercel.app/foods/food-manual-2f13b0cefe | 現地メニューまたは公式価格表の確認が必要 |
| フローズン・ジントニック ～シトラス～ | food-manual-aa0f866b68 | pending | 正式単体画像 | `フローズン ジントニック シトラス USJ 2026 画像`, `Parkside Grill frozen gin tonic citrus neon cup` | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/parkside-grille/index.html | 公式画像は通常版とネオンカップの2点集合。正式imageUrlには不採用 | 公式店舗ページで900円確認済み | 新規manual food登録済み、重複なし | pending維持 | https://unicolle.vercel.app/foods/food-manual-aa0f866b68 | 単体画像または公式が通常版/ネオン版を明確に分けた画像が必要 |
| りんご飴 ～りんごのムース～ | food-manual-26fa16ed9b | pending | 正式単体画像 | `りんご飴 りんごのムース USJ 2026 画像`, `candy apple apple mousse USJ Beverly Hills Boulangerie` | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/seasonal-food/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/beverly-hills-boulangerie/index.html | 公式画像は水風船との2商品集合。正式imageUrlには不採用 | 公式/調査済み価格950円 | 新規manual food登録済み、重複なし | pending維持 | https://unicolle.vercel.app/foods/food-manual-26fa16ed9b | りんご飴単体画像の確認が必要 |
| 水風船 ～ピーチゼリー＆レアチーズムース～ | food-manual-2f3fb0c8dc | pending | 正式単体画像 | `水風船 ピーチゼリー レアチーズムース USJ 2026 画像`, `water balloon peach jelly rare cheese mousse USJ` | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/seasonal-food/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/beverly-hills-boulangerie/index.html | 公式画像はりんご飴との集合または背景に別商品が写る画像。正式imageUrlには不採用 | 公式/調査済み価格950円 | 新規manual food登録済み、重複なし | pending維持 | https://unicolle.vercel.app/foods/food-manual-2f3fb0c8dc | 水風船単体画像の確認が必要 |
| SAIDO スペシャルドリンク ～柚子～/ ～抹茶～/ ～西瓜～ | food-manual-0bec10711b | pending | variant別説明、正式単体画像 | `SAIDO スペシャルドリンク 柚子 抹茶 西瓜 USJ 2026`, `SAIDO special drink yuzu matcha watermelon` | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/saido/index.html | 公式画像は3種集合。正式imageUrlには不採用 | 公式/調査済み価格700円 | 新規manual food登録済み、3種variant扱い | pending維持 | https://unicolle.vercel.app/foods/food-manual-0bec10711b | 3種を1商品で扱うか、variant/別商品へ分けるかの人間判断が必要 |
| ストロベリー・フローズン・スムージー | food-manual-460ba88510 | pending | 正式単体画像、商品別説明 | `ストロベリー フローズン スムージー USJ 2026`, `Beverly Hills Boulangerie strawberry frozen smoothie` | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/beverly-hills-boulangerie/index.html | 公式画像はスムージー3種集合。正式imageUrlには不採用 | 公式/調査済み価格800円 | 新規manual food登録済み、重複なし | pending維持 | https://unicolle.vercel.app/foods/food-manual-460ba88510 | ストロベリー単体画像の確認が必要 |
| トロピカルフルーツ・フローズン・スムージー | food-manual-3478564a9f | pending | 正式単体画像、商品別説明 | `トロピカルフルーツ フローズン スムージー USJ 2026`, `tropical fruits frozen smoothie USJ` | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/beverly-hills-boulangerie/index.html | 公式画像はスムージー3種集合。正式imageUrlには不採用 | 公式/調査済み価格900円 | 新規manual food登録済み、重複なし | pending維持 | https://unicolle.vercel.app/foods/food-manual-3478564a9f | トロピカルフルーツ単体画像の確認が必要 |
| マンゴー・フローズン・スムージー | food-manual-5dd3fd60a8 | pending | 正式単体画像、商品別説明 | `マンゴー フローズン スムージー USJ 2026`, `mango frozen smoothie USJ Beverly Hills Boulangerie` | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/beverly-hills-boulangerie/index.html | 公式画像はスムージー3種集合。正式imageUrlには不採用 | 公式/調査済み価格800円 | 新規manual food登録済み、重複なし | pending維持 | https://unicolle.vercel.app/foods/food-manual-5dd3fd60a8 | マンゴー単体画像の確認が必要 |
| スヌーピー・フラッペ ～いちごミルク＆白桃～ | food-manual-cf68598e59 | pending -> approved | なし | `スヌーピー フラッペ いちごミルク 白桃 USJ 2026`, `snoopy frappe offercard h` | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/snoopys-backlot-cafe/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-snoopy-frappe-offercard-h.jpg | 公式offer-card単体画像をHTTP 200で確認。正式imageUrlへ設定 | 公式/調査済み価格900円 | 新規manual food登録済み、重複なし | 本番DBをapprovedへ更新済み | https://unicolle.vercel.app/foods/food-manual-cf68598e59 | 不要 |
| 遊泳禁止!! ジョーズ・フラッペ ～ピーチ＆ソルトホイップ～ | food-manual-eac27732ca | pending -> approved | なし | `遊泳禁止 ジョーズ フラッペ ピーチ ソルトホイップ USJ 2026`, `jaws frappe peach salt whip offercard` | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/boardwalk-snacks/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-no-swimming-allowed-jaws-frappe-peach-salt-whip-offercard-h.jpg | 公式offer-card単体画像をHTTP 200で確認。正式imageUrlへ設定 | 公式/調査済み価格900円 | 新規manual food登録済み、重複なし | 本番DBをapprovedへ更新済み | https://unicolle.vercel.app/foods/food-manual-eac27732ca | 不要 |
| トロピカル・フラッペ ～ストロベリー～ | food-manual-cba8c213d3 | pending | 正式単体画像 | `トロピカル フラッペ ストロベリー USJ 2026 ネオンカップ`, `tropical frappe strawberry neon cup USJ` | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/wharf-cafe/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/boardwalk-snacks/index.html | 公式画像はストロベリー/マンゴーおよびネオンカップの集合。正式imageUrlには不採用 | 公式/調査済み価格800円、ネオンカップ付き1650円 | 新規manual food登録済み、通常/ネオンはvariant扱い | pending維持 | https://unicolle.vercel.app/foods/food-manual-cba8c213d3 | ストロベリー単体画像の確認が必要 |
| トロピカル・フラッペ ～マンゴー～ | food-manual-79498d79ed | pending | 正式単体画像 | `トロピカル フラッペ マンゴー USJ 2026 ネオンカップ`, `tropical frappe mango neon cup USJ` | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/wharf-cafe/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/boardwalk-snacks/index.html | 公式画像はストロベリー/マンゴーおよびネオンカップの集合。正式imageUrlには不採用 | 公式/調査済み価格800円、ネオンカップ付き1650円 | 新規manual food登録済み、通常/ネオンはvariant扱い | pending維持 | https://unicolle.vercel.app/foods/food-manual-79498d79ed | マンゴー単体画像の確認が必要 |
| ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き | food-manual-a12824cd38 | pending | 価格、正式単体画像、個別販売期間 | `ソフローズン グレープ マイメロディ クロミ バケツ スプーン USJ 2026 価格`, `soft frozen grape my melody kuromi bucket spoon USJ` | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/seasonal-food/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html | 公式画像は複数商品集合。正式imageUrlには不採用 | 公式/補助情報とも価格を確定できず | 新規manual food登録済み、重複なし | pending維持 | https://unicolle.vercel.app/foods/food-manual-a12824cd38 | 単体画像と価格の確認が必要 |
| 超！！ チョコバナナ・チュリトス | food-j4nvrm候補 | 未登録保留 | 価格、既存商品統合方針 | `超 チョコバナナ チュリトス USJ 2026 価格`, `extreme choco banana churritos summer 2026` | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/events/summer-2026/universal-summer/matsuri-nights/index.html | 公式単体画像あり。ただし既存`food-j4nvrm`はエリア/画像が夏公式情報と不一致 | 公式/補助情報とも価格を確定できず | 既存商品へoverrideすべきか、新規扱いにすべきか未確定 | 未登録保留維持 | - | 価格と既存`food-j4nvrm`の統合可否の人間確認が必要 |
| キャラメルポップコーン!? チュリトス | food-14zoddb候補 | 未登録保留 | 既存商品統合方針 | `キャラメルポップコーン チュリトス USJ 2026 価格`, `caramel popcorn churritos spring summer 2026` | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html | 公式単体画像あり | 既存generatedに800円。公式価格は未確認 | 同名generatedが複数存在し、`food-14zoddb`と`food-ymiw07`のどちらをsummer-2026へ紐付けるか人間判断が必要 | 未登録保留維持 | - | 既存同名複数候補の統合先を人間確認する必要あり |

## 今回採用した正式画像

- スヌーピー・フラッペ ～いちごミルク＆白桃～
  - imageUrl: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-snoopy-frappe-offercard-h.jpg
  - imageSourceUrl: https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/snoopys-backlot-cafe/index.html
  - HTTP 200、HTTPS、公式レストランcontentdata、単体offer-card画像。
- 遊泳禁止!! ジョーズ・フラッペ ～ピーチ＆ソルトホイップ～
  - imageUrl: https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-food-no-swimming-allowed-jaws-frappe-peach-salt-whip-offercard-h.jpg
  - imageSourceUrl: https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/boardwalk-snacks/index.html
  - HTTP 200、HTTPS、公式レストランcontentdata、単体offer-card画像。

## 人間確認が必要な残り

- 価格確認: 夏祭りの金魚 レモンサイダー、いちご練乳 ソーダスムージー、カレーナン!? 焼きそばドッグ、ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き、超！！ チョコバナナ・チュリトス
- 単体画像確認: フローズン・ジントニック、りんご飴、水風船、SAIDOスペシャルドリンク、3種スムージー、トロピカル・フラッペ2種、ソフローズン
- 既存商品統合先確認: 超！！ チョコバナナ・チュリトス、キャラメルポップコーン!? チュリトス
