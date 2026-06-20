# 設計レビュー証跡: 食品データ重複3ペア修正 / duplicate override 適用

- **対象commit**: `2637697d7ca35a51a92544431ac71cf7e6af9131`
- **commit message**: `fix: apply duplicate overrides for food data`
- **対象設計書**: `docs/food-duplicate-repair-plan-v1.md` / `docs/codex-goal-food-duplicate-repair-v1.md`（方針A）
- **レビュー担当**: Claude（設計・レビュー）
- **レビュー日**: 2026-06-20
- **判定**: ✅ **承認**

---

## 変更内容（実diff）

`git show --stat 2637697` → **4 files changed, 254 insertions(+), 18 deletions(-)**

| ファイル | 変更 |
|---|---|
| `data/duplicate-overrides.json` | 新規。override **3件のみ**（canonicalId + duplicateId 1件ずつ） |
| `scripts/utils/quality-foods.ts` | dedup後に `applyDuplicateOverrides` を追加（既存 `assignDuplicateGroups` の後段に追加ステップとして挿入） |
| `scripts/debug/apply-duplicate-overrides.ts` | 新規。オフライン適用スクリプト（ガード付き） |
| `scripts/output/foods.generated.json` | 対象3ペア6 ID のみ更新 |

---

## 独立検証（before/after レコード単位 diff）

`git show 2637697~1:scripts/output/foods.generated.json` と現行を **food.id 単位で全件比較**（read-only）した結果:

```
counts before/after: 294 / 294
total changed records: 6
  food-1eqmspw  -> ["duplicateGroupId","duplicate_group_id"]
  food-nzx6eb   -> ["duplicateGroupId","duplicate_group_id"]
  food-1ocz8a8  -> ["duplicateGroupId","duplicate_group_id"]
  food-1xe3vuu  -> ["hidden","duplicateGroupId","duplicate_group_id","canonicalFood","canonical_food"]
  food-5ib5k3   -> ["hidden","canonicalFood","canonical_food","duplicateGroupId","duplicate_group_id"]
  food-1rsazo8  -> ["hidden","canonicalFood","canonical_food","duplicateGroupId","duplicate_group_id"]
changed fields union: ["duplicateGroupId","duplicate_group_id","hidden","canonicalFood","canonical_food"]
```

**変更されたレコードは対象6 ID のみ。変更フィールドは canonical/hidden/duplicateGroupId 系のみ。** 件数は294で不変。name/price/image/area/shop/id への変更はゼロ。

### 適用後の最終状態（実機確認）

| ペア | canonical（残） | duplicate（隠） | groupId |
|---|---|---|---|
| 1 | food-1eqmspw（canonical=true, hidden=false） | food-1xe3vuu（canonical=false, hidden=true） | override-food-1eqmspw |
| 2 | food-1ocz8a8（true / false） | food-1rsazo8（false / true） | override-food-1ocz8a8 |
| 3 | food-nzx6eb（true / false） | food-5ib5k3（false / true） | override-food-nzx6eb |

`override-` グループを持つ food は **ちょうど6件**。

---

## レビュー観点ごとの判定

| # | 観点 | 結果 | 根拠 |
|---|------|------|------|
| 1 | 変更ファイルが対象4ファイルのみか | ✅ | `git show --stat` で4ファイル、すべて対象 |
| 2 | duplicate-overrides.json が3件のみか | ✅ | 3エントリのみ。各 duplicateIds は1件 |
| 3 | 対象3ペアの canonical/hidden 指定が設計通りか | ✅ | 設計書の残/隠と完全一致（上表） |
| 4 | quality-foods.ts の override 後処理が既存dedupを壊していないか | ✅ | `applyDuplicateOverrides` は `assignDuplicateGroups` の**後段の追加ステップ**。override 0件なら即 return。一般 dedup 挙動は不変。指定 id のみ hidden/duplicateGroupId を上書き |
| 5 | override対象外のfoodに影響していないか | ✅ | before/after 全件比較で変更は6 IDのみ |
| 6 | apply-duplicate-overrides.ts がオフライン・対象限定・安全か | ✅ | network/DB/crawler 不使用。`targetIds.size!==6` で throw、`assertOnlyAllowedTargetChanges`（allowedFields以外の変更を検出）、`assertNoUnexpectedDatasetChanges`（変更6件＆オブジェクト同一性）で多重ガード |
| 7 | crawler / DB / network を使っていないか | ✅ | 両スクリプトとも `fs` の読み書きのみ。crawl/supabase/http 参照なし |
| 8 | foods.generated.json の差分が対象3ペア6 IDのみか | ✅ | 独立検証で6 IDのみ確認 |
| 9 | food.id / name / price / image / area / shop が変更されていないか | ✅ | 変更フィールド union に該当なし |
| 10 | canonicalFood / hidden / duplicateGroupId 以外の不要変更がないか | ✅ | 変更は当該5キーのみ |
| 11 | public_active_total が 183→180 になっているか | ✅ | audit実行で `public_active_total: 180`（`public_archive_total: 184→181`）。重複3件解消と整合 |
| 12 | duplicate name / suspicious 高優先候補から3ペアが解消されているか | ✅（注記） | **表示重複は解消**（canonical側のみ visible、public_active_total -3）。各 duplicate 側は audit上 `hidden=true / canonical=false` と表示され「hidden済みに変化」（設計書の許容条件に合致）。下記「補足1」参照 |
| 13 | data/translations が変更されていないか | ✅ | diff に該当なし |
| 14 | app / components / public が変更されていないか | ✅ | diff に該当なし |
| 15 | Food/Store Coverage が期待値から変化していないか | ✅ | `npm run coverage` 実行で全値一致（Food total 294/translated 77/missing 217/verified 6/needs_review 69/orphan 0、Store generated_total 42/translated 42/missing 0/display_total 99/display_translated 52/display_missing 47/verified 23/needs_review 33/orphan 0） |
| 16 | lint / typecheck / build / coverage / audit が成功しているか | ✅ | coverage・audit は当方で実行成功を確認。lint/typecheck/build は Codex報告（read-only追加のため整合）。`git status` クリーン |

---

## 確認に用いた検証コマンド（証跡）

- `git show --stat 2637697` / `git show 2637697 -- <各ファイル>` → diff 精査
- `git show 2637697~1:scripts/output/foods.generated.json` vs 現行を id 単位で全件比較 → 変更6 ID・許可フィールドのみ
- `node -e`（read-only）→ 6 ID の最終 canonical/hidden/groupId と override- 件数=6
- `npm run audit:duplicates` → public_active_total 180 を確認
- `npm run coverage` → Coverage 期待値一致
- `git status --short` → クリーン

---

## 補足（非ブロッキング）

判定（承認）には影響しない。

1. **audit の重複候補リスト件数は不変（57 names / 46 suspicious）**
   `scripts/audit-food-duplicates.ts` は hidden/canonical を考慮せず**全294件**で重複グルーピングするため、片側を hidden=true/canonical=false にしても3ペアは候補リストに残り続ける（ただし注記として `hidden=true / canonical=false` が表示される）。これは先に「修正不要」と判定した duplicate-ID 管理ペアと**同じ挙動**で、今回のデータ修正の欠陥ではない。実際の解消は `public_active_total 183→180` で証明されている。
   **推奨（任意・別スコープ）:** 将来 audit を拡張し、ペアの一方が hidden=true もしくは canonical=false の「管理済み重複」を candidate 件数から除外（または "resolved" として分離表示）すると、再監査時に解消が件数へ反映され誤検知が減る。

2. **groupId 命名 `override-<canonicalId>`**
   自動 dedup の `dup-NNNNN` とは別系統の prefix で、override 由来であることが追跡しやすく妥当。重複・衝突なし（6件すべてユニーク）。

3. **二重防御の妥当性**
   override は (a) `quality-foods.ts`（将来の再生成時に効く恒久ロジック）と (b) `apply-duplicate-overrides.ts`（今回のオフライン即時反映）の両方に実装されており、次回の正規再生成でも同じ結果に収束する設計。良い。

---

## 結論

実装は設計書（方針A）通りで、変更は対象6 ID・許可フィールド（canonical/hidden/duplicateGroupId）に厳密に限定。オフライン適用スクリプトは多重ガードを備え、crawler/DB/network 不使用。before/after 全件比較・audit・coverage を当方で実機検証し、表示重複の解消（public_active_total 183→180）と Coverage 不変を確認。対象外領域（translations/app/components/public/id/name/price/image）への副作用なし。

**判定: 承認**

次の `/goal` は本証跡の確認後に別途作成する（本タスクでは作成しない）。
