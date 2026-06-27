# UNICOLE 設計 v1: ①ホーム「新着/更新」欄 ②反映遅延(キャッシュ) ③削除ボタン

**作成日:** 2026-06-23
**担当:** Claude（設計・レビュー担当 / 実装はしない）
**制約遵守:** 実装・コード・git・Supabase・Vercel・generated・crawler・translations・広告・proxy.ts 変更なし。/foods並び・/eaten 不変。実コード読取のみ。

---

## 1. ホーム「今集められるフード」の正しい設計

### この欄の正しい役割（再定義）
- 旧: 「未食 ∧ 販売中 ∧ 画像/価格あり」を日替わりスコア順（＝コレクション提案）。
- 新（要望）: **「新しく追加・修正したフードを確認する欄」**。食べた済みも含め、**created_at/updated_at の新しい順**で上に出す。
- → 実態とズレるので**表示名変更を推奨**: 「新しく追加・更新されたフード」/「最近のフード」等（translations 変更が要るため**別 goal の小修正**で対応。今回のロジック goal とは分離）。

### データの使い分け
- **manual_foods**: `recencyAt = max(created_at, updated_at)`（追加直後＝created、編集直後＝updated）の降順。`createdAt` は既にマッピング済（`row.created_at`）。
- **food_overrides で修正した generated 商品**: override の `updated_at` を「更新日時」として降順に反映（修正した自動取得商品も新着扱い）。マージ時に override の updated_at を food へ伝播。
- 既存 generated（未修正）は新着対象外（recency を持たない＝下位）。

### 食べた済みを除外しない方法
- 現状 `pickActiveCollectionFoods` は `eatenKeys` で未食のみ。**新欄では eatenKeys 除外をしない**（食べた済みも表示）。

### 表示条件（公開/非表示/販売）
- 表示対象: **公開中(published/approved) ∧ 非表示でない(hidden=false) ∧ 削除でない**。
- **販売状態(active/ended等)は問わない**（新着確認が目的）。ただし「今集められる」感を残すなら active を上位、ended は薄表示でもよい（任意）。
- 画像が無い直後でもプレースホルダで出す（新規確認優先）。または画像あり優先で並べる（デザイン判断）。

### 実装方針（低リスク・/foods不変）
- `components/home-progress-client.tsx` の該当レール（`HomeActiveFoodCollection`/`pickActiveCollectionFoods`）を**新ロジックに差し替え or 新 pick 関数追加**:
  - `recencyAt`（manual=max(created,updated)、override 修正=updated、それ以外=なし）で降順、食べた済み含む、公開∧非削除のみ、上位N件。
- `/foods` の並び・`/eaten` は変更しない（このレール限定）。

---

## 2. Simulator/スマホ反映ズレ：原因推測と対策

### 原因（実コード根拠）
- **主因: `app/page.tsx` の `export const revalidate = 3600`（ISR 1時間）**。サーバーが最大1時間 静的キャッシュを返すため、admin で追加/修正しても**ホームに最大1時間出ない**。`/foods` も同様(3600)。
- 副: PWA `public/sw.js` は navigation を **NetworkFirst**（fetch→失敗時cache）なのでオンライン時は基本最新。**主因ではない**が、オフライン/初回キャッシュで古い shell を見ることはある。
- `revalidatePath` は actions.ts に import 済みだが、保存時に **"/"・"/foods" への revalidate が発行されていない可能性**（保存後は `/admin/foods/[id]` へ redirect のみ）。

### 対策（低リスク）
1. **admin 保存系（create/update/override/visibility/削除）で `revalidatePath("/")`・`revalidatePath("/foods")`・`revalidatePath("/admin/foods")` を発行** → 追加/修正が**即時反映**。最優先・安全。
2. ホーム `revalidate` を **短縮（例 60）** か、必要なら `dynamic = "force-dynamic"`（常時最新／負荷増）。まずは (1)＋revalidate 60 を推奨。
3. PWA: navigation は NetworkFirst のため追加対応は基本不要。必要なら SW のキャッシュ版番号(`CACHE_NAME`)更新で旧 shell を破棄（任意）。
4. `/foods` の**並びは変えない**が、revalidate 短縮/revalidatePath は並びに影響しない（鮮度のみ）。

---

## 3. 商品追加ページ デザイン/UI 改善設計（送信契約維持）

> 前回 `admin-foods-new-uiux-review-v1.md`／`home-order-addui-security-design-v1.md` を踏襲。**保存処理・FormData name/value・画像保存・店舗検索UI・認証・Supabase SQL は不変。**

- 問題点: 業務画面的、開発者文言（「generated商品〜保存しません」「Phase 3での保存時注意点」「generated商品は保存不可」）、状態3連が紛らわしい、必須/任意不明、追加後導線が弱い。
- レイアウト案: 白＋クリーム/USJブルー差し色、ステップカード（①基本情報 ②店舗 ③カテゴリ ④画像 ⑤公開 ⑥保存）＋アイコン、プログレス感。
- スマホ: 1カラム・大タップ・任意は「詳細（任意）」へ折りたたみ・「今すぐ公開」トグル(value維持)。
- PC: 2カラム＋左に画像プレビュー/公開チェックリスト固定。
- 必須/任意: バッジ明示。公開チェックリスト（画像・情報出典・必須項目）を保存近くに常設。
- 家族向け文言: 「フードを追加」「保存して公開／下書き保存」、メモは「家族用メモ（公開されません）」、自動取得商品は「自動収集の商品です。価格や画像だけ直せます」。
- 追加後導線: 保存後に「公開ページで見る／続けて追加／一覧へ」、ホーム新着欄に出ることを案内。

---

## 4. 非表示と削除の安全設計

| 操作 | 意味 | 公開ページ | 管理画面 | 復元 | 権限 |
|---|---|---|---|---|---|
| **非表示(hidden)** | 一時的に隠す（既存） | 消える | 通常一覧に残る | 再表示で即戻る | editor+ |
| **削除(soft)** | 削除済みへ移動 | 消える | 「削除済み」タブにのみ | 復元で戻る | editor+ |
| **完全削除(hard)** | DB/Storage から消す | 消える | 消える | 不可 | **owner のみ・任意** |

- 家族向け文言: ボタンは「削除」。押すと**soft delete（削除済みへ・復元できます）**。完全削除は「削除済み」内で owner のみ「完全に削除（戻せません）」＋確認ダイアログ。
- **manual_foods の削除**: soft = `deleted_at`（or is_deleted）を立て公開＆通常admin一覧から除外、削除済みタブに表示、復元可。hard = 行削除＋Storage画像削除（owner・確認・任意）。
- **food_overrides / 自動取得商品の削除**: 自動取得(generated)商品自体は消さない（正本不変）。「削除」＝override で **hidden/soft（is_deleted 既存）**にして公開から除外。完全削除＝override 行の `.delete()`（既存の「元に戻す」と同義＝generated 表示に戻る）。generated 商品を図鑑から恒久消去はしない方針。
- 削除済みの管理表示: 「削除済み」タブ（フィルタ）で一覧、復元ボタン、owner のみ完全削除。
- 誤操作対策: 確認ダイアログ、soft 既定、復元導線、audit/revision（あれば）に記録。
- DB 変更: **manual_foods に soft-delete 列（deleted_at timestamptz null）が必要**（food_overrides は is_deleted 既存）。→ マイグレーション SQL 追加＋**人手適用**。

---

## 5. soft delete / hard delete 比較

| 観点 | soft delete（推奨既定） | hard delete |
|---|---|---|
| 安全性 | ◎ 復元可・誤操作に強い | △ 不可逆 |
| 実装 | 列追加＋フィルタ（小） | 行/Storage 削除（中） |
| 監査/復旧 | ◎ 残る | ✗ 残らない |
| 家族運用 | ◎ | △（owner限定・確認必須） |
| 推奨 | **既定はこれ** | owner の最終手段・任意 |

→ **まず soft delete を既定**。hard delete は owner 限定・確認必須・soft 済みからのみ（または作らない選択も可）。

---

## 6. 優先順位
1. **反映遅延の解消＋ホーム新着欄**（バグ＋headline・低リスク・DB不要）。
2. **削除ボタン（soft）**（DB列追加が要・安全機構）。
3. **追加ページ UI おしゃれ化**（送信契約維持のUIのみ）。

## 7. Phase 分け
- **N1**: admin 保存時 `revalidatePath` 発行＋ホーム `revalidate` 短縮（反映即時化）。**DB不要**。
- **N2**: ホーム該当レールを「新着/更新（recency 降順・食べた済み含む・公開∧非削除）」へ再設計。**DB不要**。
- （任意）**N3**: 表示名変更（translations 小修正・別 goal）。
- **D1**: manual_foods に soft-delete 列追加（migration）＋削除/復元 action（editor）＋削除済みタブ。
- **D2**: hard delete（owner・確認・任意）。
- **U1**: 追加ページ UI/文言/導線改善（送信契約維持）。

## 8. 最初に Codex へ投げるべき /goal
→ 末尾（N1＋N2: 反映即時化＋ホーム新着欄。低リスク・DB不要・/foods/eaten不変）。

## 9. 次に投げるべき /goal（D1: soft delete）
```
/goal UNICOLE 管理画面に「削除（soft delete）」を追加する。非表示とは別に、削除済みへ移動して公開・通常admin一覧から外し、削除済みタブから復元できるようにする。完全削除(hard)は作らない（または owner 限定で別Phase）。manual_foods/食べた記録/公開ページ/認証を壊さない。
- マイグレーションSQL追加（本番適用は人手）: manual_foods に deleted_at timestamptz null。RLS は既存方針維持（書込は service role 経由のみ）。
- server action（requireAdmin("editor")）: softDeleteManualFood(deleted_at=now)・restoreManualFood(deleted_at=null)。food_overrides 側は既存 is_deleted を利用し、generated 商品の「削除」は override で公開除外（generated 正本は消さない）。
- 公開取得(listManualFoods publicOnly)・通常admin一覧から deleted_at!=null を除外。新規「削除済み」タブ(フィルタ)で一覧＋復元。
- UI文言: 「削除」（押すと削除済みへ・復元できます）。確認ダイアログ。owner/editor は削除/復元可、hard delete は作らない。
- revalidatePath("/")・("/foods")・("/admin/foods") を発行。
- 禁止: hard delete・generated正本削除・食べた記録/公開/認証破壊・service role露出・name/value契約変更・translations/広告/proxy/crawler変更・git add .。
- 検証: 削除→公開と通常一覧から消える・削除済みタブに残る・復元で戻る／食べた記録不変／lint/typecheck/build/coverage 成功・Coverage 不変。
```

## 10. DB 変更が必要な場合の注意点
- 変更は **マイグレーション SQL 追加のみ**、本番適用は**人手**（Supabase ダッシュボード/CLI）。Codex に本番適用させない。
- **RLS を必ず維持**（新列でも anon/authenticated 直書き不可）。`deleted_at` を公開取得・通常一覧から除外するクエリ条件を追加。
- 既存データは `deleted_at=null` 既定で影響なし。後方互換。
- soft-delete 列追加は manual_foods のみ（food_overrides は is_deleted 既存）。generated 正本JSONは不変。

---

## 最初に Codex へ投げる /goal（コピペ用・N1＋N2: 反映即時化＋ホーム新着欄・DB不要）

```
/goal UNICOLE のホーム「今集められるフード」欄を「新しく追加・修正したフードを新しい順で確認できる欄」に再設計し、管理画面で追加/修正した商品がホームへ即時反映されるようにする。/foods 全体の並びと /eaten は変更しない。保存処理・FormData name/value・画像保存・認証・Supabase SQL は変更しない（DB変更なし）。

## 反映の即時化（キャッシュ）
- app/admin/foods/actions.ts の保存系（createAdminFood / updateAdminFood / applyGeneratedFoodOverride / 非表示(visibility) など）で、成功後に revalidatePath("/")・revalidatePath("/foods")・revalidatePath("/admin/foods") を発行する（revalidatePath は既に import 済み）。
- app/page.tsx の export const revalidate = 3600 を 60 に短縮する（/foods は据え置きでよい。force-dynamic にはしない）。
- PWA(sw.js) は navigation が NetworkFirst のため変更不要。

## ホーム該当レールの再設計（/foods/eaten 不変）
- components/home-progress-client.tsx の「今集められるフード」レール（HomeActiveFoodCollection / pickActiveCollectionFoods）を、次の新ロジックに差し替える（新 pick 関数を作ってよい）:
  - 対象: 公開中(reviewStatus=approved または manual public_state=published) ∧ hidden=false ∧ 削除でない。
  - 並び: recencyAt の降順。recencyAt = manual_foods は max(createdAt, updatedAt)、food_overrides で修正された generated 商品は override の updatedAt、それ以外(未修正generated)は recency なし(下位/対象外)。
  - 食べた済みも除外しない（eatenKeys でのフィルタを外す）。
  - 画像が無くてもプレースホルダで表示してよい（新規をすぐ確認できるように）。上位 N 件(例 8〜12)。
  - manual_foods の updatedAt/createdAt、food_overrides の updatedAt がマージ後の food に伝わるよう、必要なら lib/repositories/manual-foods.ts / food_overrides マージで updatedAt を food に載せる（読取のみ）。
- /foods の FoodGrid 並び・/eaten の集計/表示は一切変更しない。

## やってはいけないこと
- /foods 全体の並び・/eaten の挙動を変えない。FormData name/value・保存処理・画像保存・認証・Supabase SQL・generated JSON・crawler・translations・広告・proxy.ts を変更しない。DB変更しない。
- service role key をクライアントに出さない。表示名(translations)の変更は本goalでしない（別goal）。git add . 禁止。

## 検証
- 管理画面で商品を追加/修正 → ホーム「今集められる」欄の先頭付近に即時(または最大60秒)で出る。Simulator/スマホでも反映が遅れない。
- 食べた済みの新着商品も表示される。/foods の並び・/eaten が従来どおり。
- npm run lint / typecheck / build / coverage 成功、Coverage 不変。
- git status --short が想定変更ファイルのみ。

## Stop条件
- DB変更や translations 変更が必要になったとき。
- /foods 並び・/eaten・送信契約を変えないと実現できないとき。
- 認証/Supabase設定/proxy に触れる必要が出たとき。
```
