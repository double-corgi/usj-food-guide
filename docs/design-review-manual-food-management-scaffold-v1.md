# 設計レビュー証跡: 手動フード管理 最小足場（scaffold）

- **対象commit**: `1fb4267097c2bf29c4023c2450da115e3d36be4a`
- **commit message**: `add manual food management scaffold`
- **前提docs**: `docs/admin-manual-food-management-plan-v1.md` / `docs/codex-goal-admin-manual-food-management-scaffold-v1.md`
- **レビュー担当**: Claude（設計・レビュー）
- **レビュー日**: 2026-06-22
- **判定**: ✅ **承認**

---

## 0. 結論サマリー

構成案A の足場（空テンプレ2 JSON＋guard付き apply 2本＋docs）を、実フード・画像・管理画面・DB なしで追加。**空適用＝generated 差分ゼロ**、既存 override 機構を壊さず、ID生成・許可フィールド・enum・同一性キー保護・全件差分ガードが堅牢。手動追加の土台として妥当。承認。

---

## 変更内容（実diff）

`git show --stat 1fb4267` → **5 files changed, 1148 insertions(+)**

| ファイル | 内容 |
|---|---|
| `data/manual-foods.json` | `[]`（空・add用） |
| `data/manual-food-overrides.json` | `[]`（空・update用） |
| `scripts/debug/apply-manual-foods.ts`（503行） | 新規food追加の足場（append専用・guard） |
| `scripts/debug/apply-manual-food-overrides.ts`（463行） | 既存food許可フィールド更新の足場（guard） |
| `docs/manual-food-management-scaffold-v1.md` | 運用ドキュメント |

`foods.generated.json` / `data/translations` / `package.json` は**コミットに含まれない**。git クリーン。

---

## 安全設計の検証（実コード）

### apply-manual-foods.ts（add）
- **空 → no-op**（`manualFoods.length===0` で return）＝generated 差分ゼロ。
- **ID生成（決定的・名前空間）**: `food-manual-${sha256(basis).slice(0,12)}`（crypto）。
- **ID衝突チェック**: `existingIds.has(id)` → throw。名称を id に使う誤用も throw。
- **append専用ガード** `assertOnlyAppendedFoods`: `foods.length === before+added` を強制し、**既存レコードを index 単位で byte 比較**（変化があれば throw）＝既存不変・追加のみ。
- **入力フィールド whitelist** `allowedManualFoodFields`（未知キー throw）、`action` は `add` 限定。
- **enum 検証**: `allowedCategoryTags`（指定16タグ）、`validSaleStatuses`/`SourceTypes`/`Confidences` を `readEnum`。
- **品質ガード**: `priceYen` 非負整数 or null（null は confidence=low 必須）、`image` は `main.jpg` 限定＋`imageSourceUrl` 必須、`infoSourceUrl` は URL。
- **shop/area は既存 generated に一致必須**（不一致 throw）＝幽霊店舗/エリアを作らない。
- **可視性ガード**: `reviewStatus` は **confidence=high かつ imageUrl ありのみ approved**、それ以外 pending → **画像なし手動foodは非表示**（ルール「画像なしは出さない」を満たす）。
- 書き込みは **apply 経由のみ**（generated 直接手編集なし）。

### apply-manual-food-overrides.ts（update）
- **空 → no-op**（return）。
- **入力 whitelist** `allowedOverrideFields`（id/normalizedName/name 等は**含まない**＝同一性キーを入力できない）。`action` は `update` 限定。
- **generated 変更フィールド whitelist** `allowedChangedFoodFields`（price*/source*/date*/status/saleStatus*/image* 等のみ）。**`id`/`normalizedName`/`name` は不在 → 変更不可**。
- `assertOnlyAllowedTargetChanges`（許可外フィールド変更を検出 throw）＋ `assertNoUnexpectedDatasetChanges`（全データセット before/after 差分・対象 id 以外不変）。
- **target-not-found throw**、**「何も変えない override」throw**、enum 検証、image=main.jpg＋imageSourceUrl 必須、URL 検証。
- 画像差し替え（image override）も本層で対応（imageUrl 更新＋imageSourceUrl 必須）。

---

## レビュー観点ごとの判定

| # | 観点 | 結果 | 根拠 |
|---|------|------|------|
| 1 | scaffold のみに限定か | ✅ | 空JSON2＋apply2＋docs。実データ・画像・UI・DB なし |
| 2 | 2 JSON が空テンプレか | ✅ | ともに `[]` |
| 3 | 実フード追加なしか | ✅ | テンプレ空・generated 未変更 |
| 4 | クロミ/サーティワン/マイメロを追加していないか | ✅ | 追加なし |
| 5 | 画像追加なしか | ✅ | diff に画像なし |
| 6 | generated に差分がないか | ✅ | コミットに generated 含まれず・空適用＝差分ゼロ |
| 7 | ID生成方針が安全か | ✅ | `food-manual-<sha256略>` 決定的・名前空間・衝突チェック |
| 8 | overrides の許可フィールド制限が安全か | ✅ | 入力＋generated 双方の whitelist |
| 9 | id/normalizedName 等 同一性キーを変更できない設計か | ✅ | 両 whitelist に不在＋assert で検出 |
| 10 | categoryTags/saleStatus/sourceType/confidence の enum 制限があるか | ✅ | 専用 set＋readEnum |
| 11 | 許可外フィールド/ID衝突で停止できるか | ✅ | throw（unsupported field / id collides） |
| 12 | generated 直接手編集でなく apply 経由限定か | ✅ | writeFileSync は apply 内のみ、全件差分ガード |
| 13 | existing override 機構を壊していないか | ✅ | duplicate/visibility overrides・apply は diff になし |
| 14 | translations/DB/crawler/package.json/AdMob/AdSense に触れていないか | ✅ | diff になし |
| 15 | lint/typecheck/build/coverage/audit が通っているか | ✅ | Codex報告。Coverage 期待値一致・public_active_total 177 維持 |
| 16 | クロミ/サーティワン手動追加の土台として妥当か | ✅ | add/override＋enum＋画像/可視ガードで根拠付き追加が可能 |
| 17 | 管理画面前の最小足場として妥当か | ✅ | JSON＋apply＋docs の安全層。UI/DB は後続 |

---

## 確認に用いた検証コマンド（証跡）
- `git show --stat 1fb4267` / `git show --name-only` → generated/translations/package 不変
- `cat data/manual-foods.json data/manual-food-overrides.json` → ともに `[]`
- `grep`/`Read` で apply 2本の安全要素（ID生成・whitelist・enum・append/diff ガード・no-op・apply限定）を精査
- `allowedChangedFoodFields` に id/normalizedName/name が**無い**ことを確認（同一性キー保護）
- `git status` クリーン

---

## 補足（非ブロッキング・運用申し送り）

判定（承認）には影響しない。

1. **add は shop/area が既存 generated に一致必須**: 幽霊店舗/エリアを作らない良いガードだが、**全く新しい店舗・エリアの商品は manual-foods で追加できない**（要 generated 側に存在）。Phase A の churro 等は概ね既存店舗で問題ないが、新エリア商品が必要になったら別途対応（既知の制約）。
2. **confidence/reviewStatus は自己申告**: 手動 add で `confidence=high`＋画像ありにすると approved＝即可視。**high は公式確認時のみ付与**する運用規律が前提（docs/plan に明記済）。レビュー時に根拠URLを必ず確認すること。
3. **画像ファイル実在は未検証**: override の image=main.jpg は URL を設定するのみで、`public/manual-images/<id>/main.jpg` の実ファイル存在まではスクリプトが検証しない。実データ投入時は画像配置とセットで確認（将来 image 実在チェックを足すと尚良い）。
4. **大型スクリプト（503/463行）**だが既存 override パターン踏襲で妥当。

---

## 結論

手動フード管理の最小足場が、空テンプレ＋guard付き apply（決定的ID・名前空間・衝突チェック・入力/生成フィールド whitelist・同一性キー保護・enum 検証・append/全件差分ガード・空適用 no-op・apply限定）＋docs として安全に追加された。実フード・画像・管理画面・DB・外部ストレージ・広告は未着手。generated/translations/package.json 不変、既存 override 機構非破壊、Coverage 不変、git クリーン。クロミ等を根拠付きで手動追加する土台、および管理画面前の最小足場として妥当。

**判定: 承認**

次の `/goal` は本証跡の確認後に別途作成する（本タスクでは作成しない）。
