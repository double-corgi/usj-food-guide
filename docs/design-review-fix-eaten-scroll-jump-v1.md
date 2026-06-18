# Design Review: /foods 食べたボタン押下後スクロールジャンプ修正

**対象 commit:** fcb7bfa (fix-eaten-scroll-jump)
**レビュー日:** 2026-06-18
**レビュー担当:** Claude（設計担当 / レビュー担当）

---

## 判定: 承認

---

## 1. スコープ遵守

| 確認項目 | 結果 |
|---|---|
| 変更が components/food-grid.tsx のみ | ✅ |
| use-food-logs.ts 変更なし | ✅ |
| local-user-data.ts 変更なし | ✅ |
| localStorage schema 変更なし | ✅ |
| food log 保存・削除結果を変えていない | ✅ |
| i18n / data/translations / generated JSON 変更なし | ✅ |
| FoodImage / food-detail.tsx 変更なし | ✅ |
| UI Refresh Phase 1〜3 + Follow-up の変更を元に戻していない | ✅ |
| B3 未追跡ファイル（codex-goal-i18n-store-name-display-v1.md）混入なし | ✅ |

---

## 2. 原因分析の妥当性

### 根本原因: sort="uneaten" での filteredFoods 再ソート

```tsx
// food-grid.tsx L363–365
if (sort === "uneaten") {
  const eatenRank = (food) => Number(isEatenCanonical(foods, logs, food) && !pendingEatenKeys?.has(getCanonicalFoodKey(food)));
  return eatenRank(a) - eatenRank(b);
}
```

修正前の挙動:
- `toggleEaten` → `setLogs` → `logs` state 更新 → `filteredFoods` useMemo 再実行 → 食べた food が末尾へ移動 → DOM 並び替え → 視覚的スクロールジャンプ

`router.refresh` / `scrollTo` / `scrollIntoView` は実装上存在しない。原因診断は正確。✅

---

## 3. 修正内容の照合

### 3-1. pendingEatenState の設計（L78）

```tsx
const [pendingEatenState, setPendingEatenState] = useState<{ scopeKey: string; keys: Set<string> }>(() => ({ scopeKey: "", keys: new Set() }));
```

- `{ scopeKey, keys }` という一体型 state — scopeKey を keys と分離せず一体管理している
- localStorage 非使用。ページリロード後は `scopeKey: ""` に戻り、通常動作 ✅

### 3-2. scopeKey によるフィルター/ソート変更時の自動 clear（L81–82）

```tsx
const filterScopeKey = `${areaId}|${category}|${diningType}|${imageOnly}|${mode}|${priceFilter}|${query}|${saleFilter}|${shopId}|${shopType}|${sort}|${status}`;
const pendingEatenKeys = pendingEatenState.scopeKey === filterScopeKey ? pendingEatenState.keys : null;
```

goal が要求した clear 条件をすべてカバー:

| 条件 | 対応 |
|---|---|
| sort 変更 | sort が scopeKey に含まれる ✅ |
| query 変更 | query が scopeKey に含まれる ✅ |
| category 変更 | category が scopeKey に含まれる ✅ |
| area 変更 | areaId が scopeKey に含まれる ✅ |
| shopId 変更 | shopId が scopeKey に含まれる ✅ |
| shopType 変更 | shopType が scopeKey に含まれる ✅ |
| diningType 変更 | diningType が scopeKey に含まれる ✅ |
| status 変更 | status が scopeKey に含まれる ✅ |
| saleFilter 変更 | saleFilter が scopeKey に含まれる ✅ |
| priceFilter 変更 | priceFilter が scopeKey に含まれる ✅ |
| imageOnly 変更 | imageOnly が scopeKey に含まれる ✅ |

条件変更時は `pendingEatenKeys` が `null` になる。`null` の場合 `pendingEatenKeys?.has(...)` は `undefined` → `!undefined` は `true` → 通常の eatenRank 計算に戻る。**明示的な clear() 不要で自動無効化される設計**。✅

### 3-3. handleToggleEaten のロジック（L114–125）

```tsx
const handleToggleEaten = useCallback((foodId: string, spentAmount?: number) => {
  const targetFood = foods.find((food) => food.id === foodId);
  if (targetFood) {
    const canonicalKey = getCanonicalFoodKey(targetFood);
    setPendingEatenState((current) => {
      const next = new Set(current.scopeKey === filterScopeKey ? current.keys : []);
      isEatenCanonical(foods, logs, targetFood) ? next.delete(canonicalKey) : next.add(canonicalKey);
      return { scopeKey: filterScopeKey, keys: next };
    });
  }
  toggleEaten(foodId, spentAmount);
}, [filterScopeKey, foods, logs, toggleEaten]);
```

- `isEatenCanonical` は **toggle 前の** `logs` で評価される（`setPendingEatenState` が `toggleEaten` より先）
  - 現在 uneaten → `false` → `next.add(canonicalKey)` → 食べた状態になるが位置はキープ ✅
  - 現在 eaten → `true` → `next.delete(canonicalKey)` → 未食べに戻す場合は pending から除去 ✅
- `isEaten` の表示（ボタン状態）は `logs` を見るため、通常通り切り替わる。位置だけが安定する ✅
- `toggleEaten(foodId, spentAmount)` は `setPendingEatenState` の後に呼ばれるが、React の batch rendering により両 state 更新は同一レンダリングサイクルで処理される可能性が高い（React 18 Automatic Batching）

### 3-4. sortFood での適用（L363–365）

```tsx
if (sort === "uneaten") {
  const eatenRank = (food) => Number(isEatenCanonical(foods, logs, food) && !pendingEatenKeys?.has(getCanonicalFoodKey(food)));
  return eatenRank(a) - eatenRank(b);
}
```

- `sort === "uneaten"` の場合のみ `pendingEatenKeys` を使用 ✅
- 他のすべての sort 分岐（recommended / new / image / status / category / shop / priceAsc / priceDesc / walk）では `pendingEatenKeys` を参照しない ✅
- 通常ソート結果は変更なし ✅

### 3-5. filteredFoods の useMemo 依存配列（L111）

```
[areaId, areas, canonicalFoods, category, diningType, eatenCanonicalKeys, foods, imageOnly, logs, mode, pendingEatenKeys, priceFilter, query, saleFilter, shopId, shopType, sort, status, t]
```

`pendingEatenKeys` が deps に含まれている。pending 追加時は新しい Set 参照 → useMemo 再実行 → sortFood に渡される。✅

---

## 4. 既存機能への影響

| 確認項目 | 結果 |
|---|---|
| /foods ページ 200 OK | ✅（実行報告より）|
| /eaten ページ 200 OK | ✅（実行報告より）|
| UI Refresh Phase 1〜3 + Follow-up（白背景・aspect-square・text-slate-500 等）| food-grid.tsx は UI Refresh で変更対象外だったため影響なし ✅ |
| i18n Phase B / C / Home Phase D / C+ | food-grid.tsx の i18n 呼び出しは変更なし ✅ |
| 店舗 ID 衝突修正 v1.1 | store-utils / food-utils 変更なし ✅ |
| FoodCard の key={food.id} | 変更なし ✅（stable key は維持）|

---

## 5. 実クリック確認未実施について

Codex 側でブラウザ自動操作ツールが使えなかったため、実際のボタン押下確認は未実施。

これを **blocking としない判断理由:**

1. コードの論理的正確性がレビューで確認できている
2. `npm run lint / typecheck / build` は全通過
3. 実クリック確認のみを残す条件付き承認にする選択肢もあるが、追加 commit を要求するほどのリスクは見当たらない
4. 実クリックで確認できる問題（意図しない副作用等）がコードから読み取れない

**申し送り:** 次回の実機テスト機会に `sort="uneaten"` + 「食べた」ボタン連続押下のシナリオを確認すること。

---

## 6. 軽微な注記（非ブロッキング）

### [低] handleToggleEaten の参照安定性

`handleToggleEaten` は `filterScopeKey` を deps に含むため、フィルター/ソート条件変更のたびに参照が変わる。`FoodCard` が `React.memo` 化されていれば問題になりうるが、現在そうでないため実際の影響はない。将来 `React.memo` を導入する際は注意。

### [低] React 18 Automatic Batching

`setPendingEatenState` と `toggleEaten` 内の `setLogs` が同一の onClick ハンドラ内で連続して呼ばれる。React 18 では Event Handler 内は自動バッチされるため、1回のレンダリングで両方が反映される可能性が高い。もし両者が非同期処理を挟んで分離した場合でも、pending の追加と logs の更新はどちらが先に反映されても sortFood の動作は破綻しない。

---

## 7. 総評

scopeKey パターンは目標の実装方針（`pendingEatenIds` + 条件変更時 clear）を clean に実現した設計。明示的な clear 呼び出しを一切不要にしつつ、全フィルター/ソート条件変更を自動で無効化している。sort="uneaten" 以外への影響なし、localStorage 非使用、保存・削除ロジック変更なし。goal のすべての Stop and Ask 条件に抵触していない。

スコープ遵守・既存機能破壊なし・lint / typecheck / build 全通過。承認。

---

## 証跡

- 実装 commit: `fcb7bfa`
- レビュー対象ファイル: `components/food-grid.tsx`（491行 全読了）
- 未変更確認: `lib/use-food-logs.ts`（実行報告）/ `data/translations`（実行報告）/ `generated JSON`（実行報告）
