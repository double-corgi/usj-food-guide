# Codex Goal: UI Refresh Follow-up — ナビ色・画像比率・eaten 表示件数

**ファイル:** `docs/codex-goal-ui-refresh-follow-up-v1.md`
**ステータス:** Codex 実装待ち
**設計書:** `docs/ui-refresh-follow-up-design-v1.md`
**リスクレベル:** 低（合計 4行以内の変更）
**前提:** UI Refresh Phase 1 / 2 / 3 承認済み・commit 済み

---

## 目的

UI Refresh Phase 1〜3 後に残った軽微な未解決点を 3 件修正する。

1. 下部ナビ非アクティブ色: `text-slate-400` → `text-slate-500`（コントラスト改善）
2. FoodCard 画像比率: `aspect-[4/3]` → `aspect-square`（白余白を減らし食べ物が映える）
3. eaten area / genre モードの表示件数: `slice(0, 4)` → `slice(0, 20)`（コレクション棚の密度感向上）

---

## 禁止事項

- ロジック変更禁止（useFoodLogs・use-food-logs の保存/削除処理・フィルタ・ソート・重複排除）
- i18n ファイルへの変更禁止
- generated JSON・DB・翻訳ファイルの変更禁止
- FoodImage / food-detail.tsx の変更禁止（Phase 3 の成果を壊さない）
- このゴールのスコープ外のファイル変更禁止
- `docs/codex-goal-i18n-store-name-display-v1.md` を commit に含めない（B3 別件）
- URL / localStorage schema の変更禁止
- スクロールジャンプ修正は今回のスコープ外（別件）

---

## Git 運用

### 作業開始前

```bash
git status --short
git status --short --branch
```

**未コミット変更の確認:**
- `docs/codex-goal-i18n-store-name-display-v1.md` だけが未コミットの場合: B3 別件のため触らず続行
- それ以外のファイルに未コミット変更がある場合: 変更内容を確認し、この goal と無関係なら停止して報告

### 作業完了後

```bash
# 変更したファイルを個別に追加（git add . は使わない）
git add components/app-header.tsx
git add components/food-card.tsx
git add components/eaten-experience.tsx

git commit -m "implement-ui-refresh-follow-up"
git push
```

---

## タスク A: 下部ナビ非アクティブ色

**ファイル:** `components/app-header.tsx`

**変更前の確認:**

```bash
grep -n "text-slate-400" components/app-header.tsx
```

非アクティブ nav リンクの className に `text-slate-400` が存在することを確認する。

**変更内容:**

```
text-slate-400
```
↓
```
text-slate-500
```

対象は非アクティブ nav リンクの `text-slate-400` のみ。`hover:bg-white/70` / `active:bg-mint` 等の状態クラスは変更しない。

**注意:** `text-slate-400` が複数箇所にある場合は、非アクティブ nav リンクの箇所のみ変更すること。他の箇所（ラベル・バッジ等）は変更しない。

---

## タスク B: FoodCard 画像比率

**ファイル:** `components/food-card.tsx`

**変更前の確認:**

```bash
grep -n "aspect-\[4/3\]" components/food-card.tsx
```

**変更内容:**

```tsx
<div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-white">
```
↓
```tsx
<div className="relative aspect-square shrink-0 overflow-hidden bg-white">
```

- `aspect-[4/3]` → `aspect-square`
- `shrink-0` / `overflow-hidden` / `bg-white` は変更しない

**eaten button への影響なし確認:**

`food-card.tsx` の article に `pb-[50px]` が設定されており、eaten button は `absolute bottom-0` で配置されている。`aspect` 比率の変更は eaten button の位置に影響しない。

**代替案（aspect-square で白余白が気になる場合）:**

実機確認で `aspect-square` が縦に大きすぎると判断した場合は `aspect-[3/4]` も許容。ただし完了報告で採用した比率と理由を明記すること。

---

## タスク C: eaten area / genre 表示件数

**ファイル:** `components/eaten-experience.tsx`

**変更前の確認:**

```bash
grep -n "slice(0, 4)" components/eaten-experience.tsx
```

`buildAlbumSections` 関数内の `area` モードと `genre` モードの 2箇所に `items.slice(0, 4)` があることを確認する。

**変更内容（2箇所）:**

`area` モード（L379 付近）:
```tsx
records: items.slice(0, 4),
```
↓
```tsx
records: items.slice(0, 20),
```

`genre` モード（L390 付近）:
```tsx
records: items.slice(0, 4),
```
↓
```tsx
records: items.slice(0, 20),
```

**変更してはいけない箇所:**

- `.slice(0, 8)` → グループ数制限（area / genre それぞれ最大 8グループ）。変更しない
- `records.slice(0, 24)` → recent モードの件数制限。変更しない
- `monthlyRecords.slice(0, 36)` → month モードの件数制限。変更しない
- フィルタ・ソート・buildEatenAlbumRecords のロジック。変更しない

**変更行の特定手順:**

```bash
grep -n "items.slice\|records.slice\|monthlyRecords.slice" components/eaten-experience.tsx
```

`items.slice(0, 4)` が 2 箇所あることを確認してから変更する。

---

## 検証手順

### 1. 変更行数の確認

```bash
git diff
```

変更は合計 4行以内（A: 1行 + B: 1行 + C: 2行）であること。ロジック行・import・型定義の変更がないことを確認。

### 2. 変更ファイルの確認

```bash
git diff --stat
```

`components/app-header.tsx` / `components/food-card.tsx` / `components/eaten-experience.tsx` の 3 ファイルのみ変更されていること。

### 3. タスク A の確認

```bash
grep -n "text-slate-500\|text-slate-400" components/app-header.tsx
```

非アクティブ nav リンクが `text-slate-500` になっていること。

### 4. タスク B の確認

```bash
grep -n "aspect-" components/food-card.tsx
```

`aspect-square`（または `aspect-[3/4]`）が設定されていること。`aspect-[4/3]` が残っていないこと。

### 5. タスク C の確認

```bash
grep -n "items.slice\|records.slice\|monthlyRecords.slice" components/eaten-experience.tsx
```

`items.slice(0, 20)` が 2 箇所になっていること。他の slice 件数（24・36 等）が変わっていないこと。

### 6. lint / typecheck / build

```bash
npm run lint
npm run typecheck
npm run build
```

すべて成功すること。

### 7. i18n / data 無変更確認

```bash
git diff --stat -- "lib/i18n/**" "data/translations/**"
```

変更ゼロであること。

---

## 完了報告フォーマット

```
## UI Refresh Follow-up 完了報告

### タスク A: ナビ非アクティブ色
- 変更: text-slate-400 → text-slate-500
- 対象行: app-header.tsx L○○

### タスク B: FoodCard 画像比率
- 変更: aspect-[4/3] → aspect-square（または aspect-[3/4]）
- 採用した理由（aspect-[3/4] を採用した場合）: 

### タスク C: eaten 表示件数
- area モード: items.slice(0, 4) → items.slice(0, 20)（L○○）
- genre モード: items.slice(0, 4) → items.slice(0, 20)（L○○）
- 変更してはいけない slice は維持: YES

### npm run lint
成功 / 失敗

### npm run typecheck
成功 / 失敗

### npm run build
成功 / 失敗

### 変更ファイル一覧・行数
- app-header.tsx: 1行
- food-card.tsx: 1行
- eaten-experience.tsx: 2行
- 合計: 4行

### i18n / data/translations 無変更確認
git diff --stat の出力: 

### docs/codex-goal-i18n-store-name-display-v1.md を commit に含めていない確認
YES

### git commit ハッシュ
xxxxxxx

### git diff --stat 出力
（貼り付け）
```
