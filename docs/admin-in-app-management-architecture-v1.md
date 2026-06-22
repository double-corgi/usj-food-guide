# UNICOLE アプリ内 管理画面アーキテクチャ 設計 v1

**作成日:** 2026-06-22
**担当:** Claude（設計・レビュー担当 / 実装はしない）
**現状の重要事実:** **Supabase が既に配線済み** — `@supabase/ssr`・`@supabase/supabase-js` 依存、`lib/supabase-server.ts`（server＋service-role クライアント）、`supabase/`（schema.sql＋migrations、`foods` テーブル）、`listFoods`/`getFoodById` が **Supabase 設定時は Supabase / 未設定時は generated JSON にフォールバック**。`/admin` は proxy.ts のトークンゲートで保護済（暫定）。

> 本書は設計のみ。コード変更・git・generated直接編集・DB/crawler・translations・広告 いずれも触っていない。調査は読み取りのみ。

---

## 1. 結論

- **Supabase型（案A）を採用**。理由: **既にコードベースに統合済み**（Auth/DB/Storage/RLS が1つで揃い、読み取り経路も Supabase 対応済）。最小追加で「アプリ内・Codex不要・スマホ可・即時公開」を実現できる。
- **公開 = DB行のステータス更新**（再デプロイ不要）。Vercel本番の public/generated を実行時に書き換えない要件を満たす（書込先は Supabase、Vercel FS は不変）。
- **共有トークンは本運用にしない**。Supabase Auth（メールのマジックリンク/OTP）で**家族もパスワードなしでログイン**、`admin_users` allowlist＋RLS でロール制御。
- **削除はしない（soft）**: hidden/paused/ended のステータス管理＋**revision 履歴で rollback**。
- **下書き→承認→公開**を最優先。AI自動下書きは将来（human-in-the-loop 厳守）。
- 移行期は generated JSON をフォールバック/シードとして保持（段階移行）。

---

## 2. 推奨構成（採用）

```
[認証] Supabase Auth（magic link / OTP）  → 家族もパスワード不要
[権限] admin_users(email, role) + RLS（owner/editor/viewer）
[データ] Supabase Postgres
        foods（公開・本番）/ food_drafts（下書き）/ food_revisions（履歴・rollback）/ audit_log
[画像] Supabase Storage（bucket: food-images）＋ Storage Policy（型/容量/サイズ制限）
[読み取り] 既存 listFoods/getFoodById（Supabase優先・generatedフォールバック）
[書き込み] /api/admin/* （サーバー側のみ・session+role 検証・service role はサーバー専用）
[公開] owner が draft→foods へ反映（DB更新）＝再デプロイ不要・即時
[保護] proxy.ts（移行期の外側ゲート）→ 最終的に Supabase セッション＋role の middleware に置換
```

- **Codex 不要**: 追加/修正/公開はすべてアプリ内（DB/Storage）で完結。Codex は機能実装時のみ。
- **本番 FS 非書込**: 書込は Supabase。generated JSON は触らない。

---

## 3. 案 A / B / C 比較

| 観点 | A. Supabase型（採用） | B. Vercel型（Blob+Neon+独自認証） | C. GitHub連携型（commit+deploy） |
|---|---|---|---|
| 実装難易度 | 中（既統合・RLS設計要） | 中〜高（認証を自作＝リスク） | 中（GitHub API/トークン運用） |
| スマホ管理 | ◎（magic link・Storage直アップ） | ○ | △（commit/PR をスマホから運用は辛い） |
| セキュリティ | ◎（Auth＋RLS＋Storage Policy 一体） | △（独自認証の作り込み次第） | ○（書込はPR経由だがトークン管理） |
| 画像アップロード | ◎（Storage＋署名URL＋Policy） | ○（Blob） | △（画像を git に commit＝肥大） |
| コスト | ○（無料枠〜従量） | ○（従量） | ◎（ほぼ静的） |
| App Store相性 | ◎（DB読みでアプリ/Webを同源化可） | ○ | ○（静的配信） |
| AdMob/AdSense相性 | ◎（広告と独立） | ◎ | ◎ |
| rollback | ◎（revision表＋soft delete＋PITR） | ○（DB次第） | ◎（git revert）だが公開に再デプロイ |
| 今のUNICOLEとの相性 | ◎（**既に配線済**） | △（再構築） | △（公開フローが現状の Codex 依存と同質＝目的に反する） |
| 即時公開（再デプロイ不要） | ◎ | ◎ | ✗（毎回 deploy） |

→ **GitHub連携型は「毎回 commit/deploy」で“Codex不要・即時公開・スマホ運用”という目的に反する**。Vercel型は独自認証の自作が負債。**既統合の Supabase型が最短・最安全。**

---

## 4. 採用すべき構成

**案A（Supabase）**。Auth＋Postgres＋Storage＋RLS。読み取りは既存経路を活用、書き込みは /api/admin（サーバー側・role 検証）。公開は DB ステータス更新。

---

## 5. DB テーブル設計案（Supabase / Postgres）

> 既存 `foods`（schema.sql/migrations）を活かしつつ、管理用テーブルを追加。

- **admin_users**: `id(uuid, =auth.uid)`, `email(unique)`, `role(enum owner|editor|viewer)`, `created_at`。allowlist 兼ロール。
- **foods**（既存・本番公開）: 既存カラム（id, name, price, area/shop, category, saleStatus, hidden, reviewStatus, displayQuality, imageUrl, sourceUrl…）。本番読取はここ。
- **food_drafts**: `id(uuid)`, `target_food_id(nullable=新規)`, `action(add|update|hide|pause|end|restore)`, 入力項目一式（foodNameJa/En, priceYen, area, shopName, categoryTags[], saleStatus, periodStart/End, image_path, imageSourceUrl, infoSourceUrl, sourceType, confidence, notes）, `status(draft|pending|published|rejected)`, `created_by`, `reviewed_by`, `created_at`, `updated_at`。
- **food_revisions**: `id`, `food_id`, `snapshot(jsonb)`, `published_by`, `published_at`。rollback 用（公開のたびに直前/新スナップショットを記録）。
- **audit_log**: `id`, `actor`, `action`, `entity(food/draft)`, `entity_id`, `diff(jsonb)`, `created_at`。
- **enum/制約**: saleStatus(active|paused|ended|unknown)、sourceType(official|trusted-site|manual-confirmed)、confidence(high|medium|low)、role(owner|editor|viewer)。categoryTags は許可セットの check または別テーブル。
- **ID**: 新規 food は `food-manual-<...>` 規約踏襲 or uuid。既存 generated ID と衝突しない名前空間。

## 6. Storage 設計案

- **bucket: `food-images`**（公開読取 or 署名URL）。パス `food-images/<food_id>/main.jpg`（既存 manual-images 規約と整合）。
- **Storage Policy**: 書込は owner/editor のみ（authenticated＋role）。読取は公開（公開済画像のみ）or 署名URL。
- **検証**: アップロード時に **形式（jpg/png/webp）・容量（≤2MB）・寸法（≤1280px・正方推奨）** をサーバー側で検証。MIME 実体検査・ファイル名サニタイズ。
- 下書き画像と公開画像を分離（draft は別プレフィックス or 同パス＋published フラグ）。

## 7. 認証・権限設計

- **Supabase Auth**: メール **magic link / OTP**（家族＝パスワード不要）。
- **allowlist**: `admin_users` に登録された email のみログイン後に admin 機能可（未登録は viewer 以下＝拒否）。サインアップ自由開放はしない（招待制 or owner 追加）。
- **RLS**:
  - admin_users: 本人 read、owner のみ write（ロール付与）。
  - food_drafts: editor は自分の draft を insert/update、viewer は read、owner は全 draft read＋publish。
  - foods（公開反映）: 直接書込は **service role（サーバーAPI）経由のみ**。クライアントから直接 foods を書けない RLS。
  - food_revisions/audit_log: サーバー（service role）書込、owner read。
- **service role key はサーバー専用**（既存 `createServiceSupabaseClient`、env `SUPABASE_SERVICE_ROLE_KEY`）。クライアントへ出さない。
- **middleware**: 最終的に proxy.ts のトークンゲートを **Supabase セッション＋role チェック**へ置換（移行期は併用可）。

## 8. 管理画面ページ設計

| ルート | 機能 | 権限 |
|---|---|---|
| `/admin/login` | magic link 送信・コールバック | 全員（allowlist 外はログイン後に機能制限） |
| `/admin/foods` | 一覧（status/カテゴリ/検索）・状態バッジ | viewer+ |
| `/admin/foods/new` | 新規追加フォーム → draft 保存 | editor+ |
| `/admin/foods/[id]/edit` | 既存修正 → draft 保存 | editor+ |
| `/admin/review` | pending draft の承認/差し戻し → publish | owner |
| `/admin/logs` | audit_log 閲覧 | owner |

- フォーム項目: 商品名(ja/en)/価格/エリア/店舗/カテゴリタグ/販売状況/販売期間/画像/画像出典URL/情報出典URL/sourceType/confidence/メモ/作成者/確認者。
- 操作: 追加・修正・非表示・休止・終了・復帰・画像アップ/差替・下書き・プレビュー・公開・差戻し・ログ。

## 9. API 設計（すべてサーバー側・session+role・CSRF・rate limit）

- `POST /api/admin/drafts`（draft 作成: editor+）
- `PATCH /api/admin/drafts/:id`（draft 更新: 作成者/owner）
- `POST /api/admin/drafts/:id/submit`（pending 化: editor+）
- `POST /api/admin/drafts/:id/publish`（**owner のみ**・公開バリデーション）
- `POST /api/admin/drafts/:id/reject`（差戻し: owner）
- `POST /api/admin/foods/:id/status`（hide/pause/end/restore: owner）
- `POST /api/admin/upload`（画像: 形式/容量/寸法検証 → Storage）
- `POST /api/admin/foods/:id/revert`（revision へ rollback: owner）
- `GET /api/admin/logs`（audit: owner）
- 全 API: 未認証/権限不足は 401/403、service role はサーバー内のみ、入力バリデーション＋サニタイズ。

## 10. 画像アップロード設計

1. クライアント → `/api/admin/upload`（または Supabase 署名付きアップロードURLをサーバー発行）。
2. サーバーで **MIME/拡張子（jpg/png/webp）・容量（≤2MB）・寸法（≤1280px）** 検証、ファイル名生成（`<food_id>/main.jpg`）。
3. Storage 保存 → 公開URL/署名URL を draft に記録。
4. **公開時に image 必須**（画像なしは publish 不可）。

## 11. 公開 / 承認フロー

```
editor: new/edit → draft（status=draft）→ submit（pending）
owner : /admin/review で確認 → publish
publish バリデーション（必須）:
  - 画像あり
  - infoSourceUrl あり
  - confidence=high は official または明確な trusted-site 出典
  - 必須項目（名称/エリア/店舗/カテゴリ/販売状況）充足
publish 成功 → foods 更新（DB）＝即時公開（再デプロイ不要）
            → food_revisions にスナップショット、audit_log 記録
hide/pause/end/restore = foods のステータス更新（削除しない）
rollback = food_revisions から復元（owner）
```

## 12. セキュリティ要件

- 認証必須（Supabase セッション）。**共有トークン本運用は廃止**（移行後）。
- allowlist＋ロール（owner/editor/viewer）をサーバー側で強制。RLS で DB レベルも二重防御。
- **service role key・秘密鍵・広告ID をクライアントに出さない**（NEXT_PUBLIC_ を付けない）。
- API は未認証で叩けない。CSRF 対策、rate limit、入力バリデーション、HTML/script サニタイズ。
- 画像: 形式/容量/寸法/実体MIME 検証、ファイル名サニタイズ。
- **本番 public/generated を実行時に書かない**（書込先は Supabase）。
- 監査ログ・変更履歴・soft delete・rollback。
- 突破時の被害最小化: クライアントから foods 直書き不可（RLS）、公開は owner＋バリデーション必須。
- /admin は noindex 維持＋認証（obscurity は補助）。

## 13. 家族スマホ管理の UX

- **magic link/OTP** でパスワード不要ログイン（スマホ最適）。
- モバイルファースト・フォーム、**カメラロールから画像アップ**、下書き自動保存、プレビュー、状態バッジ（下書き/承認待ち/公開/非表示）。
- editor（家族）は下書き作成まで、owner が review キューで公開 → 役割が明快で誤公開しにくい。

## 14. AI 自動下書き化（将来）

- サーバージョブ/エンドポイントが「情報出典URL or crawl 候補」を入力に、LLM で **draft を提案**（名称/価格/カテゴリ/販売状況、**confidence=low・sourceType=trusted-site**）。
- **自動公開しない**（必ず human レビュー）。drafts に積むだけ。
- 既存 crawler 候補（image-candidates 等）を AI 整形して draft 化する拡張も可能。

## 15. Phase 分け

| Phase | 内容 | 書込 |
|---|---|---|
| **1（最小・最初の goal）** | Supabase Auth（magic link）＋ `admin_users`(allowlist/role) ＋ **サーバー側 session/role ゲート**（proxy.ts を補完）＋ `/admin/login` ＋ 既存データの**読み取り専用** admin 一覧。書込/公開なし。env 未設定時は現行動作にフォールバック | なし（read-only） |
| **2** | `food_drafts` テーブル＋ draft CRUD（new/edit）＋ Storage 画像アップロード（検証） | drafts/Storage |
| **3** | `/admin/review`＋ publish/reject、`food_revisions`/`audit_log`、hide/pause/end/restore、rollback | foods(DB) |
| **4** | 公開読取を Supabase へ全面移行（294件シード移行）＋ generated はフォールバック | — |
| **5** | AI 自動下書き化（human-in-the-loop） | drafts |

> 各 Phase は前 Phase 完了＋レビュー承認後。Phase 1 は**書込ゼロ＝安全**で、共有トークンを実認証へ置換する土台。

## 16. 最初に Codex へ投げる最小 goal
`docs/codex-goal-admin-in-app-management-phase1-v1.md` に **Phase 1（認証/ロール土台・read-only）** の最小 goal を用意。DB 書込・公開・画像アップロード・AI は含めない。Supabase プロジェクト作成/環境変数/allowlist 登録は**人手の前提条件**として明記。

---

## まだやらないこと
- draft CRUD / publish / 画像アップロード / rollback（Phase 2-3）。
- 公開読取の Supabase 全面移行（Phase 4）。
- AI 自動下書き（Phase 5）。
- generated 直接編集・crawler・translations・広告・App Store 作業。
- 共有トークンの即時撤去（Phase 1 で実認証が入るまで併用、移行後に撤去）。
