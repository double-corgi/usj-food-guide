# チュリトス 公式・信頼ソース 再調査・修正計画 v1

**作成日 / 確認日:** 2026-06-22
**担当:** Claude（調査・設計・レビュー担当 / 実装はしない）
**対象データ:** `scripts/output/foods.generated.json`（読み取りのみ）。public_active_total=178。
**禁止事項遵守:** コード変更・git・generated直接編集・DB・crawler・translations 変更なし。Web は検索＋一部記事参照のみ（外部画像保存なし）。

> 注記（情報源の網羅性）: 各 WebSearch の要約結果と個別メディア記事（fashion-press / Yahoo・クランクイン等）を参照。**`castel.jp/p/3101` は容量超過で全文解析できず**、検索要約＋他ソースで補完した。最終確定は公式またはパーク現地確認を推奨。

---

## 1. チュリトスカテゴリの現状サマリー

- UNICOLE 内 churro 61件中 **可視13 / 抑制48**（前監査 `churros-visibility-audit-v1.md` と同じ）。
- 抑制の主因: **終売（販売終了）** または **販売中だが画像0枚＋pending＋dq=low＋canon=false**、もしくは **可視品の重複**。
- 今回の公式・信頼ソース照合の結論:
  - ユーザー指摘の「クロミ」「サーティワン」は実在するが、**サーティワン＝終売（2026/5/10）**、**クロミ カシスショコラ＝現行だが UNICOLE 側に画像なし**。
  - 「ソルティキャラメルチュリトス」は UNICOLE で**可視**だが、信頼ソースでは **2026/6時点 休止中**＋ユーザーは**画像不一致**を指摘 → 要確認（可視のまま放置はリスク）。
- → **今すぐ安全に追加・復帰できる churro はほぼ無い**（現行品は画像欠落、復帰には検証済み画像が前提）。

---

## 2. 公式・信頼サイトから確認できたチュリトス（主要・今回照合分）

| 商品名 | 価格 | 販売場所/エリア | 販売状況 | 根拠 | 信頼度 |
|---|---|---|---|---|---|
| サーティーワン・チュリトス（ポッピングシャワー / ラブポーション） | 800 | ユニバーサル・マーケット | **終売**（2026/3/3〜**2026/5/10**、25周年コラボ） | fashion-press 143560 / Yahoo(クランクイン) / castel | 高（媒体＋日付） |
| クロミ・チュリトス ～カシスショコラ味～ | 700 | NO LIMIT！マーケット または シネマ4-Dストア前フードカート（クロミライブ連動） | **現行販売**（クロミライブ2026連動、終了日未確認） | rosyinnovation / castel / yuniba.hatenablog / happyell | 中〜高 |
| ソルティキャラメルチュリトス | （旧表記） | フードカート | **休止中**（2025秋冬登場、2026/6時点 休止） | happyell / castel / rosyinnovation | 中 |
| マイメロディ・チュリトス ～いちごヨーグルト味~ | （要確認） | フードカート（サンリオ系） | 現行の可能性（要確認） | happyell / rosyinnovation | 中 |
| 定番（チョコレート/シナモン/メープル/ココア&クッキー 等） | 550〜700 | 各フードカート | 現行（UNICOLE 可視と一致） | castel / usj 公式 food-cart | 高 |

> 公式 food-cart ページ（usj.co.jp/web/ja/jp/restaurants/food-cart）はラインナップが流動的で個別価格の明記が薄く、個別確定は信頼サイト＋日付付きレポートに依存。

---

## 3. 現在 UNICOLE に「不足」している商品

- 実は**新規不足は少ない**。ユーザーが「ない」と感じる商品（クロミ/マイメロ/サーティワン等）は **UNICOLE 内に既に存在**するが、**終売 or 画像欠落で抑制**されているだけ。
- 完全に存在せず、かつ現行・情報完備で**新規追加すべき churro は今回特定できず**（現行品は UNICOLE 内に既存、ただし画像欠落）。

---

## 4. クロミ系チュリトスの調査結果

| 項目 | 内容 |
|---|---|
| 商品名 | クロミ・チュリトス ～カシスショコラ味~ |
| UNICOLE | food-10fodl7（¥750 / **hidden / canon=false / dq=low / pending / 画像なし** / area確認中 / イルミネーション・シアター入口横フードカート） |
| 公式・信頼ソース | 価格 **¥700**、クロミライブ2026連動で現行販売、NO LIMIT！マーケット or シネマ4-Dストア前フードカート、星型マシュマロ・紫(カシス) |
| 差分 | **価格 ¥750(データ) vs ¥700(ソース)** の不一致、**UNICOLE に画像が無い**、販売場所表記ゆれ |
| 表示されない理由 | 画像なし＋pending＋dq=low＋canon=false |
| 判定 | **現行品だが画像欠落 → 今は表示できない**。検証済み画像の人手取得＋価格確認が前提（→ 分類 C/E） |
| 根拠URL | rosyinnovation.com/usj-churitosu2018 ; castel.jp/p/3101 ; yuniba.hatenablog.com/entry/usj-kuromi-churros-sales-period-investigation（確認日 2026-06-22 / 信頼度 中〜高） |

> なお「#世界クロミ化計画★チュリトス ～塩キャラメル~」（food-5jyp4a / food-1nx0g42）は **終売**（2024-11-04 / 2023-11-05）。復活表示しない。

---

## 5. サーティワン系チュリトスの調査結果

| 項目 | 内容 |
|---|---|
| 商品名 | サーティーワン・チュリトス（～ポッピングシャワー~ / ～ラブポーションサーティーワン~） |
| UNICOLE | food-udijzl（¥800 / **hidden / canon=false / dq=low / pending / 画像なし** / saleStatus=active←**stale**） |
| 公式・信頼ソース | 25周年コラボ、**2026/3/3〜2026/5/10 で終了**、¥800、ユニバーサル・マーケット |
| 差分 | UNICOLE は saleStatus=active のままだが、ソースでは**既に終売**（本日2026-06-22時点） |
| 判定 | **終売 → 表示しない（分類 F）**。saleStatus の stale はデータ側の鮮度問題（generated は触らない＝override/再生成の別管理） |
| 根拠URL | fashion-press.net/news/143560 ; news.yahoo.co.jp/articles/c1d19b6d25475b4503908026aabb41278f30db9f ; castel.jp/p/3101（確認日 2026-06-22 / 信頼度 高） |

---

## 6. ソルティキャラメルチュリトスの画像不一致 調査結果

| 項目 | 内容 |
|---|---|
| UNICOLE | food-5n9awi（**可視** / ¥700 / dq=high / approved / area確認中 / フードカート / 画像=`/generated/manual-images/churros/salty-caramel-churro-product.jpg`） |
| ユーザー指摘 | 画像が違う（指摘#2） |
| 公式・信頼ソース | 2025秋冬登場、**2026/6時点 休止中**（現在販売されていない）。塩キャラメル系の現行は「#世界クロミ化計画★チュリトス～塩キャラメル~ ¥700」 |
| 判定 | **(a) 販売休止疑い**（可視のままはリスク）＋**(b) 画像不一致疑い**。ただし「休止」は第三者ソースのみで公式未確認、かつ「終売」とは断定不可 → **要確認（分類 E）**。**自動で hide/画像差し替えしない**（公式確認・正画像URLが前提） |
| 根拠URL | happyell.co.jp/turritosusj ; castel.jp/p/3101 ; rosyinnovation.com/usj-churitosu2018（確認日 2026-06-22 / 信頼度 中） |

> 重要: ソルティキャラメルは**唯一「可視なのに状態/画像が怪しい」churro**。公式で休止/終了が確認できれば hide、現行なら正しい画像へ差し替え、のいずれか。**今は人手確認待ち**。

---

## 7〜10. 分類（A〜F）

### A. 今すぐ修正できる高確度項目
**該当なし。** 現行と確認できた churro（クロミ カシスショコラ等）は **UNICOLE 側に画像が無く**、安全に表示できない。価格にも不一致（¥700/¥750）。

### B. 表示復帰してよい候補
**該当なし（安全な範囲では）。** 現行・既存だが**画像欠落**のため復帰不可（ルール: 画像なしは表示しない）。

### C. 画像差し替え/付与が必要な候補（別タスク・人手前提）
| food.id | 商品 | 必要作業 | 根拠 |
|---|---|---|---|
| food-10fodl7 | クロミ・チュリトス カシスショコラ | 公式画像の人手取得→manual-images→検証→価格(¥700)確認→可視化 | rosyinnovation / castel |
| food-1sem5gf | マイメロディ・チュリトス いちごヨーグルト | 現行販売確認＋画像取得＋価格確認 | happyell / rosyinnovation（要確認） |
| food-5n9awi | ソルティキャラメルチュリトス（可視） | 正しい画像URL確認 or 休止なら hide（公式確認後） | happyell / castel |

### D. 追加すべき候補（UNICOLE に存在しない）
**該当なし**（現行品は UNICOLE 内に既存。完全新規で情報完備の churro は今回未特定）。

### E. 保留
- food-10fodl7 クロミ カシスショコラ（価格不一致＋画像なし）
- food-1sem5gf マイメロ いちごヨーグルト（現行性・画像・価格 要確認）
- food-5n9awi ソルティキャラメル（休止疑い＋画像不一致、公式未確認）

### F. 表示しない
- food-udijzl サーティワン・チュリトス（**終売 2026/5/10**）
- 終売の各コラボ churro（#世界クロミ化計画/マイメロのハッピー/コナン/ゾロ抹茶=ジュラシック緑/鬼滅/ハロウィン2023 等、前監査で確認済）
- 画像なし・価格/販売場所不明・重複統合済みのもの

---

## 11. 今回 Codex に投げてよい最小修正 goal

**安全に自動実行できる churro データ修正は無し（HOLD）。** 理由:
- 現行と確認できた churro は **UNICOLE 側に検証済み画像が無い** → 表示不可（ルール遵守）。
- 終売（サーティワン等）は**復活表示禁止**。
- ソルティキャラメルは可視だが**公式での休止/終了が未確認**＋正画像URL未確定 → 自動 hide/差し替えしない。
- override 層は重複統合専用で、画像付与・dq/review 昇格・価格修正・状態変更を扱えない。generated 直接編集も禁止。

→ `docs/codex-goal-churros-official-source-fix-v1.md` は **HOLD goal**（何をしないか＋将来の安全機構の前提条件）として用意。

## 12. 今回 Codex に投げてはいけない項目
- 画像欠落 churro（クロミ/マイメロ等）の可視化（画像なし表示）。
- サーティワン等 **終売品の復活表示**。
- ソルティキャラメルの自動 hide・自動画像差し替え（公式確認・正画像URL前提）。
- 価格の自動修正（¥700/¥750 等、確証前）。
- generated JSON 直接編集 / crawler / DB / translations / 外部画像保存 / 広告。

---

## 13. 参照したURL一覧
- USJ公式 食べ歩きフード: https://www.usj.co.jp/web/ja/jp/restaurants/food-cart
- USJ公式 25周年オリジナルフード: https://www.usj.co.jp/web/ja/jp/25th-anniversary-discover-u/foods
- USJ公式 アレルゲン情報: https://usjfoodallergy.usj.co.jp/
- CASTEL チュロスまとめ: https://castel.jp/p/3101 ／ 販売場所マップ: https://castel.jp/item/125735/ ／ 25周年フード: https://castel.jp/p/10459
- fashion-press（サーティワン/サントリーコラボ）: https://www.fashion-press.net/news/143560
- Yahoo!ニュース（クランクイン！ サーティワン チュリトス）: https://news.yahoo.co.jp/articles/c1d19b6d25475b4503908026aabb41278f30db9f
- rosyinnovation チュリトスマップ2026: https://rosyinnovation.com/usj-churitosu2018
- happyell チュリトス種類: https://happyell.co.jp/turritosusj
- yuniba.hatenablog クロミチュロス販売期間: https://yuniba.hatenablog.com/entry/usj-kuromi-churros-sales-period-investigation
- ikobai/levecolle ユニバチュロス2026: https://ikobai.levecolle.co.jp/blogs/review/usj-churros
- USJ365 2026クロミ: https://usj365.com/2026/04/15/2026kuromi/

## 14. 各商品の根拠・確認日・信頼度（要約）
| 商品 | 根拠URL | 確認日 | 信頼度 | 判断 |
|---|---|---|---|---|
| サーティワン・チュリトス | fashion-press 143560 / Yahoo c1d19b6d / castel 3101 | 2026-06-22 | 高 | 終売(5/10)→F |
| クロミ カシスショコラ | rosyinnovation 2018 / castel 3101 / yuniba | 2026-06-22 | 中〜高 | 現行・画像なし→C/E |
| ソルティキャラメル | happyell / castel 3101 / rosyinnovation | 2026-06-22 | 中 | 休止疑い＋画像不一致→E（要確認） |
| マイメロ いちごヨーグルト | happyell / rosyinnovation | 2026-06-22 | 中 | 現行性要確認・画像なし→E |
| #世界クロミ化計画 塩キャラメル | （UNICOLEデータ saleEndDate） | 2026-06-22 | — | 終売→F |

---

## 結論
公式・信頼ソース照合の結果、ユーザー指摘は概ね「**終売**（サーティワン）」か「**現行だが UNICOLE に画像が無い**（クロミ カシスショコラ等）」で説明される。**今すぐ安全に追加・復帰できる churro は無い**。ソルティキャラメルのみ「可視だが休止疑い＋画像不一致」で**人手確認が必要**。次の安全な一歩は「現行 churro の公式画像を人手で取得→manual-images→検証」＋「画像/可視化を安全に反映する override 機構の設計」。本タスクでは実装しない。
