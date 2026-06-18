# Design Review: i18n fallback 店舗 seed 追加（B4）

**対象 staged diff:** `data/translations/store-names.json`（+98 lines, 14件追加）  
**レビュー日:** 2026-06-18  
**レビュー担当:** Claude（設計担当 / レビュー担当）  

---

## 判定: 承認

この staged diff を commit / push してよい。

---

## 1. スコープ遵守

| 確認項目 | 結果 |
|---|---|
| staged が `data/translations/store-names.json` のみ | ✅ `git diff --cached --stat` で 1 ファイル 98 挿入のみ確認 |
| 未追跡の scripts（list-fallback-stores.ts / list-stores-with-translation.ts / tsconfig-scripts.json）が staged 外 | ✅ `??` 扱いで commit 対象外 |
| `data/translations/food-names.json` 変更なし | ✅ diff に含まれない |
| `lib/store-utils.ts` 変更なし | ✅ diff に含まれない |
| components / app / lib 変更なし | ✅ diff に含まれない |
| `scripts/output/shops.generated.json` 変更なし | ✅ |
| `scripts/check-translation-coverage.ts` 変更なし | ✅ |

---

## 2. JSON 構造

| 確認項目 | 結果 |
|---|---|
| 追加 14件全てに `en` / `ko` / `zh-TW` / `_source` / `_status` が存在する | ✅ node で全件確認 |
| `ja` キーが追加されていない | ✅ 全 14件 `ja` なし |
| 既存 42件を変更していない | ✅ diff は末尾への追加のみ。既存最終エントリ `shop-1ielufv` の閉じ括弧にカンマが追加されたのみ（JSON 文法上正しい） |
| キー重複なし | ✅ `node -e` でユニーク確認。56件すべて一意 |
| JSON 構文 valid | ✅ `node -e "require(...)"` で確認済み |
| エントリ数: 42 → 56（+14） | ✅ |

---

## 3. ID 設計

### getStoreNameTranslationId の動作確認

```ts
return [store.id, ...store.aliases].find((id) => translatedStoreIds.has(id)) ?? store.id;
```

#### Group A: alias キーで解決する 7件

| キー（alias） | store.id | 検索順 | ヒット |
|---|---|---|---|
| `shop-ホッグズ-ヘッド-パブ` | shop-restaurant-tzbeu2 | store.id → **alias** | ✅ |
| `shop-フィネガンズ・バー＆グリル`（全角 ＆） | shop-and-restaurant-1gm2c4 | store.id → **alias** | ✅ |
| `shop-アズーラ・ディ・カプリ` | shop-restaurant-16fz17 | store.id → **alias** | ✅ |
| `shop-三本の箒tm` | shop-tm-restaurant-185mjs | store.id → **alias** | ✅ |
| `shop-スヌーピー・バックロット・カフェ` | shop-1tt48e8-restaurant-90u3k9 | store.id → **alias** | ✅ |
| `shop-ピンクカフェ` | shop-restaurant-8ebexf | store.id → **alias** | ✅ |
| `shop-137zayl` | shop-1tt48e8-cart-1yi3mn | store.id → **alias** | ✅ |

全角 `＆`（U+FF06）が `shop-フィネガンズ・バー＆グリル` キーに使用されているが、`scripts/list-stores-with-translation.ts` 出力の aliases 値が同一の全角 ＆ を持つことをステップ 1 で確認済み。キー照合は完全一致のため問題なし。✅

#### Group B: display ID 直接キーで解決する 7件

| キー（display ID） | aliases | ヒット |
|---|---|---|
| `shop-1tt48e8-restaurant-122iqw` | `[]` | store.id で直接 ✅ |
| `shop-restaurant-7uhqb` | `[]` | store.id で直接 ✅ |
| `shop-gxslj9` | `[]` | store.id で直接 ✅ |
| `shop-1ea4r5z` | `[]` | store.id で直接 ✅ |
| `shop-1bid242` | `[]` | store.id で直接 ✅ |
| `shop-jbc9aa` | `[]` | store.id で直接 ✅ |
| `shop-znyimu` | `[]` | store.id で直接 ✅ |

`shop-1tt48e8` は既存エントリとして存在するが、`shop-1tt48e8-restaurant-122iqw` との Set.has() 比較は完全一致のため干渉なし。✅

### lib/store-utils.ts 変更なし

aliases 走査による解決は B3 実装の `store-name-client.tsx` だけで完結しており、`store-utils.ts` を変更せずに ID 不一致を吸収している。✅

---

## 4. orphan 問題

| 指標 | B3 後 | B4 後 |
|---|---|---|
| Store total | 42 | 42（変化なし） |
| Store translated | 42 | 42（変化なし） |
| Store missing | 0 | 0（変化なし） |
| Store orphan | 0 | **14**（設計通り） |

**orphan +14 を承認する。**

理由: coverage script は `shops.generated.json` の 42件マスターのみを参照しており、`buildStoresFromFoods` が動的生成する display ID / legacy alias を認識しない。追加 14件は実際の /stores 表示で参照される機能的に有効なエントリであり、script 上の orphan 判定は実態と乖離している。これは coverage script 自体の参照範囲の限界であって、store-names.json のデータ品質の問題ではない。

---

## 5. 翻訳品質

### Group A（official / verified）

| 店舗 | en | ko | zh-TW | 評価 |
|---|---|---|---|---|
| ホッグズ・ヘッド・パブ | Hog's Head Pub | 호그즈 헤드 펍 | 豬頭酒吧 | ✅ HP 公式名称、zh-TW は定訳 |
| フィネガンズ・バー＆グリル | Finnegan's Bar & Grill | 피네간즈 바 & 그릴 | 費尼根酒吧燒烤 | ✅ USJ NY エリア公式名 |
| アズーラ・ディ・カプリ | Azzurra di Capri | 아즈라 디 카프리 | 阿祖拉迪卡普里 | ✅ イタリア語名の音訳（後述注記参照） |
| 三本の箒™ | Three Broomsticks | 세 개의 빗자루 | 三根掃帚 | ✅ 既存 shop-nokw9 と完全一致 |

### Group B（provisional / needs_review）

| 店舗 | en | 評価 |
|---|---|---|
| スヌーピー・バックロット・カフェ | Snoopy's Backlot Café | ✅ |
| ピンクカフェ | Pink Café | ✅ |
| ハローキティのコーナーカフェ | Hello Kitty's Corner Café | ✅ |
| ホッグズ・ヘッド | Hog's Head | ✅ パブなしバリアント |
| ロストワールド・レストラン | Lost World Restaurant | ✅ 既存 shop-3v2j9p と一致 |
| コーナーカフェ | Corner Café | ✅ 既存 shop-1jnbp5c と一致 |
| ハローキティのコーナーカフェ(UW) | Hello Kitty's Corner Café | ✅ |
| ハローキティのカップケーキ・ドリーム横FD | Hello Kitty's Cupcake Dream Food Cart | ✅ |
| ミニオン・ハッピー・キッチン(ミニオンパーク手前) | Minion Happy Kitchen | ✅ 既存 shop-17yebwe と一致 |
| ジャングル・ビート・シェイク | Jungle Beat Shakes | ✅ 既存 shop-1ielufv と一致 |

### 軽微な注記（非ブロッキング）

**[低] `shop-アズーラ・ディ・カプリ` の `_status: "verified"`:**  
en は英語訳ではなくイタリア語名のまま（"Azzurra di Capri"）、ko / zh-TW は音訳。「日本語名より悪い翻訳でない」という基準は満たしており、イタリア語レストラン名の音訳として適切な処理。ただし ko / zh-TW の音訳に公式 USJ 出典があるわけではないため、`needs_review` の方が厳密だった可能性がある。設計書が `official/verified` と指定しており、実害もないため変更不要。

---

## 6. カバレッジ

| 指標 | B3 後 | B4 後 | 変化 |
|---|---|---|---|
| Translated（diagnostic script） | 38 | 52 | **+14** |
| Fallback（diagnostic script） | 61 | 47 | **-14** |

追加 14件全てが `getStoreNameTranslationId` によって正しく拾われており、diagnostic script 上で Translated に加算されたことが確認できる。設計書の「38 → 概ね 45〜52 程度」に対して 52 は上限側で期待通り。✅

---

## 7. 品質保証

| 確認項目 | 結果 |
|---|---|
| `npm run lint` | ✅ |
| `npm run typecheck` | ✅ |
| `npm run build` | ✅ |
| Step 1 ID 確認（設計書との照合） | ✅ 全 14件一致 |

---

## 8. 次フェーズへの申し送り

**[推奨] coverage script の拡張（B5 候補）:**  
`check-translation-coverage.ts` が `shops.generated.json` のみを参照している限り、`buildStoresFromFoods` 生成の display ID / alias を seed に追加するたびに orphan が増え続ける。B4 完了後のタイミングで、coverage script を `buildStoresFromFoods` の実出力と照合するよう拡張すると orphan の実態把握が正確になる。

---

## 証跡

- `git diff --cached --stat`: 1 ファイル 98 挿入
- `git diff --cached`: 14 エントリ全内容を目視確認
- `node -e`: 56件全キー / 14件フィールド / 重複なし を確認
- `_source/_status`: 全 14件を node で確認
- 実行報告: lint ✅ / typecheck ✅ / build ✅ / JSON valid ✅ / Translated +14 ✅ / orphan +14 ✅（設計想定内）
