# Codex /goal: チュリトス表示漏れ対応（現時点＝HOLD / 実装なし）

> 前提: `docs/churros-visibility-audit-v1.md`。
> **結論: 今回 Codex に投げる実装は無い（HOLD）。** 安全に自動可視化できる churro が存在しないため。
> 本書は「何をしてはいけないか」と「将来 安全に可視化する条件」を明文化した hold goal。確証データが揃うまで実行しない。

---

## なぜ今回は実装しないのか（要点）

- 抑制中の churro 48件は **(a) 販売終了30 / (b) 販売中だが画像0枚9 / (c) 可視品の重複** のいずれかで、**「現行 ∧ 検証済み画像あり ∧ 非重複」を満たす churro がゼロ**。
- override 層（`data/duplicate-overrides.json`＋apply）は **重複統合専用**で、displayQuality/reviewStatus/canonical を覆して可視化する機能が無い。
- generated JSON 直接編集・crawler・DB・translations・外部画像取得は**禁止**。
- → 今この瞬間に安全に出せるものが無い。**無理に出すと、終売品・画像なし・重複を表に出すことになり、品質を下げる。**

---

## 今回 Codex がやること

**なし。** churro 関連の generated/override/コードを変更しない。

（参考までに、Codex に渡す場合の本文）
```
/goal （churro 可視化）現時点では変更しない。docs/churros-visibility-audit-v1.md の通り、安全に可視化できる churro が存在しないため、generated JSON / duplicate-overrides / コードへの churro 関連変更を行わない。確証データ（検証済み画像＋現行販売確認）が揃うまで待機する。
- 変更ファイル: なし
- 実行禁止: generated 直接編集 / crawler / DB / translations / 外部画像取得 / 広告関連
```

---

## 将来 安全に可視化するための前提（別フェーズ・別 goal）

以下が**人手で**揃ってから、初めて1件ずつ着手する。

1. **検証済み画像の用意（人手）**: 監査 3-B の現行品（怪盗キッド/クロミ カシスショコラ/マイメロ いちごヨーグルト/サーティーワン/ハリポタ/トラファルガー/デク/虎杖、※ドルチェ ティラミスは販売状況要確認）について、公式画像を確認し `public/manual-images/<food.id>/` に保存（外部自動取得は禁止＝確証あるもののみ）。
2. **現行販売の確認（人手）**: sale=active が実態と一致するか公式で確認。終売なら対象外。
3. **可視化オーバーライド層の新設（設計→別 goal）**: `data/visibility-overrides.json`（id 単位で displayQuality/reviewStatus/canonical を安全に上書き）＋オフライン apply（duplicate-overrides と同型・**全件 before/after 差分ガード**付き）を設計・実装。generated 直接手編集はしない。
4. **1件ずつ**: 画像と販売確認が取れた id だけを visibility-override に追加 → apply → レビュー → 反映。

> 上記3の「可視化オーバーライド層」は新規機構のため、**着手前に Claude が設計書とレビュー基準を作る**。本 hold goal には含めない。

---

## 厳守事項（将来着手時も共通）
- 確証のない商品を販売中扱いにしない。終売・画像なし・重複は出さない。
- 「友人が見たいから全部出す」をしない。高確度のみ。
- generated JSON 直接編集禁止（override→apply のみ）。
- crawler / DB / data/translations / 外部画像取得 / 大規模crawl 禁止。
- 広告 / AdMob / AdSense は触らない。

---

## 進行側メモ
1. churro は **App Store 前の必須修正ではない**（終売・画像なしを出さない＝現状で安全側）。
2. 価値ある次アクションは「3-B 現行コラボ churro の**公式画像を人手で集める**」こと。画像が揃えば可視化オーバーライド層で安全に出せる。
3. 着手時は Claude が「可視化オーバーライド層」設計書＋ goal を別途作成（本タスクでは作らない）。
