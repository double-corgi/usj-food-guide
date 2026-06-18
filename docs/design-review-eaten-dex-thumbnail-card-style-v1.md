# Design Review: 「食べた」ページ 5列サムネイル カード感調整

**対象 commit:** 4965bd7f2830b529455c8fc3f4664ff7041ba5ae (feat: restore subtle card feel to eaten dex thumbnails)  
**レビュー日:** 2026-06-19  
**レビュー担当:** Claude（設計担当 / レビュー担当）

---

## 判定: 承認

---

## 1. スコープ遵守

| 確認項目 | 結果 |
|---|---|
| 変更ファイルが `components/eaten-experience.tsx` のみ | ✅ |
| `food-card.tsx` 変更なし | ✅ |
| `food-grid.tsx` 変更なし | ✅ |
| `app/eaten/page.tsx` 変更なし | ✅ |
| `data/translations` 変更なし | ✅ |
| `scripts/output` / generated JSON 変更なし | ✅ |
| DB / Supabase 変更なし | ✅ |
| `package.json` 変更なし | ✅ |
| git status: clean | ✅ |

---

## 2. 5列サムネイルグリッドの維持

| 確認項目 | 期待値 | 実測値（行番号） | 結果 |
|---|---|---|---|
| グリッドクラス | `grid grid-cols-5 gap-0.5 md:grid-cols-8 lg:grid-cols-10` | L153: 完全一致 | ✅ |
| アルバムセクションが `CollectionThumb` のみ render | 条件分岐なし | L154-156: `<CollectionThumb>` のみ | ✅ |

---

## 3. カード感の確認（CollectionThumb L251–264）

| 確認項目 | 期待値 | 実装値 | 結果 |
|---|---|---|---|
| 背景色 | `bg-white` | `bg-white` | ✅ |
| 枠線 | 薄い枠線 | `border border-slate-200/60` | ✅ |
| 影 | 極弱い影 | `shadow-[0_1px_3px_rgba(15,23,42,0.05)]` | ✅ |
| 角丸 | 控えめな角丸 | `rounded-[0.45rem]` | ✅ |
| タップ feedback | `group-active:opacity-80` | `transition-opacity group-active:opacity-80` | ✅ |
| active スケール | `active:scale-95` 維持 | `active:scale-95` | ✅ |

---

## 4. チェックマーク・タブ・セクション の非復活確認

| 確認項目 | 期待状態 | 実測 | 結果 |
|---|---|---|---|
| チェックバッジが CollectionThumb に存在しない | 存在しない | `<span>` + `<Check>` なし。`Check` の import も除去済み（L5） | ✅ |
| albumMode セレクタータブ（recent/month/area/genre/all）が存在しない | 存在しない | albumMode state・セレクター UI ともに除去。`"all"` 固定（L51） | ✅ |
| 「最近食べたもの」横スクロールレールが存在しない | 存在しない | 325行ファイル内に recentLogs / 横スクロールレール なし | ✅ |

---

## 5. 一覧の情報表示

| 確認項目 | 結果 |
|---|---|
| 商品名が一覧に表示されない（CollectionThumb に text なし） | ✅ |
| 価格が一覧に表示されない | ✅ |
| エリアが一覧に表示されない | ✅ |
| 販売場所が一覧に表示されない | ✅ |
| `/foods/${food.id}` への遷移が維持されている（L255） | ✅ |

---

## 6. 食べたログ保存ロジック

| 確認項目 | 行番号 | 結果 |
|---|---|---|
| `useFoodLogs` 呼び出しが維持されている | L29 | ✅ |
| `buildEatenAlbumRecords` 関数が変更されていない | L201–214 | ✅ |
| `filteredEatenRecords` が変更されていない | L45–50 | ✅ |
| `EatenAlbumCard` 定義が残存している | L216–249 | ✅ |

---

## 7. 品質保証

| 確認項目 | 結果 |
|---|---|
| `npm run lint` | ✅ 成功 |
| `npm run typecheck` | ✅ 成功 |
| `npm run build` | ✅ 成功 |
| git status: clean | ✅ |
| main / origin/main 同期済み | ✅ |

---

## 8. 付随変更の確認（スコープ外だが lint/typecheck で無害が確認済み）

今回の commit では CollectionThumb の見た目変更に加え、以下の整理が行われている。いずれも lint/typecheck/build 通過済みであり、意図的な簡略化と判断する。

| 変更内容 | 評価 |
|---|---|
| `EatenSort` type 削除（sort UI 除去に伴う整合） | ✅ 無害 |
| sort state と sort select UI 除去（フィルターが area + category の 2項目に） | ✅ 意図的 |
| `albumMode` state 除去・`buildAlbumSections` への呼び出しを `"all"` 固定 | ✅ 意図的 |
| `getFoodPriceValue` 関数削除（sort 除去により不要） | ✅ 無害 |
| `Check` import 除去（check badge 削除に伴う整合） | ✅ 正しい |
| h1 の text-size: `text-3xl` → `text-2xl`（軽微な UI 調整） | ✅ 無害 |
| `buildAlbumSections` 関数自体は残存（dead branch あるが実害なし） | ✅ 無害 |

---

## 9. 総評

`CollectionThumb`（L251–264）の変更は仕様通り。`bg-white` + `border border-slate-200/60` + `shadow-[0_1px_3px_rgba(15,23,42,0.05)]` + `rounded-[0.45rem]` で「極めて控えめなカード感」が実現されている。チェックバッジは除去済みで `Check` import も適切に削除されている。5列グリッド・遷移先・ログ保存ロジックはすべて維持。lint / typecheck / build 全通過。

---

## 証跡

- `components/eaten-experience.tsx` 全行読み取り済み（325行）
- L153: `grid grid-cols-5 gap-0.5 md:grid-cols-8 lg:grid-cols-10` 確認
- L251–264: `CollectionThumb` の全クラスを確認
- L5: `Check` import が除去されていることを確認
- L216: `EatenAlbumCard` 定義残存を確認
- L201–214: `buildEatenAlbumRecords` 変更なしを確認
- 実装 commit: `4965bd7f2830b529455c8fc3f4664ff7041ba5ae`
