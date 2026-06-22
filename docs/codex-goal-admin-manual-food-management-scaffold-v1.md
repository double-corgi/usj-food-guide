# Codex /goal 案: 手動フード管理 最小足場（構成案A scaffold のみ）

> 前提: `docs/admin-manual-food-management-plan-v1.md`。
> 今回は **構成案A の“足場（スキーマ＋apply＋空テンプレ＋ドキュメント）”だけ**を作る。
> **管理画面・実データ追加・DB・外部ストレージ・広告・認証UI は作らない。** generated 直接編集・crawler・translations 変更は禁止。
> ⚠️ apply の generated 反映は書き込みを伴うが、**空テンプレ時は no-op**（差分ゼロ）。実データ反映は別 goal・承認後。

以下、Codex にそのまま貼れる本文。

```
/goal UNICOLE に「手動フード管理の最小足場」を追加する。既存の override+apply パターンを踏襲し、手動“追加/修正”のスキーマと guard 付き apply スクリプトと空テンプレを用意する。実データ追加・管理画面・DB・外部ストレージは作らない。

## やること（足場のみ）
1. 空テンプレJSONを新規作成（空配列＋スキーマコメント or 例を README に記載）:
   - data/manual-foods.json            = []   （action:add 用）
   - data/manual-food-overrides.json   = []   （action:update 用）
   - ※ data/food-visibility-overrides.json は既存（流用。重複定義しない）
2. apply スクリプトを新規作成（既存 apply-duplicate-overrides / apply-food-visibility-overrides と同型・guard 必須）:
   - scripts/debug/apply-manual-foods.ts          （add: 既存 foods.generated.json に新規food を append）
   - scripts/debug/apply-manual-food-overrides.ts （update: 対象 targetFoodId の許可フィールドのみ部分上書き）
   - 共通要件:
     * 許可フィールドのホワイトリストを強制（id/normalizedName 等の同一性キーは変更不可）
     * 全データセット before/after 差分検証（対象 id 以外は不変／配列順・件数の整合）
     * add は「新規ID が既存と衝突しない」ことを検証。ID生成は決定的・manual名前空間:
         food-manual-<stableHash(area:shopName:foodNameJa)>（冪等）
     * 入力 JSON が空配列なら no-op（generated 差分ゼロ）で正常終了
     * categoryTags は許可セットのみ（churros/popcorn/drink/burger/plate/dessert/snack/cart/seasonal/universal-market/nintendo/minion/jurassic/harry-potter/conan/sanrio）
     * saleStatus は active|paused|ended|unknown のみ、sourceType は official|trusted-site|manual-confirmed のみ、confidence は high|medium|low のみ
     * generated は apply 経由でのみ書き込み（直接手編集しない）
3. ドキュメント追記（docs 配下、コード外）: テンプレ項目・必須フィールド・反映フロー・画像規約（public/manual-images/<food.id>/main.jpg）。
4. 実データは追加しない（テンプレは空のまま）。画像も追加しない。

## やってはいけないこと（厳守）
- 管理画面（/admin フォーム・アップロード・認証UI）を作らない。
- 実フード（クロミ/マイメロ等）を追加・復帰しない（テンプレ空のまま）。
- generated JSON を直接手編集しない（apply 経由のみ。空テンプレ＝差分ゼロ）。
- DB / 外部ストレージ / 新規パッケージ（重い依存）を導入しない（必要なら Stop して報告）。
- crawler / data/translations / 広告(AdMob/AdSense) を触らない。
- 既存 override ファイル/apply（duplicate, visibility）を壊さない。
- food.id/URL構造/価格/画像/カテゴリの既存値を変更しない（空テンプレ適用＝無変更）。
- git add . 禁止。変更ファイルを限定する。

## 検証（実施し報告）
- npm run lint / typecheck / build / coverage 成功、Coverage 不変（Food total 294 ほか）。
- apply-manual-foods / apply-manual-food-overrides を空テンプレで実行 → foods.generated.json の差分が**ゼロ**であること。
- npm run audit:duplicates 成功。
- ユニットレベルで guard（許可外フィールド/ID衝突/許可外 enum）が throw することを確認（可能なら小さなドライラン）。
- git status --short が想定変更ファイル（新規2 JSON＋新規2 apply＋docs）のみ。

## 完了条件
- 空テンプレ＋guard付き apply＋ドキュメントが追加され、空適用で generated 無変更・全チェック成功。
- 変更ファイルを限定報告し、レビュー（Claude）へ。

## Stop条件（該当したら停止して報告）
- generated に差分が出る（＝空適用なのに変化）とき。
- 重い新規依存・DB・ストレージが必要になったとき。
- 既存 override/apply・他データに影響が出そうなとき。
- 認証や管理画面が必要だと判明したとき（本足場の対象外）。
```

---

## 進行側メモ
1. 本 goal は**足場のみ**（空テンプレ＋apply＋docs）。実データ追加は schema 確定後、根拠URL付きで別 goal。
2. **別途・優先**: 現状 `/admin` が **無認証**。公開前に middleware＋allowlist で保護する別 goal を推奨（本 scaffold とは分離）。
3. 画像差し替え/外部ストレージ/管理画面は Phase B 設計後。
4. 実装後、Claude が `design-review-admin-manual-food-management-scaffold-v1.md` でレビュー証跡を作成（本タスクではまだ作らない）。
