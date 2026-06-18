# Design Review: UI Refresh Phase 3 — 食べ物画像表示ルール統一

**対象 commit:** 2c7cdd3 (implement-ui-refresh-phase-3)
**レビュー日:** 2026-06-17
**レビュー担当:** Claude（設計担当 / レビュー担当）

---

## 判定: 承認

---

## 1. スコープ遵守

| 確認項目 | 結果 |
|---|---|
| 変更が food-image / food-card / food-detail の 3 ファイルのみ | ✅ |
| `store-food-list.tsx` 変更なし | ✅ |
| `/eaten` 棚 UI 変更なし | ✅ |
| i18n / data/translations 変更なし | ✅ |
| B3 未追跡ファイル混入なし | ✅ |
| localStorage schema 変更なし | ✅ |
| ロジック変更なし（food log の取得・保存・削除処理）| ✅ |

---

## 2. FoodImage (food-image.tsx) の実装照合

### variant 型定義

```tsx
export type FoodImageVariant = "cover" | "contain" | "card";
```

goal spec と一致。型が `export` されているため呼び出し側でも型安全に使用できる。✅

### props 定義

```tsx
export function FoodImage({
  food, className, alt, eager = false, variant = "card"
}: { ...; variant?: FoodImageVariant; })
```

- `variant` prop 追加 ✅
- デフォルト `"card"` → 後方互換完全維持 ✅
- 既存 props（`className`・`alt`・`eager`）変更なし ✅

### getImageClass の分岐

| variant | real 画像 | placeholder |
|---|---|---|
| `"cover"` | `bg-slate-100 object-cover object-center` | 同左 |
| `"contain"` | `bg-white object-contain` | `bg-white object-contain p-4` |
| `"card"`（default）| `bg-slate-100 object-cover` | `bg-slate-100 object-contain p-6` |

設計書の仕様と完全一致。✅

`"card"` の既存挙動（real: `object-cover` / placeholder: `object-contain p-6`）が `bg-slate-100` ベースで維持されている。後方互換 ✅。

`"contain"` のプレースホルダーが `p-4`（設計書は `p-4` or `p-6` を例示）— 問題なし ✅。

---

## 3. FoodCard (food-card.tsx) の実装照合

### article クラス（L36）

```tsx
className={`group relative min-w-0 overflow-hidden rounded-[1.25rem] bg-white pb-[50px] ring-1 ring-slate-200/70 ...`}
```

- `h-[462px]` 削除 ✅
- `pb-[50px]` 追加 — 後述 ✅

### 画像エリア（L38–39）

```tsx
<div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-white">
  <FoodImage ... variant="contain" />
```

- `h-[252px]` → `aspect-[4/3]` ✅
- `bg-slate-100` → `bg-white`（`variant="contain"` の白背景と統一）✅
- `variant="contain"` 追加 ✅

### テキストエリア（L48）

```tsx
<div className="flex min-h-[160px] min-w-0 flex-col px-3 py-3">
```

旧 `h-[160px]`（固定）→ `min-h-[160px]`（最小高さ）に変更。テキスト量によってエリアが伸びる柔軟なレイアウトになった。✅

### eaten ボタン（L65）

```tsx
<div data-food-card-actions className="absolute inset-x-0 bottom-0 z-10 grid h-[50px] border-t border-slate-100 bg-white px-3 py-2">
```

`absolute inset-x-0 bottom-0` による absolute 配置を維持し、article の `pb-[50px]` でテキストエリアとの重なりを防ぐアプローチ。

これは最小変更での安全な解決策。article が `relative` かつ `pb-[50px]` を持つため、テキスト本文と eaten ボタンが被らない。✅

---

## 4. FoodDetail (food-detail.tsx) の実装照合

### メイン画像（L103）

```tsx
<div className="relative h-[370px] overflow-hidden rounded-[2rem] bg-slate-100 sm:h-[620px]">
  <FoodImage food={food} alt={food.name} eager className="h-full w-full" variant="contain" />
```

- `variant="contain"` 追加 ✅
- `eager` props 維持 ✅
- `className="h-full w-full"` 維持 ✅

`variant="contain"` では getImageClass が `bg-white object-contain` を返す。`h-full w-full` で画像要素がコンテナ全体を埋めるため、外側コンテナの `bg-slate-100` は実質見えない。実動作に問題なし。✅

### RelatedRail の FoodImage（L385）

```tsx
<FoodImage food={food} className="h-full w-full" />
```

`variant` 未指定 → デフォルト `"card"` → 既存挙動維持。goal では「変更しない」とされている箇所で正しい判断。✅

---

## 5. 後方互換の確認

`variant` を指定していない既存の全呼び出し（RelatedRail, store-food-list, eaten-experience, home のレール等）はすべてデフォルト `"card"` で動作し、Phase 3 前と完全に同じ挙動になる。✅

---

## 6. 表示品質の評価

### FoodCard の高さ変化（モバイル 390px、2列表示）

| 要素 | 変更前 | 変更後 |
|---|---|---|
| カード全高 | 固定 462px | 可変（≈ 340px 前後）|
| 画像高さ | 固定 252px | aspect-[4/3] → カード幅 ≈ 173px → 画像高 ≈ 130px |
| テキストエリア | 固定 160px | min-h-160px（可変）|
| eaten button | 50px | 50px（`pb-[50px]` で確保）|

画像高さが 252px → 130px と大幅に縮小している。ただし `variant="contain"` + `bg-white` により食べ物全体が歪みなく表示される。旧来の `object-cover` による過度なズームは解消された。

1画面に表示できるカード数が増える（縦幅圧縮）副次効果もある。

### FoodDetail のメイン画像

`h-[370px] sm:h-[620px]` の固定高さコンテナに `object-contain` で食べ物全体が収まる。パーク感のある広い画像エリアで食べ物が全体的に見える体験が実現。✅

---

## 7. 注意点・申し送り

### [低] FoodCard の aspect-[4/3] 画像高さ

モバイル 2列での画像高さが約 130px と旧来（252px）の約半分になった。食べ物全体表示という目的は達成されているが、縦長の食べ物画像（ドリンク等）では天地余白が目立つ可能性がある。実機確認推奨。問題があれば `aspect-[3/2]`（より高く）への調整を検討。

### [低] FoodDetail 外側コンテナの bg-slate-100

`variant="contain"` 適用後、画像の `bg-white` が前面に出るため実質的に白背景で表示される。外側コンテナ `bg-slate-100` は `h-full w-full` の画像要素に隠れており視覚的問題なし。ただし将来的に整合性を取りたい場合は外側コンテナも `bg-white` へ変更すること。

---

## 8. 検証結果の確認

| 項目 | 報告値 |
|---|---|
| npm run lint | 成功 |
| npm run typecheck | 成功 |
| npm run build | 成功 |
| 全主要ページ 200 OK | / / /foods / /foods/food-62sv41 / /eaten / /areas / /stores / /settings |
| h-[462px] / h-[252px] 削除確認 | 成功 |
| aspect-[4/3] 追加確認 | 成功 |
| variant="contain" 追加確認 | 成功 |

---

## 9. 総評

Phase 3 の実装は設計書・goal の仕様を忠実に実現している。特に `pb-[50px]` による eaten button の安全な維持・`min-h-[160px]` による柔軟なテキストエリアへの変更・RelatedRail 等の後方互換維持は、最小変更で安全に目標を達成した判断として適切。スコープ遵守・既存機能破壊なし・lint / typecheck / build 全通過。

UI Refresh Phase 1 / 2 / 3 の一連の実装により、白背景・明るいナビ・コレクション棚・食べ物全体画像表示という設計目標が実装された。

---

## 証跡

- 実装 commit: `2c7cdd3`
- レビュー対象ファイル: `components/food-image.tsx`（44行）/ `components/food-card.tsx`（154行）/ `components/food-detail.tsx`（428行）全読了
- 未変更確認: `store-food-list.tsx` / i18n / data/translations / generated JSON / `/eaten` 棚 UI
