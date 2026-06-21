# food-116rf8q Image Candidate Research v1

## 1. 調査概要

food-116rf8q「T-REX・バーガーセット」について、公式 sourceUrl、既存 generated JSON、既存 public 画像、過去の画像品質レビューdocsを確認した。

今回は調査のみで、以下は行っていない。

- generated JSON変更なし
- scripts/output変更なし
- public画像変更なし
- public画像追加なし
- 画像ダウンロードなし
- crawler実行なし
- DB変更なし
- app/components変更なし
- data/translations変更なし

## 2. 対象food

- food.id: `food-116rf8q`
- name: `T-REX・バーガーセット`
- price: `3500`
- area: `ジュラシック・パーク`
- shop: `ディスカバリー・レストラン`
- sourceUrl: `https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/discovery-restaurant/index.html`
- current image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-t-rex-burger-meal-spring-2025-offercard-h.jpg`
- status: `active`
- displayQuality: `medium`
- reviewStatus: `approved`
- canonical / hidden: `canonicalFood=true`, `hidden=false`
- category: `burger`

関連する表示対象として、`food-19tglum`「T-REX・ガーリックトマト・ビーフバーガーセット」も同じ画像を使用している。

## 3. 現在画像の問題

現在画像は公式USJ由来の offer card 画像で、画像自体は壊れていない。ただし、以下の理由で画像品質改善候補として残す。

- `food-116rf8q` と `food-19tglum` が同じ画像を共有している
- 両方とも `canonicalFood=true` / `hidden=false` の表示対象であり、一覧上で別商品に同じ写真が並ぶ可能性がある
- `food-116rf8q` は `displayQuality=medium` で、単体商品としてより識別しやすい画像があれば差し替えたい
- 公式ページ上でも `T-REX・バーガーセット` alt の画像が、関連する `T-REX・ガーリックトマト・ビーフバーガーセット` ブロックにも使われている

同一画像の使い回しが主な懸念であり、商品名と完全に無関係な画像ではない。

## 4. 既存ローカル候補画像

- candidate found: NO
- path: なし
- suitability: なし
- note:
  - `public/manual-images` 配下に food-116rf8q 用の候補画像は見つからなかった
  - `public/generated/official-menu/restaurant-map/discovery-steak-plate.jpg` はディスカバリー・レストラン関連だが、T-REX・バーガーセットの商品画像ではない
  - `public/generated/official-menu/restaurant-map/snoopy-big-burger-set.jpg` と `public/generated/official-menu/kinopio-cafe/mario-bacon-cheeseburger.png` は別店舗・別商品の画像であり不適
  - 現時点で、既存 public 画像だけを使った安全な差し替えはできない

## 5. 公式sourceUrl画像候補

### Candidate 1

- image URL: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-t-rex-burger-meal-spring-2025-offercard-h.jpg`
- image source: 公式USJ `discovery-restaurant/index.html`
- image type: offer card image
- suitability: 中
- can use: 既に使用中
- note:
  - `T-REX・バーガーセット` の alt を持つ公式画像
  - 現在の `food-116rf8q` の画像と同一
  - 差し替え候補ではなく、現状維持用の画像

### Candidate 2

- image URL: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-discovery-restaurant-a.jpg`
- image source: 公式USJ `discovery-restaurant/index.html`
- image type: restaurant / facility image
- suitability: 低
- can use: NO
- note:
  - レストラン全体または施設紹介系の画像であり、商品単体画像ではない

### Candidate 3

- image URL: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-discovery-restaurant-b.jpg`
- image source: 公式USJ `discovery-restaurant/index.html`
- image type: restaurant / facility image
- suitability: 低
- can use: NO
- note:
  - 商品画像ではないため、food-116rf8q の差し替えには不適

### Candidate 4

- image URL: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-discovery-restaurant-c.jpg`
- image source: 公式USJ `discovery-restaurant/index.html`
- image type: restaurant / article image
- suitability: 低
- can use: NO
- note:
  - 公式ページ内の説明・施設系画像であり、T-REX・バーガーセット単体画像としては使いにくい

### Other page images

公式ページには、ラプトル、プテラノドン、モササウルス、トリケラトプスなど別商品の offer card 画像も含まれている。これらは商品名が異なるため、food-116rf8q の差し替え候補にはしない。

## 6. 差し替え判断

- can replace now: NO
- recommended candidate: なし
- reason:
  - 公式 sourceUrl から確認できた food-116rf8q 対応画像は現在使用中の offer card のみ
  - 既存 public 配下に T-REX・バーガーセット単体として使えるローカル画像がない
  - 施設画像や別バーガー画像への差し替えは、商品一致性を下げるため不適
- missing fields:
  - 現行 offer card とは別の、公式USJ由来の商品単体画像
  - その画像のローカル実体または取得許可付きURL
- confidence: 中

## 7. 次の作業

B. can replace now: NO

- food-116rf8q は watch継続
- 画像差し替えはまだしない
- 公式USJ由来の別画像候補が見つかった時点で、画像取得・目視比較を別タスクにする
- 現時点で generated JSON の `imageUrl` を変更しない
- 次に画像品質改善を進めるなら、food-116rf8q ではなく、既存候補画像がある別商品を優先する判断もあり

次フェーズで実装する場合は、まず「公式USJ由来の別候補画像を1件だけ取得して /tmp 比較、採用可否を確認する」調査タスクに分ける。
