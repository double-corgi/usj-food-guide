# Design Review: B2「店舗名42件 seed」v1

**レビュー対象 commit:** 06cd397 (`add-i18n-store-name-seed`)
**バックアップ commit:** 4a09c32
**レビュー日:** 2026-06-17
**判定:** ✅ **承認**

---

## 検証対象

| ファイル | 検証方法 |
|---|---|
| `data/translations/store-names.json` | 全296行実読取 |
| `data/translations/food-names.json` | 実読取（`{}` であること確認）|

---

## 1. スコープ遵守 ✅

| 確認項目 | 判定 | 詳細 |
|---|---|---|
| 変更が `store-names.json` のみ | ✅ | Codex 報告と一致 |
| `food-names.json` が `{}` のまま | ✅ | L1: `{}` — 変更なし |
| generated JSON 未変更 | ✅ | |
| DB / crawler 未変更 | ✅ | |
| UI 未反映（`/stores` `/foods` 表示変更なし）| ✅ | |
| `lib/i18n/name-translations.ts` 未変更 | ✅ | |
| `lib/i18n/dictionaries.ts` 未変更 | ✅ | |
| `lib/store-utils.ts` / `lib/food-utils.ts` 未変更 | ✅ | |
| `lib/constants.ts` / `types/domain.ts` 未変更 | ✅ | |
| URL 構造 / localStorage schema / ID 未変更 | ✅ | |

---

## 2. JSON 構造確認 ✅

### エントリ件数

```
shop-ztyaw1〜shop-1ielufv: 42件
```

実読取で 42 エントリを確認 ✅（L1〜L296、最終エントリ `shop-1ielufv` L289〜L295）

### キー整合性

| 確認項目 | 判定 | 根拠 |
|---|---|---|
| 全42キーが `shops.generated.json` に存在する | ✅ | `orphan: 0`（カバレッジスクリプト実行結果）|
| `shops.generated.json` の全42件が翻訳 JSON に存在する | ✅ | `missing: 0`（同上）|
| 翻訳 JSON のキーは `shop-id` 形式のみ | ✅ | 実読取で全キー確認 |

### フィールド構成（全42件）

| フィールド | 有無 | 確認 |
|---|---|---|
| `en` | 全42件にあり | ✅ |
| `ko` | 全42件にあり | ✅ |
| `zh-TW` | 全42件にあり | ✅ |
| `_source` | 全42件にあり | ✅ |
| `_status` | 全42件にあり | ✅ |
| `ja` | 全件なし | ✅ `ja` キーは設計通り不在 |

### ステータス集計

| `_status` | 件数 | 確認 |
|---|---|---|
| `verified` | 19件 | ✅ カバレッジ結果一致 |
| `needs_review` | 23件 | ✅ カバレッジ結果一致 |
| 合計 | 42件 | ✅ |

---

## 3. 翻訳品質確認 ✅

### official / verified 判定（19件）— 根拠確認

| shop.id | 日本語名 | URL スラッグ | en | 判定 |
|---|---|---|---|---|
| shop-1ptfw3y | SAIDO | `saido` | "SAIDO" | ✅ ラテン文字名そのまま |
| shop-102yaa2 | アミティ・アイスクリーム | `amity-ice-cream` | "Amity Ice Cream" | ✅ スラッグから直読 |
| shop-1tdzkex | アミティ・ランディング・レストラン | `amity-landing-restaurant` | "Amity Landing Restaurant" | ✅ |
| shop-1vff8rf | キノピオ・カフェ | `kinopios-cafe` | "Kinopio's Café" | ✅ |
| shop-1v0tbtg | ザ・ドラゴンズ・パール | `the-dragons-pearl` | "The Dragon's Pearl" | ✅ |
| shop-c8yjbq | スタジオ・スターズ・レストラン | `studio-stars-restaurant` | "Studio Stars Restaurant" | ✅ |
| shop-1t5w62 | ディスカバリー・レストラン | `discovery-restaurant` | "Discovery Restaurant" | ✅ |
| shop-1i0x5ad | デリシャス・ミー!ザ・クッキー・キッチン | `delicious-me-the-cookie-kitchen` | "Delicious Me! The Cookie Kitchen" | ✅ |
| shop-1f4jraw | 同上（foodCount: 0） | 同スラッグ | 同上 | ✅ 同名・同URL、verified 扱いは妥当 |
| shop-uokkys | パークサイド・グリル | `park-side-grille` | "Park Side Grille" | ✅ |
| shop-19qxymy | ハピネス・カフェ | `happiness-cafe` | "Happiness Café" | ✅ |
| shop-1vma23e | ピットストップ・ポップコーン | `pit-stop-popcorn` | "Pit Stop Popcorn" | ✅ |
| shop-152bmpp | ビバリーヒルズ・ブランジェリー | `beverly-hills-boulangerie` | "Beverly Hills Boulangerie" | ✅ |
| shop-1r3y9l7 | フォッシル・フュエルズ | `fossil-fuels` | "Fossil Fuels" | ✅ |
| shop-12taxpu | マリオ・カフェ&ストア | `mario-cafe-and-store` | "Mario Café & Store" | ✅ |
| shop-1yvdndz | メルズ・ドライブイン | `mels-drive-in` | "Mel's Drive-In" | ✅ |
| shop-ui13qw | ヨッシー・スナック・アイランド | `yoshis-snack-island` | "Yoshi's Snack Island" | ✅ |
| shop-mhw30e | ルイズN.Y.ピザパーラー | `louies-ny-pizza-parlor` | "Louie's N.Y. Pizza Parlor" | ✅ |
| shop-nokw9 | 三本の箒 | `three-broomsticks` | "Three Broomsticks" | ✅ HP公式名 |

### provisional / needs_review 判定（23件）— 根拠確認

| 分類 | 件数 | 代表例 | 判定 |
|---|---|---|---|
| `food-cart`（汎用 URL）| 17件 | shop-1d7mcxr、shop-1og3n66 等 | ✅ 公式名が確認できないため妥当 |
| `seasonal-food`（汎用 URL）| 2件 | shop-8r3pag、shop-zt1x7c | ✅ |
| `kids-menu`（汎用 URL）| 2件 | shop-ztyaw1、shop-3v2j9p | ✅ |
| イベント URL（conan 等）| 1件 | shop-1b3f2nw | ✅ 一時的イベント店舗、provisional 妥当 |
| 店舗未確認 | 2件 | shop-1tt48e8、shop-1ielufv | ✅ URL スラッグから推定、needs_review 妥当 |

### 特記エントリの品質評価

| shop.id | 日本語名 | 評価 |
|---|---|---|
| shop-ztyaw1 | `・バックロット・カフェ` | crawler の先頭 `・` 不備はそのまま。en: "Backlot Café" は妥当。provisional ✅ |
| shop-dvw6dt | `デリシャス・ミー! ザ・クッキー・キッチン`（cart、URL: food-cart）| shop-1i0x5ad と同名だが URL が汎用 → provisional。翻訳は同一で問題なし ✅ |
| shop-1b3f2nw | `高級レストラン`（コナンイベント URL）| "Premium Restaurant" / `高級餐廳` — 日本語原文と意味が一致、provisional/needs_review ✅ |
| shop-1tt48e8 | `店舗未確認`（foodCount: 40）| "Seasonal Food (Venue TBD)" — catch-all として適切な表現 ✅ |
| shop-1ielufv | `店舗未確認`（URL: jungle-beat-shakes）| "Jungle Beat Shakes" — URL スラッグから名前を推定、needs_review ✅ |

**機械翻訳 verified 扱い:** 確認なし ✅

---

## 4. カバレッジ確認 ✅

Codex 報告の `npx ts-node scripts/check-translation-coverage.ts` 実行結果:

```
=== Food Translation Coverage ===
total:        294
translated:   0
missing:      294
verified:     0
needs_review: 0
orphan:       0

=== Store Translation Coverage ===
total:        42
translated:   42
missing:      0
verified:     19
needs_review: 23
orphan:       0
```

| 確認項目 | 期待値 | 実績 | 判定 |
|---|---|---|---|
| store total | 42 | 42 | ✅ |
| store translated | 42 | 42 | ✅ 全件 en/ko/zh-TW あり |
| store missing | 0 | 0 | ✅ |
| store orphan | 0 | 0 | ✅ 翻訳キーが全件 generated JSON に存在 |
| store verified | 19 | 19 | ✅ |
| store needs_review | 23 | 23 | ✅ |
| food 側（変更なし）| translated: 0 / missing: 294 | 一致 | ✅ |

---

## 5. ビルド・表示確認 ✅

| 確認 | 結果 |
|---|---|
| `npm run lint` | ✅ 成功 |
| `npm run typecheck` | ✅ 成功 |
| `npm run build` | ✅ 成功 |
| `/` 表示変化なし | ✅ |
| `/stores` 店舗名が日本語のまま | ✅ UI 未反映は正しい |
| `/foods` 商品名・店舗名が日本語のまま | ✅ |
| `/settings` 表示崩れなし | ✅ |
| i18n Phase B / C 維持 | ✅ |
| Home Phase D / C+ 維持 | ✅ |
| 店舗ID衝突修正 v1.1 維持 | ✅ |

---

## 判定

**承認**

`store-names.json` 1ファイルのみの変更でスコープ遵守。全42件の ID が `shops.generated.json` に対応（orphan: 0 / missing: 0）。フィールド構成（en / ko / zh-TW / _source / _status）が全件完備。`_source: "official"` は URL スラッグが固有名を示す店舗のみ（19件）に適用され、汎用 URL・イベント URL・`店舗未確認` は `provisional / needs_review`（23件）と適切に区別されている。機械翻訳の verified 扱いなし。

---

## 申し送り

1. **次フェーズ（B3）**: `/stores` / `/stores/[id]` に `getShopNameI18n` を接続。UI 反映はこの段階から開始
2. **`shop-dvw6dt`（Delicious Me! カート版）と `shop-1i0x5ad` / `shop-1f4jraw`（レストラン版）**: 翻訳は同一で問題ないが、将来 crawler が3件を1件に統合する場合は orphan 検出で補足可能
3. **`shop-1b3f2nw`（高級レストラン/コナンイベント）**: イベント終了後に廃番になる可能性あり。orphan チェックで検出される
4. **ko/zh-TW の全件 needs_review**: B3 以降で表示に接続した後、ネイティブ確認を経て `verified` に昇格させる運用を推奨
