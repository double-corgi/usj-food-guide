# Design Review: Homeファーストビュー 8枚グリッド廃止・16:9ビジュアルヒーロー化

**対象 commit:** c52de584248022f4226da1bd3757ae1fac553878 (feat: replace home collection grid with hero visual)  
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
| `/eaten` 側コンポーネント変更なし | ✅ |
| `/foods` 側コンポーネント変更なし | ✅ |
| `package.json` 変更なし | ✅ |

---

## 2. 旧8枚グリッドの完全削除

| 確認項目 | 結果 |
|---|---|
| `SHELF_SLOTS = 18` / `MOBILE_SHELF_SLOTS = 8` / `TABLET_SHELF_SLOTS = 16` 定数が削除されている | ✅ |
| `pickShelfFoods` 関数が削除されている | ✅ |
| `useNewlyStampedKeys` フック（スタンプアニメーション）が削除されている | ✅ |
| `useState` / `useRef` / `useEffect` import が削除されている（L3: `useMemo` のみ） | ✅ |
| `grid grid-cols-4 gap-1.5 md:grid-cols-8 lg:grid-cols-6` グリッド JSX が削除されている | ✅ |
| 旧グリッド内の食品ごとの `<Link href={'/foods/${food.id}'}...>` が削除されている | ✅ |
| eaten チェックバッジ（`ring-2 ring-[#fdbb30]/85` + `✓` span）が削除されている | ✅ |

---

## 3. 16:9ビジュアルヒーロー

| 確認項目 | 実測（行番号） | 結果 |
|---|---|---|
| `aspect-video`（= 16/9）コンテナが使われている | L90: `relative aspect-video overflow-hidden rounded-[1.35rem]` | ✅ |
| `FoodImage` が `variant="cover"` で `h-full w-full` にストレッチされている | L92: `<FoodImage ... className="h-full w-full scale-[1.02] saturate-[1.04]" variant="cover" />` | ✅ |
| フォールバック（heroFood なし）は CSS グラデーション div で対応 | L94: `bg-[radial-gradient(...)]` | ✅ |
| オーバーレイグラデーション（左暗め→透明 / 下暗め）が追加されている | L96–97 | ✅ |
| 装飾要素（円・光点）が `aria-hidden` で追加されている | L98–99 | ✅ |
| 「TODAY'S COLLECTION」ラベル + 商品名テキストが左下に表示される | L100–103 | ✅ |

---

## 4. 商品画像ごとの詳細リンク削除

| 確認項目 | 実測 | 結果 |
|---|---|---|
| ヒーロービジュアル全体が `<Link>` で囲まれていない | L90–104: `<div>` のみ。`<Link>` なし | ✅ |
| ヒーロー内の `<FoodImage>` に `href` / `<Link>` なし | ✅ | ✅ |

ヒーローは装飾的なビジュアル扱いで、タップで詳細ページに遷移する挙動は意図的に持たない。

---

## 5. 新規画像生成・外部画像取得なし

| 確認項目 | 結果 |
|---|---|
| 外部 URL からの画像取得なし | ✅ |
| 新規画像ファイルの追加なし | ✅ |
| `<img>` タグの src に直書き URL なし | ✅ |
| フォールバックは CSS グラデーションのみ（画像非依存） | ✅ |
| `FoodImage` コンポーネント（既存）を使用 | ✅ |

---

## 6. Hydration mismatch リスク確認

| 確認項目 | 実測 | 結果 |
|---|---|---|
| `Math.random()` 直使用なし | ファイル全体で `Math.random` 0件 | ✅ |
| `seededScore` は FNV-1a 決定論的ハッシュ（L453–460） | ✅ | ✅ |
| `getDailySeedKey()` は `Intl.DateTimeFormat` + `timeZone: "Asia/Tokyo"` 固定（L444–451） | ✅ | ✅ |
| `pickHeroFood` は `useMemo` 内でのみ呼び出される（L37） | ✅ | ✅ |
| seed に `eatenCount` と `activeFoods.length` を含む（L262）→ 日+コレクション状態で一意に確定 | ✅ | ✅ |

`getDailySeedKey()` は `new Date()` を使用するが、タイムゾーンが Asia/Tokyo 固定のため、クライアントのロケールに依存せずサーバー/クライアント間で同一の日付文字列が生成される。`useMemo` でクライアントのみ実行されるため SSR 問題なし。

---

## 7. コレクション統計・進捗バーの維持

| 確認項目 | 行番号 | 結果 |
|---|---|---|
| `completion.eaten`（食べた数）表示 | L64 | ✅ |
| `completion.total`（販売中数） | L67 | ✅ |
| `remaining`（残り数） | L36, L67 | ✅ |
| 進捗バー（`animate-home-progress-fill`） | L70–78 | ✅ |
| `completion.rate`（達成率 %） | L77 | ✅ |
| `hasCollection` 分岐（初回表示 vs コレクション済み） | L38, L59–85 | ✅ |

---

## 8. 下部セクションへの副作用なし

| コンポーネント | 変更 | 結果 |
|---|---|---|
| `HomeActiveFoodCollection`（L111–151） | 変更なし（`shelfKeys` 算出ロジックのみ更新） | ✅ |
| `HomeLimitedCollection`（L153–195） | 変更なし | ✅ |
| `HomeRecentRecords`（L197–227） | 変更なし | ✅ |
| `HomeFoodRailCard`（L229–250） | 変更なし | ✅ |

**`shelfKeys` の変更について:**

旧: `new Set(pickShelfFoods(foods, logs, SHELF_SLOTS).map(getCanonicalFoodKey))` — グリッド18件を除外  
新: `new Set(heroFood ? [getCanonicalFoodKey(heroFood)] : [])` — ヒーロー1件のみ除外（L114–117）

ヒーロー表示が1件に集約された設計変更に対して、除外対象を1件に絞るのは正しい。下部レール（`HomeActiveFoodCollection`）にヒーローと同じ食品が重複表示されないよう適切に維持されている。

---

## 9. 商品名翻訳の維持

| 確認項目 | 行番号 | 結果 |
|---|---|---|
| `locale` を `useLocale()` から取得 | L33 | ✅ |
| `heroDisplayName = getFoodNameI18n(heroFood.id, locale, heroFood.name)` | L39 | ✅ |
| `FoodImage` の `alt` に `heroDisplayName` | L92 | ✅ |
| フォールバック div の `aria-label` に `heroDisplayName` | L94 | ✅ |
| 左下の商品名テキストに `heroDisplayName` | L102 | ✅ |
| heroFood が null の場合: `heroDisplayName = appBrand.name` | L39 | ✅ |

---

## 10. Coverage（変化なし）

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

## 11. 品質保証

| 確認項目 | 結果 |
|---|---|
| `npm run lint` | ✅ 成功 |
| `npm run typecheck` | ✅ 成功 |
| `npm run build` | ✅ 成功 |
| `npm run coverage` | ✅ 成功・期待値全一致 |
| `git status --short` | ✅ clean |
| main / origin/main 同期済み | ✅ |

---

## 12. 総評

旧8枚グリッド（`pickShelfFoods` / `useNewlyStampedKeys` / 食品ごとの Link）が完全に除去され、`aspect-video`（16:9）の単一ビジュアルヒーローに置き換えられている。`FoodImage` + 既存商品データのみを使用し、新規画像生成・外部取得はなし。`Math.random()` を使わず `seededScore` + `getDailySeedKey()` による決定論的選定で hydration リスクなし。コレクション統計・進捗バー・下部レール全コンポーネント・商品名翻訳はすべて維持。Coverage・lint/typecheck/build 全通過。

---

## 証跡

- `components/home-progress-client.tsx` 全461行読み取り済み
- L3: import が `useMemo` のみ（`useState` / `useRef` / `useEffect` 削除）確認
- L24–28: 旧 `SHELF_SLOTS` / `MOBILE_SHELF_SLOTS` / `TABLET_SHELF_SLOTS` 定数 削除確認
- L37: `pickHeroFood` を `useMemo` 内で呼び出し確認
- L39: `getFoodNameI18n` 呼び出し確認
- L90–104: `aspect-video` + `FoodImage` + オーバーレイ + テキストレイヤー確認
- L114–117: `shelfKeys` を heroFood 1件に絞る変更確認
- `pickShelfFoods` / `useNewlyStampedKeys` / `Math.random` の全件不在確認
- 実装 commit: `c52de584248022f4226da1bd3757ae1fac553878`
