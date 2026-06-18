# Goal: 「食べた」ページ 図鑑グリッドUI（コレクション化）

## あなたの役割

あなたは実装担当です。`components/eaten-experience.tsx` のみを編集してください。

**禁止:**
- 他のファイルの変更禁止（`food-card.tsx` / `food-grid.tsx` / `app/eaten/page.tsx` など）
- DB / Supabase 変更禁止
- i18n ファイル変更禁止
- `git add .` 禁止
- `buildAlbumSections` 関数の変更禁止
- `filteredEatenRecords` / filters / sorts の変更禁止
- "最近食べた" 横スクロールレール（L132–172）の変更禁止

---

## 背景

`components/eaten-experience.tsx` のアルバムセクションで、  
`albumMode === "recent"` のときだけ `EatenAlbumCard`（テキスト付き2列カード）が使われている。  
他のモード（month / area / genre / all）は既に `CollectionThumb`（5列サムネイルのみ）を使用。

今回は **全 albumMode を `CollectionThumb` に統一し、サムネイル密度と視覚品質を向上** させる。

---

## Step 0: 作業開始前の確認

```bash
git status
grep -n "isCollectionAlbumMode" components/eaten-experience.tsx
grep -n "EatenAlbumCard" components/eaten-experience.tsx
grep -n "CollectionThumb" components/eaten-experience.tsx
```

期待する出力:
- `git status` が clean（未コミットの変更がない）
- `isCollectionAlbumMode` が L68 と L241 と L243 の 3箇所にヒット
- `EatenAlbumCard` が L246 と L308 の 2箇所にヒット（関数定義と呼び出し）
- `CollectionThumb` が L244 と L343 の 2箇所にヒット（呼び出しと定義）

---

## Step 1: `isCollectionAlbumMode` を削除し、アルバムグリッドを書き換える

### 変更 1-A: L68 の `isCollectionAlbumMode` 行を削除

**Before（L68）:**
```tsx
  const isCollectionAlbumMode = albumMode !== "recent";
```

**After:**
```tsx
  // この行を削除する（空行も不要）
```

> `displayedRecordCount`（L69）は `isCollectionAlbumMode` に依存していないので安全に削除できる。

---

### 変更 1-B: L241–248 のグリッド + 条件分岐を書き換える

**Before（L241–248）:**
```tsx
              <div className={isCollectionAlbumMode ? "grid grid-cols-5 gap-1" : "grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 xl:grid-cols-4"}>
                {section.records.map((record) => (
                  isCollectionAlbumMode ? (
                    <CollectionThumb key={`${section.id}-${record.key}-${record.log.eatenAt ?? "unknown"}`} record={record} />
                  ) : (
                    <EatenAlbumCard key={`${section.id}-${record.key}-${record.log.eatenAt ?? "unknown"}`} record={record} />
                  )
                ))}
              </div>
```

**After（L241–245相当）:**
```tsx
              <div className="grid grid-cols-5 gap-0.5 md:grid-cols-8 lg:grid-cols-10">
                {section.records.map((record) => (
                  <CollectionThumb key={`${section.id}-${record.key}-${record.log.eatenAt ?? "unknown"}`} record={record} />
                ))}
              </div>
```

> `EatenAlbumCard` の定義（L308–341）は削除しない。呼び出しだけ除去する。

---

## Step 2: `CollectionThumb` 関数のビジュアルを調整する

### 変更 2: L343–362 の `CollectionThumb` を書き換える

**Before（L343–362）:**
```tsx
function CollectionThumb({ record }: { record: EatenAlbumRecord }) {
  const { food } = record;
  return (
    <Link
      href={`/foods/${food.id}`}
      aria-label={food.name}
      className="group min-w-0 transition active:scale-95"
    >
      <div className="relative aspect-square overflow-hidden rounded-[0.5rem] bg-white ring-1 ring-slate-200/60">
        <FoodImage food={food} alt={food.name} className="h-full w-full transition duration-300 group-hover:scale-105" />
        <span
          className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-park text-white"
          aria-hidden
        >
          <Check size={9} />
        </span>
      </div>
    </Link>
  );
}
```

**After:**
```tsx
function CollectionThumb({ record }: { record: EatenAlbumRecord }) {
  const { food } = record;
  return (
    <Link
      href={`/foods/${food.id}`}
      aria-label={food.name}
      className="group min-w-0 transition active:scale-95"
    >
      <div className="relative aspect-square overflow-hidden rounded-[0.7rem] bg-slate-100 ring-1 ring-slate-200/40 transition-opacity group-active:opacity-80">
        <FoodImage food={food} alt={food.name} className="h-full w-full transition duration-300 group-hover:scale-105" />
        <span
          className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-park/90 text-white shadow-sm"
          aria-hidden
        >
          <Check size={9} />
        </span>
      </div>
    </Link>
  );
}
```

**変更点:**

| 対象 | Before | After |
|---|---|---|
| 角丸 | `rounded-[0.5rem]` | `rounded-[0.7rem]` |
| 背景色 | `bg-white` | `bg-slate-100` |
| リング opacity | `ring-slate-200/60` | `ring-slate-200/40` |
| タップ feedback | (なし) | `transition-opacity group-active:opacity-80` を div に追加 |
| チェックバッジ | `bg-park text-white` | `bg-park/90 text-white shadow-sm` |

---

## Step 3: lint / typecheck を実行する

```bash
npm run lint && npm run typecheck
```

両方成功することを確認する。

**よくあるエラーと対処:**
- `'isCollectionAlbumMode' is not defined` → Step 1-A の削除で解決
- `'EatenAlbumCard' is defined but never used` → 未使用 function はエラーにならない（lint スルー）。削除不要。

---

## Step 4: build を実行する

```bash
npm run build
```

成功することを確認する。

---

## Step 5: 変更差分を確認する

```bash
git diff components/eaten-experience.tsx
```

以下の条件をすべて満たすこと:

- `isCollectionAlbumMode` が削除されている
- `grid grid-cols-5 gap-0.5 md:grid-cols-8 lg:grid-cols-10` が追加されている
- `EatenAlbumCard` の呼び出し（ternary 内）が除去されている
- `CollectionThumb` の定義が更新されている（4箇所のクラス変更）
- `EatenAlbumCard` の定義（`function EatenAlbumCard`）は残っている
- `buildAlbumSections` 関数は変更されていない
- L132–172 の "最近食べた" レールは変更されていない
- `app/eaten/page.tsx` は変更されていない

---

## Step 6: git add（変更ファイルのみ）

```bash
git add components/eaten-experience.tsx
```

`git add .` は禁止。

---

## Step 7: commit する

```bash
git commit -m "feat: unify eaten album to dex-style collection grid (eaten-dex-grid)"
```

---

## Step 8: push する

```bash
git push
```

---

## Step 9: 最終確認

```bash
git status --short
git log -3 --oneline
grep -n "isCollectionAlbumMode" components/eaten-experience.tsx
grep -n "grid-cols-5" components/eaten-experience.tsx
```

期待する出力:
- `git status --short` が空（clean）
- `isCollectionAlbumMode` の grep ヒット: 0件
- `grid-cols-5` の grep ヒット: 1件（`grid grid-cols-5 gap-0.5 md:grid-cols-8 lg:grid-cols-10`）

---

## 完了報告に含めること

1. commit hash
2. push 成功確認
3. `git diff` の差分サマリー（変更行数）
4. `isCollectionAlbumMode` 残存: 0件
5. `grid-cols-5 gap-0.5 md:grid-cols-8 lg:grid-cols-10` が存在する行番号
6. `EatenAlbumCard` 定義（function 本体）が残っていること
7. `buildAlbumSections` が変更されていないこと
8. lint / typecheck / build 結果
9. 変更ファイルが `components/eaten-experience.tsx` のみであること

---

## Stop and Ask 条件

以下のいずれかに該当する場合は実装を止めて報告すること:

- `npm run lint` で `no-unused-vars` 以外のエラーが出た場合
- `npm run typecheck` でエラーが出た場合
- `npm run build` が失敗した場合
- `git diff` に `app/eaten/page.tsx`・`food-card.tsx`・`food-grid.tsx` などの変更が含まれていた場合
- `buildAlbumSections` 関数に変更が入っていた場合
- "最近食べた" レール（`recentLogs`）に変更が入っていた場合
