# Food Image Replacement Candidate Review v1

## 調査概要

`docs/food-image-quality-review-v1.md` で high priority / immediate replacement recommended とした7件について、既存データ内で画像差し替え候補を探せるか確認した。

今回の調査では、外部画像取得、crawler実行、DB操作、画像差し替えは行っていない。`scripts/output/foods.generated.json`、既存の `public` 配下画像、sourceUrl情報、既存の候補データだけを読み取り、差し替え候補の有無を分類した。

## Summary

- target count: 7
- existing candidate available: 1
- official/sourceUrl confirmation needed: 6
- no action / priority down: 0
- duplicate/data check needed: 6

## 既存候補あり

### food-uqw79q

- food.id: `food-uqw79q`
- name: デザート&ドリンクバーセット
- current image: `usj-gds-food-minions-cup-dessert-offercard-h.jpg`
- problem: 同じ画像が別商品にも使われ、offer card / 文字入り画像として見える
- candidate source: `scripts/output/latest-foods.json`
- candidate images:
  - `usj-gds-minion-dessert-and-drink-bar-set-gallery-a.jpg`
  - `usj-gds-minion-dessert-and-drink-bar-set-gallery-b.jpg`
- classification: A. 既存画像から差し替え候補あり
- recommended action: 次フェーズで `gallery-a` / `gallery-b` を見比べ、商品全体が分かる方を採用候補にする
- priority: Highest among 7

## 既存候補なし / sourceUrl確認必要

### food-116rf8q

- food.id: `food-116rf8q`
- name: T-REX・バーガーセット
- current image: `usj-gds-food-t-rex-burger-meal-spring-2025-offercard-h.jpg`
- problem: 同一画像を使う別ID商品があり、表示対象同士で画像が重複している。対象画像は offer card 系で、商品単体が主役に見えにくい可能性がある
- sourceUrl: `https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/discovery-restaurant/index.html`
- candidate images found: なし
- classification: B. 既存画像では候補なし。公式/sourceUrl確認が必要
- recommended action: 保留。外部確認タスクへ回す

### food-e0few1

- food.id: `food-e0few1`
- name: ラプトル・バーガーセット
- current image: `usj-gds-food-raptor-burger-meal-spring-2025-offercard-h.jpg`
- problem: 同一画像を使う別ID商品があり、表示対象同士で画像が重複している。対象画像は offer card 系で、商品単体が主役に見えにくい可能性がある
- sourceUrl: `https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/discovery-restaurant/index.html`
- candidate images found: なし
- classification: B. 既存画像では候補なし。公式/sourceUrl確認が必要
- recommended action: 保留。外部確認タスクへ回す

### food-wn7ivo

- food.id: `food-wn7ivo`
- name: プテラノドン・バーガーセット
- current image: `usj-gds-food-pteranodon-burger-meal-spring-2025-offercard-h.jpg`
- problem: 同一画像を使う別ID商品があり、表示対象同士で画像が重複している。対象画像は offer card 系で、商品単体が主役に見えにくい可能性がある
- sourceUrl: `https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/discovery-restaurant/index.html`
- candidate images found: なし
- classification: B. 既存画像では候補なし。公式/sourceUrl確認が必要
- recommended action: 保留。外部確認タスクへ回す

### food-9un9k0

- food.id: `food-9un9k0`
- name: モササウルス・バーガーセット
- current image: `usj-gds-food-mosasaurus-burger-meal-spring-2025-offercard-h.jpg`
- problem: 同一画像を使う別ID商品があり、表示対象同士で画像が重複している。対象画像は offer card 系で、商品単体が主役に見えにくい可能性がある
- sourceUrl: `https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/discovery-restaurant/index.html`
- candidate images found: なし
- classification: B. 既存画像では候補なし。公式/sourceUrl確認が必要
- recommended action: 保留。外部確認タスクへ回す

### food-sfsu3d

- food.id: `food-sfsu3d`
- name: フィルのワッフルチキンプレート
- current image: `usj-gds-food-phils-chicken-and-waffle-meal-spring-2025-offercard-h.jpg`
- problem: 同一画像を使う別ID商品があり、表示対象同士で画像が重複している。対象画像は offer card 系で、商品単体が主役に見えにくい可能性がある
- sourceUrl: `https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/happiness-cafe/index.html`
- candidate images found: なし
- classification: B. 既存画像では候補なし。公式/sourceUrl確認が必要
- recommended action: 保留。外部確認タスクへ回す

### food-bcbp5u

- food.id: `food-bcbp5u`
- name: スチュアートのビッグベーコンチーズ・バーガープレート
- current image: `usj-gds-food-stuarts-big-bacon-and-cheese-burger-meal-spring-2025-offercard-h.jpg`
- problem: 同一画像を使う別ID商品があり、表示対象同士で画像が重複している。対象画像は offer card 系で、商品単体が主役に見えにくい可能性がある
- sourceUrl: `https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/happiness-cafe/index.html`
- candidate images found: なし
- classification: B. 既存画像では候補なし。公式/sourceUrl確認が必要
- recommended action: 保留。外部確認タスクへ回す

## 今回は差し替えしないもの

- `food-uqw79q` もまだ差し替えない
- 残り6件も差し替えない
- `scripts/output/foods.generated.json` は変更しない
- `public` 配下の画像は変更しない
- 外部画像取得、crawler、DB操作は行わない

## 次にやるべきこと

1. `food-uqw79q` のみ、既存候補画像から差し替えを検討する
2. 残り6件は公式/sourceUrl確認タスクへ回す
3. 差し替えは別タスクで行う
4. 画像差し替え後に `/foods`、Home rail、detail 表示を確認する
