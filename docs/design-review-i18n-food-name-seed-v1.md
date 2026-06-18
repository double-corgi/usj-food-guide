# Design Review: 商品名翻訳 seed 追加（B6）

**対象 commit:** 092933863e0aa472f6eab169b9a5605a247d2014 (feat: add initial food name translation seeds - 35 items (B6))  
**レビュー日:** 2026-06-18  
**レビュー担当:** Claude（設計担当 / レビュー担当）

---

## 判定: 承認

---

## 1. スコープ遵守

| 確認項目 | 結果 |
|---|---|
| 変更ファイルが `data/translations/food-names.json` のみ | ✅ `git show --name-only` で 1件のみ確認 |
| `data/translations/store-names.json` 変更なし | ✅ |
| `scripts/output/foods.generated.json` 変更なし | ✅ |
| `scripts/output/shops.generated.json` 変更なし | ✅ |
| `lib/i18n/name-translations.ts` 変更なし | ✅ |
| `scripts/check-translation-coverage.ts` 変更なし | ✅ |
| components / app / DB / crawler 変更なし | ✅ |
| git status: clean | ✅ |

---

## 2. JSON 妥当性

| 確認項目 | 結果 |
|---|---|
| `python3 -c "import json; json.load(...)"` が成功 | ✅ JSON valid |
| エントリ数 35件 | ✅ `entries: 35` |
| 全エントリに `en` / `ko` / `zh-TW` / `_source` / `_status` が存在 | ✅ 全 35件確認 |
| `ja` キーが追加されていない | ✅ |
| `_source` が `official` または `provisional` のみ | ✅ |
| `_status` が `verified` または `needs_review` のみ | ✅ |

---

## 3. food ID 妥当性

| 確認項目 | 結果 |
|---|---|
| 35件すべての food ID が `foods.generated.json` に存在 | ✅ orphan: 0 で確認 |
| `orphan: 0` が妥当（全 ID が generatedIdSet に含まれる） | ✅ |
| food ID を変更していない | ✅ |
| generated JSON 側を変更せず seed のみ追加 | ✅ |

---

## 4. 翻訳内容

### 文字化け・文字コード

| 確認項目 | 結果 |
|---|---|
| 韓国語（ハングル）が正常 | ✅ 全 35件目視確認 |
| 繁体字（zh-TW）が正常 | ✅ 全 35件目視確認 |
| Butterbeer™ の ™ が保持されている | ✅ en / ko / zh-TW 全ロケール確認 |

### 設計ルール準拠

| 確認項目 | 結果 |
|---|---|
| `food-mk9bfv` ko が半角チルダ `~グリーンカレー~` | ✅ `루이지 버거 ~그린 카레 치킨~` |
| en / ko の波線が半角 `~` | ✅ 全件確認（Mario Burger, Hello Kitty, Luigi Burger, Butterbeer™） |
| zh-TW の波線が全角 `～` | ✅ 全件確認 |
| zh-TW の括弧が全角 `（）` | ✅ Butterbeer™ 2件確認 |
| en / ko の括弧が半角 `()` | ✅ Butterbeer™ 2件確認 |
| IP キャラクター名が公式英語名通り | ✅ Mario / Luigi / Bob-omb / Minion / Snoopy / Hello Kitty / Tim |
| "Set" の翻訳: ko `세트` / zh-TW `套餐` | ✅ 全バーガー・ピッツァ・キッズセット確認 |

### _status / _source 分類

| 確認項目 | 結果 |
|---|---|
| Tier A 6件（ターキーレッグ×2、スモークチキン×2、ポークリブ、ローストビーフ）が `verified` | ✅ |
| Tier A 6件が `official` | ✅ |
| Tier B / C / D 29件が `needs_review` | ✅ |
| Tier B / C / D 29件が `provisional` | ✅ |

### 翻訳品質（目視）

全 35件を目視確認した結果、日本語フォールバックより明らかに質の低い翻訳は確認されなかった。代表的な確認:

| 商品 | en | ko | zh-TW | 評価 |
|---|---|---|---|---|
| ターキーレッグ | Turkey Leg | 칠면조 다리 | 火雞腿 | ✅ 標準的 |
| BBQ ポークリブ&フライドチキン・プレート | BBQ Pork Ribs & Fried Chicken Plate | BBQ 폭립 & 프라이드치킨 플레이트 | BBQ豬肋排＆炸雞拼盤 | ✅ |
| マルゲリータ・ピッツァセット | Margherita Pizza Set | 마르게리타 피자 세트 | 瑪格麗特披薩套餐 | ✅ |
| マリオ・バーガー ~ベーコン&チーズ~ | Mario Burger ~Bacon & Cheese~ | 마리오 버거 ~베이컨 & 치즈~ | 瑪利歐漢堡 ～培根＆芝士～ | ✅ |
| ボムへい ポップコーンバケツ | Bob-omb Popcorn Bucket | 폭탄병사 팝콘 버킷 | 炸彈兵爆米花桶 | ✅ |
| バタービール™ ～マグカップ付き～ | Butterbeer™ ~With Mug~ (Non-Alcoholic) | 버터맥주™ ~머그컵 포함~ (무알코올) | 奶油啤酒™ ～附馬克杯～（無酒精） | ✅ |

---

## 5. coverage 検証

### Food Translation Coverage

| メトリクス | 期待値 | 実測値 | 判定 |
|---|---|---|---|
| `total` | 294 | 294 | ✅ |
| `translated` | 35 | 35 | ✅ |
| `missing` | 259 | 259 | ✅ |
| `verified` | 6 | 6 | ✅ |
| `needs_review` | 29 | 29 | ✅ |
| `orphan` | 0 | 0 | ✅ |

### Store Translation Coverage（B5後から変化なし）

| メトリクス | B5後 | 実測値 | 判定 |
|---|---|---|---|
| `generated_total` | 42 | 42 | ✅ |
| `translated` | 42 | 42 | ✅ |
| `missing` | 0 | 0 | ✅ |
| `display_total` | 99 | 99 | ✅ |
| `display_translated` | 52 | 52 | ✅ |
| `display_missing` | 47 | 47 | ✅ |
| `display_seed` | 14 | 14 | ✅ |
| `verified` | 23 | 23 | ✅ |
| `needs_review` | 33 | 33 | ✅ |
| `orphan` | 0 | 0 | ✅ |

---

## 6. 品質保証

| 確認項目 | 結果 |
|---|---|
| `npm run lint` | ✅ 成功 |
| `npm run typecheck` | ✅ 成功 |
| `npm run build` | ✅ 成功 |
| `npm run coverage` | ✅ 期待出力と完全一致 |
| 変更ファイルが `data/translations/food-names.json` のみ | ✅ |
| seed 追加以外の副作用なし | ✅ |

---

## 7. 総評

設計書の仕様を正確に実装している。35件の food ID は全件 `foods.generated.json` に存在し orphan: 0。翻訳ルール（半角/全角チルダの使い分け、IP キャラクター名、™ 記号保持、Set/套餐/세트）が全件遵守されている。特に `food-mk9bfv` の ko が設計書修正通り半角チルダになっていることを直接確認した。Tier A 6件の `verified` 分類、Tier B/C/D 29件の `needs_review` 分類とも設計通り。Food Coverage / Store Coverage ともに期待値と完全一致。lint / typecheck / build / coverage 全通過。

---

## 証跡

- `git show 092933863e0aa472f6eab169b9a5605a247d2014 --name-only`: 1件変更（data/translations/food-names.json）
- `python3` で全 35件の fields / _source / _status / ja非存在を確認
- `python3` で全 35件 ID が `foods.generated.json` に存在することを確認（orphan: 0）
- 全 35件の en/ko/zh-TW を目視確認
- `npm run coverage` 出力を全行確認
- 実装 commit: `092933863e0aa472f6eab169b9a5605a247d2014`
