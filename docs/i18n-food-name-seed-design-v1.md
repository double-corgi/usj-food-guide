# 設計: 商品名翻訳 seed 追加（B6）

**作成日:** 2026-06-18  
**設計担当:** Claude（設計担当 / レビュー担当）  
**対象ファイル:** `data/translations/food-names.json`（のみ）

---

## 1. 背景

`data/translations/food-names.json` は現在 `{}` （空）。
`getFoodNameI18n`（`lib/i18n/name-translations.ts` 実装済み）は機能しているが、翻訳データがないため `/ja` 以外のロケールでも常に日本語名のフォールバックが返される。

B6 ではこの JSON に初回 seed（35件）を追加し、海外ロケールでの商品名表示を有効にする。

**coverage 現状（B5 完了時）:**

```
=== Food Translation Coverage ===
total:        294
translated:   0
missing:      294
verified:     0
needs_review: 0
orphan:       0
```

---

## 2. food-names.json のフォーマット

`lib/i18n/name-translations.ts` の実装より:

```ts
type TranslatedLocale = Exclude<Locale, "ja">;   // "en" | "ko" | "zh-TW"
type NameEntry = Partial<Record<TranslatedLocale, string>>;
```

アプリは `en`/`ko`/`zh-TW` キーのみを読む。`_source`/`_status` フィールドは型上は extra だが、coverage script が `_status` を参照するため保持する。

```jsonc
{
  "food-xxxxx": {
    "en": "English Name",
    "ko": "한국어 이름",
    "zh-TW": "繁體中文名稱",
    "_source": "official | provisional",
    "_status": "verified | needs_review"
  }
}
```

**`_source` 基準:**
- `official` — 国際的に標準化された食品名（Turkey Leg, Smoked Chicken, Roast Beef）、または USJ/IP の公式英語名（Butterbeer™）
- `provisional` — 翻訳者判断によるもの、IP名を含むもの、公式確認が取れていないもの

**`_status` 基準:**
- `verified` — 一般食品名として en/ko/zh-TW が全言語で確立している（Turkey Leg, Smoked Chicken, Pork Ribs, Roast Beef）
- `needs_review` — IP キャラクター名を含む、複合料理名、または ko/zh-TW の公式確認が未取得のもの

---

## 3. 対象データ調査結果

### 3-1. foods.generated.json 概要

| 項目 | 件数 |
|---|---|
| 配列総件数 | 294 |
| ユニーク ID 件数 | 292 |
| 重複 ID（配列内に 2 回出現） | food-1qt6g0q（アンガス・エイジングステーキ）, food-o9svxw（ベビーフード）|
| 常設（isLimited=false） | 202 |
| 限定（isLimited=true） | 92 |
| 常設 + 高品質（displayQuality=high）のユニーク ID | 178 |

### 3-2. food-manual-... ID（6件）

| ID | 名称 |
|---|---|
| `food-manual-低アレルゲン-ハンバーガーセット` | 低アレルゲン ハンバーガーセット |
| `food-manual-低アレルゲン-キッズハンバーガーセット` | 低アレルゲン キッズハンバーガーセット |
| `food-manual-低アレルゲン-チキンプレート` | 低アレルゲン チキンプレート |
| `food-manual-低アレルゲン-アレルゲンフリーチョコバナナ` | 低アレルゲン アレルゲンフリーチョコバナナ |
| `food-manual-バタービールtm-マグカップ付き-ノンアルコール` | バタービール™ ～マグカップ付き～（ノンアルコール） |
| `food-manual-バタービールtm-プレミアムマグカップ付き-ノンアルコール` | バタービール™ ～プレミアムマグカップ付き～（ノンアルコール） |

初回 seed: バタービール 2件を含む。低アレルゲン 4件は初回 seed から除外（特殊食品、翻訳に要専門確認）。

---

## 4. 初回 seed 選定方針

**含める:**
- 常設（isLimited=false）かつ displayQuality=high
- カテゴリ別に代表的な汎用食品名
- IP キャラクター名が含まれても名称が明確なもの（Mario, Luigi, Snoopy, Hello Kitty, Minion, Bob-omb）
- Butterbeer™（HP 公式英語名が確立）

**除外:**
- 限定品（isLimited=true）— 92件すべて除外
- 低アレルゲンシリーズ（food-manual-低アレルゲン-...）— 4件除外
- イベント/コラボ名を含む商品（鬼滅の刃, ドラえもん, 呪術廻戦, ワンピース等）— 除外
- 名称に `!`, `?`, `#`, `×` 等の特殊文字を含む商品 — 除外
- 重複 ID（food-1qt6g0q, food-o9svxw）— 除外

**初回 seed: 35件**

---

## 5. 初回 seed 一覧（35件）

### Tier A: 汎用食品名（_status: verified）

| ID | 日本語名 | en | ko | zh-TW |
|---|---|---|---|---|
| `food-1n8s9rw` | ターキーレッグ | Turkey Leg | 칠면조 다리 | 火雞腿 |
| `food-tpy2hd` | ターキーレッグ | Turkey Leg | 칠면조 다리 | 火雞腿 |
| `food-1yhw1tx` | スモークチキン | Smoked Chicken | 훈제 치킨 | 煙熏雞 |
| `food-1it40z4` | スモークチキン | Smoked Chicken | 훈제 치킨 | 煙熏雞 |
| `food-1dm0ouy` | ポークリブ | Pork Ribs | 폭립 | 豬肋排 |
| `food-up3lba` | ローストビーフ | Roast Beef | 로스트 비프 | 烤牛肉 |

### Tier B: 汎用だが複合名 (_status: needs_review)

| ID | 日本語名 | en | ko | zh-TW |
|---|---|---|---|---|
| `food-1hhn874` | BBQ ポークリブ&フライドチキン・プレート | BBQ Pork Ribs & Fried Chicken Plate | BBQ 폭립 & 프라이드치킨 플레이트 | BBQ豬肋排＆炸雞拼盤 |
| `food-1rp55v` | BBQ ポークリブ&フライドチキン・プレート | BBQ Pork Ribs & Fried Chicken Plate | BBQ 폭립 & 프라이드치킨 플레이트 | BBQ豬肋排＆炸雞拼盤 |
| `food-1reufss` | ロティサリー・スモークチキン&ポークリブ | Rotisserie Smoked Chicken & Pork Ribs | 로티사리 훈제 치킨 & 폭립 | 烤轉爐煙熏雞＆豬肋排 |
| `food-hyfchi` | BBQベーコンチーズバーガーセット | BBQ Bacon Cheeseburger Set | BBQ 베이컨 치즈버거 세트 | BBQ培根芝士漢堡套餐 |
| `food-1ulknep` | クラシックチーズバーガーセット | Classic Cheeseburger Set | 클래식 치즈버거 세트 | 經典芝士漢堡套餐 |
| `food-1qzo3v2` | クラシックバーガーセット | Classic Burger Set | 클래식 버거 세트 | 經典漢堡套餐 |
| `food-1wuuuya` | マルゲリータ・ピッツァセット | Margherita Pizza Set | 마르게리타 피자 세트 | 瑪格麗特披薩套餐 |
| `food-1l5cizp` | ペパロニ・ピッツァセット | Pepperoni Pizza Set | 페퍼로니 피자 세트 | 辣肉腸披薩套餐 |
| `food-1b9zmlg` | クアトロチーズ&ハチミツ・ピッツァセット | Quattro Cheese & Honey Pizza Set | 콰트로 치즈 & 꿀 피자 세트 | 四種起司蜂蜜披薩套餐 |
| `food-3g64cm` | チョコレートチュリトス | Chocolate Churro | 초콜릿 추리토스 | 巧克力吉拿棒 |
| `food-18a6cxx` | チョコレートチュリトス | Chocolate Churro | 초콜릿 추리토스 | 巧克力吉拿棒 |
| `food-1e11jee` | メープル・チュリトス | Maple Churro | 메이플 추리토스 | 楓糖吉拿棒 |
| `food-7yyri` | キッズ・ハンバーガーセット | Kids Hamburger Set | 키즈 햄버거 세트 | 兒童漢堡套餐 |
| `food-2n4el4` | アイスクリームフロート | Ice Cream Float | 아이스크림 플로트 | 漂浮冰淇淋 |
| `food-1ycla9v` | アイスクリーム各種 | Assorted Ice Cream | 아이스크림 모듬 | 各式冰淇淋 |

### Tier C: IP キャラクター名を含む (_status: needs_review)

| ID | 日本語名 | en | ko | zh-TW |
|---|---|---|---|---|
| `food-exqw6q` | ボムへい ポップコーンバケツ | Bob-omb Popcorn Bucket | 폭탄병사 팝콘 버킷 | 炸彈兵爆米花桶 |
| `food-5o6h85` | マリオカート・ポップコーンバケツ | Mario Kart Popcorn Bucket | 마리오카트 팝콘 버킷 | 瑪利歐賽車爆米花桶 |
| `food-19w9xaa` | ティム・ポップコーンバケツ | Tim Popcorn Bucket | 팀 팝콘 버킷 | 提姆爆米花桶 |
| `food-1jtv1i9` | ティム・ポップコーンバケツ | Tim Popcorn Bucket | 팀 팝콘 버킷 | 提姆爆米花桶 |
| `food-u0o9uo` | マリオ・バーガー ~ベーコン&チーズ~ | Mario Burger ~Bacon & Cheese~ | 마리오 버거 ~베이컨 & 치즈~ | 瑪利歐漢堡 ～培根＆芝士～ |
| `food-1okbkgf` | マリオ・バーガー ~ベーコン&チーズ~ | Mario Burger ~Bacon & Cheese~ | 마리오 버거 ~베이컨 & 치즈~ | 瑪利歐漢堡 ～培根＆芝士～ |
| `food-mk9bfv` | ルイージ・バーガー ～グリーンカレー・チキン～ | Luigi Burger ~Green Curry Chicken~ | 루이지 버거 ～그린 카레 치킨～ | 路易吉漢堡 ～綠咖喱雞～ |
| `food-cdxmxs` | スヌーピーのビッグバーガーセット | Snoopy's Big Burger Set | 스누피 빅 버거 세트 | 史努比大漢堡套餐 |
| `food-gmrx8l` | ミニオンのチョコバナナ・チュリトス | Minion Choco Banana Churro | 미니언 초코 바나나 추리토스 | 小小兵巧克力香蕉吉拿棒 |
| `food-xpn4ok` | ハローキティ・チュリトス ~いちごミルク~ | Hello Kitty Churro ~Strawberry Milk~ | 헬로키티 추리토스 ~딸기 밀크~ | 凱蒂貓吉拿棒 ～草莓牛奶～ |
| `food-1v2f6xx` | ハローキティ・チュリトス ~いちごミルク~ | Hello Kitty Churro ~Strawberry Milk~ | 헬로키티 추리토스 ~딸기 밀크~ | 凱蒂貓吉拿棒 ～草莓牛奶～ |
| `food-1thjn5k` | ハローキティ・チュリトス~いちごミルク~ | Hello Kitty Churro ~Strawberry Milk~ | 헬로키티 추리토스 ~딸기 밀크~ | 凱蒂貓吉拿棒 ～草莓牛奶～ |

### Tier D: 公式 IP 名（Butterbeer™）

| ID | 日本語名 | en | ko | zh-TW |
|---|---|---|---|---|
| `food-manual-バタービールtm-マグカップ付き-ノンアルコール` | バタービール™ ～マグカップ付き～（ノンアルコール） | Butterbeer™ ~With Mug~ (Non-Alcoholic) | 버터맥주™ ~머그컵 포함~ (무알코올) | 奶油啤酒™ ～附馬克杯～（無酒精） |
| `food-manual-バタービールtm-プレミアムマグカップ付き-ノンアルコール` | バタービール™ ～プレミアムマグカップ付き～（ノンアルコール） | Butterbeer™ ~With Premium Mug~ (Non-Alcoholic) | 버터맥주™ ~프리미엄 머그컵 포함~ (무알코올) | 奶油啤酒™ ～附高級馬克杯～（無酒精） |

---

## 6. 翻訳ルール

### IP キャラクター名

公式英語名をそのまま使用する:

| 日本語 | en | ko (ブランド名はそのまま) | zh-TW（任天堂台湾公式） |
|---|---|---|---|
| マリオ | Mario | 마리오 | 瑪利歐 |
| ルイージ | Luigi | 루이지 | 路易吉 |
| ボムへい | Bob-omb | 폭탄병사 | 炸彈兵 |
| ミニオン | Minion | 미니언 | 小小兵 |
| スヌーピー | Snoopy | 스누피 | 史努比 |
| ハローキティ | Hello Kitty | 헬로키티 | 凱蒂貓 |
| ティム | Tim | 팀 | 提姆 |

### ™/® 記号

元の商品名に ™ がある場合、en/ko/zh-TW にも同じ記号を保持する（Butterbeer™）。

### 装飾文字

`〜`/`～`/`~` → en/ko は `~`、zh-TW は `～`（全角）を使用。
`（）` → en/ko は `()`、zh-TW は `（）`（全角）を使用。

### "Set" の翻訳

- en: `Set`（末尾に付与）
- ko: `세트`（末尾に付与）
- zh-TW: `套餐`（末尾に付与）

---

## 7. 期待する coverage（B6 実装後）

```
=== Food Translation Coverage ===
total:        294
translated:   35
missing:      259
verified:     6
needs_review: 29
orphan:       0
```

- `translated: 35` — 35 ユニーク ID 全件がヒット
- `verified: 6` — Tier A 全件（ターキーレッグ×2、スモークチキン×2、ポークリブ、ローストビーフ）
- `needs_review: 29` — Tier B（15件）+ Tier C（12件）+ Tier D（2件）
- `orphan: 0` — 35件 ID は全て foods.generated.json に存在

**Store Translation Coverage は変化なし（display_seed: 14 / orphan: 0 を維持）**

---

## 8. 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `data/translations/food-names.json` | `{}` → 35エントリ追加 |

**変更しないファイル:**
- `scripts/output/foods.generated.json`（generated JSON — 変更禁止）
- `data/translations/store-names.json`
- `lib/i18n/name-translations.ts`
- `scripts/check-translation-coverage.ts`
- components / app / DB / crawler

---

## 9. Stop and Ask 条件

| 条件 | 判定 |
|---|---|
| 35件 ID のうち foods.generated.json に存在しない ID がある | 実装前に全件確認済み（全 ✅）|
| food-names.json を JSON 以外の形式で記述する必要がある | 不要 |
| store-names.json / stores coverage に影響が出る | Food と Store は独立 → 影響なし |
| orphan が 0 以外になる | 全 ID が generatedIdSet に含まれるため不発生 |

**Stop and Ask 条件なし。Codex に投げてよい。**
