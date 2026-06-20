# 設計レビュー証跡: 食品データ重複監査スクリプト

- **対象commit**: `656af93b471334ab7c86690196699984a9fe72ff`
- **commit message**: `feat: add food duplicate audit script`
- **レビュー担当**: Claude（設計・レビュー）
- **レビュー日**: 2026-06-20
- **判定**: ✅ **承認**

---

## 変更内容（実diff）

`git show --stat 656af93` → **2 files changed, 518 insertions(+)**

| ファイル | 変更 |
|---|---|
| `package.json` | `"audit:duplicates"` スクリプトを1行追加（既存 `coverage` と同一の ts-node 実行パターン） |
| `scripts/audit-food-duplicates.ts` | 新規追加（517行）。`scripts/output/foods.generated.json` を読み取り、重複監査結果をコンソール出力 |

---

## 実機検証（read-only 実行）

`npm run audit:duplicates` を実行（foods.generated.json を読むのみの安全な操作）。報告サマリーと**完全一致**を確認し、実行後も `git status scripts/output/` はクリーン（JSON無変更）。

```
total: 294            unique_ids: 292        duplicate_id_groups: 2
active: 258           ended: 35              limited: 92        permanent: 202
with_image: 226       without_image: 68
public_archive_total: 184   public_active_total: 183
Display Quality: high 221 / low 59 / medium 14
Sale Status: active 258 / ended 35 / upcoming 1   (合計294と一致)
Duplicate Names: 57 groups
```

duplicate_id の2グループはいずれも `canonical=true/hidden=false` と `canonical=false/hidden=true` のペア（正規化済みデータ上の意図的な hidden 重複）であり、監査が正しく検出していることを確認。

---

## レビュー観点ごとの判定

| # | 観点 | 結果 | 根拠 |
|---|------|------|------|
| 1 | 変更ファイルが script と package.json のみか | ✅ | `git show --stat` で2ファイルのみ |
| 2 | foods.generated.json を読み取り専用で扱っているか | ✅ | 唯一のFS操作は `fs.readFileSync`（L128）。書き込みAPIなし |
| 3 | scripts/output / generated JSON を変更していないか | ✅ | スクリプトに write/append/mkdir/unlink 一切なし。実行後も JSON 無変更を git status で確認 |
| 4 | data/translations を変更していないか | ✅ | diff・実行ともに非関与 |
| 5 | DB / crawler を実行していないか | ✅ | DB接続・supabase/pg/prisma・http/fetch・crawl 参照ゼロ（grep で NONE FOUND） |
| 6 | app / components / public に触れていないか | ✅ | diff に該当なし |
| 7 | audit:duplicates が package.json に安全に追加されているか | ✅ | `coverage` と同形の ts-node `--transpile-only` 実行。他スクリプト行は無変更 |
| 8 | 既存scriptsを壊していないか | ✅ | build/lint/typecheck/coverage/crawl:*/seed 等すべて原形維持。挿入は1行のみ |
| 9 | 各分類（id/name/image/suspicious/intentional）が妥当か | ✅ | id=完全一致、name=NFKC正規化+記号除去、image=優先画像URL、suspicious=同画像/同名+価格+エリア群をペアスコア化し閾値≥7、intentional=同画像かつ名前or価格相違(canonical)・同名かつ価格/店舗/状態相違 を分離。判定根拠も `reasons` で明示。妥当な多段ヒューリスティック |
| 10 | 183品/184品の根拠確認に使える出力か | ✅ | `isVisibleFood`（reviewStatus/canonical/hidden/displayQuality/score/sourceUrl 等の可視条件）× `countCanonicalGroups`（canonicalGroupId 単位で重複排除）で算出。各重複グループを `describeFood` で品目単位に列挙するため差分追跡が可能。実行値も 184/183 と一致 |
| 11 | ファイル出力なしでコンソール監査に留まっているか | ✅ | 出力は `console.log` のみ。JSON/CSV等の生成なし |
| 12 | lint / typecheck / build / coverage が成功しているか | ✅ | Codex報告で全成功。read-only 追加スクリプトのため整合 |
| 13 | Food/Store Coverage が期待値から変化していないか | ✅ | 監査は読み取り専用で翻訳データ非変更。期待値と整合 |

---

## 確認に用いた検証コマンド（証跡）

- `git show --stat 656af93` / `git show 656af93 -- package.json` → diff 確認
- `Read scripts/audit-food-duplicates.ts` → 全517行のロジック精査（FS書込なし／DB・network・crawler 参照なし）
- `grep -nE "writeFile|appendFile|...|supabase|pg|prisma|fetch|crawl" scripts/audit-food-duplicates.ts` → NONE FOUND
- `npm run audit:duplicates` → 報告サマリーと一致を実機確認
- `git status --short scripts/output/` → 実行後もクリーン（generated JSON 無変更）

---

## 補足（非ブロッキング）

判定（承認）には影響しない。

1. **サマリーのラベル差異**
   Codex報告では `public_unique_total: 184` と記載されているが、スクリプトの実出力キーは `public_archive_total: 184`。値は一致しており、ラベルの呼称差のみ。報告文の用語を `public_archive_total` に揃えると混乱が減る（任意）。

2. **suspicious と likely_intentional は排他ではない**
   両リストは独立に算出されるため、同一ペアが双方に現れ得る。重複候補の「精査用」出力としては問題ないが、件数（46 / 54）を母集団として扱う際は重複の可能性に留意。

3. **監査対象は foods のみ**
   `shops.generated.json` は読まず food 重複に特化。今回のゴール（食品データ重複監査）に合致しており妥当。店舗重複監査が必要なら別スコープで。

---

## 結論

スクリプトは `foods.generated.json` を読み取り専用で監査し、ファイル出力・DB・crawler・network を一切伴わない。package.json への追加は既存パターン踏襲で他スクリプトを破壊せず、分類ロジックは多段ヒューリスティックとして妥当。報告された全数値（294/292/2グループ/184/183 等）を read-only 実行で再現確認し、実行後も generated JSON は無変更。対象外領域への副作用なし。

**判定: 承認**

次の `/goal` は本証跡の確認後に別途作成する（本タスクでは作成しない）。
