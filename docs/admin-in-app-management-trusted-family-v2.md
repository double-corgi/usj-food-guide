# UNICOLE アプリ内 管理画面 設計 v2（信頼できる家族・editor 即公開モデル）

**作成日:** 2026-06-22
**担当:** Claude（設計・レビュー担当 / 実装はしない）
**v1 からの差分:** 家族は信頼できるため、**editor も下書きに留まらず 追加/修正/画像アップロード/公開/非表示まで可能**にする。承認ゲートは必須ではなく、代わりに **公開時バリデーション＋操作ログ＋変更履歴＋rollback** で安全を担保。
**現状:** Supabase 既配線（`@supabase/ssr`/`supabase-js`、`lib/supabase-server.ts` の server＋service-role、`supabase/` schema＋migrations、`listFoods`/`getFoodById` が Supabase優先・generatedフォールバック）。`/admin` は proxy.ts トークンで仮ロック。

> 設計のみ。コード変更・git・generated直接編集・DB/crawler・translations・広告 いずれも触っていない。

---

## 1. 結論

- **Supabase型**を採用（Auth＋DB＋Storage＋RLS、既配線で最短）。
- **editor も即公開可**。承認待ちフローは必須にしない。安全は「**サーバー側 公開バリデーション**（画像必須・根拠URL必須・必須項目充足）＋**全操作の audit_log**＋**revision 履歴＋rollback**＋**soft delete のみ**」で担保。
- **公開＝DB更新で即時反映**（再デプロイ不要・Codex不要）。本番 public/generated は実行時に書かない（書込先は Supabase）。
- **共有トークン（proxy.ts）は仮ロック**。実認証（Supabase）導入後に撤去。
- App Store でも同じ Supabase を読めるので Web/アプリ同源で運用可。

---

## 2. テーブル設計（特に知りたいこと #1）

> 既存 `foods` を活かし、状態と履歴・ログ・権限テーブルを追加。**editor 即公開のため drafts は“任意の下書き”扱い**（公開ゲートではない）。

- **admin_users**（allowlist＋ロール）: `id uuid pk (=auth.uid)`, `email text unique`, `role text check ('owner','editor','viewer')`, `created_at`。
- **foods**（公開・本番＝単一テーブルで状態管理）: 既存カラム＋
  - `publish_state text check ('draft','published')`（draft＝未公開の保存）
  - `sale_status text check ('active','paused','ended','unknown')`
  - `hidden boolean`
  - 入力項目: `name_ja`, `name_en`, `price_yen`, `area`, `shop_name`, `category_tags text[]`, `period_start`, `period_end`, `image_path`, `image_source_url`, `info_source_url`, `source_type`, `confidence`, `notes`
  - メタ: `created_by`, `updated_by`, `created_at`, `updated_at`
  - 公開状態の判定: 公開ページは `publish_state='published' AND hidden=false AND sale_status<>'ended'(表示方針次第) AND 可視条件`。
- **food_revisions**（変更履歴・rollback）: `id`, `food_id`, `version int`, `snapshot jsonb`, `action`, `actor_email`, `created_at`。**変更/公開の都度スナップショット**。
- **audit_log**（操作ログ・不変）: `id`, `actor_email`, `actor_role`, `action`（create/update/publish/hide/pause/end/restore/upload/rollback）, `entity_type`, `entity_id`, `before jsonb`, `after jsonb`, `created_at`, `ip`, `user_agent`。
- enum 制約: role / publish_state / sale_status / source_type(official|trusted-site|manual-confirmed) / confidence(high|medium|low)。category_tags は許可セットの check or 参照テーブル。
- **ID**: 新規は `food-manual-<…>` 規約 or uuid。既存 generated ID と非衝突の名前空間。

> 任意で `food_drafts` を別表にする案もあるが、editor 即公開なら **foods.publish_state で十分**（実装簡素）。incomplete は publish_state='draft' として保存し、公開条件を満たすまで published に上げられない。

## 3. 画像の保存先（特に知りたいこと #2）

- **Supabase Storage**、bucket `food-images`、パス `food-images/<food_id>/main.jpg`（既存 manual-images 規約と整合）。
- **Storage Policy**: 書込は authenticated＋role(owner/editor)。読取は公開 or 署名URL。
- **アップロード検証（サーバー側）**: 形式 jpg/png/webp、容量 ≤2MB、寸法 ≤1280px（正方推奨）、MIME 実体検査、ファイル名サニタイズ。
- **公開条件**: `image_path` が存在しないと publish 不可（画像なし非公開を強制）。
- 差し替え時は同パス上書き＋revision/audit に記録（旧URLは履歴に残る）。

## 4. 家族ログインの作り方（特に知りたいこと #3）

- **Supabase Auth のメール magic link / OTP**（パスワード不要＝スマホで楽・家族向き）。
- **招待制 allowlist**: 自由サインアップを開かない。`admin_users` に登録された email のみログイン後に admin 機能可（未登録は拒否＝viewer 未満）。owner が email を追加。
- セッションは Supabase Cookie（SSR）。`/admin/*`・`/api/admin/*` は **サーバー側で session＋admin_users 照合**。
- （任意・将来）owner に MFA 推奨。

## 5. editor 即公開のリスクと対策（特に知りたいこと #4）

| リスク | 対策 |
|---|---|
| 誤公開（誤情報・誤価格） | **サーバー側 公開バリデーション必須**: 画像あり／info_source_url あり／price・area・shop・category_tags 充足／enum 妥当。満たさなければ published に上げられない（draft 止まり） |
| 画像不一致 | 画像必須＋image_source_url 必須。公開後も差し替え＋履歴で是正可 |
| 取り違え・事故 | **全操作 audit_log**（誰が・いつ・何を）＋**revision 履歴**＋**1クリック rollback**＋**soft delete のみ**（破壊不可） |
| アカウント乗っ取り | Supabase Auth（強い認証）＋allowlist＋（owner）MFA 推奨＋rate limit。RLS で foods 直書き不可（API 経由のみ） |
| 権限逸脱 | RLS＋API で role 検証。**editor はロール付与・ハード削除・identity キー変更 不可**。`ended`/`rollback` を owner 限定にするのも選択肢 |
| 監視不足 | owner 向けに「最近の公開/変更」フィード（audit_log）を /admin/logs に表示。任意で公開時通知（メール/Slack） |

> editor 即公開は「速さ」を取る代わりに**事後是正（履歴/rollback/ログ）**で守る設計。破壊的操作（ハード削除）は誰にも許可しない。

## 6. 操作ログ設計（特に知りたいこと #5）

- 書込系 API（create/update/publish/hide/pause/end/restore/upload/rollback）で**必ず** audit_log を 1 行追加（service role）。
- 記録: actor_email/role、action、entity、before/after（差分）、timestamp、ip/UA。
- **不変ログ**: RLS で update/delete 不可（owner も改変不可）。閲覧は owner（必要なら editor も自分の分）。
- /admin/logs に新しい順で表示・フィルタ（actor/action/期間）。

## 7. rollback 設計（特に知りたいこと #6）

- 変更/公開のたびに `food_revisions` にスナップショット（version 連番）。
- **rollback = 過去スナップショットから“前進復元”**（新 revision を作って foods を上書き）。**履歴は消さない**（非破壊）。
- 実行は owner 推奨（editor 許可なら audit 必須）。rollback 自体も audit_log に記録。
- 削除した商品は無い（hidden/ended）ので「復活」も状態変更で対応。

## 8. 管理画面ページ（要望どおり）

| ルート | 機能 | 権限 |
|---|---|---|
| `/admin/login` | magic link 送信／コールバック | 全員（allowlist 外は機能不可） |
| `/admin/foods` | 一覧・検索・状態バッジ（draft/published/hidden/paused/ended） | viewer+ |
| `/admin/foods/new` | 追加フォーム → 保存(draft) / 公開(条件満たせば) | editor+ |
| `/admin/foods/[id]/edit` | 修正・画像差替・状態切替・公開/非表示 | editor+ |
| `/admin/logs` | 操作ログ・変更履歴・rollback | owner（閲覧は editor 可も検討） |

- 入力項目: 商品名/価格/エリア/店舗/カテゴリタグ/販売状況/販売期間/画像/画像出典URL/商品情報出典URL/メモ（＋自動: 作成者/更新者/日時）。

## 9. API 設計（サーバー側・session+role・CSRF・rate limit・service role はサーバー専用）

- `POST /api/admin/foods`（新規: editor+、保存=draft）
- `PATCH /api/admin/foods/:id`（修正: editor+）
- `POST /api/admin/foods/:id/publish`（公開: editor+、**バリデーション必須**）
- `POST /api/admin/foods/:id/status`（hide/pause/end/restore: editor+ ※ended/rollback を owner 限定にする選択肢）
- `POST /api/admin/upload`（画像: 形式/容量/寸法検証 → Storage）
- `POST /api/admin/foods/:id/rollback`（owner 推奨）
- `GET /api/admin/logs`（owner）
- すべて: 未認証 401 / 権限不足 403、入力バリデーション＋サニタイズ、audit_log 記録。

## 10. 公開フロー（editor 即公開・ゲートはバリデーション）

```
editor: new/edit → 保存(draft) いつでも可
        → 公開ボタン → サーバー検証:
            画像あり / info_source_url あり / price・area・shop・category_tags 充足 / enum 妥当
          OK → foods.publish_state='published'（即時公開・再デプロイ不要）
          NG → 公開不可（draft のまま、不足項目を提示）
状態切替: active/paused/ended/hidden（削除なし）
全操作 → audit_log ＋ revision 記録 → 必要なら owner が rollback
```

## 11. セキュリティ要件

- 認証必須（Supabase セッション）。共有トークンは仮ロック→実認証後撤去。
- allowlist＋role をサーバー側で強制。RLS で DB 二重防御（**クライアントから foods 直書き不可**、書込は API＋service role）。
- **service role key・秘密・広告ID をクライアントに出さない**（NEXT_PUBLIC_ 禁止）。
- API は未認証で叩けない。CSRF、rate limit、入力バリデーション、HTML/script サニタイズ。
- 画像: 形式/容量/寸法/MIME 検証、ファイル名サニタイズ。
- **本番 public/generated を実行時に書かない**（Supabase へ）。
- audit_log 不変、revision 履歴、soft delete、rollback。
- /admin は noindex＋認証。

## 12. App Store 互換（特に知りたいこと #7）

- **互換あり**。iOS（Capacitor）も Web も**同じ Supabase（or 公開済データ）**を読むため同源運用可。公開はDB更新で両面に即反映。
- `/admin` は **Web 限定**（アプリバイナリに同梱しない／同梱でも認証必須）。広告(AdMob)・課金とは独立。
- 注意: アプリ配信時は匿名/anon キーのみクライアント、service role は絶対にバンドルしない。

## 13. 最初に Codex へ投げる最小 goal（特に知りたいこと #8）

**Phase 1＝認証・ロール土台（書込なし・read-only）**。editor 即公開を作る前に、**実認証（Supabase）と role ゲートが先**。
- `admin_users`＋RLS マイグレーション（SQL 追加のみ・適用は人手）
- `/admin/login`（magic link）＋ サーバー側 `requireAdmin(role?)`
- `/admin/*`・`/api/admin/*` を session＋allowlist で保護（Supabase 未設定時は現行 proxy.ts トークンにフォールバック）
- **read-only** `/admin/foods` 一覧（編集/公開は Phase 2）
- DB書込・画像アップロード・公開・rollback は**作らない**（Phase 2-3）
→ `docs/codex-goal-admin-in-app-management-trusted-family-phase1-v2.md` 参照。

## 14. まだやらない方がいいこと（特に知りたいこと #9）

- 実認証が入る前の書込/公開（必ず Phase 1 の auth 後）。
- ハード削除機能（恒久禁止、hidden/ended のみ）。
- 公開読取の Supabase 全面移行は段階的に（Phase 4。まずは admin と並行、generated フォールバック維持）。
- AI 自動下書き（後フェーズ・human確認前提）。
- 共有トークンの即時撤去（実認証が安定するまで残す）。
- service role をクライアントに出す実装。

## 15. Phase 分け

| Phase | 内容 |
|---|---|
| 1（最小・最初の goal） | Supabase Auth＋admin_users(allowlist/role)＋session/role ゲート＋/admin/login＋read-only 一覧（書込なし） |
| 2 | foods への add/edit、Storage 画像アップロード（検証）、保存(draft) |
| 3 | **公開（バリデーション）**・状態切替（hide/pause/end/restore）・audit_log・food_revisions・rollback（＝editor 即公開モデルの本体） |
| 4 | 公開読取を Supabase へ全面移行（294件シード）、generated はフォールバック |
| 5 | AI 自動下書き（human-in-the-loop） |

---

## 結論（再掲）
Supabase型で、editor も即公開可能にしつつ、**公開時バリデーション＋audit_log＋revision/rollback＋soft delete** で安全を担保する。最初は **Phase 1（認証・ロール土台・read-only）** から。実装はしない。
