# UNICOLE 設計 v1: ①ホーム「今集められるフード」順序 ②商品追加UI ③セキュリティ監査

**作成日:** 2026-06-23
**担当:** Claude（設計・レビュー担当 / 実装はしない）
**制約遵守:** 実装・コード変更・git・Supabase・Vercel・generated・crawler・translations・広告・proxy.ts いずれも変更なし。実コード読取のみ。

---

## 1. ホーム「今集められるフード」表示順 改善設計

### 該当コンポーネント（実コード）
- 文言キー `home.collectibleFoods`＝「今集められるフード」。
- レンダリング: `components/home-progress-client.tsx` の **`HomeActiveFoodCollection`** → 並びは **`pickActiveCollectionFoods(foods, logs, excludedShelfKeys)`**。
- 現状ロジック: 「完食可能 ∧ 画像あり ∧ 価格既知 ∧ 未食」を canonical 重複排除し、**`activeFoodScore`（日替わりシード）降順**で上位8件。
- データ源: `listFoods()`＝generated＋manual_foods マージ。manual_foods は `lib/repositories/manual-foods.ts` で `lastCheckedAt = row.updated_at`、`sourceNames=["manual_foods"]`、`manualOverride=true` を持つ。**`createdAt` は現状マッピングされていない**（要追加）。

### 設計方針（リスク低・/foods は不変）
1. **manual_foods に `createdAt` を載せる**: `manual-foods.ts` のマッピングで `createdAt = row.created_at` を追加（読取のみ・小変更）。クエリは既に `order("updated_at" desc)`。
2. **`pickActiveCollectionFoods` を最小拡張**:
   - 既存の**適格条件（完食可能/画像/価格/未食）と canonical 重複排除は維持**。
   - 適格な **manual_foods（`sourceNames` に "manual_foods"）を `createdAt` 降順で先頭に prepend** → その後に従来スコア順で残り枠を埋め、重複排除して上位8件。
   - これで「自分で追加した商品が新しい順で上」、それ以外は従来通り。
3. **food_overrides の updated_at を新着扱いにしない**（推奨）: override は既存商品の修正であり新規ではない。新着＝manual_foods の新規作成に限定（churn/誤認回避）。
4. **文言（任意）**: 新規追加直後の体感を高めるなら、`createdAt` が直近N日以内の manual 商品に「新着」バッジ、またはセクション補助文言「新しく追加されたフードを優先表示」を検討（translations 変更が要るため別 goal・今回はやらない）。
5. **/foods 全体の並びは変更しない**（対象はホームのこのレールのみ）。

### リスク評価
- 適格条件を維持するため、**画像/価格の無い未完成 manual は出ない**（「今集められる」の意味を保持）。
- 既存 generated の表示・順序は prepend 後の残枠で従来スコア順＝実質維持。
- 食べた記録・URL・/foods 不変。低リスク。

---

## 2. 商品追加ページ デザイン/UI 改善設計

> 前回の `admin-foods-new-uiux-review-v1.md`（必須/任意・ステップ化・状態整理）を踏まえ、今回は「**おしゃれ・楽しさ・開発者文言の除去・追加後導線**」を上乗せ。**送信 name/value・保存・画像・店舗検索・認証は不変。**

### 今のページの問題点（実コード根拠）
- 見た目が業務画面的: 全体が白/slate のフォーム羅列で、図鑑アプリらしい楽しさ・清潔感の演出が弱い。
- **開発者向け文言が残る**: 「generated商品の編集保存はまだ行いません」「Phase 3での保存時注意点」（管理メモ placeholder）「generated商品は保存不可」等 → 家族には不要・不安。
- 入力順に任意が割り込む（英語名）、状態セレクト3連が紛らわしい、必須/任意が不明、追加後の導線が弱い。

### 見た目・レイアウト改善案
- **白ベース＋クリーム/USJブルー差し色**（既存 cream/park/mint）で清潔感＋楽しさ。各ステップをカード化し、アイコン（食・店・画像・公開）で直感化。
- **ステップ番号**: ①基本情報(必須) ②店舗 ③カテゴリ ④画像 ⑤公開設定 ⑥保存。プログレス感を出す。
- 必須/任意バッジ、**公開チェックリスト**（画像・情報出典・必須項目）を保存近くに常設。
- 画像セクションは大きめプレビュー＋「保存時に自動できれいに整えます」等のやさしい説明。

### スマホ UI
- 1カラム・大タップ領域・セクション折りたたみ（任意項目は「詳細（任意）」に集約）。状態は「今すぐ公開」トグル＋販売状態に簡素化（送信 value は維持）。

### PC UI
- 2カラム維持＋左にプレビュー/チェックリスト固定、入力は右。視線移動を減らす。

### 開発者向け文言を消す場所 → 家族向け文言へ
- 「generated商品〜保存しません/保存不可」→ 家族画面では「自動収集の商品です。価格や画像だけ直せます」等のやさしい説明（編集可否はUIで自然に表現）。
- 管理メモ placeholder「Phase 3での保存時注意点」→「家族用メモ（公開されません）」。
- 「商品追加フォーム」→「フードを追加」、「保存する」→「保存して公開」/「下書き保存」。

### 商品追加後の導線
- 保存後リダイレクト先（現状 `/admin/foods/[id]?saved=created`）で **「公開ページで見る」「続けて追加」「一覧へ」** を明示。ホーム「今集められる」に新着で出ることも案内（§1と連動）。

### 制約（厳守）
- FormData の name/value、`createAdminFood`/`updateAdminFood`/`applyGeneratedFoodOverride`/visibility、画像保存（uploadFoodImage）、店舗検索UI、requireAdmin、Supabase SQL は**変更しない**。UI/文言/レイアウトのみ。

---

## 3. ハッキング/荒らし対策 現状評価

### 今できている可能性が高い対策（実コード確認済）
- **admin server action はすべて `requireAdmin("editor")`**（createAdminFood/updateAdminFood/applyGeneratedFoodOverride/visibility/override 系: 行53,111,158,204,241,297）→ **UIだけでなく保存処理側で権限チェック**。viewer は editor 未満で**書込不可**。
- **書込は `createServiceSupabaseClient()`（service role・サーバー専用）経由**。`SUPABASE_SERVICE_ROLE_KEY` は非 `NEXT_PUBLIC_`。サーバー action 内のみ import。
- **画像アップロード検証**: MIME ホワイトリスト（jpeg/png/webp）、最大入力バイト、size>0、WebP最適化、固定パス（manual/<id>/main.webp・overrides/<id>/main.webp）。→ **形式・サイズ制限あり**。
- /admin 系は proxy.ts ＋ requireAdmin で保護（Phase 1/B）。manual は soft（hidden/元に戻す）で hard delete なし。

### まだ弱い/未確認の可能性（要確認）
- **RLS の確定**: anon/authenticated（クライアントの anon キー）から `manual_foods`/`food_overrides`/`admin_users`/Storage へ**直接 write できないか**＝RLS が enabled＋write 拒否ポリシーか、を migration/Supabase で要確認（書込は service 経由のはずだが、anon キーはクライアント露出のため RLS が最後の砦）。
- **requireAdmin の中身**: 認証済みだけでなく **admin_users メンバーシップ＋role** を見ているか（Magic Link を自分のメールで取得しても admin_users 未登録なら拒否されるか）を確認。
- **レート制限なし**: 画像アップロード/保存の連打抑止が無い → 軽い rate limit 推奨（admin限定なので影響は限定的）。
- **admin_notes 非公開**: 公開取得（sanitizePublicFood/manual 公開マッピング）で memo/admin_notes を返していないか要確認。
- **destructive 操作の確認ダイアログ**: 非表示/元に戻す/override リセットに確認UIがあるか（誤操作防止）。
- **監査ログ/revision**: 操作ログ・変更履歴が記録されているか（荒らし/誤操作の追跡・復旧用）。未実装なら追加検討。
- **XSS**: ユーザー入力を `dangerouslySetInnerHTML` 等で出していないか（React 既定エスケープ前提だが要確認）。
- **バックアップ/復旧**: Supabase 自動バックアップ/PITR の有効化＋アプリ側 soft delete/revert で二重化。

### すぐやるべき / 後回し
- すぐ: RLS 確認（最重要）、requireAdmin の admin_users 照合確認、admin_notes 非公開確認、destructive 確認ダイアログ。
- 後回し: レート制限、監査ログ/revision の本格化、XSS 全面棚卸し、PITR 設定。

---

## 4. 優先順位
1. **セキュリティ確認（read-only 監査）** ＝家族に広げる前の前提（最重要・ゼロリスク）。
2. **ホーム「今集められる」新着優先**（小さく満足度高い・低リスク）。
3. **商品追加UIのおしゃれ化**（送信契約維持のUIのみ）。
4. セキュリティ最小修正（監査で出た弱点のみ）。

## 5. Phase 分け
- **S0**: セキュリティ**確認のみ**（実装なし・報告のみ）。
- **H1**: manual `createdAt` 追加＋ホームレール prepend（新着優先）。
- **U1**: 追加/編集ページの UI・文言・導線改善（送信契約維持）。
- **S1**: 監査で判明した弱点の**最小修正**（RLS/確認ダイアログ/rate limit 等、必要分のみ）。

## 6. 最初に Codex へ投げるべき /goal（S0・確認のみ・コピペ用）
→ 本書末尾。**実装なし・報告のみ**の安全監査。家族公開前の前提を確認する。

## 7. その次に投げるべき /goal（H1・ホーム新着優先）
```
/goal UNICOLE のホーム「今集められるフード」で、管理画面から手動追加した商品(manual_foods)を created_at の新しい順で先頭に優先表示する。/foods 全体の並び・既存の適格条件は変えない。保存処理・食べた記録・公開ページは壊さない。
- lib/repositories/manual-foods.ts のマッピングに createdAt = row.created_at を追加（読取のみ）。
- components/home-progress-client.tsx の pickActiveCollectionFoods を最小拡張: 既存の適格条件(完食可能/画像/価格/未食)と canonical 重複排除は維持したまま、sourceNames に "manual_foods" を含む適格商品を createdAt 降順で先頭 prepend → 残り枠を従来スコア順で埋め、重複排除して上位8件。
- food_overrides の updated_at は新着扱いにしない。/foods・/eaten・generated・translations・広告・認証・Supabase SQL は変更しない。
- 検証: 手動追加直後にホーム「今集められる」先頭付近に出る／generated の表示が従来どおり／lint/typecheck/build/coverage 成功・Coverage 不変。
```

## 8. 家族に渡す前の安全チェックリスト
- [ ] 一般ユーザーが /admin・/api/admin に入れない（未ログイン→login、allowlist外→拒否）。
- [ ] viewer は追加/編集/削除/非表示ができない（server action で 403）。
- [ ] anon キーで manual_foods/food_overrides/admin_users/Storage に直接書けない（RLS）。
- [ ] service role key・秘密が NEXT_PUBLIC_ に無く、クライアントに出ていない。
- [ ] admin_notes（家族メモ）が公開ページに出ない。
- [ ] 画像は形式(jpeg/png/webp)・サイズ制限あり、変なファイルを弾く。
- [ ] 非表示/元に戻す/リセットは誤操作時に戻せる（soft・確認あり）。
- [ ] 万一荒らされても Supabase バックアップ＋revert で復旧できる。
- [ ] owner=全権/復元、editor=追加編集非表示、viewer=閲覧、の役割が実際に効く。

---

## 最初に Codex へ投げる /goal（コピペ用・S0 セキュリティ確認のみ・実装なし）

```
/goal UNICOLE 管理画面の安全性を「確認のみ」で監査し、結果を報告する。コードは変更しない（実装・修正・git・Supabase・Vercel変更なし）。家族に管理権限を広げる前の前提確認が目的。

## 調べて報告すること（read-only）
1. /admin と /api/admin が requireAdmin / proxy.ts で保護され、未ログインや allowlist 外を拒否するか。
2. すべての admin server action（createAdminFood / updateAdminFood / applyGeneratedFoodOverride / 非表示・元に戻す等）が server 側で requireAdmin（role 判定）しているか。viewer が書き込めないか。
3. requireAdmin が「認証済み」だけでなく admin_users のメンバーシップ＋role を照合しているか（Magic Link を自分のメールで取得しても未登録なら拒否されるか）。
4. service role key が NEXT_PUBLIC_ に入っていないか、クライアントバンドル/クライアントコンポーネントに出ていないか（createServiceSupabaseClient の参照箇所を列挙）。
5. manual_foods / food_overrides / admin_users / Storage(food-images) の RLS が有効で、anon / authenticated から直接 INSERT/UPDATE/DELETE/upload できないポリシーになっているか（migration とポリシーを確認し列挙）。
6. 画像アップロードの形式(jpeg/png/webp)・サイズ上限・パス固定が効いているか。レート制限の有無。
7. admin_notes / 家族メモが公開取得（公開ページ・公開API・sanitizePublicFood・manual 公開マッピング）に含まれていないか。
8. dangerouslySetInnerHTML 等でユーザー入力をエスケープせず描画している箇所が無いか（XSS 観点）。
9. 非表示/元に戻す/override リセット等 destructive 操作に確認UIがあるか。
10. 監査ログ/変更履歴(revision)の有無、Supabase バックアップ/PITR の状況（分かる範囲）。

## 出力
- 上記1〜10について「OK / 要確認 / 要修正」を根拠（ファイル・行・ポリシー名）付きで一覧化。
- 「すぐ直すべき」「後回しでよい」を分けて提示。
- 修正案は提案のみ（このgoalでは実装しない）。

## やってはいけないこと
- コード変更・git・Supabase・Vercel・generated・crawler・translations・広告・proxy.ts・認証 の変更を一切しない（確認と報告のみ）。
- service role key 等の秘密値を出力に貼らない（存在/参照箇所のみ報告）。
```
