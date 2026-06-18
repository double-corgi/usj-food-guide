# 設計: 「食べた」ページ 図鑑グリッドUI（コレクション化）

**設計日:** 2026-06-18  
**担当:** Claude（プロダクト責任者 / UXデザイナー / UIデザイナー）  
**対象ファイル:** `components/eaten-experience.tsx` のみ  
**コード変更:** 禁止（本ドキュメントは設計・仕様書。実装は Codex が行う）

---

## 1. 目的

「食べた」ページのアルバムセクションを、テキストラベルを持つカード型グリッドから、  
サムネイルだけを敷き詰めた **図鑑スタイルのコレクショングリッド** に改善する。

### ユニコレ最重要目的との整合

| 目的 | 改善前の問題 | 改善後 |
|---|---|---|
| コレクション欲 | 2列カード → ページが縦に長く「整理感」が強い | 5〜10列サムネイル → 「集めた量」が一覧で見える |
| ゲーム感 | テキストが主役でポケモン図鑑感なし | 小さいマス × チェックバッジ → コンプ感が直感的 |
| 高級感 | 文字情報過多で視覚的にやかましい | 余白なし・画像主役で雑誌コレクションページ感 |
| ユニバ感 | カードUIはSaaS感・LP感と紙一重 | 画像グリッドはゲームのアイテムコレクション感 |

---

## 2. 調査結果

### 対象ファイル確定

```
app/eaten/page.tsx               — サーバーコンポーネント、foods 渡すだけ（変更不要）
components/eaten-experience.tsx  — 全ロジック集中（唯一の変更対象）
components/food-card.tsx         — /foods ページ専用。eaten ページは使っていない
components/food-grid.tsx         — /foods ページ専用。eaten ページは使っていない
```

### scroll jump fix との関係

スクロールジャンプ修正（`data-food-card` 属性 / `codex-goal-fix-eaten-scroll-jump-v1.md`）は  
`food-card.tsx` および `food-grid.tsx` の `/foods` ページ固有の実装。  
`eaten-experience.tsx` は `Link` を直接使用しており `FoodCard` を使っていないため、  
今回の変更は scroll jump fix に **一切影響しない**。

### 現在の `eaten-experience.tsx` の構造（抜粋）

```
L68:  const isCollectionAlbumMode = albumMode !== "recent";
L69:  const displayedRecordCount = ...  ← isCollectionAlbumMode に依存しない

L241: <div className={
        isCollectionAlbumMode
          ? "grid grid-cols-5 gap-1"
          : "grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 xl:grid-cols-4"
      }>
L242: {section.records.map((record) => (
L243:   isCollectionAlbumMode ? (
L244:     <CollectionThumb key={...} record={record} />
L245:   ) : (
L246:     <EatenAlbumCard key={...} record={record} />
L247:   )
L248: ))}

L308: function EatenAlbumCard(...)  ← テキスト付きカード（変更後は未使用）
L343: function CollectionThumb(...)  ← サムネイルのみ（強化対象）
```

### 現在の `CollectionThumb`（L343–362）

```tsx
function CollectionThumb({ record }: { record: EatenAlbumRecord }) {
  const { food } = record;
  return (
    <Link href={`/foods/${food.id}`} aria-label={food.name}
      className="group min-w-0 transition active:scale-95">
      <div className="relative aspect-square overflow-hidden rounded-[0.5rem] bg-white ring-1 ring-slate-200/60">
        <FoodImage food={food} alt={food.name} className="h-full w-full transition duration-300 group-hover:scale-105" />
        <span className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-park text-white" aria-hidden>
          <Check size={9} />
        </span>
      </div>
    </Link>
  );
}
```

### 現在の `EatenAlbumCard`（L308–341）— 変更後は album セクションから除外

- name (`line-clamp-2`), price, area, date, timesCount, memo を表示
- albumMode === "recent" のときのみ使われている

### 上部 "最近食べた" レール（L132–172）— 変更しない

- 5件の横スクロールレール（モバイル）/ 3列または5列グリッド（SM/LG）
- 写真 + 日付 + 名前 + 価格 → 「最近の記録タイムライン」として機能
- 今回の設計対象外。変更しない。

---

## 3. 問題の整理

| # | 問題 | 影響 |
|---|---|---|
| 1 | `albumMode === "recent"` だけ `EatenAlbumCard`（2列カード）が使われる | 全モードが揃わず、recentだけ「SaaS感」が残る |
| 2 | `albumMode !== "recent"` は既に `CollectionThumb`（5列）だが gap が 4px（`gap-1`）で隙間が目立つ | 密度が出ず図鑑感が弱い |
| 3 | `CollectionThumb` の `bg-white` は画像なしのときに白浮きする | 高級感ではなくローテク感 |
| 4 | チェックバッジが `bg-park`（濃い青）でサムネイルと分離しすぎる | やや工業的。視覚的うるさみが出る場合がある |

---

## 4. 変更仕様

### 4-1. `isCollectionAlbumMode` を削除し、アルバムセクションを常に CollectionThumb に統一

#### Before

```tsx
// L68
const isCollectionAlbumMode = albumMode !== "recent";

// L241–248
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

#### After

```tsx
// L68: isCollectionAlbumMode 行を削除（displayedRecordCount には影響しない）

// L241–248
<div className="grid grid-cols-5 gap-0.5 md:grid-cols-8 lg:grid-cols-10">
  {section.records.map((record) => (
    <CollectionThumb key={`${section.id}-${record.key}-${record.log.eatenAt ?? "unknown"}`} record={record} />
  ))}
</div>
```

### 4-2. `CollectionThumb` ビジュアルポリッシュ

#### Before

```tsx
function CollectionThumb({ record }: { record: EatenAlbumRecord }) {
  const { food } = record;
  return (
    <Link href={`/foods/${food.id}`} aria-label={food.name}
      className="group min-w-0 transition active:scale-95">
      <div className="relative aspect-square overflow-hidden rounded-[0.5rem] bg-white ring-1 ring-slate-200/60">
        <FoodImage food={food} alt={food.name} className="h-full w-full transition duration-300 group-hover:scale-105" />
        <span className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-park text-white" aria-hidden>
          <Check size={9} />
        </span>
      </div>
    </Link>
  );
}
```

#### After

```tsx
function CollectionThumb({ record }: { record: EatenAlbumRecord }) {
  const { food } = record;
  return (
    <Link href={`/foods/${food.id}`} aria-label={food.name}
      className="group min-w-0 transition active:scale-95">
      <div className="relative aspect-square overflow-hidden rounded-[0.7rem] bg-slate-100 ring-1 ring-slate-200/40 transition-opacity group-active:opacity-80">
        <FoodImage food={food} alt={food.name} className="h-full w-full transition duration-300 group-hover:scale-105" />
        <span className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-park/90 text-white shadow-sm" aria-hidden>
          <Check size={9} />
        </span>
      </div>
    </Link>
  );
}
```

**変更点の根拠:**

| 変更 | Before | After | 理由 |
|---|---|---|---|
| 角丸 | `rounded-[0.5rem]` | `rounded-[0.7rem]` | 5列で小さくなるので丸みを少し強調 |
| 背景色 | `bg-white` | `bg-slate-100` | 画像なし時の浮きを防ぐ |
| リング | `ring-slate-200/60` | `ring-slate-200/40` | 密度が高いので枠線をさらに目立たせない |
| タップ feedback | なし | `group-active:opacity-80` | タップ中の視覚応答（`active:scale-95` に加えてさらに明確に） |
| チェックバッジ | `bg-park` | `bg-park/90 shadow-sm` | 少し柔らかくして画像と馴染ませる |

### 4-3. グリッドのブレークポイント仕様

| ブレークポイント | 列数 | gap | 想定サムネイル幅 |
|---|---|---|---|
| default (< 768px) | 5 | `gap-0.5` (2px) | 〜67px (375px端末) |
| md (768px〜) | 8 | `gap-0.5` | 〜90px |
| lg (1024px〜) | 10 | `gap-0.5` | 〜99px |

> **根拠:** モバイル 375px で 5列 = 1行に5個 = 「図鑑の1ページ」感。  
> PC では10列まで広げることで画面全体が「コレクションアルバム」として機能する。  
> `gap-0.5`（2px）は `gap-1`（4px）より密度が上がり、隙間より画像が主役になる。

### 4-4. `EatenAlbumCard` 関数の扱い

アルバムセクションから呼び出しを除去するが、関数定義自体は **ファイルに残す**。

理由:
- TypeScript / lint はデッドコードをエラーにしない（未使用 function は警告不要）
- 削除すると差分が大きくなり Codex のミスリスクが上がる
- 将来の "verboseモード" 復活オプション時の参考として残す価値がある

---

## 5. 変更しないもの（明示）

| 対象 | 理由 |
|---|---|
| L132–172 "最近食べた" 横スクロールレール | 直近5件のタイムライン。変更対象外。 |
| `albumMode` state と 5種類のモードセレクター | 既存ロジックを保持 |
| `buildAlbumSections` 関数 | アルバム構成ロジックは変更なし |
| `filteredEatenRecords` / filters / sorts | フィルター・ソートロジックは変更なし |
| `EatenAlbumCard` 定義（関数本体） | 呼び出しのみ除去、定義は保持 |
| `EatenAreaProgress` / `EatenGenreProgress` | L261–263、変更なし |
| `want` タブ関連 | `NextWantCard` / `wantedFoods` 処理は変更なし |
| `app/eaten/page.tsx` | サーバーコンポーネント、変更なし |
| `food-card.tsx` / `food-grid.tsx` | eaten ページとは無関係 |
| scroll jump fix 関連コード | `food-card.tsx` にある `data-food-card` 属性は今回変更対象外 |
| Supabase / DB | 変更なし |
| i18n / 翻訳 | 変更なし |

---

## 6. 設計判断の記録

### Q: "recent" albumMode の 24件制限はそのまま維持するか？

**A: はい。** `buildAlbumSections` の `records.slice(0, 24)` は変更しない。  
24件 × 5列 = 約5行。「最近食べたコレクション」としてちょうど良い密度。  
表示数カウンター（`eaten.albumCount`）が残るので「24件 / 全N件」が見える。

### Q: CollectionThumb に食べた日付やカウントを表示しないか？

**A: しない。** 詳細は `/foods/:id` ページでタップして確認する。  
一覧では画像だけを主役にする。これがユニコレの「集めたくなる場所」のコンセプトと一致する。

### Q: gap を `gap-0.5` にして画像の境界が見えにくくならないか？

**A: 問題なし。** `ring-1 ring-slate-200/40` が各セルに残るため境界は識別可能。  
さらに画像自体に十分なコントラストがあるため gap が小さくても視認性は確保される。

---

## 7. 影響範囲まとめ

| ファイル | 変更 |
|---|---|
| `components/eaten-experience.tsx` | 3箇所変更（後述） |
| その他すべてのファイル | 変更なし |

### `eaten-experience.tsx` 変更箇所一覧

| 変更箇所 | 内容 |
|---|---|
| L68 | `const isCollectionAlbumMode = albumMode !== "recent";` を削除 |
| L241–248 | グリッド className を固定 + 常に CollectionThumb を render |
| L343–362 (`CollectionThumb` 関数) | 角丸・背景色・リング・タップ feedback・チェックバッジを調整 |

---

## 8. UI before / after イメージ（テキスト表現）

### Before（albumMode === "recent" のとき）

```
[ 大きい画像 ]  [ 大きい画像 ]
  商品名テキスト   商品名テキスト
  ¥1,000          ¥800
  新世界           ジュラシック
  6/1(日)×1       5/28(金)×2
```
→ 縦方向に長く、SaaS感・LP感が出やすい

### After（全 albumMode 共通）

```
[■][■][■][■][■]
[■][■][■][■][■]
[■][■][■][■][■]
[■][■][■][■][■]
```
→ 密な正方形マス。各マス右上に小さな青チェック。タップで詳細へ。

---

## 9. 懸念事項

| 懸念 | 対応 |
|---|---|
| CollectionThumb が userPhotoUrl を表示していない | 現状の CollectionThumb は `FoodImage`（商品公式画像）を使用。 userPhotoUrl 対応は別タスクとする（今回スコープ外） |
| lg: grid-cols-10 でサムネイルが小さすぎないか | 最小 99px。食べ物アイコンとして十分識別可能なサイズ。iPad Safari も考慮済み |

---

## 10. 次のアクション

1. 本ドキュメントを確認・承認
2. `docs/codex-goal-eaten-collection-dex-grid-v1.md` を Codex に投げる
3. Codex 実装後: design-review を作成してレビュー

---

*本ドキュメントは Claude が実装しない。Codex に渡すための設計書。*
