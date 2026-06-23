# Codex /goal 案: アプリ内管理画面 v2 Phase 1（認証・ロール土台 / read-only）

> 前提: `docs/admin-in-app-management-trusted-family-v2.md`（Supabase型・editor 即公開モデル）。
> editor 即公開は **Phase 3** で実装。**Phase 1 はその前提となる「実認証＋ロール土台（書込なし）」のみ。**
> DB書込・公開・画像アップロード・rollback は作らない。generated直接編集・crawler・translations・広告は禁止。
> ⚠️ 書込ゼロ。Supabase 未設定時は現行（proxy.ts トークン）にフォールバック。

## 人手の前提条件（進行側・Codex 着手前）
- Supabase プロジェクト作成。`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`（サーバー専用）を Vercel env に設定。
- `admin_users` に家族の email と role（owner/editor/viewer）を登録（allowlist・招待制）。
- 既存 `ADMIN_ACCESS_TOKEN`（proxy.ts）は移行期は併用。

以下、Codex にそのまま貼れる本文（前提が揃ってから）。

```
/goal UNICOLE のアプリ内管理画面 v2 の Phase 1（認証・ロール土台、書込なし）を実装する。Supabase Auth と admin_users(allowlist/role) を導入し、/admin をサーバー側セッション+role で保護、/admin/login と読み取り専用の /admin/foods を用意する。DB書込・公開・画像アップロード・rollback は作らない。

## やること（read-only・最小）
1. マイグレーションSQL追加（supabase/migrations、適用は人手）:
   - admin_users(id uuid pk = auth.uid, email text unique, role text check in ('owner','editor','viewer'), created_at timestamptz default now())
   - RLS 有効化: admin_users は本人 select のみ／insert/update/delete は owner のみ。
   - ※ foods への書込系・revisions・audit_log・Storage は作らない（Phase 2-3）。
2. 認証:
   - /admin/login（Supabase magic link / OTP 送信＋コールバック）。既存 lib/supabase-server.ts を利用。
   - サーバーヘルパ requireAdmin(minRole?): セッション取得→admin_users で role 解決→不足は 403、未ログインは /admin/login へ。
3. ルート保護（サーバー側）:
   - /admin/* と /api/admin/* を「ログイン済み かつ admin_users に存在」で許可。
   - Supabase 未設定（env なし）時は **現行 proxy.ts トークン挙動にフォールバック**（壊さない）。
4. 読み取り専用 /admin/foods:
   - 既存 listFoods/generated を表示のみ（new/edit/公開ボタンは Phase 2-3 で）。viewer+ 閲覧可。
5. service role key はサーバー専用（クライアント非露出）。秘密・広告ID を NEXT_PUBLIC_ に置かない。

## やってはいけないこと（厳守）
- foods への書込・公開・状態変更・画像アップロード・rollback を実装しない（read-only）。
- food_revisions / audit_log / Storage バケット / drafts を作らない（Phase 2-3）。
- generated JSON 直接編集をしない。DB マイグレーションの本番適用をしない（SQL 追加のみ）。
- crawler / data/translations / 広告(AdMob/AdSense) を触らない。
- service role key・秘密鍵をクライアントに出さない。
- 既存 foods 読み取り経路（listFoods/getFoodById フォールバック）と proxy.ts トークンを壊さない/消さない。
- git add . 禁止。変更ファイルを限定する。

## 検証（実施し報告）
- npm run lint / typecheck / build / coverage 成功、Coverage 不変（Food total 294 ほか）。
- Supabase 未設定: 既存挙動維持（/admin はトークン、公開ページ正常、generated フォールバック）。
- Supabase 設定時（ステージング想定）: 未ログイン /admin → /admin/login、allowlist 外 → 403、owner/editor → /admin/foods 閲覧可。
- 書込が発生しないこと（foods 行・generated・public 不変）。
- git status --short が想定変更ファイルのみ。

## 完了条件
- admin_users＋RLS、/admin/login、サーバー側 session/role ゲート、read-only /admin/foods が動作。
- 書込ゼロ・既存フォールバック維持・全チェック成功。
- 変更ファイルを限定報告し、レビュー（Claude）へ。

## Stop条件（該当したら停止して報告）
- 書込/公開/画像アップロード/rollback が必要になったとき（Phase 2-3）。
- service role をクライアントに出す必要が生じたとき。
- 既存読み取り経路・proxy.ts フォールバックを壊しそうなとき。
- 重い新規依存が必要なとき（@supabase は既存）。
- generated/translations/広告 に触れる必要が出たとき。
```

---

## 進行側メモ
1. editor 即公開（バリデーション＋audit＋rollback）は **Phase 3**。Phase 1 は認証土台のみ（書込ゼロ＝安全）。
2. マイグレーションは追加のみ・本番適用は人手。
3. 実認証が安定するまで proxy.ts トークンは残す（後で撤去 goal）。
4. 実装後、Claude が `design-review-admin-in-app-management-trusted-family-phase1-v2.md` でレビュー証跡を作成（本タスクではまだ作らない）。
