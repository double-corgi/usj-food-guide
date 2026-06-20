# Codex /goal: 食品データ重複 修正（3ペア / 方針A 恒久対応）

> **⚠️ 実行前提（必読）**
> 本 /goal は `docs/food-duplicate-repair-plan-v1.md` の **方針A（重複オーバーライド層の新設）** を採用する場合のもの。
> この作業は最終的に generated JSON への書き込み（オフライン適用）を伴うため、**進行側が方針Aを承認するまで実行しないこと。**
> 未承認のまま着手する場合は、generated JSON 書き込みの直前で必ず **Stop して報告**すること。

以下、Codex にそのまま貼れる本文。

---

```
/goal UNICOLE の食品データ重複（実質重複3ペア）を、重複オーバーライド層の新設によって恒久的に統合する。

## 背景
audit:duplicates の調査で、以下3ペアが「同一商品の表記ゆれ（語順・送り仮名・チルダ表記の違い）」による実質重複と判定された。いずれも価格・店舗・エリア・画像が完全一致だが、dedup ヒューリスティック（scripts/utils/quality-foods.ts の duplicateBucketKey / assignDuplicateGroups）の取りこぼしで両レコードとも canonical=true / hidden=false となり、表示が重複している。

対象3ペア（残す canonical / 隠す hidden の指定）:
1. canonical: food-1eqmspw  /  hidden: food-1xe3vuu   （kids: ハンバーガー・キッズセット）
2. canonical: food-1ocz8a8  /  hidden: food-1rsazo8   （pizza: 照り焼きチキン ピッツァ・デニッシュセット）
3. canonical: food-nzx6eb   /  hidden: food-5ib5k3    （dessert: マリオの帽子 パンケーキサンド）

## やること（最小・限定）
1. 新規データファイル `data/duplicate-overrides.json` を作成する。
   - スキーマ例:
     [
       { "canonicalId": "food-1eqmspw", "duplicateIds": ["food-1xe3vuu"] },
       { "canonicalId": "food-1ocz8a8", "duplicateIds": ["food-1rsazo8"] },
       { "canonicalId": "food-nzx6eb",  "duplicateIds": ["food-5ib5k3"] }
     ]
   - 上記3エントリ「以外」を入れない。

2. `scripts/utils/quality-foods.ts` の重複統合処理（assignDuplicateGroups）に、
   `data/duplicate-overrides.json` を読み込んで「指定ペアを強制的に同一グループへ統合する」後処理を追加する。
   - canonicalId のレコードを代表（canonicalFood=true, hidden=false）として残す。
   - duplicateIds のレコードを hidden=true / canonicalFood=false にし、canonicalId と同じ duplicateGroupId を付与する。
   - 既存の自動 dedup ロジックの一般挙動は変更しない（override は追加の上書きステップとして実装）。
   - override に存在しない food には一切影響を与えない。

3. オフライン適用ステップ（crawl を一切伴わない）を用意する。
   - 既存 `scripts/output/foods.generated.json` を読み込み、`data/duplicate-overrides.json` の指定 id についてのみ
     hidden / canonicalFood / duplicateGroupId を上書きして書き戻す専用スクリプト（例: scripts/debug/apply-duplicate-overrides.ts）。
   - ネットワーク / crawler / DB アクセスは禁止。対象3ペアの id 以外のレコードは1バイトも変更しないこと。
   - ⚠️ このステップは generated JSON への書き込みを伴う。実行前に必ず Stop して進行側の最終承認を取得すること。
     承認が得られない場合は、ステップ1・2（オーバーライド層の実装）までで停止し、generated JSON は変更せずに報告する。

## やってはいけないこと（厳守）
- git add . 禁止。変更ファイルを必ず個別に限定して add すること。
- generated JSON の直接編集禁止。設計上どうしても必要な場合（=上記オフライン適用）は、書き込み直前で Stop して報告し、承認を得てからのみ実行する。
- data/translations の変更禁止。
- DB / crawler の実行禁止（npm run crawl:* / crawl-quality / seed を実行しない）。
- crawl-quality.ts による再生成は禁止（coverage crawl を呼ぶため、かつ post-crawl の apply-* 調整を失い Coverage が変化するため）。
- app / components の変更禁止。
- public 画像の変更・追加・差し替え禁止（本件は画像問題ではない。画像は3ペアとも一致済み）。
- 対象3ペア（food-1eqmspw/food-1xe3vuu, food-1ocz8a8/food-1rsazo8, food-nzx6eb/food-5ib5k3）以外を変更しない。
- food.id / store.id / URL構造を変更しない。

## 検証（すべて実施し結果を報告）
- npm run lint
- npm run typecheck
- npm run build
- npm run coverage   ← Food/Store Coverage が下記期待値から変化していないことを確認:
    Food: total 294 / translated 77 / missing 217 / verified 6 / needs_review 69 / orphan 0
    Store: generated_total 42 / translated 42 / missing 0 / display_total 99 / display_translated 52 /
           display_missing 47 / display_seed 14 / verified 23 / needs_review 33 / orphan 0
- npm run audit:duplicates   ← 適用後、対象3ペアの判定が改善したことを確認:
    - 3ペアそれぞれで一方が hidden=true / canonical=false になっている
    - duplicate name / suspicious duplicate 候補から当該3ペアが解消（または「likely intentional / hidden 済み」に変化）している
    - public_active_total が 183 → 180 に減少していること（重複3件解消の想定値）
- git status --short が、想定した変更ファイルのみであることを確認。

## 完了条件
- data/duplicate-overrides.json（3エントリのみ）を追加。
- scripts/utils/quality-foods.ts に override 統合ステップを追加（一般挙動は不変）。
- （承認後のみ）オフライン適用スクリプトで対象3 id のみを更新し、foods.generated.json に反映。
- lint / typecheck / build / coverage / audit:duplicates すべて成功、Coverage 不変、audit で3ペア解消を確認。
- 変更ファイルを限定報告し、レビュー（Claude）へ回す。

## Stop条件（該当したら即停止して報告）
- 対象3ペア以外の差分が発生しそうなとき。
- Coverage（上記期待値）が変化したとき。
- generated JSON 書き込みの承認が無い／不明なとき。
- crawler / DB / 再生成が必要だと判明したとき。
- override 適用で他 food の hidden/canonical が連鎖的に変わるとき。
```

---

## 進行側へのメモ（Codex に渡す前に決めること）

1. **方針A を承認するか**（= `data/duplicate-overrides.json` 層の新設＋オフライン適用による generated JSON 限定書き込みを許可するか）。
   - 承認するなら、上記 /goal をそのまま Codex に貼る。
   - 暫定で済ませたい（方針B）なら、/goal の「ステップ1・2（override層実装）」を省き、「対象3 id のみの generated JSON 限定編集」に縮小した別 goal を Claude が作成し直す。
2. ペア1の canonical 選定（food-1eqmspw を残す案で確定してよいか。kinopios-cafe 由来の food-1xe3vuu を残す選択も可）。
3. 実装完了後は、Claude が `design-review-food-duplicate-repair-v1.md` でレビュー証跡を作成する（本タスクではまだ作らない）。
