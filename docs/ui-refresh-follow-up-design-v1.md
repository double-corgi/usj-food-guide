# UI Refresh Follow-up 設計書 v1

**作成日:** 2026-06-17
**前提:** UI Refresh Phase 1 / 2 / 3 承認済み・commit 済み
**ステータス:** 設計確定（実装前）

---

## 1. 目的

UI Refresh Phase 1〜3 実装後に残った軽微〜中程度の未解決点を整理し、安全に追加改善する。Phase 1〜3 の成果を壊さないことを最優先とする。

---

## 2. 候補 4 項目の分析

### 項目 1: スクロールジャンプ修正

**現象:** `/foods` ページで「食べた」ボタンを押すとスクロール位置が飛ぶ可能性がある。

**Phase 2 調査結果:**
- `router.refresh` / `scrollTo` / `scrollIntoView` は対象ファイル全件で未検出
- 原因を特定できなかったため未修正

**判断: 今回の goal から除外。別件として扱う。**

理由:
- 原因が未特定のため、修正内容が不確定
- 修正に React state・再マウント・Next.js Router のレイヤーが絡む可能性がある
- 誤った修正で「食べた」機能の動作を壊すリスクが他の項目より高い
- まず「現在もジャンプが実際に起きているか」を実機確認してから別 goal で設計する

---

### 項目 2: eaten area / genre モードの表示件数

**現状の問題:**
```tsx
// eaten-experience.tsx L379, L390
records: items.slice(0, 4)   // 各グループ最大 4 件
```

5列グリッドで各グループ 4 件 = 1行未満。コレクション棚として密度が薄い。

**変更内容:** `slice(0, 4)` → `slice(0, 20)`

5列 × 4行 = 20件/グループ。棚としての密度感が生まれる。グループ数制限 `.slice(0, 8)` はそのまま維持。

**リスク評価: 低**
- 変更箇所: `eaten-experience.tsx` の 2行のみ（L379・L390）
- ロジック（フィルタ・ソート・canonical 重複排除）は変更しない
- `total` カウント表示はそのまま（「4/30 件」→「20/30 件」のように件数が増える）
- Phase 2 の実装（グリッド切替・CollectionThumb）を壊さない

**判断: 今回の goal に含める（タスク C）。**

---

### 項目 3: FoodCard 画像高さ調整

**現状:**
```tsx
// food-card.tsx L38
<div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-white">
```

`aspect-[4/3]`（横長）はモバイル 2列（カード幅 ≈ 173px）で画像高さ ≈ 130px。旧固定高さ 252px の約半分。

`variant="contain"` + `bg-white` により食べ物全体が見えるようになったが、横長比率で縦に詰まっている。食べ物写真は正方形〜縦長が多いため、横長コンテナではレターボックス（白余白）が目立ちやすい。

**変更内容:** `aspect-[4/3]` → `aspect-square`

| 比率 | モバイル幅 173px での高さ | 特徴 |
|---|---|---|
| `aspect-[4/3]`（現状）| 130px | 横長。白余白が上下に発生しやすい |
| `aspect-square` | 173px | 正方形。汎用的。eaten 棚の CollectionThumb と統一感 |
| `aspect-[3/4]` | 230px | 縦長。ドリンク等に最適だが全体として高くなりすぎる |

**リスク評価: 低**
- 変更箇所: `food-card.tsx` L38 の 1行のみ
- eaten button は `absolute bottom-0` + article の `pb-[50px]` で維持されているため、aspect ratio 変更の影響なし
- `min-h-[160px]` のテキストエリアも aspect ratio 変更の影響なし

**判断: 今回の goal に含める（タスク B）。第一候補は `aspect-square`。実機で問題があれば `aspect-[3/4]` も許容。**

---

### 項目 4: 下部ナビ非アクティブ色の調整

**現状:**
```tsx
// app-header.tsx L86
"text-slate-400 hover:bg-white/70 active:bg-mint"
```

Phase 1 で `text-slate-500` → `text-slate-400` に変更した。コントラスト比 ≈ 3.1:1（WCAG AA 4.5:1 を下回る）。実機で文字が薄すぎる場合の修正候補。

**変更内容:** `text-slate-400` → `text-slate-500` への差し戻し

**リスク評価: 極低**
- 変更箇所: `app-header.tsx` L86 の 1箇所のみ
- Phase 1 への微調整（差し戻し）
- WCAG 観点での改善

**判断: 今回の goal に含める（タスク A）。最低リスクのため最初に適用。**

---

## 3. 項目のまとめ判断

| 項目 | 今回の goal | 理由 |
|---|---|---|
| スクロールジャンプ | ❌ 除外 | 原因未特定。別 goal で調査 |
| area/genre 表示件数 | ✅ 含める（タスク C）| 2行変更・低リスク |
| FoodCard 画像高さ | ✅ 含める（タスク B）| 1行変更・低リスク |
| ナビ非アクティブ色 | ✅ 含める（タスク A）| 1行変更・極低リスク |

**3項目を 1 goal にまとめる。** タスク A・B・C はいずれも独立した変更箇所（異なるファイル or 同一ファイルの別行）であり、まとめても干渉しない。合計変更行数は 4行以内の見込み。

---

## 4. 実装順序

```
タスク A → タスク B → タスク C
```

| 順序 | タスク | ファイル | 変更行数 |
|---|---|---|---|
| 1 | A: ナビ色差し戻し | `components/app-header.tsx` | 1行 |
| 2 | B: FoodCard 画像高さ | `components/food-card.tsx` | 1行 |
| 3 | C: eaten 表示件数 | `components/eaten-experience.tsx` | 2行 |

---

## 5. スコープ外として明記するもの

- スクロールジャンプ修正（調査から別 goal で）
- FoodDetail 外側コンテナ `bg-slate-100` → `bg-white` の整合（Phase 3 申し送り事項、今回は手をつけない）
- `all` / `month` モードのコレクション棚件数（現状は無制限 / 36件で問題なし）
- デスクトップヘッダー `bg-white/78 backdrop-blur-xl` の統一（別フェーズ）
- B3 店舗名翻訳表示（別件）
- i18n / data/translations / generated JSON / DB / crawler（一切変更しない）

---

## 6. Phase 1〜3 への影響確認

| Phase | 影響 |
|---|---|
| Phase 1（白背景・ナビ）| タスク A が Phase 1 の微調整。Phase 1 の他の変更は維持 |
| Phase 2（eaten 棚）| タスク C が Phase 2 の件数調整。棚グリッド・CollectionThumb は維持 |
| Phase 3（画像表示）| タスク B が Phase 3 の比率調整。`variant="contain"` / `pb-[50px]` は維持 |
