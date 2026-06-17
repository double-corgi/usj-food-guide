# App UI Redesign v1 — UNICOLLE 全体 UI / UX 設計書

**作成日:** 2026-06-17
**ステータス:** 設計確定（実装前）
**前提:** i18n Phase B / C / D / C+ 承認済み。データ構造・crawler・generated JSON・DB は変更しない。

---

## 1. 設計ゴール

| 観点 | 方針 |
|---|---|
| ベーストーン | 白背景・明るい・整理された |
| コレクション感 | 食べた一覧に「棚」感・密度感を出す |
| 優先デバイス | モバイル 390px〜430px |
| デザイン禁止 | AIっぽい装飾過剰 / SaaS感 / 管理画面感 / ソシャゲ感 |
| 既存資産 | 既存の Tailwind クラス・コンポーネント構造を最大限に活用 |

---

## 2. 全体ビジュアルルール

### 2-1. 背景色

| 要素 | 現状 | 変更後 |
|---|---|---|
| `body` background | `#f8fafc`（薄グレー） | `#ffffff`（純白）|
| セクション区切り | 各コンポーネントの `bg-white/70` 等 | `bg-white` へ統一 |
| ページ内 sub-section | `bg-white/86` 等 | `bg-white` |
| フードカード背景 | `bg-white/86` | `bg-white` |

**理由:** `#f8fafc` は薄グレーで全体がくすんで見える。純白にすることでパークの高揚感・コレクションの高級感が増す。

### 2-2. カード

| 属性 | 現状 | 変更後 |
|---|---|---|
| 角丸 | `rounded-[1.25rem]`（20px） | 維持 |
| 影 | `ring-1 ring-slate-200/55` | `ring-1 ring-slate-200/70`（やや強く）|
| hover | `hover:-translate-y-0.5` | 維持 |
| 背景 | `bg-white/86` | `bg-white` |

### 2-3. 余白

| 要素 | 現状 | 変更後 |
|---|---|---|
| ページ左右パディング | `px-4`（各ページ） | 維持 |
| セクション間 | `space-y-8` | 維持 |
| カード内パディング | `px-3 py-3` | 維持 |

### 2-4. 文字サイズ

変更なし。既存のサイズ体系を維持する。

### 2-5. カラーパレット（変更なし、参照用）

| 変数 | 値 | 用途 |
|---|---|---|
| `park` | USJ ブルー系 | アクセント・アクティブ |
| `mint` | 薄ミント | アクティブ背景 |
| `ink` | ほぼ黒 | 見出し・主テキスト |
| `berry` | 赤紫 | バッジ・限定ラベル |
| `sun` | 黄 | upcoming バッジ |

---

## 3. 下部ナビゲーション

### 現状の問題

- `bg-white/94 backdrop-blur-2xl`: 半透明 + blur で背後のコンテンツが透けて暗く見える
- `shadow-[0_16px_42px_rgba(15,23,42,0.16)]`: 強い影が「重さ」を与えている
- `border border-slate-200/60`: 薄い囲み枠

### 変更後

```
bg-white                             ← 不透明白（backdrop-blur 削除）
border border-slate-200              ← 枠線をやや明確に
shadow-[0_-1px_0_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.07)]  ← 柔らかい影
```

アクティブ項目: 現状の `bg-mint text-park` を維持。明るい背景上でより映える。

非アクティブ: `text-slate-400`（現状 `text-slate-500`）へ少し明るく。

### 変更対象ファイル

`components/app-header.tsx` のモバイルナビ `<nav>` タグのクラスのみ変更。

---

## 4. 食べ物画像表示ルール

### 4-1. 現状の問題

`FoodImage` コンポーネント:
- 実画像: `object-cover` → 拡大・トリミングで食べ物全体が見えない
- プレースホルダー: `object-contain p-6` → 全体表示

### 4-2. 画面別方針

| 画面 / 用途 | 現状 | 変更後 | 理由 |
|---|---|---|---|
| フードカード（`/foods`）画像 | `object-cover` | `object-contain bg-white p-2` | 食べ物全体が見えることを優先 |
| フード詳細（`/foods/[id]`）メイン画像 | `object-cover` | `object-contain bg-white` | 詳細で全体が見えるべき |
| ホーム RailCard サムネ | `object-cover` | `object-cover object-center` | 小サムネでは cover が視覚的に安定 |
| 食べた一覧（コレクション棚）| `object-cover` | `object-contain bg-white` | 密度表示時に食べ物を識別しやすく |
| 食べた recent（横スクロール）| `object-cover` | `object-cover object-center` | aspect-[4/5] の縦長では cover が映える |
| 店舗詳細の食べ物一覧 | `object-cover` | `object-cover object-center` | 店舗コンテキストでは cover 可 |

### 4-3. FoodImage コンポーネントの変更

現状: `object-cover` or `object-contain p-6` の二択（real 判定のみ）

変更後: `variant` prop を追加する。

```tsx
type ImageVariant = "cover" | "contain" | "card";
```

| variant | クラス | 用途 |
|---|---|---|
| `"cover"` | `object-cover object-center` | ホーム rail、recent、店舗リスト |
| `"contain"` | `object-contain bg-white` | フードカード、詳細、コレクション棚 |
| `"card"`（デフォルト） | 実画像: `object-contain bg-white` / プレースホルダー: `object-contain p-6` | 後方互換（`variant` 未指定時）|

**注意:** `variant` prop 未指定時は現状と同じ動作を維持する。`"card"` がデフォルト。呼び出し側の変更はフェーズ 3 で個別に行う。

---

## 5. フードカード（`food-card.tsx`）

### 現状の問題

- `h-[462px]` 固定高さ: デバイス幅によって間延びしやすい
- `h-[252px]` 固定画像高さ: 画像の縦横比によっては空白が目立つ
- 2列表示時（`grid-cols-2`）で幅 ≈ 170px に 252px の高さ → 縦長で過剰

### 変更後方針（Phase 3 実装）

- 固定高さ廃止 → `min-h` + 自然な高さで流す
- 画像: `aspect-[4/3]` に変更（横長。食べ物が収まりやすい）
- テキスト部分: `min-h` を使わず自然な高さ

```tsx
// 変更後のカード構造（概略）
<article className="group relative min-w-0 overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-slate-200/70 ...">
  <Link href={...} className="flex min-h-0 flex-col">
    <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-white">
      <FoodImage food={food} variant="contain" className="h-full w-full ..." />
      {/* badges */}
    </div>
    <div className="flex flex-col px-3 py-3">
      {/* テキスト */}
    </div>
  </Link>
  {/* eaten button */}
</article>
```

---

## 6. 「食べた」一覧 — コレクション棚 UI

### 6-1. 設計思想

「食べた」ページのアルバムは現在 2列（`grid-cols-2`）の大きめカード。
これを「コレクション棚」として再設計する。

**目標:** 50品食べたら 5列 × 10行 = 50個がモバイル画面に密集して見える。

### 6-2. モバイル 390px でのレイアウト計算

| 属性 | 値 | 根拠 |
|---|---|---|
| コンテナ幅 | 358px（390 - px-4×2） | |
| 列数 | 5列 | ユーザー要望 |
| gap | `gap-1` (4px) | gap-1.5 だと 342px÷5=68px、gap-1 で 354÷5=70px ≒ 70px/セル |
| 1セルの幅 | ≈ 70px | |
| 1セルの高さ | 70px（aspect-square） | |
| 1セルの面積 | 70×70px = 4900px² | |

→ `grid-cols-5 gap-1` が最適。

### 6-3. EatenAlbumCard の再設計

現状:
```tsx
<div className="grid-cols-2 gap-x-3 gap-y-5">
  // EatenAlbumCard: aspect-square + テキスト3行
```

変更後（`EatenAlbumCard`）:
```tsx
// グリッドクラス
<div className="grid grid-cols-5 gap-1">

// カード（テキストなし・サムネのみ）
<Link href={`/foods/${food.id}`} className="group min-w-0 relative">
  <div className="relative aspect-square overflow-hidden rounded-[0.5rem] bg-white ring-1 ring-slate-200/50">
    <FoodImage food={food} variant="contain" className="h-full w-full" />
    {/* 食べた状態: 右上に小チェック */}
    <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-park/90 text-white grid place-items-center">
      <Check size={10} />
    </span>
  </div>
</Link>
```

### 6-4. 「食べた」状態の視覚化

コレクション棚での食べた状態:
- 右上に小チェックアイコン（`h-4 w-4`）: `bg-park text-white`
- 枠: `ring-1 ring-park/20`（うっすら緑系の枠）
- grayscale は使わない（棚はすべて食べたものなので）

### 6-5. テキスト表示の扱い

コレクション棚（5列）ではテキストを表示しない。食べ物名は画像 hover / tap で /foods/[id] へ遷移して確認する。

recentLogs セクションは現状のテキスト付き表示を維持する。

### 6-6. セクション別表示切替

| albumMode | 変更 |
|---|---|
| `recent`（最新）| 現状のテキスト付き2列を維持 → ただし `grid-cols-2 md:grid-cols-4` に |
| `month` / `area` / `genre` / `all` | コレクション棚（5列・テキストなし）に変更 |

---

## 7. 「食べた」ボタン押下時のスクロール挙動

### 7-1. 現状の問題

`/foods` ページでフードカードの「食べた」ボタンを押すと、一覧の末尾へスクロールしてしまう。

**原因調査が必要:** `useFoodLogs` のログ更新後に何らかのスクロールが発生している。

### 7-2. 要件

- ボタン押下時: スクロール位置を維持したまま、押したカードだけが「食べた」状態に切り替わる
- 画面ジャンプ禁止
- ページ再マウント禁止

### 7-3. 実装方針

Codex が実装前に `useFoodLogs.ts` と `/foods` ページの構成を確認し、スクロール発生箇所を特定する。

候補原因:
1. `useFoodLogs` の state 更新後に `router.refresh()` が呼ばれている
2. `window.scrollTo` / `element.scrollIntoView` が呼ばれている
3. `key` の変更によるリスト再マウント
4. `useEffect` での副作用

解消策: `router.refresh()` を除去または `startTransition` でラップ。スクロール系 API 呼び出しを無効化。`scrollRestoration = "manual"` を設定。

---

## 8. ページ別優先順位と変更方針

| 優先度 | ページ | 変更内容 |
|---|---|---|
| ★★★ | `/` ホーム | Phase 1（背景白化・nav 調整）のみ |
| ★★★ | `/eaten` | Phase 2（コレクション棚 + スクロール修正）|
| ★★★ | `/foods` | Phase 1（背景）+ Phase 3（カード画像）+ スクロール修正 |
| ★★ | `/foods/[id]` | Phase 3（画像表示）|
| ★★ | `/stores` | Phase 1（背景）|
| ★★ | `/stores/[id]` | Phase 3（画像）|
| ★ | `/areas` | Phase 1（背景）|
| ★ | `/areas/[id]` | Phase 1（背景）|
| ★ | `/settings` | Phase 1（背景）|

---

## 9. 各フェーズのスコープ

### Phase 1: 全体 UI 土台更新（低リスク）

| 変更 | ファイル |
|---|---|
| body 背景 `#f8fafc` → `#ffffff` | `app/globals.css` |
| 下部ナビ 白・明るく調整 | `components/app-header.tsx` |
| bg-white/86・bg-white/70 → bg-white | 主要コンポーネント複数 |
| ring-slate-200/55 → ring-slate-200/70 | `food-card.tsx` 等 |

**リスク:** 低。CSS クラス名の置き換えのみ。既存レイアウトに影響しない。

### Phase 2: 「食べた」コレクション UI 化（中リスク）

| 変更 | ファイル |
|---|---|
| EatenAlbumCard → 5列ミニサムネ | `components/eaten-experience.tsx` |
| グリッド `grid-cols-2` → `grid-cols-5 gap-1` | 同上 |
| テキストなしカード（all / area / genre / month）| 同上 |
| 「食べた」ボタン押下スクロール修正 | `lib/use-food-logs.ts` + `/app/foods/page.tsx` 等 |

**リスク:** 中。`eaten-experience.tsx` は大きなファイルだが変更箇所は限定的。スクロール修正は調査必要。

### Phase 3: 画像表示ルール統一（中リスク）

| 変更 | ファイル |
|---|---|
| `FoodImage` に `variant` prop 追加 | `components/food-image.tsx` |
| フードカード画像: `variant="contain"` + `aspect-[4/3]` | `components/food-card.tsx` |
| フード詳細画像: `variant="contain"` | `components/food-detail.tsx` |
| フードカード固定高廃止 | `components/food-card.tsx` |

**リスク:** 中〜高。`FoodImage` は共有コンポーネント。後方互換を維持する `variant` 設計が重要。

### Phase 4（必要な場合）: 各ページ細部仕上げ

各ページで残る細かい UI の仕上げ。Phase 1〜3 完了後に判断。

---

## 10. 既存資産の保護方針

- i18n Phase B / C / D / C+ 実装は変更しない
- `lib/store-utils.ts` / `lib/food-utils.ts` は変更しない
- `data/translations/` は変更しない
- `scripts/output/` は変更しない
- localStorage schema は変更しない
- URL 構造は変更しない

---

## 11. 実装前確認項目（Codex 向け）

Phase 2 スクロール修正前に確認すること:

```bash
grep -rn "scrollTo\|scrollIntoView\|scroll\|router.refresh" lib/use-food-logs.ts
grep -rn "scrollTo\|scrollIntoView\|scroll\|router.refresh" app/foods/page.tsx components/food-grid.tsx
grep -rn "useEffect" lib/use-food-logs.ts
```

Phase 3 画像変更前に確認すること:

```bash
grep -rn "FoodImage" components/ app/ --include="*.tsx"
```

FoodImage の呼び出し箇所全件を確認し、`variant` prop 追加が後方互換を破らないことを確認する。
