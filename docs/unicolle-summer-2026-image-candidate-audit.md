# 2026年夏フード画像候補 再監査

- 実施日時: 2026-07-08T14:15:00.000+09:00
- 対象: data/imports/unicolle-summer-2026-drafts.json の30件
- 方針: Codexではconfirmedへ変更しない。imageUrlへ正式採用しない。候補画像は人間確認用として保存する。
- ローカルcurl注記: この環境では www.usj.co.jp のDNS解決に失敗したため、公式ページ本文はブラウザ検索ツールで確認し、候補URLは公式ページ掲載・既存候補URLを基準に整理した。

## 件数

- 監査前: candidate-only 8件 / unresolved 22件
- 監査後: candidate-only 29件 / unresolved 1件
- confirmed 0件 / incorrect 0件 / no-image 0件
- import-ready 0件 / approved 0件 / Supabase書き込み 0件

## 全30件監査表

| 商品名 | 現在の状態 | 候補件数 | 候補の種類 | 公式単体画像の有無 | 集合画像の有無 | 出典URL | 未解決理由 | 人間が次に確認する内容 |
|---|---:|---:|---|---|---|---|---|---|
| 夏祭りの金魚 レモンサイダー | candidate-only | 2 | official-restaurant, official-usj | あり | なし | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/events/summer-2026/universal-summer/matsuri-nights/index.html | - | 公式単体候補2件から通常版/ネオン・カップ付きのどちらを採用するか確認する。 |
| 超！！ チョコバナナ・チュリトス | candidate-only | 2 | official-restaurant, official-usj | あり | なし | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/events/summer-2026/universal-summer/matsuri-nights/index.html | - | 公式候補2件を比較し、チュリトス単体として採用できる画像を確認する。 |
| いちご練乳 ソーダスムージー | candidate-only | 2 | official-restaurant, official-usj | あり | なし | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/events/summer-2026/universal-summer/matsuri-nights/index.html | - | 公式単体候補2件から通常版/ネオン・カップ付きのどちらを採用するか確認する。 |
| カレーナン!? 焼きそばドッグ | candidate-only | 2 | official-restaurant, official-usj | あり | なし | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/events/summer-2026/universal-summer/matsuri-nights/index.html | - | 公式候補2件を比較し、商品本体が主役の画像を採用する。 |
| フローズン・ジントニック ～シトラス～ | candidate-only | 1 | official-restaurant | あり | なし | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html | - | 公式候補1件を確認し、ネオン・カップ付き/通常版の扱いを判断する。 |
| 25周年カクテル ～ポップコーンフレーバー？～ | candidate-only | 1 | official-restaurant | あり | なし | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html | - | 公式候補1件を確認し、2026夏候補として扱うか重複方針と合わせて判断する。 |
| キャラメルポップコーン!? チュリトス | candidate-only | 1 | official-restaurant | あり | なし | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html | - | 公式候補1件を確認し、既存商品へのsummer-2026追加方針と合わせて判断する。 |
| りんご飴 ～りんごのムース～ | candidate-only | 1 | official-restaurant | 未確認 | あり | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/seasonal-food/index.html | - | 公式集合/左右掲載画像の左側がりんご飴か、人間が拡大表示で確認する。 |
| 水風船 ～ピーチゼリー＆レアチーズムース～ | candidate-only | 1 | official-restaurant | 未確認 | あり | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/seasonal-food/index.html | - | 公式集合/左右掲載画像の右側が水風船か、人間が拡大表示で確認する。 |
| 紫陽花 ～葡萄と柚子の和氷菓 焼き菓子添え～ | candidate-only | 2 | official-restaurant | あり | なし | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/seasonal-food/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/saido/index.html | - | 公式候補2件から皿全体が見やすいものを採用する。 |
| 柑橘おろしと白みその冷やしうどん御膳 | candidate-only | 2 | official-restaurant | あり | なし | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/seasonal-food/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/saido/index.html | - | 公式候補2件を確認する。2025を含むファイル名の候補は現在公式ページ掲載である点も確認する。 |
| オマール海老の冷製パスタ アメリケーヌのグラニテ添え | candidate-only | 2 | official-restaurant | あり | なし | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/seasonal-food/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/park-side-grille/index.html | - | 公式候補2件から商品本体が最も確認しやすいものを採用する。 |
| プルドポーク＆チキン・スパイシー BBQ ピッツアセット | candidate-only | 2 | official-restaurant | あり | なし | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/seasonal-food/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/louies-ny-pizza-parlor/index.html | - | 公式候補2件を比較し、セット画像/ピッツア単体画像の登録方針を判断する。 |
| ガーリック・シュリンプ・ピッツァセット | candidate-only | 2 | official-restaurant | あり | なし | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/seasonal-food/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/louies-ny-pizza-parlor/index.html | - | 公式候補2件を比較し、セット画像/ピッツア単体画像の登録方針を判断する。 |
| クランチ・タコスバーガーセット | candidate-only | 2 | official-restaurant | あり | なし | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/seasonal-food/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/mels-drive-in/index.html | - | 公式候補2件を確認する。2025を含むファイル名の候補は現在公式ページ掲載である点も確認する。 |
| SAIDO スペシャルドリンク ～柚子～/ ～抹茶～/ ～西瓜～ | candidate-only | 1 | official-restaurant | 未確認 | あり | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/saido/index.html | - | 3種ドリンク集合候補として登録するか、priceVariants/単一商品名の扱いを人間が判断する。 |
| ストロベリー・フローズン・スムージー | candidate-only | 1 | official-restaurant | 未確認 | あり | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/beverly-hills-boulangerie/index.html | - | 3種集合画像内のストロベリーを確認する。切り抜きは行わない。 |
| トロピカルフルーツ・フローズン・スムージー | candidate-only | 1 | official-restaurant | 未確認 | あり | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/seasonal-food/index.html | - | 3種集合画像内のトロピカルフルーツを確認する。切り抜きは行わない。 |
| マンゴー・フローズン・スムージー | unresolved | 0 | 候補なし | 未確認 | あり | 未確認 | 公式ページでは3種集合画像のみ確認。候補URL重複0件を維持できる未使用の公式候補を確保できなかった。 | 管理画面外で追加公式単体画像がないか人間が確認する。候補なしのまま正式採用しない。 |
| クラッシュ！大悪党のブラッドオレンジ・フローズンソーダ | candidate-only | 3 | official-restaurant | あり | なし | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/evil-eats/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html | - | 公式候補3件から商品本体が主役の画像を採用する。 |
| 映画スターのミニオンフラッペ ～ピーチ＆レモン～ | candidate-only | 3 | official-restaurant | あり | なし | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/delicious-me-the-cookie-kitchen/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html | - | 公式候補3件から商品本体が主役の画像を採用する。 |
| スヌーピー・フラッペ ～いちごミルク＆白桃～ | candidate-only | 1 | official-restaurant | あり | あり | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/snoopys-backlot-cafe/index.html | - | 単体offer-card候補を優先し、集合候補は除外済み。人間が単体画像として確認する。 |
| 遊泳禁止!! ジョーズ・フラッペ ～ピーチ＆ソルトホイップ～ | candidate-only | 1 | official-restaurant | あり | あり | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/boardwalk-snacks/index.html | - | 単体offer-card候補を優先し、集合候補は除外済み。人間が単体画像として確認する。 |
| トロピカル・フラッペ ～ストロベリー～ | candidate-only | 1 | official-restaurant | 未確認 | あり | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/wharf-cafe/index.html | - | ストロベリー/マンゴー集合候補を確認する。切り抜きは行わない。 |
| トロピカル・フラッペ ～マンゴー～ | candidate-only | 2 | official-restaurant | 未確認 | あり | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html | - | ストロベリー/マンゴー集合候補を確認する。切り抜きは行わない。 |
| ジョーズ・ドリンクボトル | candidate-only | 2 | official-restaurant | あり | なし | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/amity-landing-restaurant/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/seasonal-food/index.html | - | 公式候補2件を確認し、ドリンクボトル本体が主役の画像を採用する。 |
| 憧れの大悪党？ ボブ・ドリンクボトル | candidate-only | 2 | official-restaurant | あり | なし | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/delicious-me-the-cookie-kitchen/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html | - | 公式候補2件を確認し、既存商品追記方針と合わせて採用可否を判断する。 |
| ジュラシック・パーク・ドリンクボトル | candidate-only | 2 | official-restaurant | あり | なし | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html | - | 公式候補2件を確認し、既存商品追記方針と合わせて採用可否を判断する。 |
| 大悪党のためのドーナツ・バーガー ～BBQ ポーク&ベーコン～ | candidate-only | 2 | official-restaurant | あり | なし | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/evil-eats/index.html<br>https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/food-cart/index.html | - | 公式候補2件を確認し、既存商品追記方針と合わせて採用可否を判断する。 |
| ソフローズン グレープ マイメロディ＆クロミ バケツ＆スプーン付き | candidate-only | 1 | official-restaurant | 未確認 | あり | https://www.usj.co.jp/contentdata/usj/ja/jp/restaurants/seasonal-food/index.html | - | 3商品集合画像の中央が対象商品か、人間が拡大表示で確認する。切り抜きは行わない。 |

## 重複・除外メモ

- Google検索サムネイルURL、ローカルURL、一時URLは候補に含めていない。
- 同一URLは候補として重複保存しない方針で整理した。集合画像が複数商品に関係する場合も、正式採用せず人間確認用候補として扱う。
- スムージー3種のうち「マンゴー・フローズン・スムージー」は、公式ページで確認できた画像が3種集合画像のみで、重複しない未使用候補URLを確保できなかったためunresolvedに維持した。
- 既存候補で明確にGoogleサムネイル、店舗外観、メニュー表、ローカルURLに該当するものは確認されなかった。

