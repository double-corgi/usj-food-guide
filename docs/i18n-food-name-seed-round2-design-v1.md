# 設計: 商品名翻訳 seed 第2弾（B7）

**設計日:** 2026-06-19  
**担当:** Claude（設計担当）  
**前提:** B6（35件）完了済み。food-names.json に 35件のseed が入っている状態から追加する。

---

## 1. 現在の状態確認

### 現在の food-names.json（B6完了後）

- エントリ数: **35件**
- B6 ID一覧（変更禁止）:
  ```
  food-1n8s9rw, food-tpy2hd, food-1yhw1tx, food-1it40z4, food-1dm0ouy, food-up3lba,
  food-1hhn874, food-1rp55v, food-1reufss, food-food-hyfchi, food-1ulknep, food-1qzo3v2,
  food-1wuuuya, food-1l5cizp, food-1b9zmlg, food-3g64cm, food-18a6cxx, food-1e11jee,
  food-7yyri, food-2n4el4, food-1ycla9v, food-exqw6q, food-5o6h85, food-19w9xaa,
  food-1jtv1i9, food-u0o9uo, food-1okbkgf, food-mk9bfv, food-cdxmxs, food-gmrx8l,
  food-xpn4ok, food-1v2f6xx, food-1thjn5k,
  food-manual-バタービールtm-マグカップ付き-ノンアルコール,
  food-manual-バタービールtm-プレミアムマグカップ付き-ノンアルコール
  ```

### B6後の Food Translation Coverage

```
total:        294
translated:   35
missing:      259
verified:     6
needs_review: 29
orphan:       0
```

---

## 2. 未翻訳 food.id の調査

### 調査方法

`scripts/output/foods.generated.json` の `foods` 配列から、`data/translations/food-names.json` にキーが存在しないエントリを抽出した。

- 未翻訳総数: **259件**（foods 配列 294件 - B6 35件）
- ただし foods.generated.json に重複IDが存在する（後述）

### 重要: foods.generated.json の重複 ID

以下の2件が foods 配列に2回ずつ登場する（同一データの重複）。

| food.id | 名前 |
|---|---|
| `food-1qt6g0q` | アンガス・エイジングステーキ |
| `food-o9svxw` | ベビーフード |

この重複は generated JSON 側の問題であり、今回のseedには影響しない。  
ただし coverage script の `translated` カウントは各 ID の出現回数分加算されるため、  
この2件を seed に含める場合は coverage 計算に反映が必要（後述）。

---

## 3. B7 seed 対象の選定方針

### 優先基準

1. **status: active** — 現在販売中の商品のみ
2. **isLimited: false** — 常設商品（期間限定品は今回除外）
3. **areaId が実エリア** — `area-review-pending` は対象外
4. **翻訳しやすい名前** — 汎用食品名・ダイナソー名・IP主要キャラクターの料理名
5. **B6 未対応ジャンルを補完** — Jurassic Park バーガー、Mario エリアドリンク、Minion キャラクター料理、HP区エリア

### 今回対象外にするもの

- `isLimited: true`（期間限定・コラボ）
- `status: ended`（販売終了）
- 長すぎて翻訳品質が担保できない名前
- 呪術廻戦・SPY×FAMILY・ワンピース・進撃の巨人等のアニメIPコラボ（公式英語名判断困難）
- `area-review-pending`（エリア未確定）

---

## 4. B7 seed 対象 40件

### 4-1. Tier A: 汎用食品（翻訳品質が確保しやすい）

| # | food.id | 日本語名 | カテゴリ |
|---|---|---|---|
| 1 | `food-bsvsuj` | チャイニーズ・ポークリブ | chicken |
| 2 | `food-84qjxm` | ブラックペッパー・ポークリブ | chicken |
| 3 | `food-it27lt` | マッシュルームスープ | snack |
| 4 | `food-1tt1au7` | アメリカン・ホットドッグ | snack |
| 5 | `food-5blx24` | ホットドッグ&ドリンクセット | drink |
| 6 | `food-26b5s0` | ホットドッグ&ドリンクセット | drink |
| 7 | `food-4n0ipg` | キッズ・サンドウィッチセット | kids |
| 8 | `food-450hi7` | キッズ・サンドウィッチセット | kids |
| 9 | `food-14hntqo` | アメリカン・アップルクランブルパイ | dessert |
| 10 | `food-14ut653` | ミートスパゲティセット | noodle |
| 11 | `food-o9svxw` | ベビーフード | chicken |
| 12 | `food-uqw79q` | デザート&ドリンクバーセット | dessert |
| 13 | `food-rbn0yu` | デザート&ドリンクバーセット | dessert |
| 14 | `food-v999yl` | フルーティ・カクテル | drink |
| 15 | `food-488njs` | 骨付きフライドチキンセット | chicken |
| 16 | `food-112pvaq` | シーフード・ペペロンチーノ | noodle |
| 17 | `food-1qt6g0q` | アンガス・エイジングステーキ | chicken |

### 4-2. Tier B: ハリーポッターエリア（Butterbeer™ / Hogwarts）

| # | food.id | 日本語名 | カテゴリ |
|---|---|---|---|
| 18 | `food-16q65hw` | バタービールTM・プディング | dessert |
| 19 | `food-1m8i41b` | バタービールTM・シュークリーム | dessert |
| 20 | `food-2qri4c` | ロティサリー・スモークチキン&シェパーズパイ | chicken |
| 21 | `food-1jjli1u` | ハリーポッターのホグワーツチュリトス | churro |

### 4-3. Tier C: Jurassic Park エリア（恐竜名バーガー）

| # | food.id | 日本語名 | カテゴリ |
|---|---|---|---|
| 22 | `food-116rf8q` | T-REX・バーガーセット | burger |
| 23 | `food-e0few1` | ラプトル・バーガーセット | burger |
| 24 | `food-wn7ivo` | プテラノドン・バーガーセット | burger |
| 25 | `food-9un9k0` | モササウルス・バーガーセット | burger |
| 26 | `food-9s2577` | ジュラシックパーク・ケーキ ~チョコ&ダークチェリー~ | dessert |
| 27 | `food-15hqyi6` | フライングダイナソー・カップケーキ ~チョコ&ラズベリー~ | dessert |
| 28 | `food-alnomv` | ジュラシック・パーク・ドリンクボトル | drink |

### 4-4. Tier D: スーパー・ニンテンドー・ワールド（Mario エリアドリンク）

| # | food.id | 日本語名 | カテゴリ |
|---|---|---|---|
| 29 | `food-19z617n` | パワーアップ! マリオのストロベリーソーダ | drink |
| 30 | `food-804x7o` | パワーアップ! ルイージのマスカットソーダ | drink |
| 31 | `food-1lvypnn` | パワーアップ! ピーチ姫のピーチソーダ | drink |
| 32 | `food-fcx2hy` | スーパーキノコ・ドリンクボトル | drink |
| 33 | `food-6dk3cs` | ファイアフラワー×ハテナブロック・ドリンクボトル | drink |

### 4-5. Tier E: Minion エリア（キャラクター料理）

| # | food.id | 日本語名 | カテゴリ |
|---|---|---|---|
| 34 | `food-1ojz6jw` | ボブのワッフルチキンプレート | dessert |
| 35 | `food-sfsu3d` | フィルのワッフルチキンプレート | dessert |
| 36 | `food-1435vjy` | スチュアートのベーコンチーズ・バーガープレート | burger |
| 37 | `food-bcbp5u` | スチュアートのビッグベーコンチーズ・バーガープレート | burger |
| 38 | `food-1fcbolg` | デイブのキーマカレープレート | rice |
| 39 | `food-1rqbb9j` | ミニオン・クッキーサンド バナナアイス&フルーツ | dessert |
| 40 | `food-7nyguw` | ミニオン・クッキーサンド ストロベリーレアチーズ | dessert |

---

## 5. B6 との重複チェック

全 40件について、B6 の 35件 ID との重複を Python で確認済み。

```
Overlap with B6: []
```

**重複 0件 ✅**

---

## 6. 翻訳品質ルール

### 6-1. 表記ルール（B6 継承）

| 記号 | en / ko | zh-TW |
|---|---|---|
| 波線 | `~`（半角） | `～`（全角） |
| アンパサンド | `&`（半角） | `＆`（全角） |
| 括弧 | `()`（半角） | `（）`（全角） |
| 乗算記号 | `×`（U+00D7） | `×`（同） |
| 感嘆符 | `!`（半角） | `!`（半角） |
| 商標 | `™`（そのまま保持） | `™`（そのまま保持） |

### 6-2. 固有名詞・IP名の扱い

| 名称 | en | ko | zh-TW |
|---|---|---|---|
| ハリーポッター | Harry Potter | 해리 포터 | 哈利波特 |
| ホグワーツ | Hogwarts | 호그와트 | 霍格華茲 |
| バタービールTM | Butterbeer™ | 버터맥주™ | 奶油啤酒™ |
| T-REX | T-Rex | T-렉스 | T-Rex |
| ラプトル | Raptor | 랩터 | 迅猛龍 |
| プテラノドン | Pteranodon | 프테라노돈 | 翼龍 |
| モササウルス | Mosasaurus | 모사사우루스 | 滄龍 |
| ジュラシック・パーク | Jurassic Park | 쥬라기 공원 | 侏羅紀公園 |
| フライングダイナソー | Flying Dinosaur | 플라잉 다이나소어 | 飛翔恐龍 |
| マリオ | Mario | 마리오 | 瑪利歐 |
| ルイージ | Luigi | 루이지 | 路易吉 |
| ピーチ姫 | Princess Peach | 피치 공주 | 碧姬公主 |
| スーパーキノコ | Super Mushroom | 슈퍼 버섯 | 超級蘑菇 |
| ファイアフラワー | Fire Flower | 파이어 플라워 | 火焰花 |
| ハテナブロック | Question Block | 물음표 블록 | 問號磚塊 |
| ボブ（ミニオン） | Bob | 밥 | 鮑伯 |
| フィル（ミニオン） | Phil | 필 | 菲爾 |
| スチュアート（ミニオン） | Stuart | 스튜어트 | 史都華 |
| デイブ（ミニオン） | Dave | 데이브 | 大衛 |

### 6-3. 食材・料理名の扱い

| 日本語 | en | ko | zh-TW |
|---|---|---|---|
| ポークリブ | Pork Ribs | 폭립 | 豬肋排 |
| チキン | Chicken | 치킨 | 炸雞（フライド）/ 雞肉（一般） |
| ホットドッグ | Hot Dog | 핫도그 | 熱狗 |
| スパゲティ | Spaghetti | 스파게티 | 義大利麵 |
| ペペロンチーノ | Peperoncino | 페페론치노 | 義式辣椒麵 |
| シュークリーム | Cream Puff | 슈크림 | 泡芙 |
| プディング | Pudding | 푸딩 | 布丁 |
| キーマカレー | Keema Curry | 키마 카레 | 碎肉咖哩 |
| ワッフルチキン | Waffle Chicken | 와플 치킨 | 鬆餅炸雞 |
| レアチーズ | Rare Cheesecake | 레어치즈 | 生乳酪 |
| クッキーサンド | Cookie Sandwich | 쿠키 샌드 | 餅乾三明治 |
| セット | Set | 세트 | 套餐 |
| プレート | Plate | 플레이트 | 拼盤 |
| ボトル | Bottle | 보틀 | 飲料瓶 |

### 6-4. _source / _status 分類

| 分類条件 | _source | _status |
|---|---|---|
| USJ公式多言語サイトで確認 | `official` | `verified` |
| 公式名が確認できない推定翻訳 | `provisional` | `needs_review` |

**B7 全 40件はすべて `provisional` / `needs_review`。**  
（公式多言語ページで翻訳を直接確認できなかったため）

---

## 7. 翻訳対象 40件の翻訳一覧

### Tier A: 汎用食品

| food.id | en | ko | zh-TW |
|---|---|---|---|
| food-bsvsuj | Chinese Pork Ribs | 차이니즈 폭립 | 中式豬肋排 |
| food-84qjxm | Black Pepper Pork Ribs | 블랙페퍼 폭립 | 黑胡椒豬肋排 |
| food-it27lt | Mushroom Soup | 머쉬룸 수프 | 蘑菇湯 |
| food-1tt1au7 | American Hot Dog | 아메리칸 핫도그 | 美式熱狗 |
| food-5blx24 | Hot Dog & Drink Set | 핫도그 & 드링크 세트 | 熱狗＆飲料套餐 |
| food-26b5s0 | Hot Dog & Drink Set | 핫도그 & 드링크 세트 | 熱狗＆飲料套餐 |
| food-4n0ipg | Kids Sandwich Set | 키즈 샌드위치 세트 | 兒童三明治套餐 |
| food-450hi7 | Kids Sandwich Set | 키즈 샌드위치 세트 | 兒童三明治套餐 |
| food-14hntqo | American Apple Crumble Pie | 아메리칸 애플 크럼블 파이 | 美式蘋果酥粒派 |
| food-14ut653 | Meat Spaghetti Set | 미트 스파게티 세트 | 肉醬義大利麵套餐 |
| food-o9svxw | Baby Food | 베이비 푸드 | 嬰兒食品 |
| food-uqw79q | Dessert & Drink Bar Set | 디저트 & 드링크 바 세트 | 甜點＆飲料吧套餐 |
| food-rbn0yu | Dessert & Drink Bar Set | 디저트 & 드링크 바 세트 | 甜點＆飲料吧套餐 |
| food-v999yl | Fruity Cocktail | 프루티 칵테일 | 果味雞尾酒 |
| food-488njs | Fried Chicken (Bone-In) Set | 뼈있는 프라이드치킨 세트 | 帶骨炸雞套餐 |
| food-112pvaq | Seafood Peperoncino | 해산물 페페론치노 | 義式辣椒海鮮麵 |
| food-1qt6g0q | Angus Aged Steak | 앙거스 에이징 스테이크 | 安格斯熟成牛排 |

### Tier B: ハリーポッターエリア

| food.id | en | ko | zh-TW |
|---|---|---|---|
| food-16q65hw | Butterbeer™ Pudding | 버터맥주™ 푸딩 | 奶油啤酒™布丁 |
| food-1m8i41b | Butterbeer™ Cream Puff | 버터맥주™ 슈크림 | 奶油啤酒™泡芙 |
| food-2qri4c | Rotisserie Smoked Chicken & Shepherd's Pie | 로티사리 훈제 치킨 & 셰퍼드 파이 | 烤轉爐煙熏雞＆牧羊人派 |
| food-1jjli1u | Harry Potter's Hogwarts Churro | 해리 포터의 호그와트 추리토스 | 哈利波特的霍格華茲吉拿棒 |

### Tier C: Jurassic Park エリア

| food.id | en | ko | zh-TW |
|---|---|---|---|
| food-116rf8q | T-Rex Burger Set | T-렉스 버거 세트 | T-Rex漢堡套餐 |
| food-e0few1 | Raptor Burger Set | 랩터 버거 세트 | 迅猛龍漢堡套餐 |
| food-wn7ivo | Pteranodon Burger Set | 프테라노돈 버거 세트 | 翼龍漢堡套餐 |
| food-9un9k0 | Mosasaurus Burger Set | 모사사우루스 버거 세트 | 滄龍漢堡套餐 |
| food-9s2577 | Jurassic Park Cake ~Chocolate & Dark Cherry~ | 쥬라기 공원 케이크 ~초콜릿 & 다크체리~ | 侏羅紀公園蛋糕 ～巧克力＆黑櫻桃～ |
| food-15hqyi6 | Flying Dinosaur Cupcake ~Chocolate & Raspberry~ | 플라잉 다이나소어 컵케이크 ~초콜릿 & 라즈베리~ | 飛翔恐龍紙杯蛋糕 ～巧克力＆覆盆莓～ |
| food-alnomv | Jurassic Park Drink Bottle | 쥬라기 공원 드링크 보틀 | 侏羅紀公園飲料瓶 |

### Tier D: スーパー・ニンテンドー・ワールド

| food.id | en | ko | zh-TW |
|---|---|---|---|
| food-19z617n | Power Up! Mario's Strawberry Soda | 파워 업! 마리오의 딸기 소다 | Power Up! 瑪利歐草莓汽水 |
| food-804x7o | Power Up! Luigi's Muscat Soda | 파워 업! 루이지의 머스캣 소다 | Power Up! 路易吉麝香葡萄汽水 |
| food-1lvypnn | Power Up! Princess Peach's Peach Soda | 파워 업! 피치 공주의 복숭아 소다 | Power Up! 碧姬公主水蜜桃汽水 |
| food-fcx2hy | Super Mushroom Drink Bottle | 슈퍼 버섯 드링크 보틀 | 超級蘑菇飲料瓶 |
| food-6dk3cs | Fire Flower × Question Block Drink Bottle | 파이어 플라워 × 물음표 블록 드링크 보틀 | 火焰花×問號磚塊飲料瓶 |

### Tier E: Minion エリア

| food.id | en | ko | zh-TW |
|---|---|---|---|
| food-1ojz6jw | Bob's Waffle Chicken Plate | 밥의 와플 치킨 플레이트 | 鮑伯鬆餅炸雞拼盤 |
| food-sfsu3d | Phil's Waffle Chicken Plate | 필의 와플 치킨 플레이트 | 菲爾鬆餅炸雞拼盤 |
| food-1435vjy | Stuart's Bacon Cheese Burger Plate | 스튜어트의 베이컨 치즈 버거 플레이트 | 史都華培根芝士漢堡拼盤 |
| food-bcbp5u | Stuart's Big Bacon Cheese Burger Plate | 스튜어트의 빅 베이컨 치즈 버거 플레이트 | 史都華大培根芝士漢堡拼盤 |
| food-1fcbolg | Dave's Keema Curry Plate | 데이브의 키마 카레 플레이트 | 大衛碎肉咖哩拼盤 |
| food-1rqbb9j | Minion Cookie Sandwich Banana Ice Cream & Fruits | 미니언 쿠키 샌드 바나나 아이스크림 & 과일 | 小小兵餅乾三明治 香蕉冰淇淋＆水果 |
| food-7nyguw | Minion Cookie Sandwich Strawberry Rare Cheesecake | 미니언 쿠키 샌드 딸기 레어치즈 | 小小兵餅乾三明治 草莓生乳酪 |

---

## 8. B7 追加後の期待 coverage

### 重要補足: 重複 ID の影響

`food-1qt6g0q`（アンガス・エイジングステーキ）と `food-o9svxw`（ベビーフード）は  
`foods.generated.json` の `foods` 配列に **それぞれ2回ずつ** 登場する。

`check-translation-coverage.ts` の `countCoverage` は配列を forEach でなめるため、  
この2件が翻訳済みになると `translated` カウントに各2 → 計4の追加が発生する。

計算:
- 40件中 38件が配列に1回 → +38 translated
- 2件（food-1qt6g0q / food-o9svxw）が配列に2回ずつ → +4 translated
- 合計: +42 translated

### 期待 coverage

```
=== Food Translation Coverage ===
total:        294
translated:   77
missing:      217
verified:     6
needs_review: 69
orphan:       0
```

### Store Translation Coverage（変化なし）

B7 では `data/translations/store-names.json` を変更しないため、Store Coverage は B6後と同一。

```
=== Store Translation Coverage ===
generated_total:    42
translated:         42
missing:            0
display_total:      99
display_translated: 52
display_missing:    47
display_seed:       14
verified:           23
needs_review:       33
orphan:             0
```

---

## 9. 変更しないもの

| 対象 | 理由 |
|---|---|
| B6 既存 35件の翻訳値 | 変更禁止。orphan チェックが通過しているため |
| `data/translations/store-names.json` | 変更禁止 |
| `scripts/output/foods.generated.json` | generated JSON — 変更禁止 |
| `lib/i18n/name-translations.ts` | 変更禁止 |
| `scripts/check-translation-coverage.ts` | 変更禁止 |
| components / app / lib / DB | 変更禁止 |
| food.id | 変更禁止 |

---

## 10. Stop and Ask 条件

- B6 既存 35件 ID とキーが衝突した場合
- orphan が 0 以外になった場合
- Store Coverage の値が1つでも変化した場合
- 商品名の翻訳品質に自信がない場合は `needs_review` のままにし、`verified` にしない
- coverage の `translated` が 77 以外になった場合（重複 ID を含めた計算が変わった可能性）
- food-names.json のエントリ合計が 75件（35 + 40）以外になった場合
- `git diff` に `data/translations/food-names.json` 以外のファイルが含まれた場合
- `npm run coverage` が失敗した場合（スクリプトエラー・コンパイルエラー含む）
