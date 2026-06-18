# Design Review: UI Refresh Phase 2 — 食べたコレクション棚 + スクロール修正

**対象 commit:** 12c6eb6 (implement-ui-refresh-phase-2)
**レビュー日:** 2026-06-17
**レビュー担当:** Claude（設計担当 / レビュー担当）

---

## 判定: 承認

---

## 1. スコープ遵守

| 確認項目 | 結果 |
|---|---|
| 変更ファイルが `eaten-experience.tsx` のみ | ✅ |
| FoodImage コンポーネント変更なし | ✅ 確認。`FoodImage` 呼び出しは既存のままで variant prop なし |
| food-card.tsx の画像・高さ変更なし | ✅ 変更ファイルに含まれていない |
| i18n ファイル無変更 | ✅ 報告通り |
| data/translations 無変更 | ✅ 報告通り |
| B3 未追跡ファイル混入なし | ✅ commit に含まれていない確認済み |
| localStorage schema 変更なし | ✅ `useFoodLogs` / `buildEatenAlbumRecords` のデータ取得ロジック無変更 |
| food log 保存形式変更なし | ✅ |

---

## 2. タスク A: スクロール修正の判断

`router.refresh` / `scrollTo` / `scrollIntoView` が調査対象ファイル全件で未検出。goal の指示に従い「原因特定できず、タスク B のみ実装」という判断は**妥当**。

余計な副作用（新規 `useEffect` / `scrollRestoration` 設定等）を入れていないことも確認。未解決のスクロールジャンプは引き続き課題だが、今 Phase の実装で悪化もしていない。

---

## 3. タスク B: コレクション棚 UI の実装照合

### 3-1. isCollectionAlbumMode フラグ（L68）

```tsx
const isCollectionAlbumMode = albumMode !== "recent";
```

設計書通り。`recent` 以外の全 mode が棚表示に切り替わる。✅

### 3-2. グリッドクラス切替（L241）

```tsx
<div className={isCollectionAlbumMode
  ? "grid grid-cols-5 gap-1"
  : "grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 xl:grid-cols-4"}>
```

- 棚モード: `grid-cols-5 gap-1` — goal 指定値と一致 ✅
- recent モード: `grid-cols-2` + レスポンシブ展開を維持 ✅
- `md:grid-cols-3 xl:grid-cols-4` が recent モードに追加されている — 既存仕様の改善であり問題なし ✅

### 3-3. CollectionThumb コンポーネント（L343–362）

```tsx
function CollectionThumb({ record }: { record: EatenAlbumRecord }) {
  const { food } = record;
  return (
    <Link href={`/foods/${food.id}`} aria-label={food.name} className="group min-w-0 transition active:scale-95">
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

| 確認項目 | 結果 |
|---|---|
| テキストなし | ✅ |
| `aspect-square` | ✅ |
| 右上チェック (`right-0.5 top-0.5`, `h-4 w-4`) | ✅ |
| Link → `/foods/${food.id}` | ✅ |
| `aria-label={food.name}` | ✅ goal spec にはなかった適切な追加。テキストなしサムネのアクセシビリティ向上 |
| `rounded-[0.5rem]` | ✅ goal spec と一致 |
| `ring-1 ring-slate-200/60` | ✅ goal spec と一致 |
| `group-hover:scale-105` | ✅ hover 効果維持 |
| `active:scale-95` | ✅ タップフィードバック |

### 3-4. EatenAlbumCard（L308–341）

`recent` モードで引き続き使用されている。既存の大カード + テキスト表示を維持。✅

---

## 4. 表示品質の評価

### モバイル 390px での 5列

コンテナ幅 ≈ 358px（`px-4` 除く）、gap-1（4px）× 4箇所 = 16px。1セル ≈ 70px。

- タップ領域: `Link` 全体が 70×70px — iOS HIG 推奨 44pt を上回る ✅
- `Check` アイコン `h-4 w-4`（16px）が右上オーバーレイ — タップ領域に干渉しない ✅
- `rounded-[0.5rem]` の小さな角丸がミニサムネとして自然 ✅

### gap-1 の密度感

間隔 4px は「棚に並べた」コレクション感として適切。詰めすぎず緩めすぎず。✅

### recent モードの existing 表示

`recent` モードは `EatenAlbumCard`（テキスト付き大カード）を維持。横スクロール recent ログとの差別化ができている。✅

---

## 5. 注意点・次フェーズへの申し送り

### [中] area / genre モードの表示件数制限

`buildAlbumSections` の既存ロジックにより、`area` / `genre` モードでは各グループ最大 4件のみ表示される（area: 8グループ × 4件 = 最大32個、genre: 8カテゴリ × 4件 = 最大32個）。

棚表示に変わったのに 1グループ 1行未満しか見えないケースが多く、設計書の「50品が 5列 × 10行」という体験には `all` モードか `month` モードでのみ到達できる。

今 Phase では buildAlbumSections ロジックを変えないことが正しい判断だったが、次フェーズ以降で `area` / `genre` モードのスライス件数を棚表示に合わせて増やすことを検討すること（例: `slice(0, 4)` → `slice(0, 20)` 程度）。

### [低] スクロールジャンプ問題は引き続き未解決

原因不特定で未実装。`/foods` での「食べた」押下時のスクロールジャンプは残存している可能性がある。原因特定のために `/foods/page.tsx` 全体・`useFoodLogs.ts` の `useEffect` 周りの詳細調査を別途検討すること。

### [低] all モードの全件表示

`all` モードは `records` 全件を返す。食べた品数が多くなると DOM が大きくなるが、既存仕様通りのため今 Phase では問題なし。必要であれば仮想スクロール導入を後フェーズで検討。

---

## 6. 検証結果の確認

| 項目 | 報告値 |
|---|---|
| npm run lint | 成功 |
| npm run typecheck | 成功 |
| npm run build | 成功 |
| 全主要ページ 200 OK | / / /foods / /eaten / /areas / /stores / /settings |

---

## 7. 総評

Phase 2 の実装は設計書・goal の仕様を忠実に実現している。`isCollectionAlbumMode` フラグによる切替が明快で、`CollectionThumb` は goal spec の要件を全て満たし、`aria-label` を追加してアクセシビリティ向上も図っている。スコープ遵守・既存機能破壊なし・lint / typecheck / build 全通過。

area/genre モードの表示件数制限と未解決のスクロールジャンプを申し送り事項として記録する。

---

## 証跡

- 実装 commit: `12c6eb6`
- レビュー対象ファイル: `components/eaten-experience.tsx`（全427行読了）
- 未変更確認: i18n / data/translations / generated JSON / food-card.tsx / FoodImage
