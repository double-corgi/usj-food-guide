# 設計レビュー証跡: スマホ /foods 広告を商品一覧直前へ移動

- **対象commit**: `bd3d19254ddc5cac183379e7dc3b89ed452cd45a`
- **commit message**: `fix: move mobile ad before food list`
- **レビュー担当**: Claude（設計・レビュー）
- **レビュー日**: 2026-06-21
- **判定**: ✅ **承認**

---

## 変更内容（実diff）

`git show --stat bd3d192` → **2 files changed, 14 insertions(+), 15 deletions(-)**

### `app/foods/page.tsx`
- `import { AdSlot }` を削除し、返却をフラグメント無しの素の `<FoodGrid .../>` に戻す。
- 末尾の `<AdSlot slotId="foods-bottom" className="md:hidden" />` を**削除**。
- FoodGrid の props は完全に同一。

### `components/food-grid.tsx`
- `import { AdSlot }` を追加。
- フィルター/ソート操作ブロックの直後・商品カード一覧の直前に
  `<AdSlot slotId="foods-list-before" className="md:hidden" />` を1枠挿入。
- ロジック（state・フィルタ・ソート・件数・load more）は無変更。

---

## 配置順序の検証（観点6の要）

`components/food-grid.tsx` のレンダリング順を実コードで確認:

| 行 | 要素 |
|---|---|
| ~205 | 件数表示 `t("foods.resultCount", { count: filteredFoods.length })` |
| ~250–317 | 検索/フィルター/ソート コントロール（select・TogglePill 群） |
| 319 | エラー表示（条件付き） |
| **321** | **`<AdSlot slotId="foods-list-before" className="md:hidden" />`** |
| 323–344 | `!ready`→スケルトン / `filteredFoods>0`→カードグリッド / else→該当なし |

→ **件数表示・検索・フィルターの後、商品カード一覧の前**に自然配置。指定どおり。✅

---

## ビューポート別の広告表示

| ページ | モバイル | デスクトップ |
|---|---|---|
| /foods | `foods-list-before` インライン（`md:hidden`で表示）/ 固定`global-bottom`は `hidden` → **計1** | インライン非表示 / 固定`global-bottom` `md:flex` → **計1** |
| その他 | なし / 固定 hidden → **0** | 固定1 → **1** |

→ 各ビューポートで最大1枠。二重表示なし。✅

---

## レビュー観点ごとの判定

| # | 観点 | 結果 | 根拠 |
|---|------|------|------|
| 1 | 変更が foods/page.tsx と food-grid.tsx のみか | ✅ | `git show --stat` で2ファイル |
| 2 | app/layout.tsx を変更していないか | ✅ | diff になし（`global-bottom` 固定枠は据え置き） |
| 3 | components/ad-slot.tsx を変更していないか | ✅ | diff になし |
| 4 | /foods 末尾の広告が削除されているか | ✅ | `foods-bottom` を foods/page.tsx から削除、素の FoodGrid に復帰 |
| 5 | スマホ /foods の広告が一覧直前へ移動しているか | ✅ | food-grid 内に `foods-list-before`（`md:hidden`＝モバイルのみ表示） |
| 6 | 件数・検索・フィルターの後、カード一覧の前に配置か | ✅ | 上記レンダリング順で確認 |
| 7 | 広告枠が1枠だけか | ✅ | `foods-list-before` 1個。各ビューポート最大1枠 |
| 8 | PC固定広告が維持されているか | ✅ | layout の `global-bottom` `variant="fixed"`（`md:flex`）据え置き |
| 9 | モバイル固定広告が復活していないか | ✅ | ad-slot.tsx 不変＝fixed は `hidden md:flex` のまま。モバイル非表示 |
| 10 | FoodGrid の検索/フィルタ/ソート/一覧ロジックを壊していないか | ✅ | 挿入は JSX 兄弟1行＋import のみ。state/算出ロジック無変更。props 不変 |
| 11 | 下部ナビ構造を変更していないか | ✅ | app-header.tsx 不変 |
| 12 | モバイルでナビと広告が重ならない設計か | ✅ | 広告は一覧上部（フィルタ直後）の通常フロー。下部ナビとは画面上で離れ、重なりなし |
| 13 | 「広告」表記が維持されているか | ✅ | inline variant が「広告」ラベル＋プレースホルダーを描画 |
| 14 | data-ad-slot が維持されているか | ✅ | `data-ad-slot="foods-list-before"` |
| 15 | クリック不可・外部通信なしのままか | ✅ | inline は link/onClick なしの静的表示。外部通信なし |
| 16 | 本番広告/AdSense/SDK/外部script/iframe が無いか | ✅ | いずれも無し |
| 17 | data/translations / generated JSON / DB / crawler に触れていないか | ✅ | diff になし |
| 18 | package.json を変更していないか | ✅ | diff になし |
| 19 | lint / typecheck / build / coverage が成功しているか | ✅ | Codex報告。UIのみで整合 |
| 20 | Food/Store Coverage が期待値から変化していないか | ✅ | UIのみ。期待値と整合 |

---

## 確認に用いた検証コマンド（証跡）

- `git show --stat bd3d192` / `git show bd3d192` → 全diff
- `sed -n '280,360p' components/food-grid.tsx` → 配置順（件数→フィルタ→ad→カード）を確認
- `grep -nE "resultCount|filteredFoods.length" components/food-grid.tsx` → 件数表示が広告より前（L205）であることを確認

---

## 補足（非ブロッキング）

判定（承認）には影響しない。

1. **全状態で広告が表示される**: AdSlot は `!ready`（スケルトン）・該当なし（no match）状態でもカード領域の上に表示される。プレースホルダーとしては問題ないが、実広告化(Phase 3)時は「該当0件」画面でも広告が出る挙動の可否を一度確認するとよい。
2. **一覧上部 in-feed の位置**: フィルタ直後・1行目カードの直前という位置は視認性が高く収益期待は上がる一方、ファーストビューを押し下げる。実広告の高さ次第ではカード到達が遅くなるため、実広告化時に高さ・余白を再確認推奨（現状は h-20 と控えめで問題なし）。
3. **slotId 変更**: `foods-bottom` → `foods-list-before` に変わった。差し替え対象の識別子が変わる点のみ記録（実害なし）。

---

## 結論

スマホ /foods のインライン広告が、件数・検索・フィルターの後／商品カード一覧の前へ自然に移動し、末尾の `foods-bottom` は削除。PC固定広告(`global-bottom`)は維持、モバイル固定広告は非表示のまま。変更は対象2ファイルに限定、FoodGrid のロジック・layout・ad-slot・ナビ・翻訳・generated JSON への副作用なし。各ビューポートで広告は最大1枠、ナビ非干渉、本番広告コードなし、Coverage 不変。

**判定: 承認**

次の `/goal` は本証跡の確認後に別途作成する（本タスクでは作成しない）。
