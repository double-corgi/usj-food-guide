# Design Review: 商品名翻訳 seed 第2弾（B7）

**対象 commit:** 338cbfaa44a81922a0eb17d3b0f75ea39e201425 (feat(i18n): add food name translations round 2 (B7, 40 entries))  
**レビュー日:** 2026-06-19  
**レビュー担当:** Claude（設計担当 / レビュー担当）

---

## 判定: 承認

---

## 1. スコープ遵守

| 確認項目 | 結果 |
|---|---|
| 変更ファイルが `data/translations/food-names.json` のみ | ✅ |
| `data/translations/store-names.json` 変更なし | ✅ |
| `scripts/output/foods.generated.json` 変更なし | ✅ |
| `scripts/output/shops.generated.json` 変更なし | ✅ |
| DB / crawler 変更なし | ✅ |
| `lib/i18n/name-translations.ts` 変更なし | ✅ |
| `scripts/check-translation-coverage.ts` 変更なし | ✅ |
| component / app / lib 変更なし | ✅ |
| `package.json` 変更なし | ✅ |

---

## 2. JSON 妥当性

| 確認項目 | 実測 | 結果 |
|---|---|---|
| JSON valid | `npm run lint` / `npm run build` 成功 | ✅ |
| エントリ総数 | 75件（B6: 35件 + B7: 40件） | ✅ |
| B6 既存 35件 変更・削除なし | L2–L246 全件一致（値・順序不変） | ✅ |
| B7 追加 40件 追記済み | L247–L527 全件存在 | ✅ |
| 各エントリに `en` / `ko` / `zh-TW` / `_source` / `_status` | 全75件確認 | ✅ |
| `ja` キーが追加されていない | 全75件に `ja` なし | ✅ |
| `_source` が `provisional` で統一（B7分） | 全40件 `provisional` | ✅ |
| `_status` が `needs_review` で統一（B7分） | 全40件 `needs_review` | ✅ |
| 末尾カンマなし / UTF-8 | ✅ | ✅ |

---

## 3. food ID 妥当性

| 確認項目 | 結果 |
|---|---|
| B7 追加 40件の ID がすべて設計書通り（L247–L527） | ✅ |
| B6 既存 35件との重複なし | ✅（全ID異なる） |
| `orphan: 0`（seed ID が generated JSON に存在しない件数） | ✅ |
| food ID を変更していない | ✅ |
| generated JSON 側を変更せず seed のみ追加 | ✅ |

**B7 40件の ID 確認（L行番号）:**

| # | food.id | L行 | 確認 |
|---|---|---|---|
| 1 | food-bsvsuj | L247 | ✅ |
| 2 | food-84qjxm | L254 | ✅ |
| 3 | food-it27lt | L261 | ✅ |
| 4 | food-1tt1au7 | L268 | ✅ |
| 5 | food-5blx24 | L275 | ✅ |
| 6 | food-26b5s0 | L282 | ✅ |
| 7 | food-4n0ipg | L289 | ✅ |
| 8 | food-450hi7 | L296 | ✅ |
| 9 | food-14hntqo | L303 | ✅ |
| 10 | food-14ut653 | L310 | ✅ |
| 11 | food-o9svxw | L317 | ✅ |
| 12 | food-uqw79q | L324 | ✅ |
| 13 | food-rbn0yu | L331 | ✅ |
| 14 | food-v999yl | L338 | ✅ |
| 15 | food-488njs | L345 | ✅ |
| 16 | food-112pvaq | L352 | ✅ |
| 17 | food-1qt6g0q | L359 | ✅ |
| 18 | food-16q65hw | L366 | ✅ |
| 19 | food-1m8i41b | L373 | ✅ |
| 20 | food-2qri4c | L380 | ✅ |
| 21 | food-1jjli1u | L387 | ✅ |
| 22 | food-116rf8q | L394 | ✅ |
| 23 | food-e0few1 | L401 | ✅ |
| 24 | food-wn7ivo | L408 | ✅ |
| 25 | food-9un9k0 | L415 | ✅ |
| 26 | food-9s2577 | L422 | ✅ |
| 27 | food-15hqyi6 | L429 | ✅ |
| 28 | food-alnomv | L436 | ✅ |
| 29 | food-19z617n | L443 | ✅ |
| 30 | food-804x7o | L450 | ✅ |
| 31 | food-1lvypnn | L457 | ✅ |
| 32 | food-fcx2hy | L464 | ✅ |
| 33 | food-6dk3cs | L471 | ✅ |
| 34 | food-1ojz6jw | L478 | ✅ |
| 35 | food-sfsu3d | L485 | ✅ |
| 36 | food-1435vjy | L492 | ✅ |
| 37 | food-bcbp5u | L499 | ✅ |
| 38 | food-1fcbolg | L506 | ✅ |
| 39 | food-1rqbb9j | L513 | ✅ |
| 40 | food-7nyguw | L520 | ✅ |

---

## 4. 翻訳内容

### 4-1. 文字化け・エンコード

| 確認項目 | 結果 |
|---|---|
| 文字化けなし | ✅ |
| 韓国語（ハングル）正常 | ✅（全40件確認） |
| 繁体字（zh-TW）正常 | ✅（全40件確認） |

### 4-2. 記号ルール（設計書 6-1 との照合）

| 記号 | ルール | 実測例 | 結果 |
|---|---|---|---|
| 波線 | en/ko: `~`（半角）/ zh-TW: `～`（全角） | food-9s2577: en `~Chocolate & Dark Cherry~` / zh-TW `～巧克力＆黑櫻桃～` | ✅ |
| アンパサンド | en/ko: `&`（半角）/ zh-TW: `＆`（全角） | food-5blx24: en `Hot Dog & Drink Set` / zh-TW `熱狗＆飲料套餐` | ✅ |
| 乗算記号 | すべて `×`（U+00D7） | food-6dk3cs: en/ko/zh-TW 全3言語 `×` | ✅ |
| 感嘆符 | すべて半角 `!` | food-19z617n: en `Power Up!` / ko `파워 업!` / zh-TW `Power Up!` | ✅ |
| 商標 `™` | すべての言語で保持 | food-16q65hw: en `Butterbeer™ Pudding` / ko `버터맥주™ 푸딩` / zh-TW `奶油啤酒™布丁` | ✅ |

### 4-3. IP名・キャラクター名（設計書 6-2 との照合）

| 名称 | en | ko | zh-TW | 結果 |
|---|---|---|---|---|
| Butterbeer™ | Butterbeer™ | 버터맥주™ | 奶油啤酒™ | ✅ |
| Harry Potter / Hogwarts | Harry Potter's Hogwarts | 해리 포터의 호그와트 | 哈利波特的霍格華茲 | ✅ |
| T-REX | T-Rex | T-렉스 | T-Rex | ✅ |
| Raptor | Raptor | 랩터 | 迅猛龍 | ✅ |
| Pteranodon | Pteranodon | 프테라노돈 | 翼龍 | ✅ |
| Mosasaurus | Mosasaurus | 모사사우루스 | 滄龍 | ✅ |
| Jurassic Park | Jurassic Park | 쥬라기 공원 | 侏羅紀公園 | ✅ |
| Flying Dinosaur | Flying Dinosaur | 플라잉 다이나소어 | 飛翔恐龍 | ✅ |
| Mario / Luigi / Princess Peach | Mario / Luigi / Princess Peach | 마리오 / 루이지 / 피치 공주 | 瑪利歐 / 路易吉 / 碧姬公主 | ✅ |
| Super Mushroom | Super Mushroom | 슈퍼 버섯 | 超級蘑菇 | ✅ |
| Fire Flower | Fire Flower | 파이어 플라워 | 火焰花 | ✅ |
| Question Block | Question Block | 물음표 블록 | 問號磚塊 | ✅ |
| Bob / Phil / Stuart / Dave（ミニオン） | Bob / Phil / Stuart / Dave | 밥 / 필 / 스튜어트 / 데이브 | 鮑伯 / 菲爾 / 史都華 / 大衛 | ✅ |

### 4-4. 全件 needs_review 扱いの妥当性

公式多言語サイトでの直接確認が取れていない推定翻訳であるため、全40件 `needs_review` は適切。

---

## 5. Coverage

### Food Translation Coverage

| 項目 | 期待値 | 実測値 | 結果 |
|---|---|---|---|
| total | 294 | 294 | ✅ |
| translated | 77 | 77 | ✅ |
| missing | 217 | 217 | ✅ |
| verified | 6 | 6 | ✅ |
| needs_review | 69 | 69 | ✅ |
| orphan | 0 | 0 | ✅ |

`translated` が 75（追加 seed 件数）ではなく 77 なのは、`foods.generated.json` の `foods` 配列に `food-1qt6g0q` / `food-o9svxw` が各2回登場し coverage スクリプトが配列を forEach でカウントするため（+2 × 2 = +4）。設計書の期待値通り。

### Store Translation Coverage（B5/B6後から変化なし）

| 項目 | 期待値 | 実測値 | 結果 |
|---|---|---|---|
| generated_total | 42 | 42 | ✅ |
| translated | 42 | 42 | ✅ |
| missing | 0 | 0 | ✅ |
| display_total | 99 | 99 | ✅ |
| display_translated | 52 | 52 | ✅ |
| display_missing | 47 | 47 | ✅ |
| display_seed | 14 | 14 | ✅ |
| verified | 23 | 23 | ✅ |
| needs_review | 33 | 33 | ✅ |
| orphan | 0 | 0 | ✅ |

---

## 6. 品質保証

| 確認項目 | 結果 |
|---|---|
| `npm run coverage` | ✅ 成功・期待値全一致 |
| `npm run lint` | ✅ 成功 |
| `npm run typecheck` | ✅ 成功 |
| `npm run build` | ✅ 成功 |
| `git status --short` | ✅ clean |
| main / origin/main 同期済み | ✅ |
| 実装が seed 追加のみで余計な副作用なし | ✅ |

---

## 7. 総評

変更対象が `data/translations/food-names.json` の 1ファイルのみであることを確認。B6 既存 35件の値・順序は完全に保持されており、B7 40件が設計書の翻訳値・フォーマット通りに追記されている。記号ルール（半角/全角チルダ・アンパサンド）、IP名・キャラクター名の表記、™ の保持、すべて設計書通り。Food Coverage / Store Coverage とも期待値に完全一致。lint / typecheck / build / coverage 全通過。

---

## 証跡

- `data/translations/food-names.json` 全527行読み取り済み
- B6 35件: L2–L246 全件キー・値・_source・_status 確認
- B7 40件: L247–L526 全件キー・値・_source・_status 確認
- エントリ総数: 75件確認
- 記号ルール: food-9s2577（波線/アンパサンド）、food-6dk3cs（×）、food-19z617n（!）、food-16q65hw（™）を実測で確認
- coverage 全出力: 提供値をレビュー項目と照合
- 実装 commit: `338cbfaa44a81922a0eb17d3b0f75ea39e201425`
