# Codex /goal 案: アプリ内管理画面 Phase 1（認証・ロール土台 / read-only）

> 前提: `docs/admin-in-app-management-architecture-v1.md`（採用＝Supabase型）。
> 今回は **Phase 1 のみ**: Supabase Auth＋admin_users(allowlist/role)＋サーバー側 session/role ゲート＋/admin/login＋**読み取り専用 admin 一覧**。
> **DB書込・公開・画像アップロード・AI は作らない。** generated直接編集・crawler・translations・広告は禁止。
> ⚠️ 書込ゼロ（read-only）。Supabase 未設定時は現行動作にフォールバックすること。

## 人手の前提条件（Codex 着手前 / 進行側）
- Supabase プロジェクト作成、`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`（サーバー専用）を Vercel env に設定。
- `admin_users` に owner/editor のメールを登録（allowlist）。
- 既存 `ADMIN_ACCESS_TOKEN`（proxy.ts）は移行期は併用（撤去は後続）。

以下、Codex にそのまま貼れる本文（人手前提が揃ってから）。

```
/goal UNICOLE のアプリ内管理画面の Phase 1（認証・ロール土台、書込なし）を実装する。Supabase Auth と admin_users(allowlist/role) を導入し、/admin をサーバー側セッション+role で保護、/admin/login と読み取り専用の admin 一覧を用意する。DB書込・公開・画像アップロード・AI は作らない。

## やること（read-only・最小）
1. DBマイグレーション（supabase/migrations に SQL 追加）:
   - admin_users(id uuid pk = auth.uid, email text unique, role text check in ('owner','editor','viewer'), created_at)
   - RLS 有効化: admin_users は本人 read のみ、owner のみ write。
   - ※ foods/drafts への書込系は作らない（Phase 2-3）。
2. 認証:
   - /admin/login（Supabase magic link/OTP 送信＋コールバック）。既存 lib/supabase-server.ts を利用。
   - サーバー側ヘルパ: 現在ユーザーの session を取得し admin_users から role を引く requireAdmin(role?) を実装。
3. ルート保護（サーバー側）:
   - proxy.ts もしくは Server Component/route handler で、/admin/* と /api/admin/* を「ログイン済み かつ admin_users に存在」で許可。role 不足は 403、未ログインは /admin/login へ。
   - Supabase 未設定（env なし）時は **現行の proxy.ts トークン挙動にフォールバック**（破壊しない）。
4. 読み取り専用 admin 一覧:
   - /admin/foods に既存データ（listFoods/generated）を **表示のみ**（編集ボタンは Phase 2 で）。
   - viewer 以上で閲覧可。
5. service role key はサーバー専用（クライアントへ出さない）。秘密・広告ID を NEXT_PUBLIC_ に置かない。

## やってはいけないこと（厳守）
- DB への food 書込・公開・ステータス変更を実装しない（read-only）。
- food_drafts / food_revisions / audit_log / Storage / 画像アップロードを作らない（Phase 2-3）。
- generated JSON を直接編集しない。crawler / DB マイグレーションの本番実行はしない（SQL ファイル追加のみ。適用は人手）。
- data/translations / 広告(AdMob/AdSense) を触らない。
- service role key・秘密鍵をクライアントバンドルに含めない。
- 既存の foods 読み取り経路（listFoods/getFoodById のフォールバック）を壊さない。
- 共有トークン proxy.ts を削除しない（フォールバックとして残す）。
- git add . 禁止。変更ファイルを限定する。

## 検証（実施し報告）
- npm run lint / typecheck / build / coverage 成功、Coverage 不変（Food total 294 ほか）。
- Supabase 未設定（env なし）で: 既存挙動が維持される（/admin はトークンゲート、公開ページ正常、generated フォールバック読取）。
- Supabase 設定時（ステージング想定）で: 未ログイン /admin → /admin/login、allowlist 外ログイン → 403、owner/editor ログイン → /admin/foods 閲覧可。
- 書込が発生しないこと（DB の foods 行・generated・public が変化しない）。
- git status --short が想定変更ファイルのみ。

## 完了条件
- 認証・ロール土台（admin_users＋RLS）、/admin/login、サーバー側 session/role ゲート、read-only /admin/foods が動作。
- 書込ゼロ・既存フォールバック維持・全チェック成功。
- 変更ファイルを限定報告し、レビュー（Claude）へ。

## Stop条件（該当したら停止して報告）
- 書込/公開/画像アップロードが必要になったとき（Phase 2-3 マター）。
- service role をクライアントに出す必要が生じたとき。
- 既存読み取り経路や proxy.ts フォールバックを壊しそうなとき。
- 重い新規依存が必要になったとき（@supabase は既存）。
- generated/translations/広告 に触れる必要が出たとき。
```

---

## 進行側メモ
1. 本 goal は **書込ゼロの認証土台のみ**。draft 作成/公開/画像は Phase 2-3 で別 goal。
2. マイグレーションSQL は追加のみ。**本番DBへの適用は人手**（Supabase ダッシュボード/CLI）。
3. 移行完了まで proxy.ts トークンゲートは残す（実認証が安定したら撤去 goal）。
4. 実装後、Claude が `design-review-admin-in-app-management-phase1-v1.md` でレビュー証跡を作成（本タスクではまだ作らない）。
