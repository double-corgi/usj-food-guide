# UNICOLE Phase F「generated商品の手動上書き(override)」設計レビュー v1

**作成日:** 2026-06-23
**担当:** Claude（設計・レビュー担当 / 実装はしない）
**前提:** Phase A〜E 完了。manual_foods の追加/編集/画像/公開/非表示は動作。`listFoods()` は `readGeneratedFoods()`（正本JSON）＋`listManualFoods()` を `mergeFoods` で結合。generated 商品は現状直接編集不可。
**制約遵守:** generated JSON 直接変更なし／crawler・translations・広告・proxy.ts・Supabase・Vercel 変更なし／hard delete なし。本書は設計のみ。実コード読取済み。

---

## 0. 結論

- generated 商品は **正本JSONを不変のまま**、**Supabase の `food_overrides` テーブルに「変更したフィールドだけ」を疎に保存**し、**読み取り時に generated＋override をマージ**する。
- **food.id は絶対に変えない** → 既存の「食べた」記録（id キー）・URL・関連解決は無傷。これが本方式の最大の安全性。
- マージ順は **generated → override（generated id に対して）→ manual_foods（自前レコード）→ 可視判定**。override は generated にのみ作用し、manual_foods には触れない。
- **空 override は完全 no-op**（挙動不変）。段階導入で壊れにくい。
- rollback/履歴を持たせる（override 行削除＝generated へ即復帰、revision で部分復元）。
- F1 は **テーブル＋SQL＋空 no-op のマージ土台**まで。編集UI・保存は F2 以降。

---

## 1. generated 商品を直接編集しない理由

- generated JSON は **crawler/quality パイプラインの正本**。直接書き換えると **次回再生成で上書き消滅**、provenance（出所）喪失、rollback 不能、パイプライン破壊リスク。
- 「generated 不変」という既存不変条件・運用ルールを壊す。
- override 方式なら **正本は不変のまま、上書きは再生成後も再適用でき、削除で即時 revert** できる。

## 2. manual override 方式の安全性

- **food.id 不変**: override は id を変えず、フィールド値だけ差し替え → **食べた記録・URL・canonical 解決・関連表示が無傷**。
- **疎（sparse）**: 変更フィールドのみ保存。null=generated 継承。副作用最小。
- **可逆**: override 行/カラムを消すと generated 値に即戻る。
- **再生成耐性**: 正本が新しくなっても override を上に再適用すれば補正が生きる。
- **監査可能**: 誰が・いつ・何を（audit_log／revisions）。
- **権限/隔離**: 書込はサーバー(service role)経由のみ・RLS でクライアント直書き禁止。

## 3. 必要な Supabase テーブル設計

### `food_overrides`（generated 商品1件＝1行・疎）
- `food_id text primary key`（generated 商品の id。FK は張らない＝正本はJSON）
- 上書き用 **nullable** カラム（null=generated 継承）:
  - `name text`, `name_en text`
  - `price integer`, `price_min integer`, `price_max integer`, `price_note text`
  - `area_name text`, `area_id text`, `shop_name text`, `shop_id text`
  - `category text check(...enum...)`, `category_tags text[]`
  - `image_path text`（Storage パス）, `image_source_url text`
  - `info_source_url text`
  - `sale_status text check ('active','paused','ended','unknown')`
  - `status text`（既存 foods.status 互換が必要なら）
  - `hidden boolean`（**tri-state**: null=継承 / true=強制非表示 / false=強制表示）
  - `admin_source_type text`, `admin_confidence text`
  - `admin_notes text`（**非公開**）
  - `is_deleted boolean default false`（soft delete＝公開から除外・admin には残す）
  - `created_by text`, `updated_by text`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`

### `food_override_revisions`（履歴/rollback）
- `id uuid pk`, `food_id text`, `version int`, `snapshot jsonb`, `action text`, `actor_email text`, `created_at`。

### 監査
- 既存 `audit_log` を流用（actor/action/entity=food_override/before/after）。

### RLS
- `food_overrides`/`revisions` への **書込はサーバー(service role)経由のみ**（anon/authenticated 直書き不可）。
- 公開読取は **`admin_notes` を返さない**（公開 select に含めない）。
- revisions/audit は insert(service)・select(owner)・update/delete 不可（不変）。

## 4. 保存するカラム

上記 §3 の上書き対象のみ（name/price/area/shop/category/category_tags/image/sources/sale_status/hidden/admin_notes/source_type/confidence/is_deleted/actor/timestamps）。**id・normalized_name 等の同一性キーは保存・変更しない**。

## 5. 画像差し替えの扱い

- 新画像は Storage `food-images/<food_id>/override.jpg`（manual の main.jpg と分離）。検証＋自動リサイズ（既存 Phase 3 画像処理を流用）。
- `food_overrides.image_path/image_source_url` に記録。
- マージ時: override 画像があれば **それを primary に**、無ければ generated の画像。**generated 元画像は不変**。差し替えは revision に残す（旧 Storage オブジェクトは即削除しない＝復元可）。

## 6. 非表示の扱い

- `food_overrides.hidden`（tri-state）。`true` で公開から除外（マージ後 `filterVisibleFoods` で落ちる）。`false` で generated 側 hidden を打ち消し表示。`null` は generated 準拠。
- `is_deleted=true` は「削除済み（soft）」＝公開除外・admin には残す・復元可能。**hard delete は作らない**。

## 7. 価格修正の扱い

- `price`（必要なら price_min/max/note）を override。マージで generated 値を置換。`admin_source_type='manual-confirmed'` 等＋`admin_confidence` を併記。価格の出所 URL は `info_source_url`/`price_note` に。

## 8. カテゴリ修正の扱い

- 単一 `category`（既存 enum）＋リッチ `category_tags[]` を override。マージで置換。カテゴリ別一覧・チップ表示に反映。

## 9. 管理メモの非公開設計

- `admin_notes` は **公開 select に絶対含めない**（`sanitizePublicFood` 相当でも除外）。RLS／サーバーの公開取得関数で列を返さない。admin 画面のみ表示。

## 10. generated + override + manual_foods のマージ順

```
1. base = readGeneratedFoods(...)                 // 正本JSON（不変）
2. overridden = applyFoodOverrides(base, overrides) // generated id に override を適用（id は不変）
3. merged = mergeFoods(filterVisible(overridden), filterVisible(manualFoods))
   // mergeFoods: generated(＝overridden) 優先、manual は衝突しない id のみ追加
4. 公開 select で admin_notes を除外
```
- **優先度: manual_foods(自前) > food_overrides(generated上書き) > generated**。
- override は **generated id にのみ**作用。manual_foods には適用しない（manual は自身の編集経路を持つ）。
- `applyFoodOverrides` は **override 0件なら base をそのまま返す（no-op）**。

## 11. 既存 manual_foods への影響

- **なし**。override は generated id 専用。`mergeFoods` の既存挙動（manual は非衝突 id のみ追加）も不変。manual の追加/編集/非表示/画像は従来通り。

## 12. 既存の「食べた」記録への影響

- **なし（最重要）**。override は **food.id を変えない**。食べた記録は id キーで保存され、Phase A で findLogFood は頑健化済。override で価格/名称/画像が変わっても **同じ id** なので記録はそのまま一覧に出続ける。
- 注意: `hidden/is_deleted` で公開から消した generated 商品は、/foods から消えるが **食べた記録自体は保持**（/eaten の解決は id 一致＋canonical 救済で維持。非表示商品の eaten 表示可否は方針として明示。基本は記録は残す）。

## 13. 公開ページへの影響

- override があれば公開ページに **補正値**が反映（価格/名称/画像/カテゴリ/非表示）。override が無ければ **現状と完全に同一**（no-op）。URL（/foods/[id]）は id 不変なので不変。

## 14. admin 画面への影響

- generated 商品が **編集可能**に（編集画面は override に書き込む）。一覧/詳細に「override 有」バッジ、「**この上書きをリセット（override削除）→ generated に戻す**」操作。manual と generated を区別表示。
- 編集フォームは Phase D の FoodForm を流用しつつ、**保存先が food_overrides** である点を明示。

## 15. rollback/履歴の要否

- **必要**。即公開・家族運用のため安全網が要る。
  - `food_override_revisions` に変更スナップショット。
  - **revert = override 行削除（完全に generated へ復帰）** または revision から部分復元。
  - audit_log に全操作記録。hard delete なし。

## 16. Phase 分け（ユーザー案を踏襲）

| Phase | 内容 | 書込 |
|---|---|---|
| **F1** | `food_overrides`(+revisions) の**テーブル＋SQL**＋RLS、読取マージ土台（**空＝no-op**） | なし（SQL追加・適用は人手） |
| F2 | admin から generated 商品の**編集画面を開ける**（読取/導線） | なし |
| F3 | 価格・商品名・カテゴリ・店舗・エリアの**上書き保存** | overrides |
| F4 | generated 商品の**画像差し替え**（Storage override.jpg＋検証/リサイズ） | overrides/Storage |
| F5 | generated 商品の**非表示/再表示**（hidden/is_deleted） | overrides |
| F6 | **公開ページ・食べた記録への影響確認**（回帰検証） | なし |

## 17. 最初に Codex へ投げる /goal（F1・コピペ用）

> F1 のみ。テーブル＋SQL＋空 no-op マージ土台。編集UI・保存・画像・非表示は F2 以降。

```
/goal UNICOLE Phase F1: generated 商品の手動上書き(override)の基盤を作る。Supabase に food_overrides テーブルとマイグレーションSQLを用意し、読み取りマージの土台（override 0件のときは完全 no-op）を入れる。generated JSON は直接変更しない。admin編集UI・保存・画像差し替え・非表示は F2 以降で実装しない。

## 前提を壊さない
- generated JSON（正本）・crawler・translations・広告・proxy.ts・既存 manual_foods・既存の食べた記録・公開ページ表示を壊さない。
- food.id は絶対に変えない（食べた記録・URL の互換のため）。
- service role key はサーバー専用（クライアント非露出）。hard delete は作らない。

## やること（F1 のみ）
1. マイグレーションSQL を supabase/migrations に追加（本番適用は人手）:
   - food_overrides(food_id text primary key, name text, name_en text, price int, price_min int, price_max int, price_note text, area_name text, area_id text, shop_name text, shop_id text, category text, category_tags text[], image_path text, image_source_url text, info_source_url text, sale_status text check in('active','paused','ended','unknown'), status text, hidden boolean, admin_source_type text, admin_confidence text, admin_notes text, is_deleted boolean default false, created_by text, updated_by text, created_at timestamptz default now(), updated_at timestamptz default now())
     ※ 上書き用カラムは nullable（null=generated 継承）。FK は張らない（正本はJSON）。
   - food_override_revisions(id uuid pk default gen_random_uuid(), food_id text, version int, snapshot jsonb, action text, actor_email text, created_at timestamptz default now())
   - RLS 有効化: food_overrides/food_override_revisions への INSERT/UPDATE/DELETE は service role 経由のみ（anon/authenticated 直書き不可）。revisions は select(owner)・update/delete 不可。
2. サーバー読取ヘルパ追加（書込はしない）:
   - listFoodOverrides(): Supabase 設定時のみ food_overrides を読む。未設定/空なら [] を返す。admin_notes は公開用には含めない（公開取得関数では除外）。
3. マージ土台（no-op）: lib/repositories/foods.ts の読取（listFoods / getFoodById / listAllFoodCandidates）に、generated 配列へ override を適用する純粋関数 applyFoodOverrides(generatedFoods, overrides) を差し込む。
   - **override が 0 件のときは generated をそのまま返す（挙動完全不変）**。
   - food.id は変更しない。override は generated 由来 food にのみ適用し、manual_foods には適用しない。マージ順は generated→override→manual。
   - applyFoodOverrides は本 goal では「id 一致時に対象 food を返すだけ（実際のフィールド差し替えは F3 で有効化）」の最小実装でもよい。重要なのは空のとき完全 no-op であること。

## やってはいけないこと（厳守）
- generated JSON を直接編集しない。manual_foods・食べた記録・公開表示の既存挙動を変えない。
- admin 編集UI・override 保存・画像差し替え・非表示反映を実装しない（F2 以降）。
- food.id / normalized_name 等の同一性キーを上書き対象にしない。
- DB マイグレーションを本番適用しない（SQL 追加のみ、適用は人手）。
- service role key をクライアントに出さない。crawler/translations/広告/proxy.ts/認証 を触らない。hard delete を作らない。
- 重い新規依存を追加しない。git add . 禁止。変更を限定する。

## 検証
- npm run lint / typecheck / build / coverage 成功、Coverage 不変（Food total 294）。
- food_overrides が空（または未適用）のとき、listFoods/getFoodById/listAllFoodCandidates の結果が従来と完全一致（公開ページ・食べた記録・件数 不変）。
- Supabase 未設定時も既存動作（generated フォールバック）を維持。
- admin_notes が公開取得経路で返らない設計になっている。
- git status --short が想定変更ファイルのみ。

## Stop条件
- override の保存/反映や admin UI が必要になったとき（F2 以降）。
- food.id を変えないと実現できない要望が出たとき。
- 既存の manual_foods/食べた記録/公開表示の挙動を変えないと進められないとき。
- 認証/Supabase 既存設定/proxy/translations/広告 に触れる必要が出たとき。
```

---

## まとめ
generated は正本JSONのまま不変、**`food_overrides`（疎・id不変）＋読取マージ**で安全に補正。**food.id を変えない**ので食べた記録・URL・manual_foods は無傷、override 空なら完全 no-op。rollback は override 削除＝即 generated 復帰。まず F1（テーブル＋SQL＋no-op マージ土台）の /goal のみ Codex へ。実装はしない。
