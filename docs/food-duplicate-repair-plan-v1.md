# 食品データ重複 修正計画 v1

**作成日:** 2026-06-20
**担当:** Claude（設計・レビュー担当 / 実装はしない）
**前提:** `npm run audit:duplicates`（commit 656af93）の結果。duplicate ID 2件は canonical/hidden 管理ペアのため対象外。本書は duplicate name / suspicious duplicate のうち優先度が高い3ペアを対象とする。
**重要:** 本書は設計のみ。コード変更・git操作・generated JSON編集・DB/crawler実行は行っていない。調査は `foods.generated.json` の **読み取り** と `scripts/` のコード精査のみ。

---

## 0. 結論サマリー

| 項目 | 結論 |
|---|---|
| 3ペアの性質 | **3ペアとも実質重複（同一商品の表記ゆれ）**。意図的別商品ではない |
| 画像差し替えで足りるか | **NO**（3ペアとも画像は完全一致。画像問題ではない） |
| 表示上の重複 | **発生している**（両レコードとも canonical=true / hidden=false / approved のため両方表示） |
| 根本原因 | `scripts/utils/quality-foods.ts` の**重複統合ヒューリスティックの取りこぼし**（後述） |
| generated JSON を直接編集すべきか | **NO** |
| Codex に今すぐ投げるべきか | **NO（Stop条件）** — 安全に反映する経路が現状ルール下に存在しない。下記「Stop報告」を要確認 |

---

## 1. 各ペアの詳細比較

### ペア1: `food-1eqmspw` / `food-1xe3vuu`（kids）

| 項目 | food-1eqmspw | food-1xe3vuu |
|---|---|---|
| name | ハンバーガー・キッズセット(マリオのピック**付き**) | ハンバーガー・キッズセット(マリオのピック**付**) |
| normalizedName | ハンバーガーキッズセットマリオのピック**付き** | ハンバーガーキッズセットマリオのピック**付** |
| price | 1800（official） | 1800（official） |
| area | スーパー・ニンテンドー・ワールド | スーパー・ニンテンドー・ワールド |
| shop / location | キノピオ・カフェ | キノピオ・カフェ |
| image | （同一URL）`...hamburger-kids-set-with-mario-pick-wood-gallery-a.jpg` | （同一URL・一致） |
| canonical / hidden | true / false | true / false |
| reviewStatus / displayQuality | approved / high | approved / high |
| name/confidence score | 100 / 100 | 100 / 100 |
| isLimited / saleStatus | false / active | false / active |
| duplicateGroupId | dup-00004 | dup-00164 |
| canonicalGroupId | group-1o0ckz4 | group-14vz4xp |
| sourceUrl | .../restaurants/kids-menu/index.html | .../restaurants/kinopios-cafe/index.html |

差分は表記の「**付き**」/「**付**」のみ。価格・店舗・エリア・画像・カテゴリすべて一致。クロール元ページが2つ（kids-menu と kinopios-cafe）あり、別レコードとして取り込まれた。

### ペア2: `food-1ocz8a8` / `food-1rsazo8`（pizza）

| 項目 | food-1ocz8a8 | food-1rsazo8 |
|---|---|---|
| name | **照り焼きチキン** ピッツァ・デニッシュセット | ピッツァ・デニッシュセット **~照り焼きチキン~** |
| normalizedName | 照り焼きチキンピッツァデニッシュセット | ピッツァデニッシュセット~照り焼きチキン~ |
| price | 1600（trusted_report） | 1600（trusted_report） |
| area | アミティ・ビレッジ | アミティ・ビレッジ |
| shop / location | ボードウォーク・スナック | ボードウォーク・スナック |
| image | （同一URL）`...pizza-danish-set-teriyaki-chicken-offercard-h.jpg` | （同一・一致） |
| canonical / hidden | true / false | true / false |
| reviewStatus / displayQuality | approved / high | approved / high |
| name/confidence score | 100 / 100 | 90 / 90 |
| isLimited / saleStatus | false / active | false / active |
| canonicalGroupId | group-ipyp1c | （なし／undefined） |
| sourceUrl | .../restaurants/boardwalk-snacks/index.html | （同一） |

差分は語順とフレーバー表記形式（先頭付与 vs 末尾チルダ）のみ。同一商品。

### ペア3: `food-nzx6eb` / `food-5ib5k3`（dessert）

| 項目 | food-nzx6eb | food-5ib5k3 |
|---|---|---|
| name | **マリオの帽子 パンケーキサンド** ~いちごのショートケーキ~ | **パンケーキ・サンド マリオの帽子** ~いちごのショートケーキ~ |
| normalizedName | マリオの帽子パンケーキサンド~いちごの…~ | パンケーキサンドマリオの帽子~いちごの…~ |
| flavor | いちごのショートケーキ | いちごのショートケーキ |
| price | 950（trusted_report） | 950（trusted_report） |
| area | ハリウッド・エリア | ハリウッド・エリア |
| shop / location | マリオ・カフェ&ストア | マリオ・カフェ&ストア |
| image | （同一URL）`...pancake-sandwich-mario-offercard-h.jpg` | （同一・一致） |
| canonical / hidden | true / false | true / false |
| reviewStatus / **displayQuality** | approved / **high** | approved / **medium** |
| name/confidence score | 90 / 100 | 90 / 100 |
| isLimited / saleStatus | false / active | false / active |
| canonicalGroupId | group-kbqcpk | group-2j8xr6 |
| sourceUrl | .../restaurants/mario-cafe-and-store/index.html | （同一） |

差分は語順のみ。同一商品。

---

## 2. 各ペアの判定

| ペア | 判定 | 画像差し替え | 理由 |
|---|---|---|---|
| 1 (kids) | **実質重複** | 不要（画像一致） | 表記「付き/付」差のみ。全属性一致 |
| 2 (pizza) | **実質重複** | 不要（画像一致） | 語順・フレーバー表記差のみ。全属性一致 |
| 3 (dessert) | **実質重複** | 不要（画像一致） | 語順差のみ。全属性一致 |

いずれも「意図的別商品」「保留」ではなく**実質重複**。

---

## 3. 推奨アクションと canonical 選定

3ペアとも「**canonical/hidden 整理**」（片方を残し片方を hidden=true / canonical=false にして統合）。

| ペア | 残す（canonical=true） | 隠す（hidden=true / canonical=false） | 選定根拠 |
|---|---|---|---|
| 1 | **food-1eqmspw** | food-1xe3vuu | 名称の送り仮名が完全（「付き」）。スコアは同点(100/100) |
| 2 | **food-1ocz8a8** | food-1rsazo8 | nameQualityScore 100 > 90。canonicalGroupId 保有 |
| 3 | **food-nzx6eb** | food-5ib5k3 | displayQuality high > medium |

> 注: ペア1の canonical 選定は同点のため、`kinopios-cafe`（実店舗ページ由来）の food-1xe3vuu を残す選択も妥当。最終決定は進行側で確定可。

---

## 4. 根本原因（source 分析）

canonical / hidden / duplicateGroupId は **手動データではなくアルゴリズム生成**。発生源は `scripts/utils/quality-foods.ts` の `assignDuplicateGroups()`（L452-493）と `duplicateBucketKey()`（L706-708）。

```
duplicateBucketKey = `${category}:${normalizedName.slice(0, 4)}`   // 先頭4文字でバケット分割
```

統合判定（L459-466）は、同一バケット内で
`nameClose && sameCategory && sameVariant && (mergeablePrice || imageOverlap)`
を満たすペアのみ統合する。各ペアが統合されなかった理由:

- **ペア2・3 → バケットキー不一致で比較すらされない。**
  - ペア2: `pizza:照り焼き` vs `pizza:ピッツァ`（語順違いで先頭4文字が別物）
  - ペア3: `dessert:マリオの` vs `dessert:パンケー`（同上）
  - → 別バケットに落ち、同一商品なのに統合候補に入らない。
- **ペア1 → 同一バケット（kids:ハンバー）だが統合されない。**
  - 「付き/付」の送り仮名差により `nameClose`（`maybeSimilar` の similarity≥0.9 / `variantKey` 一致）が成立せず、別グループのまま canonical 2件が残存。

すなわち根本原因は **重複統合ヒューリスティックの取りこぼし**:
1. `duplicateBucketKey` が語順・表記順に脆い（先頭4文字依存）。
2. 名称マッチングが送り仮名・チルダ表記・語順の正規化を吸収しきれていない。

正しい修正箇所は **generated JSON ではなく `scripts/utils/quality-foods.ts`（dedup ロジック）**。

---

## 5. 反映経路の問題（重要 / Stop条件）

source（quality-foods.ts）を直せても、**foods.generated.json への安全な反映経路が現状ルール下に存在しない。**

1. **`foods.generated.json` は git 管理対象**（`git ls-files` で確認）。プロジェクトルール「generated JSON変更禁止」が直接適用される。
2. **再生成は crawler 実行を伴う。** 唯一の生成経路 `scripts/crawl-quality.ts` は L27 で `crawlTargetedPages("coverage")` を必ず呼ぶ＝ネットワーク crawl。ルール「DB / crawler実行禁止」に抵触。
3. **再生成は coverage / 各種フィールドを退行させる恐れ。** 現行 `foods.generated.json` は 2026-06-08 付。一方キャッシュ `latest-crawl-report.json` は 2026-05-29 付で 10日古い。さらにクロール後に `scripts/debug/apply-*.ts`（apply-186-quality-phase / apply-safe-location-fixes / apply-official-price-confirmations / apply-sale-period-fields ほか多数）が generated JSON を直接書き換えて現状を作っている。キャッシュからの再生成はこれら手動調整をすべて失い、**Food/Store Coverage が変化**する（ルール違反）。
4. **canonical/hidden を表現する手動オーバーライド層が存在しない。** `manualOverride` は `quality-foods.ts` L991 で常に `false` 固定。「この id を隠す/このグループに統合する」という宣言を安全に置く場所が無い。

→ 「source を直す」「再生成で反映する」「coverage を変えない」「generated JSON を編集しない」「crawler を回さない」を **同時に満たす経路が無い**。これは **Stop条件**。

---

## 6. 判定（必須項目）

| 質問 | 回答 |
|---|---|
| 修正する場合の変更対象ファイル | （恒久対応案を採る場合）`scripts/utils/quality-foods.ts`＋新規 `data/duplicate-overrides.json`。**ただし反映には別途 generated JSON への書き込み or 再生成が必要 → 現状ルールでは実行不可** |
| **generated JSON を直接編集すべきか** | **NO**（git管理対象・原則禁止・再生成で上書きされる・根本解決にならない） |
| **Codex に投げるべきか** | **NO（現時点）**。Stop して進行側の方針決定が先。下記いずれかの承認が必要 |

### 進行側に確認が必要な選択肢（Stop報告）

- **方針A（推奨・恒久）:** 重複オーバーライド層を新設する設計。`data/duplicate-overrides.json`（`canonicalId`＋`duplicateIds` の宣言）を `quality-foods.ts` の `assignDuplicateGroups` が読み込み、指定ペアを強制統合。あわせて **crawl を伴わないオフライン適用ステップ**（既存 generated JSON に override のみを当て直す）を用意。→ ただし当該ステップは generated JSON への限定書き込みを伴うため、ルール「generated JSON直接編集禁止（必要時はStop報告）」に基づき**事前承認が必要**。coverage への影響は「対象3 id を hidden 化」に限定され、翻訳 Coverage は不変の見込み（要検証）。audit の `public_active_total` は 183→180 に改善する想定。
- **方針B（暫定）:** 進行側が「scoped な generated JSON 限定編集（対象3 id の hidden/canonical/duplicateGroupId のみ）」を一度だけ許可。最小差分・即効だが、次回再生成で消える点を許容する前提。
- **方針C:** 進行側が「制御された再生成」を許可（crawler 実行＋ `apply-*` 再適用＋Coverage 差分検証）。最も重いが最も正規。

> Claude の推奨は **方針A**（恒久的・再現可能・root原因対処）。ただし A/B いずれも generated JSON への書き込みを伴うため、**ルール上は Stop して承認を得てから着手**。

---

## 7. Codex /goal の状態

`docs/codex-goal-food-duplicate-repair-v1.md` に **方針A 前提の /goal を用意済み**。ただし冒頭に明記の通り **進行側が方針Aを承認するまで実行しない**。承認なしに Codex へ渡すと Stop条件に抵触する。

---

## 付録: 検証に用いた操作（すべて読み取り専用）

- `node -e` で `foods.generated.json` から6 food の全属性を抽出（read-only）
- `scripts/utils/quality-foods.ts` L440-493 / L700-736 を精読（dedup ロジック）
- `scripts/crawl-quality.ts` を精読（再生成は coverage crawl を必須呼び出し）
- `git ls-files` で `foods.generated.json` が追跡対象であることを確認
- `scripts/debug/apply-*.ts` がクロール後に generated JSON を書き換える事実を確認
- ファイル日付比較（generated 06-08 / report 05-29）で再生成リスクを確認
