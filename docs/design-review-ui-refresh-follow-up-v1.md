# Design Review: UI Refresh Follow-up — ナビ色・画像比率・eaten 表示件数

**対象 commit:** b5820d4 (implement-ui-refresh-follow-up)
**レビュー日:** 2026-06-17
**レビュー担当:** Claude（設計担当 / レビュー担当）

---

## 判定: 承認

---

## 1. スコープ遵守

| 確認項目 | 結果 |
|---|---|
| 変更が 3 ファイル（app-header / food-card / eaten-experience）のみ | ✅ |
| 変更が合計 4 行以内 | ✅ 合計 4 行（A:1 + B:1 + C:2）|
| FoodImage / food-detail.tsx 変更なし | ✅ |
| useFoodLogs / localStorage schema 変更なし | ✅ |
| i18n / data/translations / generated JSON 変更なし | ✅ |
| B3 未追跡ファイル混入なし | ✅ |

---

## 2. タスク A: 下部ナビ非アクティブ色（app-header.tsx）

**実コード（L86）:**

```tsx
active ? "bg-mint text-park" : "text-slate-500 hover:bg-white/70 active:bg-mint"
```

- `text-slate-400` → `text-slate-500` ✅
- `hover:bg-white/70` / `active:bg-mint` / `active:scale-95` / `bg-mint text-park`（active）変更なし ✅
- `text-slate-400` が他箇所に残っていないことをコード上で確認（nav リンク以外の `text-slate-400` はそのまま）✅

`text-slate-500`（`#64748b`）は白背景上でコントラスト比 ≈ 4.5:1 ちょうど。WCAG AA 基準を満たす。アクティブ状態 `text-park` との差別化も維持されている。✅

---

## 3. タスク B: FoodCard 画像比率（food-card.tsx）

**実コード（L38）:**

```tsx
<div className="relative aspect-square shrink-0 overflow-hidden bg-white">
```

- `aspect-[4/3]` → `aspect-square` ✅
- `shrink-0` / `overflow-hidden` / `bg-white` 変更なし ✅
- `variant="contain"` は `FoodImage` 側に設定されており、今回の変更外で維持されている ✅

**eaten button への影響確認:**

`article` の `pb-[50px]` と `absolute inset-x-0 bottom-0` の eaten button は aspect ratio 変更の影響を受けない。食べたボタン配置は維持されている ✅。

**モバイル 2列（幅 ≈ 173px）での画像高さ変化:**

| 比率 | 高さ |
|---|---|
| `aspect-[4/3]`（旧） | ≈ 130px |
| `aspect-square`（現） | ≈ 173px |

+43px。食べ物写真の上下余白（`object-contain` による白余白）が減り、実画像の面積が増える。✅

---

## 4. タスク C: eaten 表示件数（eaten-experience.tsx）

**実コード確認:**

```
area モード  L379: items.slice(0, 20)  ✅
genre モード L390: items.slice(0, 20)  ✅
```

**維持されているスライス:**

| 箇所 | 値 | 確認 |
|---|---|---|
| recentLogs（L49） | `slice(0, 5)` | ✅ 維持 |
| recent モード（L366） | `records.slice(0, 24)` | ✅ 維持 |
| month モード（L370） | `monthlyRecords.slice(0, 36)` | ✅ 維持 |
| グループ数制限・area（L381） | `.slice(0, 8)` | ✅ 維持 |
| グループ数制限・genre（L392） | `.slice(0, 8)` | ✅ 維持 |

`all` モードは `records` 全件返し（変更前後ともスライスなし）✅。

5列グリッドで各グループ最大 20件 = 最大 4行。「area」「genre」モードでコレクション棚の密度感が実現される。グループ数制限は 8グループのまま維持されているため、最大 8グループ × 20件 = 160個の表示上限となる。問題なし ✅。

---

## 5. 既存機能への影響

| 確認項目 | 結果 |
|---|---|
| Phase 1（白背景・ナビ）| ✅ タスク A は Phase 1 の微調整のみ。他の Phase 1 変更を維持 |
| Phase 2（eaten 棚グリッド・CollectionThumb）| ✅ `grid-cols-5 gap-1` / `CollectionThumb` は変更なし |
| Phase 3（FoodImage variant・FoodCard pb-[50px]）| ✅ `variant="contain"` / `aspect-square` の bg-white / `pb-[50px]` すべて維持 |
| i18n Phase B / C / D / C+ | ✅ 対象ファイルに i18n 処理なし |
| 店舗 ID 衝突修正 v1.1 | ✅ store-utils / food-utils 変更なし |

---

## 6. 総評

実装は goal 仕様と完全一致。3 タスク × 合計 4 行の変更で、各タスクが独立して正確に適用されている。維持すべきスライス件数（24・36・8・5）がすべてそのまま残っていることも実コードで確認した。lint / typecheck / build 全通過。

UI Refresh Phase 1〜3 および Follow-up の一連の実装により、白背景・明るいナビ・コレクション棚・食べ物全体表示というデザイン目標が完成した。

---

## 証跡

- 実装 commit: `b5820d4`
- レビュー対象ファイル: `components/app-header.tsx`（L86 確認）/ `components/food-card.tsx`（L38 確認）/ `components/eaten-experience.tsx`（全 slice 確認）
- 未変更確認: i18n / data/translations / generated JSON / FoodImage / food-detail.tsx / useFoodLogs
