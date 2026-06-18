# Codex Goal: /foods 食べたボタン押下後のスクロールジャンプ修正

**ファイル:** `docs/codex-goal-fix-eaten-scroll-jump-v1.md`
**ステータス:** Codex 実装待ち
**リスクレベル:** 中（FoodGrid の表示ロジックに関わる可能性がある）
**前提:** UI Refresh Phase 1 / 2 / 3 + Follow-up 承認済み・commit 済み

---

## 目的

`/foods` ページで「食べた」ボタンを押したとき、ページ下部または意図しない位置へスクロールしてしまう問題を調査・修正する。

**ゴール状態:** ボタン押下後、押したカードの位置に留まったまま食べた状態だけが切り替わる。

---

## 禁止事項

- food log の保存形式・localStorage schema の変更禁止
- 食べた状態の保存結果・削除結果を変える修正禁止
- `filteredFoods` の基本ソート条件・通常時のソート結果は変更禁止
- ただし、`sort === "uneaten"` で「食べた」押下直後にカード位置が大きく移動する問題を防ぐため、押下直後の該当 item だけを一時的に現在位置へ留める「表示安定化」は許可
- この表示安定化は localStorage に保存しない一時 state のみで行う
- 保存結果・削除結果・foodLogs schema は絶対に変更しない
- ソートそのものを別仕様に変える修正は禁止
- i18n ファイルへの変更禁止
- generated JSON・DB・翻訳ファイルの変更禁止
- FoodImage / food-detail.tsx の変更禁止
- UI Refresh Phase 1〜3 + Follow-up の変更（bg-white / aspect-square / text-slate-500 等）を元に戻す禁止
- `docs/codex-goal-i18n-store-name-display-v1.md` を commit に含めない（B3 別件）
- UIデザインの変更禁止（カード高さ・色・画像比率等）
- URL 構造の変更禁止

---

## Git 運用

### 作業開始前

```bash
git status --short
git status --short --branch
```

`docs/codex-goal-i18n-store-name-display-v1.md` だけが未コミット変更の場合: B3 別件のため触らず続行。他のファイルに未コミット変更がある場合: 内容を確認し、この goal と無関係なら停止して報告。

### 作業完了後

```bash
# 変更したファイルのみ個別追加（git add . は使わない）
git add <変更したファイル名>
git commit -m "fix-eaten-scroll-jump"
git push
```

---

## ステップ 1: 事前調査

### 1-1. 既存コードの確認

調査対象ファイルを以下の順で読む:

```bash
cat components/food-grid.tsx
cat lib/use-food-logs.ts
cat components/food-card.tsx
```

### 1-2. スクロール・DOM操作・router 呼び出しの探索

```bash
grep -rn "scrollTo\|scrollIntoView\|router\.refresh\|router\.push\|router\.replace\|focus\(\|autofocus\|autoFocus" \
  lib/use-food-logs.ts components/food-grid.tsx components/food-card.tsx app/foods/page.tsx
```

### 1-3. 最重要: filteredFoods の sort 依存確認

`food-grid.tsx` の `filteredFoods` useMemo の依存配列と sort 関数を確認する:

```bash
grep -n "useMemo\|filteredFoods\|sortFood\|sort ===\|logs\)" components/food-grid.tsx | head -40
```

**確認ポイント:**
- `filteredFoods` の useMemo 依存配列に `logs` が含まれているか
- `sortFood` 関数が `logs` を引数に取っているか
- `sort === "uneaten"` の分岐があるか（食べていない順ソートで logs が使われるか）

### 1-4. key の安定性確認

```bash
grep -n "key={" components/food-grid.tsx
```

`FoodCard` に渡されている `key` が `food.id`（安定 ID）であることを確認する。

### 1-5. button の type 確認

```bash
grep -n "type=\"button\"\|type=\"submit\"\|preventDefault\|stopPropagation" components/food-card.tsx
```

食べたボタンが `type="button"` であり、`event.preventDefault()` が呼ばれていることを確認する。

---

## ステップ 2: 原因の診断

### パターン A: sort="uneaten" によるリスト並び替え【最有力候補】

**現象の仕組み:**
1. ユーザーが「未食べを前に」ソートを選択した状態でスクロール
2. フードカードの「食べた」を押す
3. `toggleEaten` → `setLogs(nextLogs)` → `logs` state 更新
4. `filteredFoods` useMemo が `logs` 変化により再実行
5. `sortFood(a, b, "uneaten", foods, logs)` が再実行 → 食べた item が末尾へ移動
6. リスト全体が並び替わり、画面が視覚的に下方向へジャンプするように見える

**確認コマンド:**
```bash
grep -n "uneaten\|isEatenCanonical" components/food-grid.tsx
```

`sort === "uneaten"` のソート分岐が logs を使っていれば、このパターンが原因。

**修正方針:**

「食べた」操作後、次の useMemo 再計算タイミングでソート順を一定期間フリーズさせる。

具体的には `pendingEatenIds` という Set を React state で持ち、`toggleEaten` 呼び出し直後はその food.id をセットに追加、sort="uneaten" の場合でも pendingEatenIds に含まれる item を「まだ未食べ扱い」でソートすることで、視覚的な位置移動を防ぐ。

```tsx
// 概略（実際のコードに合わせて実装すること）
const [pendingEatenIds, setPendingEatenIds] = useState<Set<string>>(new Set());

const handleToggleEaten = useCallback((foodId: string, spentAmount?: number) => {
  setPendingEatenIds((current) => {
    const next = new Set(current);
    next.add(foodId);
    return next;
  });
  toggleEaten(foodId, spentAmount);
}, [toggleEaten]);

// sortFood 呼び出し時に pendingEatenIds を渡す
// sort === "uneaten" の場合: pendingEatenIds.has(food.id) なら未食べ扱いでソート
```

**pendingEatenIds の実装方針（FoodGrid 内で管理）:**

- `pendingEatenIds` は `useState<Set<string>>` または同等の一時 state として `FoodGrid` 内で持つ
- `toggleEaten` の直前または直後に対象 food.id を `pendingEatenIds` に追加する
- `sort === "uneaten"` の判定時だけ、`pendingEatenIds.has(food.id)` の item を「表示上はまだ未食べ扱い」として並び順を安定させる
- `isEaten` 表示そのものは通常通り `logs` を見て更新する（ボタン表示は「食べた」に変わる）
- つまり、ボタン表示は「食べた」に変わるが、カード位置だけはすぐに末尾へ移動しない状態にする

**pendingEatenIds の解除条件（以下のタイミングで clear / 削除する）:**

- sort が変更されたら pendingEatenIds 全体を clear する
- 検索語が変更されたら clear する
- category / area / store type / dining type / status などの絞り込み条件が変更されたら clear する
- 対象 food をもう一度押して未食べへ戻した場合は、その food.id だけを pendingEatenIds から削除する
- ページ再読み込み後は保持しない（useState 初期値が空 Set のため自動的にリセット）
- localStorage には保存しない

**注意:** `pendingEatenIds` はセッション内の一時状態。localStorage に保存しない。

この方針が実装困難な場合、または他に影響が出る場合は次の「シンプル代替案」を検討:

**シンプル代替案:** sort="uneaten" が選択されている場合のみ、toggleEaten 後に `setSort("recommended")` でデフォルトソートに切り替える。ただし、ユーザーが明示的に設定したソートを勝手に変えることになるため、実装前に確認すること。

---

### パターン B: `ready` 変化による初回ジャンプ

`useFoodLogs` の初期化時に `setReady(true)` が呼ばれ、スケルトン → 本カード表示に切り替わる際にスクロールジャンプが起きる。

これは「食べたボタン押下後」ではなく「ページ初回表示時」のジャンプなので、現象が「ボタン押下後のジャンプ」なら原因はここではない。

**確認:**
```bash
grep -n "ready\|setReady" lib/use-food-logs.ts
grep -n "ready" components/food-grid.tsx
```

---

### パターン C: form submit による画面スクロール

`food-card.tsx` の eaten button が `type="button"` でない場合、デフォルトの `type="submit"` として動作し、フォームの submit が発生してページが一番上にスクロールする可能性がある。

**ステップ 1-5 の調査で既に確認済みのはずだが、念のため確認すること。**

---

### パターン D: Link 要素のネスト

`article > Link > ... > button` の構造で button が Link の子要素になっている場合、button クリックが Link のナビゲーションをトリガーする可能性がある。

**確認:**
```bash
grep -n -A2 "data-food-card-actions\|onToggleEaten\|absolute.*bottom" components/food-card.tsx
```

eaten button が `Link` の外側（`article` 直下の `div`）に配置されていれば問題なし。

---

### パターン E: 原因が特定できない場合

パターン A〜D のどれにも該当しない場合、または原因は特定できたが修正に大きな構造変更が必要な場合は**停止して報告する**。

場当たり的な `window.history.scrollRestoration = "manual"` や `setTimeout(() => window.scrollTo(...), 0)` は**実装しない**。

---

## Stop and Ask Conditions

以下に該当する場合は実装を止め、調査結果を報告すること:

1. 原因が特定できず、推測だけで修正コードを書こうとしている場合
2. `filteredFoods` のソートロジック（並び順の計算）自体を変える必要が生じた場合
3. `useFoodLogs` の `toggleEaten` / `persistLogs` の内部ロジックを変える必要が生じた場合
4. `app/foods/page.tsx`（Server Component）を Client Component 化する必要が生じた場合
5. 修正が `food-grid.tsx` の 30行を超えそうな場合
6. `FoodCard` の見た目（画像・高さ・ボタン位置等）を変える必要が生じた場合
7. 修正後に「食べた」状態の保存/削除が正しく動かなくなった場合
8. lint / typecheck / build が通らない場合
9. `pendingEatenIds` を入れるために foodLogs の保存形式を変える必要が出た場合
10. pending 状態を localStorage に保存しそうになった場合
11. `sort === "uneaten"` 以外の通常ソート結果まで変わる場合
12. filter / search 条件変更時の pending clear が安全に実装できない場合

---

## ステップ 3: 修正後の確認

### 3-1. 変更ファイルの確認

```bash
git diff --stat
git diff
```

食べた機能のロジック変更（保存・削除）がないこと。UI Refresh の変更が維持されていること。

### 3-2. lint / typecheck / build

```bash
npm run lint
npm run typecheck
npm run build
```

すべて成功すること。

### 3-3. i18n / data 無変更確認

```bash
git diff --stat -- "lib/i18n/**" "data/translations/**"
```

変更ゼロであること。

### 3-4. スクロール動作の手動確認

1. `/foods` を開き、デフォルト状態（ソート: おすすめ順）でページ中盤までスクロールする
2. 任意のフードカードで「食べた」を押す
3. スクロール位置が大きく動かないことを確認する
4. 押したカードだけが「食べた」状態に切り替わることを確認する
5. 連続で複数カードを押してもスクロール位置が大きく動かないことを確認する
6. 「未食べを前に」ソートに切り替えて同じ確認をする
7. `/eaten` ページへ移動し、食べた一覧に反映されていることを確認する
8. localStorage の `foodLogs` キーが壊れていないことを確認する:

```js
// ブラウザコンソールで実行
JSON.parse(localStorage.getItem('foodLogs') ?? '[]').length
```

---

## 完了報告フォーマット

```
## fix-eaten-scroll-jump 完了報告

### 調査結果
- router.refresh / scrollTo / scrollIntoView: 存在したか / なかった
- sort="uneaten" による並び替え（パターン A）: 該当する / 該当しない
- form submit（パターン C）: 該当する / 該当しない
- Link ネスト（パターン D）: 該当する / 該当しない
- 特定した原因（ファイル名・行番号・コード箇所）:

### 修正内容
- 採用したパターン: A / B / C / D / その他
- 変更したファイル・行:
- 修正の概要:

### npm run lint
成功 / 失敗

### npm run typecheck
成功 / 失敗

### npm run build
成功 / 失敗

### スクロール動作確認
- デフォルトソートでジャンプしなかった: YES / NO
- "未食べ前に"ソートでジャンプしなかった: YES / NO
- 押したカードだけ状態が変わった: YES / NO
- /eaten に反映された: YES / NO
- localStorage schema 変わっていない: YES / NO

### i18n / data/translations 無変更確認
git diff --stat 出力:

### docs/codex-goal-i18n-store-name-display-v1.md を commit に含めていない確認
YES

### git commit ハッシュ
xxxxxxx

### git diff --stat 出力
（貼り付け）

### 未修正の場合（Stop and Ask）
- 原因調査の結果:
- 停止した理由:
- 推奨する次のアクション:
```
