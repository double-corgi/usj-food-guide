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

- ロジック（useFoodLogs のデータ取得・保存・削除処理）の変更禁止
- i18n ファイルへの変更禁止
- generated JSON・DB・翻訳ファイルの変更禁止
- このゴールのスコープ外のファイル変更禁止（FoodImage・food-card.tsx 等は Phase 3 のスコープ）
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

変更後:
```tsx
<div className="grid grid-cols-5 gap-1">
```

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

### 4. i18n ファイル無変更確認

```bash
git diff --stat -- "lib/i18n/**" "data/translations/**"
```

変更ゼロであること。

---

## 完了報告フォーマット

```
## Phase 2 完了報告

### タスク A: スクロール修正
- 原因: （特定できた場合はコード箇所を記載 / 特定できなかった場合はその旨）
- 修正内容: （適用した修正内容 / または「未修正（原因特定できず）」）

### タスク B: コレクション棚 UI
- eaten-experience.tsx: grid-cols-2 → grid-cols-5 gap-1（all/month/area/genre モード）
- CollectionThumb コンポーネント追加: YES / NO
- recent モード: 変更なし（確認済み）

### 変更ファイル一覧
- （変更したファイルを列挙）

### git commit ハッシュ
xxxxxxx

### 確認コマンド実行結果
git diff --stat の出力を貼る
```
