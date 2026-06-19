# Design Review: 「食べた」ページ 上部見出し・エリア別コンプ率整理

**対象 commit:** 949f71d1bbc8bcdcc7bd950e95b751c15c3399073 (feat: polish eaten collection header and area progress)  
**レビュー日:** 2026-06-19  
**レビュー担当:** Claude（設計担当 / レビュー担当）

---

## 判定: 承認

---

## 1. スコープ遵守

| 確認項目 | 結果 |
|---|---|
| 変更ファイルが `components/eaten-experience.tsx` のみ | ✅ 1 file changed |
| `food-card.tsx` 変更なし | ✅ |
| `food-grid.tsx` 変更なし | ✅ |
| `app/eaten/page.tsx` 変更なし | ✅ |
| `data/translations` 変更なし | ✅ |
| `scripts/output` / generated JSON 変更なし | ✅ |
| DB / Supabase 変更なし | ✅ |
| `package.json` 変更なし | ✅ |
| git status: clean | ✅ |

---

## 2. 見出し重複の解消

| 確認項目 | 実測 | 結果 |
|---|---|---|
| h1 `eaten.title` が上部に存在する（L72） | ✅ `text-2xl font-black tracking-tight text-ink` | ✅ |
| アルバムセクションの h2 `eaten.albumTitle` が除去されている | L117–122: h2 なし、カウントと絞り込みのみ | ✅ |
| `eaten.albumKicker`（p タグ）が除去されている | 存在しない | ✅ |
| `eaten.subtitle` の p タグが除去されている | 存在しない（上部がシンプルに） | ✅ |

---

## 3. 5列サムネイルグリッドの維持

| 確認項目 | 期待値 | 実測値（行番号） | 結果 |
|---|---|---|---|
| グリッドクラス | `grid grid-cols-5 gap-0.5 md:grid-cols-8 lg:grid-cols-10` | L149: 完全一致 | ✅ |
| `CollectionThumb` のみ render | 条件分岐なし | L150-152: `<CollectionThumb>` のみ | ✅ |
| CollectionThumb のスタイル変更なし | 前回レビュー通り | L275–288: 変更なし | ✅ |

---

## 4. 一覧の情報表示

| 確認項目 | 結果 |
|---|---|
| 商品名が一覧に表示されない | ✅ |
| 価格が一覧に表示されない | ✅ |
| エリアが一覧に表示されない | ✅ |
| 販売場所が一覧に表示されない | ✅ |
| `/foods/${food.id}` への遷移が維持されている（L279） | ✅ |

---

## 5. エリア別コンプ率カード（L165–193）

### 5-1. データソース

| 確認項目 | 実測 | 結果 |
|---|---|---|
| `calculateAreaProgressList` を `lib/area-progress.ts` からインポート | L7 ✅ | ✅ |
| `lib/area-progress.ts` に `calculateAreaProgressList` が存在する | 確認済み（L85–91） | ✅ |
| `areaProgress` が `foods` + `logs` から計算されている | L36–40 ✅ | ✅ |
| ソート: `active.rate` 降順 → `active.total` 降順 → エリア名昇順 | L37–39 ✅ | ✅ |

### 5-2. カードレイアウト

| 確認項目 | 実測 | 結果 |
|---|---|---|
| グリッド: モバイル 2列、lg 3列 | `grid grid-cols-2 gap-2.5 lg:grid-cols-3` (L174) | ✅ |
| カードスタイル | `rounded-xl border border-slate-200 bg-white px-3 py-2.5` (L176) | ✅ |
| エリア名表示 | `tAreaName(progress.area.name, t)` (L178) — 多言語対応 | ✅ |
| コンプ率 % 表示 | `progress.active.rate}%` — 右上、`text-base font-black text-park` (L179) | ✅ |
| 食べた数 / 全体数 | `{progress.active.eaten} / {progress.active.total}` (L182) | ✅ |
| 細い進捗バー | `h-1.5 overflow-hidden rounded-full bg-slate-100` + `width: ${rate}%` (L184–189) | ✅ |
| 進捗バー色 | `bg-[linear-gradient(90deg,#0057b8,#fdbb30)]` — park ブランドカラーグラデーション | ✅ |

### 5-3. 未食べ表示の非追加

| 確認項目 | 実測 | 結果 |
|---|---|---|
| `uneaten` / `active.uneaten` を表示していない | カード内に uneaten 値の参照なし | ✅ |
| 「残り N 件」表示がない | 存在しない | ✅ |
| 未食べ商品リストがない | 存在しない | ✅ |

### 5-4. i18n キー検証

| キー | 辞書（ja/en/ko/zh-TW）の存在 | 結果 |
|---|---|---|
| `eaten.areaProgress.kicker` | ✅ 全4ロケール確認 | ✅ |
| `eaten.areaProgress.title` | ✅ 全4ロケール確認 | ✅ |
| `eaten.areaProgress.areaCount` | ✅ 全4ロケール確認 | ✅ |

新規の未翻訳キーなし。数値は直接 `progress.active.*` から取得。

---

## 6. 既存コンポーネントの扱い

| 確認項目 | 実測 | 結果 |
|---|---|---|
| `EatenAreaProgress` コンポーネントの import が除去されている | L15: `EatenAreaProgress` なし | ✅ |
| `EatenGenreProgress` は維持されている | L195: `<EatenGenreProgress foods={foods} />` | ✅ |
| `eaten-area-progress.tsx` 本体は変更なし（import 除去のみ） | スコープ外ファイルは未変更 | ✅ |

---

## 7. 非復活確認

| 確認項目 | 期待状態 | 実測 | 結果 |
|---|---|---|---|
| チェックバッジ | 存在しない | CollectionThumb に `<Check>` なし | ✅ |
| albumMode タブ（recent/month/area/genre/all）| 存在しない | albumMode state なし | ✅ |
| 「最近食べたもの」横スクロールレール | 存在しない | recentLogs なし | ✅ |

---

## 8. 食べたログ保存ロジック

| 確認項目 | 行番号 | 結果 |
|---|---|---|
| `useFoodLogs` 呼び出しが維持されている | L29 | ✅ |
| `buildEatenAlbumRecords` が変更されていない | L225–238 | ✅ |
| `filteredEatenRecords` が変更されていない | L50–55 | ✅ |
| `EatenAlbumCard` 定義が残存している | L240–273 | ✅ |

---

## 9. 品質保証

| 確認項目 | 結果 |
|---|---|
| `npm run lint` | ✅ 成功 |
| `npm run typecheck` | ✅ 成功 |
| `npm run build` | ✅ 成功 |
| git status: clean | ✅ |
| main / origin/main 同期済み | ✅ |
| 差分: 36 insertions / 12 deletions — 適切な範囲 | ✅ |

---

## 10. 総評

見出し重複（「食べた記録」h1 + 「食べた商品一覧」h2）の解消、上部の `eaten.subtitle` 削除によるシンプル化、`EatenAreaProgress` コンポーネントをインラインカードグリッドに置き換えたエリア別コンプ率表示、いずれも仕様通りに実装されている。

エリアカードは `calculateAreaProgressList`（既存 `lib/area-progress.ts`）を直接活用しており、新規ロジックの追加なし。i18n キー 3件はすべて辞書に存在。進捗バーに park ブランドカラーグラデーションを使用しており、ユニバ感と高級感の両立に貢献している。未食べ表示・albumMode タブ・最近食べたセクションの非復活も確認済み。lint / typecheck / build 全通過。

---

## 証跡

- `components/eaten-experience.tsx` 全行読み取り済み（349行）
- `lib/area-progress.ts` 全行読み取り済み（100行）— `calculateAreaProgressList` 存在・型確認
- `lib/i18n/dictionaries.ts` で `eaten.areaProgress.*` 3キーを全4ロケールで確認
- L149: グリッドクラス確認
- L165–193: エリア別コンプ率カードセクション全体確認
- L195: `EatenGenreProgress` 残存確認
- L240–273: `EatenAlbumCard` 残存確認
- 実装 commit: `949f71d1bbc8bcdcc7bd950e95b751c15c3399073`
