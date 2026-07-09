# 2026年夏フード 最終統合・import結果

- 実行日時: 2026-07-09T05:17:38.142Z
- 既存商品の正式経路: generated JSON + manual_foods + food_overrides + food_collection_memberships + food_publication_metadata + food_variants
- 公開判定: reviewStatus=approved、hidden=false、削除なし、品質条件を満たす商品だけ公開一覧・検索・詳細に出る
- 管理画面: /admin/foods が正式管理画面。新規は manual_foods、generated補正は food_overrides、季節/公開/価格行は foundation tables
- iOS/PWA: Webと同じ repository を参照し、Capacitor release は https://unicolle.vercel.app のデータを利用する

## 登録結果

- 調査候補: 30件
- import-ready: 28件
- approved予定: 11件
- pending予定: 17件
- 登録保留: 2件
- Supabase登録: 0件
- 停止理由: Vercel production env pull で SUPABASE_SERVICE_ROLE_KEY が空だったため、本番DB書き込みを停止
- 必要設定: Vercel Production の SUPABASE_SERVICE_ROLE_KEY にSupabase service role keyを設定後、npm run import:summer-2026:auto を再実行

## 商品別

| 商品名 | foodId | 新規/既存 | 画像 | 価格 | 店舗 | エリア | カテゴリ | DB保存先 | 公開状態 | Vercel表示URL | 未確認事項 |
|---|---|---|---|---:|---|---|---|---|---|---|---|
| 夏祭りの金魚 レモンサイダー | manual:ニューヨーク・エリア/ユニバーサル・マーケット内ハピネス・ワゴン/夏祭りの金魚 レモンサイダー | 新規 | あり | 未確認 | ユニバーサル・マーケット内ハピネス・ワゴン | ニューヨーク・エリア | drink | manual_foods/memberships/variants/metadata | pending | 管理画面のみ/未登録 | price<br>priceVariants.price<br>saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific |
| 超！！ チョコバナナ・チュリトス | food-j4nvrm | 既存追記 | あり | 未確認 | ユニバーサル・マーケット内ハピネス・ワゴン | ニューヨーク・エリア | churro | 未登録 | hold | 管理画面のみ/未登録 | price<br>saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific |
| いちご練乳 ソーダスムージー | manual:ニューヨーク・エリア/ユニバーサル・マーケット内トローリー・トリート/いちご練乳 ソーダスムージー | 新規 | あり | 未確認 | ユニバーサル・マーケット内トローリー・トリート | ニューヨーク・エリア | drink | manual_foods/memberships/variants/metadata | pending | 管理画面のみ/未登録 | price<br>priceVariants.price<br>saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific |
| カレーナン!? 焼きそばドッグ | manual:ニューヨーク・エリア/ユニバーサル・マーケット内ホットドッグカート/カレーナン!? 焼きそばドッグ | 新規 | あり | 未確認 | ユニバーサル・マーケット内ホットドッグカート | ニューヨーク・エリア | snack | manual_foods/memberships/variants/metadata | pending | 管理画面のみ/未登録 | price<br>saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific |
| フローズン・ジントニック ～シトラス～ | manual:ニューヨーク・エリア/パークサイド・グリル/フローズン・ジントニック ～シトラス～ | 新規 | 未採用 | 900 | パークサイド・グリル | ニューヨーク・エリア | drink | manual_foods/memberships/variants/metadata | pending | 管理画面のみ/未登録 | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecificPeriod |
| 25周年カクテル ～ポップコーンフレーバー？～ | food-d5v0l2 | 既存追記 | あり | 900 | パークサイド・グリル | ニューヨーク・エリア | drink | food_overrides/memberships/variants/metadata | approved | https://unicolle.vercel.app/foods/food-d5v0l2 | saleStartDate<br>saleEndDate<br>saleTimeCondition |
| キャラメルポップコーン!? チュリトス | food-14zoddb | 既存追記 | あり | 800 | パークサイド・グリル横フードカート | ニューヨーク・エリア | churro | 未登録 | hold | 管理画面のみ/未登録 | description<br>saleStartDate<br>saleEndDate<br>saleTimeCondition<br>price.official |
| りんご飴 ～りんごのムース～ | manual:ハリウッド・エリア/ビバリーヒルズ・ブランジェリー/りんご飴 ～りんごのムース～ | 新規 | 未採用 | 950 | ビバリーヒルズ・ブランジェリー | ハリウッド・エリア | dessert | manual_foods/memberships/variants/metadata | pending | 管理画面のみ/未登録 | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific<br>takeoutAvailable<br>imageUrl.singleProduct |
| 水風船 ～ピーチゼリー＆レアチーズムース～ | manual:ハリウッド・エリア/ビバリーヒルズ・ブランジェリー/水風船 ～ピーチゼリー＆レアチーズムース～ | 新規 | 未採用 | 950 | ビバリーヒルズ・ブランジェリー | ハリウッド・エリア | dessert | manual_foods/memberships/variants/metadata | pending | 管理画面のみ/未登録 | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific<br>takeoutAvailable<br>imageUrl.singleProduct |
| 紫陽花 ～葡萄と柚子の和氷菓 焼き菓子添え～ | manual:ニューヨーク・エリア/SAIDO/紫陽花 ～葡萄と柚子の和氷菓 焼き菓子添え～ | 新規 | あり | 1800 | SAIDO | ニューヨーク・エリア | dessert | manual_foods/memberships/variants/metadata | approved | https://unicolle.vercel.app/foods/(after-import-manual-id) | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific<br>takeoutAvailable |
| 柑橘おろしと白みその冷やしうどん御膳 | manual:ニューヨーク・エリア/SAIDO/柑橘おろしと白みその冷やしうどん御膳 | 新規 | あり | 2600 | SAIDO | ニューヨーク・エリア | set | manual_foods/memberships/variants/metadata | approved | https://unicolle.vercel.app/foods/(after-import-manual-id) | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific<br>takeoutAvailable |
| オマール海老の冷製パスタ アメリケーヌのグラニテ添え | manual:ニューヨーク・エリア/パークサイド・グリル/オマール海老の冷製パスタ アメリケーヌのグラニテ添え | 新規 | あり | 3300 | パークサイド・グリル | ニューヨーク・エリア | noodle | manual_foods/memberships/variants/metadata | approved | https://unicolle.vercel.app/foods/(after-import-manual-id) | saleStartDate<br>saleEndDate<br>takeoutAvailable |
| プルドポーク＆チキン・スパイシー BBQ ピッツアセット | manual:ニューヨーク・エリア/ルイズ N.Y. ピザパーラー/プルドポーク＆チキン・スパイシー BBQ ピッツアセット | 新規 | あり | 1950 | ルイズ N.Y. ピザパーラー | ニューヨーク・エリア | pizza | manual_foods/memberships/variants/metadata | approved | https://unicolle.vercel.app/foods/(after-import-manual-id) | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific<br>takeoutAvailable |
| ガーリック・シュリンプ・ピッツァセット | manual:ニューヨーク・エリア/ルイズ N.Y. ピザパーラー/ガーリック・シュリンプ・ピッツァセット | 新規 | あり | 1950 | ルイズ N.Y. ピザパーラー | ニューヨーク・エリア | pizza | manual_foods/memberships/variants/metadata | approved | https://unicolle.vercel.app/foods/(after-import-manual-id) | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific<br>takeoutAvailable |
| クランチ・タコスバーガーセット | manual:ハリウッド・エリア/メルズ・ドライブイン/クランチ・タコスバーガーセット | 新規 | あり | 2100 | メルズ・ドライブイン | ハリウッド・エリア | burger | manual_foods/memberships/variants/metadata | approved | https://unicolle.vercel.app/foods/(after-import-manual-id) | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific<br>takeoutAvailable |
| SAIDO スペシャルドリンク ～柚子～/ ～抹茶～/ ～西瓜～ | manual:ニューヨーク・エリア/SAIDO/SAIDO スペシャルドリンク ～柚子～/ ～抹茶～/ ～西瓜～ | 新規 | 未採用 | 700 | SAIDO | ニューヨーク・エリア | drink | manual_foods/memberships/variants/metadata | pending | 管理画面のみ/未登録 | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific<br>takeoutAvailable<br>description.variantSpecific |
| ストロベリー・フローズン・スムージー | manual:ハリウッド・エリア/ビバリーヒルズ・ブランジェリー/ストロベリー・フローズン・スムージー | 新規 | 未採用 | 800 | ビバリーヒルズ・ブランジェリー | ハリウッド・エリア | drink | manual_foods/memberships/variants/metadata | pending | 管理画面のみ/未登録 | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific<br>takeoutAvailable<br>imageUrl.singleProduct<br>description.productSpecific |
| トロピカルフルーツ・フローズン・スムージー | manual:ハリウッド・エリア/ビバリーヒルズ・ブランジェリー/トロピカルフルーツ・フローズン・スムージー | 新規 | 未採用 | 900 | ビバリーヒルズ・ブランジェリー | ハリウッド・エリア | drink | manual_foods/memberships/variants/metadata | pending | 管理画面のみ/未登録 | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific<br>takeoutAvailable<br>imageUrl.singleProduct<br>description.productSpecific |
| マンゴー・フローズン・スムージー | manual:ハリウッド・エリア/ビバリーヒルズ・ブランジェリー/マンゴー・フローズン・スムージー | 新規 | 未採用 | 800 | ビバリーヒルズ・ブランジェリー | ハリウッド・エリア | drink | manual_foods/memberships/variants/metadata | pending | 管理画面のみ/未登録 | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific<br>takeoutAvailable<br>imageUrl.singleProduct<br>description.productSpecific |
| クラッシュ！大悪党のブラッドオレンジ・フローズンソーダ | manual:ミニオン・パーク/イーブル・イーツ/クラッシュ！大悪党のブラッドオレンジ・フローズンソーダ | 新規 | あり | 900 | イーブル・イーツ | ミニオン・パーク | drink | manual_foods/memberships/variants/metadata | approved | https://unicolle.vercel.app/foods/(after-import-manual-id) | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific<br>takeoutAvailable<br>description.productSpecific<br>priceVariants |
| 映画スターのミニオンフラッペ ～ピーチ＆レモン～ | manual:ミニオン・パーク/デリシャス・ミー！ ザ・クッキー・キッチン/映画スターのミニオンフラッペ ～ピーチ＆レモン～ | 新規 | あり | 900 | デリシャス・ミー！ ザ・クッキー・キッチン | ミニオン・パーク | drink | manual_foods/memberships/variants/metadata | approved | https://unicolle.vercel.app/foods/(after-import-manual-id) | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific<br>takeoutAvailable<br>description.productSpecific<br>priceVariants |
| スヌーピー・フラッペ ～いちごミルク＆白桃～ | manual:ユニバーサル・ワンダーランド/スヌーピー™・バックロット・カフェ/スヌーピー・フラッペ ～いちごミルク＆白桃～ | 新規 | 未採用 | 900 | スヌーピー™・バックロット・カフェ | ユニバーサル・ワンダーランド | drink | manual_foods/memberships/variants/metadata | pending | 管理画面のみ/未登録 | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific<br>takeoutAvailable<br>priceVariants |
| 遊泳禁止!! ジョーズ・フラッペ ～ピーチ＆ソルトホイップ～ | manual:アミティ・ビレッジ/ボードウォーク・スナック/遊泳禁止!! ジョーズ・フラッペ ～ピーチ＆ソルトホイップ～ | 新規 | 未採用 | 900 | ボードウォーク・スナック | アミティ・ビレッジ | drink | manual_foods/memberships/variants/metadata | pending | 管理画面のみ/未登録 | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific<br>takeoutAvailable<br>priceVariants |
| トロピカル・フラッペ ～ストロベリー～ | manual:サンフランシスコ・エリア / アミティ・ビレッジ/ワーフカフェ / ボードウォーク・スナック/トロピカル・フラッペ ～ストロベリー～ | 新規 | 未採用 | 800 | ワーフカフェ / ボードウォーク・スナック | サンフランシスコ・エリア / アミティ・ビレッジ | drink | manual_foods/memberships/variants/metadata | pending | 管理画面のみ/未登録 | saleStartDate<br>saleEndDate<br>takeoutAvailable<br>saleTimeCondition.normalHours<br>imageUrl.singleProduct |
| トロピカル・フラッペ ～マンゴー～ | manual:サンフランシスコ・エリア / アミティ・ビレッジ/ワーフカフェ / ボードウォーク・スナック/トロピカル・フラッペ ～マンゴー～ | 新規 | 未採用 | 800 | ワーフカフェ / ボードウォーク・スナック | サンフランシスコ・エリア / アミティ・ビレッジ | drink | manual_foods/memberships/variants/metadata | pending | 管理画面のみ/未登録 | saleStartDate<br>saleEndDate<br>takeoutAvailable<br>saleTimeCondition.normalHours<br>imageUrl.singleProduct |
| ジョーズ・ドリンクボトル | manual:アミティ・ビレッジ/アミティ・ランディング・レストラン/ジョーズ・ドリンクボトル | 新規 | あり | 2300 | アミティ・ランディング・レストラン | アミティ・ビレッジ | drink | manual_foods/memberships/variants/metadata | approved | https://unicolle.vercel.app/foods/(after-import-manual-id) | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific<br>takeoutAvailable |
| 憧れの大悪党？ ボブ・ドリンクボトル | food-1kvqau2 | 既存追記 | あり | 2300 | デリシャス・ミー！ ザ・クッキー・キッチン / ワーフカフェ | ミニオン・パーク / サンフランシスコ・エリア | drink | food_overrides/memberships/variants/metadata | pending | 管理画面のみ/未登録 | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific<br>takeoutAvailable<br>description.productSpecific |
| ジュラシック・パーク・ドリンクボトル | food-alnomv | 既存追記 | あり | 2300 | ジュラシック・パーク・ザ・ライド スプラッシュダウン前フードカート | ジュラシック・パーク | drink | food_overrides/memberships/variants/metadata | pending | 管理画面のみ/未登録 | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific<br>takeoutAvailable<br>description.productSpecific<br>price.official |
| 大悪党のためのドーナツ・バーガー ～BBQ ポーク&ベーコン～ | food-r24nsm | 既存追記 | あり | 1200 | イーブル・イーツ | ミニオン・パーク | burger | food_overrides/memberships/variants/metadata | approved | https://unicolle.vercel.app/foods/food-r24nsm | saleStartDate<br>saleEndDate<br>saleTimeCondition.productSpecific<br>takeoutAvailable<br>description.productSpecific<br>priceVariants |
| ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き | manual:ニューヨーク・エリア/イルミネーション・シアター入口横フードカート / パークサイド・グリル横フードカート/ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き | 新規 | 未採用 | 未確認 | イルミネーション・シアター入口横フードカート / パークサイド・グリル横フードカート | ニューヨーク・エリア | drink | manual_foods/memberships/variants/metadata | pending | 管理画面のみ/未登録 | price<br>priceVariants<br>saleStartDate<br>saleEndDate<br>saleTimeCondition.normalHours<br>takeoutAvailable<br>imageUrl.singleProduct |

## ロールバック方法

- 今回はSupabaseへ書き込んでいないためDBロールバック不要。
- import実行後に戻す場合は、docsの本レポートと import-ready の対象foodIdを使い、manual_foods新規行、food_collection_memberships、food_variants、food_publication_metadata、food_overridesを対象foodId単位で削除または前回revisionへ戻す。
