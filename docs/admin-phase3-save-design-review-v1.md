# UNICOLE 管理画面 Phase 3（保存処理）設計レビュー v1

**作成日:** 2026-06-23
**担当:** Claude（設計・レビュー担当 / 実装はしない）
**前提:** Phase 1（Supabase Auth＋`admin_users`＋requireAdmin）/ Phase 2・2.1（管理UI・追加/編集フォーム・画像プレビュー）完了。既存 `foods` テーブル（schema.sql）あり。`listFoods`/`getFoodById` は Supabase優先・generatedフォールバック。商品: 全候補294 / 表示181 / hidden76。
**方針:** editor 即公開（承認制・draft 不要）／削除せず hidden 運用／画像は保存時に自動リサイズ／管理メモは非公開／generated→Supabase へ段階移行。

> 本書は設計レビューのみ。コード変更・git は行わない。調査は読み取りのみ。

---

## 0. 結論

- 既存 `foods` テーブルを**正データの本番テーブル**として活用し、Phase 3 で **admin 書き込み経路**を追加する。新規パラレルテーブルを乱立させない。
- editor 即公開は、**サーバー側の公開バリデーション＋全操作 audit_log＋food_revisions（rollback）＋soft delete のみ＋RLS でクライアント直書き禁止**で安全担保。
- 追加カラムは最小（admin 用メタ）＋新規 `food_images`・`food_revisions`・`audit_log`。
- **rollback は必須**（承認制が無い分の安全網）。
- 段階移行: Phase 3 で**既存294件を Supabase へ一度シード**し、以後 Supabase を source of truth、generated はバックアップ/フォールバックに。

---

## 1. Phase 3 で必要な Supabase テーブル

### 1-A. `foods`（既存・本番。再利用＋カラム追加）
既存カラムを活用（id, shop_id, area_id, name, normalized_name, category, price, source_url(NOT NULL), official_url, image_url, status, is_limited, confidence_score, name_quality_score, display_quality, review_status, hidden, manual_override, canonical_food, …, updated_at, unique(shop_id, normalized_name)）。
**追加カラム（マイグレーション）:**
- `category_tags text[]`（リッチタグ。既存 `category` enum はそのまま単一カテゴリ）
- `image_source_url text`（画像出典）
- `info_source_url text`（情報出典。NOT NULL の既存 `source_url` にマップしてもよいが、明示用に追加可）
- `admin_source_type text check (in ('official','trusted-site','manual-confirmed'))`
- `admin_confidence text check (in ('high','medium','low'))`
- `admin_notes text`（**管理メモ＝非公開**）
- `created_by text` / `updated_by text`（actor email）
- `status` の check に **`paused` を追加**（現状 active/scheduled/ended/inactive/unknown）＝販売休止を表現
- `manual_override` を admin 書き込み時に **true** に（crawler/再生成で上書きされないよう保護）

### 1-B. `food_images`（新規）
- `id uuid pk default gen_random_uuid()`
- `food_id text references foods(id)`（**削除なし運用のため on delete restrict 推奨**）
- `storage_path text not null`（`food-images/<food_id>/main.jpg`）
- `public_url text` / `source_url text`（画像出典）
- `width int` / `height int` / `bytes int` / `content_type text`
- `is_primary boolean default true` / `created_by text` / `created_at timestamptz default now()`
- 公開表示は `foods.image_url`＝primary の public_url を指す（読取簡素）。

### 1-C. `food_revisions`（新規・履歴/rollback）
- `id uuid pk`, `food_id text`, `version int`, `snapshot jsonb`（その時点の foods 行全体）, `action text`, `actor_email text`, `created_at`。

### 1-D. `audit_log`（新規・不変）
- `id uuid pk`, `actor_email text`, `actor_role text`, `action text`（create/update/publish/hide/pause/end/restore/upload/rollback）, `entity_type text`, `entity_id text`, `before jsonb`, `after jsonb`, `ip text`, `user_agent text`, `created_at`。

### RLS
- `foods`/`food_images`/`food_revisions`/`audit_log` への **書き込みはサーバー（service role）経由のみ**＝クライアントから直書き不可。
- `audit_log`/`food_revisions` は **insert(service)・select(owner)** のみ、update/delete 不可（不変）。
- `admin_users` は Phase 1 のまま。
- 公開読取（anon）は既存 `foods` の可視条件（review_status=approved・canonical_food・!hidden・status≠inactive・display_quality≠low・スコア閾値）。**`admin_notes` は公開 select に含めない**（列を返さない）。

---

## 2. food_images 設計（自動リサイズ）

- アップロード→サーバーで **検証**（jpg/png/webp・容量≤~5MB・寸法上限）→ **自動リサイズ**して保存:
  - 本体: 最大辺 ~1280px（webp/jpg）→ `food-images/<food_id>/main.jpg`
  - サムネ: ~400px（一覧/カード用）→ `food-images/<food_id>/thumb.jpg`（任意）
- `food_images` に storage_path/public_url/source_url/寸法/bytes を記録。`foods.image_url` を primary に更新。
- 差し替えは新ファイル＋revision/audit 記録（旧は履歴に残す。Storage の旧オブジェクトは即削除しない＝復元可）。
- **画像なしでは公開不可**（publish バリデーションで弾く）。
- Storage Policy: 書込は authenticated＋role(owner/editor)。読取は公開 or 署名URL。

## 3. foods 設計（書き込み・公開マッピング）

editor が「公開」したとき、サーバーが以下を満たすことを検証してから foods を更新:
- **公開バリデーション（必須）**: image_url あり / info_source_url(=source_url) あり / price あり / area(shop) あり / category(+category_tags) あり。
- **公開時のフィールド設定**: `review_status='approved'`, `canonical_food=true`, `hidden=false`, `status='active'`, `manual_override=true`, `display_quality` を 'high'/'medium'、`name_quality_score>=60`・`confidence_score>=45`（公開条件を満たす値に設定）。
- **新規 ID**: 既存規約 `food-<...>`（gen_random_uuid）か `food-manual-<...>`。`unique(shop_id, normalized_name)` 衝突時はエラー（重複防止）。
- crawler 再生成からの保護: `manual_override=true` の行は再生成で上書きしない運用（既存フラグを活用）。

## 4. hidden 運用

- **削除しない**。状態は foods の列で表現:
  - 非表示: `hidden=true`
  - 販売休止: `status='paused'`（enum 追加）
  - 販売終了: `status='ended'`
  - 復帰: `hidden=false` / `status='active'`
- 公開ページは可視条件で自動的に hidden/ended/inactive/低品質を除外（既存 listFoods ロジック）。
- すべて状態変更＝可逆。audit/revision に記録。

## 5. editor 即公開モデルの安全性

| リスク | 対策（Phase 3 で実装） |
|---|---|
| 誤公開・誤情報 | **サーバー側公開バリデーション**（画像/根拠URL/必須項目）。満たさなければ公開不可 |
| 事故・取り違え | **全操作 audit_log**＋**food_revisions**＋**rollback**＋**soft delete のみ** |
| クライアント改ざん | **RLS で foods 直書き禁止**＝書込は server(service role)＋role 検証経由のみ |
| crawler 上書き | 書込行を `manual_override=true` で保護 |
| アカウント乗っ取り | Supabase Auth＋allowlist＋rate limit＋（owner）MFA 推奨 |
| 権限逸脱 | editor はロール付与・ハード削除・identity キー(id/normalized_name)変更 不可。rollback は owner 推奨 |
| 管理メモ流出 | `admin_notes` を公開 select から除外（非公開） |

→ 承認制を省く代わりに「**事前バリデーション＋事後の履歴/ログ/rollback**」で守る。破壊的操作は誰にも許可しない。

## 6. rollback の必要性

**必須。** draft/承認が無い即公開モデルでは、誤公開の唯一の復旧手段が rollback。
- 各書き込み/公開で `food_revisions` にスナップショット（version 連番）。
- rollback＝過去スナップショットから**前進復元**（新 revision を作って foods 上書き、履歴は消さない）。
- 実行は **owner 推奨**（editor 許可なら audit 必須）。rollback も audit_log に記録。

## 7. Phase 3 でやるべきこと

1. マイグレーション: foods カラム追加（§1-A）＋ `food_images`・`food_revisions`・`audit_log`＋RLS＋Storage バケット `food-images`＋Policy（SQL 追加・適用は人手）。
2. サーバー書き込み API / Server Action（role 検証・service role・audit・revision）:
   - 追加 `POST /api/admin/foods`、編集 `PATCH /api/admin/foods/:id`、公開 `POST .../publish`（バリデーション）、状態 `POST .../status`（hide/pause/end/restore）、画像 `POST /api/admin/upload`（検証＋自動リサイズ）、rollback `POST .../rollback`（owner）。
3. Phase 2 の `FoodForm.onSubmit` を上記に**配線**（editor 即公開・draft なし）。
4. 画像: アップロード→検証→自動リサイズ→Storage→food_images→foods.image_url。
5. **段階移行**: 既存294件を Supabase `foods` へ**一度シード**（idempotent upsert、`manual_override` は適切に）→ Supabase を source of truth、generated はフォールバック/バックアップ。
6. 公開ページが Supabase 読取で従来通り表示されることを確認（listFoods は対応済）。

## 8. Phase 3 でやらないこと

- ハード削除機能（恒久禁止）。
- 承認制 / draft ゲート（家族信頼のため不要）。
- AI 自動下書き（後フェーズ）。
- 共有トークン proxy.ts の即時撤去（実認証安定後に別 goal）。
- generated JSON 直接編集 / crawler 実行 / translations / 広告(AdMob/AdSense)。
- 公開ページUIの作り替え（読取互換のみ）。
- service role key のクライアント露出。

## 9. Codex に貼れる完全な /goal

```
/goal UNICOLE 管理画面 Phase 3（保存処理）を実装する。editor 即公開（承認制・draft なし）で、家族がスマホから商品を追加/編集/画像アップロード/状態変更でき、削除はせず hidden 運用、画像は保存時に自動リサイズ、管理メモは非公開、generated から Supabase へ段階移行する。全操作を audit_log と food_revisions に記録し rollback 可能にする。

## 前提を壊さない
- Phase 1 認証（lib/admin-auth.ts requireAdmin / admin_users）と Phase 2 UI（FoodForm 等）を活用・改変最小。
- 公開ページ(/foods 等)・proxy.ts・generated 読み取りフォールバックを壊さない。
- service role key はサーバー専用（クライアント非露出）。

## マイグレーション（supabase/migrations に SQL 追加。本番適用は人手）
1. foods にカラム追加: category_tags text[], image_source_url text, info_source_url text, admin_source_type text check(official|trusted-site|manual-confirmed), admin_confidence text check(high|medium|low), admin_notes text, created_by text, updated_by text。status の check に 'paused' を追加。
2. 新規テーブル: food_images / food_revisions / audit_log（本指示書 §1 の定義）。
3. RLS: foods/food_images/food_revisions/audit_log への書き込みは service role 経由のみ（anon/authenticated の直書き不可）。audit_log/food_revisions は insert(service)・select(owner)・update/delete 不可。公開読取(anon)は既存可視条件のまま、admin_notes は公開 select に含めない。
4. Storage バケット food-images＋Policy（書込 owner/editor、読取 公開 or 署名URL）。

## サーバー書き込み（role 検証＋service role＋audit＋revision）
- POST /api/admin/foods（新規, editor+）
- PATCH /api/admin/foods/:id（編集, editor+）
- POST /api/admin/foods/:id/publish（公開, editor+, バリデーション必須）
- POST /api/admin/foods/:id/status（hide/pause/end/restore, editor+）
- POST /api/admin/upload（画像, editor+, 検証＋自動リサイズ）
- POST /api/admin/foods/:id/rollback（owner）
- 全 API: 未認証401/権限不足403、入力バリデーション＋サニタイズ、成功時 audit_log 追加・公開/編集時 food_revisions スナップショット。

## 公開バリデーション（publish 時必須）
- image_url あり / info_source_url(または source_url) あり / price あり / area・shop あり / category(+category_tags) あり。
- OK → foods を review_status='approved', canonical_food=true, hidden=false, status='active', manual_override=true, display_quality>='medium', name_quality_score>=60, confidence_score>=45 に設定して即時公開。
- NG → 公開せずエラー（不足項目を返す）。draft 保存は許可（公開しないだけ）。

## 画像（自動リサイズ）
- アップロード検証: jpg/png/webp・容量上限・寸法上限・MIME 実体検査・ファイル名サニタイズ。
- 自動リサイズ: 本体 最大辺~1280px → food-images/<food_id>/main.jpg、サムネ~400px(任意)。food_images に記録、foods.image_url を primary に更新。
- 画像なしでは公開不可。差し替えは履歴に残す（旧 Storage オブジェクトは即削除しない）。

## hidden 運用（削除なし）
- 非表示=hidden=true / 休止=status='paused' / 終了=status='ended' / 復帰=hidden=false,status='active'。ハード削除を実装しない。

## 段階移行（generated → Supabase）
- 既存 generated の294件を Supabase foods へ idempotent に upsert するシードスクリプト（scripts/debug 配下、人手実行）。manual_override は手動管理分のみ true。
- 移行後は Supabase が source of truth、generated はフォールバック/バックアップとして残す。

## FoodForm 配線
- Phase 2 の FoodForm.onSubmit を上記 API に接続（editor 即公開・draft なし）。viewer は書込不可、editor/owner は追加/編集/公開/状態変更/画像、rollback は owner。

## やってはいけないこと（厳守）
- ハード削除・承認/draft ゲート・AI下書きを作らない。
- generated JSON 直接編集 / crawler 実行 / data/translations / 広告 を触らない。
- proxy.ts トークンを削除しない（移行期フォールバック）。Phase 1 認証/公開ページを壊さない。
- service role key・秘密・広告ID をクライアントに出さない。
- identity キー(id/normalized_name)を編集可能にしない。admin_notes を公開 API で返さない。
- DB マイグレーション/シードを本番に勝手に適用しない（SQL/スクリプト追加のみ、適用は人手）。
- git add . 禁止。変更ファイルを限定する。

## 検証（実施し報告）
- npm run lint / typecheck / build / coverage 成功、Coverage 不変（Food total 294）。
- RLS: anon/authenticated から foods/food_images に直接 INSERT/UPDATE できない（service 経由のみ）。
- editor: 追加→公開（バリデーション通過時のみ）・画像アップロード→自動リサイズ・hide/pause/end/restore が動作し、audit_log と food_revisions に記録される。
- viewer: 書込不可（403）。rollback は owner のみ。
- 画像なし or 根拠URLなしでは公開できない。
- 公開ページが Supabase 読取で従来どおり表示（admin_notes は露出しない）。
- ハード削除が存在しない。
- git status --short が想定変更ファイルのみ。

## Stop条件
- 承認/draft や AI 下書きが必要と判明したとき（対象外）。
- 公開ページ/Phase1認証/proxy.ts を壊す必要が出たとき。
- service role をクライアントに出す必要が生じたとき。
- 重い新規依存が必要なとき（@supabase は既存。画像リサイズ依存が要る場合は Stop して報告）。
- generated/translations/広告 に触れる必要が出たとき。
```

---

## 補足（レビュー所見）

1. **既存 foods を再利用**するのが最重要（パラレルテーブルを作らない）。可視条件・unique 制約・status/hidden/review_status をそのまま活かせる。
2. **画像リサイズ依存**: Phase A の足場は外部依存なしだったが、自動リサイズには画像処理ライブラリ（sharp 等）が要る可能性。**新規依存が必要なら Codex は Stop して報告**するよう goal に明記済（package.json 追加は要承認）。
3. **段階移行のシード**は本番データに関わるため、idempotent・dry-run 可・人手適用を厳守。シード後の Coverage/件数を必ず確認。
4. **rollback の権限**は owner 推奨（editor 即公開の最終安全弁を owner に集約）。家族運用で editor にも許すなら audit 必須。
5. proxy.ts トークンは移行期フォールバックとして残し、実認証安定後に別 goal で撤去。
