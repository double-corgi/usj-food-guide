# 設計レビュー証跡: ソルティキャラメルチュリトス 誤画像/休止の非表示（visibility-override 新設）

- **対象commit**: `bd610d0488c2021a36f2b65e31e6ba69ad79905d`
- **commit message**: `fix: hide paused salty caramel churro`
- **前提docs**: `docs/churros-source-backed-fix-plan-v2.md` / `docs/codex-goal-churros-source-backed-fix-v2.md`（進行側作成）/ 調査根拠 `docs/churros-official-source-audit-v1.md`
- **レビュー担当**: Claude（設計・レビュー）
- **レビュー日**: 2026-06-22
- **判定**: ✅ **承認**

---

## 0. 結論サマリー

ソルティキャラメルチュリトス（food-5n9awi）は、信頼ソースで**休止中**＋ユーザーが**画像不一致**を指摘していた唯一の「可視なのに状態/画像が怪しい」churro。本commitは**新設の visibility-override 機構**で当該1件のみを非表示化。**誤画像を出し続けない安全側**の最小修正として妥当。承認。

> 補足: 当方 v1 監査では「公式未確認のため自動 hide は保留」を推奨したが、本対応は **hide（＝出さない安全方向・可逆）** であり、終売断定でも削除でもない。ユーザー指摘（画像違い）＋第三者休止情報を踏まえ「疑わしい内容を一旦止める」判断は妥当。override に `reason`（暫定・正画像/販売状況確認まで）が記録されている点も良い。

---

## 変更内容（実diff）

`git show --stat bd610d0` → **3 files changed, 229 insertions(+), 5 deletions(-)**

| ファイル | 変更 |
|---|---|
| `data/food-visibility-overrides.json`（新規） | food-5n9awi の1エントリ（hidden=true / reviewStatus=pending / displayQuality=low ＋ reason） |
| `scripts/debug/apply-food-visibility-overrides.ts`（新規・215行） | visibility-override をオフライン適用する安全スクリプト |
| `scripts/output/foods.generated.json` | food-5n9awi の3可視フィールドのみ更新 |

generated 差分（food-5n9awi）:
- displayQuality `high→low`、reviewStatus `approved→pending`、hidden `false→true`（＋ snake 変種）。**価格・画像URL・name・category・shop・area は不変**。

---

## 独立検証（before/after レコード単位）

```
counts before/after: 294 / 294
changed records: 1
  food-5n9awi -> ["displayQuality","display_quality","reviewStatus","review_status","hidden"]
food-5n9awi: hidden=true review=pending dq=low | ¥700（不変） | img=salty-caramel-churro-product.jpg（不変） | ソルティキャラメルチュリトス
```

`public_active_total: 178 → 177`（可視・active だった1件を非表示＝-1、妥当）。`git status` クリーン。

---

## 新設 apply スクリプトの安全性（観点7・8）

`scripts/debug/apply-food-visibility-overrides.ts` は duplicate-overrides と同型の堅牢ガードを実装:
- **allowedOverrideFields** = {foodId, hidden, reviewStatus, displayQuality, reason}（未知キーは throw）。
- **allowedFoodFields** = {hidden, reviewStatus(+snake), displayQuality(+snake)}（それ以外のフィールド変更を検出して throw）。
- 型・値検証: hidden は boolean、reviewStatus/displayQuality は有効値セットに限定。
- targetIds≠0、food-not-found throw。
- `assertOnlyAllowedTargetChanges` ＋ `assertNoUnexpectedDatasetChanges`（全データセット before/after 差分・対象ID以外の変更ゼロを保証）。
- generated は **apply 経由でのみ**書き込み（直接手編集なし）。

→ 「可視状態だけを、対象 id だけ、安全に上書きする」専用機構として妥当。汎用的で再利用可能。

---

## レビュー観点ごとの判定

| # | 観点 | 結果 | 根拠 |
|---|------|------|------|
| 1 | food-5n9awi のみ対象か | ✅ | 変更レコード1件のみ |
| 2 | 表示対象から外れているか | ✅ | hidden=true / review=pending / dq=low → isVisibleFood 不成立 |
| 3 | 誤画像を出し続けない安全側の修正か | ✅ | 可視を止める（可逆・終売断定でない）。reason に暫定明記 |
| 4 | 価格・画像・カテゴリ・名・店舗・エリアを変更していないか | ✅ | 変更は可視3フィールドのみ |
| 5 | クロミ/サーティワン/マイメロを追加・復帰していないか | ✅ | 変更1件のみ。他は不変 |
| 6 | 新規food追加なしか | ✅ | 件数294不変 |
| 7 | generated が visibility-override apply 経由の差分か | ✅ | 差分が override 宣言＝許可フィールドのみ。script ガードで担保 |
| 8 | 直接手編集がないか | ✅ | apply 経由。全件差分ガードあり |
| 9 | translations/DB/crawler/package.json/AdMob/AdSense に触れていないか | ✅ | diff になし |
| 10 | lint/typecheck/build/coverage/audit が通っているか | ✅ | Codex報告＋当方で audit/coverage 整合確認 |
| 11 | App Store前・β公開前の安全な最小修正として妥当か | ✅ | 対象限定・安全機構・可逆・Coverage 不変 |
| 12 | 次にクロミ/サーティワン/マイメロを追加・復帰する条件 | ℹ️ | 下記 |

### 12. 次の追加・復帰に必要な条件
- **サーティワン・チュリトス（food-udijzl）**: 25周年コラボで **2026/5/10 終売** → **復帰しない**（終売）。
- **クロミ カシスショコラ（food-10fodl7）/ マイメロ いちごヨーグルト（food-1sem5gf）**: 復帰には全て必要 →
  1. **公式での現行販売確認**（クロミは現行濃厚、マイメロは要確認）。
  2. **検証済み公式画像の人手取得 → manual-images 保存**（現状 画像0枚）。本commitの visibility-override は**可視状態のみ**で**画像を付与しない** → 別途 **image-override 機構**（または manual-images＋安全 apply）が必要。
  3. **価格確認**（クロミ ¥700(ソース) vs ¥750(データ)）。
  4. 揃ってから visibility-override（hidden=false / reviewStatus=approved / displayQuality 引上げ）＋画像付与を **1件ずつ** → apply → レビュー。
- いずれも**根拠URL・確認日を明記**し、generated 直接編集なし・終売復活なし・画像なし表示なしを厳守。

---

## 確認に用いた検証コマンド（証跡）
- `git show --stat bd610d0` / `git show bd610d0 -- <files>` → diff
- `git show bd610d0~1:…` vs 現行を id 単位で全件比較 → 変更1 ID・可視3フィールドのみ
- `grep` で apply スクリプトのガード（allowed*Fields, assert*, 型検証, apply 経由書込）を確認
- audit/coverage 整合（public_active_total 177、Coverage 期待値）。`git status` クリーン

---

## 補足（非ブロッキング）

判定（承認）には影響しない。

1. **画像ファイルは残置（非表示で対処）**: 疑わしい画像 `salty-caramel-churro-product.jpg` は参照に残るが、food自体が hidden のため表示されない。復帰時は**正画像の確認・差し替えが前提**（reason にも明記）。
2. **休止情報は第三者ソース由来**: 公式での「休止/終了/再開」確認が取れたら、(再開＋正画像)→復帰、(終売)→hidden 維持、のいずれかに更新。override の `reason` が暫定であることを示しており良い。
3. **visibility-override は汎用機構**: 今後の可視状態変更も**必ず根拠付きで1件ずつレビュー**してから適用する運用を継続（無制限な hide/show を避ける）。
4. **画像差し替えは未対応領域**: 本機構は可視状態のみ。クロミ等の画像付与には image-override 設計が別途必要（Claude が着手時に作成）。

---

## 結論

新設の visibility-override 機構により、休止疑い＋画像不一致の food-5n9awi（ソルティキャラメルチュリトス）1件のみを安全に非表示化。変更は可視3フィールドに限定され、価格・画像・名称・カテゴリ・店舗・エリア・他商品は不変。新規food追加・終売品復活・画像なし表示はなし。apply スクリプトは全件差分ガード付きで generated 直接編集を回避。translations/DB/crawler/package.json/AdMob は不変、Coverage 不変、public_active_total 178→177、git クリーン。誤画像を出し続けない安全側の最小修正として妥当。

**判定: 承認**

次の `/goal` は本証跡の確認後に別途作成する（本タスクでは作成しない）。
