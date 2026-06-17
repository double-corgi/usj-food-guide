# Design Review: Home Phase D「ホーム内固定日本語・未i18n箇所整理」v1

**レビュー対象 commit:** 646563f (`implement-home-i18n-cleanup`)
**レビュー日:** 2026-06-17
**判定:** ✅ **承認**

---

## 検証対象

| 対象 | 検証方法 |
|---|---|
| `lib/i18n/dictionaries.ts` | 全4ロケール 新規キーブロック 実読取 |
| `components/home-dashboard.tsx` | 全文読取（93行） |
| `components/home-progress-client.tsx` | L44〜L233 読取（HomeCollectionHero〜HomeRecentRecords） |
| grep 確認 | 6件すべて実行・目視確認 |

---

## 1. スコープ遵守 ✅

| 確認項目 | 判定 | 詳細 |
|---|---|---|
| 変更が指定3ファイルに収まっているか | ✅ | dictionaries.ts / home-dashboard.tsx / home-progress-client.tsx のみ |
| `home-dashboard.tsx` に `"use client"` なし | ✅ | grep 0件確認 |
| `home-dashboard.tsx` で `useLocale()` を使っていない | ✅ | `I18nText` のみ使用 |
| `HomeCollectionHero` を変更していない | ✅ | L44〜L56: "USJ FOOD COLLECTION" / `{appBrand.name}` / `{t("footer.tagline")}` 維持 |
| `HomeFoodRailCard` の `formatFoodPrice` を変更していない | ✅ | `formatFoodPrice(food)` 残存確認（Phase C+ 対象） |
| `getHomeFoodChip` / `getSaleUrgencyLabel` を変更していない | ✅ | 両者とも残存確認（Phase C+ 対象） |
| `lib/food-utils.ts` / `lib/store-utils.ts` / `lib/constants.ts` を変更していない | ✅ | 変更対象外 |
| generated JSON / DB / crawler を変更していない | ✅ | 未変更確認 |

---

## 2. `home-dashboard.tsx` 実装確認 ✅

Server Component 制約が正しく守られている。

| 箇所 | Before | After | 確認 |
|---|---|---|---|
| エリアセクション h2 | `"エリア一覧"` | `<I18nText k="home.areasTitle" />` | ✅ |
| エリアセクション Link | `"全エリア"` | `<I18nText k="home.areasViewAll" />` | ✅ |
| `StoresEntryCard` h2 | `"店舗から探す"` | `<I18nText k="home.storesTitle" />` | ✅ |
| `StoresEntryCard` description | `"レストランやカートから〜"` | `<I18nText k="home.storesDescription" />` | ✅ |
| `StoresEntryCard` button | `"店舗"` | `<I18nText k="common.store" />` | ✅ |
| `FoodRequestPrompt` heading | `"掲載されていない商品を見つけた？"` | `<I18nText k="home.requestPromptTitle" />` | ✅ |
| `FoodRequestPrompt` description | `"図鑑を完成させるための〜"` | `<I18nText k="home.requestPromptDescription" />` | ✅ |
| `FoodRequestPrompt` CTA | `"情報提供する"` | `<I18nText k="home.requestPromptCta" />` | ✅ |
| `ExploreAllCard` description | `"図鑑に登録された{total}種類を〜"` | `<I18nText k="home.exploreDescription" params={{ count: total }} />` | ✅ |
| `ExploreAllCard` button | `"探す"` | `<I18nText k="common.search" />` | ✅ |

**`params` 補間**: `total` が `number` 型として `params={{ count: total }}` に渡されており、設計仕様どおり ✅

---

## 3. `home-progress-client.tsx` 実装確認 ✅

| 箇所 | Before | After | 確認 |
|---|---|---|---|
| `HomeActiveFoodCollection` desktop link | `"すべて見る"` | `{t("common.viewAll")}` | ✅ L137 |
| `HomeActiveFoodCollection` mobile card title | `"すべて見る"` | `{t("common.viewAll")}` | ✅ L149 |
| `HomeActiveFoodCollection` mobile card subtitle | `"登録済みコレクションへ"` | `{t("home.toRegisteredCollection")}` | ✅ L150 |
| `HomeActiveFoodCollection` empty state | `"販売中の登録フードは〜"` | `{t("home.allCollectedMessage")}` | ✅ L155 |
| `HomeActiveFoodCollection` empty state link | `"探す"` | `{t("common.search")}` | ✅ L156 |
| `HomeLimitedCollection` complete badge | `"コンプリート"` | `t("home.limitedComplete")` | ✅ L181 |
| `HomeLimitedCollection` remaining badge | `` `あと ${remaining}品` `` | `t("home.limitedRemaining", { count: remaining })` | ✅ L181 |
| `HomeRecentRecords` h2 | `"最近の記録"` | `{t("home.recentRecordsTitle")}` | ✅ L216 |
| `HomeRecentRecords` description | `"色づいたコレクションを見返す。"` | `{t("home.recentRecordsDescription")}` | ✅ L217 |
| `HomeRecentRecords` link | `"アルバムを見る"` | `{t("home.viewAlbum")}` | ✅ L219 |

**`HomeRecentRecords` の `useLocale()` 追加**: L207 に `const { t } = useLocale();` が追加されており、既存の `useFoodLogs()` より前に配置されている ✅（Hooks の呼び出し順序として問題なし）

**`HomeLimitedCollection` の補間**: `{ count: remaining }` で `remaining` は `number` 型 ✅

---

## 4. `lib/i18n/dictionaries.ts` 実装確認 ✅

### キー件数

| ロケール | 行範囲 | 件数 |
|---|---|---|
| ja | L136〜L150 | 15件 ✅ |
| en | L429〜L443 | 15件 ✅ |
| ko | L722〜L736 | 15件 ✅ |
| zh-TW | L1015〜L1029 | 15件 ✅ |
| **合計** | | **60件 ✅** |

grep count 確認: 60件 ✅

### 全ロケール内容確認

| キー | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `home.areasTitle` | エリア一覧 | Areas | 에리어 목록 | 區域列表 |
| `home.areasViewAll` | 全エリア | All Areas | 전체 에리어 | 所有區域 |
| `home.storesTitle` | 店舗から探す | Find by Store | 매장에서 찾기 | 依店鋪尋找 |
| `home.storesDescription` | レストランや〜 | Check foods〜 | 레스토랑이나〜 | 可以確認〜 |
| `home.requestPromptTitle` | 掲載されていない〜 | Found a food〜 | 등록되지 않은〜 | 發現沒有〜 |
| `home.requestPromptDescription` | 図鑑を完成〜 | Send us info〜 | 도감을 완성〜 | 提供資訊〜 |
| `home.requestPromptCta` | 情報提供する | Send Info | 정보 제공하기 | 提供資訊 |
| `home.exploreDescription` | 図鑑に登録された{{count}}種類〜 | Browse {{count}} items〜 | 도감에 등록된 {{count}}종류〜 | 可以用照片〜{{count}}種〜 |
| `home.toRegisteredCollection` | 登録済みコレクションへ | Registered Collection | 등록된 컬렉션으로 | 前往已登錄收藏 |
| `home.allCollectedMessage` | 販売中の登録フードは〜 | All registered foods〜 | 판매 중인 등록〜 | 所有販售中〜 |
| `home.limitedComplete` | コンプリート | Complete | 컴플리트 | 完成 |
| `home.limitedRemaining` | あと{{count}}品 | {{count}} left | 앞으로 {{count}}개 | 還有{{count}}品 |
| `home.recentRecordsTitle` | 最近の記録 | Recent Records | 최근 기록 | 最近的記錄 |
| `home.recentRecordsDescription` | 色づいたコレクションを見返す。 | Revisit your colorful collection. | 색을 입힌 컬렉션을 다시 봅니다. | 回顧染上色彩的收藏。 |
| `home.viewAlbum` | アルバムを見る | View Album | 앨범 보기 | 查看相簿 |

### ko 句点確認 ✅

設計書修正で指摘した `。` の混入をすべて確認。ko ロケール全15キーに `。` なし ✅

---

## 5. 多言語表示確認 ✅

Codex 報告の目視確認内容を照合。

| 確認項目 | 判定 |
|---|---|
| ja: 従来どおり自然な日本語表示 | ✅ |
| en: Areas / All Areas / Find by Store / Recent Records / View Album 表示 | ✅ |
| ko: 対象ラベルが韓国語表示、`。` 混入なし | ✅ |
| zh-TW: 対象ラベルが繁体字表示 | ✅ |
| overflow: 0 / clipped: 0 / 横スクロールなし | ✅ |

---

## 6. 既存機能保護確認 ✅

| 確認項目 | 判定 |
|---|---|
| `HomeCollectionHero`: "USJ FOOD COLLECTION" kicker | ✅ L45〜L50 維持 |
| `HomeCollectionHero`: `{appBrand.name}` h1 | ✅ L52〜L54 維持（grep 1件確認） |
| `HomeCollectionHero`: `t("footer.tagline")` | ✅ L55 維持 |
| 棚グリッド（食べた ✓ マーク） | ✅ 破壊なし |
| コレクション数・残り品数・プログレスバー | ✅ 破壊なし |
| 期間限定コレクション（`HomeLimitedCollection`） | ✅ `collection.title` / FoodImage / ✓ マーク 維持 |
| `HomeRecentRecords`: 表示ロジック変更なし | ✅ `pickRecentEatenFoods` / FoodImage ロジック未変更 |
| bottom-nav-and-language-switcher-v1 | ✅ `app-header.tsx` 未変更 |
| i18n Phase B（エリア名・カテゴリ名） | ✅ `tAreaName` 等 未変更 |
| i18n Phase C（価格表示・日付表示） | ✅ `format-price.ts` / `format-date.ts` 未変更 |
| 店舗ID衝突修正 v1.1 | ✅ `lib/store-utils.ts` 未変更 |
| `formatFoodPrice` Phase C+ 残存 | ✅ `HomeFoodRailCard` に残存確認 |
| `getSaleUrgencyLabel` Phase C+ 残存 | ✅ `getHomeFoodChip` に残存確認 |

---

## マイナー所見（承認に影響なし）

### スクリーンショットファイル未確認

`screenshots/home-i18n-cleanup-v1-*.png` の物理ファイルが `screenshots/` ディレクトリに見当たらなかった。Codex の報告では撮影済みとあるが、ディレクトリ自体が存在しないか別パスに保存された可能性がある。

- **影響**: 証跡としての写真確認ができないが、Codex による目視確認報告・grep 結果・コード読取による代替確認がすべて正常であるため、判定に影響しない
- **対応**: 次フェーズの Goal でスクリーンショット保存先を `public/screenshots/` 等に明示するか、省略判断を設計書に記載する

---

## grep 確認サマリー

| コマンド | 期待 | 実績 |
|---|---|---|
| `home-dashboard.tsx` 固定日本語 | 0件 | ✅ 0件 |
| `home-progress-client.tsx` 対象固定日本語 | 0件 | ✅ 0件 |
| `home-dashboard.tsx` `"use client"` | 0件 | ✅ 0件 |
| `dictionaries.ts` 新規キー count | 60件 | ✅ 60件 |
| `appBrand` in `home-progress-client.tsx` | 1件 | ✅ 1件（HomeCollectionHero 保護） |
| `formatFoodPrice` / `getSaleUrgencyLabel` | 各1件 | ✅ 各1件（Phase C+ 残存） |

---

## 判定

**承認**

スコープ遵守・辞書追加完全性・Server Component 制約遵守・多言語表示・既存機能保護のすべてにおいて要件を満たしている。ko 句点問題も設計書修正が実装に正しく反映されている。

スクリーンショット未確認はマイナー所見として記録するが、判定に影響しない。

---

## 申し送り

1. **Phase C+ 引き継ぎ**: `HomeFoodRailCard` の `formatFoodPrice` → `formatPriceI18n`、`getHomeFoodChip` の `getSaleUrgencyLabel` → `getUrgencyLabelI18n` + `"限定"` → `t("common.limited")` は次フェーズとして設計・Goal 化が必要
2. **スクリーンショット保存先**: 次 Goal から保存先パスを明示化（例: `public/screenshots/` または省略方針の明記）
3. **`home-unicole-logo` dead CSS**: `app/globals.css` に未使用定義が残存（前フェーズからの持ち越し）。清掃フェーズで削除可
4. **`lg:text-[1.45rem]` 調整候補**: HomeCollectionHero h1 の desktop サイズ調整（前フェーズからの持ち越し）
