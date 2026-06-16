# final-review-store-id-collision-fix-v1-1

対象: 店舗ID衝突修正 v1.1（commit 8224683c、HEAD: c7094c319）
レビュー日: 2026-06-16
前回判定: 条件付き承認（design-review-store-id-collision-fix-v1-1.md）
参照: `docs/store-id-collision-audit-v1.md`、`lib/store-utils.ts`

---

## 判定: 承認

---

## 1. 前回条件付き承認の条件確認

前回条件は「Vercel本番で `/stores` の duplicate href が0、`shop-1tt48e8` が1件のみ、`shop-店舗未確認` が0件、非ASCII hrefが0件」であった。

本番URL（`https://new-app-chi-rosy.vercel.app/stores`）を独立取得し、全63件のhrefを直接解析した結果:

| 条件 | 結果 |
|---|---|
| 総カード数 | 63件 |
| unique href数 | 63件 |
| duplicate href | **0件** ✅ |
| `shop-1tt48e8`（完全一致） | **1件**（ボードウォーク・スナック） ✅ |
| `shop-店舗未確認` | **0件** ✅ |
| 非ASCII href | **0件** ✅ |

**全条件を満たしている。**

---

## 2. 衝突グループ解消状況（独立確認）

監査ドキュメント（`docs/store-id-collision-audit-v1.md`）が把握した5グループすべてについて、本番hrefを直接確認した。

### `shop-1tt48e8`（元 ×8以上）

1件が元IDを保持し、残り7件が新ASCII IDを取得:

| 店舗名 | href |
|---|---|
| ボードウォーク・スナック | `/stores/shop-1tt48e8`（元ID保持） |
| ホッグズ・ヘッド | `/stores/shop-1tt48e8-restaurant-122iqw` |
| ワーフカフェ | `/stores/shop-1tt48e8-restaurant-15jvt6` |
| ディスカバリー・レストラン | `/stores/shop-1tt48e8-restaurant-pbb3pe` |
| シネマ 4-D 前フードカート | `/stores/shop-1tt48e8-4-d-restaurant-1j1kbo` |
| イーブル・イーツ | `/stores/shop-1tt48e8-cart-cp8u2j` |
| スヌーピー・バックロット・カフェ | `/stores/shop-1tt48e8-restaurant-90u3k9` |
| ハローキティのコーナーカフェ | `/stores/shop-1tt48e8-cart-1yi3mn` |

全IDが `^shop-[a-z0-9-]+$` の形式で、非ASCII文字なし ✅

### `shop-店舗未確認`（元 ×2）

0件（全件が新ASCII IDに置換）:

| 店舗名 | href |
|---|---|
| ロンバーズ・ランディング™ 前テラス | `/stores/shop-tm-unknown-1fbywg` |
| ロストワールド・レストラン | `/stores/shop-restaurant-7uhqb` |

### `shop-56paaa`（元 ×2）

1件が元IDを保持、1件が新IDを取得 ✅

| 店舗名 | href |
|---|---|
| フードカート（エリア確認中） | `/stores/shop-56paaa` |
| フードカート（ミニオン・パーク） | `/stores/shop-56paaa-cart-mzlcqy` |

### `shop-10vzio0`（元 ×2）

1件が元IDを保持、他店舗は別IDで解決済み ✅（`/stores/shop-10vzio0` = おさるのジョージ前カート）

### `shop-dvw6dt`（元 ×2）

1件が元IDを保持、1件が新IDを取得 ✅

| 店舗名 | href |
|---|---|
| デリシャス・ミー! ザ・クッキー・キッチン | `/stores/shop-dvw6dt` |
| デリシャス・ミー!ザ・クッキー・キッチン | `/stores/shop-1i0x5ad` |

---

## 3. 店舗詳細ページ整合性確認

Codex報告との照合:

| URL | H1 | 取扱フード | 一覧との整合 |
|---|---|---|---|
| `/stores/shop-1tt48e8` | ボードウォーク・スナック | 5件 | ✅ |
| `/stores/shop-1tt48e8-restaurant-122iqw` | ホッグズ・ヘッド | 1件 | ✅ |
| `/stores/shop-102yaa2` | アミティ・アイスクリーム | 3件 | ✅ |

旧URL `/stores/shop-1tt48e8` が「ボードウォーク・スナック」へ解決されている（修正前: アミティ・アイスクリームが表示されていた）。0品表示なし ✅

スクリーンショット（detail-1/2/3-390.png）との整合も確認済み。

---

## 4. 修正範囲の確認

`lib/store-utils.ts` のみ変更（+67/-15）。追加関数:

- `resolveStoreDisplayIds` — ソート済み配列への後処理として追加
- `createUniqueStoreDisplayId` — 新ASCII ID生成
- `isAsciiSafeStoreId` — ID判定正規表現
- `normalizeAsciiSlug` — NFKD正規化 + ASCII-only変換
- `shortStoreHash` — FNV-1a 6文字base36ハッシュ

**変更なし:**

| 対象 | 確認結果 |
|---|---|
| `scripts/output/foods.generated.json` | 変更なし ✅ |
| DB / crawler | 変更なし ✅ |
| 商品データ / 店舗データの削除 | なし ✅ |
| i18nキー / ロケールファイル | 変更なし ✅ |
| ホームv1.2（`app/page.tsx`等） | 影響なし ✅ |
| area-detail-v1.1 | 影響なし ✅ |
| `/foods`・`/eaten`・`/areas` | 影響なし ✅ |

`buildStoresFromFoods` のコア処理は変更なし。`resolveStoreDisplayIds` はソート後の後処理ステップとして追加されており、既存ロジックへの副作用は最小限。

---

## 5. 項目別評価

| 観点 | 評価 | 詳細 |
|---|---|---|
| duplicate href 0件 | ✅ | 独立確認: 63件中63件ユニーク |
| shop-1tt48e8 が1件のみ | ✅ | ボードウォーク・スナックが元IDを保持 |
| shop-店舗未確認 が0件 | ✅ | 2件とも新ASCII IDに置換 |
| 非ASCII href が0件 | ✅ | 全63件が `^/stores/shop-[a-z0-9-]+$` |
| 全5衝突グループ解消 | ✅ | 監査ドキュメント記載の全グループ解消確認 |
| 旧URL後方互換（shop-1tt48e8） | ✅ | ボードウォーク・スナックへ正しく解決 |
| 詳細ページ整合性 | ✅ | H1・フード件数・エリアが一覧と一致 |
| 0品表示 | ✅ | 確認3ページすべてで0品表示なし |
| 修正範囲の限定 | ✅ | store-utils.ts のみ。他ファイル変更なし |
| Codex自己報告との整合 | ✅ | 報告値と独立確認値が一致 |

---

## 6. 承認理由のまとめ

店舗ID衝突修正 v1.1（commit 8224683c）は、`docs/store-id-collision-audit-v1.md` が特定した全5衝突グループを解消し、本番環境で63件全店舗がユニークなASCII-safe URLを持つ状態を達成した。旧URLへの後方互換性も保たれており、修正範囲はdisplay層（store-utils.ts）のみに限定されている。本承認とする。
