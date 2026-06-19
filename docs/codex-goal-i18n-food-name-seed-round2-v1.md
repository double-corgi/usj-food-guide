# Codex Goal: 商品名翻訳 seed 第2弾（B7）

## ゴール

`data/translations/food-names.json` に 40件の翻訳エントリを追加する。

---

## 前提・制約

- **変更するファイルは `data/translations/food-names.json` の 1ファイルのみ**
- `data/translations/store-names.json` は変更しない
- `scripts/output/foods.generated.json` は変更しない
- `lib/i18n/name-translations.ts` は変更しない
- `scripts/check-translation-coverage.ts` は変更しない
- component / app / lib / DB は変更しない
- B6 既存 35件のエントリ（キー・値とも）は変更しない
- 商品名を独自解釈で翻訳しない（設計書に記載した翻訳値をそのまま使う）

---

## 変更対象ファイル

```
data/translations/food-names.json
```

---

## 追加する 40件

以下の JSON オブジェクトを `food-names.json` の既存エントリに**追記**する。

追加する各エントリの構造は B6 既存エントリと同一:

```json
"<food.id>": {
  "en": "...",
  "ko": "...",
  "zh-TW": "...",
  "_source": "provisional",
  "_status": "needs_review"
}
```

---

### 追加エントリ（全 40件）

```json
"food-bsvsuj": {
  "en": "Chinese Pork Ribs",
  "ko": "차이니즈 폭립",
  "zh-TW": "中式豬肋排",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-84qjxm": {
  "en": "Black Pepper Pork Ribs",
  "ko": "블랙페퍼 폭립",
  "zh-TW": "黑胡椒豬肋排",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-it27lt": {
  "en": "Mushroom Soup",
  "ko": "머쉬룸 수프",
  "zh-TW": "蘑菇湯",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-1tt1au7": {
  "en": "American Hot Dog",
  "ko": "아메리칸 핫도그",
  "zh-TW": "美式熱狗",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-5blx24": {
  "en": "Hot Dog & Drink Set",
  "ko": "핫도그 & 드링크 세트",
  "zh-TW": "熱狗＆飲料套餐",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-26b5s0": {
  "en": "Hot Dog & Drink Set",
  "ko": "핫도그 & 드링크 세트",
  "zh-TW": "熱狗＆飲料套餐",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-4n0ipg": {
  "en": "Kids Sandwich Set",
  "ko": "키즈 샌드위치 세트",
  "zh-TW": "兒童三明治套餐",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-450hi7": {
  "en": "Kids Sandwich Set",
  "ko": "키즈 샌드위치 세트",
  "zh-TW": "兒童三明治套餐",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-14hntqo": {
  "en": "American Apple Crumble Pie",
  "ko": "아메리칸 애플 크럼블 파이",
  "zh-TW": "美式蘋果酥粒派",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-14ut653": {
  "en": "Meat Spaghetti Set",
  "ko": "미트 스파게티 세트",
  "zh-TW": "肉醬義大利麵套餐",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-o9svxw": {
  "en": "Baby Food",
  "ko": "베이비 푸드",
  "zh-TW": "嬰兒食品",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-uqw79q": {
  "en": "Dessert & Drink Bar Set",
  "ko": "디저트 & 드링크 바 세트",
  "zh-TW": "甜點＆飲料吧套餐",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-rbn0yu": {
  "en": "Dessert & Drink Bar Set",
  "ko": "디저트 & 드링크 바 세트",
  "zh-TW": "甜點＆飲料吧套餐",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-v999yl": {
  "en": "Fruity Cocktail",
  "ko": "프루티 칵테일",
  "zh-TW": "果味雞尾酒",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-488njs": {
  "en": "Fried Chicken (Bone-In) Set",
  "ko": "뼈있는 프라이드치킨 세트",
  "zh-TW": "帶骨炸雞套餐",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-112pvaq": {
  "en": "Seafood Peperoncino",
  "ko": "해산물 페페론치노",
  "zh-TW": "義式辣椒海鮮麵",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-1qt6g0q": {
  "en": "Angus Aged Steak",
  "ko": "앙거스 에이징 스테이크",
  "zh-TW": "安格斯熟成牛排",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-16q65hw": {
  "en": "Butterbeer™ Pudding",
  "ko": "버터맥주™ 푸딩",
  "zh-TW": "奶油啤酒™布丁",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-1m8i41b": {
  "en": "Butterbeer™ Cream Puff",
  "ko": "버터맥주™ 슈크림",
  "zh-TW": "奶油啤酒™泡芙",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-2qri4c": {
  "en": "Rotisserie Smoked Chicken & Shepherd's Pie",
  "ko": "로티사리 훈제 치킨 & 셰퍼드 파이",
  "zh-TW": "烤轉爐煙熏雞＆牧羊人派",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-1jjli1u": {
  "en": "Harry Potter's Hogwarts Churro",
  "ko": "해리 포터의 호그와트 추리토스",
  "zh-TW": "哈利波特的霍格華茲吉拿棒",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-116rf8q": {
  "en": "T-Rex Burger Set",
  "ko": "T-렉스 버거 세트",
  "zh-TW": "T-Rex漢堡套餐",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-e0few1": {
  "en": "Raptor Burger Set",
  "ko": "랩터 버거 세트",
  "zh-TW": "迅猛龍漢堡套餐",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-wn7ivo": {
  "en": "Pteranodon Burger Set",
  "ko": "프테라노돈 버거 세트",
  "zh-TW": "翼龍漢堡套餐",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-9un9k0": {
  "en": "Mosasaurus Burger Set",
  "ko": "모사사우루스 버거 세트",
  "zh-TW": "滄龍漢堡套餐",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-9s2577": {
  "en": "Jurassic Park Cake ~Chocolate & Dark Cherry~",
  "ko": "쥬라기 공원 케이크 ~초콜릿 & 다크체리~",
  "zh-TW": "侏羅紀公園蛋糕 ～巧克力＆黑櫻桃～",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-15hqyi6": {
  "en": "Flying Dinosaur Cupcake ~Chocolate & Raspberry~",
  "ko": "플라잉 다이나소어 컵케이크 ~초콜릿 & 라즈베리~",
  "zh-TW": "飛翔恐龍紙杯蛋糕 ～巧克力＆覆盆莓～",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-alnomv": {
  "en": "Jurassic Park Drink Bottle",
  "ko": "쥬라기 공원 드링크 보틀",
  "zh-TW": "侏羅紀公園飲料瓶",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-19z617n": {
  "en": "Power Up! Mario's Strawberry Soda",
  "ko": "파워 업! 마리오의 딸기 소다",
  "zh-TW": "Power Up! 瑪利歐草莓汽水",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-804x7o": {
  "en": "Power Up! Luigi's Muscat Soda",
  "ko": "파워 업! 루이지의 머스캣 소다",
  "zh-TW": "Power Up! 路易吉麝香葡萄汽水",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-1lvypnn": {
  "en": "Power Up! Princess Peach's Peach Soda",
  "ko": "파워 업! 피치 공주의 복숭아 소다",
  "zh-TW": "Power Up! 碧姬公主水蜜桃汽水",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-fcx2hy": {
  "en": "Super Mushroom Drink Bottle",
  "ko": "슈퍼 버섯 드링크 보틀",
  "zh-TW": "超級蘑菇飲料瓶",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-6dk3cs": {
  "en": "Fire Flower × Question Block Drink Bottle",
  "ko": "파이어 플라워 × 물음표 블록 드링크 보틀",
  "zh-TW": "火焰花×問號磚塊飲料瓶",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-1ojz6jw": {
  "en": "Bob's Waffle Chicken Plate",
  "ko": "밥의 와플 치킨 플레이트",
  "zh-TW": "鮑伯鬆餅炸雞拼盤",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-sfsu3d": {
  "en": "Phil's Waffle Chicken Plate",
  "ko": "필의 와플 치킨 플레이트",
  "zh-TW": "菲爾鬆餅炸雞拼盤",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-1435vjy": {
  "en": "Stuart's Bacon Cheese Burger Plate",
  "ko": "스튜어트의 베이컨 치즈 버거 플레이트",
  "zh-TW": "史都華培根芝士漢堡拼盤",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-bcbp5u": {
  "en": "Stuart's Big Bacon Cheese Burger Plate",
  "ko": "스튜어트의 빅 베이컨 치즈 버거 플레이트",
  "zh-TW": "史都華大培根芝士漢堡拼盤",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-1fcbolg": {
  "en": "Dave's Keema Curry Plate",
  "ko": "데이브의 키마 카레 플레이트",
  "zh-TW": "大衛碎肉咖哩拼盤",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-1rqbb9j": {
  "en": "Minion Cookie Sandwich Banana Ice Cream & Fruits",
  "ko": "미니언 쿠키 샌드 바나나 아이스크림 & 과일",
  "zh-TW": "小小兵餅乾三明治 香蕉冰淇淋＆水果",
  "_source": "provisional",
  "_status": "needs_review"
},
"food-7nyguw": {
  "en": "Minion Cookie Sandwich Strawberry Rare Cheesecake",
  "ko": "미니언 쿠키 샌드 딸기 레어치즈",
  "zh-TW": "小小兵餅乾三明治 草莓生乳酪",
  "_source": "provisional",
  "_status": "needs_review"
}
```

---

## 実装手順

### Step 1: food-names.json を読み込む

`data/translations/food-names.json` を読み込み、現在のエントリ数が **35件** であることを確認する。

### Step 2: 重複チェック

追加する 40件の ID が既存 35件と重複していないことを確認する。  
重複が 1件でも見つかった場合は **中止してエラーを報告する**。

### Step 3: エントリ追加

`food-names.json` に上記 40件を追記する。  
既存エントリの値・順序は変更しない。

JSON は Valid である必要がある（末尾カンマなし、文字コード UTF-8）。

### Step 4: coverage スクリプトを実行して確認

```bash
npm run coverage
```

以下の値をすべて確認する:

```
=== Food Translation Coverage ===
total:        294
translated:   77
missing:      217
verified:     6
needs_review: 69
orphan:       0
```

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

- Food Coverage の `orphan` が **0** でなければ中止してエラーを報告する
- Food Coverage の `translated` が **77** でなければ中止してエラーを報告する（重複 ID food-1qt6g0q / food-o9svxw が各2回カウントされる前提）
- Store Coverage の値が上記から 1つでも変化した場合は中止してエラーを報告する

### Step 5: lint / typecheck / build

```bash
npm run lint
npm run typecheck
npm run build
```

すべて成功することを確認する。失敗した場合は中止してエラーを報告する。

### Step 6: staged 確認 → commit

```bash
git status --short
git diff -- data/translations/food-names.json
git add data/translations/food-names.json
git diff --cached --name-only
git diff --cached --stat
```

staged が `data/translations/food-names.json` のみであることを確認する。  
**`git add .` は禁止。** 他ファイルが staged に含まれた場合は中止してエラーを報告する。

```bash
git commit -m "feat(i18n): add food name translations round 2 (B7, 40 entries)"
```

### Step 7: push

```bash
git push
```

push が成功することを確認する。失敗した場合は中止してエラーを報告する。

### Step 8: 最終確認

```bash
git status --short
git status --short --branch
git log -3 --oneline
git rev-parse HEAD
```

---

## Stop and Ask 条件

以下が 1件でも発生した場合は **実装を中断し、エラー内容を報告する**:

- B6 既存 35件 ID との重複が 1件以上
- orphan が 0 以外
- Store Translation Coverage の値が1つでも変化した
- `translated` が 77 以外
- lint / typecheck / build のいずれかが失敗
- food-names.json の JSON が壊れた（parse error）
- food-names.json のエントリ合計が 75件（35 + 40）以外になった場合
- `git diff --cached --name-only` に `data/translations/food-names.json` 以外が含まれた場合
- `npm run coverage` がスクリプトエラー・コンパイルエラーで失敗した場合
- `git push` が失敗した場合

---

## 完了報告フォーマット

実装完了後、以下の項目をすべて報告する:

| 項目 | 確認内容 |
|---|---|
| commit hash | `git rev-parse HEAD` の出力 |
| push 成功 | `git push` が正常終了したか |
| 変更ファイル | `data/translations/food-names.json` のみだったか |
| B6 既存 35件 | 変更・削除していないか |
| エントリ合計 | 35 + 40 = **75件** になったか |
| Food Coverage: translated | **77** か |
| Food Coverage: missing | **217** か |
| Food Coverage: verified | **6** か |
| Food Coverage: needs_review | **69** か |
| Food Coverage: orphan | **0** か |
| Store Coverage | B5/B6後から変化なしか（全値一致） |
| generated JSON | 触っていないか |
| DB / crawler / UIコード | 触っていないか |
| git status | clean か |
| main / origin/main | 同期済みか |

---

## 変更してはいけないもの

| ファイル | 理由 |
|---|---|
| `data/translations/store-names.json` | 対象外 |
| `scripts/output/foods.generated.json` | generated JSON — 変更禁止 |
| `lib/i18n/name-translations.ts` | 変更禁止 |
| `scripts/check-translation-coverage.ts` | 変更禁止 |
| すべての component / app / lib ファイル | 変更禁止 |
| B6 既存 35件のエントリ | 変更禁止 |
