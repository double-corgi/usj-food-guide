# Codex /goal: 画像・価格系βフィードバック 最小修正（表示重複2ペアのみ）

> 前提: `docs/beta-feedback-image-price-audit-v1.md`。
> 今回 Codex に投げてよいのは **高確度の表示重複2ペアの duplicate-overrides 統合のみ**。
> 画像差し替え・価格修正・恐竜/ボブ/スチュアート系は**含めない**（確証不足・安全機構未整備のため要確認/保留）。
> ⚠️ override の generated 反映（オフライン適用）は書き込みを伴うため、進行側の承認後に実行。

以下、Codex にそのまま貼れる本文（承認後に使用）。

```
/goal UNICOLE の表示重複2ペアを override 層で統合する。前回(96bc26c)の duplicate-overrides 機構を踏襲し、対象4 IDのみ canonical/hidden を整える。価格・画像・カテゴリ・他商品は一切変更しない。

## 背景
βフィードバックの画像・価格監査で、以下2ペアが「同一商品の表記ゆれ重複」（同店舗・同価格・同一画像アセットのcrop違い）で両方可視と確認。既修正の照り焼きピッツァ(1ocz8a8/1rsazo8)と同型。
- ペアA（ツナマヨ ピッツァ・デニッシュ / ボードウォーク・スナック / ¥1600）
  - canonical（残す）: food-1kx2jev「ツナマヨ&サクラエビ ピッツァ・デニッシュセット」(nq=100)
  - duplicate（隠す）: food-xagefj「ピッツァ・デニッシュセット~ツナマヨ&サクラエビ~」(nq=90)
- ペアB（カレー キッズセット / キノピオ・カフェ / ¥1400）
  - canonical（残す）: food-1u4bz3q「カレー・キッズセット」(dq=high)
  - duplicate（隠す）: food-1gtoojv「カレーライス・キッズセット」(dq=medium)

## やること（最小・2ペアのみ）
1. `data/duplicate-overrides.json` に次の2エントリを**追記**（既存4エントリは変更しない）:
     { "canonicalId": "food-1kx2jev", "duplicateIds": ["food-xagefj"] }
     { "canonicalId": "food-1u4bz3q", "duplicateIds": ["food-1gtoojv"] }
2. 既存のオフライン適用スクリプト `scripts/debug/apply-duplicate-overrides.ts` を実行し、
   対象4 ID のみ canonicalFood / hidden / duplicateGroupId を更新（全件差分ガードに従う）。
   - ⚠️ generated JSON 書き込みを伴うため、実行前に進行側承認を確認。未承認なら overrides.json 追記までで停止し報告。

## やってはいけないこと（厳守）
- git add . 禁止。変更ファイルを限定する。
- 対象4 ID（food-1kx2jev / food-xagefj / food-1u4bz3q / food-1gtoojv）以外の food を変更しない。
- 価格・画像URL・カテゴリ・name・area・shop を変更しない。
- 画像差し替え（ボブ=フィル、恐竜バリエ、スチュアート）をしない。
- 恐竜バーガー/呪術チュリトス等「別商品が同一画像を共有」しているものを重複統合しない（実在商品を誤って隠さない）。
- スチュアート・バーガー(1435vjy/bcbp5u)や価格逆転疑い・価格欠落の価格を変更しない（確証不足→保留）。
- generated JSON の直接手編集をしない（override→apply のみ）。
- data/translations・DB・crawler・大規模crawl・外部画像取得をしない。
- 広告/AdMob/AdSense を触らない。

## 検証（実施し報告）
- npm run lint / typecheck / build / coverage 成功、Coverage 不変（Food total 294 ほか）。
- npm run audit:duplicates 実行。
- 適用後: 1kx2jev/1u4bz3q=canonical(visible)、xagefj/1gtoojv=hidden、それぞれ override-food-1kx2jev / override-food-1u4bz3q グループ。
- foods.generated.json の差分が「既存6 ID（前回まで）＋本4 ID」の canonical/hidden/duplicateGroupId 系のみで、他フィールド・他IDの差分ゼロ。
- public_active_total が2減ること（重複2件解消想定: 179→177）。
- git status --short が想定変更ファイルのみ。

## 完了条件
- overrides.json に2エントリ追記、対象4IDのみ反映、lint/typecheck/build/coverage 成功・Coverage 不変、audit で当該2重複が解消（hidden済み）。
- 変更ファイルを限定報告し、レビュー（Claude）へ。

## Stop条件（該当したら停止して報告）
- 対象4ID以外に差分が出そうなとき / Coverage が変化したとき。
- generated JSON 書き込みの承認が無いとき。
- 価格・画像・カテゴリ変更が必要だと判明したとき（本goalの対象外）。
- 別商品の画像共有を重複と誤認しそうなとき。
- crawler/DB/translations が必要になったとき。
```

---

## 進行側メモ
1. 本 goal は**安全2ペアのみ**。残り（ボブ=フィル画像不一致、スチュアート・バーガー、恐竜バリエ画像、価格不一致/欠落、画像内価格）は**要確認/保留**で別途。
2. 画像差し替えは「manual-images＋安全な apply（image-override）」の機構設計が前提。確証画像が揃ってから別 goal で。
3. override の generated 反映には書き込み承認が必要（前回 96bc26c と同運用）。
4. 実装後、Claude が `design-review-beta-feedback-image-price-fix-v1.md` でレビュー証跡を作成（本タスクではまだ作らない）。
