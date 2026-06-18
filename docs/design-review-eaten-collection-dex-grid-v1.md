# Design Review: 「食べた」ページ 図鑑グリッドUI（コレクション化）

**対象 commit:** 584f7e187df30be61aca0aac0797343149af45be (feat: unify eaten album to dex-style collection grid (eaten-dex-grid))  
**レビュー日:** 2026-06-18  
**レビュー担当:** Claude（設計担当 / レビュー担当）

---

## 判定: 承認

---

## 1. スコープ遵守

| 確認項目 | 結果 |
|---|---|
| 変更ファイルが `components/eaten-experience.tsx` のみ | ✅ 1 file changed |
| `food-card.tsx` 変更なし | ✅ |
| `food-grid.tsx` 変更なし | ✅ |
| `app/eaten/page.tsx` 変更なし | ✅ |
| DB / Supabase 変更なし | ✅ |
| generated JSON 変更なし | ✅ |
| 翻訳 JSON 変更なし | ✅ |
| `package.json` 変更なし | ✅ |
| git status: clean | ✅ |

---

## 2. UI仕様

### 2-1. `isCollectionAlbumMode` 削除

| 確認項目 | 結果 |
|---|---|
| L68 の `const isCollectionAlbumMode = albumMode !== "recent";` が削除されている | ✅ grep ヒット 0件 |
| `displayedRecordCount`（L68）への影響なし | ✅ `albumSections.reduce(...)` に変更なし |

### 2-2. アルバムグリッド（L240–244）

| 確認項目 | 期待値 | 実測値 | 結果 |
|---|---|---|---|
| グリッドクラス | `grid grid-cols-5 gap-0.5 md:grid-cols-8 lg:grid-cols-10` | L240: `grid grid-cols-5 gap-0.5 md:grid-cols-8 lg:grid-cols-10` | ✅ |
| 条件分岐が除去されている | `CollectionThumb` のみ render | L241-243: 常に `<CollectionThumb>` | ✅ |
| key 文字列が保持されている | `${section.id}-${record.key}-${record.log.eatenAt ?? "unknown"}` | 同一 | ✅ |

### 2-3. `CollectionThumb` ポリッシュ（L338–357）

| 確認項目 | 設計仕様 | 実装値 | 結果 |
|---|---|---|---|
| 角丸 | `rounded-[0.7rem]` | `rounded-[0.7rem]` | ✅ |
| 背景色 | `bg-slate-100` | `bg-slate-100` | ✅ |
| リング | `ring-1 ring-slate-200/40` | `ring-1 ring-slate-200/40` | ✅ |
| タップ feedback | `transition-opacity group-active:opacity-80` (divに) | `transition-opacity group-active:opacity-80` | ✅ |
| チェックバッジ | `bg-park/90 text-white shadow-sm` | `bg-park/90 text-white shadow-sm` | ✅ |
| Link の active スケール | `active:scale-95` 維持 | `active:scale-95` | ✅ |
| `aria-label` | `food.name` | `food.name` | ✅ |

### 2-4. 一覧の情報表示

| 確認項目 | 結果 |
|---|---|
| 商品名が一覧に表示されない（CollectionThumb に text なし） | ✅ |
| 価格が一覧に表示されない | ✅ |
| エリアが一覧に表示されない | ✅ |
| タップで `/foods/${food.id}` へ遷移 | ✅ Link の `href` 確認済み |

---

## 3. 既存機能保護

| 確認項目 | 行番号 | 結果 |
|---|---|---|
| `buildAlbumSections` 関数が変更されていない | L359–390 | ✅ |
| `filteredEatenRecords` / filters / sorts が変更されていない | L57–66 | ✅ |
| "最近食べた" 横スクロールレール（L131–171）が変更されていない | L131–171 | ✅ |
| `EatenAlbumCard` 定義が残存している | L303–336 | ✅ |
| `buildEatenAlbumRecords` が変更されていない | L288–301 | ✅ |
| `useFoodLogs` / ログ保存ロジックに影響なし | ✅ | ✅ |
| `EatenAreaProgress` / `EatenGenreProgress` が変更されていない | L256–258 | ✅ |
| `want` タブ・`NextWantCard` が変更されていない | L114–128 / L269–286 | ✅ |
| `albumMode` state と 5種類のモードセレクターが変更されていない | L41 / L182–200 | ✅ |

### 備考: `CalendarDays` import

L5: `import { CalendarDays, Check } from "lucide-react";`

`CalendarDays` は `EatenAlbumCard`（L303–336）内でのみ使用。`EatenAlbumCard` 定義が残っているため import も正当。lint 成功と整合している。

---

## 4. 品質保証

| 確認項目 | 結果 |
|---|---|
| `npm run lint` | ✅ 成功 |
| `npm run typecheck` | ✅ 成功 |
| `npm run build` | ✅ 成功 |
| 差分サイズ | ✅ 1 file changed, 4 insertions(+), 9 deletions(-) — 最小限 |
| 余計なリファクタなし | ✅ 変更は 3箇所（isCollectionAlbumMode 行削除・グリッド書き換え・CollectionThumb ポリッシュ）のみ |
| 変更ファイルが eaten-experience.tsx のみ | ✅ |

---

## 5. 設計仕様との照合サマリー

| 変更仕様 | 設計書の期待 | 実装 | 判定 |
|---|---|---|---|
| L68 isCollectionAlbumMode 削除 | 削除 | 削除済み | ✅ |
| グリッド CSS | `grid grid-cols-5 gap-0.5 md:grid-cols-8 lg:grid-cols-10` | 完全一致 | ✅ |
| 常に CollectionThumb を render | ternary 除去 | 除去済み | ✅ |
| CollectionThumb 角丸 | `rounded-[0.7rem]` | 完全一致 | ✅ |
| CollectionThumb 背景 | `bg-slate-100` | 完全一致 | ✅ |
| CollectionThumb リング | `ring-slate-200/40` | 完全一致 | ✅ |
| CollectionThumb タップ feedback | `transition-opacity group-active:opacity-80` | 完全一致 | ✅ |
| CollectionThumb バッジ | `bg-park/90 shadow-sm` | 完全一致 | ✅ |
| EatenAlbumCard 定義を残す | 定義のみ残す | 残存確認 | ✅ |

---

## 6. 総評

設計書 `eaten-collection-dex-grid-design-v1.md` の仕様を正確に実装している。差分は最小限（9削除・4追加）で、余計な変更は一切含まれていない。`isCollectionAlbumMode` は完全に除去され、全 albumMode でサムネイルグリッドが統一されている。CollectionThumb の 5項目のビジュアル調整はすべて設計値と完全一致。既存機能（buildAlbumSections / フィルター / レール / EatenAlbumCard 定義）への影響はなし。lint / typecheck / build 全通過。

---

## 証跡

- `components/eaten-experience.tsx` 全行読み取り済み（422行）
- L240: `grid grid-cols-5 gap-0.5 md:grid-cols-8 lg:grid-cols-10` 存在確認
- L68 相当行に `isCollectionAlbumMode` が存在しないことを確認
- L303: `function EatenAlbumCard` 定義残存確認
- L338–357: `CollectionThumb` の全クラスを設計書と照合
- L359–390: `buildAlbumSections` 変更なし確認
- L131–171: "最近食べた" レール変更なし確認
- 実装 commit: `584f7e187df30be61aca0aac0797343149af45be`
