# 設計レビュー証跡: 画像・価格系βフィードバック 最小修正（表示重複2ペア）

- **対象commit**: `c84e3f31664f5cffe3cbe9267ac3a4b83102e3e7`
- **commit message**: `fix: hide duplicate image price feedback foods`
- **前提docs**: `docs/beta-feedback-image-price-audit-v1.md` / `docs/codex-goal-beta-feedback-image-price-fix-v1.md`
- **レビュー担当**: Claude（設計・レビュー）
- **レビュー日**: 2026-06-22
- **判定**: ✅ **承認**

---

## 変更内容（実diff）

`git show --stat c84e3f3` → **2 files changed**

| ファイル | 変更 |
|---|---|
| `data/duplicate-overrides.json` | 2エントリ追記（1kx2jev/xagefj、1u4bz3q/1gtoojv）。既存4エントリ不変 |
| `scripts/output/foods.generated.json` | 対象4 IDのみ canonical/hidden/duplicateGroupId 更新 |

---

## 独立検証（before/after レコード単位）

`git show c84e3f3~1:…` と現行を food.id 単位で全件比較（read-only）:

```
counts before/after: 294 / 294
changed records: 4
  food-1kx2jev -> ["duplicateGroupId","duplicate_group_id"]
  food-1u4bz3q -> ["duplicateGroupId","duplicate_group_id"]
  food-xagefj  -> ["hidden","canonicalFood","canonical_food","duplicateGroupId","duplicate_group_id"]
  food-1gtoojv -> ["hidden","canonicalFood","canonical_food","duplicateGroupId","duplicate_group_id"]

food-1kx2jev canon=true  hid=false grp=override-food-1kx2jev（ツナマヨ ピッツァ）= 表示維持
food-xagefj  canon=false hid=true  grp=override-food-1kx2jev（ツナマヨ 別表記）  = 非表示
food-1u4bz3q canon=true  hid=false grp=override-food-1u4bz3q（カレー キッズ）    = 表示維持
food-1gtoojv canon=false hid=true  grp=override-food-1u4bz3q（カレーライス キッズ）= 非表示
```

既存6 ID（3ペア＋スチュアート・バケツ）の整合も維持。`git status` クリーン。

---

## public_active_total 179 → 178 の検証（観点9・精査）

- **可視 raw food 数: 184 → 182（−2）** … 重複2件が実際に一覧から消えた＝ユーザー向けの本修正。✅
- **public_active_total（active な canonicalGroup 数）: 179 → 178（−1）** … 当方でも再現。−1 である理由を実データで特定:
  - `public_active_total` は可視・active な food の **canonicalGroupId のユニーク数**（audit の getCanonicalKey は canonicalGroupId 優先）。
  - **ペアB**: food-1gtoojv の canonicalGroupId=`group-vhkm24` は**当該1件のみ**。hidden 化でグループ消滅 → **−1**。
  - **ペアA**: food-xagefj の canonicalGroupId=`group-1imiecz` は **food-1yi0toj・food-1wc5ggu（共に可視・active）も所属**。xagefj を隠してもグループは残存 → **±0**。
  - 合計 −1。→ **179→178 は妥当**（Codex 報告と一致。raw では −2 で、メトリクスは canonicalGroup 単位のため差が出る）。

---

## レビュー観点ごとの判定

| # | 観点 | 結果 | 根拠 |
|---|------|------|------|
| 1 | 高確度の表示重複2ペアだけに限定か | ✅ | 変更レコード4 IDのみ、overrides 2追記 |
| 2 | 既存 overrides を壊していないか | ✅ | 既存4エントリ不変（追記のみ） |
| 3 | generated が apply 経由の差分のみか | ✅ | 差分が override 対象＝許可フィールドのみ。script の全件差分ガードで担保 |
| 4 | food-1kx2jev が表示維持か | ✅ | canon=true / hidden=false |
| 5 | food-xagefj が非表示か | ✅ | canon=false / hidden=true |
| 6 | food-1u4bz3q が表示維持か | ✅ | canon=true / hidden=false |
| 7 | food-1gtoojv が非表示か | ✅ | canon=false / hidden=true |
| 8 | duplicateGroupId が正しいか | ✅ | override-food-1kx2jev / override-food-1u4bz3q |
| 9 | public_active_total 179→178 が妥当か | ✅ | 精査済（上記）。raw −2／group −1 |
| 10 | 価格・画像・カテゴリ・名・店舗・エリアを変更していないか | ✅ | 変更フィールドは canonical/hidden/duplicateGroupId 系のみ |
| 11 | モササウルス/ラプトル系に触れていないか | ✅ | diff に該当なし（別商品の画像共有＝意図どおり保留） |
| 12 | ボブ/フィル系に触れていないか | ✅ | diff になし（画像不一致＝要人手で保留） |
| 13 | スチュアートバーガー系に触れていないか | ✅ | diff になし（価格不整合＝保留） |
| 14 | チュリトス可視化に触れていないか | ✅ | diff になし（HOLD 維持） |
| 15 | translations/DB/crawler/package.json/AdMob/AdSense に触れていないか | ✅ | diff になし |
| 16 | lint/typecheck/build/coverage/audit が通っているか | ✅ | Codex報告＋当方で coverage/audit 整合確認。Coverage 期待値一致 |
| 17 | App Store前・β公開前の安全な最小修正として妥当か | ✅ | 既存承認済機構・対象限定・全件ガード・Coverage 不変 |

---

## 確認に用いた検証コマンド（証跡）

- `git show --stat c84e3f3` / `git show c84e3f3 -- data/duplicate-overrides.json` → diff
- `git show c84e3f3~1:…` vs 現行を id 単位で全件比較 → 変更4 ID・許可フィールドのみ
- canonicalGroupId 共有関係を解析（group-1imiecz は 1yi0toj/1wc5ggu と共有、group-vhkm24 は単独）→ public_active_total −1 を説明
- `git status --short` → クリーン

---

## 補足（非ブロッキング）

判定（承認）には影響しない。

1. **public_active_total はメトリクス上 −1**: 実際の重複解消は raw 可視数 −2 で達成済み。メトリクスが canonicalGroup 単位のための差であり、データ上の問題ではない。Codex の補足説明は方向性は正しいが、精密な理由は「xagefj の canonicalGroupId(group-1imiecz) を他の可視品(1yi0toj/1wc5ggu)が共有しているため」。
2. **関連クラスタの follow-up**: `group-1imiecz` に food-1yi0toj / food-1wc5ggu（共に可視）が同居している。これらが「ツナマヨ ピッツァ・デニッシュ」の別バリエか追加重複かは未検証。次回の画像・重複監査で確認する価値あり（本commitの対象外）。
3. **要確認/保留項目は意図どおり未着手**: モササウルス/ラプトル（別商品・画像共有）、ボブ=フィル画像不一致、スチュアート・バーガー価格不整合、価格内画像。安全機構/確証が整ってから別途。

---

## 結論

監査で「高確度・安全」とした表示重複2ペア（ツナマヨ ピッツァ・デニッシュ／カレー キッズセット）を、既存 override 機構（前回 96bc26c と同型・全件差分ガード）で統合。変更は対象4 ID・canonical/hidden/duplicateGroupId のみで、価格・画像・カテゴリ・名称・店舗・エリア・他β指摘・チュリトス・translations/DB/crawler/package.json/AdMob は不変。可視 raw 数 184→182、public_active_total 179→178（理由特定済）、Coverage 不変、git クリーン。App Store前・β公開前の安全な最小修正として妥当。

**判定: 承認**

次の `/goal` は本証跡の確認後に別途作成する（本タスクでは作成しない）。
