# Design Review: Homeファーストビュー 16:9ビジュアルヒーロー 最終ポリッシュ

**対象 commit:** 9f5bafd5650e677bca5a8e83e33da44a5460edc5 (feat: polish home collection hero visual)  
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

## 2. 16:9ヒーローの維持

| 確認項目 | 実測（行番号） | 結果 |
|---|---|---|
| `aspect-video`（16:9）コンテナが維持されている | L90 | ✅ |
| `overflow-hidden` による切り抜きが維持されている | L90 | ✅ |

---

## 3. 画像の見え方改善

### ぼかし背景レイヤー追加（L92）

| 確認項目 | 実測 | 結果 |
|---|---|---|
| 同一 `heroFood` をぼかしレイヤーとして使用 | `absolute inset-0 h-full w-full scale-110 opacity-45 blur-2xl saturate-[1.1]` | ✅ |
| 装飾目的のため `alt=""` が設定されている | `alt=""` | ✅ |
| 新規画像・外部画像の取得なし | `heroFood`（既存商品データ）のみ使用 | ✅ |

### メイン画像のスケール調整（L95）

| 確認項目 | 前回 | 今回 | 結果 |
|---|---|---|---|
| メイン画像のスケール | `scale-[1.02]` | `scale-[1.01]` | ✅ 抑制 |
| `alt` にアクセシブルな商品名 | `alt={heroDisplayName}` | `alt={heroDisplayName}` | ✅ |

---

## 4. 商品カード感の軽減

### "TODAY'S COLLECTION" 見出し削除

| 確認項目 | 結果 |
|---|---|
| `TODAY'S COLLECTION` テキストが削除されている | ✅ |
| `text-base font-black ... sm:text-lg` の大きな商品名テキストが削除されている | ✅ |

### 小さな半透明バッジへの置き換え（L106–108）

| 確認項目 | 実測 | 結果 |
|---|---|---|
| 商品名がピル型バッジに変更されている | `rounded-full border border-white/20 bg-[#071b3a]/28 px-3 py-1.5` | ✅ |
| テキストサイズが `text-[10px]` に縮小されている | `text-[10px] font-black leading-4 tracking-[0.14em]` | ✅ |
| `backdrop-blur-md` でフロストグラス効果 | ✅ | ✅ |
| `line-clamp-1` で1行切り抜き | ✅ | ✅ |

---

## 5. 画像が商品詳細リンクになっていないこと

| 確認項目 | 実測 | 結果 |
|---|---|---|
| ヒーロービジュアルを `<Link>` で囲んでいない | L90–109: `<div>` のみ | ✅ |
| 画像タップで詳細ページへの遷移なし | ✅ | ✅ |

---

## 6. 新規画像生成・外部画像取得なし

| 確認項目 | 結果 |
|---|---|
| `FoodImage` に渡しているのは `heroFood`（既存商品データ）のみ | ✅ |
| ぼかしレイヤー・メイン画像ともに同一 `heroFood` を使用 | ✅ |
| 外部 URL・新規ファイル参照なし | ✅ |
| CSS グラデーション fallback（`heroFood` null 時）は純粋 CSS のみ | ✅ |

---

## 7. hydration mismatch リスクなし

| 確認項目 | 実測 | 結果 |
|---|---|---|
| `Math.random()` 使用なし | ファイル全体で 0件 | ✅ |
| `seededScore` は FNV-1a 決定論的ハッシュ（L458–465） | ✅ | ✅ |
| `getDailySeedKey()` は `timeZone: "Asia/Tokyo"` 固定（L449–456） | ✅ | ✅ |
| `pickHeroFood` は `useMemo` 内でのみ実行（L37） | ✅ | ✅ |

---

## 8. 装飾の評価

### 追加・調整された装飾（すべて `aria-hidden`）

| 要素 | 実測 | 評価 |
|---|---|---|
| 内側細線取り | `absolute inset-3 rounded-[1.15rem] border border-white/28`（L101） | 上品・控えめ ✅ |
| ゴールド大円 | `h-20 w-20 border border-[#fdbb30]/38 opacity-70`（L102） | 高級感あり ✅ |
| 白小円（入れ子） | `h-10 w-10 border border-white/22`（L103） | 奥行き感 ✅ |
| 光の粒 | `h-2 w-2 bg-[#fdbb30]/80 shadow-[0_0_20px_...]`（L104） | 維持 ✅ |
| 水平ライン | `h-px w-16 bg-gradient-to-r from-transparent via-white/60 to-transparent`（L105） | 洗練 ✅ |
| 左グラデーションオーバーレイ | 透明度 `0.36`（旧: `0.42`）に弱まった | 画像邪魔せず ✅ |
| 下グラデーションオーバーレイ | `h-2/3`（旧: `h-1/2`）で範囲拡大・暗度 `0.36` に抑制 | バランス良好 ✅ |
| 影 | `0_22px_54px_rgba(7,27,58,0.14)`（旧: `0_18px_45px`）微強化 | 浮き感アップ ✅ |
| 角丸 | `rounded-[1.5rem]`（旧: `rounded-[1.35rem]`）微拡大 | 柔らかさアップ ✅ |

装飾の総量は多いが、すべて `aria-hidden` でアクセシビリティに影響せず、透明度・サイズともに控えめで過剰感はない。ユニバ感・高級感の目標に沿っている。

---

## 9. コレクション統計・進捗バーの維持

| 確認項目 | 行番号 | 結果 |
|---|---|---|
| `completion.eaten`（食べた数） | L64 | ✅ |
| `completion.total`（販売中数） | L67 | ✅ |
| `remaining`（残り数） | L36, L67 | ✅ |
| 進捗バー `animate-home-progress-fill` | L70–78 | ✅ |
| `completion.rate`（達成率 %） | L77 | ✅ |
| `hasCollection` 分岐（初回 / コレクション済み） | L38, L59–85 | ✅ |

---

## 10. 下部セクション・商品名翻訳の維持

| コンポーネント | 変更 | 結果 |
|---|---|---|
| `HomeActiveFoodCollection`（L116–156） | 変更なし | ✅ |
| `HomeLimitedCollection`（L158–200） | 変更なし | ✅ |
| `HomeRecentRecords`（L202–232） | 変更なし | ✅ |
| `HomeFoodRailCard`（L234–255） | 変更なし | ✅ |

商品名翻訳:

| 確認項目 | 行番号 | 結果 |
|---|---|---|
| `heroDisplayName = getFoodNameI18n(heroFood.id, locale, heroFood.name)` | L39 | ✅ |
| メイン画像 `alt={heroDisplayName}` | L95 | ✅ |
| バッジテキスト `{heroDisplayName}` | L107 | ✅ |
| フォールバック div `aria-label={heroDisplayName}` | L97 | ✅ |

---

## 11. Coverage（変化なし）

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

## 12. 品質保証

| 確認項目 | 結果 |
|---|---|
| `npm run lint` | ✅ 成功 |
| `npm run typecheck` | ✅ 成功 |
| `npm run build` | ✅ 成功 |
| `npm run coverage` | ✅ 成功・期待値全一致 |
| `git status --short` | ✅ clean |
| main / origin/main 同期済み | ✅ |

---

## 13. 総評

今回の変更は `HomeCollectionHero` の JSX（L88–113）のみに限定されており、他のコンポーネント・関数・データ層には一切手が加わっていない。同一の `heroFood` を2枚重ねる（ぼかし背景 + メイン）手法は既存 `FoodImage` + CSS のみで完結しており、新規画像取得は発生しない。"TODAY'S COLLECTION" 削除と商品名の小さなバッジ化によって「商品カードを見ている」感が弱まり、ビジュアルヒーローとしての「場の演出」感が高まっている。装飾はすべて `aria-hidden`・透明度控えめで過剰感なし。統計・進捗バー・下部レール・翻訳すべて維持。lint/typecheck/build/coverage 全通過。

---

## 証跡

- `components/home-progress-client.tsx` 全466行読み取り済み
- L90: `aspect-video` 維持確認
- L92: ぼかし背景レイヤー（`blur-2xl opacity-45 scale-110`、`alt=""`）確認
- L95: メイン画像 `scale-[1.01]`・`alt={heroDisplayName}` 確認
- L101–105: 内側細線・同心円装飾・光点・水平ライン全 `aria-hidden` 確認
- L106–108: 半透明ピルバッジ・`text-[10px]`・`backdrop-blur-md` 確認
- L39: `getFoodNameI18n` 呼び出し確認
- `Math.random` 0件確認
- 実装 commit: `9f5bafd5650e677bca5a8e83e33da44a5460edc5`
