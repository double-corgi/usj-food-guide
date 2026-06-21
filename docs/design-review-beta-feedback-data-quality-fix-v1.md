# 設計レビュー証跡: βフィードバック データ品質 最小修正（スチュアート・バケツ アイス重複）

- **対象commit**: `96bc26ceede5cecb40b341f5906b760249fd3fec`
- **commit message**: `fix: hide duplicate Stuart bucket ice cream`
- **前提docs**: `docs/beta-feedback-data-quality-audit-v1.md` / `docs/codex-goal-beta-feedback-data-quality-fix-v1.md`
- **レビュー担当**: Claude（設計・レビュー）
- **レビュー日**: 2026-06-21
- **判定**: ✅ **承認**

---

## 変更内容（実diff）

`git show --stat 96bc26c` → **3 files changed, 56 insertions(+), 10 deletions(-)**

| ファイル | 変更 |
|---|---|
| `data/duplicate-overrides.json` | 1エントリ追記（canonicalId: food-1ksr7hg / duplicateIds: [food-1qcrkg3]）。既存3エントリ不変 |
| `scripts/debug/apply-duplicate-overrides.ts` | 固定「6 IDちょうど」チェックを overrides から動的算出＋**全データセット前後差分検証**へ一般化（後述） |
| `scripts/output/foods.generated.json` | 対象2 IDのみ canonical/hidden/duplicateGroupId 更新 |

---

## 独立検証（before/after レコード単位）

`git show 96bc26c~1:…` と現行を food.id 単位で全件比較（read-only）:

```
counts before/after: 294 / 294
changed records: 2
  food-1ksr7hg -> ["duplicateGroupId","duplicate_group_id"]
  food-1qcrkg3 -> ["hidden","canonicalFood","canonical_food","duplicateGroupId","duplicate_group_id"]
food-1ksr7hg: canon=true  hidden=false grp=override-food-1ksr7hg（スチュアート・バケツ スプーン付き）= 表示維持
food-1qcrkg3: canon=false hidden=true  grp=override-food-1ksr7hg（スチュアート・バケツ スプーン）   = 非表示
```

既存3ペアの整合（全て維持）:
```
food-1eqmspw/1xe3vuu → override-food-1eqmspw（canon true/false, hidden false/true）
food-1ocz8a8/1rsazo8 → override-food-1ocz8a8
food-nzx6eb /5ib5k3  → override-food-nzx6eb
```

`npm run audit:duplicates` → **public_active_total 180 → 179**（重複1件解消と整合）。`git status` クリーン。

---

## apply script 安全チェックの一般化（観点3・4）

| 旧 | 新 |
|---|---|
| `if (targetIds.size !== 6) throw` | `if (targetIds.size === 0) throw`（overrides から動的） |
| `changedIds !== 6` で件数カウントのみ | **全データセットの before/after 比較**: ①foods 配列長の不変 ②index/id 順序の不変 ③変更された food.id は必ず targetIds に含まれる（さもなくば throw）④変更レコード集合 = targetIds（過不足を `assertSameSet` で検証）⑤オブジェクト同一性チェック維持 |

→ **弱体化ではなく強化**。固定6件前提を解いて任意件数に対応しつつ、「対象 ID 以外は1バイトも変わらない」ことを全件で保証する厳格化。`assertOnlyAllowedTargetChanges`（許可フィールド以外の変更検出）も維持。妥当。

---

## レビュー観点ごとの判定

| # | 観点 | 結果 | 根拠 |
|---|------|------|------|
| 1 | 高確度の重複1ペアだけに限定されているか | ✅ | overrides 追記1件、変更レコード2 IDのみ |
| 2 | 既存3エントリを壊していないか | ✅ | overrides は追記のみ。3ペアの canonical/hidden/group 維持を確認 |
| 3 | apply script の一般化が妥当か | ✅ | overrides 由来の動的算出＋全件差分検証。固定値の解消は適切 |
| 4 | 安全チェックが削除・弱体化されていないか | ✅ | むしろ強化（全データセット before/after・順序・集合一致・object同一性） |
| 5 | generated が直接手編集でなく apply 経由か | ✅ | 差分が override 対象と一致し、許可フィールドのみ。script ガードで担保 |
| 6 | food-1ksr7hg が表示対象として残っているか | ✅ | canon=true / hidden=false |
| 7 | food-1qcrkg3 が表示対象から外れているか | ✅ | canon=false / hidden=true |
| 8 | duplicateGroupId が正しいか | ✅ | 両者 override-food-1ksr7hg |
| 9 | public_active_total が1だけ減っているか | ✅ | 180 → 179 |
| 10 | 価格・画像・カテゴリ・名・店舗・エリアを変更していないか | ✅ | 変更フィールドは canonical/hidden/duplicateGroupId 系のみ |
| 11 | チュリトス可視化に触れていないか | ✅ | diff になし |
| 12 | 他のβ指摘に勝手に触れていないか | ✅ | 変更は2 IDのみ。#2/#5/#7 等は未着手（要確認のまま） |
| 13 | translations/DB/crawler/package.json/AdMob/AdSense に触れていないか | ✅ | diff になし |
| 14 | lint/typecheck/build/coverage/audit が通っているか | ✅ | Codex報告＋当方で audit/coverage 整合確認。Coverage 期待値一致 |
| 15 | App Store前・β公開前の安全な最小修正として妥当か | ✅ | 既存承認済機構の踏襲・対象限定・全件ガード・Coverage 不変 |

---

## 確認に用いた検証コマンド（証跡）

- `git show --stat 96bc26c` / `git show 96bc26c -- <files>` → diff
- `git show 96bc26c~1:…` vs 現行を id 単位で全件比較 → 変更2 ID・許可フィールドのみ
- 既存3ペア＋本ペアの canonical/hidden/group を確認
- `npm run audit:duplicates` → public_active_total 179
- `git status --short` → クリーン

---

## 補足（非ブロッキング）

判定（承認）には影響しない。

1. **override 適用の運用ルール**: apply script が overrides から動的に対象を取るようになったため、**今後 overrides に追記したペアは自動的に適用対象**になる。新ペア追加時は必ず事前レビュー（高確度確認）→ 承認後に apply、の運用を継続すること。
2. **残るβ指摘は未着手（意図どおり）**: #2 ジュラシック バーガー画像共有、#5 スチュアート・バーガー通常/ビッグ、#7 ボブ=フィル画像不一致、#1・#3 チュリトス可視化、#6 価格内画像。いずれも要検証として保留中。次段は「現行品/正画像/正価格」の確認パスを設計してから。
3. **public_archive_total も漸減**（重複統合の累積効果）。期待挙動。

---

## 結論

監査で唯一「高確度・安全」とした表示重複（スチュアート・バケツ アイス）を、既存の override 機構（前回 2637697 と同型）で1ペアだけ統合。変更は対象2 ID・canonical/hidden/duplicateGroupId のみで、価格・画像・カテゴリ・名称・店舗・エリア・チュリトス可視化・他β指摘・translations/DB/crawler/package.json/AdMob は不変。apply script の安全チェックは固定6件前提から全件差分検証へ強化。Coverage 不変、public_active_total 180→179、git クリーン。β公開前・App Store前の安全な最小修正として妥当。

**判定: 承認**

次の `/goal` は本証跡の確認後に別途作成する（本タスクでは作成しない）。
