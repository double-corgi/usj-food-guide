# 2026年夏フード 本番import結果

- 実行日時: 2026-07-09T07:43:52.567Z
- 実行方式: Vercel Production上の一時サーバー処理でSUPABASE_SERVICE_ROLE_KEYを使用。値は表示・保存していない。
- import-ready件数: 28
- 初回実登録: inserted 24, updated 4, skipped 0
- 冪等再実行: inserted 0, updated 28, skipped 0
- 新規商品: 24
- 既存商品追記: 4
- approved: 11
- pending: 17
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
- DB全体 revisions: 0 -> 28

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
| 憧れの大悪党？ ボブ・ドリンクボトル | food-1kvqau2 | existing | pending | food_overrides / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | updated: collection summer-2026 追加, publication metadata保存、published_at null, food_variants冪等保存, food_override_revisionsへ履歴追加, food_overridesを冪等upsert | https://unicolle.vercel.app/foods/food-1kvqau2 |
| ジュラシック・パーク・ドリンクボトル | food-alnomv | existing | pending | food_overrides / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions | updated: collection summer-2026 追加, publication metadata保存、published_at null, food_variants冪等保存, food_override_revisionsへ履歴追加, food_overridesを冪等upsert | https://unicolle.vercel.app/foods/food-alnomv |
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

## ロールバック方法

- 新規manual_foodsは上記foodIdの `manual_foods` 行を削除し、対応する `food_collection_memberships` / `food_variants` / `food_publication_metadata` を削除する。
- 既存商品追記は `food_overrides` を直前revisionのsnapshotに戻し、summer-2026 membership・variants・publication metadataを必要に応じて復元する。
- 変更履歴は `food_override_revisions` の `action=summer-2026-auto-import` で追跡できる。
