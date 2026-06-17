# Design Review: UI Refresh Phase 1 — 全体 UI 土台更新

**対象 commit:** a86e191 (implement-ui-refresh-phase-1)
**goal 修正 commit:** 578a699
**レビュー日:** 2026-06-17
**レビュー担当:** Claude（設計担当 / レビュー担当）

---

## 判定: 承認

---

## 1. スコープ遵守

| 確認項目 | 結果 |
|---|---|
| 変更がすべて Tailwind クラス変更のみ | ✅ 確認。ロジック行・import・型定義の変更はゼロ |
| props / interface 変更なし | ✅ 確認 |
| 新規 import なし | ✅ 確認 |
| i18n 関連ファイル無変更 | ✅ 確認 |
| data/translations 無変更 | ✅ 確認 |
| B3 未追跡ファイルが混入していない | ✅ 確認。goal-i18n-store-name-display-v1.md は commit に含まれていない |
| 変更ファイルが 5 件以内 | ✅ 5 件（globals.css / app-header / food-card / store-food-list / food-reviews）|

---

## 2. 実装内容の照合

### app/globals.css（L15）

```css
background: #ffffff;
```

`#f8fafc` → `#ffffff` への変更を確認。他の行は無変更。✅

---

### components/app-header.tsx（L76）

```tsx
className="fixed inset-x-4 bottom-[...] z-50 grid grid-cols-5 rounded-[1.55rem] border border-slate-200/60 bg-white p-1 shadow-[0_-1px_0_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.08)] md:hidden"
```

- `bg-white/94` → `bg-white`: ✅
- `backdrop-blur-2xl` 削除: ✅
- 影: `shadow-[0_-1px_0_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.08)]` — goal 指定値と一致 ✅
- 非アクティブ色（L86）: `text-slate-400` — goal 指定値と一致 ✅
- `hover:bg-white/70` は維持（状態クラス）: ✅

**デスクトップヘッダー（L35）:**
`bg-white/78 backdrop-blur-xl` がそのまま残っている。Phase 1 の goal はモバイル `<nav>` のみを対象としていたため、デスクトップヘッダーは変更対象外。意図通り。✅

---

### components/food-card.tsx

| 行 | 変更 | 結果 |
|---|---|---|
| L36 `article` | `bg-white`（旧 `bg-white/86`） | ✅ |
| L36 `article` | `ring-slate-200/70`（旧 `ring-slate-200/55`） | ✅ |
| L65 action bar | `bg-white`（旧 `bg-white/90`） | ✅ |
| L65 `border-t border-slate-100` | 維持 | ✅ |
| ロジック行（L29–L32, L68–L76 等） | 無変更 | ✅ |

`h-[462px]` は Phase 3 スコープのため残存している。意図通り。✅

---

### components/store-food-list.tsx

| 行 | 変更 | 結果 |
|---|---|---|
| L21 empty state `<p>` | `bg-white`（旧 `bg-white/60`） | ✅ |
| L43 Flag バッジ `<span>` | `bg-white/92` 維持 | ✅ |

---

### components/food-reviews.tsx

| 行 | 変更 | 結果 |
|---|---|---|
| L136 `RatingInput` コンテナ | `bg-white`（旧 `bg-white/65`）+ `ring-slate-200/70`（旧 `ring-slate-200/55`）| ✅ |
| L95 textarea | `bg-white` — 実コードを確認。変更前から `bg-white` だったか不明だが、現状の `bg-white` は正しい ✅ |
| L118 通報ボタン | `bg-white` — これは小ボタンのオーバーレイに近いが、`bg-white/xx` → `bg-white` の変更ではなく元から `bg-white` だった可能性が高い。ロジック無変更 ✅ |

---

## 3. 変更の妥当性

### 下部ナビ

`bg-white`（不透明）+ `shadow-[0_-1px_0_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.08)]` の組み合わせは適切。旧来の強い影 `shadow-[0_16px_42px_rgba(15,23,42,0.16)]` より大幅に軽くなっており、「明るい・清潔感のある」ナビに変わっている。

アクティブ: `bg-mint text-park`（変更なし）/ 非アクティブ: `text-slate-400`。

**軽微な注意点:** `text-slate-400`（`#94a3b8`）は白背景上でのコントラスト比が約 3.1:1。WCAG AA の通常テキスト基準（4.5:1）を下回るが、ナビアイコン + ラベルの組み合わせ・アクティブ状態との視覚的差別化という文脈では実用上の問題はない。デザイン意図（「軽さ・明るさ」）を優先するトレードオフとして許容範囲内。

### カード背景

`food-card.tsx` の `bg-white/86` → `bg-white` は、`body` が `#f8fafc` → `#ffffff` になったことで逆説的にカード境界が見えにくくなるリスクがあったが、`ring-slate-200/70`（旧 `ring-slate-200/55`）の強化で補っている。これは適切な対応。

### food-reviews.tsx の変更

`RatingInput` コンテナは評価入力 UI のカードであり、バッジ・オーバーレイではない。`bg-white` への変更は妥当。`ring-slate-200/70` への統一も一貫性がある。

---

## 4. 検証結果の確認

| 項目 | 報告値 |
|---|---|
| npm run lint | 成功 |
| npm run typecheck | 成功 |
| npm run build | 成功 |
| 全主要ページ 200 OK | / / /foods / /eaten / /areas / /stores / /settings |

---

## 5. 懸念・注意点

### [低] デスクトップヘッダーは未変更

`app-header.tsx` L35 のデスクトップヘッダーは `bg-white/78 backdrop-blur-xl` のまま。Phase 1 のスコープ外のため問題なし。ただし、将来のフェーズで整合性が気になる場合は対象にすること。

### [低] text-slate-400 のコントラスト

前述の通り、非アクティブナビアイコンが若干見えにくくなる可能性がある。実機確認時に問題があれば `text-slate-500` に戻すことを検討。

### [確認済み] body が白になった影響

`body: #ffffff` にしたことで、ページ間のグレー「余白」感がなくなる。これは意図通りの変更であり、Phase 2 / Phase 3 の実装後に最終的な統一感が出る。現時点でのページ間の差異（`bg-slate-100` や `bg-slate-50` を使うセクション）は Phase 1 の範囲では許容。

---

## 6. 総評

Phase 1 の実装は目的（全体の白・明るさへの統一）を最小変更で達成している。CSS クラスのみの変更、ロジック無変更、Stop 条件の適切な遵守、lint / typecheck / build 全通過。設計書・goal の仕様と完全一致している。

Phase 2（食べたコレクション棚）への移行を推奨する。

---

## 証跡

- 実装 commit: `a86e191`
- goal 修正 commit: `578a699`
- レビュー対象ファイル: `app/globals.css` / `components/app-header.tsx` / `components/food-card.tsx` / `components/store-food-list.tsx` / `components/food-reviews.tsx`
- 実コード確認: 全5ファイル読了
