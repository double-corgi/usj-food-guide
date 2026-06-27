# UNICOLE 管理画面 Phase 2（UIのみ・DB書き込みなし）実装指示書 v1

**作成日:** 2026-06-22
**担当:** Claude（設計・レビュー担当 / 実装はしない）
**現状（Phase 1 完了）:** Supabase Auth 導入済、`admin_users` 作成・owner 登録済、`/admin/login` Magic Link 動作、`/admin/foods`（read-only）動作、`lib/admin-auth.ts` の `requireAdmin(role)` が `{mode, role, email}` を返す（Supabase / ADMIN_ACCESS_TOKEN フォールバック）。商品: 全候補294 / 表示181 / hidden76。

> 本書は設計・指示のみ。コード変更・git・generated/crawler/translations/広告は触らない。

---

## 1. Phase 2 でやるべきこと

- `/admin/foods` の**見やすさ改善**（スマホ＝カード、PC＝高密度テーブル、検索・フィルタ・状態バッジ）。
- **商品詳細確認画面** `/admin/foods/[id]`（read-only・全項目＋画像＋出典URL表示）。
- **商品追加画面 `/admin/foods/new`（UIのみ）**：全入力欄＋画像アップロードUI（**保存はしない**）。
- **商品編集画面 `/admin/foods/[id]/edit`（UIのみ）**：既存値をプレフィル表示（**保存はしない**）。
- **入力項目の設計**（§4）と、Phase 3 で DB 保存につなげやすい**再利用フォーム部品**（例: `FoodForm`）。
- **role による表示制御**（viewer/editor/owner、§5）。
- 既存 `requireAdmin` をそのまま使い、Phase 1 認証/role 判定を壊さない。

## 2. Phase 2 でやらないこと（重要）

- **DB への商品書き込み一切しない**（add/edit/公開/状態変更/削除の永続化なし）。
- **画像の実アップロード/保存をしない**（UI のみ。Storage 連携は Phase 3）。
- **公開反映・hidden/paused/ended の永続切替をしない**（表示と入力欄はあってもサーバー保存なし）。
- 削除機能を作らない（恒久的に非表示運用）。
- generated JSON / crawler / data/translations / 広告(AdMob/AdSense) を触らない。
- 既存の公開ページ（/foods 等）と Phase 1 認証を改変しない。
- 新規の重い依存・DB マイグレーション・Storage バケット作成をしない。

## 3. 画面構成

| ルート | 役割 | Phase 2 の状態 |
|---|---|---|
| `/admin/foods` | 一覧（検索/フィルタ/状態バッジ/サムネ）。PC=テーブル, スマホ=カード | 既存を改善（read中心） |
| `/admin/foods/[id]` | 詳細確認（全項目・画像・出典URL） | **新規・read-only** |
| `/admin/foods/new` | 追加フォーム（全入力欄＋画像UI） | **新規・UIのみ／保存不可** |
| `/admin/foods/[id]/edit` | 編集フォーム（既存値プレフィル） | **新規・UIのみ／保存不可** |

- 一覧から詳細・編集へ、詳細から編集へ遷移。new は一覧の「追加」ボタン（editor/owner のみ表示）。
- フォームの「保存/公開」ボタンは **Phase 2 では無効化**し「Phase 3 で有効化予定」と明示（押しても何も送信しない＝ネットワーク mutation なし）。
- 一覧/詳細の状態は **表示のみ**（draft/published、active/paused/ended、hidden をバッジ表示）。

### レイアウト指針
- **スマホ**: 1カラム・カード（サムネ＋商品名＋価格＋エリア/店舗＋状態バッジ＋「詳細」）。フォームは縦積み・大きめタップ領域・セクション分け。
- **PC**: テーブル（列: サムネ/商品名/価格/エリア/店舗/カテゴリ/販売状態/公開状態/操作）。上部に検索＋フィルタ（カテゴリ/販売状態/公開状態/hidden）。
- 既存 Tailwind トークン（ink/park/mint/cream 等）で統一。新規UIライブラリ追加なし。

## 4. 入力項目一覧（フォーム設計）

| 項目 | 型/UI | 必須(公開時) | 備考 |
|---|---|---|---|
| 商品名(日本語) `nameJa` | text | ✅ | |
| 商品名(英語) `nameEn` | text | 任意 | |
| 価格 `priceYen` | number(¥) | ✅ | 非負整数 / 不明時は空＋confidence low |
| エリア `area` | select/text | ✅ | 既存エリア候補を提示 |
| 店舗 `shopName` | select/text | ✅ | 既存店舗候補を提示 |
| カテゴリタグ `categoryTags` | multi-select | ✅ | churros/popcorn/drink/burger/plate/dessert/snack/cart/seasonal/universal-market/nintendo/minion/jurassic/harry-potter/conan/sanrio |
| 販売状況 `saleStatus` | select | ✅ | active / paused / ended / unknown |
| 公開状態 `publishState` | select/toggle | ✅ | draft / published（Phase 2 は表示のみ） |
| 販売期間 `periodStart`/`periodEnd` | date | 任意 | |
| 画像 `image` | アップロードUI（プレビュー） | ✅ | Phase 2 は選択/プレビューのみ・保存しない |
| 画像出典URL `imageSourceUrl` | url | ✅(画像時) | |
| 商品情報出典URL `infoSourceUrl` | url | ✅ | |
| メモ `notes` | textarea | 任意 | |
| （自動）作成者/更新者/日時 | 表示 | — | Phase 3 で記録 |

- **公開条件の明示**（フォーム上に注記）: 画像あり・infoSourceUrl あり・価格/エリア/店舗/カテゴリ充足 でなければ Phase 3 で公開不可。
- バリデーションは **クライアント側のインライン表示のみ**（保存しないので送信検証は Phase 3）。必須・形式（URL/数値）をヒント表示。

## 5. owner / editor / viewer 権限整理（Phase 2 は表示制御のみ）

| 操作 | owner | editor | viewer |
|---|---|---|---|
| 一覧 `/admin/foods` 閲覧 | ✅ | ✅ | ✅ |
| 詳細 `/admin/foods/[id]` 閲覧 | ✅ | ✅ | ✅ |
| 「追加」「編集」ボタン表示 | ✅ | ✅ | ❌（非表示） |
| `/admin/foods/new`・`/[id]/edit` 到達 | ✅ | ✅ | ❌（403/forbidden へ） |
| 実際の保存/公開/アップロード | ⛔ Phase 3 | ⛔ Phase 3 | ⛔ |

- 制御は既存 `requireAdmin("viewer"|"editor")` を各ページ/セクションで使用。viewer はフォームへ到達不可（既存 `app/admin/forbidden` へ）。
- Phase 2 では owner/editor の差は「保存系がそもそも無い」ため UI 上ほぼ同じ（追加/編集フォームへ到達可）。owner 限定操作は Phase 3 で導入。

## 6. Codex に貼れる /goal

```
/goal UNICOLE 管理画面 Phase 2（UIのみ・DB書き込みなし）を実装する。/admin/foods の見やすさ改善、商品詳細表示、商品追加/編集フォームのUI、role 表示制御を作る。DB保存・画像アップロード保存・公開反映は一切しない（Phase 3）。

## 前提を壊さない
- Phase 1 認証は既存 lib/admin-auth.ts の requireAdmin(role) をそのまま使う（改変しない）。
- 既存 /admin/foods/page.tsx を土台に改善。公開ページ(/foods 等)・proxy.ts・generated 読み取りは触らない。

## やること（UIのみ）
1. /admin/foods 改善:
   - スマホ=カード一覧 / PC=テーブル一覧（列: サムネ・商品名・価格・エリア・店舗・カテゴリ・販売状態・公開状態・操作）。
   - 検索（商品名）＋フィルタ（カテゴリ/販売状態/公開状態/hidden）＋状態バッジ。
   - データは既存 listAllFoodCandidates() を読み取り表示（書き込みなし）。
   - 「追加」ボタンは editor/owner のみ表示。
2. /admin/foods/[id]（新規・read-only）: 全項目＋画像＋出典URL を表示。editor/owner には「編集」リンク。
3. /admin/foods/new（新規・UIのみ）: §入力項目の全欄を持つフォーム。画像はファイル選択＋プレビューのみ（保存しない）。
   - editor/owner のみ到達可（viewer は app/admin/forbidden へ）。
4. /admin/foods/[id]/edit（新規・UIのみ）: 既存値をプレフィル表示。保存しない。
5. 再利用フォーム部品 components/admin/food-form.tsx（仮）を作り、new/edit で共有。Phase 3 で submit を後付けしやすい props 設計（onSubmit を受け取れるが Phase 2 では未配線/disabled）。
6. 入力項目: nameJa(必須), nameEn, priceYen(必須・数値), area(必須), shopName(必須), categoryTags(必須・許可セットのmulti), saleStatus(active|paused|ended|unknown), publishState(draft|published・表示のみ), periodStart/End, image(UIのみ), imageSourceUrl(url), infoSourceUrl(必須・url), notes。
   - クライアント側インライン・バリデーションのヒント表示のみ（送信検証はしない）。
   - 「公開には 画像・infoSourceUrl・価格・エリア・店舗・カテゴリ が必要」と注記。
7. 保存/公開/アップロード/状態変更/削除のボタンは Phase 2 では無効（disabled）＋「Phase 3で有効化」表示。ネットワーク mutation・DB書き込み・画像保存を一切行わない。

## やってはいけないこと（厳守）
- Supabase/その他へ商品データを書き込まない（INSERT/UPDATE/UPSERT/Storage upload を実装しない）。
- 公開反映・hidden/paused/ended の永続切替・削除を実装しない。
- generated JSON / crawler / data/translations / 広告 を触らない。
- 既存公開ページ・proxy.ts・requireAdmin・Phase 1 認証を改変しない。
- 重い新規依存・新規 DB マイグレーション・Storage バケット作成をしない（Phase 3）。
- service role key・秘密・広告ID をクライアントに出さない。
- git add . 禁止。変更ファイルを限定する。

## 検証
- npm run lint / typecheck / build / coverage 成功、Coverage 不変（Food total 294）。
- 公開ページ /foods 等が従来どおり（影響なし）。
- viewer: 一覧/詳細は見えるが「追加/編集」非表示、new/edit へ直アクセスは forbidden。
- editor/owner: new/edit フォームに到達・表示できるが保存ボタンは無効で mutation が発生しない。
- スマホ幅・PC幅の両方でレイアウトが崩れない。
- DB/Storage への書き込みが発生しないこと（ネットワーク・SQL とも）。
- git status --short が想定変更ファイルのみ。

## Stop条件
- 保存/公開/アップロードの実装が必要になったとき（Phase 3）。
- 既存認証/公開ページ/proxy.ts を変更する必要が出たとき。
- 新規 DB/Storage/重い依存が必要なとき。
- generated/translations/広告 に触れる必要が出たとき。
```

## 7. 実装後の検証項目（レビュー時にClaudeが確認）

- 変更が admin UI（/admin/foods, /[id], /new, /[id]/edit, components/admin/food-form 等）に限定。
- **DB/Storage への書き込みゼロ**（INSERT/UPDATE/UPSERT/upload なし、保存ボタン無効）。
- Phase 1 認証・`requireAdmin`・公開ページ・proxy.ts 不変。
- role 表示制御: viewer は追加/編集不可（forbidden）、editor/owner はフォーム到達可。
- 入力欄が §4 を網羅、必須/公開条件の注記あり。
- スマホ/PC 両対応・既存 Tailwind トークンで崩れなし。
- lint/typecheck/build/coverage 成功・Coverage 不変・generated/translations/広告 不変・git クリーン。
- FoodForm が Phase 3 の submit 配線に耐える構造（props で onSubmit/初期値を受け取れる）。

## 8. Phase 3 へ進むための次の条件

- Supabase 側: `foods` 書き込み（or drafts）・`food_revisions`・`audit_log` のスキーマ／RLS、Storage `food-images` バケット＋Policy を用意（マイグレーション SQL＋人手適用）。
- サーバーAPI/Server Action: 追加/編集/公開/状態切替/画像アップロードを **role 検証＋公開バリデーション＋audit_log＋revision 記録** 付きで実装。
- 公開バリデーション確定（画像必須・infoSourceUrl 必須・必須項目充足）。
- Phase 2 の `FoodForm` の onSubmit を上記 API に配線（editor 即公開・soft delete のみ）。
- 画像アップロードの形式/容量/寸法検証を実装。
- rollback 経路（revision からの前進復元）を用意。
- これらが揃い、Claude の設計レビュー承認後に Phase 3 着手。

---

## まとめ
Phase 2 は「**見やすい管理UI＋追加/編集フォームの“ガワ”＋role 表示制御**」までで、**DB書き込み・画像保存・公開反映は一切しない**。Phase 3 で `FoodForm` の submit を Supabase（書き込み＋検証＋audit＋rollback）に配線する前提の構造を作る。実装はしない。
