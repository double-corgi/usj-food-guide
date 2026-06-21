# Codex /goal: βフィードバック データ品質 最小修正（重複1ペアのみ）

> 前提: `docs/beta-feedback-data-quality-audit-v1.md`。
> 今回 Codex に投げてよいのは **高確度・安全な「スチュアート・バケツ アイス」表示重複の override 統合のみ**。
> 価格修正・画像差し替え・チュリトス可視化・generated JSON 直接編集・crawler/DB/translations は**含めない**（要検証のため別途）。
> ⚠️ override の generated JSON 反映（オフライン適用）は書き込みを伴うため、進行側の承認後に実行。

以下、Codex にそのまま貼れる本文（承認後に使用）。

```
/goal UNICOLE の表示重複「スチュアート・バケツ アイス」を override 層で1ペアだけ統合する。前回の duplicate-overrides 機構を踏襲し、対象2 IDのみ canonical/hidden を整える。価格・画像・カテゴリ・他商品は一切変更しない。

## 背景
βフィードバックで「スチュアート系の重複」が指摘された。監査の結果、以下が同一商品（同一店舗アミティ・アイスクリーム/同一¥950/同一画像アセットのcrop違い）で両方が canon=true/hidden=false の二重表示と確認。
- canonical（残す）: food-1ksr7hg「アイスクリーム スチュアート・バケツ スプーン付き」
- duplicate（隠す）: food-1qcrkg3「アイスクリーム スチュアート・バケツ スプーン」

## やること（最小・1ペアのみ）
1. `data/duplicate-overrides.json` に次の1エントリを**追記**（既存3エントリは変更しない）:
     { "canonicalId": "food-1ksr7hg", "duplicateIds": ["food-1qcrkg3"] }
2. 既存のオフライン適用スクリプト `scripts/debug/apply-duplicate-overrides.ts` を実行し、
   対象2 ID のみ canonicalFood / hidden / duplicateGroupId を更新（既存3ペア＋本ペア＝計8 IDのみが対象）。
   - ⚠️ generated JSON 書き込みを伴うため、実行前に進行側承認を確認。未承認なら overrides.json 追記までで停止し報告。

## やってはいけないこと（厳守）
- git add . 禁止。変更ファイルを限定する。
- 対象2 ID（food-1ksr7hg / food-1qcrkg3）以外の food を変更しない。
- 価格・画像URL・カテゴリ・name・area・shop を変更しない。
- チュリトス等の可視化（displayQuality/reviewStatus/canonical の promote）はしない。
- generated JSON の“直接手編集”はしない（override→apply 経路のみ）。
- data/translations・DB・crawler・大規模crawl・外部画像取得をしない。
- 監査で「要確認」とした項目（ボブ=フィル画像、スチュアートバーガー通常/ビッグ、ジュラシック バーガー、価格不一致、画像内価格）には手を付けない。

## 検証（実施し報告）
- npm run lint / typecheck / build / coverage 成功、Coverage 不変（Food total 294 ほか）。
- npm run audit:duplicates 実行。
- 適用後: food-1ksr7hg=canonical(visible) / food-1qcrkg3=hidden、両者が override-food-1ksr7hg グループ。
- foods.generated.json の差分が「既存3ペア＋本ペア」の対象ID・canonical/hidden/duplicateGroupId のみであること（他フィールド・他IDの差分ゼロ）。
- public_active_total が1減ること（スチュアート・バケツ重複の解消想定）。
- git status --short が想定変更ファイルのみ。

## 完了条件
- overrides.json に1エントリ追記、対象2IDのみ反映、lint/typecheck/build/coverage 成功・Coverage 不変、audit で当該重複が解消（hidden済み）。
- 変更ファイルを限定報告し、レビュー（Claude）へ。

## Stop条件（該当したら停止して報告）
- 対象2ID以外に差分が出そうなとき / Coverage が変化したとき。
- generated JSON 書き込みの承認が無いとき。
- 価格・画像・カテゴリ変更が必要だと判明したとき（本goalの対象外）。
- crawler/DB/translations が必要になったとき。
```

---

## 進行側メモ
1. 本 goal は**安全1ペアのみ**。残りの指摘（画像不一致#7、バーガー重複#5、ジュラシック#2、チュリトス可視化#1・#3、価格#6）は**検証タスク**として別途整理する（現行品/正画像/正価格の確認が前提）。
2. override の generated 反映には書き込み承認が必要（前回 `2637697` と同じ運用）。
3. 実装後、Claude が `design-review-beta-feedback-data-quality-fix-v1.md` でレビュー証跡を作成（本タスクではまだ作らない）。
