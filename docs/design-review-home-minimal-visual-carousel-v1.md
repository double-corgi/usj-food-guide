# Design Review: Homeファーストビュー ミニマルビジュアルカルーセル化

**対象 commit:** 73ff0ccee7512e7d0733b8ec8d786df6791f4dff (feat: rebuild home hero as minimal visual carousel)  
**レビュー日:** 2026-06-19  
**レビュー担当:** Claude（設計担当 / レビュー担当）

---

## 判定: 承認

---

## 1. スコープ遵守

| 確認項目 | 結果 |
|---|---|
| 変更ファイルが `components/home-progress-client.tsx` のみ | ✅ |
| `data/translations` 変更なし | ✅ |
| `scripts/output` / generated JSON 変更なし | ✅ |
| DB / crawler 変更なし | ✅ |
| `docs` 変更なし | ✅ |
| `app/page.tsx` 変更なし | ✅ |
| `/eaten` 側 変更なし | ✅ |
| `/foods` 側 変更なし | ✅ |
| `package.json` 変更なし | ✅ |

---

## 2. 旧8枚グリッドの非復活確認

| 確認項目 | 結果 |
|---|---|
| `SHELF_SLOTS` / `MOBILE_SHELF_SLOTS` / `TABLET_SHELF_SLOTS` 定数が存在しない | ✅ |
| `pickShelfFoods` 関数が存在しない | ✅ |
| `useNewlyStampedKeys` フックが存在しない | ✅ |
| `grid grid-cols-4` / `grid-cols-8` 等の食品グリッドが存在しない | ✅ |
| チェックバッジ（`✓` / `animate-achievement-unlock`）が存在しない | ✅ |

---

## 3. 商品詳細リンクの非復活確認

ヒーロービジュアル全体（L102–133）内に `<Link>` が存在しない。カルーセル各スライドの `<FoodImage>` は `<div>` 内に置かれており、タップ遷移なし。✅

---

## 4. 16:9ヒーローの維持

| 確認項目 | 実測（行番号） | 結果 |
|---|---|---|
| `aspect-video`（= 16:9）コンテナ維持 | L102: `relative aspect-video overflow-hidden rounded-[1.45rem]` | ✅ |
| `overflow-hidden` 維持 | L102 | ✅ |

---

## 5. カルーセル実装

### 定数（L27–28）

| 定数 | 値 | 意味 |
|---|---|---|
| `HERO_VISUAL_COUNT` | `5` | カルーセル最大枚数 |
| `HERO_ROTATE_MS` | `5200` | 切り替えインターバル（ms） |

### 状態管理（L40–50）

| 確認項目 | 実測 | 結果 |
|---|---|---|
| `useState(0)` — 初期 index | L40: `const [heroIndex, setHeroIndex] = useState(0)` | ✅ SSR 安全 |
| `setHeroIndex` は `useEffect` 内のみで変更 | L41–48 | ✅ |
| `heroFoods.length` が 0 の場合は除算なし | L49: `heroFoods.length ? heroIndex % heroFoods.length : 0` | ✅ |
| `heroFood = heroFoods[activeHeroIndex] ?? null` | L50 | ✅ |

### 画像レイアウト（L103–119）

| 確認項目 | 実測 | 結果 |
|---|---|---|
| 全スライド `absolute inset-0 h-full w-full` でスタック | L112 | ✅ |
| フェード切り替え `transition-opacity duration-1000 ease-out` | L112 | ✅ |
| アクティブスライドが `opacity-100`、非アクティブが `opacity-0` | L112 | ✅ |
| アクティブスライドのみ `alt={displayName}`、非アクティブは `alt=""` | L111 | ✅ アクセシビリティ正しい |
| フォールバック（heroFoods 空）は CSS グラデーション div | L118 | ✅ |

### ドットインジケーター（L122–131）

| 確認項目 | 実測 | 結果 |
|---|---|---|
| `heroFoods.length > 1` のときのみ表示 | L122 | ✅ |
| `aria-hidden` 付与 | L123 | ✅ |
| アクティブ: `w-5 bg-white`、非アクティブ: `w-1.5 bg-white/45` | L127 | ✅ |
| `transition-all duration-500` でスムーズ変化 | L127 | ✅ |

---

## 6. 既存商品データ・FoodImage のみ使用

| 確認項目 | 結果 |
|---|---|
| `pickHeroFoods` は `foods` prop（既存データ）から選定 | ✅ |
| 外部 URL / 新規ファイル参照なし | ✅ |
| `FoodImage` コンポーネント（既存）のみ使用 | ✅ |
| フォールバックは純粋 CSS グラデーション | ✅ |

---

## 7. render中の Math.random 不使用

| 確認項目 | 結果 |
|---|---|
| ファイル全体で `Math.random` 0件 | ✅ |
| 順序決定は `seededScore`（FNV-1a 決定論的ハッシュ、L483–490）+ `getDailySeedKey()`（日付ベース） | ✅ |

---

## 8. Hydration mismatch リスクなし

| 確認項目 | 実測 | 結果 |
|---|---|---|
| `useState(0)` — SSR も CSR も初期値 `0` で一致 | L40 | ✅ |
| `setHeroIndex` は `useEffect` 内のみ（クライアント限定） | L44–47 | ✅ |
| SSR 時は `activeHeroIndex = 0`、hydration 後も `0` から始まる → 一致 | ✅ | ✅ |
| `getDailySeedKey()` は `timeZone: "Asia/Tokyo"` 固定 → SSR/CSR で同一文字列 | L474–481 | ✅ |
| `pickHeroFoods` は `useMemo` 内で決定論的 → SSR/CSR で同一順序 | L39 | ✅ |
| `window.matchMedia` は `useEffect` 内アクセス（render 時でない） | L43 | ✅ |

---

## 9. prefers-reduced-motion 配慮

| 確認項目 | 実測（行番号） | 結果 |
|---|---|---|
| `window.matchMedia("(prefers-reduced-motion: reduce)").matches` でチェック | L43 | ✅ |
| 一致時は `setInterval` を設定せず自動切替を停止 | L43: `return;` | ✅ |
| チェックは `useEffect` 内のみ（SSR 安全） | L41–48 | ✅ |

---

## 10. 旧装飾の完全削除

| 確認項目 | 結果 |
|---|---|
| 同心円装飾（`h-16 w-16 / h-20 w-20 rounded-full border border-[#fdbb30]`）削除 | ✅ |
| 白小円（`h-10 w-10 border border-white/22`）削除 | ✅ |
| 光粒（`h-2 w-2 rounded-full bg-[#fdbb30]/80 shadow-[0_0_20px_...]`）削除 | ✅ |
| 水平細ライン（`h-px w-16 bg-gradient-to-r`）削除 | ✅ |
| 内側細線取り（`absolute inset-3 border border-white/28`）削除 | ✅ |
| 商品名ピルバッジ（`rounded-full bg-[#071b3a]/28 backdrop-blur-md`）削除 | ✅ |

残存する要素はグラデーションオーバーレイ 2枚（L120–121、ともに `aria-hidden`）とドットインジケーター（L122–131、`aria-hidden`）のみ。ミニマル設計に沿っている。

---

## 11. タイトル文字組みの改善

| 項目 | 旧 | 新（行番号） | 評価 |
|---|---|---|---|
| "USJ FOOD COLLECTION" tracking | `tracking-[0.14em]` | `tracking-[0.22em]`（L59） | 視認性向上 ✅ |
| フランキングライン（`h-px w-4`） | あり | なし | シンプル化 ✅ |
| アクセントライン | なし | `h-0.5 w-16 rounded-full bg-[linear-gradient(90deg,#0057b8,#fdbb30)]`（L62） | ブランドカラー強化 ✅ |
| h1 サイズ | `text-[1.4rem]` | `text-[1.55rem]`（L64） | 重心向上 ✅ |
| h1 tracking | `tracking-[0.02em]` | `tracking-[-0.02em]`（L64） | タイトな文字組み ✅ |
| h1 leading | `leading-[1.2]` | `leading-[1.12]`（L64） | 凝縮感 ✅ |

---

## 12. コレクション統計・進捗バーの維持

| 確認項目 | 行番号 | 結果 |
|---|---|---|
| `completion.eaten`（食べた数） | L76 | ✅ |
| `completion.total`（販売中数） | L79 | ✅ |
| `remaining`（残り数） | L38, L79 | ✅ |
| 進捗バー `animate-home-progress-fill` | L82–90 | ✅ |
| `completion.rate`（達成率 %） | L89 | ✅ |
| `hasCollection` 分岐 | L51, L71–98 | ✅ |

---

## 13. 下部セクションへの副作用なし

| コンポーネント | 確認 | 結果 |
|---|---|---|
| `HomeActiveFoodCollection`（L139–179） | 変更なし（shelfKeys 算出のみ更新、後述） | ✅ |
| `HomeLimitedCollection`（L181–223） | 変更なし | ✅ |
| `HomeRecentRecords`（L225–255） | 変更なし | ✅ |
| `HomeFoodRailCard`（L257–278） | 変更なし | ✅ |

**`shelfKeys` の変更について（L142–145）:**

旧: `new Set(heroFood ? [getCanonicalFoodKey(heroFood)] : [])` — 1件を除外  
新: `new Set(heroFoods.map(getCanonicalFoodKey))` — カルーセル5件を除外

カルーセルに表示される最大5件を下部アクティブレールから除外する正しい対応。下部レールにカルーセルと同じ食品が重複するのを防いでいる。✅

---

## 14. 商品名翻訳の維持

| 確認項目 | 行番号 | 結果 |
|---|---|---|
| `locale` を `useLocale()` から取得 | L35 | ✅ |
| `heroDisplayName = getFoodNameI18n(heroFood.id, locale, heroFood.name)` | L52 | ✅ |
| スライド毎の `displayName = getFoodNameI18n(food.id, locale, food.name)` | L105 | ✅ |
| アクティブスライド `alt={displayName}`、非アクティブ `alt=""` | L111 | ✅ |
| フォールバック div `aria-label={heroDisplayName}` | L118 | ✅ |

---

## 15. Coverage（変化なし）

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

## 16. 品質保証

| 確認項目 | 結果 |
|---|---|
| `npm run lint` | ✅ 成功 |
| `npm run typecheck` | ✅ 成功 |
| `npm run build` | ✅ 成功 |
| `npm run coverage` | ✅ 成功・期待値全一致 |
| `git status --short` | ✅ clean |
| main / origin/main 同期済み | ✅ |

---

## 17. 総評

旧単一ヒーロー（ぼかし背景 + 装飾多数）を、`useState(0)` + `useEffect` による 5.2秒インターバルカルーセルに置き換えた設計として適切。全スライド `opacity-0/100` で DOM 保持 → SSR/CSR hydration 一致。`prefers-reduced-motion` チェックは `useEffect` 内の `window.matchMedia` で安全に実装。`Math.random` なし、装飾全廃。タイトル文字組み（tracking 強化・h1 大型化・アクセントライン）は前版より整理されており、ミニマルな方向性に沿っている。下部レールは `shelfKeys` 5件除外対応のみ更新し、他は全件変更なし。lint/typecheck/build/coverage 全通過。

---

## 証跡

- `components/home-progress-client.tsx` 全491行読み取り済み
- L27–28: `HERO_VISUAL_COUNT = 5` / `HERO_ROTATE_MS = 5200` 確認
- L39: `pickHeroFoods` を `useMemo` 内で呼び出し確認
- L40: `useState(0)` 確認
- L41–48: `useEffect` + `prefers-reduced-motion` チェック確認
- L49–50: `activeHeroIndex` / `heroFood` 算出確認
- L102: `aspect-video` 維持確認
- L103–119: 全スライドスタック + フェード + フォールバック確認
- L111: `alt={active ? displayName : ""}` 確認
- L122–131: ドットインジケーター・`aria-hidden` 確認
- L120–121: オーバーレイ 2枚のみ残存（装飾全廃）確認
- L59–66: 新タイトル文字組み確認
- L142–145: `shelfKeys` 5件除外確認
- `Math.random` 全件不在確認
- 実装 commit: `73ff0ccee7512e7d0733b8ec8d786df6791f4dff`
