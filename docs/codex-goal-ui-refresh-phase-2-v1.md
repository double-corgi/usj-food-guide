# Codex Goal: UI Refresh Phase 2 — 食べたコレクション棚 + スクロール修正

**ファイル:** `docs/codex-goal-ui-refresh-phase-2-v1.md`
**ステータス:** Codex 実装待ち
**設計書:** `docs/app-ui-redesign-v1.md` Section 6, 7
**リスクレベル:** 中（eaten-experience.tsx の UI 変更 + use-food-logs のスクロール修正）
**前提:** Phase 1 完了済み

---

## 目的

1. 「食べた」一覧をコレクション棚（5列ミニサムネ）に再設計する
2. 「食べた」ボタン押下時のスクロールジャンプを修正する

---

## 禁止事項

- food log の保存形式・localStorage schema・データ取得・追加・削除の本質ロジックは変更禁止
- スクロールジャンプを止めるための副作用処理の削除・抑制・最小修正は許可
- ただし、食べた状態の保存結果や削除結果が変わる修正は禁止
- 原因が router.refresh / scrollTo / scrollIntoView / key 再マウント以外で、修正に大きな構造変更が必要な場合は停止して報告
- food-card.tsx の画像表示・カード高さ・FoodImage 呼び出し変更は Phase 3 対象のため禁止
- food-card.tsx にスクロールジャンプ原因（scrollTo / scrollIntoView / router.refresh 等）が直接ある場合のみ、スクロール副作用の最小修正は Phase 2 で許可。見た目変更は禁止
- i18n ファイルへの変更禁止
- generated JSON・DB・翻訳ファイルの変更禁止
- FoodImage コンポーネントへの変更禁止（Phase 3 のスコープ）
- URLの変更禁止

---

## タスク A: スクロールジャンプ調査と修正

### A-1. 現象

`/foods` ページでフードカードの「食べた」ボタンを押すと、画面がページ末尾または意図しない位置にスクロールする。

### A-2. 調査手順

まず以下のコマンドで原因候補を探す:

```bash
grep -rn "scrollTo\|scrollIntoView\|router\.refresh\|useRouter" lib/use-food-logs.ts
grep -rn "scrollTo\|scrollIntoView\|router\.refresh\|scroll" app/foods/page.tsx
grep -rn "scrollTo\|scrollIntoView\|router\.refresh\|scroll" components/food-card.tsx
grep -rn "scrollTo\|scrollIntoView\|router\.refresh\|scroll" components/food-grid.tsx 2>/dev/null || echo "food-grid.tsx not found"
```

**food-card.tsx の調査スコープ:** スクロールジャンプ原因の有無確認のみ。画像・カード高さ・FoodImage 呼び出しには一切触れない（Phase 3 のスコープ）。

また `use-food-logs.ts` 全体を読む:

```bash
cat lib/use-food-logs.ts
```

### A-3. 修正方針（原因別）

#### パターン 1: `router.refresh()` が呼ばれている場合

`router.refresh()` はページ全体を再マウントするため、スクロール位置がリセットされる。

修正:
- `router.refresh()` を削除する
- または `startTransition(() => router.refresh())` でラップし、UI を中断しない形にする
- ただし router.refresh() の削除後に他の動作が壊れないか確認すること

#### パターン 2: `window.scrollTo` / `element.scrollIntoView` が呼ばれている場合

該当箇所を削除または条件付き（フラグで無効化可能）にする。

#### パターン 3: リスト再マウント（key の変更）

logs 配列の更新により食べ物リストが再マウントされてスクロールリセットが起きている場合:

`app/page.tsx` または `/foods/page.tsx` で `scrollRestoration` を設定する:

```tsx
useEffect(() => {
  if (typeof window !== "undefined") {
    window.history.scrollRestoration = "manual";
  }
}, []);
```

#### パターン 4: 原因が特定できない場合

調査結果を報告し、スクロール修正は未実装とする。この場合、タスク B（コレクション棚）のみ実装する。

### A-4. 修正後の確認

- 「食べた」ボタンを押した後もスクロール位置が維持される
- 押したカードの食べた状態が即時に切り替わる
- 他のフードカードのデータが消えない

---

## タスク B: 「食べた」コレクション棚 UI

**変更ファイル:** `components/eaten-experience.tsx`

### B-1. 実装前の確認

```bash
wc -l components/eaten-experience.tsx
grep -n "EatenAlbumCard\|grid-cols\|albumMode\|recent\|all\|month\|area\|genre" components/eaten-experience.tsx | head -60
```

`eaten-experience.tsx` の全体構造を把握してから変更する。

### B-2. EatenAlbumCard の変更

**albumMode の種類と対応:**

| albumMode | 変更内容 |
|---|---|
| `recent`（最新ログ） | 変更なし（現状の大カード表示を維持） |
| `month` / `area` / `genre` / `all` | コレクション棚（5列ミニサムネ）に変更 |

**グリッドクラスの変更:**

変更前（all / month / area / genre の場合）:
```tsx
<div className="grid grid-cols-2 gap-x-3 gap-y-5">
```

変更後（第一候補）:
```tsx
<div className="grid grid-cols-5 gap-1">
```

**列数の許容方針:**
- 第一候補は `grid-cols-5`（390px で約 70px/セル）
- 390px で画像が小さすぎる、またはタップしづらいと判断した場合は `grid-cols-4` も許可
- その場合は完了報告で理由を明記すること
- gap は `gap-1`〜`gap-1.5` の範囲に抑え、コレクション棚の密度感を優先する
- テキストなしのサムネ表示を基本にする（列数に関わらず）

**EatenAlbumCard コンポーネントの変更:**

コレクション棚モード（`albumMode !== "recent"`）では、テキストなしのミニサムネを表示する。

変更後のカード要素:
```tsx
// コレクション棚モード用（albumMode !== "recent"）
<Link
  key={food.id}
  href={`/foods/${food.id}`}
  className="group min-w-0 transition active:scale-95"
>
  <div className="relative aspect-square overflow-hidden rounded-[0.5rem] bg-white ring-1 ring-slate-200/60">
    <FoodImage
      food={food}
      alt={food.name}
      className="h-full w-full"
    />
    {/* 食べた済みチェック（右上） */}
    <span
      className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-park text-white"
      aria-hidden
    >
      <Check size={9} />
    </span>
  </div>
</Link>
```

**注意:**
- テキスト（食べ物名・価格）は表示しない
- カードは `Link` コンポーネントでラップし `/foods/${food.id}` へ遷移
- `Check` アイコンは `lucide-react` から import（既存の import を確認して使う）
- `FoodImage` の `variant` prop は Phase 3 で対応するため、この Phase では追加しない

### B-3. albumMode 切替の考慮

`albumMode` の値によって `EatenAlbumCard` のグリッドクラスとカード内容を切り替える。

既存の albumMode 切替ロジックを壊さないこと。グリッドクラスと各カードの JSX のみ変更する。

切替ロジックの例（既存コードに合わせて実装すること）:

```tsx
// ※ 実際の albumMode の型・変数名は既存コードに従うこと

const isCollectionMode = albumMode !== "recent";

// グリッド
<div className={isCollectionMode ? "grid grid-cols-5 gap-1" : "grid grid-cols-2 gap-x-3 gap-y-5"}>
  {foods.map((food) =>
    isCollectionMode
      ? <CollectionThumb key={food.id} food={food} />
      : <AlbumCard key={food.id} food={food} /* 既存 */ />
  )}
</div>
```

既存の `EatenAlbumCard` コンポーネントは削除せず、`recent` モードでは引き続き使う。

### B-4. セクション見出しの維持

各セクション（月・エリア・ジャンル）の見出しは変更しない。

---

## Git 運用

### 作業開始前

```bash
git status --short
git status --short --branch
```

**未コミット変更の確認:**

- `docs/codex-goal-i18n-store-name-display-v1.md` だけが未コミット変更として存在する場合:
  - B3 店舗名翻訳の別件のため触らない
  - backup commit にも含めない
  - Phase 2 を続行する

- それ以外のファイルに未コミット変更がある場合:
  - 変更内容を確認し、Phase 2 と無関係なら停止して報告すること

### 作業完了後

```bash
# 変更したファイルを個別に追加する（git add . は使わない）
git add components/eaten-experience.tsx

# スクロール修正を行った場合は該当ファイルも個別に追加する
# 例: git add lib/use-food-logs.ts
# 例: git add app/foods/page.tsx

git commit -m "implement-ui-refresh-phase-2"
git push
```

---

## 変更対象ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `lib/use-food-logs.ts` | スクロール原因が存在する場合のみ修正 |
| `app/foods/page.tsx` | scrollRestoration 設定（必要な場合のみ）|
| `components/food-card.tsx` | スクロール原因が存在する場合のみ修正 |
| `components/eaten-experience.tsx` | コレクション棚 UI 変更（必須）|

---

## 検証手順

### 1. 変更ファイルの確認

```bash
git diff --stat
```

スコープ外のファイルが変更されていないことを確認。

### 2. eaten-experience の確認

```bash
grep -n "grid-cols\|gap-\|EatenAlbumCard\|CollectionThumb" components/eaten-experience.tsx
```

`grid-cols-5 gap-1` が追加されていること。`grid-cols-2` が `recent` モードにのみ残っていること。

### 3. import 確認

```bash
grep -n "^import" components/eaten-experience.tsx
```

`Check` アイコンが import されていること（既存の場合は追加不要）。

### 4. lint / typecheck / build

```bash
npm run lint
npm run typecheck
npm run build
```

すべて成功すること。

### 5. i18n ファイル無変更確認

```bash
git diff --stat -- "lib/i18n/**" "data/translations/**"
```

変更ゼロであること。

### 6. スクロール動作の確認

以下の手順で確認すること:

1. `/foods` を開き、中盤（画面の半分以上）までスクロールする
2. 任意のフードカードで「食べた」ボタンを押す
3. 画面がページ下部へ飛ばないことを確認する
4. 押したカードだけが「食べた」状態に切り替わることを確認する
5. 連続で複数のカードを押してもスクロール位置が大きく動かないことを確認する
6. `/eaten` ページへ移動し、食べた一覧に反映されていることを確認する
7. localStorage の foodLogs キーが壊れていないことを確認する（`JSON.parse(localStorage.getItem('foodLogs'))` 等）

---

## 完了報告フォーマット

```
## Phase 2 完了報告

### タスク A: スクロール修正
- 原因: （特定できた場合はファイル名・行番号・コード箇所を記載 / 特定できなかった場合はその旨）
- 修正内容: （適用した修正内容 / または「未修正（原因特定できず）」）
- スクロール修正を行ったファイル: （ファイル名を列挙 / なければ「なし」）
- /foods で「食べた」押下後にスクロール位置を維持できたか: YES / NO / 未確認

### タスク B: コレクション棚 UI
- eaten-experience.tsx: grid-cols-2 → grid-cols-X gap-Y（all/month/area/genre モード）
  - 採用した列数: 5列 / 4列（理由: ）
- CollectionThumb コンポーネント（または相当する JSX）追加: YES / NO
- recent モード: 変更なし（確認済み）
- /eaten の collection 棚表示の列数: X列

### npm run lint
成功 / 失敗（失敗の場合は内容を記載）

### npm run typecheck
成功 / 失敗（失敗の場合は内容を記載）

### npm run build
成功 / 失敗（失敗の場合は内容を記載）

### i18n / data/translations / generated JSON 未変更確認
git diff --stat -- "lib/i18n/**" "data/translations/**" の出力: （貼り付け）

### docs/codex-goal-i18n-store-name-display-v1.md を commit に含めていない確認
YES（含めていない）/ NO（含まれてしまった場合は内容を記載）

### 変更ファイル一覧
- （変更したファイルを列挙）

### git commit ハッシュ
xxxxxxx

### git diff --stat 出力
（出力を貼る）
```
