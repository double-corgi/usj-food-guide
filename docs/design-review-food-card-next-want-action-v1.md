# Design Review: 探すページ商品カードへの「次回食べたい」アクション追加

**対象 commit:** a1de209f4219349e2b9236e0b5352b3c78af6199 (feat: add next-want action to food cards)  
**レビュー日:** 2026-06-19  
**レビュー担当:** Claude（設計担当 / レビュー担当）

---

## 判定: 承認

---

## 1. スコープ遵守

| 確認項目 | 結果 |
|---|---|
| 変更ファイルが `components/food-card.tsx` と `components/food-grid.tsx` のみ | ✅ |
| `data/translations` 変更なし | ✅ |
| `scripts/output` / generated JSON 変更なし | ✅ |
| DB / crawler 変更なし | ✅ |
| `docs` 変更なし | ✅ |
| `app/foods/page.tsx` 変更なし | ✅ |
| `app/eaten/page.tsx` 変更なし | ✅ |
| `package.json` 変更なし | ✅ |
| `scripts/check-translation-coverage.ts` 変更なし | ✅ |

---

## 2. 「次回食べたい」マーク/ボタンの追加確認

### food-card.tsx

| 確認項目 | 実測（行番号） | 結果 |
|---|---|---|
| `Flag` icon を `lucide-react` から import | L2: `import { Flag, MapPin } from "lucide-react"` | ✅ |
| `isWanted?: boolean` prop 追加 | L17: `isWanted = false` | ✅ |
| `onToggleWanted?: () => void` prop 追加 | L18: `onToggleWanted?` | ✅ |
| `onToggleWanted` が存在するときのみフラグボタンを表示 | L85: `{onToggleWanted ? (...)  : null}` | ✅ |
| フラグボタンに `aria-label` / `aria-pressed` / `title` 付与 | L88–90 | ✅ アクセシビリティ正しい |
| `onClick` 内で `event.preventDefault()` + `event.stopPropagation()` | L91–94 | ✅ リンク遷移を阻止 |
| アクティブ状態: `border-park bg-mint text-park` | L97–98 | ✅ |
| 非アクティブ状態: `border-slate-200 bg-white text-slate-500` + hover | L99 | ✅ |
| `Flag` icon に `aria-hidden`、アクティブ時 `fill-current` | L102 | ✅ |

### food-grid.tsx

| 確認項目 | 実測（行番号） | 結果 |
|---|---|---|
| `useNextWantFoods` を import | L15 | ✅ |
| `const { isWanted, toggleWanted } = useNextWantFoods(foods)` | L66 | ✅ |
| `FoodCard` に `isWanted={isWanted(food)}` を渡す | L336 | ✅ |
| `FoodCard` に `onToggleWanted={() => toggleWanted(food)}` を渡す | L337 | ✅ |

---

## 3. 既存の useNextWantFoods を再利用しているか

`food-grid.tsx` L15: `import { useNextWantFoods } from "@/lib/use-next-want-foods"` — 既存フックをそのまま使用。新しいフック・ストレージキー・スキーマを作成していない。✅

---

## 4. 新しい保存形式を作っていないか

`useNextWantFoods` の `isWanted` / `toggleWanted` を props 経由で `FoodCard` に渡す設計。`FoodCard` 自体は状態を持たず、保存ロジックはすべて既存フックに委譲している。新しい localStorage キー・DB カラム・型定義の追加なし。✅

---

## 5. 「食べた」ボタンが維持されているか

| 確認項目 | 実測（行番号） | 結果 |
|---|---|---|
| `onToggleEaten` prop 維持 | L16, L23 | ✅ |
| 食べたボタン JSX 維持 | L72–84 | ✅ |
| 食べた状態: `bg-park text-white` | L80 | ✅ |
| 未食べ状態: `bg-ink text-white` | L81 | ✅ |
| ボタンテキスト `t("foodCard.eatenDone")` / `t("foodCard.markEaten")` | L83 | ✅ |

---

## 6. 画像・タイトル・値段・販売エリアが維持されているか

| 確認項目 | 行番号 | 結果 |
|---|---|---|
| `FoodImage` (aspect-[4/3], variant="contain") | L44–45 | ✅ |
| 商品名テキスト (`line-clamp-2`, `text-[13px]`) | L56–58 | ✅ |
| 価格表示 (`displayPrice`) | L59–61 | ✅ |
| 販売エリア（`MapPin` + `areaSummary`） | L63–68 | ✅ |
| バッジ（限定・終売・期間中）| L46–52 | ✅ |

---

## 7. 商品名翻訳表示が壊れていないか

| 確認項目 | 実測 | 結果 |
|---|---|---|
| `displayName = getFoodNameI18n(food.id, locale, food.name)` | L39 | ✅ |
| `FoodImage alt={displayName}` | L45 | ✅ |
| タイトルテキスト `{displayName}` | L57 | ✅ |
| フラグボタンの aria-label は食品名ではなく `t("foodDetail.wantNext")` 等（翻訳関係なし） | L88–90 | ✅ |
| `food-grid.tsx` 検索サジェスト内の `displayName` | L211 | ✅ |

---

## 8. カードが大きくなりすぎていないか

| 確認項目 | 実測 | 結果 |
|---|---|---|
| `article` の `pb-11` 維持 | L42 | ✅ 高さ変わらず |
| アクションバー `h-11` 維持 | L71 | ✅ |
| `onToggleWanted` ありのとき `grid-cols-[1fr_2.25rem] gap-1.5` | L71 | ✅ 食べたボタンが狭くなるだけで高さ変化なし |
| フラグボタンは `w-9`（= 36px）と小さい | L96 | ✅ コンパクト |
| カード全体の高さ変化なし | 既存 `pb-11` + `h-11` アクションバーは同一 | ✅ |

`onToggleWanted` が渡されない場合（他のページでの `FoodCard` 利用）はフラグボタン非表示でレイアウト変化なし（`grid-cols-1`）。✅

---

## 9. `/foods/[id]` への遷移が維持されているか

| 確認項目 | 実測（行番号） | 結果 |
|---|---|---|
| `<Link href={/foods/${food.id}}>` 維持 | L43 | ✅ |
| フラグボタン `onClick` 内で `event.stopPropagation()` → Link 遷移をブロック | L92–93 | ✅ |
| 食べたボタンも同様に `stopPropagation()` | L75–76 | ✅ |

---

## 10. 検索・フィルター・ソートへの副作用なし

`food-grid.tsx` の変更は L15（import）・L66（フック呼び出し）・L336–337（props 渡し）の3箇所のみ。

| 確認項目 | 結果 |
|---|---|
| `filteredFoods` 算出ロジック変更なし | ✅ |
| `sortFood` 変更なし | ✅ |
| カテゴリ・エリア・店舗・ソートの state 変更なし | ✅ |
| `matchesFoodQuery` / `matchesSaleFilter` 変更なし | ✅ |
| `handleToggleEaten` 変更なし | ✅ |
| ページネーション（`visibleCount`）変更なし | ✅ |

---

## 11. data/translations / generated JSON / DB / crawler に触れていないか

| 確認項目 | 結果 |
|---|---|
| `data/translations/food-names.json` 変更なし | ✅ |
| `data/translations/store-names.json` 変更なし | ✅ |
| `foods.generated.json` 変更なし | ✅ |
| DB スキーマ変更なし | ✅ |
| crawler 変更なし | ✅ |

---

## 12. Vercel CLI を使っていないか

報告の通り「Vercel CLI は未使用」。main push 後の自動デプロイのみ。✅

---

## 13. lint / typecheck / build / coverage が成功しているか

| 確認項目 | 結果 |
|---|---|
| `npm run lint` | ✅ 成功 |
| `npm run typecheck` | ✅ 成功 |
| `npm run build` | ✅ 成功 |
| `npm run coverage` | ✅ 成功 |
| `git status --short` | ✅ clean |
| main / origin/main 同期済み | ✅ |

---

## 14. Food/Store Coverage が期待値から変化していないか

### Food Translation Coverage

| 項目 | 期待値 | 実測値 | 結果 |
|---|---|---|---|
| total | 294 | 294 | ✅ |
| translated | 77 | 77 | ✅ |
| missing | 217 | 217 | ✅ |
| verified | 6 | 6 | ✅ |
| needs_review | 69 | 69 | ✅ |
| orphan | 0 | 0 | ✅ |

### Store Translation Coverage

| 項目 | 期待値 | 実測値 | 結果 |
|---|---|---|---|
| generated_total | 42 | 42 | ✅ |
| translated | 42 | 42 | ✅ |
| missing | 0 | 0 | ✅ |
| display_total | 99 | 99 | ✅ |
| display_translated | 52 | 52 | ✅ |
| display_missing | 47 | 47 | ✅ |
| display_seed | 14 | 14 | ✅ |
| verified | 23 | 23 | ✅ |
| needs_review | 33 | 33 | ✅ |
| orphan | 0 | 0 | ✅ |

---

## 15. 総評

`FoodCard` に `isWanted` / `onToggleWanted` をオプション props として追加し、`FoodGrid` 側で `useNextWantFoods`（既存）を呼び出して渡す、最小限の設計。新しい保存形式・フック・localStorage キーは一切作成していない。カード高さは `h-11` アクションバー内で吸収され変化なし。フラグボタンは `aria-label` / `aria-pressed` / `title` すべて設定されアクセシビリティも正しい。`onToggleWanted` が未渡しの場合はボタン非表示（他ページへの副作用なし）。検索・フィルター・ソートへの影響なし。Coverage・lint/typecheck/build 全通過。

---

## 証跡

- `components/food-card.tsx` 全180行読み取り済み
- `components/food-grid.tsx` 全505行読み取り済み
- L2 (`food-card`): `Flag` import 確認
- L17–18 (`food-card`): `isWanted` / `onToggleWanted` props 確認
- L71 (`food-card`): アクションバー grid layout 確認
- L85–104 (`food-card`): フラグボタン JSX・アクセシビリティ確認
- L15, L66 (`food-grid`): `useNextWantFoods` import・呼び出し確認
- L336–337 (`food-grid`): `FoodCard` への props 渡し確認
- 実装 commit: `a1de209f4219349e2b9236e0b5352b3c78af6199`
