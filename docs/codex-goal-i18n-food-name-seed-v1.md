# Goal: 商品名翻訳 seed 追加（B6）

## あなたの役割

あなたは実装担当です。`data/translations/food-names.json` のみを編集してください。

**禁止:**
- `scripts/output/foods.generated.json` 変更禁止（generated JSON — 絶対に変更しない）
- `scripts/output/shops.generated.json` 変更禁止
- `data/translations/store-names.json` 変更禁止
- `lib/i18n/name-translations.ts` 変更禁止
- `scripts/check-translation-coverage.ts` 変更禁止
- DB / crawler 実行禁止
- components / app / lib 変更禁止
- `git add .` 禁止

---

## 背景

`data/translations/food-names.json` は現在 `{}` （空）。
`getFoodNameI18n` は実装済みだが翻訳データがないため全ロケールで日本語名フォールバックが返される。

B6 では 35件の初回 seed を追加し、海外ロケールでの商品名表示を有効にする。

---

## Step 0: 作業開始前の確認

```bash
git status
cat data/translations/food-names.json
```

- `food-names.json` が `{}` であることを確認する
- `store-names.json` が変更されていないことを確認する

---

## Step 1: data/translations/food-names.json を以下の内容で置き換える

現在の `{}` を下記 JSON で完全に置き換える。既存の `{}` は削除し、以下をそのまま貼り付ける。

```json
{
  "food-1n8s9rw": {
    "en": "Turkey Leg",
    "ko": "칠면조 다리",
    "zh-TW": "火雞腿",
    "_source": "official",
    "_status": "verified"
  },
  "food-tpy2hd": {
    "en": "Turkey Leg",
    "ko": "칠면조 다리",
    "zh-TW": "火雞腿",
    "_source": "official",
    "_status": "verified"
  },
  "food-1yhw1tx": {
    "en": "Smoked Chicken",
    "ko": "훈제 치킨",
    "zh-TW": "煙熏雞",
    "_source": "official",
    "_status": "verified"
  },
  "food-1it40z4": {
    "en": "Smoked Chicken",
    "ko": "훈제 치킨",
    "zh-TW": "煙熏雞",
    "_source": "official",
    "_status": "verified"
  },
  "food-1dm0ouy": {
    "en": "Pork Ribs",
    "ko": "폭립",
    "zh-TW": "豬肋排",
    "_source": "official",
    "_status": "verified"
  },
  "food-up3lba": {
    "en": "Roast Beef",
    "ko": "로스트 비프",
    "zh-TW": "烤牛肉",
    "_source": "official",
    "_status": "verified"
  },
  "food-1hhn874": {
    "en": "BBQ Pork Ribs & Fried Chicken Plate",
    "ko": "BBQ 폭립 & 프라이드치킨 플레이트",
    "zh-TW": "BBQ豬肋排＆炸雞拼盤",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-1rp55v": {
    "en": "BBQ Pork Ribs & Fried Chicken Plate",
    "ko": "BBQ 폭립 & 프라이드치킨 플레이트",
    "zh-TW": "BBQ豬肋排＆炸雞拼盤",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-1reufss": {
    "en": "Rotisserie Smoked Chicken & Pork Ribs",
    "ko": "로티사리 훈제 치킨 & 폭립",
    "zh-TW": "烤轉爐煙熏雞＆豬肋排",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-hyfchi": {
    "en": "BBQ Bacon Cheeseburger Set",
    "ko": "BBQ 베이컨 치즈버거 세트",
    "zh-TW": "BBQ培根芝士漢堡套餐",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-1ulknep": {
    "en": "Classic Cheeseburger Set",
    "ko": "클래식 치즈버거 세트",
    "zh-TW": "經典芝士漢堡套餐",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-1qzo3v2": {
    "en": "Classic Burger Set",
    "ko": "클래식 버거 세트",
    "zh-TW": "經典漢堡套餐",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-1wuuuya": {
    "en": "Margherita Pizza Set",
    "ko": "마르게리타 피자 세트",
    "zh-TW": "瑪格麗特披薩套餐",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-1l5cizp": {
    "en": "Pepperoni Pizza Set",
    "ko": "페퍼로니 피자 세트",
    "zh-TW": "辣肉腸披薩套餐",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-1b9zmlg": {
    "en": "Quattro Cheese & Honey Pizza Set",
    "ko": "콰트로 치즈 & 꿀 피자 세트",
    "zh-TW": "四種起司蜂蜜披薩套餐",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-3g64cm": {
    "en": "Chocolate Churro",
    "ko": "초콜릿 추리토스",
    "zh-TW": "巧克力吉拿棒",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-18a6cxx": {
    "en": "Chocolate Churro",
    "ko": "초콜릿 추리토스",
    "zh-TW": "巧克力吉拿棒",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-1e11jee": {
    "en": "Maple Churro",
    "ko": "메이플 추리토스",
    "zh-TW": "楓糖吉拿棒",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-7yyri": {
    "en": "Kids Hamburger Set",
    "ko": "키즈 햄버거 세트",
    "zh-TW": "兒童漢堡套餐",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-2n4el4": {
    "en": "Ice Cream Float",
    "ko": "아이스크림 플로트",
    "zh-TW": "漂浮冰淇淋",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-1ycla9v": {
    "en": "Assorted Ice Cream",
    "ko": "아이스크림 모듬",
    "zh-TW": "各式冰淇淋",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-exqw6q": {
    "en": "Bob-omb Popcorn Bucket",
    "ko": "폭탄병사 팝콘 버킷",
    "zh-TW": "炸彈兵爆米花桶",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-5o6h85": {
    "en": "Mario Kart Popcorn Bucket",
    "ko": "마리오카트 팝콘 버킷",
    "zh-TW": "瑪利歐賽車爆米花桶",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-19w9xaa": {
    "en": "Tim Popcorn Bucket",
    "ko": "팀 팝콘 버킷",
    "zh-TW": "提姆爆米花桶",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-1jtv1i9": {
    "en": "Tim Popcorn Bucket",
    "ko": "팀 팝콘 버킷",
    "zh-TW": "提姆爆米花桶",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-u0o9uo": {
    "en": "Mario Burger ~Bacon & Cheese~",
    "ko": "마리오 버거 ~베이컨 & 치즈~",
    "zh-TW": "瑪利歐漢堡 ～培根＆芝士～",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-1okbkgf": {
    "en": "Mario Burger ~Bacon & Cheese~",
    "ko": "마리오 버거 ~베이컨 & 치즈~",
    "zh-TW": "瑪利歐漢堡 ～培根＆芝士～",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-mk9bfv": {
    "en": "Luigi Burger ~Green Curry Chicken~",
    "ko": "루이지 버거 ~그린 카레 치킨~",
    "zh-TW": "路易吉漢堡 ～綠咖喱雞～",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-cdxmxs": {
    "en": "Snoopy's Big Burger Set",
    "ko": "스누피 빅 버거 세트",
    "zh-TW": "史努比大漢堡套餐",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-gmrx8l": {
    "en": "Minion Choco Banana Churro",
    "ko": "미니언 초코 바나나 추리토스",
    "zh-TW": "小小兵巧克力香蕉吉拿棒",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-xpn4ok": {
    "en": "Hello Kitty Churro ~Strawberry Milk~",
    "ko": "헬로키티 추리토스 ~딸기 밀크~",
    "zh-TW": "凱蒂貓吉拿棒 ～草莓牛奶～",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-1v2f6xx": {
    "en": "Hello Kitty Churro ~Strawberry Milk~",
    "ko": "헬로키티 추리토스 ~딸기 밀크~",
    "zh-TW": "凱蒂貓吉拿棒 ～草莓牛奶～",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-1thjn5k": {
    "en": "Hello Kitty Churro ~Strawberry Milk~",
    "ko": "헬로키티 추리토스 ~딸기 밀크~",
    "zh-TW": "凱蒂貓吉拿棒 ～草莓牛奶～",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-manual-バタービールtm-マグカップ付き-ノンアルコール": {
    "en": "Butterbeer™ ~With Mug~ (Non-Alcoholic)",
    "ko": "버터맥주™ ~머그컵 포함~ (무알코올)",
    "zh-TW": "奶油啤酒™ ～附馬克杯～（無酒精）",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "food-manual-バタービールtm-プレミアムマグカップ付き-ノンアルコール": {
    "en": "Butterbeer™ ~With Premium Mug~ (Non-Alcoholic)",
    "ko": "버터맥주™ ~프리미엄 머그컵 포함~ (무알코올)",
    "zh-TW": "奶油啤酒™ ～附高級馬克杯～（無酒精）",
    "_source": "provisional",
    "_status": "needs_review"
  }
}
```

**注意事項:**
- JSON を手で編集しない。上記をそのままコピーして置き換えること
- キー（food ID）は変更禁止
- 翻訳値（en/ko/zh-TW）は変更禁止
- `_source`/`_status` 値は変更禁止

---

## Step 2: JSON が有効であることを確認する

```bash
python3 -c "import json; json.load(open('data/translations/food-names.json')); print('JSON valid')"
```

`JSON valid` が出力されることを確認する。エラーが出た場合は Step 1 に戻って JSON を修正する。

---

## Step 3: エントリ数を確認する

```bash
python3 -c "import json; d=json.load(open('data/translations/food-names.json')); print(f'entries: {len(d)}')"
```

`entries: 35` であることを確認する。

---

## Step 4: lint / typecheck を実行する

```bash
npm run lint && npm run typecheck
```

両方成功することを確認する。

---

## Step 5: coverage script を実行して結果を確認する

```bash
npm run coverage
```

**期待する出力（Food セクション）:**

```
=== Food Translation Coverage ===
total:        294
translated:   35
missing:      259
verified:     6
needs_review: 29
orphan:       0
```

**期待する出力（Store セクション — 変化なしであること）:**

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

**合否判定:**

| 条件 | 判定 |
|---|---|
| Food `translated: 35` | ✅ 必須 |
| Food `orphan: 0` | ✅ 必須 |
| Food `verified: 6` | ✅ 必須 |
| Food `needs_review: 29` | ✅ 必須 |
| Store `display_seed: 14` が変化していない | ✅ 必須 |
| Store `orphan: 0` が変化していない | ✅ 必須 |
| Store `generated_total: 42` / `translated: 42` が変化していない | ✅ 必須 |

**上記条件を満たさない場合は実装を止めて報告すること。**

---

## Step 6: build を実行する

```bash
npm run build
```

成功することを確認する。

---

## Step 7: git add（変更ファイルのみ）

```bash
git add data/translations/food-names.json
```

`git add .` は禁止。他のファイルを add しないこと。

---

## Step 8: commit する

```bash
git commit -m "feat: add initial food name translation seeds - 35 items (B6)"
```

---

## Step 9: push する

```bash
git push
```

---

## Step 10: 最終確認

```bash
git status --short
git status --short --branch
git log -3 --oneline
```

---

## 完了報告に含めること

1. commit hash
2. push 成功確認
3. `data/translations/food-names.json` のエントリ数（35件）
4. JSON valid 確認結果
5. `npm run coverage` の全出力
6. lint / typecheck / build の結果
7. Store Coverage が変化していないこと（display_seed: 14 / orphan: 0）
8. 変更ファイルが `data/translations/food-names.json` のみであること

---

## Stop and Ask 条件

以下のいずれかに該当する場合は実装を止めて報告すること:

- JSON の貼り付け後に `python3 -c ... json.load(...)` がエラーを返した場合
- `coverage` 実行で `orphan` が 0 以外になった場合（食品側・店舗側どちらでも）
- `coverage` 実行で `translated` が 35 以外になった場合
- Store Coverage の `display_seed` が 14 以外になった場合
- lint / typecheck / build が失敗し、`food-names.json` の JSON 以外の変更が必要になった場合
