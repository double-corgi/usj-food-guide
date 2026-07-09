# 2026年夏フード 本番import結果

- 実行日時: 2026-07-09T07:43:52.567Z
- 実行方式: Vercel Production上の一時サーバー処理でSUPABASE_SERVICE_ROLE_KEYを使用。値は表示・保存していない。
- import-ready件数: 28
- 初回実登録: inserted 24, updated 4, skipped 0
- 初回冪等再実行（修正前）: inserted 0, updated 28, skipped 0
- 最終QA冪等再実行（修正後）: inserted 0, updated 0, skipped 28
- pending追加調査後の差分更新: inserted 0, updated 5, skipped 23
- publishedAt補正更新: inserted 0, updated 2, skipped 26
- pending追加調査後の最終冪等再実行: inserted 0, updated 0, skipped 28
- 新規商品: 24
- 既存商品追記: 4
- approved: 13
- pending: 15
- rejected: 0
- publishedAtあり: 0
- hidden manual foods: 0
- 検証issue: なし

## DB件数

- import対象 manual_foods: 0 -> 24
- import対象 collection memberships: 0 -> 28
- import対象 publication metadata: 0 -> 28
- import対象 variants: 0 -> 38
- DB全体 manual_foods: 2 -> 26
- DB全体 collection memberships: 0 -> 28
- DB全体 publication metadata: 0 -> 28
- DB全体 variants: 0 -> 38
- DB全体 overrides: 1 -> 5
- DB全体 revisions: 0 -> 30

## 登録対象

| 商品名 | foodId | targetType | reviewStatus | DB保存先 | 初回結果 | Vercel表示URL |
|---|---|---|---|---|---|---|
| 夏祭りの金魚 レモンサイダー | food-manual-0625351f22 | new | pending | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-0625351f22 |
| いちご練乳 ソーダスムージー | food-manual-736109191f | new | pending | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-736109191f |
| カレーナン!? 焼きそばドッグ | food-manual-2f13b0cefe | new | pending | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-2f13b0cefe |
| フローズン・ジントニック ～シトラス～ | food-manual-aa0f866b68 | new | pending | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-aa0f866b68 |
| 25周年カクテル ～ポップコーンフレーバー？～ | food-d5v0l2 | existing | approved | food_overrides / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | updated: collection summer-2026 追加, publication metadata保存、published_at null, food_variants冪等保存, food_override_revisionsへ履歴追加, food_overridesを冪等upsert | https://unicolle.vercel.app/foods/food-d5v0l2 |
| りんご飴 ～りんごのムース～ | food-manual-26fa16ed9b | new | pending | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-26fa16ed9b |
| 水風船 ～ピーチゼリー＆レアチーズムース～ | food-manual-2f3fb0c8dc | new | pending | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-2f3fb0c8dc |
| 紫陽花 ～葡萄と柚子の和氷菓 焼き菓子添え～ | food-manual-dc7e97578d | new | approved | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-dc7e97578d |
| 柑橘おろしと白みその冷やしうどん御膳 | food-manual-8183cf38e8 | new | approved | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-8183cf38e8 |
| オマール海老の冷製パスタ アメリケーヌのグラニテ添え | food-manual-85ac2bfa4b | new | approved | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-85ac2bfa4b |
| プルドポーク＆チキン・スパイシー BBQ ピッツアセット | food-manual-9532c3275d | new | approved | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-9532c3275d |
| ガーリック・シュリンプ・ピッツァセット | food-manual-3f6d492fa6 | new | approved | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-3f6d492fa6 |
| クランチ・タコスバーガーセット | food-manual-cc14e5f148 | new | approved | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-cc14e5f148 |
| SAIDO スペシャルドリンク ～柚子～/ ～抹茶～/ ～西瓜～ | food-manual-0bec10711b | new | pending | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-0bec10711b |
| ストロベリー・フローズン・スムージー | food-manual-460ba88510 | new | pending | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-460ba88510 |
| トロピカルフルーツ・フローズン・スムージー | food-manual-3478564a9f | new | pending | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-3478564a9f |
| マンゴー・フローズン・スムージー | food-manual-5dd3fd60a8 | new | pending | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-5dd3fd60a8 |
| クラッシュ！大悪党のブラッドオレンジ・フローズンソーダ | food-manual-fd5d2c84f1 | new | approved | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-fd5d2c84f1 |
| 映画スターのミニオンフラッペ ～ピーチ＆レモン～ | food-manual-c11d98d824 | new | approved | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-c11d98d824 |
| スヌーピー・フラッペ ～いちごミルク＆白桃～ | food-manual-cf68598e59 | new | pending | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-cf68598e59 |
| 遊泳禁止!! ジョーズ・フラッペ ～ピーチ＆ソルトホイップ～ | food-manual-eac27732ca | new | pending | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-eac27732ca |
| トロピカル・フラッペ ～ストロベリー～ | food-manual-cba8c213d3 | new | pending | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-cba8c213d3 |
| トロピカル・フラッペ ～マンゴー～ | food-manual-79498d79ed | new | pending | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-79498d79ed |
| ジョーズ・ドリンクボトル | food-manual-ff85e1ea6d | new | approved | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-ff85e1ea6d |
| 憧れの大悪党？ ボブ・ドリンクボトル | food-1kvqau2 | existing | approved | food_overrides / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | updated: collection summer-2026 追加, publication metadata保存、published_at null, food_variants冪等保存, food_override_revisionsへ履歴追加, food_overridesを冪等upsert | https://unicolle.vercel.app/foods/food-1kvqau2 |
| ジュラシック・パーク・ドリンクボトル | food-alnomv | existing | approved | food_overrides / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | updated: collection summer-2026 追加, publication metadata保存、published_at null, food_variants冪等保存, food_override_revisionsへ履歴追加, food_overridesを冪等upsert | https://unicolle.vercel.app/foods/food-alnomv |
| 大悪党のためのドーナツ・バーガー ～BBQ ポーク&ベーコン～ | food-r24nsm | existing | approved | food_overrides / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | updated: collection summer-2026 追加, publication metadata保存、published_at null, food_variants冪等保存, food_override_revisionsへ履歴追加, food_overridesを冪等upsert | https://unicolle.vercel.app/foods/food-r24nsm |
| ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き | food-manual-a12824cd38 | new | pending | manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | inserted: manual_foodsへ新規追加 | https://unicolle.vercel.app/foods/food-manual-a12824cd38 |

## 登録しなかった商品

- 超！！ チョコバナナ・チュリトス: 既存商品統合と価格情報に人間確認が必要なため保留。
- キャラメルポップコーン!? チュリトス: 既存商品統合に人間確認が必要なため保留。

## 管理画面確認

- 管理画面URL: https://unicolle.vercel.app/admin/foods
- 未ログイン時は `/admin/login?next=%2Fadmin%2Ffoods` へリダイレクトされ、管理者認証は維持。
- 登録商品は通常の `/admin/foods` の商品一覧・詳細・編集で扱える既存DB構造へ保存。

## Web / PWA / iOS互換性

- Web/PWA/iOSはいずれも既存repositoryから同じfoodIdを参照する。
- 画像はHTTPS URLのみ。ローカルファイルパスは使用していない。
- UserFoodLog、Bundle ID、Capacitor appId、AdMob設定は変更していない。

## 重複・冪等性

- membership重複: 0
- default variant重複: 0
- 再実行時の追加insert: 0
- 最終QA後の同一内容再実行: inserted 0, updated 0, skipped 28
- pending追加調査後の同一内容再実行: inserted 0, updated 0, skipped 28
- 同一内容時は `manual_foods` / `food_overrides` / `food_publication_metadata` / `food_variants` / `food_override_revisions` を書き込まないように修正。

## ロールバック方法

- 新規manual_foodsは上記foodIdの `manual_foods` 行を削除し、対応する `food_collection_memberships` / `food_variants` / `food_publication_metadata` を削除する。
- 既存商品追記は `food_overrides` を直前revisionのsnapshotに戻し、summer-2026 membership・variants・publication metadataを必要に応じて復元する。
- 変更履歴は `food_override_revisions` の `action=summer-2026-auto-import` で追跡できる。

## 本番登録後 最終QA（2026-07-09）

- 対象: 登録済み28件（新規24件、既存追記4件）
- 最終reviewStatus: approved 13件、pending 15件、rejected 0件
- publishedAtあり: 0件（既存公開ルール上、`reviewStatus=approved` と `hidden=false` で公開確認済み。無理なpublishedAt設定は行っていない）
- hidden manual foods: 0件
- approvedへ変更した商品: 2件（憧れの大悪党？ ボブ・ドリンクボトル、ジュラシック・パーク・ドリンクボトル）。どちらも既存foodIdを維持し、summer-2026所属・価格・画像・店舗・エリア・重複処理が揃ったため公開可能と判断。
- pending維持: 15件。画像未確定または価格未確認が残る商品は公開せず、管理画面で編集可能なpendingとして維持。
- 画像HTTP確認: 画像URLあり16件はすべてHTTPSかつHTTP 200。画像URLなし12件はpending維持。
- 価格確認: 価格未確認4件はpending維持。
- Vercel公開確認: `/`, `/foods`, `/areas`, `/stores` は200。approved 13商品の詳細URLはすべて200。
- 最終デプロイ確認: 一時import API `/api/internal-summer-2026-import` は本番で404。追加approved 2件（`food-1kvqau2`, `food-alnomv`）の詳細URLは200。
- 管理画面確認: `/admin/foods` は未ログイン時 `/admin/login?next=%2Fadmin%2Ffoods` へ307リダイレクトし、認証保護を維持。通常の商品管理画面は既存Supabase repository/actionsで編集・公開管理する。
- Web / PWA / iOS: 既存repositoryを共有し、HTTPS画像のみを使用。UserFoodLog、localStorageキー、Bundle ID、Capacitor appId、AdMob設定は変更していない。
- 保留2件の再調査:
  - 超！！ チョコバナナ・チュリトス: USJ公式フードカートページで商品名・画像・ニューヨーク・エリア掲載は確認。価格と既存チュリトス統合判断を確定できず、未登録を維持。
  - キャラメルポップコーン!? チュリトス: USJ公式フードカートページで商品名・画像・ニューヨーク・エリア掲載は確認。価格と既存チュリトス統合判断を確定できず、未登録を維持。

### 全28件の最終状態

| 商品名 | foodId | 状態 | 価格 | 画像 | 店舗 | エリア | 最終QA判断 |
|---|---|---|---|---|---|---|---|
| 夏祭りの金魚 レモンサイダー | food-manual-0625351f22 | pending | 未確認 | HTTP 200 | ユニバーサル・マーケット内ハピネス・ワゴン | ニューヨーク・エリア | pending維持（価格未確認） |
| いちご練乳 ソーダスムージー | food-manual-736109191f | pending | 未確認 | HTTP 200 | ユニバーサル・マーケット内トローリー・トリート | ニューヨーク・エリア | pending維持（価格未確認） |
| カレーナン!? 焼きそばドッグ | food-manual-2f13b0cefe | pending | 未確認 | HTTP 200 | ユニバーサル・マーケット内ホットドッグカート | ニューヨーク・エリア | pending維持（価格未確認） |
| フローズン・ジントニック ～シトラス～ | food-manual-aa0f866b68 | pending | 900円 | 未登録 | パークサイド・グリル | ニューヨーク・エリア | pending維持（画像未確定） |
| 25周年カクテル ～ポップコーンフレーバー？～ | food-d5v0l2 | approved | 900円 | HTTP 200 | パークサイド・グリル | ニューヨーク・エリア | approved維持（公開詳細URL 200） |
| りんご飴 ～りんごのムース～ | food-manual-26fa16ed9b | pending | 950円 | 未登録 | ビバリーヒルズ・ブランジェリー | ハリウッド・エリア | pending維持（画像未確定） |
| 水風船 ～ピーチゼリー＆レアチーズムース～ | food-manual-2f3fb0c8dc | pending | 950円 | 未登録 | ビバリーヒルズ・ブランジェリー | ハリウッド・エリア | pending維持（画像未確定） |
| 紫陽花 ～葡萄と柚子の和氷菓 焼き菓子添え～ | food-manual-dc7e97578d | approved | 1800円 | HTTP 200 | SAIDO | ニューヨーク・エリア | approved維持（公開詳細URL 200） |
| 柑橘おろしと白みその冷やしうどん御膳 | food-manual-8183cf38e8 | approved | 2600円 | HTTP 200 | SAIDO | ニューヨーク・エリア | approved維持（公開詳細URL 200） |
| オマール海老の冷製パスタ アメリケーヌのグラニテ添え | food-manual-85ac2bfa4b | approved | 3300円 | HTTP 200 | パークサイド・グリル | ニューヨーク・エリア | approved維持（公開詳細URL 200） |
| プルドポーク＆チキン・スパイシー BBQ ピッツアセット | food-manual-9532c3275d | approved | 1950円 | HTTP 200 | ルイズ N.Y. ピザパーラー | ニューヨーク・エリア | approved維持（公開詳細URL 200） |
| ガーリック・シュリンプ・ピッツァセット | food-manual-3f6d492fa6 | approved | 1950円 | HTTP 200 | ルイズ N.Y. ピザパーラー | ニューヨーク・エリア | approved維持（公開詳細URL 200） |
| クランチ・タコスバーガーセット | food-manual-cc14e5f148 | approved | 2100円 | HTTP 200 | メルズ・ドライブイン | ハリウッド・エリア | approved維持（公開詳細URL 200） |
| SAIDO スペシャルドリンク ～柚子～/ ～抹茶～/ ～西瓜～ | food-manual-0bec10711b | pending | 700円 | 未登録 | SAIDO | ニューヨーク・エリア | pending維持（画像未確定） |
| ストロベリー・フローズン・スムージー | food-manual-460ba88510 | pending | 800円 | 未登録 | ビバリーヒルズ・ブランジェリー | ハリウッド・エリア | pending維持（画像未確定） |
| トロピカルフルーツ・フローズン・スムージー | food-manual-3478564a9f | pending | 900円 | 未登録 | ビバリーヒルズ・ブランジェリー | ハリウッド・エリア | pending維持（画像未確定） |
| マンゴー・フローズン・スムージー | food-manual-5dd3fd60a8 | pending | 800円 | 未登録 | ビバリーヒルズ・ブランジェリー | ハリウッド・エリア | pending維持（画像未確定） |
| クラッシュ！大悪党のブラッドオレンジ・フローズンソーダ | food-manual-fd5d2c84f1 | approved | 900円 | HTTP 200 | イーブル・イーツ | ミニオン・パーク | approved維持（公開詳細URL 200） |
| 映画スターのミニオンフラッペ ～ピーチ＆レモン～ | food-manual-c11d98d824 | approved | 900円 | HTTP 200 | デリシャス・ミー！ ザ・クッキー・キッチン | ミニオン・パーク | approved維持（公開詳細URL 200） |
| スヌーピー・フラッペ ～いちごミルク＆白桃～ | food-manual-cf68598e59 | approved | 900円 | HTTP 200 | スヌーピー™・バックロット・カフェ | ユニバーサル・ワンダーランド | approvedへ変更（公式単体offer-card画像確認、公開詳細URL 200） |
| 遊泳禁止!! ジョーズ・フラッペ ～ピーチ＆ソルトホイップ～ | food-manual-eac27732ca | approved | 900円 | HTTP 200 | ボードウォーク・スナック | アミティ・ビレッジ | approvedへ変更（公式単体offer-card画像確認、公開詳細URL 200） |
| トロピカル・フラッペ ～ストロベリー～ | food-manual-cba8c213d3 | pending | 800円 | 未登録 | ワーフカフェ / ボードウォーク・スナック | サンフランシスコ・エリア / アミティ・ビレッジ | pending維持（画像未確定） |
| トロピカル・フラッペ ～マンゴー～ | food-manual-79498d79ed | pending | 800円 | 未登録 | ワーフカフェ / ボードウォーク・スナック | サンフランシスコ・エリア / アミティ・ビレッジ | pending維持（画像未確定） |
| ジョーズ・ドリンクボトル | food-manual-ff85e1ea6d | approved | 2300円 | HTTP 200 | アミティ・ランディング・レストラン | アミティ・ビレッジ | approved維持（公開詳細URL 200） |
| 憧れの大悪党？ ボブ・ドリンクボトル | food-1kvqau2 | approved | 2300円 | HTTP 200 | デリシャス・ミー！ ザ・クッキー・キッチン / ワーフカフェ | ミニオン・パーク / サンフランシスコ・エリア | approvedへ変更（既存foodId維持、公開詳細URL 200） |
| ジュラシック・パーク・ドリンクボトル | food-alnomv | approved | 2300円 | HTTP 200 | ジュラシック・パーク・ザ・ライド スプラッシュダウン前フードカート | ジュラシック・パーク | approvedへ変更（既存foodId維持、公開詳細URL 200） |
| 大悪党のためのドーナツ・バーガー ～BBQ ポーク&ベーコン～ | food-r24nsm | approved | 1200円 | HTTP 200 | イーブル・イーツ | ミニオン・パーク | approved維持（公開詳細URL 200） |
| ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き | food-manual-a12824cd38 | pending | 未確認 | 未登録 | イルミネーション・シアター入口横フードカート / パークサイド・グリル横フードカート | ニューヨーク・エリア | pending維持（画像未確定 / 価格未確認） |

## 残未完成商品の商品別追加調査（2026-07-10）

- 対象: pending 15件 + 未登録保留 2件
- 新規画像設定: 2件
- 新規価格設定: 0件
- approvedへ変更: 2件
- 最終reviewStatus: approved 15件、pending 13件、rejected 0件
- 未登録保留: 2件
- 画像未登録予定: 10件
- 価格未確認予定: 4件（登録済みpending内）。未登録保留の超！！ チョコバナナ・チュリトスも価格未確認。

### approvedへ変更した商品

| 商品名 | foodId | 根拠 | 画像 | 価格 | 判断 |
|---|---|---|---|---|---|
| スヌーピー・フラッペ ～いちごミルク＆白桃～ | food-manual-cf68598e59 | USJ公式スヌーピー™・バックロット・カフェcontentdataで商品名とoffer-card単体画像を確認 | HTTPS/HTTP 200、公式単体画像 | 900円確認済み | 本番DBをapprovedへ更新済み。公開詳細URL 200 |
| 遊泳禁止!! ジョーズ・フラッペ ～ピーチ＆ソルトホイップ～ | food-manual-eac27732ca | USJ公式ボードウォーク・スナックcontentdataで商品名とoffer-card単体画像を確認 | HTTPS/HTTP 200、公式単体画像 | 900円確認済み | 本番DBをapprovedへ更新済み。公開詳細URL 200 |

### pendingを維持した商品

| 商品名 | foodId | 維持理由 |
|---|---|---|
| 夏祭りの金魚 レモンサイダー | food-manual-0625351f22 | 公式商品画像・店舗・エリアは確認済みだが価格未確認 |
| いちご練乳 ソーダスムージー | food-manual-736109191f | 公式商品画像・店舗・エリアは確認済みだが価格未確認 |
| カレーナン!? 焼きそばドッグ | food-manual-2f13b0cefe | 公式商品画像・店舗・エリアは確認済みだが価格未確認 |
| フローズン・ジントニック ～シトラス～ | food-manual-aa0f866b68 | 価格は確認済みだが公式画像が通常版/ネオンカップ付きの集合画像のみ |
| りんご飴 ～りんごのムース～ | food-manual-26fa16ed9b | 価格は確認済みだが公式画像が水風船との集合画像のみ |
| 水風船 ～ピーチゼリー＆レアチーズムース～ | food-manual-2f3fb0c8dc | 価格は確認済みだが公式画像がりんご飴との集合画像のみ |
| SAIDO スペシャルドリンク ～柚子～/ ～抹茶～/ ～西瓜～ | food-manual-0bec10711b | 価格は確認済みだが公式画像が3種集合、variant別説明も要確認 |
| ストロベリー・フローズン・スムージー | food-manual-460ba88510 | 価格は確認済みだが公式画像が3種集合のみ |
| トロピカルフルーツ・フローズン・スムージー | food-manual-3478564a9f | 価格は確認済みだが公式画像が3種集合のみ |
| マンゴー・フローズン・スムージー | food-manual-5dd3fd60a8 | 価格は確認済みだが公式画像が3種集合のみ |
| トロピカル・フラッペ ～ストロベリー～ | food-manual-cba8c213d3 | 価格/variantは確認済みだが公式画像がストロベリー/マンゴー/ネオンカップ集合のみ |
| トロピカル・フラッペ ～マンゴー～ | food-manual-79498d79ed | 価格/variantは確認済みだが公式画像がストロベリー/マンゴー/ネオンカップ集合のみ |
| ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き | food-manual-a12824cd38 | 価格未確認かつ公式画像が複数商品集合のみ |

### 未登録保留2件

- 超！！ チョコバナナ・チュリトス: USJ公式単体画像は確認済み。ただし価格未確認で、既存 `food-j4nvrm` はエリア/画像が夏商品情報と不一致のため統合先を確定できず保留。
- キャラメルポップコーン!? チュリトス: USJ公式単体画像と既存generated価格800円は確認済み。ただし同名generated候補が複数存在し、`food-14zoddb` と `food-ymiw07` のどちらをsummer-2026へ紐付けるか人間判断が必要なため保留。

詳細な検索語・確認URL・未解決理由は `docs/unicolle-summer-2026-remaining-gaps.md` を参照。

### 本番差分更新結果

- 実行日: 2026-07-10
- import-ready: 28件
- 初回差分更新: inserted 0 / updated 2 / skipped 26
- 更新対象: `food-manual-cf68598e59`, `food-manual-eac27732ca`
- 冪等性再実行: inserted 0 / updated 0 / skipped 28
- verification issues: 0
- publication metadata: approved 15件 / pending 13件 / publishedAt 0件
- hidden manual foods: 0件
- 一時import API: 最終デプロイで削除済み、`/api/internal-summer-2026-import` は404確認済み
- Vercel確認: `/`, `/foods`, `/areas`, `/stores`, 追加approved 2件の詳細URLはHTTP 200。`/admin/foods` は未認証で `/admin/login?next=%2Fadmin%2Ffoods` へ307リダイレクト。

## 公開コレクション整備（2026-07-10）

- 対象: summer-2026 collectionId が付いた登録済み28件
- 一般公開対象: 本番repositoryで公開取得できる approved 14件
- 一般公開除外: pending 13件、未登録保留 2件
- 正式URL: `/collections/summer-2026`
- `/foods` 連携: `?collection=summer-2026` で本番repositoryが返す approved の夏商品だけを絞り込み
- ホーム導線: 2026年夏限定コレクションカードを追加。掲載件数、食べた件数、達成率を既存UserFoodLogから計算
- 食べた記録: 既存 `uniba-food-logs-v1` の foodId をそのまま使用。既存food.idとUserFoodLogは変更なし
- 管理画面: `/admin/foods` に summer-2026 要確認キューを追加。pending商品と未登録保留2件の不足項目、出典、編集導線を集約
- 公開条件: 既存repositoryの `listFoods()` に従い、`reviewStatus=approved` かつ `hidden=false` の商品のみ公開
- pending公開: 0件を維持する設計
- 保留公開: 0件を維持する設計
- DB変更: なし（公開/管理UIの既存データ利用のみ）
- 本番確認: `https://unicolle.vercel.app/collections/summer-2026` はHTTP 200。画面上の公開件数は14件。
- 注意: 直前レポートには approved 15件と記録されているが、本番repositoryが返すsummer-2026公開対象は14件だった。Vercel production env pullでは `SUPABASE_SERVICE_ROLE_KEY` の値がローカル実行環境へ渡らず、DB補修は未実施。UIは本番DBの公開条件に従って14件を表示する。
