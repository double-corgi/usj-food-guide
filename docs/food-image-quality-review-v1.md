# UNICOLE 商品画像品質レビュー v1

## 1. 調査概要

UNICOLE の商品画像について、一覧カードで見たときに商品が分かりにくいもの、同じ画像が複数商品に使われているもの、文字入り・案内カード・背景が目立つ可能性があるものを整理した。

今回の調査では、外部画像取得、crawler 実行、画像差し替え、画像追加、画像削除は行っていない。`scripts/output/foods.generated.json` と `npm run audit:duplicates` の結果だけを読み、現状データ上の `displayQuality`、同一画像、canonical / hidden 状態、画像 URL 名から分類した。

## 2. Summary

- high priority: 10
- medium priority: 9
- low priority: 14
- immediate replacement recommended: 7
- manual confirmation needed: 12
- no action: 4
- duplicate image groups: 23
- 表示対象同士の duplicate image groups: 9
- 表示対象の displayQuality=medium: 9
- 表示対象の画像なし: 0

## 3. High Priority

### food-116rf8q

- food.id: `food-116rf8q`
- name: T-REX・バーガーセット
- price: 3500
- area: ジュラシック・パーク
- shop: ディスカバリー・レストラン
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-t-rex-burger-meal-spring-2025-offercard-h.jpg`
- reason: `food-19tglum` と同一画像。どちらも表示対象で、こちらは `displayQuality=medium`。
- recommended action: 公式ページまたは既存 public 画像から、T-REX・バーガーセット単体として識別しやすい画像候補を探す。
- classification: A. 画像差し替え優先

### food-e0few1

- food.id: `food-e0few1`
- name: ラプトル・バーガーセット
- price: 2300
- area: ジュラシック・パーク
- shop: ディスカバリー・レストラン
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-raptor-burger-meal-spring-2025-offercard-h.jpg`
- reason: `food-6d5z2w` と同一画像。どちらも表示対象で、こちらは `displayQuality=medium`。
- recommended action: ラプトル・バーガーセット単体として分かる画像候補を確認する。
- classification: A. 画像差し替え優先

### food-wn7ivo

- food.id: `food-wn7ivo`
- name: プテラノドン・バーガーセット
- price: 2100
- area: ジュラシック・パーク
- shop: ディスカバリー・レストラン
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-pteranodon-burger-meal-spring-2025-offercard-h.jpg`
- reason: `food-1x0ir52` と同一画像。どちらも表示対象で、こちらは `displayQuality=medium`。
- recommended action: プテラノドン・バーガーセット単体の画像候補を確認する。
- classification: A. 画像差し替え優先

### food-9un9k0

- food.id: `food-9un9k0`
- name: モササウルス・バーガーセット
- price: 2000
- area: ジュラシック・パーク
- shop: ディスカバリー・レストラン
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-mosasaurus-burger-meal-spring-2025-offercard-h.jpg`
- reason: `food-yhtmyt` と同一画像。どちらも表示対象で、こちらは `displayQuality=medium`。
- recommended action: モササウルス・バーガーセット単体の画像候補を確認する。
- classification: A. 画像差し替え優先

### food-sfsu3d

- food.id: `food-sfsu3d`
- name: フィルのワッフルチキンプレート
- price: unknown
- area: サンフランシスコ・エリア
- shop: ハピネス・カフェ
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-phils-chicken-and-waffle-meal-spring-2025-offercard-h.jpg`
- reason: `food-1ojz6jw` と同一画像。どちらも表示対象で、こちらは `displayQuality=medium`。
- recommended action: フィルのワッフルチキンプレートとして別商品に見える画像があるか確認する。
- classification: A. 画像差し替え優先

### food-bcbp5u

- food.id: `food-bcbp5u`
- name: スチュアートのビッグベーコンチーズ・バーガープレート
- price: 2300
- area: サンフランシスコ・エリア
- shop: ハピネス・カフェ
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-stuarts-big-bacon-and-cheese-burger-meal-spring-2025-offercard-h.jpg`
- reason: `food-1435vjy` と同一画像。どちらも表示対象で、こちらは `displayQuality=medium`。
- recommended action: 商品名と画像内容が一致しているかを確認し、別画像候補があれば差し替え対象にする。
- classification: A. 画像差し替え優先

### food-uqw79q

- food.id: `food-uqw79q`
- name: デザート&ドリンクバーセット
- price: 950
- area: サンフランシスコ・エリア
- shop: ハピネス・カフェ
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-minions-cup-dessert-offercard-h.jpg`
- reason: `food-12tnz7b` と同一画像。商品名が別で、こちらは `displayQuality=medium`。
- recommended action: デザート&ドリンクバーセット全体が分かる画像候補を確認する。
- classification: A. 画像差し替え優先

### food-j4nvrm

- food.id: `food-j4nvrm`
- name: 超!! チョコバナナ・チュリトス
- price: unknown
- area: スーパー・ニンテンドー・ワールド
- shop: パーク内レストラン
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-minion-choco-banana-churritos-gallery-a.jpg`
- reason: `food-gmrx8l` と同一画像。別商品または別エリア扱いなのに同じ見た目になる。
- recommended action: 商品として別物か、同一商品の別表記かを手動確認する。
- classification: B. 手動確認

### food-tgucsr

- food.id: `food-tgucsr`
- name: 虚式「茈」 チュリトス ~ミックスベリー味~
- price: 850
- area: ハリウッド・エリア
- shop: シネマ 4-D 前フードカート
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-jujutsukaisen-the-real-4d-2026-churritos-h.jpg`
- reason: `food-xfenq1` と同一画像。味違いチュリトスが同じ画像で表示される。
- recommended action: 商品画像として共通で問題ないか、味違い画像が必要かを手動確認する。
- classification: B. 手動確認

### food-o9svxw

- food.id: `food-o9svxw`
- name: ベビーフード
- price: unknown
- area: ニューヨーク・エリア
- shop: ルイズN.Y.ピザパーラー
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-baby-food-infocard-h.jpg`
- reason: URL 名が `infocard`。商品写真ではなく案内カードまたは文字入り画像の可能性が高い。
- recommended action: 商品画像として扱うべきか、案内情報として扱うべきかを手動確認する。
- classification: B. 手動確認

## 4. Medium Priority

### food-12eyica

- food.id: `food-12eyica`
- name: スペシャルドリンク&コースターセット
- price: 1300
- area: サンフランシスコ・エリア
- shop: 高級レストラン
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-detective-conan-mystery-restaurant-2026-drink-cf6-a.jpg`
- reason: `displayQuality=medium`。コラボ系画像で、一覧カード上の視認性を確認したい。
- recommended action: 商品が小さくないか、文字や背景が目立ちすぎないかを目視確認する。
- classification: B. 手動確認

### food-1gtoojv

- food.id: `food-1gtoojv`
- name: カレーライス・キッズセット
- price: 1400
- area: スーパー・ニンテンドー・ワールド
- shop: キノピオ・カフェ
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-kids-curry-meal-spring-2026-offercard-h.jpg`
- reason: `displayQuality=medium`。同一画像の片方は hidden 済みで表示重複はないが、カード表示で商品が分かりやすいか確認したい。
- recommended action: 目視確認し、問題がなければ維持する。
- classification: B. 手動確認

### food-19tglum

- food.id: `food-19tglum`
- name: T-REX・ガーリックトマト・ビーフバーガーセット
- price: 4500
- area: ジュラシック・パーク
- shop: ディスカバリー・レストラン
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-t-rex-burger-meal-spring-2025-offercard-h.jpg`
- reason: High Priority の `food-116rf8q` と同一画像を共有する表示対象。
- recommended action: 差し替えるなら派生商品のどちらに現在画像を残すべきか確認する。
- classification: B. 手動確認

### food-6d5z2w

- food.id: `food-6d5z2w`
- name: ラプトル・ベーコン&ビーフバーガーセット
- price: unknown
- area: ジュラシック・パーク
- shop: ディスカバリー・レストラン
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-raptor-burger-meal-spring-2025-offercard-h.jpg`
- reason: High Priority の `food-e0few1` と同一画像を共有する表示対象。
- recommended action: 現在画像を残す側として妥当か確認する。
- classification: B. 手動確認

### food-1x0ir52

- food.id: `food-1x0ir52`
- name: プテラノドン・フライドチキンバーガーセット
- price: 2300
- area: ジュラシック・パーク
- shop: ディスカバリー・レストラン
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-pteranodon-burger-meal-spring-2025-offercard-h.jpg`
- reason: High Priority の `food-wn7ivo` と同一画像を共有する表示対象。
- recommended action: 現在画像を残す側として妥当か確認する。
- classification: B. 手動確認

### food-yhtmyt

- food.id: `food-yhtmyt`
- name: モササウルス・フィッシュバーガーセット
- price: 2200
- area: ジュラシック・パーク
- shop: ディスカバリー・レストラン
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-mosasaurus-burger-meal-spring-2025-offercard-h.jpg`
- reason: High Priority の `food-9un9k0` と同一画像を共有する表示対象。
- recommended action: 現在画像を残す側として妥当か確認する。
- classification: B. 手動確認

### food-1ojz6jw

- food.id: `food-1ojz6jw`
- name: ボブのワッフルチキンプレート
- price: 2600
- area: サンフランシスコ・エリア
- shop: ハピネス・カフェ
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-phils-chicken-and-waffle-meal-spring-2025-offercard-h.jpg`
- reason: High Priority の `food-sfsu3d` と同一画像を共有する表示対象。
- recommended action: 現在画像を残す側として妥当か確認する。
- classification: B. 手動確認

### food-1435vjy

- food.id: `food-1435vjy`
- name: スチュアートのベーコンチーズ・バーガープレート
- price: 2400
- area: サンフランシスコ・エリア
- shop: ハピネス・カフェ
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-stuarts-big-bacon-and-cheese-burger-meal-spring-2025-offercard-h.jpg`
- reason: High Priority の `food-bcbp5u` と同一画像を共有する表示対象。
- recommended action: 現在画像を残す側として妥当か確認する。
- classification: B. 手動確認

### food-12tnz7b

- food.id: `food-12tnz7b`
- name: ミニオンズ・カップデザート
- price: 600
- area: サンフランシスコ・エリア
- shop: ハピネス・カフェ
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-minions-cup-dessert-offercard-h.jpg`
- reason: High Priority の `food-uqw79q` と同一画像を共有する表示対象。
- recommended action: 現在画像を残す側として妥当か確認する。
- classification: B. 手動確認

## 5. Low Priority

以下は hidden 済み、canonical / hidden 管理済み、または duplicate ID 管理ペアであり、現時点の一覧表示への影響は低い。

### food-jc2lhj

- food.id: `food-jc2lhj`
- name: カレー・キッズセット
- price: 1400
- area: スーパー・ニンテンドー・ワールド
- shop: キノピオ・カフェ
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-kids-curry-meal-spring-2026-offercard-h.jpg`
- reason: `hidden=true`。表示対象は `food-1gtoojv` 側。
- recommended action: 現状維持。
- classification: D. 修正不要

### food-h5dibv

- food.id: `food-h5dibv`
- name: ターキーレッグ!? まん
- price: unknown
- area: ハリウッド・エリア
- shop: ハリウッド・ドリーム・ザ・ライド前フードカート
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-turkey-leg-bun-spring-2026-gallery-a.jpg`
- reason: `hidden=true`。表示対象は `food-19nx8rb` 側。
- recommended action: 現状維持。
- classification: D. 修正不要

### food-14zoddb

- food.id: `food-14zoddb`
- name: キャラメルポップコーン!? チュリトス
- price: 800
- area: ニューヨーク・エリア
- shop: パークサイド・グリル横フードカート
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-caramel-popcorn-churritos-spring-2026-gallery-a.jpg`
- reason: `hidden=true`。表示対象は `food-ymiw07` 側。
- recommended action: 現状維持。
- classification: D. 修正不要

### food-1c6f0vw

- food.id: `food-1c6f0vw`
- name: めざせ大悪党! デイブ・ポップコーンバケツ
- price: unknown
- area: ユニバーサル・ワンダーランド
- shop: ユニバーサル・ワンダーランド入口横ポップコーンカート
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-wannabe-villain-dave-popcorn-bucket-2025-a.jpg`
- reason: `hidden=true`。表示対象は `food-c2z2tz` 側。
- recommended action: 現状維持。
- classification: D. 修正不要

### food-tpy2hd

- food.id: `food-tpy2hd`
- name: ターキーレッグ
- price: unknown
- area: ジュラシック・パーク
- shop: ジュラシック・パーク・ザ・ライド スプラッシュダウン前フードカート
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-turkey-leg-gallery-a.jpg`
- reason: `hidden=true`。表示対象は `food-1n8s9rw` 側。
- recommended action: 現状維持。
- classification: C. UI側で許容

### food-8xwq2b

- food.id: `food-8xwq2b`
- name: 憧れの大悪党? ボブ・ドリンクボトル
- price: unknown
- area: ミニオン・パーク
- shop: 店舗未確認
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-respected-villain-bob-drink-bottle-2025-a.jpg`
- reason: `hidden=true`。表示対象は `food-1kvqau2` 側。
- recommended action: 現状維持。
- classification: C. UI側で許容

### food-1it40z4

- food.id: `food-1it40z4`
- name: スモークチキン
- price: 1300
- area: ジュラシック・パーク
- shop: ジュラシック・パーク ゲート横フードカート
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-smoked-chicken-gallery-a.jpg`
- reason: `hidden=true`。表示対象は `food-1yhw1tx` 側。
- recommended action: 現状維持。
- classification: C. UI側で許容

### food-1jtv1i9

- food.id: `food-1jtv1i9`
- name: ティム・ポップコーンバケツ
- price: unknown
- area: ミニオン・パーク
- shop: セントラルパーク入口横ポップコーンカート
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-tim-popcorn-bucket-v2-gallery-a.jpg`
- reason: `hidden=true`。表示対象は `food-19w9xaa` 側。
- recommended action: 現状維持。
- classification: C. UI側で許容

### food-1xe3vuu

- food.id: `food-1xe3vuu`
- name: ハンバーガー・キッズセット(マリオのピック付)
- price: 1800
- area: スーパー・ニンテンドー・ワールド
- shop: キノピオ・カフェ
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-hamburger-kids-set-with-mario-pick-wood-gallery-a.jpg`
- reason: duplicate override 適用済み。表示対象は `food-1eqmspw` 側。
- recommended action: 現状維持。
- classification: C. UI側で許容

### food-5ib5k3

- food.id: `food-5ib5k3`
- name: パンケーキ・サンド マリオの帽子 ~いちごのショートケーキ~
- price: 950
- area: ハリウッド・エリア
- shop: マリオ・カフェ&ストア
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-mario-cafe-and-store-pancake-sandwich-mario-offercard-h.jpg`
- reason: duplicate override 適用済み。表示対象は `food-nzx6eb` 側。
- recommended action: 現状維持。
- classification: C. UI側で許容

### food-1rsazo8

- food.id: `food-1rsazo8`
- name: ピッツァ・デニッシュセット ~照り焼きチキン~
- price: 1600
- area: アミティ・ビレッジ
- shop: ボードウォーク・スナック
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-pizza-danish-set-teriyaki-chicken-offercard-h.jpg`
- reason: duplicate override 適用済み。表示対象は `food-1ocz8a8` 側。
- recommended action: 現状維持。
- classification: C. UI側で許容

### food-av67nb

- food.id: `food-av67nb`
- name: ミニオン・クッキーサンド バナナアイス&フルーツ
- price: unknown
- area: ミニオン・パーク
- shop: デリシャス・ミー!ザ・クッキー・キッチン
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-easter-minion-cookie-sandwich-bananaice-fruit-2024-offercard-h.jpg`
- reason: `hidden=true`。表示対象は `food-1l7y3bq` 側。
- recommended action: 現状維持。
- classification: C. UI側で許容

### food-1qt6g0q duplicate id pair

- food.id: `food-1qt6g0q`
- name: アンガス・エイジングステーキ
- price: 4500
- area: ニューヨーク・エリア
- shop: パークサイド・グリル
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-aged-angus-steak-offercard-h.jpg`
- reason: canonical=true / hidden=false と canonical=false / hidden=true の管理ペア。
- recommended action: 現状維持。必要なら次回 generated JSON 整理で確認。
- classification: C. UI側で許容

### food-o9svxw duplicate id pair

- food.id: `food-o9svxw`
- name: ベビーフード
- price: unknown
- area: ニューヨーク・エリア
- shop: ルイズN.Y.ピザパーラー
- image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-baby-food-infocard-h.jpg`
- reason: canonical=true / hidden=false と canonical=false / hidden=true の管理ペア。ただし表示対象画像自体は High Priority で手動確認対象。
- recommended action: 重複管理としては現状維持。画像品質は別途確認。
- classification: C. UI側で許容

## 6. 画像差し替え優先リスト

immediate replacement recommended 7件。次フェーズで公式ページ・既存 public 画像候補を確認する。

1. `food-116rf8q` T-REX・バーガーセット
2. `food-e0few1` ラプトル・バーガーセット
3. `food-wn7ivo` プテラノドン・バーガーセット
4. `food-9un9k0` モササウルス・バーガーセット
5. `food-sfsu3d` フィルのワッフルチキンプレート
6. `food-bcbp5u` スチュアートのビッグベーコンチーズ・バーガープレート
7. `food-uqw79q` デザート&ドリンクバーセット

## 7. 手動確認候補

manual confirmation needed 12件。商品として別物か、同一商品の別表記か、画像だけ弱いのかを後で確認する。

1. `food-j4nvrm` 超!! チョコバナナ・チュリトス
2. `food-tgucsr` 虚式「茈」 チュリトス ~ミックスベリー味~
3. `food-o9svxw` ベビーフード
4. `food-12eyica` スペシャルドリンク&コースターセット
5. `food-1gtoojv` カレーライス・キッズセット
6. `food-19tglum` T-REX・ガーリックトマト・ビーフバーガーセット
7. `food-6d5z2w` ラプトル・ベーコン&ビーフバーガーセット
8. `food-1x0ir52` プテラノドン・フライドチキンバーガーセット
9. `food-yhtmyt` モササウルス・フィッシュバーガーセット
10. `food-1ojz6jw` ボブのワッフルチキンプレート
11. `food-1435vjy` スチュアートのベーコンチーズ・バーガープレート
12. `food-12tnz7b` ミニオンズ・カップデザート

## 8. 今回は修正しないもの

- hidden 済み画像ペア
- canonical / hidden 管理済みの重複
- duplicate override 適用済みの3ペア
- duplicate ID の管理ペア
- ended / low / rejected など表示優先度が低いもの
- UI側で許容できるもの

## 9. 次にやるべきこと

1. High Priority 7件の画像差し替え候補収集
2. Medium Priority 9件の手動確認
3. 必要なら existing public image / official source 候補の比較
4. 画像差し替え実装は別タスクで行う
5. その後、広告枠の検討
6. 7月イベント追加フロー整備

## 10. 注意事項

- 今回は画像差し替えしていない。
- generated JSON は変更していない。
- DB / crawler は実行していない。
- 外部画像取得はしていない。
- 実際の差し替えは、公式画像、権利、画質、商品一致を確認してから行う。
