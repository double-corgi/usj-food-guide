# 設計レビュー証跡: Vercel output 削減 / food detail 動的化

- **対象commit**: `bfd31e4f7e8a498ea3e9d76d272daf11bc8b3c0b`
- **commit message**: `fix: reduce Vercel output by disabling static food detail generation`
- **レビュー担当**: Claude（設計・レビュー）
- **レビュー日**: 2026-06-20
- **本番URL**: https://new-app-chi-rosy.vercel.app/
- **判定**: ✅ **承認**

---

## 変更内容（実diff）

`git show --stat` 結果: 2 files changed, 3 insertions(+), 6 deletions(-)

### 1. `app/foods/[id]/page.tsx`

```diff
-export const revalidate = 3600;
-
-export async function generateStaticParams() {
-  const foods = await listFoods();
-  return foods.map((food) => ({ id: food.id }));
-}
+export const dynamic = "force-dynamic";
+export const dynamicParams = true;
```

### 2. `.vercelignore`

```diff
 # Project documentation not needed at runtime
 docs
+/screenshots
```

`page.tsx` の本体ロジック（`getFoodById` → `notFound()` → 関連商品計算 → `<FoodDetail>` への props 渡し）は**完全に無変更**。

---

## レビュー観点ごとの判定

| # | 観点 | 結果 | 根拠 |
|---|------|------|------|
| 1 | 変更ファイルが `.vercelignore` と `app/foods/[id]/page.tsx` のみか | ✅ | `git show --name-only` で2ファイルのみ確認 |
| 2 | `/foods/[id]` のURL構造が維持されているか | ✅ | ディレクトリ `app/foods/[id]/` のまま。ルーティング変更なし |
| 3 | 商品詳細ページが動的表示へ安全に変更されているか | ✅ | `dynamic = "force-dynamic"` + `dynamicParams = true`。本体ロジック無変更 |
| 4 | `generateStaticParams` による全件静的生成が停止されているか | ✅ | `generateStaticParams` と `revalidate` を削除。`.vercel/output` 内の food 静的HTMLは0件、`functions/foods/[id].func` として動的関数化を確認 |
| 5 | `notFound` / food id lookup が壊れていないか | ✅ | `getFoodById(resolvedParams.id)` と `if (!food) notFound();` が維持 |
| 6 | 商品詳細UIが大幅に変わっていないか | ✅ | `<FoodDetail>` への props（food/allFoods/previous/next/relatedGroups）すべて従来通り |
| 7 | 商品名翻訳表示が維持されているか | ✅ | 翻訳は repository / FoodDetail 側の責務。本commitは未関与 |
| 8 | `.vercelignore` で `/screenshots` のみ除外し、`public` / `public/screenshots` を除外していないか | ✅ | 追加は `/screenshots`（先頭スラッシュ=リポジトリ直下）の1行のみ。`public/screenshots/*.png` は git 追跡継続を確認 |
| 9 | `data/translations` / `scripts/output` / generated JSON / DB / crawler に触れていないか | ✅ | diff は2ファイルのみ。該当領域は一切未変更 |
| 10 | `.vercel` / `.vercel/output` / `.env*` が git 管理されていないか | ✅ | `git ls-files` で追跡されているのは `.env.example`・`.env.local.example`・`.vercelignore` のみ。`.vercel` は未追跡。`git status` クリーン |
| 11 | Vercel output が大幅に軽量化されているか | ✅ | `.vercel/output` = 103MB（変更前 約785MB / 削減 約682MB） |
| 12 | lint / typecheck / build / coverage が成功しているか | ✅ | Codex報告: 全て成功。build 成果物（`.next/server/app/foods/[id]/page.js`）の存在も確認 |
| 13 | Food/Store Coverage が期待値から変化していないか | ✅ | 本commitは翻訳データ非変更のため変動なし。期待値（Food: total 294 / translated 77 / missing 217、Store: display_total 99 等）と整合 |
| 14 | 本番URLが最新 Production Deployment に向いているか | ✅ | Codex報告: `vercel deploy --prebuilt --prod` 成功、HTTP 200 確認済み |

---

## 確認に用いた検証コマンド（証跡）

- `git show --stat bfd31e4` → 2 files changed
- `git show bfd31e4` → diff 内容を直接確認
- `cat app/foods/[id]/page.tsx` → 現在の実装を確認（本体ロジック無変更）
- `cat .vercelignore` → `/screenshots` 1行追加のみ確認
- `git ls-files | grep -E "^\.vercel|^\.env|screenshots/"` → `.vercel` 未追跡、`public/screenshots/*.png` 追跡継続
- `git status --short` → 作業ツリー クリーン
- `du -sh .vercel/output` → 103M
- `find .vercel/output -path "*foods*" -name "*.html" | wc -l` → 0（静的HTML不生成）
- `find .vercel/output -path "*foods*"` → `functions/foods/[id].func`（動的関数化）を確認

---

## 補足（非ブロッキングの推奨事項）

`force-dynamic` は ISR キャッシュ（旧 `revalidate = 3600`）を完全に無効化し、`/foods/[id]` の各リクエストで毎回サーバーレンダリング（repository 参照）が走る挙動になります。本commitの目的（output 肥大の解消）は達成されているため**承認に影響しません**が、将来パフォーマンスが問題になる場合は、

- `generateStaticParams` は削除したまま `dynamicParams = true` + `revalidate`（ISR、オンデマンド生成）に切り替える

ことで「全件静的生成による output 肥大を回避しつつページキャッシュを残す」折衷案が取れます。これは別途の改善検討事項であり、本commitの修正対象ではありません。

---

## 結論

全14観点をクリア。変更は最小（2ファイル・実質3行）で、URL構造・id lookup・notFound・詳細UI・翻訳表示・対象外領域（data/translations・generated JSON・DB/crawler・public/screenshots）すべてに副作用なし。Vercel output は 785MB → 103MB に削減され、本番デプロイは HTTP 200 で稼働。

**判定: 承認**

次の `/goal` は本証跡の確認後に別途作成する（本タスクでは作成しない）。
